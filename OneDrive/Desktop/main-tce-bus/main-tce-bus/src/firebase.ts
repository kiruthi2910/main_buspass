// 
//  Project: TCE Staff Bus Payment Web App
//  Developed by:
//    Jovin J - B.tech IT,TCE jovinjeffin@gmail.com, (Phone No: 8925228892) 
//    Aswinkumar I - B.tech IT,TCE tceaswin@gmail.com, (Phone No: 8825558350) 
//    Praveen S - B.tech IT,TCE spraveen2666@gmail.com, (Phone No: 6381622037)    
//    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAkqfy62hfhmBar4HniopH92DSyRoA4IQw",
  authDomain: "student-bus-pass-21440.firebaseapp.com",
  projectId: "student-bus-pass-21440",
  storageBucket: "student-bus-pass-21440.appspot.com", // ✅ Add comma here
  messagingSenderId: "708525573674",
  appId: "1:708525573674:web:5600c145c5d69287b62553",
  measurementId: "G-X6L1LF1LVE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
