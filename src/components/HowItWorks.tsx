import React from 'react';

const steps = [
  {
    id: 1,
    title: 'Create an Account',
    description: 'Sign up for a free account to start planning your trip to Kapangan.',
    icon: '👤',
  },
  {
    id: 2,
    title: 'Choose Your Destination',
    description: 'Browse and select from our list of beautiful tourist spots in Kapangan.',
    icon: '📍',
  },
  {
    id: 3,
    title: 'Book Your Visit',
    description: 'Select your preferred date and time for your visit.',
    icon: '📅',
  },
  {
    id: 4,
    title: 'Enjoy Your Trip',
    description: 'Experience the beauty and culture of Kapangan!',
    icon: '😊',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Planning your trip to Kapangan is quick and easy with these simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg opacity-0 group-hover:opacity-30 blur transition duration-300"></div>
              <div className="relative bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-3xl mb-4">
                  {step.icon}
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold flex items-center justify-center -mt-10 mb-2">
                  {step.id}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
