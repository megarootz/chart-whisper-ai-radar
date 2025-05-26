import { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { initializeStorage } from '@/utils/storageUtils';
import { toast } from '@/components/ui/use-toast';

// Define the AuthContext type with resetPassword and sendOTP
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; 
  resetPassword: (email: string) => Promise<void>;
  sendOTP: (email: string, type: 'signup' | 'recovery') => Promise<void>;
  verifyOTP: (email: string, token: string, type: 'signup' | 'recovery', password?: string) => Promise<void>;
}

// Create the AuthContext with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
  sendOTP: async () => {},
  verifyOTP: async () => {},
});

// Create a custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// Create the AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to send OTP
  const sendOTP = async (email: string, type: 'signup' | 'recovery') => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('send-otp-email', {
        body: { email, type }
      });
      
      if (error) throw error;
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("Send OTP error", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to verify OTP
  const verifyOTP = async (email: string, token: string, type: 'signup' | 'recovery', password?: string) => {
    try {
      setLoading(true);
      
      if (type === 'signup' && password) {
        // For signup, verify OTP and create account
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup'
        });
        
        if (error) throw error;
        
        setSession(data.session);
        setUser(data.user);
      } else if (type === 'recovery') {
        // For recovery, verify OTP
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'recovery'
        });
        
        if (error) throw error;
        
        setSession(data.session);
        setUser(data.user);
      }
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("Verify OTP error", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to sign up
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
    } catch (error: any) {
      console.error("Signup error", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
    } catch (error: any) {
      console.error("Signin error", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
    } catch (error: any) {
      console.error("Signout error", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function for Google sign in
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      // Note: We don't set session or user here as it will be handled by the onAuthStateChange listener
    } catch (error: any) {
      console.error("Google sign in error", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function for password reset
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("Password reset error", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect to set up auth listener and check for existing session
  useEffect(() => {
    console.log("Setting up auth listener");
    let mounted = true;
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        if (!mounted) return;
        
        // Update auth state
        if (currentSession) {
          setUser(currentSession.user);
          setSession(currentSession);
          
          // Initialize storage with setTimeout to avoid Supabase auth deadlock
          if (currentSession.user) {
            setTimeout(() => {
              if (mounted) {
                initializeStorage(currentSession.user.id).catch(err => {
                  console.error('Error initializing storage:', err);
                  // Only show toast if component is still mounted
                  if (mounted) {
                    toast({
                      variant: "destructive",
                      title: "Storage Error",
                      description: "User authenticated but storage could not be initialized.",
                    });
                  }
                });
              }
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for initial session
    const initializeAuth = async () => {
      try {
        console.log("Checking initial auth session");
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          setUser(initialSession.user);
          setSession(initialSession);
          
          // Initialize storage with setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            if (mounted) {
              initializeStorage(initialSession.user.id).catch(err => {
                console.error('Error initializing storage:', err);
                // Only show toast if component is still mounted
                if (mounted) {
                  toast({
                    variant: "destructive",
                    title: "Storage Error",
                    description: "User authenticated but storage could not be initialized.",
                  });
                }
              });
            }
          }, 0);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log("Cleaning up auth listener");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Provide the auth context value with all functions
  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    resetPassword,
    sendOTP,
    verifyOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
