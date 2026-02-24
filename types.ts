
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'donor' | 'recipient' | 'admin';
  bloodType?: BloodType;
}

export interface Donor {
  id: number;
  name: string;
  age: number;
  bloodType: BloodType;
  contact: string;
  email: string;
  lastDonation: string;
}

export interface Recipient {
  id: number;
  name: string;
  age: number;
  bloodType: BloodType;
  contact: string;
  email: string;
  condition: string;
}

export interface BloodBag {
  id: number;
  type: BloodType;
  volume: string;
  donationDate: string;
  expiryDate: string;
}

export type ResourceType = 'food' | 'clothes' | 'money';

export interface ResourceDonation {
  id: number;
  type: ResourceType;
  donorName: string;
  details: string; // e.g., "5kg Rice", "10 Shirts", "$50"
  date: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'inventory' | 'match' | 'system' | 'reminder';
  timestamp: string;
  read: boolean;
}

export interface NotificationSettings {
  inventoryAlerts: boolean;
  matchAlerts: boolean;
  systemAlerts: boolean;
}
