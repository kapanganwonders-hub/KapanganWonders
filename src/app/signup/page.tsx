'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithGoogle } from '@/lib/auth';

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

  // ✅ Redirect user if already logged in (e.g. after Google sign-in)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/'); // 👈 change this to '/dashboard' if needed
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Email + Password Signup Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      const fullName = `${formData.firstName} ${formData.lastName}`;
      await updateProfile(user, { displayName: fullName });

      // ✅ Create Firestore user record
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        provider: 'email',
        createdAt: new Date().toISOString(),
      });

      alert('✅ Account created successfully! Redirecting to Sign In...');
      router.push('/signin');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        alert('✅ Signed in with Google successfully!');
        router.replace('/'); // 👈 go to main page
      } else {
        alert(result.error || 'Google sign-in failed.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-egg-white flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative bg-gradient-custom text-primary-green overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-green">
              Kapangan Wonder
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-green mb-4">
              Create your account
            </h2>
            <p className="text-lg text-primary-green/80">
              Or{' '}
              <Link
                href="/signin"
                className="font-medium text-primary-green hover:text-accent-green"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Sign Up Form */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 flex-grow">
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
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-primary-green"
                  >
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
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-primary-green"
                  >
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
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-primary-green"
                >
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
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-primary-green"
                >
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
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-primary-green"
                >
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

              {error && (
                <p className="text-red-600 text-center text-sm">{error}</p>
              )}

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
                  <span className="px-2 bg-egg-white text-primary-green/80">
                    Or continue with
                  </span>
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

      {/* ✅ Footer Section */}
      <footer className="bg-primary-green text-egg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-light-green mb-4">
                Kapangan Wonder
              </h3>
              <p className="text-light-green/80">
                Discover the natural beauty and cultural richness of Kapangan,
                Benguet.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/tourist-spots"
                    className="text-light-green/80 hover:text-egg-white"
                  >
                    Tourist Spots
                  </Link>
                </li>
                <li>
                  <Link
                    href="/eat-and-stay"
                    className="text-light-green/80 hover:text-egg-white"
                  >
                    Eat & Stay
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blogs"
                    className="text-light-green/80 hover:text-egg-white"
                  >
                    Blogs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-light-green/80 hover:text-egg-white"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/contact"
                    className="text-light-green/80 hover:text-egg-white"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signin"
                    className="text-light-green/80 hover:text-egg-white"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="text-light-green/80 hover:text-egg-white"
                  >
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-light-green/80 hover:text-egg-white text-2xl"
                >
                  📘
                </a>
                <a
                  href="#"
                  className="text-light-green/80 hover:text-egg-white text-2xl"
                >
                  🐦
                </a>
                <a
                  href="#"
                  className="text-light-green/80 hover:text-egg-white text-2xl"
                >
                  📷
                </a>
                <a
                  href="#"
                  className="text-light-green/80 hover:text-egg-white text-2xl"
                >
                  📺
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border-green mt-8 pt-8 text-center text-light-green/80">
            <p>&copy; 2025 Kapangan Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
