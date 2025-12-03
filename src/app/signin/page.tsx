'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/auth';
import { ADMIN_EMAIL } from '@/lib/admin';
import { checkIsBarangayAdmin } from '@/lib/barangayAdmin';
import { checkIsPrivateSpotAdmin } from '@/lib/privateSpotAdmin';

interface CarouselItem {
  id: string;
  image: string;
  fileId?: string;
}

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirectTo, setRedirectTo] = useState('');
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [isCarouselLoading, setIsCarouselLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 20,
  } as EmblaOptionsType);

  // Load carousel items from Firestore
  const loadCarouselItems = useCallback(async () => {
    try {
      const docRef = doc(db, "carousel", "items");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().items) {
        setCarouselItems(docSnap.data().items);
      } else {
        // Fallback to default image if no carousel items found
        setCarouselItems([{ id: '1', image: '/images/default-bg.jpg' }]);
      }
    } catch (error) {
      console.error("Error loading carousel items:", error);
      setCarouselItems([{ id: '1', image: '/images/default-bg.jpg' }]);
    } finally {
      setIsCarouselLoading(false);
    }
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!emblaApi) return;

    const autoScroll = () => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    };

    const timer = setInterval(autoScroll, 5000);
    return () => {
      clearInterval(timer);
    };
  }, [emblaApi]);

  // Load carousel items on mount
  useEffect(() => {
    loadCarouselItems();
  }, [loadCarouselItems]);

  // Check for redirectTo parameter in URL
  useEffect(() => {
    const redirectParam = searchParams?.get('redirectTo');
    if (redirectParam) {
      setRedirectTo(redirectParam);
    }
  }, [searchParams]);

  // ✅ Automatically redirect logged-in users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if main admin
        if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          router.replace('/admin');
          return;
        }
        
        // Check if barangay admin
        const barangayAdminStatus = await checkIsBarangayAdmin(user);
        if (barangayAdminStatus && barangayAdminStatus.isBarangayAdmin) {
          router.replace('/barangay-admin');
          return;
        }
        
        // Check if private spot admin
        const privateSpotAdminStatus = await checkIsPrivateSpotAdmin(user);
        if (privateSpotAdminStatus && privateSpotAdminStatus.isPrivateSpotAdmin) {
          router.replace('/private-spot-admin');
          return;
        }
        
        // Regular user
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle Email/Password Sign In with error handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = userCredential.user;

      // Check if main admin
      if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        router.push('/admin');
        return;
      }
      
      // Check if barangay admin
      const barangayAdminStatus = await checkIsBarangayAdmin(user);
      if (barangayAdminStatus && barangayAdminStatus.isBarangayAdmin) {
        router.push('/barangay-admin');
        return;
      }
      
      // Check if private spot admin
      const privateSpotAdminStatus = await checkIsPrivateSpotAdmin(user);
      if (privateSpotAdminStatus && privateSpotAdminStatus.isPrivateSpotAdmin) {
        router.push('/private-spot-admin');
        return;
      }
      
      // Regular user - redirect based on where they came from
      const redirectPath = redirectTo || '/';
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Sign in error:', err);
      let message = 'An error occurred during sign in. Please try again.';

      switch (err.code) {
        case 'auth/invalid-email':
          message = 'The email address format is invalid.';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please wait a moment before trying again.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your internet connection.';
          break;
        default:
          message = 'Login failed. Please check your credentials and try again.';
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        const user = result.user;
        
        // Check if main admin
        if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          router.push('/admin');
          return;
        }
        
        // Check if barangay admin
        const barangayAdminStatus = await checkIsBarangayAdmin(user);
        if (barangayAdminStatus && barangayAdminStatus.isBarangayAdmin) {
          router.push('/barangay-admin');
          return;
        }
        
        // Check if private spot admin
        const privateSpotAdminStatus = await checkIsPrivateSpotAdmin(user);
        if (privateSpotAdminStatus && privateSpotAdminStatus.isPrivateSpotAdmin) {
          router.push('/private-spot-admin');
          return;
        }
        
        // Regular user - redirect based on where they came from
        const redirectPath = redirectTo || '/';
        router.push(redirectPath);
      } else {
        alert(result.error || 'Google sign-in failed.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('An error occurred during Google sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Carousel Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        <div className="embla overflow-hidden w-full h-full" ref={emblaRef}>
          {isCarouselLoading ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-green"></div>
            </div>
          ) : (
            <div className="flex h-full">
              {carouselItems.map((item, index) => (
                <div key={item.id || index} className="flex-[0_0_100%] min-w-0 relative">
                  <div className="relative w-full h-full">
                    <Image
                      src={item.image || "/images/default-bg.jpg"}
                      alt={`Carousel image ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300"
                      priority={index < 3}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="bg-black/30 backdrop-blur-sm pb-8">
      <div className="max-w-7xl mx-auto p-6 bg-black/60 backdrop-blur-sm rounded-b-xl border-t-0 border-white/10 shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white font-poppins">Welcome Back</h1>
          <p className="text-xl text-white/90 mt-4">Sign in to your Kapangan Wonders account</p>
        </div>
      </div>
    </div>

    {/* Form */}
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-black/30 backdrop-blur-sm py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border-2 border-white/30">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-3 py-2 bg-white/5 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 bg-white/5 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-white/5 text-green-500 focus:ring-green-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white/90">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-green-300 hover:text-green-200">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && <p className="text-red-200 text-center text-sm">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/70">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-white/20 rounded-lg bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-white/90">
                Don't have an account?{' '}
                <Link 
                  href={
                    redirectTo 
                      ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` 
                      : '/signup'
                  } 
                  className="font-medium text-green-300 hover:text-green-200 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
