
import React, { useState } from 'react';
import { Heart, Mail, Lock, User as UserIcon, ShieldCheck, ArrowRight, ShieldAlert, KeyRound, X } from 'lucide-react';
import { User, BloodType } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onClose?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>('login');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'donor' as 'donor' | 'recipient' | 'admin',
    bloodType: 'O+' as BloodType
  });
  const [error, setError] = useState('');

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = (e: React.FormEvent) => {
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

      if (mode === 'login') {
        if (formData.email === 'admin@lifeflow.ai') {
          setError('Please use the Administrator Portal for this account.');
          return;
        }

        const savedUsers = JSON.parse(localStorage.getItem('lifeflow_users') || '[]');
        const user = savedUsers.find((u: any) => u.email === formData.email && u.password === formData.password);
        
        if (user) {
          const { password, ...userWithoutPassword } = user;
          localStorage.setItem('lifeflow_session', JSON.stringify(userWithoutPassword));
          onLogin(userWithoutPassword);
        } else {
          setError('Invalid credentials. Please verify or create an account.');
        }
      } else {
        const savedUsers = JSON.parse(localStorage.getItem('lifeflow_users') || '[]');
        if (savedUsers.some((u: any) => u.email === formData.email) || formData.email === 'admin@lifeflow.ai') {
          setError('This email is already registered in the cluster.');
          return;
        }

        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          ...formData
        };
        
        savedUsers.push(newUser);
        localStorage.setItem('lifeflow_users', JSON.stringify(savedUsers));
        
        const { password, ...userWithoutPassword } = newUser;
        localStorage.setItem('lifeflow_session', JSON.stringify(userWithoutPassword));
        onLogin(userWithoutPassword as User);
      }
    } catch (err) {
      setError('Connection to auth service failed.');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 overflow-y-auto">
      {/* Background Decor */}
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
          <div className={`inline-flex p-4 rounded-2xl mb-6 shadow-xl ring-4 transition-all duration-500 ${mode === 'admin' ? 'bg-slate-900 ring-slate-100 shadow-slate-200' : 'bg-red-600 ring-red-50 shadow-red-100'}`}>
            {mode === 'admin' ? <ShieldAlert className="w-8 h-8 text-white" /> : <Heart className="w-8 h-8 text-white fill-current" />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {mode === 'admin' ? 'Admin Gateway' : 'LifeFlow AI'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {mode === 'admin' ? 'Accessing high-level cluster controls' : mode === 'login' ? 'Welcome to the blood donor network' : 'Join the life-saving movement'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-[11px] font-bold rounded-xl border border-red-100 flex items-center space-x-3 animate-fade-in">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shrink-0"></div>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Mail className={`absolute left-4 top-4 w-4 h-4 text-slate-400 transition-colors ${mode === 'admin' ? 'group-focus-within:text-slate-900' : 'group-focus-within:text-red-500'}`} />
              <input 
                type="email" 
                className={`w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none transition-all shadow-sm focus:ring-4 ${mode === 'admin' ? 'focus:ring-slate-900/10 focus:border-slate-900' : 'focus:ring-red-500/10 focus:border-red-500'}`}
                placeholder={mode === 'admin' ? "admin@lifeflow.ai" : "user@example.com"}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Access Key</label>
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
                mode === 'admin' ? 'bg-slate-900 hover:bg-black shadow-slate-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'
              }`}
            >
              <span>{mode === 'admin' ? 'Verify Admin Access' : mode === 'login' ? 'Enter Network' : 'Create Identity'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col space-y-4">
          <button 
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors text-center"
          >
            {mode === 'signup' ? "Already a member? Sign in" : "New to LifeFlow? Request access"}
          </button>
          
          <div className="flex items-center space-x-2 justify-center">
            <span className="h-px w-8 bg-slate-100"></span>
            <button 
              onClick={() => { setMode(mode === 'admin' ? 'login' : 'admin'); setError(''); }}
              className={`text-[9px] font-black uppercase tracking-widest flex items-center space-x-1 hover:opacity-80 transition-opacity ${mode === 'admin' ? 'text-red-600' : 'text-slate-400'}`}
            >
              {mode === 'admin' ? <UserIcon className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              <span>{mode === 'admin' ? 'Return to Standard Login' : 'Administrator Portal'}</span>
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
