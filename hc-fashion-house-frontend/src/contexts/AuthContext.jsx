import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/supabase';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { session } = await auth.getSession();
        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    let subscription = null;
    try {
      const authListener = auth.onAuthStateChange((event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          toast.success('Welcome back!');
        } else if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully');
        } else if (event === 'PASSWORD_RECOVERY') {
          toast.info('Please enter your new password');
        }
      });
      subscription = authListener?.data?.subscription;
    } catch (error) {
      console.error('Auth listener error:', error);
      setLoading(false);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up with email/password
  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signUp(email, password, metadata);
      
      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast.success('Please check your email to confirm your account');
        return { success: true, needsConfirmation: true };
      }

      toast.success('Account created successfully!');
      return { success: true, data };
    } catch (error) {
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email/password
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await auth.signInWithGoogle();
      
      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      // OAuth redirects, so no immediate response
      return { success: true };
    } catch (error) {
      toast.error('Failed to sign in with Google');
      return { success: false, error };
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await auth.signOut();
      
      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      setUser(null);
      setSession(null);
      return { success: true };
    } catch (error) {
      toast.error('Failed to sign out');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await auth.resetPassword(email);
      
      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      toast.error('Failed to send reset email');
      return { success: false, error };
    }
  };

  // Send OTP to email (passwordless login)
  const sendOtp = async (email) => {
    try {
      const { data, error } = await auth.sendOtp(email);
      
      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Verification code sent to your email!');
      return { success: true, data };
    } catch (error) {
      toast.error('Failed to send verification code');
      return { success: false, error };
    }
  };

  // Verify OTP
  const verifyOtp = async (email, token) => {
    setLoading(true);
    try {
      const { data, error } = await auth.verifyOtp(email, token);
      
      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Verified successfully!');
      return { success: true, data };
    } catch (error) {
      toast.error('Verification failed');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    sendOtp,
    verifyOtp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
