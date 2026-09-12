export interface SoapProduct {
  id: string;
  name: string;
  subtitle: string;
  category: 'bar' | 'bundle' | 'accessory';
  price: number;
  originalPrice?: number;
  weightOz: number;
  rating: number;
  reviewCount: number;
  image: string;
  secondaryImage?: string;
  badge?: string;
  scentFamily: 'Floral & Calming' | 'Citrus & Uplifting' | 'Earthy & Herbal' | 'Detox & Clarifying' | 'Warm & Honey';
  skinType: ('Sensitive' | 'Dry' | 'Oily' | 'Combination' | 'Normal' | 'All Skin Types')[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  exfoliationLevel: 'None (Silky)' | 'Ultra Gentle' | 'Medium Botanical Scrub' | 'Deep Mineral Scrub';
  latherProfile: 'Ultra Creamy' | 'Velvety Bubbles' | 'Dense Froth';
  keyBotanicals: string[];
  fullIngredients: string[];
  description: string;
  benefits: string[];
  cureTimeWeeks: number;
  inStock: boolean;
}

export interface CartItem {
  product: SoapProduct;
  quantity: number;
}

export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  productName: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  skinType: string;
  verified: boolean;
  avatarUrl?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: {
    label: string;
    description: string;
    iconName: string;
    matchedProductIds: string[];
  }[];
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'crafting'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered';

export interface TrackingMilestone {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp: string;
  location: string;
  completed: boolean;
  current?: boolean;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryNotes?: string;
}

export interface OrderRecord {
  orderNumber: string;
  date: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'cod' | 'phonepe' | 'gpay' | 'upi';
  paymentStatus: 'paid' | 'pending_cod' | 'pending_host_verification' | 'verified' | 'rejected';
  transactionId?: string; // Submitted UTR / Txn ID
  utrNumber?: string;
  paymentVerifiedByHost?: boolean;
  paymentVerifiedAt?: string;
  paymentRejectedAt?: string;
  rejectionReason?: string;
  status: OrderStatus;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  dispatchDate?: string;
  estimatedDelivery?: string;
  curingStartedAt?: string;
  curingStartedAtMs?: number;
  curingCompleted?: boolean;
  curingCompletedAt?: string;
  curingCompletedAtMs?: number;
  milestones: TrackingMilestone[];
}

export interface HostAccount {
  id: string;
  username: string;
  name: string;
  role: 'host' | 'admin';
}

export interface UserAccount {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt: string;
}

export type ComplaintCategory =
  | 'damaged'
  | 'wrong_item'
  | 'missing_sample'
  | 'skin_reaction'
  | 'delivery_delay'
  | 'other';

export interface ComplaintMessage {
  id: string;
  sender: 'customer' | 'host';
  text: string;
  photo?: string; // base64 data URL, customer-attached photo (e.g. when host asks for proof)
  timestamp: string;
}

export interface ComplaintTicket {
  ticketId: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  category: ComplaintCategory;
  affectedProduct: string;
  description: string;
  status: 'submitted' | 'forwarded_whatsapp' | 'replied' | 'resolved';
  hostReply?: string;
  hostReplyAt?: string;
  // Full two-way conversation thread. The ticket's own `description` is
  // always shown as the customer's first message; anything after that
  // (host replies, follow-up customer replies/photos) lives here.
  messages: ComplaintMessage[];
}

