
"use client";

import { useState, useEffect } from 'react';

interface Advisory {
  id: string;
  type: 'maintenance' | 'weather' | 'closure' | 'info';
  title: string;
  message: string;
  location?: string;
  severity: 'low' | 'medium' | 'high';
  startDate: string;
  endDate?: string;
}

export default function AdvisorySection() {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visibleAdvisories, setVisibleAdvisories] = useState<Set<string>>(new Set());

  // Simulate real-time advisories
  useEffect(() => {
    const mockAdvisories: Advisory[] = [
      {
        id: '1',
        type: 'weather',
        title: 'Weather Update',
        message: 'Rainy weather expected throughout the week. Take necessary precautions!',
        location: 'All Areas',
        severity: 'high',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'maintenance',
        title: 'Renovation Alert',
        message: 'Renovation works are ongoing at the Barangay Sagubo. Some areas may be inaccessible.',
        location: 'Barangay Sagubo',
        severity: 'medium',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'maintenance',
        title: 'Trail Maintenance',
        message: 'Dangwa Cave trail maintenance ongoing. Use alternative routes!',
        location: 'Dangwa Cave',
        severity: 'medium',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    setAdvisories(mockAdvisories);

    // Animate 
    mockAdvisories.forEach((advisory, index) => {
      setTimeout(() => {
        setVisibleAdvisories(prev => new Set(prev).add(advisory.id));
      }, index * 300);
    });

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-200';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-200';
      case 'low':
        return 'bg-green-500/20 text-green-200';
      default:
        return 'bg-gray-500/20 text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return '🌤️';
      case 'maintenance':
        return '🔧';
      case 'closure':
        return '🚫';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-3">
        <span className="text-2xl">📢</span>
        Travel Advisories
      </h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {advisories.map((advisory, index) => (
          <div
            key={advisory.id}
            className={`
              bg-white/5 rounded-lg p-4 border border-white/10 
              hover:bg-white/10 transition-all duration-500
              transform
              ${visibleAdvisories.has(advisory.id) 
                ? 'translate-y-0 opacity-100 scale-100' 
                : 'translate-y-4 opacity-0 scale-95'
              }
              animate-float
              hover:animate-float-gentle
              relative overflow-hidden
            `}
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '6s',
              animationFillMode: 'both'
            }}
          >
            {/* Floating effect background elements */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse-slow"></div>
              <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-white/10 rounded-full animate-pulse-slower"></div>
            </div>

            <div className="relative z-10 flex items-start gap-3">
              <div className="text-2xl animate-bounce-slow">
                {getTypeIcon(advisory.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold text-sm">{advisory.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(advisory.severity)} animate-pulse`}>
                    {advisory.severity}
                  </span>
                </div>
                {advisory.location && (
                  <p className="text-xs font-medium mb-2 opacity-80 animate-slide-in">
                    📍 {advisory.location}
                  </p>
                )}
                <p className="text-white/70 text-sm leading-relaxed mb-2 animate-fade-in">
                  {advisory.message}
                </p>
                <div className="text-xs opacity-70 animate-slide-up">
                  <p>Started: {new Date(advisory.startDate).toLocaleDateString()}</p>
                  {advisory.endDate && (
                    <p>Until: {new Date(advisory.endDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Status Indicator */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live updates active</span>
          </div>
          <span className="text-white/50 text-xs">
            Last updated: {formatTime(currentTime)}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            box-shadow: 0 5px 15px 0px rgba(0,0,0,0.3);
          }
          50% {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 25px 0px rgba(0,0,0,0.4);
          }
        }
        @keyframes float-gentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
        }
        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.15;
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes slide-in {
          from {
            transform: translateX(-10px);
            opacity: 1;
          }
          to {
            transform: translateX(0);
            opacity: 2;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 1;
          }
          to {
            opacity: 2;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(10px);
            opacity: 1;
          }
          to {
            transform: translateY(0);
            opacity: 2;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-gentle {
          animation: float-gentle 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-pulse-slower {
          animation: pulse-slower 12s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}