import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Loader2 } from "lucide-react";

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

// Types for response data
type OtpResponse = {
  message: string;
  email: string;
  expiresIn: number;
};

type OtpVerifyResponse = {
  user?: User;
  isNewUser: boolean;
  email?: string;
  message: string;
};

type RegisterResponse = {
  user: User;
  message: string;
};

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Auth flow state management
  const [authState, setAuthState] = useState<'email' | 'otp' | 'register'>('email');
  const [email, setEmail] = useState<string>('');

  // Fetch current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
  });

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

  // Request OTP mutation
  const requestOtpMutation = useMutation<OtpResponse, Error, { email: string }>({
    mutationFn: async (data) => {
      const res = await apiRequest('POST', '/api/auth/request-otp', data);
      return res.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation<
    OtpVerifyResponse,
    Error,
    { email: string; otp: string }
  >({
    mutationFn: async (data) => {
      const res = await apiRequest('POST', '/api/auth/verify-otp', data);
      return res.json();
    },
    onSuccess: () => {
      // When OTP is verified, refresh the user query to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation<
    RegisterResponse,
    Error,
    RegisterFormValues
  >({
    mutationFn: async (data) => {
      const res = await apiRequest('POST', '/api/auth/register', data);
      return res.json();
    },
    onSuccess: () => {
      // When registration is successful, refresh the user query
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Request OTP for login or registration
  async function onEmailSubmit(values: EmailFormValues) {
    setEmail(values.email);
    
    requestOtpMutation.mutate({ email: values.email }, {
      onSuccess: (data) => {
        // Regular flow - move to OTP verification step
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
                              Processing...
                            </>
                          ) : (
                            "Continue with Email"
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
                    <div className="bg-white/20 p-2 rounded mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Huge Selection</h3>
                      <p className="text-white/80">Millions of products across categories.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Best Prices</h3>
                      <p className="text-white/80">Get the most competitive prices in India.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Fast Delivery</h3>
                      <p className="text-white/80">Quick delivery to your doorstep.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}