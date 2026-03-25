import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        console.log('🔑 User info loaded in PricingModal:', {
          id: session.user.id,
          email: session.user.email
        });
      }
    });
  }, []);

  if (!isOpen) return null;

  const plans = [
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
      checkoutUrl: 'https://alterpathways.lemonsqueezy.com/checkout/buy/5d5094b6-8f71-410a-a4bb-5d180421e3bb',
      badge: null,
      highlighted: false
    },
    {
      name: 'Monthly Unlimited',
      price: '$14.99',
      period: 'per month',
      features: [
        'Unlimited simulations',
        'Priority AI processing',
        'Advanced analytics',
        'All export formats',
        'Early access to features'
      ],
      checkoutUrl: 'https://alterpathways.lemonsqueezy.com/checkout/buy/b5736c93-65b9-4fac-a43f-cf3fbe7bae35',
      badge: 'Most Popular',
      highlighted: true
    },
    {
      name: 'Annual Unlimited',
      price: '$99.99',
      period: 'per year',
      features: [
        'Everything in Monthly',
        'Save 44% annually',
        'Priority support',
        'Exclusive features',
        'Lifetime updates'
      ],
      checkoutUrl: 'https://alterpathways.lemonsqueezy.com/checkout/buy/b47ae62a-3c75-4a32-92c0-1ea6ca4c35bd',
      badge: 'Best Value',
      highlighted: false
    }
  ];

  const handleCheckout = (url: string, planName: string) => {
    if (!userId) {
      alert('Please log in to make a purchase');
      onClose(); // Close modal so user can see sign in button
      return;
    }

    // Build checkout URL with user_id as primary identifier
    const params = new URLSearchParams();
    params.append('checkout[custom][user_id]', userId);
    
    // Add email as backup identifier
    if (userEmail) {
      params.append('checkout[email]', userEmail);
    }
    
    const checkoutUrl = `${url}?${params.toString()}`;
    
    console.log('🛒 Opening checkout for:', planName);
    console.log('👤 User ID:', userId);
    console.log('📧 Email:', userEmail);
    console.log('🔗 Final URL:', checkoutUrl);
    
    window.open(checkoutUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#1A1A2E] to-[#16213E] rounded-3xl border border-white/10 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-12 pb-8 px-6">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-3">
            Unlock Your <span className="text-violet-300">Alternate Lives</span>
          </h2>
          <p className="text-gray-400 text-sm">Choose the plan that fits your journey</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-white/10 border-violet-400/50 shadow-2xl shadow-violet-500/20 scale-105'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-block bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium px-4 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
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
                onClick={() => handleCheckout(plan.checkoutUrl, plan.name)}
                className={`w-full py-3 rounded-2xl font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg hover:shadow-violet-500/50'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center pb-8 px-6">
          <p className="text-xs text-gray-500">
            Secure checkout powered by Lemon Squeezy • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}