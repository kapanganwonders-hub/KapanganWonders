'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/auth';

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Automatically redirect logged-in users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email === 'kapanganwonders@gmail.com') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle Email/Password Sign In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      alert('Signed in successfully!');

      // ✅ Redirect based on user email
      if (user.email === 'kapanganwonders@gmail.com') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      let message = 'An error occurred during sign in.';
      if (err.code === 'auth/user-not-found') message = 'No account found with this email.';
      else if (err.code === 'auth/wrong-password') message = 'Incorrect password.';
      else if (err.code === 'auth/invalid-email') message = 'Invalid email format.';
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
        if (user?.email === 'kapanganwonders@gmail.com') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
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
      <section className="relative bg-gradient-custom text-primary-green overflow-hidden">
        <div className="absolute inset-0">
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
          <div className="absolute bottom-20 left-0 right-0 animate-wave">
            <svg width="100%" height="40" viewBox="0 0 1200 40" className="text-black/10">
              <path d="M0,20 Q300,5 600,20 T1200,20 L1200,40 L0,40 Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-green">Kapangan Wonder</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-green mb-4">
            Sign in to your account
          </h2>
          <p className="text-lg text-primary-green/80">
            Or{' '}
            <Link href="/signup" className="font-medium text-primary-green hover:text-accent-green">
              create a new account
            </Link>
          </p>
        </div>
      </section>

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

              {error && <p className="text-red-600 text-center text-sm">{error}</p>}

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
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-green" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-egg-white text-primary-green/80">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  className="w-full inline-flex justify-center py-2 px-4 border border-border-green rounded-md bg-egg-white text-sm font-medium text-primary-green hover:bg-light-green"
                  type="button"
                  onClick={() => alert('Facebook login coming soon!')}
                >
                  <span className="text-lg">📘</span>
                  <span className="ml-2">Facebook</span>
                </button>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-border-green rounded-md bg-egg-white text-sm font-medium text-primary-green hover:bg-light-green disabled:opacity-50"
                >
                  <span className="text-lg">🔍</span>
                  <span className="ml-2">{isLoading ? 'Signing in...' : 'Google'}</span>
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
