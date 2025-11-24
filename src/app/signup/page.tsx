'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithGoogle } from '@/lib/auth';
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
        message = 'This email is already registered. Please sign in instead.';
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

  return (
    <div className="min-h-screen bg-egg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-100 to-green-200 text-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold">Create Your Account</h1>
          <p className="mt-3 text-lg">Join Kapangan Wonders today</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-egg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border-green">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-primary-green">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-border-green rounded-md focus:ring-primary-green focus:border-primary-green"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-primary-green">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-border-green rounded-md focus:ring-primary-green focus:border-primary-green"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-green">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-border-green rounded-md focus:ring-primary-green focus:border-primary-green"
                />
              </div>

              <div className="mt-2">
                <PasswordStrengthIndicator 
                  value={formData.password}
                  onStrengthChange={setPasswordStrength}
                  showScore={true}
                  className="w-full"
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, password: value }));
                    if (error) setError('');
                  }}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-green">
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
                    className="block w-full px-3 py-2 border border-border-green rounded-md focus:ring-primary-green focus:border-primary-green pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
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

              {error && <p className="text-red-600 text-center text-sm">{error}</p>}

              <div className="space-y-2">
                {passwordStrength === 'weak' && formData.password && (
                  <p className="text-sm text-amber-600">Please use a stronger password</p>
                )}
                <button
                  type="submit"
                  disabled={isLoading || passwordStrength === 'weak'}
                  className={`w-full py-2 px-4 rounded-md font-semibold transition ${
                    isLoading || passwordStrength === 'weak'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-green text-egg-white hover:bg-accent-green'
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
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-border-green rounded-md bg-egg-white text-sm font-medium text-primary-green hover:bg-light-green disabled:opacity-50"
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
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    href={
                      redirectTo 
                        ? `/signin?redirectTo=${encodeURIComponent(redirectTo)}`
                        : '/signin'
                    } 
                    className="font-medium text-primary-green hover:text-accent-green"
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
