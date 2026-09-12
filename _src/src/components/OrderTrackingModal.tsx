import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  MessageCircle,
  AlertCircle,
  Sparkles,
  FileText,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Lock,
  User,
  KeyRound,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { OrderRecord, OrderStatus, CartItem, UserAccount, ComplaintTicket } from '../types';
import { findOrder, getSavedOrders, getSampleDemoOrders, resubmitPaymentUtr } from '../utils/orderStorage';
import { getCurrentUser, getOrdersForUser, logoutUser, normalizePhone, subscribeToComplaints } from '../utils/authStorage';
import { BRAND_INFO } from '../data/soaps';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
  initialTab?: 'history' | 'tracking';
  onPlaceNewOrder?: () => void;
  onReorder?: (items: CartItem[]) => void;
  onOpenAuth?: () => void;
  onOpenComplaint?: (orderNum?: string) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber,
  initialTab = 'tracking',
  onPlaceNewOrder,
  onReorder,
  onOpenAuth,
  onOpenComplaint,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'tracking'>('tracking');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Resubmit UTR states
  const [resubmitUtrValue, setResubmitUtrValue] = useState('');
  const [resubmitSuccess, setResubmitSuccess] = useState<string | null>(null);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [orderComplaints, setOrderComplaints] = useState<ComplaintTicket[]>([]);

  // Live-subscribe to complaint tickets for the order currently being viewed,
  // so a store reply sent from the Host Portal shows up here automatically.
  useEffect(() => {
    if (!activeOrder?.orderNumber) {
      setOrderComplaints([]);
      return;
    }
    const unsub = subscribeToComplaints((tickets) => {
      setOrderComplaints(tickets.filter((t) => t.orderNumber === activeOrder.orderNumber));
    });
    return unsub;
  }, [activeOrder?.orderNumber]);

  const refreshOrders = () => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (user) {
      // Authenticated user: show strictly their orders
      const userOrders = getOrdersForUser(user);
      setAllOrders(userOrders);
      if (initialOrderNumber) {
        const match = userOrders.find(
          (o) => o.orderNumber.toLowerCase() === initialOrderNumber.toLowerCase()
        );
        if (match) {
          setActiveOrder(match);
          setSearchQuery(match.orderNumber);
        } else {
          setActiveOrder(null);
          setSearchQuery(initialOrderNumber);
        }
      } else if (userOrders.length > 0) {
        setActiveOrder(userOrders[0]);
        setSearchQuery(userOrders[0].orderNumber);
      } else {
        // User has no orders placed yet
        setActiveOrder(null);
        setSearchQuery('');
      }
    } else {
      // Guest: do not display other customers' orders
      setAllOrders([]);
      if (initialOrderNumber) {
        const match = findOrder(initialOrderNumber);
        setActiveOrder(match || null);
        setSearchQuery(initialOrderNumber);
      } else {
        setActiveOrder(null);
        setSearchQuery('');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshOrders();

      if (initialOrderNumber) {
        setSearchQuery(initialOrderNumber);
        const match = findOrder(initialOrderNumber);
        if (match) {
          setActiveOrder(match);
          setActiveTab('tracking');
          setHasSearched(true);
          return;
        }
      }

      if (initialTab === 'history') {
        setActiveTab('history');
      } else {
        setActiveTab('tracking');
      }
    }
  }, [isOpen, initialOrderNumber, initialTab]);

  // Listen for user login/logout events
  useEffect(() => {
    const handleAuthChange = () => {
      refreshOrders();
    };
    window.addEventListener('user_auth_change', handleAuthChange);
    return () => window.removeEventListener('user_auth_change', handleAuthChange);
  }, []);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) {
      setActiveOrder(allOrders[0] || null);
      return;
    }

    if (currentUser) {
      // For authenticated customer: strictly search within their own orders
      const userOrders = getOrdersForUser(currentUser);
      const found = userOrders.find((o) => {
        const ordMatch = o.orderNumber.toLowerCase() === clean;
        const trackMatch = Boolean(o.trackingId && o.trackingId.toLowerCase() === clean);
        return ordMatch || trackMatch;
      });
      setActiveOrder(found || null);
    } else {
      // Guest: can track by order # or tracking ID
      const found = findOrder(clean);
      setActiveOrder(found || null);
    }
    setActiveTab('tracking');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setAllOrders([]);
    setActiveOrder(null);
    setSearchQuery('');
  };

  const handleSelectOrder = (ord: OrderRecord) => {
    setActiveOrder(ord);
    setSearchQuery(ord.orderNumber);
    setActiveTab('tracking');
    setHasSearched(true);
  };

  const handleCopyTracking = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTracking(id);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const handleStartNewOrder = () => {
    onClose();
    if (onPlaceNewOrder) {
      onPlaceNewOrder();
    } else {
      const el = document.getElementById('collection');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReorderClick = (items: CartItem[]) => {
    if (onReorder) {
      onReorder(items);
    }
    onClose();
  };

  const handleReportComplaint = (orderNum: string) => {
    onClose();
    if (onOpenComplaint) {
      onOpenComplaint(orderNum);
    }
  };

  const handleResubmitUtr = (orderNumber: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitUtrValue.trim()) {
      setResubmitError('Please enter your 12-digit UTR / transaction reference number.');
      return;
    }
    const cleanUtr = resubmitUtrValue.trim();
    if (cleanUtr.length < 6) {
      setResubmitError('Please enter a valid UTR number (at least 6 characters, standard is 12 digits).');
      return;
    }

    setIsSubmittingUtr(true);
    setTimeout(() => {
      const updated = resubmitPaymentUtr(orderNumber, cleanUtr);
      setIsSubmittingUtr(false);
      if (updated) {
        setActiveOrder(updated);
        refreshOrders();
        setResubmitSuccess('New UTR submitted! Host Nikita Khatri has been notified to re-verify.');
        setResubmitUtrValue('');
        setResubmitError(null);
      } else {
        setResubmitError('Could not update UTR. Please try again or message Nikita on WhatsApp.');
      }
    }, 400);
  };

  const getStatusBadge = (status: OrderStatus, paymentStatus?: string) => {
    if (paymentStatus === 'rejected') {
      return {
        text: '❌ Payment Rejected (Invalid UTR)',
        bg: 'bg-[#DC2626] text-white font-bold',
        icon: <XCircle className="w-3.5 h-3.5 text-white" />,
      };
    }

    if (paymentStatus === 'pending_host_verification') {
      return {
        text: 'Pending Host PhonePe Verification',
        bg: 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]',
        icon: <Clock className="w-3.5 h-3.5 text-[#B45309]" />,
      };
    }

    switch (status) {
      case 'delivered':
        return {
          text: 'Delivered at Doorstep',
          bg: 'bg-[#15803D] text-white',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'out_for_delivery':
        return {
          text: 'Out for Delivery Today',
          bg: 'bg-[#E3B873] text-[#1C2C20] font-bold',
          icon: <Truck className="w-3.5 h-3.5" />,
        };
      case 'in_transit':
        return {
          text: 'In Transit to City Hub',
          bg: 'bg-[#2563EB] text-white',
          icon: <Truck className="w-3.5 h-3.5 animate-pulse" />,
        };
      case 'shipped':
        return {
          text: 'Dispatched via Courier',
          bg: 'bg-[#5F259F] text-white',
          icon: <Package className="w-3.5 h-3.5" />,
        };
      case 'crafting':
        return {
          text: 'Handcrafting & Botanical Curing (2-3 Days)',
          bg: 'bg-[#D97706] text-white',
          icon: <Sparkles className="w-3.5 h-3.5" />,
        };
      case 'confirmed':
        return {
          text: 'Payment Confirmed by Host',
          bg: 'bg-[#047857] text-white',
          icon: <Check className="w-3.5 h-3.5 stroke-[3]" />,
        };
      default:
        return {
          text: 'Order Placed',
          bg: 'bg-[#263E2E] text-white',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div
      id="order-tracking-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div
        id="order-tracking-modal"
        className="bg-[#FAF7F2] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E4DCCF] overflow-hidden relative my-auto p-5 sm:p-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#4A443A] hover:text-[#2C2926] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          aria-label="Close tracking modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E8DFD3]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E5EFE6] text-[#263E2E] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#1C2C20]">
                Orders &amp; Live Tracking
              </h2>
              <p className="text-[11px] text-[#696053]">
                Handcrafted Melt &amp; Pour Soaps • Pan-India Courier Updates &amp; Secure Order History
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Action: Place New Order Button */}
            <button
              type="button"
              onClick={handleStartNewOrder}
              className="px-3.5 py-1.5 rounded-full bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Sparkles className="w-3 h-3 text-[#E3B873]" />
              <span>+ Place New Order</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Live Tracking vs Order History */}
        <div className="flex items-center gap-2 mb-4 bg-[#EDE5D8] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tracking'
                ? 'bg-white text-[#1C2C20] shadow-xs'
                : 'text-[#5C5346] hover:text-[#1C2C20]'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-[#263E2E]" />
            <span>Live Shipment Tracking</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#1C2C20] shadow-xs'
                : 'text-[#5C5346] hover:text-[#1C2C20]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#263E2E]" />
            <span>My Order History {currentUser ? `(${allOrders.length})` : '🔒'}</span>
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
            {/* AUTHENTICATION GATE: User must be logged in via Mobile OTP or Password to view history */}
            {!currentUser ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-[#DDD3C2] p-6 space-y-3.5 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF4EB] text-[#263E2E] flex items-center justify-center mx-auto border border-[#E9DFD1]">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-[#1C2C20]">
                    Customer Login Required
                  </h3>
                  <p className="text-xs text-[#696053] max-w-sm mx-auto leading-relaxed">
                    Your orders and shipping addresses are protected. Please log in with your registered 10-digit mobile number and PIN to access your personal order history.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <KeyRound className="w-4 h-4 text-[#E3B873]" />
                    <span>Log In to View Orders</span>
                  </button>
                </div>

                {/* Demo accounts hint */}
                <div className="mt-3 pt-3 border-t border-[#F0EAE0] text-[11px] text-[#7A7265] max-w-sm mx-auto">
                  <span>Demo numbers: </span>
                  <strong className="text-[#263E2E]">98251 44320</strong> (Pooja) •{' '}
                  <strong className="text-[#263E2E]">98765 43210</strong> (Aarav) • OTP / PIN: <strong>1234</strong>
                </div>
              </div>
            ) : (
              /* Authenticated User Order History */
              <div className="space-y-3">
                {/* User Session Bar */}
                <div className="flex items-center justify-between bg-[#E5EFE6] px-3.5 py-2 rounded-xl border border-[#C5DBC7] text-xs">
                  <div className="flex items-center gap-2 text-[#1C2C20]">
                    <User className="w-4 h-4 text-[#263E2E]" />
                    <span>
                      Logged in: <strong>{currentUser.fullName}</strong> (+91 {currentUser.phone})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[11px] font-bold text-[#842029] bg-white px-2.5 py-1 rounded-lg border border-[#FCA5A5] hover:bg-[#FEE2E2] cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C2C20] uppercase tracking-wider">
                    Your Orders ({allOrders.length})
                  </span>
                  <span className="text-[11px] text-[#696053]">
                    Click any order to view live docket
                  </span>
                </div>

                {allOrders.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-[#DDD3C2] p-6 space-y-3">
                    <Package className="w-10 h-10 text-[#A89F91] mx-auto" />
                    <h3 className="font-display text-lg font-semibold text-[#1C2C20]">
                      No orders placed with +91 {currentUser.phone} yet
                    </h3>
                    <p className="text-xs text-[#696053] max-w-sm mx-auto">
                      Explore our handcrafted botanical soaps and place your first order.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartNewOrder}
                      className="mt-2 px-5 py-2 rounded-xl bg-[#263E2E] text-white text-xs font-bold hover:bg-[#1A2E20] cursor-pointer"
                    >
                      Explore Herbal Soaps
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                    {allOrders.map((ord) => {
                      const badge = getStatusBadge(ord.status, ord.paymentStatus);
                      return (
                        <div
                          key={ord.orderNumber}
                          className="p-4 rounded-xl bg-white border border-[#DDD3C2] hover:border-[#263E2E] transition-all shadow-xs space-y-3"
                        >
                          {/* Top Row: Order ID, Date & Status */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F0EAE0]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-[#1C2C20]">
                                  {ord.orderNumber}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${badge.bg}`}
                                >
                                  {badge.icon}
                                  <span>{badge.text}</span>
                                </span>
                              </div>
                              <span className="text-[11px] text-[#7A7265] block mt-0.5">
                                📅 {ord.date}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-[#7A7265] block uppercase">
                                Total Payable
                              </span>
                              <span className="font-bold text-sm text-[#263E2E]">
                                ₹{ord.total}
                              </span>
                            </div>
                          </div>

                          {/* Rejection Notification Banner in Order Card */}
                          {ord.paymentStatus === 'rejected' && (
                            <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-[11px] text-[#991B1B] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                                <span>
                                  <strong>Payment Rejected:</strong> {ord.rejectionReason || 'UTR not verified'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectOrder(ord)}
                                className="px-3 py-1 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-bold shrink-0 cursor-pointer shadow-2xs"
                              >
                                Submit Valid UTR →
                              </button>
                            </div>
                          )}

                          {/* Items & Destination Preview */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] text-[#7A7265] uppercase font-semibold block">
                                Items ({ord.items.reduce((s, i) => s + i.quantity, 0)} bars):
                              </span>
                              <div className="space-y-0.5">
                                {ord.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-[#38332B] text-[11px]"
                                  >
                                    <span className="line-clamp-1">
                                      • {item.quantity}x {item.product.name}
                                    </span>
                                    <span className="font-mono text-[#5A5246]">
                                      ₹{item.product.price * item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1 sm:border-l sm:border-[#F0EAE0] sm:pl-3">
                              <span className="text-[10px] text-[#7A7265] uppercase font-semibold block">
                                Destination:
                              </span>
                              <p className="text-[11px] text-[#38332B] line-clamp-2">
                                <strong className="text-[#1C2C20]">
                                  {ord.customer.fullName}
                                </strong>{' '}
                                • {ord.customer.city}, {ord.customer.pincode}
                              </p>
                              <p className="text-[11px] text-[#263E2E] font-mono">
                                AWB: {ord.trackingId || 'DEL84920193IN'}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons for this order */}
                          <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#F5EFE6]">
                            <button
                              type="button"
                              onClick={() => handleSelectOrder(ord)}
                              className="py-2 px-3 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Track Live</span>
                            </button>

                            {/* COMPLAINT BUTTON: Triggers the Complaint Bot */}
                            <button
                              type="button"
                              onClick={() => handleReportComplaint(ord.orderNumber)}
                              className="py-2 px-3 rounded-lg bg-[#FAF0E6] hover:bg-[#F3E5D4] text-[#8C4A15] border border-[#E8CEB5] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="Report damaged bar, wrong item, or query to Nikita via Care Bot"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-[#C48039]" />
                              <span>Report Problem / Complain</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReorderClick(ord.items)}
                              className="py-2 px-3 rounded-lg bg-[#EAE2D5] hover:bg-[#DFD5C6] text-[#2C2926] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="Add these items back to your bag"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Order Again</span>
                            </button>

                            <a
                              href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                                `Hi Nikita! Please update me on my Organic Bloom Order #${ord.orderNumber} (AWB: ${ord.trackingId})`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bottom New Order Banner */}
            <div className="p-3.5 rounded-xl bg-[#EDE5D8] border border-[#DDD3C2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-display text-sm font-bold text-[#1C2C20] block">
                  Ready to Order More Soaps?
                </span>
                <p className="text-xs text-[#5D554C]">
                  Explore Charcoal, Rice, or 18-Herbal Bridal Ubtan soap bars with free pan-India shipping.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartNewOrder}
                className="px-4 py-2 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#E3B873]" />
                <span>Place New Order Now</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE SHIPMENT TRACKING */}
        {activeTab === 'tracking' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8A8174] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Order # (e.g. OB-849201) or AWB Tracking # or 10-digit Phone"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] placeholder-[#9E9588] focus:outline-none focus:border-[#263E2E]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-semibold cursor-pointer transition-colors shrink-0"
                >
                  Track
                </button>
              </div>

              {/* Order quick switcher pills */}
              {allOrders.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#7A7265] font-semibold">Saved orders:</span>
                  {allOrders.map((ord) => (
                    <button
                      key={ord.orderNumber}
                      type="button"
                      onClick={() => handleSelectOrder(ord)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono cursor-pointer transition-colors border ${
                        activeOrder?.orderNumber === ord.orderNumber
                          ? 'bg-[#263E2E] text-white border-[#263E2E]'
                          : 'bg-[#EAE2D5] hover:bg-[#DDD2C2] text-[#3B352D] border-[#D4C8B8]'
                      }`}
                    >
                      {ord.orderNumber}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {activeOrder ? (
              <div className="space-y-3.5">
                {/* Primary Order Overview Card */}
                <div className="p-4 rounded-xl bg-white border border-[#DDD3C2] shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F0EBE1]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#1C2C20]">
                          {activeOrder.orderNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                            getStatusBadge(activeOrder.status, activeOrder.paymentStatus).bg
                          }`}
                        >
                          {getStatusBadge(activeOrder.status, activeOrder.paymentStatus).icon}
                          <span>{getStatusBadge(activeOrder.status, activeOrder.paymentStatus).text}</span>
                        </span>
                      </div>
                      <span className="text-[11px] text-[#7A7265] block mt-0.5">
                        Ordered on: {activeOrder.date}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#7A7265] uppercase block">
                        Total Amount
                      </span>
                      <span className="font-bold text-sm text-[#263E2E]">
                        ₹{activeOrder.total}
                      </span>
                    </div>
                  </div>

                  {/* Payment Verification Banner for PhonePe / UPI */}
                  {activeOrder.paymentStatus === 'rejected' && (
                    <div className="p-4 bg-[#FEF2F2] border-2 border-[#DC2626] rounded-xl text-xs space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 border border-[#FCA5A5]">
                          <XCircle className="w-5 h-5 text-[#DC2626]" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#991B1B]">
                              Payment Verification Failed / UTR Rejected
                            </span>
                            <span className="text-[10px] font-bold bg-[#DC2626] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Action Required
                            </span>
                          </div>
                          <p className="text-xs text-[#7F1D1D] leading-relaxed">
                            <strong>Reason from Store Owner:</strong> &ldquo;{activeOrder.rejectionReason || 'UTR number not found in PhonePe statement'}&rdquo;
                          </p>
                          {activeOrder.paymentRejectedAt && (
                            <p className="text-[10px] text-[#A84242]">
                              Rejected on: {activeOrder.paymentRejectedAt}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Resubmission Form */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#FCA5A5] space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1C2C20]">
                            Submit Correct 12-Digit PhonePe / UPI UTR
                          </span>
                          <span className="text-[10px] text-[#7A7265]">
                            Previously entered: <strong className="font-mono">{activeOrder.utrNumber || activeOrder.transactionId || 'None'}</strong>
                          </span>
                        </div>

                        {resubmitSuccess && (
                          <div className="p-2.5 rounded-lg bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                            <span>{resubmitSuccess}</span>
                          </div>
                        )}

                        {resubmitError && (
                          <div className="p-2.5 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                            <span>{resubmitError}</span>
                          </div>
                        )}

                        <form onSubmit={(e) => handleResubmitUtr(activeOrder.orderNumber, e)} className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            required
                            value={resubmitUtrValue}
                            onChange={(e) => {
                              setResubmitUtrValue(e.target.value);
                              setResubmitError(null);
                            }}
                            placeholder="Enter valid 12-digit UTR (e.g. 423985019284)"
                            className="flex-1 px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-lg font-mono text-xs text-[#2C2926] focus:outline-none focus:border-[#DC2626]"
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingUtr}
                            className="px-4 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer transition-colors shrink-0 disabled:opacity-50 shadow-xs"
                          >
                            {isSubmittingUtr ? 'Submitting...' : 'Update & Re-verify UTR'}
                          </button>
                        </form>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F5EDE1]">
                          <span className="text-[10px] text-[#7A7265]">
                            You can find the 12-digit UTR in your PhonePe / GPay / Paytm payment receipt details.
                          </span>
                          <a
                            href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                              `Hi Nikita! Regarding my Order #${activeOrder.orderNumber}, my payment was rejected with reason: "${activeOrder.rejectionReason}". I am sending my payment screenshot here.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#25D366] hover:underline font-semibold flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]" />
                            <span>Send Screenshot on WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeOrder.paymentStatus === 'pending_host_verification' && (
                    <div className="p-3 bg-[#FFFBEB] border border-[#FCD34D] rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[#B45309] font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Host Verification in PhonePe</span>
                      </div>
                      <p className="text-[11px] text-[#78350F]">
                        Submitted UTR: <strong className="font-mono">{activeOrder.utrNumber || activeOrder.transactionId || 'Pending'}</strong>.
                        Host Nikita Khatri will cross-verify this UTR in her PhonePe app before confirming your batch order.
                      </p>
                    </div>
                  )}

                  {/* Courier & Tracking AWB Box - Real Tracking only */}
                  <div className="p-3 bg-[#FAF6EE] rounded-lg border border-[#E9E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#263E2E]" />
                        <span className="text-xs font-bold text-[#1C2C20]">
                          {activeOrder.courierName ? activeOrder.courierName : 'Courier Assigned Upon Dispatch'}
                        </span>
                      </div>

                      {activeOrder.trackingId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#5A5246]">AWB Tracking #:</span>
                          <span className="font-mono text-xs font-bold text-[#263E2E] bg-white px-1.5 py-0.5 rounded border border-[#DDD3C2]">
                            {activeOrder.trackingId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(activeOrder.trackingId!)}
                            className="text-[10px] text-[#7A7265] hover:text-[#1C2C20] flex items-center gap-0.5 cursor-pointer"
                            title="Copy AWB Tracking Number"
                          >
                            {copiedTracking === activeOrder.trackingId ? (
                              <Check className="w-3 h-3 text-[#15803D]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedTracking === activeOrder.trackingId ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#8C5D1E] bg-[#FFF8EE] px-2 py-1 rounded border border-[#EED7B8] font-medium">
                          ⏳ Curing &amp; Handcrafting in progress (2-3 days). Genuine courier tracking number will be assigned by host on dispatch.
                        </div>
                      )}

                      <p className="text-[11px] text-[#15803D] font-medium">
                        📅 {activeOrder.estimatedDelivery || 'Estimated delivery in 2-3 business days'}
                      </p>
                    </div>

                    {/* Direct Link to Courier Partner Tracking Portal */}
                    {activeOrder.trackingId && activeOrder.trackingUrl && (
                      <div className="shrink-0">
                        <a
                          href={activeOrder.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <span>Courier Portal Track</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Destination Address */}
                  <div className="flex items-start gap-2 text-xs text-[#524B40] pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#263E2E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#1C2C20]">
                        {activeOrder.customer.fullName}
                      </strong>{' '}
                      • {activeOrder.customer.address}, {activeOrder.customer.city},{' '}
                      {activeOrder.customer.state} - {activeOrder.customer.pincode}
                    </div>
                  </div>
                </div>

                {/* DELIVERED ORDER COMPLAINT BANNER */}
                {activeOrder.status === 'delivered' && (
                  <div className="p-3 bg-[#FFF8EE] border border-[#FAD7A0] rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs text-[#7E4C00]">
                      <AlertTriangle className="w-4 h-4 text-[#C48039] shrink-0" />
                      <span>
                        Order delivered. If any soap arrived damaged or incorrect, submit a report:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReportComplaint(activeOrder.orderNumber)}
                      className="px-3 py-1.5 rounded-lg bg-[#263E2E] text-white text-xs font-bold shrink-0 hover:bg-[#1A2E20] cursor-pointer"
                    >
                      File Complaint (Care Bot)
                    </button>
                  </div>
                )}

                {/* Live Step-by-Step Milestones Timeline */}
                <div className="p-4 rounded-xl bg-white border border-[#DDD3C2] shadow-xs">
                  <h3 className="text-xs font-bold text-[#1C2C20] uppercase tracking-wider mb-3">
                    Live Shipment Milestones
                  </h3>

                  <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4DCCF]">
                    {activeOrder.milestones.map((m, idx) => (
                      <div key={idx} className="relative flex items-start gap-3 pl-1">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-white ${
                            m.completed
                              ? 'bg-[#15803D]'
                              : m.current
                              ? 'bg-[#2563EB] ring-4 ring-[#DBEAFE]'
                              : 'bg-[#D1C7B8]'
                          }`}
                        >
                          {m.completed ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                m.completed || m.current ? 'text-[#1C2C20]' : 'text-[#8A8174]'
                              }`}
                            >
                              {m.label}
                            </span>
                            <span className="text-[10px] text-[#7A7265] font-mono">
                              {m.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5D5548] mt-0.5 leading-relaxed">
                            {m.description}
                          </p>
                          <span className="text-[10px] text-[#8C8477] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {m.location}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#DDD3C2] text-xs">
                  <span className="font-bold text-[#263E2E] block mb-2 uppercase text-[10px] tracking-wider">
                    Items In This Package ({activeOrder.items.length})
                  </span>
                  <div className="space-y-1.5">
                    {activeOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[#38332B]">
                        <span>
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="font-mono">
                          ₹{item.product.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Store Reply to Complaint Ticket(s) for this order */}
                {orderComplaints.some((t) => t.hostReply) && (
                  <div className="space-y-2">
                    {orderComplaints
                      .filter((t) => t.hostReply)
                      .map((t) => (
                        <div
                          key={t.ticketId}
                          className="p-3.5 rounded-xl bg-[#EAF3EC] border border-[#BFDCC6] text-xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-[#1C2C20] uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                              <MessageCircle className="w-3.5 h-3.5 text-[#263E2E]" />
                              Store Reply • Ticket #{t.ticketId}
                            </span>
                            {t.status === 'resolved' && (
                              <span className="text-[10px] font-bold text-[#15803D] bg-white px-2 py-0.5 rounded-full">
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-[#2C2926] leading-relaxed">{t.hostReply}</p>
                          {t.hostReplyAt && (
                            <span className="text-[10px] text-[#5D5548] mt-1 block">{t.hostReplyAt}</span>
                          )}
                          <p className="text-[10px] text-[#4A433A] mt-2 pt-2 border-t border-[#BFDCC6]/60">
                            Want to reply or attach a photo? Open the <strong>Care Assistant</strong> chat and tap{' '}
                            <strong>"Track / Reply to Complaint"</strong> with Ticket #{t.ticketId}.
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                {/* Action Buttons: Place New Order / WhatsApp / Complaint */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartNewOrder}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#E3B873]" />
                    <span>Place Another Order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReportComplaint(activeOrder.orderNumber)}
                    className="py-2.5 px-3.5 rounded-xl bg-[#FAF0E6] hover:bg-[#F3E5D4] text-[#8C4A15] border border-[#E8CEB5] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#C48039]" />
                    <span>Report Issue</span>
                  </button>

                  <a
                    href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                      `Hi Nikita! I would like an update on my Organic Bloom Order #${activeOrder.orderNumber} (AWB: ${activeOrder.trackingId})`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3.5 bg-white rounded-2xl border border-[#DDD3C2] p-6 shadow-xs">
                {hasSearched ? (
                  <>
                    <AlertCircle className="w-10 h-10 text-[#C27803] mx-auto" />
                    <h3 className="font-display text-lg font-semibold text-[#1C2C20]">
                      No Order Found for "{searchQuery}"
                    </h3>
                    <p className="text-xs text-[#696053] max-w-sm mx-auto">
                      {currentUser
                        ? 'This order number was not found under your registered mobile number (+91 ' + currentUser.phone + ').'
                        : 'Please verify your Order Number (e.g. OB-849201) or log in with your mobile number.'}
                    </p>
                    <div className="pt-2 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setHasSearched(false);
                          if (allOrders.length > 0) setActiveOrder(allOrders[0]);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#FAF4EB] border border-[#DDD3C2] text-[#2C2926] text-xs font-semibold hover:bg-[#F2E8D7] cursor-pointer"
                      >
                        Clear Search
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className="px-4 py-2 rounded-xl bg-[#263E2E] text-white text-xs font-semibold hover:bg-[#1A2E20] cursor-pointer"
                      >
                        View Order History
                      </button>
                    </div>
                  </>
                ) : currentUser ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-[#F0F5F1] text-[#263E2E] flex items-center justify-center mx-auto border border-[#D5E5D8]">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-bold text-[#1C2C20]">
                        No Orders Placed with +91 {currentUser.phone}
                      </h3>
                      <p className="text-xs text-[#696053] max-w-md mx-auto leading-relaxed">
                        You are logged in as <strong>{currentUser.fullName}</strong>. Any handcrafted soap orders placed with this mobile number will appear here automatically.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleStartNewOrder}
                        className="px-5 py-2.5 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#E3B873]" />
                        <span>Place Your First Order</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-4 py-2.5 rounded-xl bg-[#FFF5F5] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] text-xs font-bold cursor-pointer"
                      >
                        Log Out / Switch Number
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF4EB] text-[#263E2E] flex items-center justify-center mx-auto border border-[#E9DFD1]">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-bold text-[#1C2C20]">
                        Track Your Soap Order
                      </h3>
                      <p className="text-xs text-[#696053] max-w-md mx-auto leading-relaxed">
                        Enter your Order Number (e.g. <strong>OB-849201</strong>) above to check shipment milestones, or log in with your mobile number to view your full order history.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenAuth) onOpenAuth();
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-[#E3B873]" />
                        <span>Log In / Create Account</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStartNewOrder}
                        className="px-4 py-2.5 rounded-xl bg-white border border-[#DDD3C2] text-[#2C2926] text-xs font-semibold hover:bg-[#F2ECE2] cursor-pointer"
                      >
                        Shop Herbal Soaps
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
