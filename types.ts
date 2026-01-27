
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
  lastDonation: string;
}

export interface Recipient {
  id: number;
  name: string;
  age: number;
  bloodType: BloodType;
  contact: string;
  condition: string;
}

export interface BloodBag {
  id: number;
  type: BloodType;
  volume: string;
  donationDate: string;
  expiryDate: string;
}
