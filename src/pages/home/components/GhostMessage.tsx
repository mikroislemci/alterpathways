import { useState } from 'react';

interface GhostMessageData {
  paragraphs: string[];
  signature: string;
}

interface GhostMessageProps {
  message: GhostMessageData | null;
  onSimulateAgain?: () => void;
}

export default function GhostMessage({ message, onSimulateAgain }: GhostMessageProps) {
  const [isSharing, setIsSharing] = useState(false);

  const defaultMessage = {
    paragraphs: [
      "Hey, it's me—or rather, the version of you who took that leap. I won't lie, it wasn't easy at first. There were nights I questioned everything. But standing here now, looking at what we built, I finally understand what peace feels like.",
      "I wish I could tell you it's all perfect, but that would be a lie. What I can tell you is this: I'm proud of us. And I hope, wherever you are, you feel the same."
    ],
    signature: "— The You That Could Have Been"
  };

  const displayMessage = message || defaultMessage;

  const handleShare = async () => {
    setIsSharing(true);
    
    const shareText = `${displayMessage.paragraphs.join('\n\n')}\n\n${displayMessage.signature}\n\nDiscover your alternate path at Pathways`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'A Message from My Alternate Self',
          text: shareText
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (err) {
        console.error('Failed to copy');
      }
    }
    
    setTimeout(() => setIsSharing(false), 2000);
  };

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            A message from your <span className="text-violet-300">alternate self</span>
          </h2>
          <p className="text-gray-400 text-sm">Personal. Emotional. Shareable.</p>
        </div>

        {/* Ghost Message Card */}
        <div className="relative backdrop-blur-xl bg-white/5 rounded-3xl p-10 md:p-12 border border-white/10 shadow-2xl">
          {/* Decorative Quote Icon */}
          <div className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center">
            <i className="ri-double-quotes-l text-4xl text-violet-300/20"></i>
          </div>

          {/* Message Content */}
          <div className="relative z-10 space-y-6">
            {displayMessage.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-gray-300 text-base md:text-lg leading-relaxed italic">
                {paragraph}
              </p>
            ))}
            <p className="text-violet-200 text-base md:text-lg leading-relaxed italic font-medium">
              {displayMessage.signature}
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-6 right-6 w-12 h-12 flex items-center justify-center">
            <i className="ri-double-quotes-r text-4xl text-violet-300/20"></i>
          </div>

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/5 to-purple-600/5 pointer-events-none"></div>
        </div>

        {/* Share + Simulate Again Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-2 backdrop-blur-lg bg-white/10 hover:bg-white/15 text-white px-8 py-3 rounded-full border border-white/20 transition-all duration-300 cursor-pointer whitespace-nowrap"
          >
            <i className={`${isSharing ? 'ri-check-line' : 'ri-share-line'} text-lg`}></i>
            <span className="text-sm font-medium">
              {isSharing ? 'Copied to Clipboard!' : 'Share Your Message'}
            </span>
          </button>

          {onSimulateAgain && (
            <button
              onClick={onSimulateAgain}
              className="inline-flex items-center space-x-2 backdrop-blur-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 hover:text-white px-8 py-3 rounded-full border border-violet-400/30 hover:border-violet-400/60 transition-all duration-300 cursor-pointer whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-loop-left-line text-lg"></i>
              </div>
              <span className="text-sm font-medium">Try Another Decision</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
