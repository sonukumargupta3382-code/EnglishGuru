import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BookOpen, AlertCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Ye email pehle se use ho raha hai.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password kam se kam 6 characters ka hona chahiye.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Firebase Console me Email/Password aur Google Sign-in enable karna padega. (Authentication > Sign-in method)');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-center bg-slate-50 p-6 overflow-y-auto">
      <div className="w-full space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 my-auto">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Naya Account Banayein
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Bilkul free me English seekhna shuru karein!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Aapka Naam</label>
              <input
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="KKG"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="aapka@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password Banayein</label>
              <input
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors shadow-md"
          >
            {loading ? 'Account ban raha hai...' : 'Account Banayein'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Pahle se account hai?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Login karein
          </Link>
        </p>
      </div>
    </div>
  );
}
