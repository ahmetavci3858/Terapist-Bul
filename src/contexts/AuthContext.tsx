import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'seeker' | 'provider' | 'admin';
  photoURL?: string;
  bio?: string;
  city?: string;
  specialties?: string[];
  subSpecialties?: string[];
  diplomaURL?: string;
  criminalRecordURL?: string;
  rating?: number;
  reviewCount?: number;
  phoneNumber?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  status?: 'pending' | 'approved' | 'rejected';
  isVerified?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const isAdmin = user.email === 'ahmetavci3858@gmail.com';
      
      // Set a skeleton profile immediately to speed up UI and avoid "Yükleniyor..."
      setProfile(prev => prev || ({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (isAdmin ? 'Yönetici' : 'Yükleniyor...'),
        role: isAdmin ? 'admin' : undefined, // Use undefined to indicate loading
        setupComplete: isAdmin ? true : false
      } as any));

      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          if (user.email === 'ahmetavci3858@gmail.com') {
            data.role = 'admin';
          }
          setProfile(data);
        } else {
          // If doc doesn't exist, we still keep the skeleton but mark as not found
          if (user.email === 'ahmetavci3858@gmail.com') {
            setProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Yönetici',
              role: 'admin',
              status: 'approved',
              isVerified: true,
              setupComplete: true
            });
          } else {
            // Keep skeleton or set to null if we want to force setup
            setProfile(null);
          }
        }
        setLoading(false);
      }, (error) => {
        console.error('Profile fetch error:', error);
        setLoading(false);
      });

      return () => unsubscribeProfile();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
