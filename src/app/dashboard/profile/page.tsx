'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photo, setPhoto] = useState('/assets/default-avatar.png');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        const providerId = u.providerData?.[0]?.providerId || '';
        const isGoogleUser = providerId.includes('google');

        const nameParts = u.displayName ? u.displayName.split(' ') : ['', ''];
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');

        // Use user's photoURL if available, else fallback
        const userPhoto =
          !isGoogleUser && !u.photoURL
            ? '/assets/default-avatar.png'
            : u.photoURL || '/assets/default-avatar.png';

        setUser(u);
        setPhoto(userPhoto);
      } else {
        setUser(null);
        setPhoto('/assets/default-avatar.png');
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      if (auth.currentUser) {
        const fullName = `${firstName} ${lastName}`.trim();
        await updateProfile(auth.currentUser, { displayName: fullName });
        setUser({ ...auth.currentUser, displayName: fullName });
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async () => {
    if (!auth.currentUser?.email) return;
    setError('');
    setSuccess('');
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password')
        setError('Current password is incorrect.');
      else if (err.code === 'auth/weak-password')
        setError('New password should be at least 6 characters.');
      else setError('Failed to update password.');
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 min-h-screen">
      <div className="max-w-5xl mx-auto mt-10 mb-20">
        <h1 className="text-4xl font-bold text-green-800 mb-8 border-b-4 border-green-300 pb-3">
          My Profile
        </h1>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* LEFT - PROFILE PICTURE */}
          <div className="lg:w-1/3 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <div className="relative w-44 h-44">
              <Image
                src={photo || '/assets/default-avatar.png'}
                alt="Profile"
                fill
                priority
                sizes="176px"
                className="rounded-full border-4 border-green-400 shadow-lg object-cover transition-transform duration-300 hover:scale-105"
                onError={() => setPhoto('/assets/default-avatar.png')}
              />
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-gray-800">
              {firstName || 'Guest'} {lastName}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">{user?.email || 'N/A'}</p>
          </div>

          {/* RIGHT - INFORMATION */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-green-800">
                Account Information
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                >
                  <Pencil size={18} /> Edit
                </button>
              )}
            </div>

            {/* VIEW MODE */}
            {!isEditing && (
              <div className="space-y-5 text-gray-700">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium text-lg">{firstName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium text-lg">{lastName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-lg">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Password</p>
                  <p className="font-medium text-lg">••••••••</p>
                </div>
              </div>
            )}

            {/* EDIT MODE */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-green-50 p-6 rounded-xl mt-4 shadow-inner border border-green-200"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold text-green-800">
                      Edit Profile
                    </h4>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-gray-500 hover:text-red-500 transition"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="border border-green-300 rounded-md w-full p-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="border border-green-300 rounded-md w-full p-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  {!user?.providerData?.[0]?.providerId?.includes('google') && (
                    <>
                      <div className="mt-4">
                        <label className="block text-gray-600 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="border border-green-300 rounded-md w-full p-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-gray-600 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border border-green-300 rounded-md w-full p-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <button
                        onClick={handlePasswordChange}
                        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                      >
                        Update Password
                      </button>
                    </>
                  )}

                  {error && (
                    <p className="text-red-600 text-sm mt-3">{error}</p>
                  )}
                  {success && (
                    <p className="text-green-600 text-sm mt-3">{success}</p>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
