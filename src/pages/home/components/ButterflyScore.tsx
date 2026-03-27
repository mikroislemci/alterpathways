import { useEffect, useState } from 'react';

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

interface ButterflyScoreProps {
  scores: ButterflyScores | null;
  insight: string;
  onSimulateAgain?: () => void;
}

interface Metric {
  label: string;
  current: number;
  alternate: number;
  color: string;
  /** true = higher value means worse (e.g. Stress) */
  isInverted: boolean;
}

export default function ButterflyScore({ scores, insight, onSimulateAgain }: ButterflyScoreProps) {
  const [animatedScores, setAnimatedScores] = useState<ButterflyScores | null>(null);
  const [impactScore, setImpactScore] = useState(0);

  useEffect(() => {
    if (scores) {
      setTimeout(() => setAnimatedScores(scores), 100);

      const wealthDiff = Math.abs(scores.alternative_path.wealth - scores.current_life.wealth);
      const peaceDiff = Math.abs(scores.alternative_path.emotional_peace - scores.current_life.emotional_peace);
      const stressDiff = Math.abs(scores.alternative_path.stress - scores.current_life.stress);
      const socialDiff = Math.abs(scores.alternative_path.social_impact - scores.current_life.social_impact);
      const impact = Math.round((wealthDiff + peaceDiff + stressDiff + socialDiff) / 4);
      setTimeout(() => setImpactScore(impact), 300);
    }
  }, [scores]);

  const metrics: Metric[] = animatedScores
    ? [
        {
          label: 'Wealth',
          current: animatedScores.current_life.wealth,
          alternate: animatedScores.alternative_path.wealth,
          color: 'from-emerald-500 to-teal-500',
          isInverted: false,
        },
        {
          label: 'Emotional Peace',
          current: animatedScores.current_life.emotional_peace,
          alternate: animatedScores.alternative_path.emotional_peace,
          color: 'from-blue-500 to-cyan-500',
          isInverted: false,
        },
        {
          label: 'Stress',
          current: animatedScores.current_life.stress,
          alternate: animatedScores.alternative_path.stress,
          color: 'from-orange-500 to-red-500',
          isInverted: true,
        },
        {
          label: 'Social Impact',
          current: animatedScores.current_life.social_impact,
          alternate: animatedScores.alternative_path.social_impact,
          color: 'from-purple-500 to-pink-500',
          isInverted: false,
        },
      ]
    : [
        { label: 'Wealth', current: 65, alternate: 85, color: 'from-emerald-500 to-teal-500', isInverted: false },
        { label: 'Emotional Peace', current: 80, alternate: 55, color: 'from-blue-500 to-cyan-500', isInverted: false },
        { label: 'Stress', current: 70, alternate: 85, color: 'from-orange-500 to-red-500', isInverted: true },
        { label: 'Social Impact', current: 45, alternate: 75, color: 'from-purple-500 to-pink-500', isInverted: false },
      ];

  const displayImpactScore = animatedScores ? impactScore : 78;
  const displayInsight = insight || 'More wealth, less peace.';

  const getDeltaBadge = (metric: Metric) => {
    const raw = metric.alternate - metric.current;
    const absDelta = Math.abs(raw);

    if (absDelta === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 whitespace-nowrap">
          <i className="ri-arrow-right-line"></i>
          No change
        </span>
      );
    }

    const isImproved = metric.isInverted ? raw < 0 : raw > 0;

    return isImproved ? (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25 whitespace-nowrap">
        <i className="ri-arrow-up-line text-xs"></i>
        +{absDelta} Improved
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs text-red-300 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/25 whitespace-nowrap">
        <i className="ri-arrow-down-line text-xs"></i>
        -{absDelta} Declined
      </span>
    );
  };

  return (
    <section id="butterfly-score" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-4">
            Butterfly <span className="text-violet-300">Effect Score</span>
          </h2>
          <p className="text-gray-400 text-sm">How one decision ripples through your entire life</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Radar Chart Visual */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 sm:p-10 border border-white/10">
            <div className="relative w-full aspect-square max-w-xs sm:max-w-md mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-400/30 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-3xl font-light text-white">{displayImpactScore}</div>
                    <div className="text-xs text-violet-300">Impact Score</div>
                  </div>
                </div>
              </div>

              {[1, 2, 3, 4].map((ring) => (
                <div
                  key={ring}
                  className="absolute inset-0 rounded-full border border-white/5"
                  style={{ margin: `${ring * 15}%` }}
                ></div>
              ))}

              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5"></div>
                <div className="absolute inset-0 border-l border-t border-white/5 rotate-45 origin-center"></div>
                <div className="absolute inset-0 border-r border-t border-white/5 -rotate-45 origin-center"></div>
              </div>

              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50"></div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50"></div>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50"></div>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50"></div>
            </div>
          </div>

          {/* Metrics Comparison */}
          <div className="space-y-7">
            {metrics.map((metric, index) => (
              <div key={index}>
                {/* Label row + comparison badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">{metric.label}</span>
                  {getDeltaBadge(metric)}
                </div>

                {/* Bars with inline labels */}
                <div className="space-y-2">
                  {/* Current */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-14 shrink-0">Current</span>
                    <div className="flex-1 relative h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-500 to-gray-400 rounded-full transition-all duration-1000"
                        style={{ width: animatedScores ? `${metric.current}%` : '0%' }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right shrink-0">{metric.current}</span>
                  </div>

                  {/* Alternate */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-14 shrink-0">Alternate</span>
                    <div className="flex-1 relative h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${metric.color} rounded-full transition-all duration-1000`}
                        style={{ width: animatedScores ? `${metric.alternate}%` : '0%' }}
                      ></div>
                    </div>
                    <span className="text-xs text-violet-300 w-6 text-right shrink-0">{metric.alternate}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Insight */}
            <div className="mt-8 backdrop-blur-lg bg-violet-500/10 rounded-2xl p-6 border border-violet-400/20">
              <p className="text-violet-200 text-sm italic leading-relaxed">
                &quot;{displayInsight}&quot;
              </p>
            </div>

            {/* Simulate Again */}
            {scores && onSimulateAgain && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={onSimulateAgain}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-violet-400/40 text-white/80 hover:text-white px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-refresh-line text-violet-300 text-base"></i>
                  </div>
                  <span className="text-sm font-medium">Simulate a New Decision</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
