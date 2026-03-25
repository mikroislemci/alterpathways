import { forwardRef } from 'react';

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

export interface ShareCardProps {
  simulationText: string;
  scores: ButterflyScores;
  insight: string;
  signature: string;
}

interface MetricRow {
  label: string;
  current: number;
  alt: number;
  isInverted: boolean;
  accent: string;
}

const calcImpact = (s: ButterflyScores): number => {
  const d = [
    Math.abs(s.alternative_path.wealth - s.current_life.wealth),
    Math.abs(s.alternative_path.emotional_peace - s.current_life.emotional_peace),
    Math.abs(s.alternative_path.stress - s.current_life.stress),
    Math.abs(s.alternative_path.social_impact - s.current_life.social_impact),
  ];
  return Math.round(d.reduce((a, b) => a + b, 0) / d.length);
};

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ simulationText, scores, insight, signature }, ref) => {
    const impactScore = calcImpact(scores);

    const metrics: MetricRow[] = [
      { label: 'Wealth', current: scores.current_life.wealth, alt: scores.alternative_path.wealth, isInverted: false, accent: '#34d399' },
      { label: 'Emotional Peace', current: scores.current_life.emotional_peace, alt: scores.alternative_path.emotional_peace, isInverted: false, accent: '#60a5fa' },
      { label: 'Stress', current: scores.current_life.stress, alt: scores.alternative_path.stress, isInverted: true, accent: '#f87171' },
      { label: 'Social Impact', current: scores.current_life.social_impact, alt: scores.alternative_path.social_impact, isInverted: false, accent: '#c084fc' },
    ];

    const getDelta = (m: MetricRow) => {
      const raw = m.alt - m.current;
      const abs = Math.abs(raw);
      const improved = m.isInverted ? raw < 0 : raw > 0;
      return { raw, abs, improved };
    };

    return (
      <div
        ref={ref}
        style={{
          width: 600,
          background: 'linear-gradient(145deg, #06060F 0%, #180A2A 45%, #0A0D1C 100%)',
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40, width: 160, height: 160,
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
            <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              PATHWAYS
            </span>
          </div>
          <div style={{
            background: 'rgba(139,92,246,0.18)',
            border: '1px solid rgba(139,92,246,0.35)',
            borderRadius: 20, padding: '4px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: 'rgba(196,181,253,0.6)', fontSize: 10 }}>Impact Score</span>
            <span style={{ color: '#c4b5fd', fontSize: 14, fontWeight: 700 }}>{impactScore}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 22 }} />

        {/* Simulation text */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        }}>
          <div style={{ color: 'rgba(167,139,250,0.5)', fontSize: 9, letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>
            SIMULATION
          </div>
          <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
            &ldquo;{simulationText}&rdquo;
          </div>
        </div>

        {/* Metrics — 2 × 2 grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 8, marginBottom: 22,
        }}>
          {metrics.map((m) => {
            const { abs, improved } = getDelta(m);
            const deltaColor = abs === 0 ? 'rgba(255,255,255,0.3)' : improved ? '#34d399' : '#f87171';
            const arrow = abs === 0 ? '→' : improved ? '↑' : '↓';
            const sign = abs === 0 ? '' : improved ? '+' : '-';

            return (
              <div key={m.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, marginBottom: 6 }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: deltaColor, fontSize: 16, fontWeight: 700 }}>
                    {arrow} {sign}{abs}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, marginTop: 4 }}>
                  {m.current} → {m.alt}
                </div>
                {/* Mini bar */}
                <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.alt}%`, background: `linear-gradient(90deg, ${m.accent}80, ${m.accent})`, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight */}
        <div style={{
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.18)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 18,
        }}>
          <div style={{ color: '#c4b5fd', fontSize: 12, fontStyle: 'italic', lineHeight: 1.55 }}>
            &ldquo;{insight}&rdquo;
          </div>
        </div>

        {/* Signature */}
        <div style={{ color: 'rgba(196,181,253,0.55)', fontSize: 11, fontStyle: 'italic', marginBottom: 22 }}>
          {signature}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, letterSpacing: '0.05em' }}>pathways.app</span>
          <span style={{ color: 'rgba(255,255,255,0.16)', fontSize: 10 }}>Simulate your alternate reality</span>
        </div>
      </div>
    );
  },
);

ShareCard.displayName = 'ShareCard';
export default ShareCard;
