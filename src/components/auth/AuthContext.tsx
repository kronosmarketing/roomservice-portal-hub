
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { auditSession } from '@/components/dashboard/orders/security/authValidation';
import { logSecurityEvent } from '@/components/dashboard/orders/security/securityLogging';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener with enhanced security
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (session?.user) {
          // Perform session integrity check for authenticated users
          try {
            const isValid = await auditSession();
            if (!isValid) {
              console.warn('Session integrity check failed');
              await logSecurityEvent('invalid_session_detected', 'auth', null);
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Session audit failed:', error);
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic session integrity check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const isValid = await auditSession();
        if (!isValid) {
          console.warn('Periodic session check failed - signing out');
          await signOut();
        }
      } catch (error) {
        console.error('Periodic session check error:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      await logSecurityEvent('signup_attempt', 'auth', null, { email });
      
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        await logSecurityEvent('signup_failed', 'auth', null, { email, error: error.message });
        throw error;
      }

      await logSecurityEvent('signup_success', 'auth', null, { email });
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await logSecurityEvent('signin_attempt', 'auth', null, { email });
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await logSecurityEvent('signin_failed', 'auth', null, { email, error: error.message });
        throw error;
      }

      await logSecurityEvent('signin_success', 'auth', null, { email });
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await logSecurityEvent('signout_attempt', 'auth', null);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      await logSecurityEvent('signout_success', 'auth', null);
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
