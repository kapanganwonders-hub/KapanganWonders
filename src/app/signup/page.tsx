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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/');
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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

      alert('✅ Account created successfully! Redirecting to Sign In...');
      router.push('/signin');
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
      router.replace('/');
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-egg-white flex flex-col justify-between">

      {/* Form */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 flex-grow">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold text-primary-green">Create your account</h2>
        </div>

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
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-green">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-border-green rounded-md focus:ring-primary-green focus:border-primary-green"
                />
              </div>

              {error && <p className="text-red-600 text-center text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-md bg-primary-green text-egg-white font-semibold hover:bg-accent-green transition disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            {/* Google Sign Up */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-green" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-egg-white text-primary-green/80">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center w-full py-2 px-4 border border-border-green rounded-md bg-egg-white hover:bg-light-green transition"
                >
                  <span className="mr-2">🔍</span>
                  {isLoading ? 'Signing in...' : 'Google'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-green text-egg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border-green mt-8 pt-8 text-center text-light-green/80">
            <p>&copy; 2025 Kapangan Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
