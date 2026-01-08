import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL hash (Supabase OAuth flow)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login', { 
            state: { error: 'Authentication failed. Please try again.' } 
          });
          return;
        }

        if (session) {
          // Successfully authenticated - check for saved return URL
          const returnTo = sessionStorage.getItem('authReturnTo') || '/';
          sessionStorage.removeItem('authReturnTo');
          console.log('OAuth success, redirecting to:', returnTo);
          navigate(returnTo, { replace: true });
        } else {
          // No session found
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { 
          state: { error: 'An unexpected error occurred.' } 
        });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7] dark:bg-[#0B0F19]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A24D] mx-auto mb-4" />
        <p className="text-[#6B7280] dark:text-[#CBD5E1]">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}
