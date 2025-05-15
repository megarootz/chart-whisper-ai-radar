
import { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { initializeStorage } from '@/utils/storageUtils';

// Define the AuthContext type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; // Add the missing method
}

// Create the AuthContext with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {}, // Add default implementation
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

  // Use useEffect to listen for auth state changes and set the user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        
        // Initialize storage if user is authenticated
        if (currentUser) {
          await initializeStorage(currentUser.id);
        }
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Initialize storage if user is authenticated
        if (currentUser) {
          await initializeStorage(currentUser.id);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Provide the auth context value
  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle, // Add the new method to the context
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
