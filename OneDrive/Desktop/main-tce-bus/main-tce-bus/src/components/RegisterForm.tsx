// src/components/RegisterForm.tsx

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../firebase';
import { uploadToDropbox } from '../utils/uploadToDropbox';
import toast from 'react-hot-toast';

const CLOUD_NAME = "dhu0launq"; // from Cloudinary dashboard
const UPLOAD_PRESET = "student_photos"; // create unsigned preset


const RegisterForm = () => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busname, setBusname] = useState('');
  const [fare, setFare] = useState('');
  const [stop, setStop] = useState('');
  const [route, setRoute] = useState('');
  const [rollno, setRollno] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Sample dropdown options
  const departmentOptions = ['IT','CSE','CSBS', 'ECE', 'EEE', 'MECHANICAL','MECHATRONICS','CIVIL','B.ARCH','MSC DATASCIENCE','AIML','B.DES'];
  const yearOptions = ['1', '2', '3', '4'];
  const busNameOptions = ['Teppakulam', 'Vadamalayan', 'Thirunagar', 'K.K.Nagar','Fatima College'];
  const routeOptions = ['Teppakulam','Goripalayam','Anna Nagar','Vadamalayan','Thirunagar', 'Andalpuram','KK Nagar', 'Madura College', 'Crime Branch','Moondrumavadi','K.Pudur', 'Outpost', 'Fathima College','Tallakulam', 'Periyar','South Gate', 'Kalavasal', 'Doak Nagar','Maatuthavani','Melamadai','Anna Busstand','Aavin','Nelpettai','Hindu Office','District Court','YNCA School','Roman Pettai','Arasaradi','Keelavasal','Madura Coats','Byepass','TheeKathir','Guru Theatre','Kochadai','koodal Nagar','Ponmeni','Shanthi Nagar','RTO Byepass','KFC','Natraj Theatre','Chokalinga Nagar'];
  const fareOptions = ['28,875', '33,000', '36,135', '41,250'];

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url; // returns the hosted photo URL
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name || !department || !year || !rollno || !busname || !fare || !stop || !route || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (!photo) {
      toast.error("Please select a photo.");
      setLoading(false);
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;
      if (!user) throw new Error("User creation failed unexpectedly.");

      // Upload to Cloudinary instead of Dropbox
      let photoUrl = null;
      try {
        photoUrl = await uploadToCloudinary(photo);
      } catch (err) {
        toast.error("Photo upload failed. Please try again.");
        setLoading(false);
        return;
      }

      await updateProfile(user, {
        displayName: name,
        photoURL: photoUrl,
      });


      await setDoc(doc(db, 'user', email), {
        name,
        department,
        year,
        email,
        id: email,
        photo: photoUrl,
        uid: user.uid,
        busname,
        fare: Number(fare),
        stop,
        route,
        rollno,
        password,
        confirmPassword,
        role: 'student',
        paymentStatus: true,
        lastPaymentDate: new Date().toISOString().split('T')[0],
        registrationDate: new Date(),
        status: null
      });

      toast.success('Registration successful!');
      setName('');
      setDepartment('');
      setYear('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setBusname('');
      setFare('');
      setStop('');
      setRoute('');
      setRollno('');
      setPhoto(null);
    } catch (error: any) {
      console.error("Registration Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak.');
      } else {
        toast.error(error.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="p-4 bg-white shadow rounded max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4 text-center">Student Registration</h2>

      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required className="mb-2 w-full p-2 border rounded" />

      {/* Department Dropdown */}
      <select value={department} onChange={e => setDepartment(e.target.value)} required className="mb-2 w-full p-2 border rounded">
        <option value="">Select Department</option>
        {departmentOptions.map(dep => <option key={dep} value={dep}>{dep}</option>)}
      </select>

      {/* Year Dropdown */}
      <select value={year} onChange={e => setYear(e.target.value)} required className="mb-2 w-full p-2 border rounded">
        <option value="">Select Year</option>
        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <input type="text" value={rollno} onChange={e => setRollno(e.target.value)} placeholder="Roll No" required className="mb-2 w-full p-2 border rounded" />

      {/* Bus Name Dropdown */}
      <select value={busname} onChange={e => setBusname(e.target.value)} required className="mb-2 w-full p-2 border rounded">
        <option value="">Select Bus Name</option>
        {busNameOptions.map(bus => <option key={bus} value={bus}>{bus}</option>)}
      </select>

      {/* Fare Dropdown */}
      <select value={fare} onChange={e => setFare(e.target.value)} required className="mb-2 w-full p-2 border rounded">
        <option value="">Select Fare</option>
        {fareOptions.map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      <input
        type="text"
        value={stop}
        onChange={e => setStop(e.target.value)}
        placeholder="Stop"
        required
        className="mb-2 w-full p-2 border rounded"
      />

      {/* Route Dropdown */}
      <select value={route} onChange={e => setRoute(e.target.value)} required className="mb-2 w-full p-2 border rounded">
        <option value="">Select Route</option>
        {routeOptions.map(rt => <option key={rt} value={rt}>{rt}</option>)}
      </select>

      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="mb-2 w-full p-2 border rounded" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="mb-2 w-full p-2 border rounded" />
      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required className="mb-2 w-full p-2 border rounded" />

     <div className="mb-4">
        <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-700 mb-1">Upload Photo:</label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={e => setPhoto(e.target.files?.[0] || null)}
          required
          className="w-full"
        />
        {photo && <p className="text-sm text-gray-500 mt-1">Selected: {photo.name}</p>}
      </div>


      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;
