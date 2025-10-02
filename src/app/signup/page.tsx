'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/auth';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    // Handle sign up logic here
    console.log('Sign up:', formData);
    alert('Sign up functionality will be implemented soon!');
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('Google sign-in button clicked');
      setIsLoading(true);
// (line removed – setError is not declared, so we drop the call)
      
      console.log('Calling signInWithGoogle...');
      const result = await signInWithGoogle();
      console.log('signInWithGoogle result:', result);
      
      if (result.success) {
        console.log('Google sign-in successful, redirecting...');
        router.push('/');
      } else {
        const errorMessage = result.error || 'Google sign-up failed. Please try again.';
        alert(errorMessage);
        console.error('Google sign-up error:', result.error);
        
        // Show alert for specific configuration errors
        if (errorMessage.includes('not enabled')) {
          alert('Configuration Error: Google sign-in is not enabled in your Firebase project. Please enable it in the Firebase Console and try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected error in handleGoogleSignIn:', error);
alert('Google sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-egg-white">
      {/* Hero Section */}
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
              Kapangan Wonder
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-green mb-4">Create your account</h2>
            <p className="text-lg text-primary-green/80">
              Or{' '}
              <Link href="/signin" className="font-medium text-primary-green hover:text-accent-green">
                sign in to your existing account
              </Link>
            </p>
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

      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold text-primary-green">
            Create your account
          </h2>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-egg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border-green">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-primary-green">
                  First name
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-border-green rounded-md placeholder-primary-green/60 focus:outline-none focus:ring-primary-green focus:border-primary-green"
                    placeholder="First name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-primary-green">
                  Last name
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-border-green rounded-md placeholder-primary-green/60 focus:outline-none focus:ring-primary-green focus:border-primary-green"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-green">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-border-green rounded-md placeholder-primary-green/60 focus:outline-none focus:ring-primary-green focus:border-primary-green"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary-green">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-border-green rounded-md placeholder-primary-green/60 focus:outline-none focus:ring-primary-green focus:border-primary-green"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-green">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-border-green rounded-md placeholder-primary-green/60 focus:outline-none focus:ring-primary-green focus:border-primary-green"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-green focus:ring-primary-green border-border-green rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-primary-green">
                I agree to the{' '}
                <a href="#" className="text-primary-green hover:text-accent-green">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-green hover:text-accent-green">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-egg-white bg-primary-green hover:bg-accent-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green"
              >
                Create account
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-green" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-egg-white text-primary-green/80">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="w-full inline-flex justify-center py-2 px-4 border border-border-green rounded-md shadow-sm bg-egg-white text-sm font-medium text-primary-green hover:bg-light-green">
                <span className="text-lg">📘</span>
                <span className="ml-2">Facebook</span>
              </button>

              <button 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-border-green rounded-md shadow-sm bg-egg-white text-sm font-medium text-primary-green hover:bg-light-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg">🔍</span>
                <span className="ml-2">{isLoading ? 'Signing up...' : 'Google'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
      {/* Footer */}
      <footer className="bg-primary-green text-egg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-light-green mb-4">Kapangan Wonder</h3>
              <p className="text-light-green/80">
                Discover the natural beauty and cultural richness of Kapangan, Benguet.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/tourist-spots" className="text-light-green/80 hover:text-egg-white">Tourist Spots</Link></li>
                <li><Link href="/eat-and-stay" className="text-light-green/80 hover:text-egg-white">Eat & Stay</Link></li>
                <li><Link href="/blogs" className="text-light-green/80 hover:text-egg-white">Blogs</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact Us</Link></li>
                <li><Link href="/signin" className="text-light-green/80 hover:text-egg-white">Sign In</Link></li>
                <li><Link href="/signup" className="text-light-green/80 hover:text-egg-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📘</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">🐦</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📷</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📺</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border-green mt-8 pt-8 text-center text-light-green/80">
            <p>&copy; 2024 Kapangan Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

