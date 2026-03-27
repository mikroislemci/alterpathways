import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface PlansProps {
  onUpgradeClick: () => void;
}

export default function Plans({ onUpgradeClick }: PlansProps) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        console.log('🔑 User ID loaded in Plans:', session.user.id);
      }
    });
  }, []);

  const plans = [
    {
      name: 'Free Trial',
      price: '$0',
      period: 'one time',
      features: [
        '3 free simulations',
        'Basic butterfly score',
        'Ghost message preview',
        '24-hour access'
      ],
      cta: 'Start Free',
      highlighted: false,
      checkoutUrl: null
    },
    {
      name: '10 Simulation Pack',
      price: '$9.99',
      period: 'one-time',
      features: [
        '10 complete simulations',
        'Full butterfly scores',
        'Ghost messages',
        'Shareable results',
        'PDF export'
      ],
      cta: 'Get 10 Simulations',
      highlighted: true,
      checkoutUrl: 'https://alterpathways.lemonsqueezy.com/checkout/buy/5d5094b6-8f71-410a-a4bb-5d180421e3bb'
    },
    {
      name: 'Unlimited',
      price: '$14.99',
      period: 'per month',
      features: [
        'Unlimited simulations',
        'Priority AI processing',
        'Advanced analytics',
        'All export formats',
        'Early access to features'
      ],
      cta: 'Go Unlimited',
      highlighted: false,
      checkoutUrl: 'https://alterpathways.lemonsqueezy.com/checkout/buy/b5736c93-65b9-4fac-a43f-cf3fbe7bae35'
    }
  ];

  const handlePurchaseClick = (checkoutUrl: string | null, planName: string) => {
    if (!checkoutUrl) {
      // Free trial - no purchase needed
      return;
    }

    if (!userId) {
      alert('Please sign in first to make a purchase');
      onUpgradeClick(); // Open auth modal
      return;
    }

    // Build checkout URL with user_id
    const params = new URLSearchParams();
    params.append('checkout[custom][user_id]', userId);
    
    const finalUrl = `${checkoutUrl}?${params.toString()}`;
    
    console.log('🛒 Opening checkout for:', planName);
    console.log('👤 User ID:', userId);
    console.log('🔗 Checkout URL:', finalUrl);
    
    window.open(finalUrl, '_blank');
  };

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            Unlock Full <span className="text-violet-300">Simulation</span>
          </h2>
          <p className="text-gray-400 text-sm">Choose your path to discovery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative backdrop-blur-xl rounded-3xl p-6 sm:p-8 border transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-white/10 border-violet-400/50 shadow-2xl shadow-violet-500/20 md:scale-105'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-block bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-medium text-white mb-3">{plan.name}</h3>
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-4xl font-light text-white">{plan.price}</span>
                  <span className="text-sm text-gray-400">/ {plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ri-check-line text-lg text-violet-300"></i>
                    </div>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handlePurchaseClick(plan.checkoutUrl, plan.name)}
                className={`w-full py-3 rounded-2xl font-medium transition-all duration-300 whitespace-nowrap ${
                  index === 0
                    ? 'bg-white/5 text-gray-400 border border-white/10 cursor-not-allowed'
                    : plan.highlighted
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg hover:shadow-violet-500/50 cursor-pointer'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/20 cursor-pointer'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500">
            All plans include secure payment processing and instant access
          </p>
        </div>
      </div>
    </section>
  );
}
