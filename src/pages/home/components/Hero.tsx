interface HeroProps {
  simulation: string;
  setSimulation: (value: string) => void;
  onSimulate: () => void;
  isLoading: boolean;
  freeRuns: number;
  membershipType: string;
  onUpgradeClick: () => void;
  isLoggedIn: boolean;
}

export default function Hero({
  simulation,
  setSimulation,
  onSimulate,
  isLoading,
  freeRuns,
  membershipType,
  onUpgradeClick,
  isLoggedIn,
}: HeroProps) {
  const isPremium = membershipType?.toLowerCase() === 'premium';
  const isExhausted = isLoggedIn && !isPremium && freeRuns <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Simulate button clicked!');
    onSimulate();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 z-10">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center z-20">
        {/* Logo/Icon */}
        <div className="mb-6 sm:mb-8 inline-block">
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center backdrop-blur-lg bg-white/5 rounded-full border border-white/10">
            <i className="ri-git-branch-line text-3xl sm:text-4xl text-violet-300"></i>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-light text-white mb-4 sm:mb-6 leading-tight">
          What if you had chosen
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300">
            differently?
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
          Simulate the life you didn't live. See how one decision could have changed everything.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-3xl mx-auto z-20">
          <form onSubmit={handleSubmit}>
            <div
              className={`relative backdrop-blur-xl rounded-2xl sm:rounded-full border p-2 transition-all duration-300 z-20 ${
                isExhausted
                  ? 'bg-white/3 border-white/5 opacity-50 pointer-events-none'
                  : 'bg-white/5 border-white/10 hover:border-violet-400/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Icon - hidden on mobile */}
                <div className="hidden sm:flex pl-4 items-center justify-center">
                  <i className="ri-search-line text-xl text-gray-400"></i>
                </div>

                {/* Input */}
                <input
                  type="text"
                  value={simulation}
                  onChange={(e) => setSimulation(e.target.value)}
                  placeholder="What if I had taken that job offer..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm sm:text-base py-3 px-4 sm:px-0 sm:pr-4"
                  disabled={isLoading || isExhausted}
                />

                {/* Simulate Button */}
                <button
                  type="submit"
                  disabled={isLoading || isExhausted}
                  onClick={handleSubmit}
                  className="backdrop-blur-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 rounded-xl sm:rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap z-30 cursor-pointer"
                  style={{ pointerEvents: isExhausted ? 'none' : 'auto' }}
                >
                  {isLoading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      <span>Simulating...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-play-circle-line text-xl"></i>
                      <span>Simulate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Runs Exhausted Banner */}
          {isExhausted && (
            <div className="mt-4 backdrop-blur-xl bg-gradient-to-r from-violet-900/40 to-purple-900/40 border border-violet-500/30 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-violet-500/20 border border-violet-400/30 flex-shrink-0">
                  <i className="ri-time-line text-violet-300 text-lg"></i>
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium leading-tight">
                    Your free simulation has been used
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Unlock more paths — get 3 simulations for just $5.99
                  </p>
                </div>
              </div>
              <button
                onClick={onUpgradeClick}
                className="flex-shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>

        {/* Example Prompts */}
        <div className={`mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3 px-2 transition-opacity duration-300 ${isExhausted ? 'opacity-30 pointer-events-none' : ''}`}>
          {[
            'What if I had studied abroad?',
            'What if I had started that business?',
            'What if I had stayed in my hometown?'
          ].map((prompt, index) => (
            <button
              key={index}
              onClick={() => setSimulation(prompt)}
              className="backdrop-blur-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full border border-white/10 hover:border-violet-400/30 transition-all duration-300 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Detailed Example Hint */}
        <div className={`mt-5 sm:mt-6 max-w-2xl mx-auto px-2 transition-opacity duration-300 ${isExhausted ? 'opacity-30 pointer-events-none' : ''}`}>
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="text-gray-500 font-medium">Example:</span>{' '}
            <button
              onClick={() => setSimulation("What if I had moved to Canada in 2020 instead of staying in Turkey? Compare my career, stress, and relationships.")}
              className="text-gray-500 italic hover:text-violet-400 transition-colors duration-200 cursor-pointer text-left"
            >
              &ldquo;What if I had moved to Canada in 2020 instead of staying in Turkey? Compare my career, stress, and relationships.&rdquo;
            </button>
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-14 sm:mt-20 animate-bounce">
          <i className="ri-arrow-down-line text-2xl text-gray-500"></i>
        </div>
      </div>
    </section>
  );
}
