import { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { User, UserRole } from '../types';
import { generateStudentId } from '../services/branchCounter';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithRole = async (email: string, password: string, role: UserRole, additionalData?: { name?: string; phone?: string; branch?: 'wardha' | 'nagpur' | 'butibori' | 'akola'; address?: { district: string; tehsil: string; village: string; street?: string; } }) => {
    try {
      setError(null);
      setLoading(true);
      
      // For students, generate ID before creating the account
      let studentId = '';
      if (role === 'student' && additionalData?.branch) {
        try {
          studentId = await generateStudentId(additionalData.branch);
        } catch (error) {
          throw new Error('Failed to generate student ID. Please try again.');
        }
      }
      
      let currentUser;
      try {
        // Try to sign in first
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
      } catch (signInError) {
        if (role === 'student' && !studentId) {
          throw new Error('Student ID generation is required for registration');
        }
        // If sign in fails, create a new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
      }
      
      if (!currentUser) {
        throw new Error('Authentication failed');
      }

      const userData: User = {
        role,
        name: additionalData?.name || '',
        uid: studentId || currentUser.uid,
        email,
        phone: additionalData?.phone || '',
        branch: additionalData?.branch,
        address: additionalData?.address,
        coursesEnrolled: [],
        payments: [],
        performance: []
      };
      
      // Save user data to Firestore using the Firebase auth UID
      await setDoc(doc(db, 'users', currentUser.uid), userData);
      setUser(userData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    loginWithRole,
    logout
  };
};