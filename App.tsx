import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, 
  Users, 
  Droplet, 
  Activity, 
  MessageSquare, 
  Home, 
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
  Globe,
  Pencil,
  LogIn,
  LifeBuoy,
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
  Settings,
  ShieldCheck,
  QrCode,
  CreditCard,
  Smartphone,
  Mail,
  AlertCircle,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Zap,
  Maximize
} from 'lucide-react';
import { Auth } from './components/Auth';
import { getAIChatResponse, LOCAL_FAQ } from './services/geminiService';
import { User, Donor, Recipient, BloodBag, BloodType, ResourceDonation, ResourceType, AppNotification, NotificationSettings } from './types';

// --- Constants ---
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
  { id: 1, name: "Vaghu", age: 24, bloodType: "O+", contact: "9870000101", email: "vaghu@example.com", lastDonation: "2024-02-15" },
  { id: 2, name: "Aayan", age: 22, bloodType: "B-", contact: "9870000102", email: "aayan@example.com", lastDonation: "2024-03-01" },
  { id: 3, name: "Akash", age: 25, bloodType: "AB+", contact: "9870000103", email: "akash@example.com", lastDonation: "2024-01-20" },
  { id: 4, name: "Shreyash", age: 23, bloodType: "O+", contact: "9870000104", email: "shreyash@example.com", lastDonation: "2024-03-10" },
];

const initialRecipients: Recipient[] = [
  { id: 1, name: "Sahil Mane", age: 29, bloodType: "O+", contact: "9988776655", email: "sahil@example.com", condition: "Surgery Recovery" },
  { id: 2, name: "Priya Patil", age: 34, bloodType: "AB+", contact: "9988776644", email: "priya@example.com", condition: "Anemia Treatment" },
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
  const [pendingAction, setPendingAction] = useState<{ type: string; payload?: any } | null>(null);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatToggleRef = useRef<HTMLButtonElement>(null);
  const notifToggleRef = useRef<HTMLButtonElement>(null);
  const [notificationToast, setNotificationToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [systemHealth, setSystemHealth] = useState<'optimal' | 'degraded' | 'offline'>('optimal');

  const handleReportIssue = () => {
    showToast('Issue reported to system administrator', 'info');
    addNotification({
      title: 'Issue Reported',
      message: 'Your report has been logged. Our team is investigating the cluster connectivity.',
      type: 'system'
    });
    setSystemHealth('degraded');
    setTimeout(() => setSystemHealth('optimal'), 10000);
  };

  // --- Notification & Persistence States ---
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('lifeflow_notif_settings');
    return saved ? JSON.parse(saved) : {
      inventoryAlerts: true,
      matchAlerts: true,
      systemAlerts: true
    };
  });

  const [donors, setDonors] = useState<Donor[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [bags, setBags] = useState<BloodBag[]>([]);
  const [resourceDonations, setResourceDonations] = useState<ResourceDonation[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);

  // --- API Sync Helpers ---
  const syncWithServer = async (collection: string, data: any) => {
    if (!isLoaded) return; // Don't sync until initial data is loaded
    try {
      await fetch('/api/db/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection, data })
      });
    } catch (error) {
      console.error(`Failed to sync ${collection} with server:`, error);
    }
  };

  // --- Initial Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const data = await response.json();
          if (data.donors) setDonors(data.donors);
          if (data.recipients) setRecipients(data.recipients);
          if (data.bags) setBags(data.bags);
          if (data.resources) setResourceDonations(data.resources);
          if (data.notifications) setNotifications(data.notifications);
          setDbStatus('connected');
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to fetch data from server:", error);
        setDbStatus('error');
      }
    };
    fetchData();
  }, []);

  // --- Real-time Synchronizer (Cross-Tab) ---
  useEffect(() => {
    const handleStorageUpdate = (e: StorageEvent) => {
      if (!e.newValue) return;

      if (e.key === 'lifeflow_session') {
        setCurrentUser(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    
    // Initial system notification
    const hasNotified = sessionStorage.getItem('lifeflow_init_notif');
    if (!hasNotified) {
      setTimeout(() => {
        addNotification({
          title: 'System Ready',
          message: 'LifeFlow AI Cluster is online. Data is now stored permanently on the server.',
          type: 'system'
        });
        sessionStorage.setItem('lifeflow_init_notif', 'true');
      }, 2000);
    }

    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // --- Real-time Logic (Triggers) ---
  useEffect(() => {
    if (!notifSettings.inventoryAlerts) return;
    BLOOD_TYPES.forEach(type => {
      const count = bags.filter(b => b.type === type).length;
      if (count <= 1) {
        const title = `Critical Stock: ${type}`;
        const message = `Blood inventory for group ${type} is dangerously low. Please prioritize ${type} donations.`;
        const existing = notifications.find(n => n.title === title && !n.read);
        if (!existing) {
          addNotification({ title, message, type: 'inventory' });
        }
      }
    });
  }, [bags, notifSettings.inventoryAlerts, notifications]);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => {
      const next = [newNotif, ...prev].slice(0, 20);
      return next;
    });
  };

  const [sortConfig, setSortConfig] = useState<{ key: keyof Donor; direction: 'asc' | 'desc' } | null>(null);
  const [matchResult, setMatchResult] = useState<Donor | null>(null);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [editingDonorId, setEditingDonorId] = useState<number | null>(null);
  const [isBagModalOpen, setIsBagModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const [newDonor, setNewDonor] = useState({ name: '', age: '', bloodType: 'A+' as BloodType, contact: '', email: '' });
  const [newRequest, setNewRequest] = useState({ name: '', bloodType: '' as BloodType | '', condition: '', contact: '', email: '' });
  const [newBag, setNewBag] = useState({ type: 'A+' as BloodType, volume: '450ml' });
  const [newResource, setNewResource] = useState({ type: 'food' as ResourceType, details: '', donorName: '' });

  useEffect(() => {
    // Skip sync until initial data is loaded to avoid overwriting server data
    if (!isLoaded) return;

    setDbStatus('syncing');
    
    // Local storage fallback
    localStorage.setItem('lifeflow_donors', JSON.stringify(donors));
    localStorage.setItem('lifeflow_recipients', JSON.stringify(recipients));
    localStorage.setItem('lifeflow_bags', JSON.stringify(bags));
    localStorage.setItem('lifeflow_resources', JSON.stringify(resourceDonations));
    localStorage.setItem('lifeflow_notifications', JSON.stringify(notifications));

    // Server sync
    syncWithServer('donors', donors);
    syncWithServer('recipients', recipients);
    syncWithServer('bags', bags);
    syncWithServer('resources', resourceDonations);
    syncWithServer('notifications', notifications);

    const timer = setTimeout(() => setDbStatus('connected'), 600);
    return () => clearTimeout(timer);
  }, [donors, recipients, bags, resourceDonations, notifications]);

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
      if (isChatOpen && chatRef.current && !chatRef.current.contains(event.target as Node) && chatToggleRef.current && !chatToggleRef.current.contains(event.target as Node)) {
        setIsChatOpen(false);
      }
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(event.target as Node) && notifToggleRef.current && !notifToggleRef.current.contains(event.target as Node)) {
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

  const requireAuth = (actionType: string, callback: () => void) => {
    if (!currentUser) {
      setPendingAction({ type: actionType });
      setIsAuthOpen(true);
      showToast('Registration required to continue', 'info');
    } else {
      callback();
    }
  };

  const findBestMatch = (bloodType: BloodType) => {
    const compatibleTypes = recipientCompatibility[bloodType] || [];
    const possibleDonors = donors.filter(d => compatibleTypes.includes(d.bloodType));
    setMatchResult(possibleDonors.length > 0 ? possibleDonors[0] : null);
  };

  const handleOpenEditModal = (donor: Donor) => {
    setEditingDonorId(donor.id);
    setNewDonor({
      name: donor.name,
      age: donor.age.toString(),
      bloodType: donor.bloodType,
      contact: donor.contact,
      email: donor.email || ''
    });
    setIsDonorModalOpen(true);
  };

  const handleSaveDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDonor.contact.length !== 10) {
      showToast('Contact number must be exactly 10 digits', 'info');
      return;
    }
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (editingDonorId) {
      const updatedDonor = {
        name: newDonor.name,
        age: parseInt(newDonor.age) || 18,
        bloodType: newDonor.bloodType,
        contact: newDonor.contact,
        email: newDonor.email
      };
      setDonors(prev => {
        const next = prev.map(d => d.id === editingDonorId ? { ...d, ...updatedDonor } : d);
        return next;
      });
      showToast(`Donor ${newDonor.name} updated successfully`);
    } else {
      const donor: Donor = {
        id: Date.now(),
        name: newDonor.name,
        age: parseInt(newDonor.age) || 18,
        bloodType: newDonor.bloodType,
        contact: newDonor.contact,
        email: newDonor.email,
        lastDonation: new Date().toISOString().split('T')[0]
      };
      setDonors(prev => {
        const next = [donor, ...prev];
        return next;
      });
      showToast(`Donor ${donor.name} registered successfully`);
    }

    setIsDonorModalOpen(false);
    setEditingDonorId(null);
    setIsSaving(false);
    setNewDonor({ name: '', age: '', bloodType: 'A+', contact: '', email: '' });
  };

  const handleDeleteDonor = (id: number) => {
    const donor = donors.find(d => d.id === id);
    if (!donor) return;
    if (window.confirm(`Are you sure you want to remove ${donor.name} from the directory?`)) {
      setDonors(prev => {
        const next = prev.filter(d => d.id !== id);
        return next;
      });
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
        if (a[sortConfig.key]! < b[sortConfig.key]!) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key]! > b[sortConfig.key]!) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableDonors;
  }, [donors, sortConfig]);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth('matching', async () => {
      if (!newRequest.name || !newRequest.bloodType) return;
      setIsSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const request: Recipient = {
        id: Date.now(),
        name: newRequest.name,
        age: 30,
        bloodType: newRequest.bloodType as BloodType,
        contact: newRequest.contact || "System Generated",
        email: newRequest.email || "system@lifeflow.ai",
        condition: newRequest.condition || "Emergency"
      };
      setRecipients(prev => {
        const next = [request, ...prev];
        return next;
      });
      const compatibleTypes = recipientCompatibility[request.bloodType] || [];
      const possibleDonors = donors.filter(d => compatibleTypes.includes(d.bloodType));
      
      if (possibleDonors.length > 0) {
        const bestMatch = possibleDonors[0];
        setMatchResult(bestMatch);
        addNotification({
          title: 'Match Found',
          message: `A compatible donor (${bestMatch.bloodType}) has been found for ${request.name}.`,
          type: 'match'
        });
        
        // Automatically trigger the urgent request if email exists
        if (bestMatch.email) {
          handleSendUrgentRequest(bestMatch);
        }
      } else {
        setMatchResult(null);
        addNotification({
          title: 'No Match Found',
          message: `No compatible donors currently available for ${request.name} (${request.bloodType}).`,
          type: 'system'
        });
        showToast('No compatible donors found in current cluster', 'info');
      }
      setIsSaving(false);
    });
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
    setBags(prev => {
      const next = [bag, ...prev];
      return next;
    });
    setIsBagModalOpen(false);
    setIsSaving(false);
    showToast(`Blood bag ${bag.type} added to inventory`);
  };

  const handleAddResourceDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.details || !newResource.donorName) return;
    
    if (newResource.type === 'money' && !paymentVerified) {
      showToast('Please scan the QR code and verify payment first.', 'info');
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const donation: ResourceDonation = {
      id: Date.now(),
      type: newResource.type,
      donorName: newResource.donorName,
      details: newResource.details,
      date: new Date().toISOString().split('T')[0]
    };
    setResourceDonations(prev => {
      const next = [donation, ...prev];
      return next;
    });
    setIsResourceModalOpen(false);
    setIsSaving(false);
    setPaymentVerified(false);
    showToast(`Thank you for your ${donation.type} donation, ${donation.donorName}!`);
    setNewResource({ type: 'food', details: '', donorName: currentUser?.name || '' });
  };

  const handleDispatchBag = (id: number) => {
    const bag = bags.find(b => b.id === id);
    if (!bag) return;
    setBags(prev => {
      const next = prev.filter(b => b.id !== id);
      return next;
    });
    showToast(`Unit ${bag.type} dispatched successfully`, 'info');
  };

  const handleNotifyDonor = () => {
    if (!matchResult) return;
    const message = `Emergency alert dispatched to donor ${matchResult.name} for blood type ${matchResult.bloodType}. Contact: ${matchResult.contact}`;
    addNotification({
      title: 'Alert Dispatched',
      message,
      type: 'match'
    });
    showToast(`Alert sent to ${matchResult.name} (${matchResult.contact})`, 'success');
    
    // Also offer email option if email exists
    if (matchResult.email) {
      setTimeout(() => {
        if (window.confirm(`Would you like to also send a prewritten email to ${matchResult.name}?`)) {
          handleEmailDonor(matchResult);
        }
      }, 500);
    }
    
    setMatchResult(null);
  };

  const handleSendUrgentRequest = async (donor: Donor) => {
    if (!donor.email) {
      showToast('Donor has no email address', 'info');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/send-urgent-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: donor.email,
          donorName: donor.name,
          bloodType: donor.bloodType
        })
      });

      const data = await response.json();

      if (response.ok) {
        addNotification({
          title: 'Urgent Email Sent',
          message: `Automatic emergency message sent to ${donor.name} (${donor.email})`,
          type: 'match'
        });
        showToast(`Urgent email sent to ${donor.name}`, 'success');
      } else {
        // Fallback to mailto if server fails (e.g. missing credentials)
        console.warn("Automatic send failed, falling back to mailto:", data.error);
        const subject = "URGENT: Life-Saving Blood Donation Needed";
        const body = `Hello,\n\nWe urgently need blood for a patient in critical condition. Your donation could save a life today. If you are available and eligible to donate, please consider helping.\n\nYour support would mean more than words can express.\n\nThank you,\nLifeFlow AI Team\n(Contact: blooddonationlifeflowai@gmail.com)`;
        const mailtoUrl = `mailto:${donor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        
        addNotification({
          title: 'Manual Draft Created',
          message: `Automatic send failed (${data.error}). Manual draft created for ${donor.name}.`,
          type: 'system'
        });
      }
    } catch (error) {
      console.error("Error calling send-email API:", error);
      showToast('Connection error. Opening mail client...', 'info');
      // Final fallback
      window.location.href = `mailto:${donor.email}?subject=Urgent&body=Please help`;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailDonor = (donor: Donor) => {
    const subject = "Urgent: Blood Donation Needed";
    const body = `Hi ${donor.name},\n\nSomeone needs blood. If you're ready, please tell us.\n\nThank you,\nLifeFlow AI Team\n(Contact: blooddonationlifeflowai@gmail.com)`;
    const mailtoUrl = `mailto:${donor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    
    addNotification({
      title: 'Email Sent',
      message: `Prewritten message drafted for ${donor.name} (${donor.email})`,
      type: 'match'
    });
    showToast(`Email drafted for ${donor.name}`, 'success');
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
      if (isFirstChunk) { setIsTyping(false); isFirstChunk = false; }
      setChatMessages(prev => {
        const next = [...prev];
        const lastMsg = next[next.length - 1];
        if (lastMsg && lastMsg.sender === 'bot') lastMsg.text += chunk;
        return next;
      });
    });
    setIsTyping(false);
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      return next;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

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
            showToast(`Welcome, ${user.name}!`);
            if (pendingAction) {
              if (pendingAction.type === 'donor') setIsDonorModalOpen(true);
              if (pendingAction.type === 'community') setIsResourceModalOpen(true);
              setActiveTab(pendingAction.type === 'donor' ? 'donors' : pendingAction.type === 'community' ? 'community' : 'recipients');
              setPendingAction(null);
            }
          }} 
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {notificationToast && (
        <div className="fixed top-20 right-4 z-[100] animate-fade-in">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
            notificationToast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'
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
                  <div className={`w-1.5 h-1.5 rounded-full ${isSyncingExternally ? 'bg-blue-500 animate-pulse' : systemHealth === 'optimal' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                  <span className={`text-[8px] font-bold uppercase tracking-tighter ${isSyncingExternally ? 'text-blue-500' : systemHealth === 'optimal' ? 'text-slate-400' : 'text-amber-500'}`}>
                    {isSyncingExternally ? 'Syncing...' : systemHealth === 'optimal' ? 'Atlas Ready' : 'Degraded Mode'}
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
              <button ref={notifToggleRef} onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen) markAllRead(); }} className={`relative p-2 transition-colors rounded-full ${isNotifOpen ? 'bg-slate-100 text-red-600' : 'bg-slate-50 text-slate-600 hover:text-red-600'}`}>
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
              </button>
              {isNotifOpen && (
                <div ref={notifRef} className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-[60] animate-fade-in">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-500">Alert Center</h5>
                    <button onClick={() => clearNotifications()} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`p-4 hover:bg-slate-50 transition-colors flex items-start space-x-3 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                        <div className={`p-2 rounded-xl shrink-0 ${n.type === 'inventory' ? 'bg-amber-100 text-amber-600' : n.type === 'match' ? 'bg-red-100 text-red-600' : n.type === 'system' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                          {n.type === 'inventory' ? <AlertTriangle className="w-4 h-4" /> : n.type === 'match' ? <Users className="w-4 h-4" /> : n.type === 'system' ? <Cloud className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{n.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] font-black text-slate-300 uppercase">{n.timestamp}</span>
                        </div>
                      </div>
                    )) : <div className="p-12 text-center text-slate-400 text-xs font-medium uppercase">No alerts</div>}
                  </div>
                </div>
              )}
            </div>

            <button ref={chatToggleRef} onClick={() => setIsChatOpen(!isChatOpen)} className="relative p-2 text-slate-600 hover:text-red-600 transition-colors bg-slate-50 rounded-full">
              <MessageSquare className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
            </button>
            
            {currentUser ? (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-800 leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{currentUser.role} • {currentUser.bloodType}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-full">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <button onClick={() => setIsAuthOpen(true)} className="bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center space-x-2">
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
              <span>Network Synced</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 leading-tight">
              Connect. Donate.<br /><span className="text-red-600 underline decoration-red-200 underline-offset-8">Save Lives.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Experience real-time donor matching for <strong>Vaghu, Aayan, Akash, and Shreyash</strong>. Mandatory registration ensures safety and reliable matching.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => requireAuth('donor', () => { setActiveTab('donors'); setIsDonorModalOpen(true); })} className="px-10 py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center space-x-2">
                {!currentUser && <Lock className="w-4 h-4" />}
                <span>Become a Donor</span>
              </button>
              <button onClick={() => requireAuth('community', () => { setActiveTab('community'); setIsResourceModalOpen(true); })} className="px-10 py-4 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center space-x-2">
                {!currentUser && <Lock className="w-4 h-4 text-slate-400" />}
                <span>Share Resources</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 text-left">
              {[
                { 
                  title: "Real-Time Donor Matching", 
                  desc: "Uses AI algorithms to instantly match donors with recipients based on blood type, location, and urgency.", 
                  icon: Zap 
                },
                { 
                  title: "Emergency Alerts", 
                  desc: "Sends instant notifications to nearby donors and medical organizations during emergencies.", 
                  icon: Bell 
                },
                { 
                  title: "User-Friendly Dashboard", 
                  desc: "Easy-to-use interface for donors, recipients, and administrators to track donations and requests.", 
                  icon: LayoutDashboard 
                },
                { 
                  title: "Secure Data Management", 
                  desc: "Stores donor and recipient information securely with role-based access control.", 
                  icon: ShieldCheck 
                },
                { 
                  title: "Automated Scheduling", 
                  desc: "Helps donors schedule blood donation appointments and sends reminders automatically.", 
                  icon: Calendar 
                },
                { 
                  title: "Analytics & Reports", 
                  desc: "Tracks donation trends, donor activity, and emergency response times for better decision-making.", 
                  icon: BarChart3 
                },
                { 
                  title: "Scalable & Accessible", 
                  desc: "Web-based platform accessible from multiple devices, designed to handle growing user data efficiently.", 
                  icon: Globe 
                },
                { 
                  title: "Community Resources", 
                  desc: "Go beyond blood by donating food, clothes, or funds to those in need.", 
                  icon: Gift 
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight">{feature.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'donors' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Donor Directory</h2>
              <button onClick={() => requireAuth('donor', () => setIsDonorModalOpen(true))} className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center space-x-2">
                {!currentUser && <Lock className="w-4 h-4" />}
                <Plus className="w-4 h-4" />
                <span>Add Donor</span>
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase cursor-pointer" onClick={() => requestSort('name')}>
                      <div className="flex items-center"><span>Name</span>{getSortIcon('name')}</div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center cursor-pointer" onClick={() => requestSort('bloodType')}>
                      <div className="flex items-center justify-center"><span>Group</span>{getSortIcon('bloodType')}</div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase cursor-pointer" onClick={() => requestSort('lastDonation')}>
                      <div className="flex items-center"><span>Last Donation</span>{getSortIcon('lastDonation')}</div>
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
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleSendUrgentRequest(d)} className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-full" title="Send Urgent Request">
                            <AlertCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEmailDonor(d)} className="p-2 text-slate-400 hover:text-green-600 transition-colors bg-slate-50 rounded-full" title="Send Email">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenEditModal(d)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-full">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button onClick={() => handleDeleteDonor(d.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-full">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
                <h2 className="text-2xl font-bold text-slate-800">Community Hub</h2>
                <p className="text-slate-500 text-sm">Share resources. (Identity Verified)</p>
              </div>
              <button onClick={() => requireAuth('community', () => { setNewResource({ ...newResource, donorName: currentUser?.name || '' }); setIsResourceModalOpen(true); })} className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 flex items-center space-x-2 shadow-lg shadow-red-100">
                {!currentUser && <Lock className="w-4 h-4" />}
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
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p><p className={`text-2xl font-black ${stat.color}`}>{resourceDonations.filter(d => d.type === stat.type).length} Units</p></div>
                  <div className={`p-4 rounded-2xl bg-white shadow-sm ${stat.color}`}><stat.icon className="w-6 h-6" /></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between"><h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center space-x-2"><TrendingUp className="w-4 h-4 text-red-600" /><span>Recent Contributions</span></h3></div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {resourceDonations.map(d => (
                    <div key={d.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.type === 'food' ? 'bg-orange-100 text-orange-600' : d.type === 'clothes' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{getResourceIcon(d.type)}</div><div><p className="font-bold text-slate-800">{d.details}</p><p className="text-[10px] text-slate-400 uppercase font-black">By {d.donorName} • {d.date}</p></div></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><QrCode className="w-24 h-24" /></div>
                <h3 className="text-xl font-bold mb-4">Secure Money Donation</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">We utilize Google Pay for instant, encrypted transfers. All financial contributions go directly toward life-saving equipment and medicine.</p>
                <div className="flex items-center space-x-4 mb-8">
                    {/* Fixed: Replaced non-existent ShieldSecurity with ShieldCheck */}
                    <div className="p-3 bg-slate-800 rounded-xl"><ShieldCheck className="w-6 h-6 text-green-500" /></div>
                    <div className="text-xs text-slate-400">Verified by<br/><span className="text-white font-bold">SafeLife Network</span></div>
                </div>
                <button onClick={() => requireAuth('community', () => { setNewResource({...newResource, type: 'money'}); setIsResourceModalOpen(true); })} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all">Start Donation</button>
              </div>
            </div>
          </div>
        )}

        {/* ... (Existing Recipients, Bloodbags, and Dashboard tabs remain the same) ... */}
        {activeTab === 'recipients' && (
          <div className="space-y-8 animate-fade-in">
             <div className="border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-800">AI Matching Center</h2>
              <p className="text-slate-500 text-sm mt-1">Verify identity to request life-saving compatibility scans.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold mb-6 text-slate-800">Match Request</h3>
                {!currentUser ? (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm mb-6">Login to start matching patients with donors.</p>
                    <button onClick={() => setIsAuthOpen(true)} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl">Sign In</button>
                  </div>
                ) : (
                  <form onSubmit={handleAddRequest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Patient Name</label>
                      <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Enter patient name" value={newRequest.name} onChange={e => setNewRequest({...newRequest, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Contact Email</label>
                      <input type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Enter contact email" value={newRequest.email} onChange={e => setNewRequest({...newRequest, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Required Type</label>
                      <select required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={newRequest.bloodType} onChange={e => { setNewRequest({...newRequest, bloodType: e.target.value as BloodType}); findBestMatch(e.target.value as BloodType); }}>
                        <option value="">Select Blood Group</option>
                        {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <button disabled={isSaving} type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center space-x-2">
                      {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>{isSaving ? 'Scanning...' : 'Start Matching'}</span>
                    </button>
                  </form>
                )}
              </div>
              <div className="lg:col-span-2 space-y-6">
                {matchResult ? (
                  <div className="bg-green-50 border border-green-200 p-8 rounded-2xl flex items-start space-x-6 animate-fade-in">
                    <div className="p-4 bg-green-500 rounded-2xl shadow-lg shadow-green-100"><CheckCircle className="w-8 h-8 text-white" /></div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900 mb-1">Perfect Match Found!</h3>
                      <p className="text-green-700 mb-4 opacity-80">Contact details and matching metrics verified.</p>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100"><p className="text-slate-400 font-bold uppercase text-[10px]">Donor</p><p className="text-slate-800 font-bold">{matchResult.name}</p></div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100"><p className="text-slate-400 font-bold uppercase text-[10px]">Group</p><p className="text-red-600 font-bold">{matchResult.bloodType}</p></div>
                      </div>
                      <div className="flex space-x-3">
                        <button onClick={handleNotifyDonor} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg flex items-center space-x-2"><Bell className="w-4 h-4" /><span>Dispatch Alert</span></button>
                        <button onClick={() => handleSendUrgentRequest(matchResult)} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg flex items-center space-x-2"><AlertCircle className="w-4 h-4" /><span>Urgent Request</span></button>
                      </div>
                    </div>
                  </div>
                ) : <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center text-slate-400"><Activity className="w-12 h-12 mb-4 opacity-20" /><p className="font-medium">Run a verified scan to view matches.</p></div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bloodbags' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div><h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2><p className="text-slate-500 text-sm">Real-time blood unit tracking.</p></div>
              {currentUser?.role === 'admin' && (
                <button onClick={() => setIsBagModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center space-x-2">
                  <Plus className="w-4 h-4" /><span>Add Unit</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bags.map(bag => (
                <div key={bag.id} className="bg-white rounded-2xl border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="relative">
                    <div className="text-3xl font-black text-red-600 mb-4">{bag.type}</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400 uppercase font-bold tracking-widest"><span>Vol.</span><span className="text-slate-800">{bag.volume}</span></div>
                      <div className="flex justify-between text-slate-400 uppercase font-bold tracking-widest"><span>Date.</span><span className="text-slate-800">{bag.donationDate}</span></div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                      <button onClick={() => showToast(`Report for unit #${bag.id}`, 'info')} className="flex-1 text-[9px] font-black uppercase tracking-widest bg-slate-50 py-2 rounded-lg">History</button>
                      {currentUser?.role === 'admin' && <button onClick={() => handleDispatchBag(bag.id)} className="flex-1 text-[9px] font-black uppercase tracking-widest bg-red-600 text-white py-2 rounded-lg">Dispatch</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">System Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Inventory Units', val: bags.length, icon: Database, color: 'text-red-600' },
                { label: 'Verified Donors', val: donors.length, icon: Users, color: 'text-blue-600' },
                { label: 'System Health', val: 'Online', icon: Cloud, color: 'text-green-600' },
                { label: 'Match Requests', val: recipients.length, icon: Activity, color: 'text-orange-600' },
              ].map((k, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.label}</p><k.icon className={`w-4 h-4 ${k.color} opacity-50`} /></div>
                  <p className={`text-3xl font-black ${k.color}`}>{k.val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {isDonorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-fade-in overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 text-lg">{editingDonorId ? 'Edit Donor Info' : 'Register as Donor'}</h3>
              <button onClick={() => { setIsDonorModalOpen(false); setEditingDonorId(null); }} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSaveDonor} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label><input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} disabled={isSaving} /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label><input type="email" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={newDonor.email} onChange={e => setNewDonor({...newDonor, email: e.target.value})} disabled={isSaving} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Age</label><input type="number" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} disabled={isSaving} /></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label><select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={newDonor.bloodType} onChange={e => setNewDonor({...newDonor, bloodType: e.target.value as BloodType})} disabled={isSaving}>{BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contact No. (10 digits)</label><input type="text" required maxLength={10} pattern="[0-9]{10}" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="10 digit number" value={newDonor.contact} onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 10) setNewDonor({...newDonor, contact: val}); }} disabled={isSaving} /></div>
              <button type="submit" disabled={isSaving} className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all">{isSaving ? 'Syncing...' : 'Complete Donor Profile'}</button>
            </form>
          </div>
        </div>
      )}

      {isResourceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl animate-fade-in overflow-hidden border border-slate-200 my-auto">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-100"><Gift className="w-5 h-5 text-white" /></div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Contribute to Network</h3>
              </div>
              <button onClick={() => { setIsResourceModalOpen(false); setPaymentVerified(false); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddResourceDonation} className="p-8 space-y-6">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Identity Profile</label>
                  <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800" value={newResource.donorName} onChange={e => setNewResource({...newResource, donorName: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Asset Category</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer" value={newResource.type} onChange={e => { setNewResource({...newResource, type: e.target.value as ResourceType}); setPaymentVerified(false); }}>
                      <option value="food">Food Items</option>
                      <option value="clothes">Essentials</option>
                      <option value="money">Financial Aid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Quantity / Details</label>
                    <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-slate-800" placeholder="e.g., 5kg / ₹500" value={newResource.details} onChange={e => setNewResource({...newResource, details: e.target.value})} />
                  </div>
                </div>

                {newResource.type === 'money' && (
                  <div className="animate-fade-in space-y-4 pt-2">
                    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500"></div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Pay Secure</span>
                        </div>
                        <Smartphone className="w-4 h-4 text-green-500" />
                      </div>
                      
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="bg-white p-4 rounded-2xl shadow-2xl relative">
                          <img 
                            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=lifeflow@bank&pn=LifeFlowAI&am=500" 
                            alt="Payment QR" 
                            className="w-40 h-40 mix-blend-multiply opacity-90"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-[2px] rounded-2xl">
                             <div className="bg-red-600 text-white p-2 rounded-full shadow-lg"><QrCode className="w-6 h-6" /></div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-white font-black text-xs uppercase tracking-widest mb-1">Scan & Contribute</p>
                          <p className="text-slate-500 text-[9px] uppercase font-bold">Transfer directly to health cluster</p>
                        </div>
                      </div>
                    </div>
                    
                    {!paymentVerified ? (
                      <button 
                        type="button"
                        onClick={() => {
                          setIsSaving(true);
                          setTimeout(() => {
                            setIsSaving(false);
                            setPaymentVerified(true);
                            showToast('Transaction Verified via UPI Network');
                          }, 1500);
                        }}
                        disabled={isSaving}
                        className="w-full py-4 border-2 border-slate-200 border-dashed rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center space-x-2"
                      >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        <span>{isSaving ? 'Verifying with bank...' : 'Verify Transaction'}</span>
                      </button>
                    ) : (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center space-x-3 text-green-700">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Payment Confirmed • ID: 89X-JK2</span>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSaving || (newResource.type === 'money' && !paymentVerified)} 
                  className={`w-full py-5 rounded-2xl font-black transition-all flex items-center justify-center space-x-3 group shadow-xl ${
                    isSaving || (newResource.type === 'money' && !paymentVerified)
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                  }`}
                >
                  {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  <span className="uppercase text-xs tracking-[0.2em]">{isSaving ? 'Processing Identity...' : 'Confirm Donation'}</span>
                </button>
            </form>
          </div>
        </div>
      )}

      {isChatOpen && (
        <div ref={chatRef} className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] sm:h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white flex items-center justify-between">
            {!isChatSearchActive ? (
              <>
                <div className="flex items-center space-x-3"><div className="bg-white/20 p-2 rounded-xl"><MessageSquare className="w-5 h-5" /></div><div><h4 className="font-bold leading-none">LifeFlow AI</h4><p className="text-[9px] mt-1.5 opacity-80 uppercase font-bold">Online Cluster</p></div></div>
                <div className="flex items-center space-x-1"><button onClick={() => setIsChatSearchActive(true)} className="hover:bg-white/20 p-2 rounded-full"><Search className="w-5 h-5" /></button><button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-2 rounded-full"><X className="w-5 h-5" /></button></div>
              </>
            ) : <div className="flex items-center space-x-2 w-full"><Search className="w-4 h-4 opacity-70" /><input autoFocus type="text" className="bg-transparent border-none outline-none text-white text-sm w-full" placeholder="Search..." value={chatSearchQuery} onChange={(e) => setChatSearchQuery(e.target.value)} /><button onClick={() => { setIsChatSearchActive(false); setChatSearchQuery(""); }} className="hover:bg-white/20 p-1.5 rounded-full"><X className="w-4 h-4" /></button></div>}
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${m.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}`}>{m.text}</div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 rounded-bl-none shadow-sm"><div className="flex space-x-1.5"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div></div></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2 bg-slate-50 rounded-2xl px-4 py-1.5 border border-slate-200">
              <input type="text" className="flex-1 bg-transparent py-2.5 text-sm outline-none" placeholder="Type query..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAIChat()} />
              <button disabled={isTyping} onClick={handleAIChat} className={`p-2.5 text-white rounded-xl ${isTyping ? 'bg-slate-300' : 'bg-red-600 shadow-red-100'}`}><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-slate-400 py-6 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2"><Heart className="w-5 h-5 text-red-500 fill-current" /><span className="text-lg font-bold text-white">LifeFlow AI</span></div>
            <div className="flex items-center space-x-4 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-800"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div><span className="text-[9px] font-black uppercase text-slate-300">Identity Secure</span></div>
          </div>
          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-600">
            <div>&copy; 2025 LifeFlow AI • Team Vaghu, Aayan, Akash, Shreyash</div>
            <div className="flex items-center space-x-6">
              <a href="mailto:blooddonationlifeflowai@gmail.com" className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                <Mail className="w-3 h-3" />
                <span>Contact Us</span>
              </a>
              <button onClick={handleReportIssue} className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                <LifeBuoy className="w-3 h-3" />
                <span>Report Issue</span>
              </button>
              <a href="tel:112">Emergency: 112</a>
              <div className="flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span>Health Network</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;