import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, LogOut, User, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!auth.currentUser || !auth.currentUser.email) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      setSuccess('Password successfully changed!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Purana password galat hai.');
      } else if (err.code === 'auth/weak-password') {
        setError('Naya password kam se kam 6 characters ka hona chahiye.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="p-4 h-full flex flex-col overflow-y-auto bg-slate-50 pb-24">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Wapas Jayein
      </button>

      <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg ring-4 ring-white relative z-10 mb-5">
          {userInitial}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 relative z-10">{user?.name}</h1>
        <p className="text-slate-500 flex items-center gap-2 mt-2 relative z-10 font-medium">
          <User className="w-4 h-4" />
          {user?.email}
        </p>
      </div>

      {auth.currentUser?.providerData[0]?.providerId === 'password' && (
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-50 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
            >
              <Lock className="w-5 h-5" />
              Change Password
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-600" />
                  Password Badlein
                </h2>
                <button 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setError('');
                    setSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-md flex items-start gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purana Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Naya Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !currentPassword || !newPassword}
                  className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Badal raha hai...' : 'Password Update Karein'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm"
      >
        <LogOut className="w-5 h-5" />
        Logout Karein
      </button>

      <div className="mt-auto pt-8 pb-4 text-center">
        <p className="text-slate-400 font-medium tracking-wide text-sm">By @KKG</p>
      </div>
    </div>
  );
}
