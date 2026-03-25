import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface UserMenuProps {
  user: any;
  freeRuns: number;
  membershipType?: string;
  onSignOut: () => void;
}

export default function UserMenu({ user, freeRuns, membershipType = 'Free', onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onSignOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isPremium = membershipType?.toLowerCase() === 'premium';

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="backdrop-blur-lg bg-white/10 rounded-full px-6 py-2 border border-white/20 hover:bg-white/15 transition-all cursor-pointer flex items-center space-x-3"
      >
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-600">
          <i className="ri-user-line text-white text-lg"></i>
        </div>
        <div className="text-left">
          <div className="text-white text-sm font-medium whitespace-nowrap">
            {user.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-gray-300 text-xs whitespace-nowrap">
            {isPremium ? (
              <span className="flex items-center space-x-1">
                <i className="ri-vip-crown-line text-yellow-400"></i>
                <span className="text-yellow-400 font-medium">Premium</span>
              </span>
            ) : (
              `${freeRuns} runs left`
            )}
          </div>
        </div>
        <i className={`ri-arrow-down-s-line text-white text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <p className="text-white font-medium mb-1">{user.email}</p>
            <div className="flex items-center space-x-2 text-sm">
              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                membershipType === 'Premium' 
                  ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-300 border border-yellow-400/30'
                  : 'bg-white/10 text-gray-300'
              }`}>
                {membershipType}
              </span>
              {membershipType !== 'Premium' && (
                <span className="text-gray-400">
                  {freeRuns} {freeRuns === 1 ? 'run' : 'runs'} left
                </span>
              )}
            </div>
          </div>

          <div className="p-2">
            <Link
              to="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap w-full"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-history-line text-lg text-violet-300"></i>
              </div>
              <span className="text-white font-medium">My History</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap w-full"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-logout-box-line text-lg text-red-400"></i>
              </div>
              <span className="text-white font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
