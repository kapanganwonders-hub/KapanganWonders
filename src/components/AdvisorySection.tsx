'use client';

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

  // Simulate real-time advisories (in a real app, this would come from an API)
  useEffect(() => {
    const mockAdvisories: Advisory[] = [
      {
        id: '1',
        type: 'weather',
        title: 'Weather Advisory',
        message: 'Heavy rainfall expected in the afternoon. Hiking trails may be slippery.',
        location: 'Mt. Dakiwagan',
        severity: 'medium',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'maintenance',
        title: 'Maintenance Notice',
        message: 'Dangwa Cave is temporarily closed for safety inspection and maintenance.',
        location: 'Dangwa Cave',
        severity: 'high',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'info',
        title: 'Peak Season Notice',
        message: 'Rice terraces viewing is at its best during sunrise. Arrive early for the best experience.',
        location: 'Obellan-Catampan Rice Terraces',
        severity: 'low',
        startDate: new Date().toISOString()
      }
    ];

    setAdvisories(mockAdvisories);

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return '🌧️';
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
    <section className="py-8 bg-gradient-custom-reverse border-b border-primary-green/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary-green mb-2 flex items-center justify-center gap-2">
            <span className="animate-pulse-slow">📢</span>
            Real-Time Advisories
            <span className="text-sm font-normal text-primary-green/60 ml-2">
              Last updated: {formatTime(currentTime)}
            </span>
          </h2>
          <p className="text-primary-green/70">
            Stay informed about current conditions and important updates for tourist spots
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {advisories.map((advisory) => (
            <div
              key={advisory.id}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(advisory.severity)} shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl animate-pulse-slow">
                  {getTypeIcon(advisory.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide">
                      {advisory.title}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                      {advisory.severity}
                    </span>
                  </div>
                  {advisory.location && (
                    <p className="text-xs font-medium mb-2 opacity-80">
                      📍 {advisory.location}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed mb-2">
                    {advisory.message}
                  </p>
                  <div className="text-xs opacity-70">
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
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-green/10 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-primary-green/80 font-medium">
              Live updates active
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

