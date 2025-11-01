import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { account, isAdmin, ensureAppwriteUser, getAppwriteSession } from '@/lib/appwrite';

export const AppwriteContext = createContext({});

export const useAppwrite = () => useContext(AppwriteContext);

export const AppwriteProvider = ({ children }) => {
  const [appwriteUser, setAppwriteUser] = useState(null);
  const [isAppwriteReady, setIsAppwriteReady] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Initialize Appwrite when Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Ensure user exists in Appwrite
          const isReady = await ensureAppwriteUser();
          if (isReady) {
            // Get Appwrite session
            await getAppwriteSession();
            
            // Get user data from Appwrite
            const userData = await account.get();
            setAppwriteUser(userData);
            
            // Check if user is admin
            const adminStatus = await isAdmin();
            setIsUserAdmin(adminStatus);
            
            setIsAppwriteReady(true);
          }
        } catch (error) {
          console.error('Appwrite initialization error:', error);
          setAppwriteUser(null);
          setIsUserAdmin(false);
          setIsAppwriteReady(false);
        }
      } else {
        // User is signed out
        setAppwriteUser(null);
        setIsUserAdmin(false);
        setIsAppwriteReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppwriteContext.Provider 
      value={{ 
        appwriteUser, 
        isAppwriteReady, 
        isUserAdmin,
        isAdmin: isUserAdmin,
        // Add other Appwrite functions you want to expose
      }}
    >
      {children}
    </AppwriteContext.Provider>
  );
};

export default AppwriteContext;
