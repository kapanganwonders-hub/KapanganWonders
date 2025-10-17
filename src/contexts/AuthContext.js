'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { checkIsAdmin, ADMIN_EMAIL } from '@/lib/admin';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(undefined); // Changed: start as undefined so other components can detect "not yet resolved"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        // Run admin check
        const adminStatus = checkIsAdmin(user);

        console.group('🔐 Auth Debug Info');
        console.log('👤 User Email:', user.email);
        console.log('🆔 User UID:', user.uid);
        console.log('👑 Admin Email (constant):', ADMIN_EMAIL);
        console.log('✅ Is Admin:', adminStatus);
        console.groupEnd();

        setIsAdmin(adminStatus);
      } else {
        console.log('🚪 User signed out');
        // resolved: not admin
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    isAdmin,
    adminEmail: ADMIN_EMAIL
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
