// 
//  Project: TCE Staff Bus Payment Web App
//  Developed by:
//    Jovin J - B.tech IT,TCE jovinjeffin@gmail.com, (Phone No: 8925228892) 
//    Aswinkumar I - B.tech IT,TCE tceaswin@gmail.com, (Phone No: 8825558350) 
//    Praveen S - B.tech IT,TCE spraveen2666@gmail.com, (Phone No: 6381622037)    
//    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import tceLogo from './tcelogo.png';
import toast from 'react-hot-toast';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login successful!');
        // Navigate based on role (will be handled by the auth context)
        if (email.includes('admin')) {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials function removed for production

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white bg-opacity-20 rounded-full p-3 flex items-center justify-center">
                <img
                  src={tceLogo}
                  alt="TCE Logo"
                  className="h-16 w-16 object-cover rounded-full border-2 border-blue-200 shadow-md bg-white"
                  style={{ aspectRatio: '1/1' }}
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">TCE Bus Pass</h1>
            <p className="text-blue-100">Student Payment System</p>
          </div>

          {/* Login Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              <p className="text-center mt-3">
  Not registered?{' '}
  <button
    onClick={() => navigate('/register')}
    className="text-blue-500 hover:underline"
  >
    Register here
  </button>
</p>


              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>


              <div className="flex items-center mt-4">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600 select-none">
                  I accept the
                  <a
                    href="/terms.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline mx-1"
                  >Terms &amp; Conditions and Privacy Policy</a>
                </label>
              </div>
            </form>

            {/* Demo Credentials removed for production */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;