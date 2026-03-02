import React, { useState } from 'react';
import { Send, Mail, User, MessageSquare, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface ContactUsProps {
  onBack: () => void;
  companyEmail: string;
}

export const ContactUs: React.FC<ContactUsProps> = ({ onBack, companyEmail }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Form submitted to:', companyEmail, formData);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-fade-in">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Message Sent!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Thank you for reaching out. Our team will review your message and get back to you at <strong>{formData.email}</strong> as soon as possible.
          </p>
          <button 
            onClick={onBack}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Contact Us</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="text" 
                      required 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="email" 
                      required 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Subject</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800"
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Message</label>
                <textarea 
                  required 
                  rows={5}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-800 resize-none"
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-700 shadow-xl shadow-red-100 transition-all flex items-center justify-center space-x-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span>{isSubmitting ? 'Sending Message...' : 'Send Message'}</span>
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Contact Info</h4>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-slate-800 rounded-xl text-red-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email Us</p>
                  <p className="text-sm font-bold">{companyEmail}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-slate-800 rounded-xl text-red-500">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Chat</p>
                  <p className="text-sm font-bold">Available 24/7 via AI Assistant</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
            <h4 className="text-xs font-black uppercase tracking-widest text-red-400 mb-4">Emergency?</h4>
            <p className="text-sm text-red-800 font-medium leading-relaxed mb-6">
              If this is a medical emergency or you need blood urgently, please use our AI Matching Center or call emergency services immediately.
            </p>
            <a 
              href="tel:112"
              className="block w-full py-4 bg-white text-red-600 text-center rounded-xl font-black uppercase text-[10px] tracking-widest border border-red-200 shadow-sm"
            >
              Call 112 Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
