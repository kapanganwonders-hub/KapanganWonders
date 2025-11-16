'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { signInWithGoogle } from '@/lib/auth';
import { ADMIN_EMAIL } from '@/lib/admin';
import { checkIsBarangayAdmin } from '@/lib/barangayAdmin';
import { checkIsPrivateSpotAdmin } from '@/lib/privateSpotAdmin';

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      // Regular user
      router.push('/');
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
        
        // Regular user
        router.push('/');
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
    <div className="min-h-screen bg-egg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-100 to-green-200 text-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold">Welcome Back</h1>
          <p className="mt-3 text-lg">Sign in to access your account</p>
        </div>
      </div>

      {/* Sign In Form */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold text-primary-green">Sign in to your account</h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-egg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border-green">
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary-green">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-border-green rounded-md focus:ring-primary-green focus:border-primary-green"
                  placeholder="Enter your password"
                />
              </div>

              {/* Error message box */}
              {error && (
                <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-md bg-primary-green text-egg-white font-semibold hover:bg-accent-green transition disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Google Sign In */}
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
                <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
