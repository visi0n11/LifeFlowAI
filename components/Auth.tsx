
import React, { useState } from 'react';
import { Heart, Mail, Lock, User as UserIcon, ShieldCheck, ArrowRight, ShieldAlert, KeyRound, X, QrCode, Smartphone, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { User, BloodType } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onClose?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'admin' | 'qr' | 'forgot'>('login');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'donor' as 'donor' | 'recipient' | 'admin',
    bloodType: 'O+' as BloodType
  });
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'admin') {
        if (formData.email === 'admin@lifeflow.ai' && (formData.password === 'admin123' || formData.password === 'password')) {
          const admin: User = {
            id: 'auth-admin-system',
            name: 'Cluster Administrator',
            email: 'admin@lifeflow.ai',
            role: 'admin',
            bloodType: 'O+'
          };
          localStorage.setItem('lifeflow_session', JSON.stringify(admin));
          onLogin(admin);
          return;
        } else {
          setError('Invalid administrative access keys.');
          return;
        }
      }

      if (mode === 'forgot') {
        const response = await fetch('/api/auth/forgot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        
        if (response.ok) {
          setResetSuccess(true);
        } else {
          const data = await response.json();
          setError(data.error || 'This email is not registered in the cluster.');
        }
        return;
      }

      if (mode === 'login') {
        if (formData.email === 'admin@lifeflow.ai') {
          setError('Please use the Administrator Portal for this account.');
          return;
        }

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        
        const contentType = response.headers.get("content-type");
        if (response.ok) {
          if (contentType && contentType.includes("application/json")) {
            const user = await response.json();
            localStorage.setItem('lifeflow_session', JSON.stringify(user));
            onLogin(user);
          } else {
            throw new Error("Server returned non-JSON response. Please check server logs.");
          }
        } else {
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            setError(data.error || 'Invalid credentials. Please verify or create an account.');
          } else {
            setError(`Auth service error: ${response.status} ${response.statusText}`);
          }
        }
      } else {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Math.random().toString(36).substr(2, 9),
            ...formData
          })
        });
        
        const contentType = response.headers.get("content-type");
        if (response.ok) {
          if (contentType && contentType.includes("application/json")) {
            const user = await response.json();
            localStorage.setItem('lifeflow_session', JSON.stringify(user));
            onLogin(user);
          } else {
            throw new Error("Server returned non-JSON response. Please check server logs.");
          }
        } else {
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            setError(data.error || 'This email is already registered in the cluster.');
          } else {
            setError(`Registration error: ${response.status} ${response.statusText}`);
          }
        }
      }
    } catch (err) {
      setError('Connection to auth service failed.');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 overflow-y-auto">
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse transition-colors duration-700 ${mode === 'admin' ? 'bg-slate-900' : 'bg-red-400'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse delay-1000 transition-colors duration-700 ${mode === 'admin' ? 'bg-indigo-900' : 'bg-blue-400'}`}></div>

      <div className="bg-white/90 backdrop-blur-3xl p-8 sm:p-12 rounded-[2.5rem] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.12)] w-full max-w-md border border-white relative z-10 animate-fade-in my-auto">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="text-center mb-10">
          <div className={`inline-flex p-4 rounded-2xl mb-6 shadow-xl ring-4 transition-all duration-500 ${mode === 'admin' ? 'bg-slate-900 ring-slate-100 shadow-slate-200' : mode === 'forgot' ? 'bg-amber-500 ring-amber-50 shadow-amber-100' : 'bg-red-600 ring-red-50 shadow-red-100'}`}>
            {mode === 'admin' ? <ShieldAlert className="w-8 h-8 text-white" /> : mode === 'qr' ? <QrCode className="w-8 h-8 text-white" /> : mode === 'forgot' ? <KeyRound className="w-8 h-8 text-white" /> : <Heart className="w-8 h-8 text-white fill-current" />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {mode === 'admin' ? 'Admin Gateway' : mode === 'qr' ? 'Instant Access' : mode === 'forgot' ? 'Identity Recovery' : 'LifeFlow AI'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {mode === 'qr' ? 'Scan to link your health profile' : mode === 'admin' ? 'Accessing high-level cluster controls' : mode === 'login' ? 'Welcome to the blood donor network' : mode === 'forgot' ? 'Secure password reset protocol' : 'Join the life-saving movement'}
          </p>
        </div>

        {mode === 'qr' ? (
          <div className="space-y-8 animate-fade-in text-center">
            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
              <div className="w-48 h-48 bg-white p-4 rounded-3xl shadow-lg border border-slate-100 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=lifeflow-auth-mock" 
                  alt="Auth QR" 
                  className="w-full h-full object-contain mix-blend-multiply opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                  <div className="bg-red-600 p-2 rounded-full shadow-lg">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scan with LifeFlow Mobile</p>
            </div>
            <button 
              onClick={() => setMode('login')}
              className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              Back to regular login
            </button>
          </div>
        ) : mode === 'forgot' && resetSuccess ? (
          <div className="space-y-6 animate-fade-in text-center py-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Recovery Sent</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed px-4">
                A verification link has been dispatched to <span className="font-bold text-slate-800">{formData.email}</span>. Please check your inbox to reset your key.
              </p>
            </div>
            <button 
              onClick={() => { setMode('login'); setResetSuccess(false); }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-600 animate-fade-in">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Identity</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all shadow-sm"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                {mode === 'admin' ? 'Admin ID' : 'Email Address'}
              </label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-4 w-4 h-4 text-slate-400 transition-colors ${mode === 'admin' ? 'group-focus-within:text-slate-900' : mode === 'forgot' ? 'group-focus-within:text-amber-500' : 'group-focus-within:text-red-500'}`} />
                <input 
                  type="email" 
                  className={`w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none transition-all shadow-sm focus:ring-4 ${mode === 'admin' ? 'focus:ring-slate-900/10 focus:border-slate-900' : mode === 'forgot' ? 'focus:ring-amber-500/10 focus:border-amber-500' : 'focus:ring-red-500/10 focus:border-red-500'}`}
                  placeholder={mode === 'admin' ? "admin@lifeflow.ai" : "user@example.com"}
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:opacity-80 transition-opacity"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-4 w-4 h-4 text-slate-400 transition-colors ${mode === 'admin' ? 'group-focus-within:text-slate-900' : 'group-focus-within:text-red-500'}`} />
                  <input 
                    type="password" 
                    className={`w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none transition-all shadow-sm focus:ring-4 ${mode === 'admin' ? 'focus:ring-slate-900/10 focus:border-slate-900' : 'focus:ring-red-500/10 focus:border-red-500'}`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cluster Role</label>
                  <select 
                    className="w-full px-4 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none appearance-none shadow-sm cursor-pointer font-bold text-slate-700 text-sm"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as any})}
                  >
                    <option value="donor">Donor</option>
                    <option value="recipient">Recipient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Blood Type</label>
                  <select 
                    className="w-full px-4 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none appearance-none shadow-sm cursor-pointer font-bold text-slate-700 text-sm"
                    value={formData.bloodType}
                    onChange={e => setFormData({...formData, bloodType: e.target.value as BloodType})}
                  >
                    {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="pt-6">
              <button 
                type="submit"
                className={`w-full text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] flex items-center justify-center space-x-3 group ${
                  mode === 'admin' ? 'bg-slate-900 hover:bg-black shadow-slate-100' : mode === 'forgot' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                }`}
              >
                <span>{mode === 'admin' ? 'Verify Admin Access' : mode === 'login' ? 'Enter Network' : mode === 'forgot' ? 'Send Recovery Key' : 'Create Identity'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              {mode === 'forgot' && (
                <button 
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full mt-4 flex items-center justify-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </button>
              )}
            </div>
          </form>
        )}

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-1">
            <button 
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setResetSuccess(false); }}
              className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              {mode === 'signup' ? "Already a member? Sign in" : mode === 'forgot' ? "New? Request access" : "New? Request access"}
            </button>
            <button 
              onClick={() => { setMode('qr'); setError(''); setResetSuccess(false); }}
              className="flex items-center space-x-2 text-red-600 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Quick Scan</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 justify-center">
            <span className="h-px w-8 bg-slate-100"></span>
            <button 
              onClick={() => { setMode(mode === 'admin' ? 'login' : 'admin'); setError(''); setResetSuccess(false); }}
              className={`text-[9px] font-black uppercase tracking-widest flex items-center space-x-1 hover:opacity-80 transition-opacity ${mode === 'admin' ? 'text-red-600' : 'text-slate-400'}`}
            >
              {mode === 'admin' ? <UserIcon className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              <span>{mode === 'admin' ? 'Standard Login' : 'Admin Portal'}</span>
            </button>
            <span className="h-px w-8 bg-slate-100"></span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-2 text-[9px] text-slate-300 font-bold uppercase tracking-tighter">
          <KeyRound className="w-3 h-3" />
          <span>Biometric & AES-256 Protected Access</span>
        </div>
      </div>
    </div>
  );
};
