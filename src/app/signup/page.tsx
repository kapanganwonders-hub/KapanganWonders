'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, setDoc } from 'firebase/firestore';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { signInWithGoogle, fetchGoogleProfile } from '@/lib/auth';
import { PasswordStrengthIndicator, type StrengthLevel } from "@/components/lightswind/password-strength-indicator"
import { Eye, EyeOff } from 'lucide-react';

const ADMIN_EMAIL = 'kapanganwonders@gmail.com';
const DEFAULT_AVATAR = '/assets/default-avatar.png'; // ✅ Add your default image here

export default function SignUp() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Add state for password visibility and strength
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<StrengthLevel>('empty');
  const [redirectTo, setRedirectTo] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedGoogleEmail, setVerifiedGoogleEmail] = useState<string | null>(null);
  
  // Carousel state
  const [carouselItems, setCarouselItems] = useState<Array<{id: string; image: string; fileId?: string}>>([]);
  const [isCarouselLoading, setIsCarouselLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 20, // Slower scroll duration for better visibility
  });

  // Auto-scroll functionality for carousel
  useEffect(() => {
    if (!emblaApi || isCarouselLoading) return;
    
    const autoScroll = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(autoScroll);
  }, [emblaApi, isCarouselLoading]);

  // Load carousel items
  const loadCarouselItems = useCallback(async () => {
    try {
      setIsCarouselLoading(true);
      const carouselRef = collection(db, 'carousel');
      const carouselDoc = await getDoc(doc(carouselRef, 'items'));
      
      if (carouselDoc.exists() && carouselDoc.data().items) {
        const items = carouselDoc.data().items;
        setCarouselItems(items);
      } else {
        // Set default items if none found
        setCarouselItems([{
          id: 'default',
          image: '/images/default-bg.jpg'
        }]);
      }
    } catch (error) {
      console.error('Error loading carousel items:', error);
      // Set default items on error
      setCarouselItems([{
        id: 'default',
        image: '/images/default-bg.jpg'
      }]);
    } finally {
      setIsCarouselLoading(false);
    }
  }, []);

  // Load carousel items on mount
  useEffect(() => {
    loadCarouselItems();
  }, [loadCarouselItems]);

  // Check for redirectTo parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirectTo');
    if (redirectParam) {
      setRedirectTo(redirectParam);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/');
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (error) setError('');
    // If user edits the email after prefilling, clear the verified flag
    if (name === 'email' && verifiedGoogleEmail) setVerifiedGoogleEmail(null);
  };

  // 📩 Email/password signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setError('This email is reserved for the Kapangan Wonders administrator.');
      return;
    }

    // If the user entered a Gmail address, require Google sign-in verification.
    // Allow signup only when the user has previously fetched/verified the Gmail via the Google icon.
    const emailLower = formData.email.toLowerCase();
    if (emailLower.endsWith('@gmail.com') || emailLower.endsWith('@googlemail.com')) {
      if (verifiedGoogleEmail !== emailLower) {
        setError('For Gmail addresses please use the Google icon to verify your Gmail before creating a password account.');
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // ✅ Set display name and default avatar
      await updateProfile(user, {
        displayName: fullName,
        photoURL: DEFAULT_AVATAR,
      });

      // ✅ Save user document to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        photoURL: DEFAULT_AVATAR,
        provider: 'email',
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      alert('✅ Account created successfully!');
      // Redirect based on where they came from or to the home page
      const redirectPath = redirectTo || '/';
      console.log('Redirecting after signup to:', redirectPath);
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Signup error:', err);
      let message = 'An error occurred during signup. Please try again.';

      if (err?.code === 'auth/email-already-in-use') {
        // The email exists in Firebase Auth (could be Google, password, etc.)
        // Query sign-in methods to give the user a clearer action.
        try {
          const methods = await fetchSignInMethodsForEmail(auth, formData.email);
          if (methods && methods.includes('google.com')) {
            message = 'This email is registered using Google. Please use Sign up with Google (the Google button) to continue.';
          } else if (methods && methods.includes('password')) {
            message = 'This email is already registered. Please sign in or reset your password.';
          } else {
            message = 'This email is already registered. Please sign in instead.';
          }
        } catch (e) {
          console.error('Error fetching sign-in methods:', e);
          message = 'This email is already registered. Please sign in instead.';
        }
      } else if (err?.code === 'auth/invalid-email') {
        message = 'Invalid email format.';
      } else if (err?.code === 'auth/weak-password') {
        message = 'Password is too weak. Please choose a stronger one.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        message =
          'Email/Password signup is currently disabled in Firebase. Please contact support.';
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 Google sign-in
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle();

      if (!result || !result.success) {
        const message = result?.error || 'Google sign-in failed. Please try again.';
        setError(message);
        setIsLoading(false);
        return;
      }

      const user = result.user;
      if (!user) {
        setError('Google sign-in did not return a user. Please try again.');
        setIsLoading(false);
        return;
      }

      const email = user.email ?? '';
      if (!email) {
        setError('Google account has no email. Cannot continue.');
        await firebaseSignOut(auth);
        setIsLoading(false);
        return;
      }

      // Prevent admin from signing up
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setError('The Kapangan Wonders admin cannot sign up as a regular user here.');
        await firebaseSignOut(auth);
        setIsLoading(false);
        return;
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || `${formData.firstName} ${formData.lastName}`,
          photoURL: user.photoURL || DEFAULT_AVATAR,
          provider: 'google',
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      alert('✅ Signed in with Google successfully!');
      // Redirect based on where they came from or to the home page
      const redirectPath = redirectTo || '/';
      console.log('Redirecting after Google signup to:', redirectPath);
      router.replace(redirectPath);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Google profile (prefill email) without creating a user
  const handleFetchGoogleEmail = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res: any = await fetchGoogleProfile();
      if (!res || !res.success) {
        setError(res?.error || 'Failed to fetch Google account. Please try again.');
        setIsLoading(false);
        return;
      }

      const gmail = (res.profile?.email || '').toLowerCase();
      if (!gmail) {
        setError('Google account did not return an email.');
        setIsLoading(false);
        return;
      }

      // Prefill the email input and mark it as verified
      setFormData((prev) => ({ ...prev, email: gmail }));
      setVerifiedGoogleEmail(gmail);
    } catch (err) {
      console.error('Error fetching Google profile:', err);
      setError('Failed to fetch Google profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Carousel Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
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
        <div className="max-w-7xl mx-auto p-6 bg-black/70 backdrop-blur-sm rounded-b-xl border-2 border-green-500 shadow-lg">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white font-poppins">Create Your Account</h1>
            <p className="text-xl text-white/90 mt-4">Join Kapangan Wonders today</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-black/40 backdrop-blur-md py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border-2 border-green-500">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                      setFormData((prev) => ({ ...prev, firstName: value }));
                      if (error) setError('');
                    }}
                    placeholder="First name"
                    className="block w-full px-3 py-2 bg-white/5 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                      setFormData((prev) => ({ ...prev, lastName: value }));
                      if (error) setError('');
                    }}
                    placeholder="Last name"
                    className="block w-full px-3 py-2 bg-white/5 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email address
                </label>
                <div className="relative flex items-center">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    readOnly
                    placeholder="Click to choose your Gmail and prefill this field"
                    value={formData.email}
                    onChange={handleChange}
                    onClick={() => { if (!isLoading) handleFetchGoogleEmail(); }}
                    className="block w-full pr-10 px-3 py-2 bg-white/5 border border-white rounded-md text-white text-sm placeholder-white/70 placeholder:text-xs placeholder:truncate focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer overflow-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleFetchGoogleEmail}
                    disabled={isLoading}
                    aria-label="Choose Gmail account"
                    title="Click to choose your Gmail and prefill the email field"
                    className="absolute right-1 p-1 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </button>
                </div>

              </div>

              <div className="mt-2">
                <div className="text-white">
                  <PasswordStrengthIndicator 
                    onStrengthChange={setPasswordStrength}
                    showScore={true}
                    className="w-full"
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, password: value }));
                      if (error) setError('');
                    }} 
                    value={formData.password}
                    placeholder="Enter your password"
                    inputProps={{
                      className: 'w-full px-3 py-2 bg-white/5 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent',
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 bg-white/5 border border-white/30 rounded-md text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/70 hover:text-white"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-300 text-center text-sm">{error}</p>}

              <div className="space-y-2">
                {passwordStrength === 'weak' && formData.password && (
                  <p className="text-sm text-amber-300">Please use a stronger password</p>
                )}
                <button
                  type="submit"
                  disabled={isLoading || passwordStrength === 'weak'}
                  className={`w-full py-2 px-4 rounded-md font-semibold transition ${
                    isLoading || passwordStrength === 'weak'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-600'
                      : 'bg-green-600 text-white hover:bg-green-700 border border-green-500'
                  }`}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>

            {/* Google Sign Up */}
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
                <span>{isLoading ? 'Signing in...' : 'Sign up with Google'}</span>
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-white/90">
                  Already have an account?{' '}
                  <Link 
                    href={
                      redirectTo 
                        ? `/signin?redirectTo=${encodeURIComponent(redirectTo)}`
                        : '/signin'
                    } 
                    className="font-medium text-green-300 hover:text-green-200 transition-colors"
                  >
                    Sign in
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
