import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
// No longer using insertUserSchema from server
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Validation schemas
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["buyer", "seller"]).default("buyer"),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Auth flow state management
  const [authState, setAuthState] = useState<'email' | 'otp' | 'register'>('email');
  const [email, setEmail] = useState<string>('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        setLocation("/admin/dashboard");
      } else if (user.role === "seller") {
        setLocation("/seller/dashboard");
      } else if (user.role === "buyer") {
        setLocation("/buyer/dashboard");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      role: "buyer",
      name: "",
      phone: "",
      address: "",
    },
  });

  // Get auth mutations from useAuth hook
  const { requestOtpMutation, verifyOtpMutation, registerMutation } = useAuth();

  // Request OTP
  async function onEmailSubmit(values: EmailFormValues) {
    setEmail(values.email);
    
    // Use the requestOTPMutation from useAuth
    requestOtpMutation.mutate({ email: values.email }, {
      onSuccess: (data) => {
        // Move to OTP verification step
        setAuthState('otp');
        otpForm.setValue('email', values.email);
        
        toast({
          title: "OTP Sent",
          description: "Check your email for the OTP code",
          variant: "default",
        });
      }
    });
  }

  // Verify OTP
  async function onOtpSubmit(values: OtpFormValues) {
    // Use the verifyOtpMutation from useAuth
    verifyOtpMutation.mutate({ email: values.email, otp: values.otp }, {
      onSuccess: (data) => {
        // If user exists, they're now logged in
        if (!data.isNewUser) {
          toast({
            title: "Login Successful",
            description: "Welcome back!",
            variant: "default",
          });
          
          // Redirect will happen automatically via useEffect when user data loads
        } else {
          // User needs to complete registration
          setAuthState('register');
          registerForm.setValue('email', values.email);
          
          toast({
            title: "OTP Verified",
            description: "Please complete your registration",
            variant: "default",
          });
        }
      }
    });
  }

  // Complete registration
  async function onRegisterSubmit(values: RegisterFormValues) {
    // Use the registerMutation from useAuth
    registerMutation.mutate(values, {
      onSuccess: (data) => {
        toast({
          title: "Registration Successful",
          description: "Your account has been created",
          variant: "default",
        });
        // Redirect will happen automatically via useEffect when user data loads
      }
    });
  }

  return (
    <>
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            {/* OTP Auth Forms */}
            <Card className="shadow-md">
              {/* Email Form - Step 1 */}
              {authState === 'email' && (
                <>
                  <CardHeader>
                    <CardTitle>Login or Register</CardTitle>
                    <CardDescription>
                      Enter your email to continue to Flipkart
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...emailForm}>
                      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                        <FormField
                          control={emailForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter your email" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={requestOtpMutation.isPending}
                        >
                          {requestOtpMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending OTP...
                            </>
                          ) : (
                            "Get OTP"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </>
              )}
              
              {/* OTP Verification - Step 2 */}
              {authState === 'otp' && (
                <>
                  <CardHeader>
                    <CardTitle>Verify Your Email</CardTitle>
                    <CardDescription>
                      Enter the 6-digit OTP sent to {email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...otpForm}>
                      <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                        <FormField
                          control={otpForm.control}
                          name="otp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>OTP Code</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter 6-digit OTP" 
                                  maxLength={6}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={verifyOtpMutation.isPending}
                        >
                          {verifyOtpMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify OTP"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col items-center">
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => setAuthState('email')}
                      disabled={verifyOtpMutation.isPending}
                    >
                      Back to email
                    </Button>
                  </CardFooter>
                </>
              )}
              
              {/* Registration - Step 3 (only for new users) */}
              {authState === 'register' && (
                <>
                  <CardHeader>
                    <CardTitle>Complete Registration</CardTitle>
                    <CardDescription>
                      Please provide additional information to complete your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your full name" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your phone number" 
                                    {...field} 
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Register as</FormLabel>
                                <FormControl>
                                  <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...field}
                                  >
                                    <option value="buyer">Buyer</option>
                                    <option value="seller">Seller</option>
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your address" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            "Complete Registration"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col items-center">
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => setAuthState('email')}
                      disabled={registerMutation.isPending}
                    >
                      Start over
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>

            {/* Hero Section */}
            <div className="bg-primary rounded-lg shadow-md overflow-hidden hidden md:block">
              <div className="p-8 text-white">
                <h2 className="text-3xl font-bold mb-4">Welcome to Flipkart</h2>
                <p className="mb-6">India's largest online marketplace for all your shopping needs.</p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Wide Selection</h3>
                      <p className="text-sm text-white/80">Millions of products across electronics, fashion, home goods, and more.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path>
                        <path d="M16.5 9.4 7.55 4.24"></path>
                        <polyline points="3.29 7 12 12 20.71 7"></polyline>
                        <line x1="12" y1="22" x2="12" y2="12"></line>
                        <circle cx="18.5" cy="15.5" r="2.5"></circle>
                        <path d="M20.27 17.27 22 19"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Fast Delivery</h3>
                      <p className="text-sm text-white/80">Quick delivery options to get your products delivered at your doorstep.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Secure Shopping</h3>
                      <p className="text-sm text-white/80">Multiple payment options with secure checkout process.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 text-center bg-white/10 rounded-lg p-4">
                  <p className="text-sm font-medium">"Best online shopping experience. Great prices and excellent customer service!"</p>
                  <p className="text-xs mt-2">— Satisfied Flipkart Customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
