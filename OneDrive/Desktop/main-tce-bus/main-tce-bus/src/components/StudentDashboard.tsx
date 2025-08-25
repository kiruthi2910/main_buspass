// 
//  Project: TCE Staff Bus Payment Web App
//  Developed by:
//    Jovin J - B.tech IT,TCE jovinjeffin@gmail.com, (Phone No: 8925228892) 
//    Aswinkumar I - B.tech IT,TCE tceaswin@gmail.com, (Phone No: 8825558350) 
//    Praveen S - B.tech IT,TCE spraveen2666@gmail.com, (Phone No: 6381622037)    
//    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE

import QRCode from 'react-qr-code';
import QRCodeLib from 'qrcode';
import tceLogo from './tcelogo.png';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import React, { useState } from 'react';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Bus, 
  LogOut, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Phone, 
  Building2, 
  IndianRupee,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { DateUtils } from '../utils/DateUtils';
import { PaymentProcessor } from './PaymentProcessor';
import { UserService } from '../services/UserService';
import toast from 'react-hot-toast';
import { BusPass } from '../models/BusPass';


function StudentDashboard() {
  // Policy Modal state
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
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

  // Logout handler
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Payment handler (called after policy accepted)
  const handlePayment = async () => {
    setLoading(true);
    try {
      toast.loading('Processing payment...');
      const success = await PaymentProcessor.initiatePayment(currentUser.fare, currentUser.id);
      if (success) {
        // Update payment status
        await UserService.updatePaymentStatus(
          currentUser.id,
          true,
          DateUtils.getCurrentDate()
        );
        toast.dismiss();
        toast.success('Payment successful!');
        // Generate and store bus pass in Firestore
        const paymentDate = new Date();
        const validFrom = paymentDate;
        const validTo = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0); // last day of month
        const pass: BusPass = {
          studentId: currentUser.id,
          studentName: currentUser.name,
          busname: currentUser.busname,
          validFrom: validFrom.toISOString().split('T')[0],
          validTo: validTo.toISOString().split('T')[0],
          month: paymentDate.getMonth() + 1,
          year: paymentDate.getFullYear()
        };
        await UserService.addBusPass(pass);
        setBusPass(pass);
        // Refetch staff data from Firestore to update payment status immediately
        const studentDoc = await getDoc(doc(db, 'user', currentUser.email));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          const user = {
            id: currentUser.id,
            busname:currentUser.busname,
            email: data.email || currentUser.email,
            name: data.name || '',
            department: data.department || '',
            rollno: data.rollno || '',
            stop: data.stop || '',
            route: data.route || '',
            fare: typeof data.fare === 'number' ? data.fare : 0,
            paymentStatus: !!data.paymentStatus,
            lastPaymentDate: data.lastPaymentDate || null,
            role: data.role || 'student',
          };
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          setIsOverdue(DateUtils.isPaymentOverdue(user.lastPaymentDate, user.paymentStatus));
        }
        setPaymentWindowOpen(true); // keep payment window open for testing
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
      setShowPolicyModal(false);
      setPolicyAccepted(false);
    }
  };
    const { currentUser, setCurrentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentWindowOpen, setPaymentWindowOpen] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  const [busPass, setBusPass] = useState<BusPass | null>(null);

  // Fetch latest user and bus pass from Firestore
  const fetchLatestUser = async () => {
    if (!currentUser) return;
    setRefreshing(true);
    try {
      const studentDoc = await getDoc(doc(db, 'user', currentUser.email));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        const user = {
          id: currentUser.id,
          busname: currentUser.busname,
          email: data.email || currentUser.email,
          name: data.name || '',
          department: data.department || '',
          rollno: data.rollno || '',
          stop: data.stop || '',
          route: data.route || '',
          fare: typeof data.fare === 'number' ? data.fare : 0,
          paymentStatus: !!data.paymentStatus,
          lastPaymentDate: data.lastPaymentDate || null,
          role: data.role || 'student',
          photo: data.photo || null,
        };
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setPaymentWindowOpen(true); 
        setIsOverdue(DateUtils.isPaymentOverdue(user.lastPaymentDate, user.paymentStatus));

        // Fetch bus pass for current month/year
        const now = new Date();
        const q = query(
          collection(db, 'busPasses'),
          where('studentId', '==', currentUser.id), // match stored field
          where('month', '==', now.getMonth() + 1),
          where('year', '==', now.getFullYear())
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setBusPass(snapshot.docs[0].data() as BusPass);
        } else {
          setBusPass(null);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  // Create bus pass
  async function generateBusPassForUser() {
    try {
      const paymentDate = new Date();
      const validFrom = paymentDate;
      const validTo = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0);

      const pass: BusPass = {
        studentId: currentUser.id,
        studentName: currentUser.name,
        busname: currentUser.busname,
        validFrom: validFrom.toISOString().split('T')[0],
        validTo: validTo.toISOString().split('T')[0],
        month: paymentDate.getMonth() + 1,
        year: paymentDate.getFullYear()
      };

      await UserService.addBusPass(pass);
      setBusPass(pass);
    } catch (err) {
      console.error('Error creating bus pass:', err);
    }
  }

  // Auto-generate bus pass if payment already done
  useEffect(() => {
    if (currentUser?.paymentStatus && !busPass) {
      generateBusPassForUser();
    }
  }, [currentUser, busPass]);

  if (!currentUser) return null;

  const getPaymentStatusColor = () => {
    if (currentUser.paymentStatus) return 'text-green-600';
    if (isOverdue) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getPaymentStatusText = () => {
    if (currentUser.paymentStatus) return 'Paid';
    if (isOverdue) return 'Overdue';
    return 'Pending';
  };

  const getPaymentStatusIcon = () => {
    if (currentUser.paymentStatus) return <CheckCircle className="h-5 w-5" />;
    if (isOverdue) return <XCircle className="h-5 w-5" />;
    return <Clock className="h-5 w-5" />;
  };





  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-3 justify-center sm:justify-start">
              <div className="bg-white rounded-lg p-2 flex items-center justify-center">
                <img src={tceLogo} alt="TCE Logo" className="h-10 w-10 object-cover rounded-full border border-blue-200 shadow-sm bg-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-sm text-gray-500">Bus Pass Payment System</p>
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
              <form onSubmit={handleChangePassword} className="space-y-4">
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
                <div className="text-xs text-gray-500 mb-2">Password must be at least 6 characters.</div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {currentUser.name}!</h2>
          <p className="text-blue-100">Manage your bus pass payments and view your travel information.</p>
        </div>

        {/* Payment Status Alert */}
        {!paymentWindowOpen && !currentUser.paymentStatus && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Payment Window Closed</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  The payment window (1st-5th of month) is currently closed. 
                  Next payment window: {DateUtils.getNextPaymentWindow()}
                </p>
              </div>
            </div>
          </div>
        )}

        {isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Payment Overdue</h3>
                <p className="text-red-700 text-sm mt-1">
                  Your payment is overdue. Please contact administration or wait for the next payment window.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="mt-1 text-gray-900 font-medium">{currentUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-gray-900">{currentUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Department</label>
                    <p className="mt-1 text-gray-900">{currentUser.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Bus Name</label>
                    <p className="mt-1 text-gray-900">{currentUser.busname}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Roll No</label>
                    <div className="mt-1 flex items-center">
                      <div className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900 -ml-4">{currentUser.rollno}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Bus Stop</label>
                    <div className="mt-1 flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{currentUser.stop}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Route</label>
                    <p className="mt-1 text-gray-900 capitalize">{currentUser.route}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route & Fare Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Route & Fare Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Fare</p>
                      <p className="text-2xl font-bold text-blue-600 flex items-center mt-1">
                        <IndianRupee className="h-5 w-5" />
                        {currentUser.fare.toLocaleString()}
                      </p>
                    </div>
                    <Bus className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Route Type</p>
                      <p className="text-lg font-semibold text-green-600 mt-1 capitalize">
                        {currentUser.route}
                      </p>
                    </div>
                    <MapPin className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* Payment Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                Payment Status
                <button
                  onClick={fetchLatestUser}
                  disabled={refreshing}
                  className="ml-auto flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  title="Refresh payment status"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </h3>

              <div className={`flex items-center space-x-2 mb-4 ${getPaymentStatusColor()}`}>
                {getPaymentStatusIcon()}
                <span className="font-semibold">{getPaymentStatusText()}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Payment</label>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">
                      {DateUtils.formatDate(currentUser.lastPaymentDate || '')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Amount Due</label>
                  <p className="text-2xl font-bold text-gray-900 flex items-center mt-1">
                    <IndianRupee className="h-5 w-5" />
                    {currentUser.paymentStatus ? '0' : currentUser.fare.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Payment Button */}
              {paymentWindowOpen && !currentUser.paymentStatus && (
                <>
                  <button
                    onClick={() => setShowPolicyModal(true)}
                    disabled={loading}
                    className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>{loading ? 'Processing...' : 'Pay Now'}</span>
                  </button>

                  {/* Policy Modal */}
                  {showPolicyModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                        <button
                          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                          onClick={() => { setShowPolicyModal(false); setPolicyAccepted(false); }}
                          aria-label="Close"
                        >&times;</button>
                        <h2 className="text-xl font-bold mb-4 text-center text-blue-700">Refund & Cancellation Policy</h2>
                        <div className="text-sm text-gray-700 mb-6 space-y-2 max-h-48 overflow-y-auto border p-3 rounded">
  <p><strong>1. Cancellations</strong><br />Once a payment is successfully completed through the App, it cannot be canceled under any circumstances.</p>
  
  <p><strong>2. Refund Policy</strong><br />TCE has a strict no-refund policy upon successful payment. No refunds will be issued for any reason once the transaction is completed.</p>
  
  <p><strong>3. Exceptions</strong><br />There are no exceptions to the cancellation or refund policy. Users are requested to carefully verify all details before making a payment.</p>
  
  <p><strong>4. Contact</strong><br />For queries or payment-related issues, please contact the TCE Transport Office or email: <a href="mailto:transport@gen.tce.edu" className="text-blue-600 underline">transport@gen.tce.edu</a></p>
</div>

                        <h2 className="text-xl font-bold mb-4 text-center text-green-700">Delivery & Fulfillment Policy</h2>
                        <div className="text-sm text-gray-700 mb-6 space-y-2 max-h-48 overflow-y-auto border p-3 rounded">
                          <p><strong>1. Nature of Service</strong><br />This App does not facilitate physical goods delivery. Instead, it processes digital service transactions related to staff bus fare payments.</p>
                          <p><strong>2. Fulfillment Timeline</strong><br />Upon successful completion of payment, your transaction is considered fulfilled.<br />A digital receipt is automatically generated and made available within the App and/or sent to your registered email address.</p>
                          <p><strong>3. Confirmation of Service</strong><br />The availability of the receipt and the updated transaction history within the App constitutes proof of service delivery.<br />Users may access their full payment history at any time via their account dashboard.</p>
                          <p><strong>4. Failed or Incomplete Transactions</strong><br />If a payment fails, it will be refunded to your original payment method.<br />Contact: <a href="mailto:transport@gen.tce.edu" className="text-blue-600 underline">transport@gen.tce.edu</a> or +91 452 2482240.</p>
                        </div>
                        <div className="flex items-center mb-4">
                          <input
                            type="checkbox"
                            id="policyAccept"
                            checked={policyAccepted}
                            onChange={e => setPolicyAccepted(e.target.checked)}
                            className="mr-2 h-4 w-4"
                          />
                          <label htmlFor="policyAccept" className="text-sm text-gray-800">I have read and accept the Refund & Cancellation Policy and Service Fulfillment Policy.</label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                            onClick={() => { setShowPolicyModal(false); setPolicyAccepted(false); }}
                          >Cancel</button>
                          <button
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!policyAccepted || loading}
                            onClick={handlePayment}
                          >{loading ? 'Processing...' : 'Continue & Pay'}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {currentUser.paymentStatus && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Payment Complete</span>
                  </div>
                  {busPass && (
                    <div className="mt-4 p-4 bg-white border border-green-300 rounded-lg shadow">
                      <h4 className="text-lg font-bold text-green-700 mb-2">Bus Pass</h4>
                      <div className="text-gray-800 text-sm">
                        <div><strong>Name:</strong> {busPass.studentName}</div>
                        <div><strong>Valid From:</strong> {DateUtils.formatDate(busPass.validFrom)}</div>
                        <div><strong>Valid To:</strong> {DateUtils.formatDate(busPass.validTo)}</div>
                        <div><strong>Valid Month:</strong> {busPass.month}/{busPass.year}</div>
                      <div className="mt-2">
                        {/* QR code and link now point to /verify?email=... for verification */}
                        <a href={`/verify?email=${currentUser.email}`} target="_blank" rel="noopener noreferrer">
                          <QRCode value={`${window.location.origin}/verify?email=${currentUser.email}`} size={100} />
                        </a>
                        <div className="text-xs text-gray-500 mt-1">
                          Scan QR or <a href={`/verify?email=${currentUser.email}`} target="_blank" className="text-blue-600 underline">click here</a> for verification
                        </div>
                      </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">Pass will be removed after this month.</div>
                      <div className="mt-4 flex space-x-2">
                       




<button
  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
  onClick={async () => {
    if (!busPass || !currentUser) {
      console.error("Bus pass data or current user data is not available.");
      return;
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [250, 150], // ID card size
    });

    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    const margin = 10;

    // Border
    pdf.setDrawColor(100);
    pdf.setLineWidth(1);
    pdf.rect(margin, margin, width - 2 * margin, height - 2 * margin);

    // Logo
    pdf.addImage(tceLogo, "PNG", margin + 2, margin + 2, 30, 30);

    // Heading
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(
      "THIAGARAJAR COLLEGE OF ENGINEERING",
      width / 2 + 12,
      margin + 10,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Madurai – 15", width / 2 + 12, margin + 20, { align: "center" });

    pdf.setFontSize(7);
    pdf.text(
      "(Affiliated to Anna University)",
      width / 2 + 10,
      margin + 30,
      { align: "center" }
    );

    // Student details
    let textY = 60;
    pdf.setFontSize(7.5);
    pdf.text(`Bus Name: ${currentUser.busname}`, margin + 10, textY);
    textY += 12;
    pdf.text(`Name: ${busPass.studentName}`, margin + 10, textY);
    textY += 12;
    pdf.text(`Dept: ${currentUser.department}`, margin + 10, textY);
    textY += 12;
    pdf.text(`Email: ${currentUser.email}`, margin + 10, textY);
    textY += 12;
    pdf.text(`Route: ${currentUser.route}`, margin + 10, textY);
    textY += 12;
    pdf.text(`Stop: ${currentUser.stop}`, margin + 10, textY);
    textY += 12;
    pdf.text(`Valid: ${busPass.month}/${busPass.year}`, margin + 10, textY);

    // ===== PHOTO (from Cloudinary) =====
    const photoUrl = currentUser.photo; // Cloudinary URL stored in DB
    console.log("Loading photo:", photoUrl);

    const photoWidth = 45;
    const photoHeight = 55;
    const photoX = width - margin - photoWidth - 10;
    const photoY = margin + 30;

    if (photoUrl) {
      try {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);

        await new Promise<void>((resolve, reject) => {
          reader.onloadend = () =>
            reader.result ? resolve() : reject(new Error("Photo reader result is null."));
          reader.onerror = reject;
        });

        const imageDataUrl = reader.result as string;
        let format = "JPEG";
        if (imageDataUrl.startsWith("data:image/png")) format = "PNG";
        else if (imageDataUrl.startsWith("data:image/webp")) format = "WEBP";

        pdf.addImage(imageDataUrl, format, photoX, photoY, photoWidth, photoHeight, undefined, "FAST");
      } catch (error) {
        pdf.setFontSize(6);
        pdf.setTextColor("#ff0000");
        pdf.text("Photo Load Error", photoX, photoY + photoHeight / 2);
        pdf.setTextColor("#000000");
      }
    } else {
      pdf.setFontSize(6);
      pdf.setTextColor("#666666");
      pdf.text("No Photo", photoX, photoY + photoHeight / 2);
      pdf.setTextColor("#000000");
    }

    // ===== QR Code =====
    const qrValue = `${window.location.origin}/verify?email=${currentUser.email}`;
    const qrCanvas = document.createElement("canvas");
    await QRCodeLib.toCanvas(qrCanvas, qrValue, { width: 50, margin: 1 });
    const qrDataUrl = qrCanvas.toDataURL("image/png");
    pdf.addImage(qrDataUrl, "PNG", width - 50, height - 50, 35, 35);

    // Footer + Save
    pdf.setFontSize(6);
    pdf.setTextColor("#666666");

    pdf.save(`BusPass_${busPass.studentName}_${busPass.month}_${busPass.year}.pdf`);
  }}
>
  Download
</button>

                        {/* <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          onClick={() => window.print()}
                        >Print</button> */}
                        {/* Hidden printable bus pass for PDF generation */}
                        <div id="bus-pass-pdf" style={{ position: 'absolute', left: '-9999px', top: 0, background: '#fff', width: 400, padding: 24, borderRadius: 12, fontFamily: 'Arial, sans-serif', boxShadow: '0 0 8px #ccc' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={tceLogo} alt="TCE Logo" style={{ width: 80, marginBottom: 12 }} />
                            <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0, color: '#1e293b' }}>Thiagarajar College of Engineering</h2>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Bus Pass</div>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <strong>Name:</strong> {busPass.studentName}<br />
                            <strong>Valid From:</strong> {DateUtils.formatDate(busPass.validFrom)}<br />
                            <strong>Valid To:</strong> {DateUtils.formatDate(busPass.validTo)}<br />
                            <strong>Valid Month:</strong> {busPass.month}/{busPass.year}<br />
                          </div>
                          <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
                            <QRCode value={`${window.location.origin}/verify?email=${currentUser.email}`} size={90} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Window Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                Payment Window
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Current Status</label>
                  <p className={`mt-1 font-medium ${paymentWindowOpen ? 'text-green-600' : 'text-red-600'}`}>
                    {paymentWindowOpen ? 'Open (1st-5th)' : 'Closed'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Next Window</label>
                  <p className="mt-1 text-gray-900 text-sm">
                    {DateUtils.getNextPaymentWindow()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;