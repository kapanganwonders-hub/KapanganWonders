'use client';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setName(u.displayName || '');
        setPhoto(u.photoURL || '');
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name, photoURL: photo });
      alert('Profile updated!');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-md w-full p-2"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Email</label>
          <input type="email" value={user?.email || ''} disabled className="border border-gray-300 rounded-md w-full p-2 bg-gray-100" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Profile Picture URL</label>
          <input
            type="text"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            className="border border-gray-300 rounded-md w-full p-2"
          />
        </div>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
