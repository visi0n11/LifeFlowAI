import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Shield, Droplet } from 'lucide-react';
import { User, BloodType } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onClose: () => void;
}

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const Auth: React.FC<AuthProps> = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'donor' | 'recipient' | 'admin'>('donor');
  const [bloodType, setBloodType] = useState<BloodType>('O+');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Mock login logic
      const mockUsers: Record<string, User> = {
        'vaghu@example.com': { id: '1', name: 'Vaghu', email: 'vaghu@example.com', role: 'admin', bloodType: 'O+' },
        'aayan@example.com': { id: '2', name: 'Aayan', email: 'aayan@example.com', role: 'donor', bloodType: 'B-' },
        'akash@example.com': { id: '3', name: 'Akash', email: 'akash@example.com', role: 'donor', bloodType: 'AB+' },
        'shreyash@example.com': { id: '4', name: 'Shreyash', email: 'shreyash@example.com', role: 'donor', bloodType: 'O+' },
      };

      const user = mockUsers[email.toLowerCase()];
      if (user) {
        onLogin(user);
      } else {
        // Allow any email for demo purposes if not in mock list
        onLogin({
          id: Math.random().toString(36).substr(2, 9),
          name: email.split('@')[0],
          email: email,
          role: 'donor',
          bloodType: 'A+'
        });
      }
    } else {
      // Mock registration
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        return;
      }
      onLogin({
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
        bloodType
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl animate-fade-in overflow-hidden border border-slate-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-100">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
              {isLogin ? 'Secure Login' : 'Create Account'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-shake">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800" 
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                required 
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800" 
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                required 
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Role</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                >
                  <option value="donor">Donor</option>
                  <option value="recipient">Recipient</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Blood Type</label>
                <div className="relative">
                  <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  <select 
                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
                    value={bloodType}
                    onChange={e => setBloodType(e.target.value as BloodType)}
                  >
                    {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isLogin ? 'Sign In to Network' : 'Create Secure Account'}
          </button>

          <div className="text-center">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
