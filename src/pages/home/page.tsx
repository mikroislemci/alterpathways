import { useState, useEffect, useRef } from 'react';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ButterflyScore from './components/ButterflyScore';
import GhostMessage from './components/GhostMessage';
import ExportSection from './components/ExportSection';
import ShareModal from './components/ShareModal';
import Plans from './components/Plans';
import Disclaimer from './components/Disclaimer';
import AuthModal from '../../components/feature/AuthModal';
import UserMenu from '../../components/feature/UserMenu';
import PricingModal from '../../components/feature/PricingModal';
import SuccessToast from '../../components/feature/SuccessToast';
import { supabase } from '../../lib/supabase';

interface ButterflyScores {
  current_life: {
    wealth: number;
    emotional_peace: number;
    stress: number;
    social_impact: number;
  };
  alternative_path: {
    wealth: number;
    emotional_peace: number;
    stress: number;
    social_impact: number;
  };
}

interface GhostMessageData {
  paragraphs: string[];
  signature: string;
}

export default function Home() {
  const [simulation, setSimulation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [butterflyScores, setButterflyScores] = useState<ButterflyScores | null>(null);
  const [ghostMessage, setGhostMessage] = useState<GhostMessageData | null>(null);
  const [insight, setInsight] = useState<string>('');
  
  // Auth states
  const [user, setUser] = useState<any>(null);
  const [freeRuns, setFreeRuns] = useState(0);
  const [membershipType, setMembershipType] = useState('Free');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Toast notifications (error / warning)
  type ToastType = 'error' | 'warning';
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('error');
  const [showToast, setShowToast] = useState(false);

  // Share card modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // NEW: Payment sync state
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);

  // Prevent infinite loops with refs
  const isFetchingProfile = useRef(false);
  const hasInitialized = useRef(false);
  const hasHandledSuccess = useRef(false);

  // Helper: show typed toast
  const showError = (message: string, type: ToastType = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Fetch user profile function - WITH TIMEOUT to prevent infinite loading
  const fetchUserProfile = async (userId: string) => {
    // Prevent concurrent fetches
    if (isFetchingProfile.current) {
      console.log('⏸️ Profile fetch already in progress, skipping...');
      return;
    }

    isFetchingProfile.current = true;
    
    try {
      console.log('📊 Fetching profile for user:', userId);
      
      // Add 5-second timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('free_runs_left, membership_type')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('❌ Error fetching profile:', error);
        // Default to free tier instead of showing error
        console.log('⚠️ Defaulting to free tier (0 runs)');
        setFreeRuns(0);
        setMembershipType('Free');
        return;
      }

      if (data) {
        console.log('✅ Profile loaded:', data);
        setFreeRuns(data.free_runs_left ?? 0);
        setMembershipType(data.membership_type || 'Free');
      } else {
        // No profile row yet — show 3 as default
        console.log('⚠️ No profile data, showing default 3 runs');
        setFreeRuns(3);
        setMembershipType('Free');
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching profile:', error);
      // Default to free tier on any error (including timeout)
      setFreeRuns(0);
      setMembershipType('Free');
    } finally {
      isFetchingProfile.current = false;
    }
  };

  // Initialize auth state - RUNS ONLY ONCE
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (hasInitialized.current) {
      console.log('⏭️ Already initialized, skipping...');
      return;
    }
    hasInitialized.current = true;

    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔍 Checking initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) setIsCheckingAuth(false);
          return;
        }

        // Set isCheckingAuth(false) immediately after session check
        if (mounted) {
          if (session?.user) {
            console.log('✅ User found in session:', session.user.email);
            setUser(session.user);
            // Set loading to false immediately, don't wait for profile
            setIsCheckingAuth(false);
            // Call fetchUserProfile WITHOUT awaiting - don't block UI
            fetchUserProfile(session.user.id);
          } else {
            console.log('ℹ️ No user in session');
            setIsCheckingAuth(false);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes - ONLY ONCE
    console.log('👂 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email || 'No user');
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        // Set state immediately without awaiting profile fetch
        setUser(session.user);
        setIsCheckingAuth(false);
        setIsAuthModalOpen(false);
        // Call fetchUserProfile WITHOUT awaiting - don't block UI
        fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setFreeRuns(0);
        setMembershipType('Free');
        setButterflyScores(null);
        setGhostMessage(null);
        setInsight('');
        setIsCheckingAuth(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed for:', session.user.email);
        // Don't fetch profile on token refresh to avoid loops
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // EMPTY DEPENDENCY ARRAY - runs only once

  // NEW: Handle payment success redirect with DELAYS and RETRY LOGIC
  useEffect(async () => {
    if (hasHandledSuccess.current) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success') === 'true';

    // Pre-fill simulation input from history page navigation
    const simulateParam = urlParams.get('simulate');
    if (simulateParam) {
      setSimulation(decodeURIComponent(simulateParam));
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }

    if (isSuccess) {
      hasHandledSuccess.current = true;
      setShowSuccessToast(true);
      setIsSyncingPayment(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsSyncingPayment(false);
        return;
      }

      const channel = supabase
        .channel('payment-profile-sync')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${session.user.id}`
          },
          (payload) => {
            console.log('✅ Profile updated via Realtime:', payload.new);
            setFreeRuns(payload.new.free_runs_left || 0);
            setMembershipType(payload.new.membership_type || 'Free');
            setIsSyncingPayment(false);
            supabase.removeChannel(channel);
          }
        )
        .subscribe();

      setTimeout(() => {
        setIsSyncingPayment(false);
        supabase.removeChannel(channel);
      }, 30000);

      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }, 2000);
    }
  }, []); // Run only once on mount

  const handleSimulate = async () => {
    console.log('🎬 Simulate clicked - Input:', simulation);
    console.log('👤 Current user:', user?.email || 'Not logged in');
    console.log('🎟️ Free runs:', freeRuns);
    console.log('💎 Membership:', membershipType);

    if (!simulation.trim()) {
      console.log('⚠️ No simulation text entered');
      showError('Please enter a life decision to simulate', 'warning');
      return;
    }

    // Re-check session before simulating
    console.log('🔄 Refreshing session to get fresh token...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔍 Session check before simulate:', session?.user?.email || 'No session');
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    }
    
    if (!session?.user) {
      console.log('🔐 No session found, opening auth modal');
      setIsAuthModalOpen(true);
      return;
    }

    // Update user state if needed
    if (!user) {
      console.log('🔄 Updating user state from session');
      setUser(session.user);
      await fetchUserProfile(session.user.id);
    }

    // Check if user has access (Premium or has free runs)
    const isPremium = membershipType?.toLowerCase() === 'premium';
    console.log('💎 Is premium:', isPremium);
    
    if (!isPremium && freeRuns <= 0) {
      console.log('💰 No runs left, opening pricing modal');
      setIsPricingModalOpen(true);
      return;
    }

    console.log('🚀 Starting simulation...');
    setIsLoading(true);

    try {
      // Call the Edge Function with proper authorization using fetch()
      console.log('📡 Calling Edge Function with user_id:', session.user.id);
      console.log('🔑 Using access token:', session.access_token.substring(0, 20) + '...');
      console.log('🔑 Using anon key:', import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...');
      
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/simulate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            simulation_text: simulation,
            user_id: session.user.id
          })
        }
      );

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📊 Simulation response:', data);

      if (data.success) {
        setButterflyScores(data.butterfly_scores);
        setGhostMessage(data.ghost_message);
        setInsight(data.insight);

        // Deduct credit locally for immediate UI feedback
        if (!isPremium) {
          setFreeRuns(prev => Math.max(0, prev - 1));
        }

        // Refresh user profile to get updated free_runs_left
        await fetchUserProfile(session.user.id);

        // Smooth scroll to results
        setTimeout(() => {
          const butterflySection = document.getElementById('butterfly-score');
          if (butterflySection) {
            butterflySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      } else {
        console.error('❌ Simulation failed:', data);
        showError(data.message || data.error || 'Simulation failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ Simulation error:', error);
      showError('Failed to run simulation. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate again — clears results and scrolls back to input
  const handleSimulateAgain = () => {
    setButterflyScores(null);
    setGhostMessage(null);
    setInsight('');
    setSimulation('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async () => {
    console.log('✅ Auth success callback triggered');
    // The onAuthStateChange listener will handle profile fetching
    // No need to manually fetch here
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    console.log('👋 Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setFreeRuns(0);
    setMembershipType('Free');
    setButterflyScores(null);
    setGhostMessage(null);
    setInsight('');
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setIsSyncingPayment(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
    
    setIsSyncingPayment(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F1E] via-[#1A1A2E] to-[#16213E]">
      {/* Success Toast */}
      <SuccessToast
        message="Your account has been upgraded! Your journey continues."
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />

      {/* Typed Toast (error / warning) */}
      {showToast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 backdrop-blur-lg border px-6 py-3 rounded-xl flex items-center gap-3 max-w-md w-full transition-all ${
            toastType === 'warning'
              ? 'bg-yellow-900/90 border-yellow-500/40 text-yellow-100'
              : 'bg-red-900/90 border-red-500/40 text-red-100'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <i
              className={`text-lg ${
                toastType === 'warning'
                  ? 'ri-alert-line text-yellow-400'
                  : 'ri-error-warning-line text-red-400'
              }`}
            ></i>
          </div>
          <span className="text-sm flex-1">{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className={`ml-2 text-lg leading-none cursor-pointer whitespace-nowrap ${
              toastType === 'warning'
                ? 'text-yellow-300 hover:text-yellow-100'
                : 'text-red-300 hover:text-red-100'
            }`}
          >
            ×
          </button>
        </div>
      )}

      {/* User Menu - Top Right */}
      <div className="fixed top-8 right-8 z-40">
        {isCheckingAuth ? (
          <div className="backdrop-blur-lg bg-white/10 rounded-full px-6 py-2 border border-white/20 flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="text-white text-sm">Loading...</span>
          </div>
        ) : isSyncingPayment ? (
          <div className="backdrop-blur-lg bg-emerald-500/20 rounded-full px-6 py-2 border border-emerald-400/40 flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin"></div>
            <span className="text-emerald-300 text-sm font-medium">Syncing your new credits...</span>
          </div>
        ) : user ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualRefresh}
              className="backdrop-blur-lg bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:bg-white/10 transition-all cursor-pointer text-white/70 text-xs font-medium whitespace-nowrap flex items-center space-x-2"
              title="Refresh Credits"
            >
              <i className="ri-refresh-line"></i>
              <span>Refresh</span>
            </button>
            <UserMenu 
              user={user} 
              freeRuns={freeRuns} 
              membershipType={membershipType}
              onSignOut={handleSignOut} 
            />
          </div>
        ) : (
          <button
            onClick={() => {
              console.log('🔐 Sign in button clicked');
              setIsAuthModalOpen(true);
            }}
            className="backdrop-blur-lg bg-white/10 rounded-full px-6 py-2 border border-white/20 hover:bg-white/15 transition-all cursor-pointer text-white text-sm font-medium whitespace-nowrap"
          >
            Sign In
          </button>
        )}
      </div>

      <Hero 
        simulation={simulation} 
        setSimulation={setSimulation}
        onSimulate={handleSimulate}
        isLoading={isLoading}
      />
      <HowItWorks />

      {/* Capturable results wrapper */}
      <div id="simulation-results">
        <ButterflyScore 
          scores={butterflyScores}
          insight={insight}
          onSimulateAgain={handleSimulateAgain}
        />
        <GhostMessage message={ghostMessage} onSimulateAgain={handleSimulateAgain} />
      </div>

      <ExportSection
        hasResults={!!butterflyScores}
        simulationText={simulation}
        onShareCard={() => setIsShareModalOpen(true)}
      />

      <Plans onUpgradeClick={() => setIsPricingModalOpen(true)} />
      <Disclaimer />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Share Card Modal */}
      {butterflyScores && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          simulationText={simulation}
          scores={butterflyScores}
          insight={insight}
          signature={ghostMessage?.signature ?? '— The You That Could Have Been'}
        />
      )}
    </div>
  );
}
