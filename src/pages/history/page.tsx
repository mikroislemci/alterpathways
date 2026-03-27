import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import UserMenu from '../../components/feature/UserMenu';

interface Simulation {
  id: string;
  simulation_text: string;
  butterfly_scores: {
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
  };
  ghost_message: {
    paragraphs: string[];
    signature: string;
  };
  insight: string;
  created_at: string;
}

export default function History() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [freeRuns, setFreeRuns] = useState(0);
  const [membershipType, setMembershipType] = useState('Free');
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const mountedRef = useRef(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('free_runs_left, membership_type')
        .eq('id', userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (profile) {
        setFreeRuns(profile.free_runs_left ?? 0);
        setMembershipType(profile.membership_type || 'Free');
      } else {
        setFreeRuns(3);
        setMembershipType('Free');
      }
    } catch {
      if (mountedRef.current) {
        setFreeRuns(0);
        setMembershipType('Free');
      }
    }
  };

  const fetchSimulations = async (userId: string) => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('id, simulation_text, butterfly_scores, ghost_message, insight, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

      if (!error && data) {
        setSimulations(data);
        if (data.length > 0) setSelectedSimulation(data[0]);
      }
    } catch {
      // silently fail — empty state shown
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        if (session?.user) {
          setUser(session.user);
          setIsCheckingAuth(false);
          await fetchUserProfile(session.user.id);
          await fetchSimulations(session.user.id);
        } else {
          setIsCheckingAuth(false);
        }
      } catch {
        if (mountedRef.current) setIsCheckingAuth(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSimulations([]);
        setSelectedSimulation(null);
        setFreeRuns(0);
        setMembershipType('Free');
        setIsCheckingAuth(false);
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSimulateAgain = (simulationText: string) => {
    navigate(`/?simulate=${encodeURIComponent(simulationText)}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFreeRuns(0);
    setMembershipType('Free');
    setSimulations([]);
    setSelectedSimulation(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAverageScore = (scores: any) => {
    const values = Object.values(scores) as number[];
    return Math.round(values.reduce((a: number, b: unknown) => a + (b as number), 0) / values.length);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F0F1E] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-400/30 border-t-violet-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] via-[#16213E] to-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <i className="ri-lock-line text-6xl text-white/50"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-8">Please sign in to view your simulation history</p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:from-violet-600 hover:to-purple-700 transition-all cursor-pointer whitespace-nowrap"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] via-[#16213E] to-[#0F1419]">
      {/* User Menu */}
      <div className="fixed top-4 right-4 sm:top-8 sm:right-8 z-40">
        <UserMenu
          user={user}
          freeRuns={freeRuns}
          membershipType={membershipType}
          onSignOut={handleSignOut}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-violet-300 hover:text-violet-200 transition-colors cursor-pointer mb-6 sm:mb-8 whitespace-nowrap"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-arrow-left-line text-lg"></i>
          </div>
          <span>Back to Home</span>
        </Link>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">My Simulation History</h1>
        <p className="text-gray-400 text-sm sm:text-lg">Explore the paths you&apos;ve considered and the insights you&apos;ve gained</p>

        {simulations.length > 0 && (
          <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-xl">
            <div className="backdrop-blur-lg bg-white/5 rounded-xl px-3 sm:px-5 py-3 sm:py-4 border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-bold text-white">{simulations.length}</div>
              <div className="text-xs text-gray-400 mt-1">Simulations</div>
            </div>
            <div className="backdrop-blur-lg bg-white/5 rounded-xl px-3 sm:px-5 py-3 sm:py-4 border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-bold text-violet-300">
                {simulations.filter(s => s.butterfly_scores).length}
              </div>
              <div className="text-xs text-gray-400 mt-1">With Scores</div>
            </div>
            <div className="backdrop-blur-lg bg-white/5 rounded-xl px-3 sm:px-5 py-3 sm:py-4 border border-white/10 text-center">
              <div className="text-sm sm:text-base font-bold text-emerald-300">
                {formatDate(simulations[0].created_at).split(',')[0]}
              </div>
              <div className="text-xs text-gray-400 mt-1">Last Run</div>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : simulations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6 bg-white/5 rounded-full">
              <i className="ri-file-list-3-line text-5xl text-white/30"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Simulations Yet</h2>
            <p className="text-gray-400 mb-8">Start exploring alternate life paths to build your history</p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:from-violet-600 hover:to-purple-700 transition-all cursor-pointer whitespace-nowrap"
            >
              Create Your First Simulation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">All Simulations ({simulations.length})</h2>
              {simulations.map((sim, idx) => (
                <div
                  key={sim.id}
                  onClick={() => setSelectedSimulation(sim)}
                  className={`backdrop-blur-lg bg-white/5 rounded-2xl p-4 sm:p-6 border transition-all cursor-pointer hover:bg-white/10 ${
                    selectedSimulation?.id === sim.id
                      ? 'border-violet-400/50 bg-white/10'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {idx === 0 && (
                          <span className="text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">Latest</span>
                        )}
                        <p className="text-white font-medium line-clamp-2">{sim.simulation_text}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-calendar-line text-xs"></i>
                        </div>
                        <span>{formatDate(sim.created_at)}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center ml-4">
                      <i className="ri-arrow-right-s-line text-xl text-violet-300"></i>
                    </div>
                  </div>
                  {sim.butterfly_scores && (
                    <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-bar-chart-line text-xs text-violet-300"></i>
                        </div>
                        <span className="text-sm text-gray-400">
                          Current: {getAverageScore(sim.butterfly_scores.current_life)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-bar-chart-line text-xs text-purple-300"></i>
                        </div>
                        <span className="text-sm text-gray-400">
                          Alternative: {getAverageScore(sim.butterfly_scores.alternative_path)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-8 lg:self-start">
              {selectedSimulation ? (
                <div className="backdrop-blur-lg bg-white/5 rounded-2xl p-5 sm:p-8 border border-white/10">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-calendar-line text-xs"></i>
                        </div>
                        <span>{formatDate(selectedSimulation.created_at)}</span>
                      </div>
                      <button
                        onClick={() => handleSimulateAgain(selectedSimulation.simulation_text)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-100 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 hover:border-violet-400/50 px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap"
                      >
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-loop-left-line text-xs"></i>
                        </div>
                        Simulate Again
                      </button>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{selectedSimulation.simulation_text}</h3>
                    {selectedSimulation.insight && (
                      <p className="text-violet-200 italic">{selectedSimulation.insight}</p>
                    )}
                  </div>

                  {selectedSimulation.butterfly_scores && (
                    <div className="mb-8">
                      <h4 className="text-xl font-bold text-white mb-6">Butterfly Scores</h4>
                      <div className="space-y-6">
                        {Object.entries(selectedSimulation.butterfly_scores.current_life).map(([key, value]) => {
                          const altValue = selectedSimulation.butterfly_scores.alternative_path[key as keyof typeof selectedSimulation.butterfly_scores.alternative_path];
                          const label = key.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                          return (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">{label}</span>
                                <div className="flex items-center space-x-4">
                                  <span className="text-violet-300 text-sm">Current: {value}</span>
                                  <span className="text-purple-300 text-sm">Alternative: {altValue}</span>
                                </div>
                              </div>
                              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all"
                                  style={{ width: `${value}%` }}
                                ></div>
                                <div
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500/50 to-purple-600/50 rounded-full transition-all"
                                  style={{ width: `${altValue}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedSimulation.ghost_message && (
                    <div>
                      <h4 className="text-xl font-bold text-white mb-6">Message from Your Alternate Self</h4>
                      <div className="space-y-4">
                        {selectedSimulation.ghost_message.paragraphs.map((paragraph: string, index: number) => (
                          <p key={index} className="text-gray-300 leading-relaxed">{paragraph}</p>
                        ))}
                        <p className="text-violet-300 italic mt-6">{selectedSimulation.ghost_message.signature}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={() => handleSimulateAgain(selectedSimulation.simulation_text)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/50 hover:to-purple-600/50 border border-violet-500/30 hover:border-violet-400/60 text-white px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap"
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-refresh-line text-violet-300 text-base"></i>
                      </div>
                      <span className="text-sm font-medium">Re-simulate This Decision</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden lg:block backdrop-blur-lg bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
                  <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 bg-white/5 rounded-full">
                    <i className="ri-file-text-line text-4xl text-white/30"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Select a Simulation</h3>
                  <p className="text-gray-400">Click on any simulation from the list to view its details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
