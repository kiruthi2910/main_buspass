//  Project: TCE Student Bus Payment Web App
//  Developed by:
//    Muthukumari Valliammai M - B.tech IT,TCE muthukumari2211@gmail.com, (Phone No: 6381825245) 
//    Aburvaa A S - B.tech IT,TCE aburvaasenthilkumarias@gmail.com, (Phone No: 8248224408) 
//    Kiruthika B - B.tech IT,TCE kirubala2005@gmail.com, (Phone No: 9360461440)    
//    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE

// @ts-ignore
import jsPDF from 'jspdf';
import tceLogo from './tcelogo.png';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bus, 
  LogOut, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  IndianRupee,
  CheckCircle,
  XCircle,
  Calendar,
  Download
} from 'lucide-react';

import { UserService } from '../services/UserService';
import { FareCalculator } from '../utils/FareCalculator';
import { DateUtils } from '../utils/DateUtils';
import { User } from '../models/User';
import toast from 'react-hot-toast';


function AdminDashboard() {


// Generate PDF report for Paid and Unpaid student (2 pages, real data)
  function handleGenerateReport() {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    const now = new Date();
    const reportMonth = now.toLocaleString('default', { month: 'long' });
    const reportYear = now.getFullYear();
    const studentOnly = filteredStudent.filter(s => s.role === 'student');
    const paidStudent = studentOnly.filter(s => s.paymentStatus);
    const unpaidStudent = studentOnly.filter(s => !s.paymentStatus);

    function renderHeaderAndTitle(sectionTitle) {
      pdf.addImage(tceLogo, 'PNG', margin, 32, 60, 60);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      // Shift heading to the right by adding an offset (e.g., +40)
      pdf.text('THIAGARAJAR COLLEGE OF ENGINEERING, MADURAI – 15', pageWidth / 2 + 40, 55, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text('(A Govt. Aided, Autonomous Institution, Affiliated to Anna University)', pageWidth / 2+40, 75, { align: 'center' });
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(`${reportMonth} ${reportYear} BUS PAYMENT REPORT`, pageWidth / 2, 105, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(sectionTitle, margin, 135);
      pdf.setLineWidth(1);
      pdf.line(margin, 145, pageWidth - margin, 145);
    }

   function renderTableRows(studentList) {
      // Table headers
      const col1 = margin;
      const col2 = margin + 70;
      const col3 = margin + 150;
      const col4 = margin + 290;
      const col5 = margin + 370;
      const col6 = margin + 440;
      const col7 = margin + 490;
      let y = 165;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bus Name', col1, y);
      pdf.text('Name', col2, y);
      pdf.text('ID/Email', col3, y);
      pdf.text('Department', col4, y);
      pdf.text('Route', col5, y);
      pdf.text('Fare', col6, y);
      pdf.text('Status', col7, y);
      pdf.setFont('helvetica', 'normal');
      y += 18;
      studentList.forEach(student => {
        pdf.text(student.busname || '', col1, y);
        pdf.text(student.name || '', col2, y);
        pdf.text(student.email || '', col3, y);
        pdf.text(student.department || '', col4, y);
        pdf.text(student.route || '', col5, y);
        pdf.text(student.fare ? String(student.fare) : '-', col6, y);
        pdf.text(student.paymentStatus ? 'Paid' : 'Unpaid', col7, y);
        y += 20;
      });
    }


    // Page 1: Paid Student
    renderHeaderAndTitle('Paid Student');
    renderTableRows(paidStudent);

    // Page 2: Unpaid Student
    pdf.addPage();
    renderHeaderAndTitle('Unpaid Student');
    renderTableRows(unpaidStudent);

    pdf.save(`BusPass_Report_${reportMonth}_${reportYear}.pdf`);
  }
  // Change Password modal state
  const [showChangePass, setShowChangePass] = useState(false);
  const [changePass, setChangePass] = useState({
    newPassword: '',
    confirmPassword: '',
    currentPassword: '',
    loading: false,
    requireReauth: false
  });

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePass.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (changePass.newPassword !== changePass.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangePass(cp => ({ ...cp, loading: true }));
    try {
      const { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      await updatePassword(user, changePass.newPassword);
      toast.success('Password changed successfully');
      setShowChangePass(false);
      setChangePass({ newPassword: '', confirmPassword: '', currentPassword: '', loading: false, requireReauth: false });
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setChangePass(cp => ({ ...cp, loading: false, requireReauth: true }));
        toast.error('Please re-enter your current password to continue.');
      } else {
        toast.error('Failed to change password: ' + (error instanceof Error ? error.message : String(error)));
        setChangePass(cp => ({ ...cp, loading: false }));
      }
    }
  };

  // Handler for reauth + password change
  const handleReauthAndChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePass.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (changePass.newPassword !== changePass.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!changePass.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    setChangePass(cp => ({ ...cp, loading: true }));
    try {
      const { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No authenticated user');
      const credential = EmailAuthProvider.credential(user.email, changePass.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, changePass.newPassword);
      toast.success('Password changed successfully');
      setShowChangePass(false);
      setChangePass({ newPassword: '', confirmPassword: '', currentPassword: '', loading: false, requireReauth: false });
    } catch (error: any) {
      toast.error('Failed to change password: ' + (error instanceof Error ? error.message : String(error)));
      setChangePass(cp => ({ ...cp, loading: false }));
    }
  };
  // Handler to reset all payments for new month
  const handleResetAllPayments = async () => {
    if (!window.confirm('Are you sure you want to reset all student payment statuses for the new month? This will set all as unpaid and clear last payment dates.')) return;
    try {
      await UserService.resetAllPayments();
      toast.success('All student payment statuses reset for the new month');
      loadStudentData();
    } catch (error) {
      console.error('Admin resetAllPayments error:', error);
      toast.error('Failed to reset payments: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [studentList, setStudentList] = useState<User[]>([]);
  const [filteredStudent, setFilteredStudent] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBusNumber, setFilterBusNumber] = useState('all');
  const [filterRoute, setFilterRoute] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const [photoUploading, setPhotoUploading] = useState(false);


  // Form data for add/edit
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    busname:'',
    id:'',
    rollno:'',
    name: '',
    department: '',
    stop: '',
    route: 'periyar',
    paymentStatus: false,
    lastPaymentDate: '',
    photo:''
  });

  useEffect(() => {
    loadStudentData();
  }, []);

  useEffect(() => {
    filterStudentData();
  }, [studentList, searchTerm, filterRoute, filterPayment,filterBusNumber]);

  const loadStudentData = async () => {
    try {
      const student = await UserService.getAllStudent();
      setStudentList(student);
    } catch (error) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const filterStudentData = () => {
    // Only include student with role === 'student'
    let filtered = studentList.filter(student => student.role === 'student');

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Bus name filter
if (filterBusNumber !== 'all') {
  filtered = filtered.filter(student => student.busname === filterBusNumber);
}
    // Route filter
    if (filterRoute !== 'all') {
      filtered = filtered.filter(student => student.route === filterRoute);
    }

    // Payment status filter
    if (filterPayment !== 'all') {
      const isPaid = filterPayment === 'paid';
      filtered = filtered.filter(student => student.paymentStatus === isPaid);
    }

    setFilteredStudent(filtered);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await UserService.addStudent({
        ...formData,
        lastPaymentDate: formData.lastPaymentDate || null,
         photo: formData.photo
      });
      toast.success('Student member added successfully');
      setShowAddForm(false);
      resetForm();
      loadStudentData();
    } catch (error) {
  console.error("Error adding student member:", error); // <-- Add this!
  toast.error('Failed to add student member: ' + (error instanceof Error ? error.message : String(error)));
}
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      await UserService.updateStudent(editingStudent.id, {
        ...formData,
        lastPaymentDate: formData.lastPaymentDate || null

      });
      toast.success('Student member updated successfully');
      setEditingStudent(null);
      resetForm();
      loadStudentData();
    } catch (error) {
      toast.error('Failed to update student member');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await UserService.deleteStudent(id);
      toast.success('Student member deleted successfully');
      loadStudentData();
    } catch (error) {
      toast.error('Failed to delete student member');
    }
  };

  const handleTogglePaymentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const paymentDate = newStatus ? DateUtils.getCurrentDate() : undefined;
      await UserService.updatePaymentStatus(id, newStatus, paymentDate);
      toast.success(`Payment status updated`);
      loadStudentData();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      busname:'',
      id:'',
      rollno:'',
      name: '',
      department: '',
      stop: '',
      route: 'periyar',
      paymentStatus: false,
      lastPaymentDate: '',
      photo :''
    });
  };


  const startEdit = (student: User) => {
    setEditingStudent(student);
    setFormData({
      email: student.email,
      password: '', // Don't populate password for security
      confirmPassword: '',
      busname:student.busname,
      id:student.id,
      rollno:student.rollno,
      name: student.name,
      department: student.department,
      stop: student.stop,
      route: student.route,
      paymentStatus: student.paymentStatus,
      lastPaymentDate: student.lastPaymentDate || '',
      photo: student.photo || formData.photo || "",
      
    });
  };

const getStats = () => {
    // First, filter out any non-student roles
    const studentOnlyList = studentList.filter(user => user.role === 'student');

    const totalStudent = studentOnlyList.length;
    const paidStudent = studentOnlyList.filter(s => s.paymentStatus).length;
    const unpaidStudent = totalStudent - paidStudent;
    return { totalStudent, paidStudent, unpaidStudent };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Removed redundant Generate Report button at top */}
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-3 justify-center sm:justify-start">
              <div className="bg-white rounded-lg p-2 flex items-center justify-center">
                <img src={tceLogo} alt="TCE Logo" className="h-10 w-10 object-cover rounded-full border border-blue-200 shadow-sm bg-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Student Bus Pass Management System</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <button
                onClick={() => setShowChangePass(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full sm:w-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104.896-2 2-2s2 .896 2 2m-4 0a2 2 0 114 0m-4 0v2a2 2 0 002 2h0a2 2 0 002-2v-2" /></svg>
                <span>Change Password</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full sm:w-auto"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
      {/* Change Password Modal */}
      {showChangePass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={changePass.requireReauth ? handleReauthAndChangePassword : handleChangePassword} className="space-y-4">
                <div className="text-xs text-gray-500 mb-2">Password must be at least 6 characters.</div>
                {changePass.requireReauth && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={changePass.currentPassword}
                      onChange={e => setChangePass(cp => ({ ...cp, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={changePass.newPassword}
                    onChange={e => setChangePass(cp => ({ ...cp, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Re-enter New Password</label>
                  <input
                    type="password"
                    value={changePass.confirmPassword}
                    onChange={e => setChangePass(cp => ({ ...cp, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    disabled={changePass.loading}
                  >
                    {changePass.loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowChangePass(false); setChangePass({ newPassword: '', confirmPassword: '', currentPassword: '', loading: false, requireReauth: false }); }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Student</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudent}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-3xl font-bold text-green-600">{stats.paidStudent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unpaid</p>
                <p className="text-3xl font-bold text-red-600">{stats.unpaidStudent}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-48 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              
              {/* Bus Name Filter */}
              <select
                value={filterBusNumber}
                onChange={(e) => setFilterBusNumber(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-4"
              >
              <option value="all">All Bus Names</option>
              <option value="Teppakulam">Teppakulam</option>
              <option value="Vadamalayan">Vadamalayan</option>
              <option value="Thirunagar">Thirunagar</option>
              <option value="K.K.Nagar">K.K.Nagar</option>
              <option value="Fatima College">Fatima College</option>
              {/* Add more bus names if needed */}
              </select>

              {/* Route Filter */}
              <select
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Routes</option>
                <option value="Teppakulam">Teppakulam</option>
  <option value="Goripalayam">Goripalayam</option>
  <option value="Anna Nagar">Anna Nagar</option>
  <option value="Vadamalayan">Vadamalayan</option>
  <option value="Thirunagar">Thirunagar</option>
  <option value="Andalpuram">Andalpuram</option>
  <option value="KK Nagar">KK Nagar</option>
  <option value="Madura College">Madura College</option>
  <option value="Crime Branch">Crime Branch</option>
  <option value="Moondrumavadi">Moondrumavadi</option>
  <option value="K.Pudur">K.Pudur</option>
  <option value="Outpost">Outpost</option>
  <option value="Fathima College">Fathima College</option>
  <option value="Tallakulam">Tallakulam</option>
  <option value="Periyar">Periyar</option>
  <option value="South Gate">South Gate</option>
  <option value="Kalavasal">Kalavasal</option>
  <option value="Doak Nagar">Doak Nagar</option>
  <option value="Maatuthavani">Maatuthavani</option>
  <option value="Melamadai">Melamadai</option>
  <option value="Anna">Anna Bus Stand</option>
  <option value="Aavin">Aavin</option>
  <option value="Nelpettai">Nelpettai</option>
  <option value="Hindu">Hindu Office</option>
  <option value="District Court">District Court</option>
<option value="YNCA School">YNCA School</option>
<option value="Roman Pettai">Roman Pettai</option>
<option value="Arasaradi">Arasaradi</option>
<option value="Keelavasal">Keelavasal</option>
<option value="Madura Coats">Madura Coats</option>
<option value="Byepass">Byepass</option>
<option value="TheeKathir">TheeKathir</option>
<option value="Guru Theatre">Guru Theatre</option>
<option value="Kochadai">Kochadai</option>
<option value="Koodal Nagar">Koodal Nagar</option>
<option value="Ponmeni">Ponmeni</option>
<option value="Shanthi Nagar">Shanthi Nagar</option>
<option value="RTO Byepass">RTO Byepass</option>
<option value="KFC">KFC</option>
<option value="Natraj Theatre">Natraj Theatre</option>
<option value="Chokalinga Nagar">Chokalinga Nagar</option>

              </select>

              {/* Payment Filter */}
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Student</span>
              </button>
              <button
                onClick={loadStudentData}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Refresh student data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.635 19.364A9 9 0 104.582 9.582" /></svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={handleResetAllPayments}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Reset all student payment statuses for new month"
              >
                <XCircle className="h-5 w-5" />
                <span>Reset All Payments</span>
              </button>
              <button
                onClick={handleGenerateReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Generate PDF Report"
              >
                <Download className="h-5 w-5" />
                <span>Generate Report</span>
              </button>
            </div>

          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route & Fare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudent.filter(student => student.role === 'student').map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    {/* Corrected ID column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.id}</div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.busname}</div>
                    </td>
                    {/* Corrected Roll Number column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.rollno}</div>
                    </td>
                    {/* Student Details (Name, Email, Department) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                        <div className="text-sm text-gray-500">{student.department}</div>
                      </div>
                    </td>
                    {/* Route & Fare */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 capitalize">{student.route}</div>
                        <div className="text-sm text-gray-500">{student.stop}</div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <IndianRupee className="h-4 w-4" />
                          {student.fare.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    {/* Payment Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePaymentStatus(student.id, student.paymentStatus)}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          student.paymentStatus
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {student.paymentStatus ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Unpaid
                          </>
                        )}
                      </button>
                    </td>
                    {/* Last Payment */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {DateUtils.formatDate(student.lastPaymentDate || '')}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(student)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              
            </table>
          </div>

          {filteredStudent.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No student members found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {(showAddForm || editingStudent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingStudent ? 'Edit Student Member' : 'Add New Student Member'}
              </h2>
              
              <form onSubmit={editingStudent ? handleEditStudent : handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {!editingStudent && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Re-enter Password</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </>
                )}

               <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
  <input
    type="text"
    value={formData.id}
    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    required
  />
</div>


<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label>
  <input
    type="text"
    value={formData.rollno}
    onChange={(e) => setFormData({ ...formData, rollno: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    required
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
  <input
    type="text"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    required
  />
</div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Name</label>
                  <input
                    type="text"
                    value={formData.busname}
                    onChange={(e) => setFormData({ ...formData, busname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Stop</label>
                  <input
                    type="text"
                    value={formData.stop}
                    onChange={(e) => setFormData({ ...formData, stop: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <select
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {FareCalculator.getRouteOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} (₹{option.fare})
                      </option>
                    ))}
                  </select>
                </div>


<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setPhotoUploading(true); // start upload
      try {
        const CLOUD_NAME = "dhu0launq";
        const UPLOAD_PRESET = "student_photos";

        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: data
        });

        if (!res.ok) throw new Error("Cloudinary upload failed");

        const uploadData = await res.json();
        setFormData(prev => ({ ...prev, photo: uploadData.secure_url }));
      } catch (err) {
        console.error(err);
        toast.error("Photo upload failed");
      } finally {
        setPhotoUploading(false); // upload finished
      }
    }}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
  {photoUploading && <p className="text-sm text-gray-500 mt-1">Uploading photo...</p>}
</div>





                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="paymentStatus"
                    checked={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="paymentStatus" className="ml-2 block text-sm text-gray-900">
                    Payment Status (Paid)
                  </label>
                </div>

                {formData.paymentStatus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Payment Date</label>
                    <input
                      type="date"
                      value={formData.lastPaymentDate}
                      onChange={(e) => setFormData({ ...formData, lastPaymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

               <div className="flex space-x-3 pt-4">
  <button
    type="submit"
    disabled={photoUploading} // ✅ prevent submission while photo uploads
    className={`flex-1 py-2 px-4 rounded-lg transition-colors
      ${photoUploading
        ? "bg-blue-300 cursor-not-allowed"
        : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"}`}
  >
    {editingStudent ? 'Update' : 'Add'} Student
  </button>
  <button
    type="button"
    onClick={() => {
      setShowAddForm(false);
      setEditingStudent(null);
      resetForm();
    }}
    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
  >
    Cancel
  </button>
</div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;