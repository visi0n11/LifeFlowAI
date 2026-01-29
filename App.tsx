
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Lock,
  Gift,
  Coffee,
  Shirt,
  DollarSign,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  History,
  BookOpen,
  Filter,
  AlertTriangle,
  Clock,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Auth } from './components/Auth';
import { getAIChatResponse, LOCAL_FAQ } from './services/geminiService';
import { User, Donor, Recipient, BloodBag, BloodType, ResourceDonation, ResourceType, AppNotification, NotificationSettings } from './types';

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

// --- Initial Mock Data ---
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

const initialResourceDonations: ResourceDonation[] = [
  { id: 1, type: 'food', donorName: 'Akash', details: '10kg Rice', date: '2024-03-15' },
  { id: 2, type: 'money', donorName: 'Vaghu', details: '₹1500', date: '2024-03-14' },
  { id: 3, type: 'clothes', donorName: 'Aayan', details: '5 Pairs of Trousers', date: '2024-03-10' },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{text: string, sender: 'user' | 'bot'}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isChatSearchActive, setIsChatSearchActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error'>('connected');
  const [isSyncingExternally, setIsSyncingExternally] = useState(false);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatToggleRef = useRef<HTMLButtonElement>(null);
  const notifToggleRef = useRef<HTMLButtonElement>(null);
  const [notificationToast, setNotificationToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // --- Notification & Persistence States ---
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('lifeflow_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('lifeflow_notif_settings');
    return saved ? JSON.parse(saved) : {
      inventoryAlerts: true,
      matchAlerts: true,
      systemAlerts: true
    };
  });

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

  const [resourceDonations, setResourceDonations] = useState<ResourceDonation[]>(() => {
    try {
      const saved = localStorage.getItem('lifeflow_resources');
      return saved ? JSON.parse(saved) : initialResourceDonations;
    } catch (e) {
      return initialResourceDonations;
    }
  });

  // --- Real-time Synchronizer (Cross-Tab) ---
  useEffect(() => {
    const handleStorageUpdate = (e: StorageEvent) => {
      if (!e.newValue) return;

      let updated = false;
      const parsedData = JSON.parse(e.newValue);

      switch (e.key) {
        case 'lifeflow_donors':
          setDonors(parsedData);
          updated = true;
          break;
        case 'lifeflow_recipients':
          setRecipients(parsedData);
          updated = true;
          break;
        case 'lifeflow_bags':
          setBags(parsedData);
          updated = true;
          break;
        case 'lifeflow_resources':
          setResourceDonations(parsedData);
          updated = true;
          break;
        case 'lifeflow_notifications':
          setNotifications(parsedData);
          break;
        case 'lifeflow_session':
          setCurrentUser(parsedData);
          break;
      }

      if (updated) {
        setIsSyncingExternally(true);
        setTimeout(() => setIsSyncingExternally(false), 2000);
        showToast("Directory synced with network update", 'info');
        
        if (notifSettings.systemAlerts) {
          addNotification({
            title: "Database Update",
            message: "A teammate has updated the directory. Information refreshed across all clusters.",
            type: 'system'
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, [notifSettings.systemAlerts]);

  // --- Real-time Logic (Triggers) ---
  
  // 1. Critical Inventory Alert
  useEffect(() => {
    if (!notifSettings.inventoryAlerts) return;
    
    BLOOD_TYPES.forEach(type => {
      const count = bags.filter(b => b.type === type).length;
      if (count <= 1) {
        const title = `Critical Stock: ${type}`;
        const message = `Blood inventory for group ${type} is dangerously low. Please prioritize ${type} donations.`;
        
        // Prevent spam - check if we already have this exact inventory alert unread
        const existing = notifications.find(n => n.title === title && !n.read);
        if (!existing) {
          addNotification({ title, message, type: 'inventory' });
        }
      }
    });
  }, [bags, notifSettings.inventoryAlerts]);

  // 2. Personal Matching Alert
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'donor' || !notifSettings.matchAlerts) return;
    
    const compatibleGroups = recipientCompatibility[currentUser.bloodType!] || [];
    const urgentMatches = recipients.filter(r => compatibleGroups.includes(r.bloodType));
    
    if (urgentMatches.length > 0) {
      const lastMatch = urgentMatches[0];
      const title = "Urgent Compatibility Match";
      const message = `${lastMatch.name} needs ${lastMatch.bloodType}. Your ${currentUser.bloodType} group is a compatible match!`;
      
      const existing = notifications.find(n => n.title === title && !n.read);
      if (!existing) {
        addNotification({ title, message, type: 'match' });
      }
    }
  }, [recipients, currentUser, notifSettings.matchAlerts]);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    
    setNotifications(prev => {
      const next = [newNotif, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem('lifeflow_notifications', JSON.stringify(next));
      return next;
    });
  };

  const [sortConfig, setSortConfig] = useState<{ key: keyof Donor; direction: 'asc' | 'desc' } | null>(null);

  const [matchResult, setMatchResult] = useState<Donor | null>(null);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isBagModalOpen, setIsBagModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newDonor, setNewDonor] = useState({ name: '', age: '', bloodType: 'A+' as BloodType, contact: '' });
  const [newRequest, setNewRequest] = useState({ name: '', bloodType: '' as BloodType | '', condition: '' });
  const [newBag, setNewBag] = useState({ type: 'A+' as BloodType, volume: '450ml' });
  const [newResource, setNewResource] = useState({ type: 'food' as ResourceType, details: '', donorName: '' });

  useEffect(() => {
    localStorage.setItem('lifeflow_donors', JSON.stringify(donors));
    localStorage.setItem('lifeflow_recipients', JSON.stringify(recipients));
    localStorage.setItem('lifeflow_bags', JSON.stringify(bags));
    localStorage.setItem('lifeflow_resources', JSON.stringify(resourceDonations));
    setDbStatus('syncing');
    const timer = setTimeout(() => setDbStatus('connected'), 600);
    return () => clearTimeout(timer);
  }, [donors, recipients, bags, resourceDonations]);

  useEffect(() => {
    localStorage.setItem('lifeflow_notif_settings', JSON.stringify(notifSettings));
  }, [notifSettings]);

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
      if (
        isNotifOpen &&
        notifRef.current && 
        !notifRef.current.contains(event.target as Node) &&
        notifToggleRef.current && 
        !notifToggleRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isChatOpen, isNotifOpen]);

  useEffect(() => {
    if (notificationToast) {
      const timer = setTimeout(() => setNotificationToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notificationToast]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const handleLogout = () => {
    localStorage.removeItem('lifeflow_session');
    setCurrentUser(null);
    setActiveTab('home');
    showToast('Signed out successfully', 'info');
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotificationToast({ message, type });
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

  const requestSort = (key: keyof Donor) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDonors = useMemo(() => {
    let sortableDonors = [...donors];
    if (sortConfig !== null) {
      sortableDonors.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDonors;
  }, [donors, sortConfig]);

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

  const handleAddResourceDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.details || !newResource.donorName) return;
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const donation: ResourceDonation = {
      id: Date.now(),
      type: newResource.type,
      donorName: newResource.donorName,
      details: newResource.details,
      date: new Date().toISOString().split('T')[0]
    };
    setResourceDonations(prev => [donation, ...prev]);
    setIsResourceModalOpen(false);
    setIsSaving(false);
    showToast(`Thank you for your ${donation.type} donation, ${donation.donorName}!`);
    setNewResource({ type: 'food', details: '', donorName: currentUser?.name || '' });
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

    setChatMessages(prev => [...prev, { text: "", sender: 'bot' }]);
    
    let isFirstChunk = true;
    await getAIChatResponse(userMsg, (chunk) => {
      if (isFirstChunk) {
        setIsTyping(false);
        isFirstChunk = false;
      }
      setChatMessages(prev => {
        const next = [...prev];
        const lastMsg = next[next.length - 1];
        if (lastMsg && lastMsg.sender === 'bot') {
          lastMsg.text += chunk;
        }
        return next;
      });
    });
    setIsTyping(false);
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('lifeflow_notifications', JSON.stringify(next));
      return next;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('lifeflow_notifications');
  };

  const filteredChatResults = useMemo(() => {
    if (!chatSearchQuery.trim()) return { messages: [], faq: [] };
    const query = chatSearchQuery.toLowerCase();
    
    const messages = chatMessages.filter(m => m.text.toLowerCase().includes(query));
    const faq = LOCAL_FAQ.filter(f => 
      f.keywords.some(k => k.toLowerCase().includes(query)) || 
      f.response.toLowerCase().includes(query)
    );

    return { messages, faq };
  }, [chatSearchQuery, chatMessages]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'donors', label: 'Donors', icon: Users },
    { id: 'recipients', label: 'Recipients', icon: Activity },
    { id: 'bloodbags', label: 'Inventory', icon: Droplet },
    { id: 'community', label: 'Community', icon: Gift },
    { id: 'dashboard', label: 'Analytics', icon: Activity },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getResourceIcon = (type: ResourceType) => {
    switch(type) {
      case 'food': return <Coffee className="w-4 h-4" />;
      case 'clothes': return <Shirt className="w-4 h-4" />;
      case 'money': return <DollarSign className="w-4 h-4" />;
    }
  };

  const getSortIcon = (key: keyof Donor) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

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

      {notificationToast && (
        <div className="fixed top-20 right-4 z-[100] animate-fade-in">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
            notificationToast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {notificationToast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            <span className="font-bold text-sm">{notificationToast.message}</span>
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
                  <div className={`w-1.5 h-1.5 rounded-full ${isSyncingExternally ? 'bg-blue-500 animate-pulse' : dbStatus === 'connected' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                  <span className={`text-[8px] font-bold uppercase tracking-tighter ${isSyncingExternally ? 'text-blue-500' : 'text-slate-400'}`}>
                    {isSyncingExternally ? 'Remote Syncing...' : 'Atlas Connected'}
                  </span>
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
            <div className="relative">
              <button 
                ref={notifToggleRef}
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) markAllRead();
                }}
                className={`relative p-2 transition-colors rounded-full ${isNotifOpen ? 'bg-slate-100 text-red-600' : 'bg-slate-50 text-slate-600 hover:text-red-600'}`}
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div 
                  ref={notifRef}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-[60] animate-fade-in"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-500">Alert Center</h5>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => clearNotifications()}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Clear all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`p-4 hover:bg-slate-50 transition-colors flex items-start space-x-3 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                        <div className={`p-2 rounded-xl shrink-0 ${
                          n.type === 'inventory' ? 'bg-amber-100 text-amber-600' :
                          n.type === 'match' ? 'bg-red-100 text-red-600' : 
                          n.type === 'system' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {n.type === 'inventory' ? <AlertTriangle className="w-4 h-4" /> :
                           n.type === 'match' ? <Users className="w-4 h-4" /> : 
                           n.type === 'system' ? <Cloud className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{n.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] font-black text-slate-300 uppercase">{n.timestamp}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-12 text-center text-slate-400">
                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-10" />
                        <p className="text-xs font-medium uppercase tracking-widest">No alerts found</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button 
                      onClick={() => {
                        // Toggle settings as an example
                        setNotifSettings(prev => ({...prev, systemAlerts: !prev.systemAlerts}));
                        showToast(`System alerts ${!notifSettings.systemAlerts ? 'enabled' : 'disabled'}`, 'info');
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center space-x-1 mx-auto"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Notification Preferences</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                onClick={() => setActiveTab('community')} 
                className="px-10 py-4 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Share Resources
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
              {[
                { title: "Real-time Matching", desc: "Our AI cluster instantly connects donors with patients based on compatible blood groups.", icon: Activity },
                { title: "Community Hub", desc: "Go beyond blood by donating food, clothes, or funds to those in need.", icon: Gift },
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
                    <th 
                      className="px-6 py-4 text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-red-600 transition-colors"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        <span>Name</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center cursor-pointer hover:text-red-600 transition-colors"
                      onClick={() => requestSort('bloodType')}
                    >
                      <div className="flex items-center justify-center">
                        <span>Group</span>
                        {getSortIcon('bloodType')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Contact</th>
                    <th 
                      className="px-6 py-4 text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-red-600 transition-colors"
                      onClick={() => requestSort('lastDonation')}
                    >
                      <div className="flex items-center">
                        <span>Last Donation</span>
                        {getSortIcon('lastDonation')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDonors.map(d => (
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

        {activeTab === 'community' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Community Care Hub</h2>
                <p className="text-slate-500 text-sm mt-1">Share food, clothes, and financial support with the network.</p>
              </div>
              <button 
                onClick={() => {
                  setNewResource({ type: 'food', details: '', donorName: currentUser?.name || '' });
                  setIsResourceModalOpen(true);
                }} 
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 flex items-center space-x-2 shadow-lg shadow-red-100"
              >
                <Plus className="w-4 h-4" />
                <span>Share Resources</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { type: 'food', label: 'Food Donated', icon: Coffee, color: 'text-orange-600', bg: 'bg-orange-50' },
                { type: 'clothes', label: 'Clothes Shared', icon: Shirt, color: 'text-blue-600', bg: 'bg-blue-50' },
                { type: 'money', label: 'Funds Raised', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white shadow-sm flex items-center justify-between`}>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>
                      {resourceDonations.filter(d => d.type === stat.type).length} Units
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-white shadow-sm ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    <span>Recent Contributions</span>
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {resourceDonations.map(d => (
                    <div key={d.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          d.type === 'food' ? 'bg-orange-100 text-orange-600' : 
                          d.type === 'clothes' ? 'bg-blue-100 text-blue-600' : 
                          'bg-green-100 text-green-600'
                        }`}>
                          {getResourceIcon(d.type)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{d.details}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black">By {d.donorName} • {d.date}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Verified</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-3xl"></div>
                  <h3 className="text-xl font-bold mb-4">Why donate resources?</h3>
                  <ul className="space-y-4 text-sm text-slate-400">
                    <li className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-red-500" /></div>
                      <span><strong>Food:</strong> Direct support for recovery patients who need balanced nutrition but lack resources.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-red-500" /></div>
                      <span><strong>Clothes:</strong> Provide warmth and dignity to long-term hospital residents and their families.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-red-500" /></div>
                      <span><strong>Money:</strong> Funds are used for emergency medical kits and maintaining the Atlas cloud cluster.</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => setIsResourceModalOpen(true)}
                    className="mt-8 w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-900/20"
                  >
                    Start a New Donation
                  </button>
                </div>
              </div>
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

      {/* Modals and Overlays */}
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

      {isResourceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-fade-in overflow-hidden border border-slate-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">New Community Donation</h3>
              <button onClick={() => setIsResourceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleAddResourceDonation} className="p-6 space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Donor Identity</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                    placeholder="Your Name"
                    value={newResource.donorName}
                    onChange={e => setNewResource({...newResource, donorName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Donation Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none cursor-pointer"
                      value={newResource.type}
                      onChange={e => setNewResource({...newResource, type: e.target.value as ResourceType})}
                    >
                      <option value="food">Food</option>
                      <option value="clothes">Clothes</option>
                      <option value="money">Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Details</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none"
                      placeholder={newResource.type === 'money' ? 'Amount (e.g. ₹500)' : 'Qty/Desc'}
                      value={newResource.details}
                      onChange={e => setNewResource({...newResource, details: e.target.value})}
                    />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    By submitting, you agree to drop off items at our partner collection centers or complete the digital payment transfer.
                  </p>
                </div>
                <button type="submit" disabled={isSaving} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center space-x-3">
                   {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5" />}
                   <span className="uppercase text-xs tracking-widest">{isSaving ? 'Processing...' : 'Complete Donation'}</span>
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
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white flex items-center justify-between shadow-lg">
            {!isChatSearchActive ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold leading-none">LifeFlow Assistant</h4>
                    <div className="flex items-center space-x-1.5 mt-1.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="text-[9px] opacity-80 uppercase tracking-widest font-bold">Live AI Cluster</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => setIsChatSearchActive(true)}
                    className="hover:bg-white/20 p-2 rounded-full transition-colors"
                    title="Search chat"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 w-full animate-fade-in">
                <Search className="w-4 h-4 opacity-70" />
                <input 
                  autoFocus
                  type="text" 
                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/50"
                  placeholder="Search history or FAQs..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => {
                    setIsChatSearchActive(false);
                    setChatSearchQuery("");
                  }}
                  className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50 scroll-smooth">
            {isChatSearchActive && chatSearchQuery.trim() !== "" ? (
              <div className="space-y-6 animate-fade-in pb-4">
                {filteredChatResults.messages.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <History className="w-3 h-3" />
                      <span>Chat History Matches</span>
                    </div>
                    <div className="space-y-2">
                      {filteredChatResults.messages.map((m, i) => (
                        <div key={i} className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          m.sender === 'user' ? 'bg-red-50 border-red-100 text-red-700 ml-4' : 'bg-white border-slate-200 text-slate-600 mr-4'
                        }`}>
                          {m.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {filteredChatResults.faq.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <BookOpen className="w-3 h-3" />
                      <span>Knowledge Base Matches</span>
                    </div>
                    <div className="space-y-2">
                      {filteredChatResults.faq.map((f, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
                          <p className="text-[10px] font-black text-red-600 uppercase mb-1">{f.keywords.slice(0, 3).join(', ')}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{f.response}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredChatResults.messages.length === 0 && filteredChatResults.faq.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 grayscale opacity-40">
                    <Filter className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No results found</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50">
                      <Activity className="w-10 h-10 text-red-600" />
                    </div>
                    <h5 className="font-bold text-slate-800 mb-2">Connected to Atlas</h5>
                    <p className="text-sm text-slate-500 leading-relaxed">Ask me about donation eligibility or system status.</p>
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                      m.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                   <div className="flex justify-start">
                      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 rounded-bl-none shadow-sm">
                        <div className="flex space-x-1.5">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                   </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2 bg-slate-50 rounded-2xl px-4 py-1.5 border border-slate-200 focus-within:ring-4 focus-within:ring-red-500/10 transition-all">
              <input 
                type="text" 
                className="flex-1 bg-transparent py-2.5 text-sm outline-none text-slate-700 placeholder:text-slate-400" 
                placeholder="Ask query..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
              />
              <button 
                disabled={isTyping}
                onClick={handleAIChat} 
                className={`p-2.5 text-white rounded-xl transition-all shadow-lg active:scale-95 ${isTyping ? 'bg-slate-300' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-slate-400 py-6 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-4 space-y-4 md:mt-0 md:space-y-0">
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
               <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSyncingExternally ? 'bg-blue-500' : 'bg-green-500'}`}></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Atlas: AIBloodDonationcluster</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
            <div className="text-slate-600">
              &copy; 2025 LifeFlow AI • Developed by YBIT, Sawantwadi
            </div>
            <div className="flex items-center space-x-6 mt-2 md:mt-0">
              <a href="tel:112" className="hover:text-white transition-colors">Emergency: 112</a>
              <div className="flex items-center space-x-1 text-slate-500">
                <Globe className="w-3 h-3" />
                <span>Global Health Network</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
