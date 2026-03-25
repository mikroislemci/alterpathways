export default function HowItWorks() {
  const steps = [
    {
      icon: 'ri-edit-line',
      title: 'Write your decision',
      description: 'Describe the choice you didn\'t make'
    },
    {
      icon: 'ri-play-circle-line',
      title: 'Run the simulation',
      description: 'AI creates your alternate timeline'
    },
    {
      icon: 'ri-git-compare-line',
      title: 'Compare your life paths',
      description: 'See how different your life could be'
    }
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light text-white text-center mb-16">
          How it <span className="text-violet-300">Works</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Icon Container */}
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 flex items-center justify-center backdrop-blur-lg bg-white/5 rounded-full border border-white/10">
                  <i className={`${step.icon} text-4xl text-violet-300`}></i>
                </div>
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-violet-500 rounded-full text-white text-sm font-medium">
                  {index + 1}
                </div>
              </div>

              {/* Text */}
              <h3 className="text-lg font-medium text-white mb-3">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Connecting Line */}
        <div className="hidden md:block relative -mt-48 mb-32">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
