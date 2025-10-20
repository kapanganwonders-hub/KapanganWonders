// src/types/adminTypes.ts

export interface BaseAdmin {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLogin: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  type: 'barangay' | 'spotOwner';
}

export interface BarangayAdmin extends BaseAdmin {
  type: 'barangay';
  barangay: string;
  contactNumber: string;
  approvedBy?: string; // ID of admin who approved this account
  approvedAt?: string;
  isVerified: boolean;
}

export interface SpotOwnerAdmin extends BaseAdmin {
  type: 'spotOwner';
  businessName: string;
  businessAddress: string;
  contactNumber: string;
  businessPermitNumber: string;
  approvedBy?: string; // ID of admin who approved this account
  approvedAt?: string;
  isVerified: boolean;
  spotsOwned?: string[]; // Array of spot IDs owned by this user
}

export type AdminUser = BarangayAdmin | SpotOwnerAdmin;
