import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Use a ref to track navigation state
  const navigationPerformedRef = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, !!currentSession);
        
        // First update the session and user state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Then handle navigation based on events
        if (event === 'SIGNED_IN' && !navigationPerformedRef.current) {
          navigationPerformedRef.current = true;
          console.log("Sign in detected, will navigate soon");
          
          // Use setTimeout to defer navigation until after state updates
          setTimeout(() => {
            toast({
              title: "Success",
              description: "Signed in successfully"
            });
            // Navigate to analyze page with replace to avoid history buildup
            navigate('/analyze', { replace: true });
          }, 500); // Use longer delay to ensure state is settled
        } else if (event === 'SIGNED_OUT') {
          navigationPerformedRef.current = false;
          console.log("Sign out detected");
          
          // Defer navigation to avoid render-time updates
          setTimeout(() => {
            toast({
              title: "Info",
              description: "Signed out"
            });
            navigate('/auth', { replace: true });
          }, 500); // Use longer delay
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", !!currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Reset navigation flag when component unmounts
  useEffect(() => {
    return () => {
      navigationPerformedRef.current = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      // Remove immediate navigation, let onAuthStateChange handle it
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in with Google",
        description: error.message
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Signed up successfully! Please check your email for verification."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error.message
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signIn, signInWithGoogle, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
