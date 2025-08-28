// 
//  Project: TCE Staff Bus Payment Web App
//  Developed by:
//    Jovin J - B.tech IT,TCE jovinjeffin@gmail.com, (Phone No: 8925228892) 
//    Aswinkumar I - B.tech IT,TCE tceaswin@gmail.com, (Phone No: 8825558350) 
//    Praveen S - B.tech IT,TCE spraveen2666@gmail.com, (Phone No: 6381622037)    
//    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE


import { User } from '../models/User';
import { FareCalculator } from '../utils/FareCalculator';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, setDoc, doc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

export class UserService {
  // Demo staff data - replace with Firestore later
  // Firestore collection name
  private static studentCollection = 'user';
  private static busPassCollection = 'busPasses';

  static async getAllStudent(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, this.studentCollection));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  static async getStudentByEmail(email: string): Promise<User | null> {
    const q = query(collection(db, this.studentCollection), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0].data();
    return { id: snapshot.docs[0].id, ...docData } as User;
  }

  static async addStudent(studentData: Omit<User, 'id' | 'fare' | 'role'> & { password: string }): Promise<User> {
    // Create Firebase Auth user
    await createUserWithEmailAndPassword(auth, studentData.email, studentData.password);
    const fare = FareCalculator.calculateFare(studentData.route);
    const newStaff: User = {
      ...studentData,
      id: studentData.email, // Use email as document ID
      fare,
      role: 'student',
      paymentStatus: false,
      lastPaymentDate: null
    };
    await setDoc(doc(db, this.studentCollection, studentData.email), newStaff);
    return newStaff;
  }

  static async updateStudent(id: string, updates: Partial<User>): Promise<User | null> {
    if (updates.route) {
      updates.fare = FareCalculator.calculateFare(updates.route);
    }
    await updateDoc(doc(db, this.studentCollection, id), updates);
    const updatedDoc = await getDocs(query(collection(db, this.studentCollection), where('id', '==', id)));
    if (updatedDoc.empty) return null;
    return { id, ...updatedDoc.docs[0].data() } as User;
  }

  static async deleteStudent(id: string): Promise<boolean> {
    await deleteDoc(doc(db, this.studentCollection, id));
    return true;
  }

  static async updatePaymentStatus(id: string, status: boolean, paymentDate?: string): Promise<boolean> {
    await updateDoc(doc(db, this.studentCollection, id), {
      paymentStatus: status,
      lastPaymentDate: paymentDate || null
    });
    return true;
  }

  static async filterStudentByRoute(route: string): Promise<User[]> {
    const q = route === 'all'
      ? collection(db, this.studentCollection)
      : query(collection(db, this.studentCollection), where('route', '==', route));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  static async filterStaffByPaymentStatus(paid: boolean): Promise<User[]> {
    const q = query(collection(db, this.studentCollection), where('paymentStatus', '==', paid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  // Store bus pass in Firestore
  static async addBusPass(busPass: any): Promise<void> {
    await addDoc(collection(db, this.busPassCollection), busPass);
  }

  // Reset all staff paymentStatus and lastPaymentDate for new month
  static async resetAllPayments(): Promise<void> {
    try {
      // Set all staff paymentStatus to false and lastPaymentDate to null
      const staffSnapshot = await getDocs(collection(db, this.studentCollection));
      const batchPromises = staffSnapshot.docs.map(docSnap =>
        updateDoc(doc(db, this.studentCollection, docSnap.id), {
          paymentStatus: false,
          lastPaymentDate: null
        })
      );
      await Promise.all(batchPromises);

      // Optionally, remove all bus passes for the new month
      // Remove all bus passes for the current month and year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const busPassQuery = query(
        collection(db, this.busPassCollection),
        where('month', '==', month),
        where('year', '==', year)
      );
      const busPassSnapshot = await getDocs(busPassQuery);
      const deletePromises = busPassSnapshot.docs.map(docSnap =>
        deleteDoc(doc(db, this.busPassCollection, docSnap.id))
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error in resetAllPayments:', error);
      throw error;
    }
  }
}