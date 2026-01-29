
import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Users, 
  Droplet, 
  Activity, 
  MessageSquare, 
  Home, 
  Info, 
  FileText, 
  Menu, 
  X,
  CheckCircle,
  LogOut,
  Send,
  Plus,
  Cloud,
  Database,
  RefreshCw,
  Search,
  Bell,
  Trash2,
  ShieldCheck,
  Globe,
  LogIn,
  Lock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Auth } from './components/Auth';
import { getAIChatResponse } from './services/geminiService';
import { User, Donor, Recipient, BloodBag, BloodType } from './types';

// --- Constants ---
const COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6'];
const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const recipientCompatibility: Record<string, string[]> = {
    "O-": ["O-"],
    "O+": ["O+", "O-"],
    "A-": ["A-", "O-"],
    "A+": ["A+", "A-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"]
};

// --- Initial Mock Data (Reflecting Requested Demo Users) ---
const initialDonors: Donor[] = [
  { id: 1, name: "Vaghu", age: 24, bloodType: "O+", contact: "9870000101", lastDonation: "2024-02-15" },
  { id: 2, name: "Aayan", age: 22, bloodType: "B-", contact: "9870000102", lastDonation: "2024-03-01" },
  { id: 3, name: "Akash", age: 25, bloodType: "AB+", contact: "9870000103", lastDonation: "2024-01-20" },
  { id: 4, name: "Shreyash", age: 23, bloodType: "O+", contact: "9870000104", lastDonation: "2024-03-10" },
];

const initialRecipients: Recipient[] = [
  { id: 1, name: "Sahil Mane", age: 29, bloodType: "O+", contact: "9988776655", condition: "Surgery Recovery" },
  { id: 2, name: "Priya Patil", age: 34, bloodType: "AB+", contact: "9988776644", condition: "Anemia Treatment" },
];

const initialBags: BloodBag[] = [
  { id: 1, type: "O+", volume: "450ml", donationDate: "2024-03-12", expiryDate: "2024-04-23" },
  { id: 2, type: "B-", volume: "450ml", donationDate: "2024-03-05", expiryDate: "2024-04-16" },
  { id: 3, type: "AB+", volume: "450ml", donationDate: "2024-01-25", expiryDate: "2024-03-08" },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{text: string, sender: 'user' | 'bot'}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error'>('connected');
  
  const chatRef = useRef<HTMLDivElement>(null);
  const chatToggleRef = useRef<HTMLButtonElement>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const [donors, setDonors] = useState<Donor[]>(() => {
    try {
      const saved = localStorage.getItem('lifeflow_donors');
      return saved ? JSON.parse(saved) : initialDonors;
    } catch (e) {
      return initialDonors;
    }
  });
  
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    try {
      const saved = localStorage.getItem('lifeflow_recipients');
      return saved ? JSON.parse(saved) : initialRecipients;
    } catch (e) {
      return initialRecipients;
    }
  });
  
  const [bags, setBags] = useState<BloodBag[]>(() => {
    try {
      const saved = localStorage.getItem('lifeflow_bags');
      return saved ? JSON.parse(saved) : initialBags;
    } catch (e) {
      return initialBags;
    }
  });

  const [matchResult, setMatchResult] = useState<Donor | null>(null);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isBagModalOpen, setIsBagModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newDonor, setNewDonor] = useState({ name: '', age: '', bloodType: 'A+' as BloodType, contact: '' });
  const [newRequest, setNewRequest] = useState({ name: '', bloodType: '' as BloodType | '', condition: '' });
  const [newBag, setNewBag] = useState({ type: 'A+' as BloodType, volume: '450ml' });

  useEffect(() => {
    localStorage.setItem('lifeflow_donors', JSON.stringify(donors));
    setDbStatus('syncing');
    const timer = setTimeout(() => setDbStatus('connected'), 600);
    return () => clearTimeout(timer);
  }, [donors]);

  useEffect(() => {
    localStorage.setItem('lifeflow_recipients', JSON.stringify(recipients));
    setDbStatus('syncing');
    const timer = setTimeout(() => setDbStatus('connected'), 600);
    return () => clearTimeout(timer);
  }, [recipients]);

  useEffect(() => {
    localStorage.setItem('lifeflow_bags', JSON.stringify(bags));
    setDbStatus('syncing');
    const timer = setTimeout(() => setDbStatus('connected'), 600);
    return () => clearTimeout(timer);
  }, [bags]);

  useEffect(() => {
    const savedUser = localStorage.getItem('lifeflow_session');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem('lifeflow_session'); }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isChatOpen &&
        chatRef.current && 
        !chatRef.current.contains(event.target as Node) &&
        chatToggleRef.current && 
        !chatToggleRef.current.contains(event.target as Node)
      ) {
        setIsChatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isChatOpen]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogout = () => {
    localStorage.removeItem('lifeflow_session');
    setCurrentUser(null);
    setActiveTab('home');
    showToast('Signed out successfully', 'info');
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const findBestMatch = (bloodType: BloodType) => {
    const compatibleTypes = recipientCompatibility[bloodType] || [];
    const possibleDonors = donors.filter(d => compatibleTypes.includes(d.bloodType));
    setMatchResult(possibleDonors.length > 0 ? possibleDonors[0] : null);
  };

  const handleAddDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDonor.contact.length !== 10) {
      showToast('Contact number must be exactly 10 digits', 'info');
      return;
    }
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const donor: Donor = {
      id: Date.now(),
      name: newDonor.name,
      age: parseInt(newDonor.age) || 18,
      bloodType: newDonor.bloodType,
      contact: newDonor.contact,
      lastDonation: new Date().toISOString().split('T')[0]
    };
    setDonors(prev => [donor, ...prev]);
    setIsDonorModalOpen(false);
    setIsSaving(false);
    showToast(`Donor ${donor.name} registered successfully`);
    setNewDonor({ name: '', age: '', bloodType: 'A+', contact: '' });
  };

  const handleDeleteDonor = (id: number) => {
    const donor = donors.find(d => d.id === id);
    if (!donor) return;
    if (window.confirm(`Are you sure you want to remove ${donor.name} from the directory?`)) {
      setDonors(prev => prev.filter(d => d.id !== id));
      showToast(`Donor ${donor.name} removed`, 'info');
    }
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.name || !newRequest.bloodType) return;
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const request: Recipient = {
      id: Date.now(),
      name: newRequest.name,
      age: 30,
      bloodType: newRequest.bloodType as BloodType,
      contact: "System Generated",
      condition: newRequest.condition || "Emergency"
    };
    setRecipients(prev => [request, ...prev]);
    findBestMatch(request.bloodType);
    setIsSaving(false);
  };

  const handleAddBag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 42);

    const bag: BloodBag = {
      id: Date.now(),
      type: newBag.type,
      volume: newBag.volume,
      donationDate: today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0]
    };
    setBags(prev => [bag, ...prev]);
    setIsBagModalOpen(false);
    setIsSaving(false);
    showToast(`Blood bag ${bag.type} added to inventory`);
  };

  const handleDispatchBag = (id: number) => {
    const bag = bags.find(b => b.id === id);
    if (!bag) return;
    setBags(prev => prev.filter(b => b.id !== id));
    showToast(`Unit ${bag.type} (${bag.volume}) dispatched successfully`, 'info');
  };

  const handleNotifyDonor = () => {
    if (!matchResult) return;
    showToast(`Alert sent to ${matchResult.name} (${matchResult.contact})`, 'success');
    setMatchResult(null);
  };

  const handleAIChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setChatInput("");
    setIsTyping(true);
    const botReply = await getAIChatResponse(userMsg);
    setIsTyping(false);
    setChatMessages(prev => [...prev, { text: botReply, sender: 'bot' }]);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'donors', label: 'Donors', icon: Users },
    { id: 'recipients', label: 'Recipients', icon: Activity },
    { id: 'bloodbags', label: 'Inventory', icon: Droplet },
    { id: 'dashboard', label: 'Analytics', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isAuthOpen && (
        <Auth 
          onLogin={(user) => { 
            setCurrentUser(user); 
            setIsAuthOpen(false); 
            showToast(`Welcome back, ${user.name}!`);
          }} 
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {notification && (
        <div className="fixed top-20 right-4 z-[100] animate-fade-in">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            <span className="font-bold text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-red-600 p-1.5 rounded-lg shadow-sm">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <div className="flex flex-col">
               <span className="font-bold text-lg tracking-tight text-slate-800 leading-none">LifeFlow AI</span>
               <div className="flex items-center space-x-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Atlas Connected</span>
               </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button 
              ref={chatToggleRef}
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="relative p-2 text-slate-600 hover:text-red-600 transition-colors bg-slate-50 rounded-full"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
            </button>
            
            {currentUser ? (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-800 leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{currentUser.role} • {currentUser.bloodType}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-full">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center space-x-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login / Join</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {activeTab === 'home' && (
          <div className="space-y-12 animate-fade-in text-center py-12">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold tracking-widest uppercase border border-green-100">
              <Cloud className="w-3 h-3" />
              <span>AIBloodDonationcluster Synced</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 leading-tight">
              Connect. Donate.<br /><span className="text-red-600 underline decoration-red-200 underline-offset-8">Save Lives.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Experience real-time donor matching for <strong>Vaghu, Aayan, Akash, and Shreyash</strong>. Secure cloud-synced inventory tracking at your fingertips.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => setActiveTab('donors')} 
                className="px-10 py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
              >
                Become a Donor
              </button>
              <button 
                onClick={() => setActiveTab('bloodbags')} 
                className="px-10 py-4 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Check Availability
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
              {[
                { title: "Real-time Matching", desc: "Our AI cluster instantly connects donors with patients based on compatible blood groups.", icon: Activity },
                { title: "Smart Inventory", desc: "Live tracking of blood bags with expiry alerts and automated volume management.", icon: Droplet },
                { title: "Helper AI", desc: "Ask our assistant anything about eligibility, health rules, and compatibility.", icon: MessageSquare }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'donors' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Donor Directory</h2>
              <button onClick={() => setIsDonorModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Donor</span>
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Group</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Last Donation</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donors.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-800">{d.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">{d.bloodType}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{d.contact}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{d.lastDonation}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteDonor(d.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-full"
                          title="Delete Donor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'recipients' && (
          <div className="space-y-8 animate-fade-in">
             <div className="border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-800">AI Matching Center</h2>
              <p className="text-slate-500 text-sm mt-1">Connect patients with the cluster's compatible donors.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold mb-6 text-slate-800">New Match Request</h3>
                <form onSubmit={handleAddRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Recipient Name</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" 
                      placeholder="Enter patient name" 
                      value={newRequest.name}
                      onChange={e => setNewRequest({...newRequest, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Required Type</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                      value={newRequest.bloodType}
                      onChange={e => {
                        setNewRequest({...newRequest, bloodType: e.target.value as BloodType});
                        findBestMatch(e.target.value as BloodType);
                      }}
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <button 
                    disabled={isSaving}
                    type="submit" 
                    className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>{isSaving ? 'Scanning...' : 'Start Matching'}</span>
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {matchResult ? (
                  <div className="bg-green-50 border border-green-200 p-8 rounded-2xl flex items-start space-x-6 animate-fade-in">
                    <div className="p-4 bg-green-500 rounded-2xl shadow-lg shadow-green-100">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900 mb-1">Perfect Match Found!</h3>
                      <p className="text-green-700 mb-4 opacity-80">Our AI has located a compatible donor in the cluster.</p>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                          <p className="text-slate-400 font-bold uppercase text-[10px]">Donor Name</p>
                          <p className="text-slate-800 font-bold">{matchResult.name}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                          <p className="text-slate-400 font-bold uppercase text-[10px]">Compatible Group</p>
                          <p className="text-red-600 font-bold">{matchResult.bloodType}</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleNotifyDonor}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all flex items-center space-x-2"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Dispatch Alert</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <Activity className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">Run a scan to view AI-powered matching results.</p>
                  </div>
                )}
                
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-6">
                  <div className="p-4 border-b border-slate-100 font-bold text-slate-800">Pending Requests</div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {recipients.length > 0 ? recipients.map(r => (
                       <div key={r.id} className="p-4 flex justify-between items-center border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 uppercase">{r.name.charAt(0)}</div>
                             <div>
                                <p className="font-bold text-slate-800">{r.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black">{r.condition}</p>
                             </div>
                          </div>
                          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-black">{r.bloodType}</span>
                       </div>
                    )) : (
                      <div className="p-12 text-center text-slate-400 text-sm italic">No pending requests found.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bloodbags' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
                <p className="text-slate-500 text-sm">Real-time blood unit tracking.</p>
              </div>
              <button 
                onClick={() => setIsBagModalOpen(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center space-x-2 shadow-lg shadow-slate-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Unit</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bags.map(bag => (
                <div key={bag.id} className="bg-white rounded-2xl border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 -mr-6 -mt-6 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative">
                    <div className="text-3xl font-black text-red-600 mb-4">{bag.type}</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400 uppercase font-bold tracking-widest"><span>Vol.</span><span className="text-slate-800">{bag.volume}</span></div>
                      <div className="flex justify-between text-slate-400 uppercase font-bold tracking-widest"><span>Date.</span><span className="text-slate-800">{bag.donationDate}</span></div>
                      <div className="flex justify-between text-slate-400 uppercase font-bold tracking-widest"><span>Exp.</span><span className="text-red-500">{bag.expiryDate}</span></div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                      <button 
                        onClick={() => showToast(`Report generated for ${bag.type} unit #${bag.id}`, 'info')}
                        className="flex-1 text-[9px] font-black uppercase tracking-widest bg-slate-50 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        History
                      </button>
                      <button 
                        onClick={() => handleDispatchBag(bag.id)}
                        className="flex-1 text-[9px] font-black uppercase tracking-widest bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Dispatch</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setIsBagModalOpen(true)}
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-red-400 hover:text-red-400 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2"><Plus className="w-6 h-6" /></div>
                <span className="font-bold text-xs uppercase tracking-widest">New Unit</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">System Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Units Stored', val: bags.length, icon: Database, color: 'text-red-600' },
                { label: 'Active Donors', val: donors.length, icon: Users, color: 'text-blue-600' },
                { label: 'Cloud Status', val: 'Healthy', icon: Cloud, color: 'text-green-600' },
                { label: 'Pending Req', val: recipients.length, icon: Activity, color: 'text-orange-600' },
              ].map((k, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.label}</p>
                    <k.icon className={`w-4 h-4 ${k.color} opacity-50`} />
                  </div>
                  <p className={`text-3xl font-black ${k.color}`}>{k.val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {isDonorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-fade-in overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 text-lg">New Donor Entry</h3>
              <button onClick={() => setIsDonorModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleAddDonor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                  value={newDonor.name}
                  onChange={e => setNewDonor({...newDonor, name: e.target.value})}
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Age</label>
                  <input type="number" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} disabled={isSaving} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={newDonor.bloodType} onChange={e => setNewDonor({...newDonor, bloodType: e.target.value as BloodType})} disabled={isSaving}>
                    {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contact No. (10 digits)</label>
                <input 
                  type="text" required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder="Enter 10 digit number"
                  value={newDonor.contact}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) {
                      setNewDonor({...newDonor, contact: val});
                    }
                  }}
                  disabled={isSaving}
                />
              </div>
              <button type="submit" disabled={isSaving} className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all">
                {isSaving ? 'Saving to Atlas...' : 'Commit Donor Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isBagModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-fade-in overflow-hidden border border-slate-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">New Inventory Unit</h3>
              <button onClick={() => setIsBagModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleAddBag} className="p-6 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Blood Type</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                    value={newBag.type}
                    onChange={e => setNewBag({...newBag, type: e.target.value as BloodType})}
                  >
                    {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Volume (ml)</label>
                  <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={newBag.volume} onChange={e => setNewBag({...newBag, volume: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">
                  Register Bag Unit
                </button>
            </form>
          </div>
        </div>
      )}

      {isChatOpen && (
        <div 
          ref={chatRef}
          className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] sm:h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden transition-all animate-fade-in"
        >
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold leading-none">LifeFlow Assistant</h4>
                <div className="flex items-center space-x-1.5 mt-1.5"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span><span className="text-[9px] opacity-80 uppercase tracking-widest font-bold">Online & Sycned</span></div>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-10 h-10 text-red-600" />
                </div>
                <h5 className="font-bold text-slate-800 mb-2">Connected to Atlas</h5>
                <p className="text-sm text-slate-500 leading-relaxed">Ask me about donation eligibility or system status.</p>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                  <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 rounded-bl-none">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
               </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2 bg-slate-100 rounded-2xl px-4 py-1.5 border border-slate-200">
              <input 
                type="text" 
                className="flex-1 bg-transparent py-2.5 text-sm outline-none text-slate-700" 
                placeholder="Ask query..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
              />
              <button onClick={handleAIChat} className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-slate-400 py-6 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-4 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <span className="text-lg font-bold text-white tracking-tight">LifeFlow AI</span>
              </div>
              <span className="hidden md:block text-slate-700">|</span>
              <div className="flex items-center space-x-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <span>Team: Vaghu, Aayan, Akash, Shreyash</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-800">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Atlas: AIBloodDonationcluster</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
            <div className="text-slate-600">
              &copy; 2025 LifeFlow AI • Developed by YBIT, Sawantwadi
            </div>
            <div className="flex items-center space-x-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Emergency: 1-800-LIFE</a>
              <a href="https://ai.google.dev/" target="_blank" className="flex items-center space-x-1 text-slate-500 hover:text-white transition-colors">
                <Globe className="w-3 h-3" />
                <span>Powered by Gemini 3</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
