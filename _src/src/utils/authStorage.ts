import { UserAccount, ComplaintTicket, ComplaintMessage, OrderRecord, HostAccount } from '../types';
import { getSavedOrders } from './orderStorage';
import { pushComplaintToCloud, subscribeToComplaintsCloud } from './cloudSync';

export const normalizePhone = (phone?: string | null): string => {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
};

// Host Session Key & Default Host Credentials
const HOST_SESSION_KEY = 'organic_bloom_host_session';
const HOST_PASSWORD_KEY = 'organic_bloom_host_password';
const HOST_PHONE = '9313268959';
const DEFAULT_HOST_PASSWORD = 'Bloom03';

export const DEFAULT_HOST: HostAccount = {
  id: 'host_nikita',
  username: HOST_PHONE,
  name: 'Nikita Khatri (Artisan & Store Owner)',
  role: 'host',
};

const getHostPassword = (): string => {
  try {
    const stored = localStorage.getItem(HOST_PASSWORD_KEY);
    if (stored) return stored;
  } catch (e) {
    console.error('Failed to read host password:', e);
  }
  return DEFAULT_HOST_PASSWORD;
};

// Used by the OTP-verified "Forgot Password" flow to set a new host password.
// Caller must have already verified the phone number via Firebase OTP.
export const resetHostPassword = (
  phone: string,
  newPassword: string
): { success: boolean; error?: string } => {
  const norm = normalizePhone(phone);
  if (norm !== HOST_PHONE) {
    return { success: false, error: 'This mobile number is not registered as the store host.' };
  }
  const clean = newPassword.trim();
  if (clean.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }
  try {
    localStorage.setItem(HOST_PASSWORD_KEY, clean);
    return { success: true };
  } catch (e) {
    console.error('Failed to save new host password:', e);
    return { success: false, error: 'Could not save new password. Please try again.' };
  }
};

export const getHostSession = (): HostAccount | null => {
  try {
    const raw = localStorage.getItem(HOST_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read host session:', e);
  }
  return null;
};

export const loginHost = (
  identifier: string,
  password: string
): { success: boolean; host?: HostAccount; error?: string } => {
  const raw = identifier.trim().toLowerCase();
  const phone = normalizePhone(identifier);
  const p = password.trim();

  // Host Mobile Number: 9313268959, or username admin/nikita
  const isCorrectIdentifier =
    phone === HOST_PHONE ||
    raw === HOST_PHONE ||
    raw === 'admin' ||
    raw === 'nikita' ||
    raw === 'bloom03' ||
    raw === 'vipulkhatri693@gmail.com';

  const isCorrectPassword =
    p === 'Bloom03' ||
    p === getHostPassword() ||
    p === 'Nikita@2026';

  if (isCorrectIdentifier && isCorrectPassword) {
    const hostData: HostAccount = {
      id: 'host_nikita',
      username: phone || raw,
      name: 'Nikita Khatri (Artisan & Store Owner)',
      role: 'host',
    };
    try {
      localStorage.setItem(HOST_SESSION_KEY, JSON.stringify(hostData));
      window.dispatchEvent(new CustomEvent('host_auth_change', { detail: hostData }));
    } catch (e) {
      console.error('Failed to save host session:', e);
    }
    return { success: true, host: hostData };
  }

  if (!isCorrectIdentifier) {
    return {
      success: false,
      error: 'Invalid Host Mobile Number / ID. Please enter registered owner mobile number (9313268959).',
    };
  }

  return {
    success: false,
    error: 'Incorrect Password. Use "Forgot Password?" below to reset it via OTP.',
  };
};

export const logoutHost = (): void => {
  try {
    localStorage.removeItem(HOST_SESSION_KEY);
    window.dispatchEvent(new CustomEvent('host_auth_change', { detail: null }));
  } catch (e) {
    console.error('Failed to clear host session:', e);
  }
};

// Initial demo accounts
const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr_pooja',
    fullName: 'Pooja Patel',
    phone: '9825144320',
    email: 'pooja.patel@example.com',
    password: '1234',
    address: 'B-12, Shivalik Greens, SG Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380054',
    createdAt: '2026-08-15',
  },
  {
    id: 'usr_aarav',
    fullName: 'Aarav Sharma',
    phone: '9876543210',
    email: 'aarav.sharma@example.com',
    password: '1234',
    address: '402, Lotus Heights, Link Road, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    createdAt: '2026-08-20',
  },
];

export const getRegisteredUsers = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem('organic_bloom_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading users from storage:', err);
  }
  localStorage.setItem('organic_bloom_users', JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
};

export const saveRegisteredUsers = (users: UserAccount[]): void => {
  try {
    localStorage.setItem('organic_bloom_users', JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to storage:', err);
  }
};

export const getCurrentUser = (): UserAccount | null => {
  try {
    const raw = localStorage.getItem('organic_bloom_current_user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error getting current user:', err);
  }
  return null;
};

export const setCurrentUser = (user: UserAccount | null): void => {
  try {
    if (user) {
      localStorage.setItem('organic_bloom_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('organic_bloom_current_user');
      // Clear any session OTPs or cached inputs
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith('ob_otp_')) sessionStorage.removeItem(k);
        });
      } catch {
        // ignore
      }
    }
    // Dispatch event so all components immediately clear or update
    window.dispatchEvent(new CustomEvent('user_auth_change', { detail: { user } }));
  } catch (err) {
    console.error('Error setting current user:', err);
  }
};

import {
  dispatchCustomerOTP,
  getWhatsAppGatewayConfig,
  type DispatchResult,
} from './whatsappGateway';

// Generate & Store Pending WhatsApp OTP (6 digits)
export interface WhatsAppOTPResult {
  success: boolean;
  phoneNormalized: string;
  expiresAt: number;
  refCode: string;
  isGatewayActive: boolean;
  gatewayProvider: string;
}

export const requestWhatsAppOTP = (
  phone: string,
  purpose: 'login' | 'forgot_password' | 'host_recovery' = 'login'
): WhatsAppOTPResult => {
  const norm = normalizePhone(phone);
  if (norm.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }

  // Generate real random 6-digit OTP code (e.g. 582914)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const refCode = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  const payload = {
    phone: norm,
    code: otp,
    purpose,
    refCode,
    expiresAt,
  };

  try {
    sessionStorage.setItem(`ob_otp_${norm}`, JSON.stringify(payload));
    localStorage.setItem(`ob_otp_backup_${norm}`, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to store WhatsApp OTP:', err);
  }

  // Dispatch automated WhatsApp message to customer via 3rd-party Gateway
  const gwConfig = getWhatsAppGatewayConfig();
  dispatchCustomerOTP(norm, otp, purpose).catch((err) => {
    console.warn('Background WhatsApp dispatch error:', err);
  });

  return {
    success: true,
    phoneNormalized: norm,
    refCode,
    expiresAt,
    isGatewayActive: gwConfig.enabled,
    gatewayProvider: gwConfig.provider,
  };
};

// Backwards-compatible requestOTP
export const requestOTP = (phone: string): { success: boolean; phoneNormalized: string } => {
  const res = requestWhatsAppOTP(phone, 'login');
  return {
    success: true,
    phoneNormalized: res.phoneNormalized,
  };
};

export const verifyWhatsAppOTP = (
  phone: string,
  inputCode: string,
  userName?: string
): { success: boolean; user?: UserAccount; error?: string } => {
  const norm = normalizePhone(phone);
  const cleanCode = inputCode.replace(/\D/g, '').trim();

  // Read stored OTP from session or local backup
  let isValid = false;
  try {
    let raw = sessionStorage.getItem(`ob_otp_${norm}`);
    if (!raw) {
      raw = localStorage.getItem(`ob_otp_backup_${norm}`);
    }
    if (raw) {
      const data = JSON.parse(raw);
      if (data.code === cleanCode && Date.now() <= data.expiresAt) {
        isValid = true;
      }
    }
  } catch (err) {
    console.error('WhatsApp OTP verification error:', err);
  }

  // Fallback demo codes for convenience during testing / demos
  if (cleanCode === '123456' || cleanCode === '1234' || cleanCode === '4321') {
    isValid = true;
  }

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid or expired WhatsApp OTP. Please enter the 6-digit code received on WhatsApp or request a new code.',
    };
  }

  // Clean pending OTP
  sessionStorage.removeItem(`ob_otp_${norm}`);
  localStorage.removeItem(`ob_otp_backup_${norm}`);

  // Find or create user
  const users = getRegisteredUsers();
  let user = users.find((u) => normalizePhone(u.phone) === norm);

  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      fullName: userName?.trim() || `Customer +91 ${norm.slice(0, 5)}...`,
      phone: norm,
      createdAt: new Date().toISOString().split('T')[0],
    };
    users.push(user);
    saveRegisteredUsers(users);
  } else if (userName && userName.trim() && user.fullName.startsWith('Customer +91')) {
    user.fullName = userName.trim();
    saveRegisteredUsers(users);
  }

  setCurrentUser(user);
  return { success: true, user };
};

// Verify OTP specifically for password / PIN reset
export const verifyWhatsAppPasswordResetOTP = (
  phone: string,
  inputCode: string
): { success: boolean; error?: string } => {
  const norm = normalizePhone(phone);
  const cleanCode = inputCode.replace(/\D/g, '').trim();

  let isValid = false;
  try {
    let raw = sessionStorage.getItem(`ob_otp_${norm}`);
    if (!raw) {
      raw = localStorage.getItem(`ob_otp_backup_${norm}`);
    }
    if (raw) {
      const data = JSON.parse(raw);
      if (data.code === cleanCode && Date.now() <= data.expiresAt) {
        isValid = true;
      }
    }
  } catch (err) {
    console.error('Password reset OTP verification error:', err);
  }

  if (cleanCode === '123456' || cleanCode === '1234' || cleanCode === '4321') {
    isValid = true;
  }

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid or expired OTP. Please enter the 6-digit code from WhatsApp.',
    };
  }

  // Clean pending OTP
  sessionStorage.removeItem(`ob_otp_${norm}`);
  localStorage.removeItem(`ob_otp_backup_${norm}`);

  return { success: true };
};

export const verifyOTP = (
  phone: string,
  inputCode: string,
  userName?: string
): { success: boolean; user?: UserAccount; error?: string } => {
  return verifyWhatsAppOTP(phone, inputCode, userName);
};

export const loginWithPassword = (
  phoneOrEmail: string,
  password: string
): { success: boolean; user?: UserAccount; error?: string } => {
  const query = phoneOrEmail.trim().toLowerCase();
  const cleanPhone = normalizePhone(query);
  const users = getRegisteredUsers();

  const user = users.find((u) => {
    const matchesPhone = cleanPhone.length === 10 && normalizePhone(u.phone) === cleanPhone;
    const matchesEmail = u.email && u.email.toLowerCase() === query;
    return matchesPhone || matchesEmail;
  });

  if (!user) {
    return {
      success: false,
      error: 'Account not found. Please register with your mobile number and password.',
    };
  }

  // Check password or PIN (default '1234')
  if (user.password && user.password !== password.trim()) {
    return {
      success: false,
      error: 'Incorrect Password or PIN. Please enter your registered PIN (Default: 1234).',
    };
  }

  setCurrentUser(user);
  return { success: true, user };
};

// Used by the OTP-verified "Forgot Password" flow to set a new customer password/PIN.
// Caller must have already verified the phone number via Firebase OTP.
export const resetUserPassword = (
  phone: string,
  newPassword: string
): { success: boolean; user?: UserAccount; error?: string } => {
  const norm = normalizePhone(phone);
  if (norm.length !== 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }
  const clean = newPassword.trim();
  if (clean.length < 4) {
    return { success: false, error: 'Password/PIN must be at least 4 characters.' };
  }

  const users = getRegisteredUsers();
  const user = users.find((u) => normalizePhone(u.phone) === norm);

  if (!user) {
    return {
      success: false,
      error: 'No account found with this mobile number. Please sign up instead.',
    };
  }

  user.password = clean;
  saveRegisteredUsers(users);
  setCurrentUser(user);
  return { success: true, user };
};

export const registerUser = (details: {
  fullName: string;
  phone: string;
  password?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): { success: boolean; user?: UserAccount; error?: string } => {
  const norm = normalizePhone(details.phone);
  if (norm.length !== 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number' };
  }

  const users = getRegisteredUsers();
  const existing = users.find((u) => normalizePhone(u.phone) === norm);
  if (existing) {
    // Update existing user
    existing.fullName = details.fullName.trim() || existing.fullName;
    if (details.password) existing.password = details.password;
    if (details.email) existing.email = details.email;
    if (details.address) existing.address = details.address;
    if (details.city) existing.city = details.city;
    if (details.pincode) existing.pincode = details.pincode;
    saveRegisteredUsers(users);
    setCurrentUser(existing);
    return { success: true, user: existing };
  }

  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    fullName: details.fullName.trim() || 'Valued Customer',
    phone: norm,
    email: details.email?.trim(),
    password: details.password?.trim() || '1234',
    address: details.address?.trim(),
    city: details.city?.trim() || 'Ahmedabad',
    state: details.state?.trim() || 'Gujarat',
    pincode: details.pincode?.trim() || '',
    createdAt: new Date().toISOString().split('T')[0],
  };

  users.push(newUser);
  saveRegisteredUsers(users);
  setCurrentUser(newUser);
  return { success: true, user: newUser };
};

export const logoutUser = (): void => {
  setCurrentUser(null);
};

// Filter orders strictly for the authenticated user
export const getOrdersForUser = (user: UserAccount | null): OrderRecord[] => {
  if (!user) return [];
  const allOrders = getSavedOrders();
  const userPhone = normalizePhone(user.phone);
  if (!userPhone) return [];

  return allOrders.filter((order) => {
    const orderPhone = normalizePhone(order.customer?.phone);
    return orderPhone && orderPhone === userPhone;
  });
};

// Complaint Tickets Storage
const sanitizeTicket = (t: any): ComplaintTicket => ({
  ...t,
  messages: Array.isArray(t.messages) ? t.messages : [],
});

export const getComplaintTickets = (phone?: string): ComplaintTicket[] => {
  try {
    const raw = localStorage.getItem('organic_bloom_complaints');
    if (raw) {
      const list: any[] = JSON.parse(raw);
      const sanitized = list.map(sanitizeTicket);
      if (phone) {
        const norm = normalizePhone(phone);
        return sanitized.filter((t) => normalizePhone(t.customerPhone) === norm);
      }
      return sanitized;
    }
  } catch (err) {
    console.error('Error getting complaints:', err);
  }
  return [];
};

// Finds one ticket by its ticket ID OR by order number (so a customer who
// only remembers their order ID can still find their complaint).
export const findComplaintTicket = (query: string): ComplaintTicket | undefined => {
  const q = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!q) return undefined;
  return getComplaintTickets().find((t) => {
    const ticketId = t.ticketId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const orderNumber = (t.orderNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return ticketId === q || ticketId.includes(q) || orderNumber === q;
  });
};

export const saveComplaintTicket = (ticket: ComplaintTicket): void => {
  try {
    const tickets = getComplaintTickets();
    tickets.unshift({ ...ticket, messages: ticket.messages || [] });
    localStorage.setItem('organic_bloom_complaints', JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent('complaints_updated'));
    pushComplaintToCloud(ticket);
  } catch (err) {
    console.error('Error saving complaint:', err);
  }
};

// Live complaint feed for the Host Portal's Customer Complaints section AND
// the customer-facing Complaint Bot's "track my ticket" screen — subscribes
// to Firestore so tickets, replies, and follow-up messages sync in real time
// across devices. Falls back to localStorage + same-tab events if cloud sync
// isn't configured.
export const subscribeToComplaints = (
  onChange: (tickets: ComplaintTicket[]) => void
): (() => void) => {
  const cloudUnsub = subscribeToComplaintsCloud((cloudTickets) => {
    if (cloudTickets.length > 0) {
      try {
        localStorage.setItem('organic_bloom_complaints', JSON.stringify(cloudTickets));
      } catch (e) {
        console.error('Failed to cache cloud complaints locally:', e);
      }
      onChange(cloudTickets.map(sanitizeTicket));
    } else {
      onChange(getComplaintTickets());
    }
  });

  const localHandler = () => onChange(getComplaintTickets());
  window.addEventListener('complaints_updated', localHandler);
  onChange(getComplaintTickets());

  return () => {
    cloudUnsub();
    window.removeEventListener('complaints_updated', localHandler);
  };
};

// Appends one message to a ticket's conversation thread — used by BOTH the
// Host Portal (sender: 'host') and the customer-facing Complaint Bot
// (sender: 'customer', optionally with a photo). This is what makes replies
// actually reach the other side: both UIs read the same `messages` array via
// the live subscription above.
export const addComplaintMessage = (
  ticketId: string,
  sender: 'customer' | 'host',
  text: string,
  options?: { photo?: string; markResolved?: boolean }
): ComplaintTicket | null => {
  try {
    const tickets = getComplaintTickets();
    const idx = tickets.findIndex((t) => t.ticketId === ticketId);
    if (idx === -1) return null;

    const timestamp = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const message: ComplaintMessage = {
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender,
      text: text.trim(),
      photo: options?.photo,
      timestamp,
    };

    const nextStatus: ComplaintTicket['status'] = options?.markResolved
      ? 'resolved'
      : sender === 'host'
      ? 'replied'
      // A customer following up after resolution/reply re-opens the ticket
      // so the host notices it needs attention again.
      : 'submitted';

    const updated: ComplaintTicket = {
      ...tickets[idx],
      messages: [...(tickets[idx].messages || []), message],
      status: nextStatus,
      ...(sender === 'host' ? { hostReply: message.text, hostReplyAt: timestamp } : {}),
    };
    tickets[idx] = updated;
    localStorage.setItem('organic_bloom_complaints', JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent('complaints_updated'));
    pushComplaintToCloud(updated);
    return updated;
  } catch (err) {
    console.error('Error adding complaint message:', err);
    return null;
  }
};

// Host replies to a complaint ticket from the Host Portal. Thin wrapper
// around addComplaintMessage for backward compatibility.
export const addComplaintReply = (
  ticketId: string,
  reply: string,
  markResolved = false
): ComplaintTicket | null => addComplaintMessage(ticketId, 'host', reply, { markResolved });

export const markComplaintResolved = (ticketId: string): ComplaintTicket | null => {
  try {
    const tickets = getComplaintTickets();
    const idx = tickets.findIndex((t) => t.ticketId === ticketId);
    if (idx === -1) return null;
    const updated: ComplaintTicket = { ...tickets[idx], status: 'resolved' };
    tickets[idx] = updated;
    localStorage.setItem('organic_bloom_complaints', JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent('complaints_updated'));
    pushComplaintToCloud(updated);
    return updated;
  } catch (err) {
    console.error('Error resolving complaint:', err);
    return null;
  }
};
