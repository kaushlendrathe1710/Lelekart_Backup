import passport from "passport";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { 
  generateOTP, 
  saveOTP, 
  verifyOTP, 
  sendOTPEmail
} from "./helpers/email";
import { z } from "zod";
import { createAdminUser, isSpecialAdmin } from './adminUser';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Validation schemas
const requestOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  role: z.enum(["buyer", "seller", "admin"]).default("buyer"),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export function setupAuth(app: Express) {
  // Generate a secure secret for sessions
  const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  
  const sessionSettings: session.SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Create special admin user on startup
  createAdminUser().catch(err => {
    console.error("Failed to create special admin user:", err);
  });

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Step 1: Request OTP for login or registration
  app.post("/api/auth/request-otp", async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Received OTP request", req.body);
      
      // Validate request
      const validation = requestOtpSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Invalid email validation:", validation.error);
        return res.status(400).json({ error: "Invalid email address" });
      }

      const { email } = validation.data;
      console.log(`Processing OTP request for email: ${email}`);

      // Generate OTP
      const otp = await generateOTP();
      console.log(`Generated OTP for ${email}: ${otp}`);
      
      // Save OTP to database
      try {
        await saveOTP(email, otp);
        console.log(`OTP saved to database for ${email}`);
      } catch (dbError) {
        console.error("Failed to save OTP to database:", dbError);
        return res.status(500).json({ error: "Database error. Please try again later." });
      }
      
      // Send OTP to user's email
      try {
        await sendOTPEmail(email, otp);
        console.log(`OTP email sent successfully to ${email}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({ error: "Failed to send OTP email. Please check your email configuration." });
      }
      
      res.status(200).json({ 
        message: "OTP sent successfully", 
        email, 
        expiresIn: 10 * 60 // 10 minutes in seconds
      });
    } catch (error) {
      console.error("Unexpected error in /api/auth/request-otp:", error);
      next(error);
    }
  });

  // Step 2: Verify OTP
  app.post("/api/auth/verify-otp", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request
      const validation = verifyOtpSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { email, otp } = validation.data;
      
      // Verify OTP
      const isValid = await verifyOTP(email, otp);
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        // Login existing user
        req.login(existingUser, (err) => {
          if (err) return next(err);
          return res.status(200).json({ 
            user: existingUser,
            isNewUser: false,
            message: "Login successful" 
          });
        });
      } else {
        // User doesn't exist, ask for registration
        return res.status(200).json({
          isNewUser: true,
          email,
          message: "OTP verified. Please complete registration."
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // Step 3: Complete registration for new users after OTP verification
  app.post("/api/auth/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid registration data" });
      }

      const userData = validation.data;
      
      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user
      const newUser = await storage.createUser({
        ...userData,
        // Use a random password string since we're using OTP
        password: randomBytes(16).toString('hex'),
      });

      // Log in the new user
      req.login(newUser, (err) => {
        if (err) return next(err);
        res.status(201).json({
          user: newUser,
          message: "Registration successful"
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}