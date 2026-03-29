import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 AuthModal - Auth event:', event, session?.user?.email || 'No user');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ AuthModal - User signed in, checking profile...');
        // Check if profile exists, if not create one
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            console.log('📝 AuthModal - Creating new profile with 1 free run...');
            // Profile doesn't exist, create it with 1 free run
            const { error: insertError } = await supabase.from('profiles').insert({
              id: session.user.id,
              email: session.user.email,
              free_runs_left: 1,
              membership_type: 'Free',
              created_at: new Date().toISOString()
            });

            if (insertError) {
              console.error('❌ Error creating profile:', insertError);
            } else {
              console.log('✅ AuthModal - Profile created successfully with 1 free run');
            }
          } else {
            console.log('ℹ️ AuthModal - Profile exists:', profile);
          }

          console.log('🎯 AuthModal - Calling onSuccess callback');
          onSuccess();
          console.log('🚪 AuthModal - Closing modal');
          onClose();
        } catch (error) {
          console.error('❌ Profile check error:', error);
          onSuccess();
          onClose();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, onSuccess, onClose]);

  const handleGoogleLogin = async () => {
    console.log('🔐 AuthModal - Google login initiated');
    setIsLoading(true);
    setError('');

    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      console.log('🔗 AuthModal - Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('❌ AuthModal - OAuth error:', error);
        throw error;
      }
      
      console.log('🚀 AuthModal - OAuth redirect initiated');
    } catch (err: any) {
      console.error('❌ Google login error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-2xl"></i>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="https://public.readdy.ai/ai/img_res/af147e0f-e20a-4ab2-80f4-4abec35068f7.png" 
            alt="Pathways Logo" 
            className="h-10 w-auto"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-light text-white text-center mb-2">
          Welcome to Pathways
        </h2>
        <p className="text-sm text-gray-400 text-center mb-8">
          Sign in to explore your alternate life paths
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-sm text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Free Runs Info */}
        <div className="mt-6 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
          <p className="text-xs text-violet-200 text-center">
            <i className="ri-gift-line mr-1"></i>
            Get 1 free simulation when you sign up
          </p>
        </div>

        {/* Terms */}
        <p className="mt-6 text-xs text-gray-500 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
