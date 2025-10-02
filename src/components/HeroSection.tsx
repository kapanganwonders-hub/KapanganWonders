import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-custom text-primary-green overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Mountains */}
        <div className="absolute top-10 left-10 animate-float">
          <svg width="80" height="60" viewBox="0 0 80 60" className="text-black/20">
            <path d="M0,60 L20,20 L40,40 L60,10 L80,30 L80,60 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-20 right-20 animate-drift">
          <svg width="100" height="70" viewBox="0 0 100 70" className="text-black/15">
            <path d="M0,70 L25,25 L50,45 L75,15 L100,35 L100,70 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-32 left-1/4 animate-float" style={{ animationDelay: '1s' }}>
          <svg width="60" height="50" viewBox="0 0 60 50" className="text-black/25">
            <path d="M0,50 L15,20 L30,35 L45,15 L60,25 L60,50 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Rivers */}
        <div className="absolute bottom-20 left-0 right-0 animate-wave">
          <svg width="100%" height="40" viewBox="0 0 1200 40" className="text-black/10">
            <path d="M0,20 Q300,5 600,20 T1200,20 L1200,40 L0,40 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-32 left-0 right-0 animate-wave" style={{ animationDelay: '1.5s' }}>
          <svg width="100%" height="30" viewBox="0 0 1200 30" className="text-black/15">
            <path d="M0,15 Q400,5 800,15 T1200,15 L1200,30 L0,30 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Rice Terraces */}
        <div className="absolute bottom-40 right-10 animate-pulse-slow">
          <svg width="120" height="80" viewBox="0 0 120 80" className="text-black/20">
            <path d="M0,80 L0,60 L30,60 L30,40 L60,40 L60,20 L90,20 L90,0 L120,0 L120,80 Z" fill="currentColor" />
            <path d="M0,80 L0,70 L20,70 L20,50 L40,50 L40,30 L60,30 L60,10 L80,10 L80,0 L100,0 L100,80 Z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>

        {/* Cave Entrance */}
        <div className="absolute top-40 right-1/3 animate-drift" style={{ animationDelay: '2s' }}>
          <svg width="60" height="40" viewBox="0 0 60 40" className="text-black/30">
            <ellipse cx="30" cy="20" rx="25" ry="15" fill="currentColor" />
            <ellipse cx="30" cy="20" rx="20" ry="10" fill="var(--gradient-end)" opacity="0.3" />
          </svg>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-green">
            Discover the Wonders of Kapangan
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-primary-green/80">
            Experience the natural beauty, rich culture, and warm hospitality of Kapangan. 
            Your gateway to unforgettable adventures in the heart of Benguet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tourist-spots"
              className="bg-primary-green text-egg-white hover:bg-accent-green px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200 border border-primary-green shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Explore Tourist Spots
            </Link>
            <Link
              href="/eat-and-stay"
              className="border-2 border-primary-green text-primary-green hover:bg-primary-green hover:text-egg-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Find Places to Stay
            </Link>
          </div>
        </div>
      </div>
      
        {/* Enhanced Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 text-black/20"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".3"
            fill="currentColor"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".4"
            fill="currentColor"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}
