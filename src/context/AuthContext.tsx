import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

type User = {
  id: string;
  name: string;
  email: string;
  progress: {
    completedLessons: string[];
    xp: number;
  };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to user document
        const unsubDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({ id: firebaseUser.uid, ...data } as User);
          } else {
            // Create user document if it doesn't exist
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              progress: {
                completedLessons: [],
                xp: 0,
              }
            };
            setDoc(userRef, newUser).catch(err => console.error("Error creating user:", err));
            setUser(newUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("AuthContext onSnapshot error:", error);
          setLoading(false);
        });

        return () => unsubDoc();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const updateUser = async (userData: User) => {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, userData, { merge: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
