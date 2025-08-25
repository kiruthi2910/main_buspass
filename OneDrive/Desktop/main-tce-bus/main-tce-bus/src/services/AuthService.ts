import { User } from '../models/User';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export class AuthService {
  // Demo credentials - replace with Firebase Auth later
  private static demoCredentials = [
    { email: 'staff1@college.edu', password: 'password123', role: 'staff' },
    { email: 'staff2@college.edu', password: 'password123', role: 'staff' },
    { email: 'staff3@college.edu', password: 'password123', role: 'staff' },
    { email: 'admin@college.edu', password: 'admin123', role: 'admin' }
  ];

  static async login(email: string, password: string): Promise<User | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));



    try {
      // Firebase Auth sign in
      await signInWithEmailAndPassword(auth, email, password);
      // Fetch staff document from Firestore using email as document ID
      const studentDoc = await getDoc(doc(db, 'user', email));
      if (!studentDoc.exists()) return null;
      return studentDoc.data() as User;
    } catch (error) {
      return null;
    }
  }

  static async logout(): Promise<void> {
    // Clear any session data
    localStorage.removeItem('currentUser');
  }
}