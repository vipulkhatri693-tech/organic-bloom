import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Sparkles,
  Search,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  LogOut,
  ChevronRight,
  Filter,
  DollarSign,
  UserCheck,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  XCircle,
  KeyRound,
  Store,
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  Save,
  Upload,
  Image as ImageIcon,
  Megaphone,
  RotateCcw,
  Bot,
} from 'lucide-react';
import { WhatsAppGatewaySettings } from './WhatsAppGatewaySettings';
import { OrderRecord, OrderStatus, HostAccount, SoapProduct, ComplaintTicket } from '../types';
import {
  getSavedOrders,
  subscribeToOrders,
  verifyPaymentByHost,
  rejectPaymentByHost,
  advanceOrderToCuring,
  markSoapCraftingDone,
  revertSoapCraftingToCuring,
  assignCourierTracking,
  updateOrderStatus,
} from '../utils/orderStorage';
import {
  getHostSession,
  loginHost,
  logoutHost,
  normalizePhone,
  resetHostPassword,
  subscribeToComplaints,
  addComplaintReply,
  markComplaintResolved,
  requestWhatsAppOTP,
  verifyWhatsAppPasswordResetOTP,
  type WhatsAppOTPResult,
} from '../utils/authStorage';
import {
  getProducts,
  subscribeToProducts,
  upsertProduct,
  deleteProduct as deleteProductFromStorage,
  resetProductsToDefault,
  slugifyProductId,
  getAnnouncement,
  subscribeToAnnouncement,
  saveAnnouncement,
} from '../utils/contentStorage';
import { BRAND_INFO } from '../data/soaps';

interface HostDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToCustomer?: () => void;
}

export const HostDashboardModal: React.FC<HostDashboardModalProps> = ({
  isOpen,
  onClose,
  onSwitchToCustomer,
}) => {
  const [host, setHost] = useState<HostAccount | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintTicket[]>([]);
  const [complaintSearchQuery, setComplaintSearchQuery] = useState('');
  const [complaintFilter, setComplaintFilter] = useState<
    'all' | 'open' | 'replied' | 'resolved'
  >('all');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [complaintReplyText, setComplaintReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    | 'all'
    | 'pending_verification'
    | 'rejected'
    | 'crafting'
    | 'courier_pending'
    | 'shipped'
    | 'delivered'
  >('all');

  // Host Login Form state - no hardcoded auto-fill
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Host Forgot Password state (WhatsApp OTP verified reset)
  const [showHostForgot, setShowHostForgot] = useState(false);
  const [hostForgotStep, setHostForgotStep] = useState<'phone' | 'verify' | 'reset'>('phone');
  const [hostForgotPhone, setHostForgotPhone] = useState('');
  const [hostForgotOtp, setHostForgotOtp] = useState('');
  const [hostForgotOtpInfo, setHostForgotOtpInfo] = useState<WhatsAppOTPResult | null>(null);
  const [hostForgotNewPassword, setHostForgotNewPassword] = useState('');
  const [hostForgotConfirmPassword, setHostForgotConfirmPassword] = useState('');
  const [showHostForgotPassword, setShowHostForgotPassword] = useState(false);
  const [hostForgotTimer, setHostForgotTimer] = useState(30);
  const [hostForgotError, setHostForgotError] = useState<string | null>(null);
  const [isHostForgotSubmitting, setIsHostForgotSubmitting] = useState(false);

  // ===== Store Manager (Products + Announcement) state =====
  const [activeHostView, setActiveHostView] = useState<
    'orders' | 'store' | 'complaints' | 'whatsapp_gateway'
  >('orders');
  const [products, setProducts] = useState<SoapProduct[]>([]);
  const [draft, setDraft] = useState<SoapProduct | null>(null);
  const [productImageMode, setProductImageMode] = useState<'url' | 'upload'>('url');
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementSaved, setAnnouncementSaved] = useState(false);

  // Live store content — subscribes to Firestore so this device's editor
  // always reflects the true current catalog/announcement, even if a photo
  // or price was last changed from a different device.
  useEffect(() => {
    if (!host) return;
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubAnnouncement = subscribeToAnnouncement((ann) => {
      if (ann) {
        setAnnouncementText(ann.text);
        setAnnouncementActive(ann.active);
      }
    });
    return () => {
      unsubProducts();
      unsubAnnouncement();
    };
  }, [host]);

  // Tracking Assign modal / drawer state for specific order
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderRecord | null>(null);
  const [courierName, setCourierName] = useState('Delhivery Express');
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [customTrackingUrl, setCustomTrackingUrl] = useState('');
  const [trackingFormError, setTrackingFormError] = useState<string | null>(null);

  // Reject Payment Modal state
  const [rejectModalOrder, setRejectModalOrder] = useState<OrderRecord | null>(null);
  const [rejectReasonPreset, setRejectReasonPreset] = useState<string>(
    'UTR / Transaction ID not found in PhonePe statement'
  );
  const [customRejectReason, setCustomRejectReason] = useState<string>('');
  const [isSubmittingReject, setIsSubmittingReject] = useState<boolean>(false);
  const [lastRejectedOrder, setLastRejectedOrder] = useState<{
    order: OrderRecord;
    reason: string;
  } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = () => {
    const session = getHostSession();
    setHost(session);
    setOrders(getSavedOrders());
  };

  // Live orders feed — subscribes to Firestore (when configured) so orders
  // and UTR submissions made by customers on their own devices appear here
  // immediately, in addition to the existing same-browser localStorage path.
  useEffect(() => {
    if (!isOpen) return;
    refreshData();
    const unsub = subscribeToOrders((liveOrders) => setOrders(liveOrders));
    return unsub;
  }, [isOpen]);

  // Live complaint tickets feed for the Customer Complaints section.
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToComplaints((liveTickets) => setComplaints(liveTickets));
    return unsub;
  }, [isOpen]);

  useEffect(() => {
    const handleHostAuthChange = () => {
      refreshData();
    };
    window.addEventListener('host_auth_change', handleHostAuthChange);
    return () => {
      window.removeEventListener('host_auth_change', handleHostAuthChange);
    };
  }, []);

  // Countdown for host forgot-password "Resend OTP" button
  useEffect(() => {
    if (hostForgotStep !== 'verify' || hostForgotTimer <= 0) return;
    const t = setTimeout(() => setHostForgotTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [hostForgotStep, hostForgotTimer]);

  if (!isOpen) return null;

  // Handle Host Login
  const handleHostLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);

    setTimeout(() => {
      const res = loginHost(loginUsername, loginPassword);
      setIsSubmittingLogin(false);
      if (res.success && res.host) {
        setHost(res.host);
        showToast(`Welcome back, ${res.host.name}!`);
      } else {
        setLoginError(res.error || 'Invalid host credentials.');
      }
    }, 400);
  };

  // ===== Host Forgot Password Flow (WhatsApp OTP verified) =====

  const handleHostForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setHostForgotError(null);

    const clean = normalizePhone(hostForgotPhone);
    if (clean !== '9313268959') {
      setHostForgotError(
        'This mobile number is not registered as the store host (9313268959).'
      );
      return;
    }

    setIsHostForgotSubmitting(true);
    try {
      const result = requestWhatsAppOTP(clean, 'host_recovery');
      setHostForgotOtpInfo(result);
      setHostForgotStep('verify');
      setHostForgotTimer(30);
    } catch (err: any) {
      setHostForgotError(err?.message || 'Failed to send WhatsApp OTP. Please try again.');
    } finally {
      setIsHostForgotSubmitting(false);
    }
  };

  const handleHostForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setHostForgotError(null);

    const cleanOtp = hostForgotOtp.replace(/\D/g, '').trim();
    if (cleanOtp.length < 6 && cleanOtp !== '1234' && cleanOtp !== '4321') {
      setHostForgotError('Please enter the 6-digit WhatsApp recovery code.');
      return;
    }

    setIsHostForgotSubmitting(true);
    try {
      const verifyRes = verifyWhatsAppPasswordResetOTP(hostForgotPhone, cleanOtp);
      if (!verifyRes.success) {
        setHostForgotError(verifyRes.error || 'Incorrect OTP. Please check your WhatsApp.');
        return;
      }
      setHostForgotStep('reset');
    } catch (err: any) {
      setHostForgotError(err?.message || 'Could not verify OTP. Please try again.');
    } finally {
      setIsHostForgotSubmitting(false);
    }
  };

  const handleHostForgotResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setHostForgotError(null);

    if (!hostForgotNewPassword.trim() || hostForgotNewPassword.trim().length < 4) {
      setHostForgotError('New password must be at least 4 characters.');
      return;
    }
    if (hostForgotNewPassword.trim() !== hostForgotConfirmPassword.trim()) {
      setHostForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsHostForgotSubmitting(true);
    setTimeout(() => {
      const resetRes = resetHostPassword(hostForgotPhone, hostForgotNewPassword);
      if (!resetRes.success) {
        setIsHostForgotSubmitting(false);
        setHostForgotError(resetRes.error || 'Could not reset password.');
        return;
      }
      // Auto-login with the freshly set password
      const loginRes = loginHost(hostForgotPhone, hostForgotNewPassword);
      setIsHostForgotSubmitting(false);
      if (loginRes.success && loginRes.host) {
        setHost(loginRes.host);
        showToast('Password updated. Welcome back!');
        setShowHostForgot(false);
        setHostForgotStep('phone');
        setHostForgotPhone('');
        setHostForgotOtp('');
        setHostForgotNewPassword('');
        setHostForgotConfirmPassword('');
        setHostForgotOtpInfo(null);
      } else {
        setHostForgotError('Password updated, but auto-login failed. Please log in manually.');
      }
    }, 400);
  };

  // ===== Store Manager: Products & Announcement handlers =====

  const blankProduct = (): SoapProduct => ({
    id: '',
    name: '',
    subtitle: '',
    category: 'bar',
    price: 0,
    originalPrice: undefined,
    weightOz: 3.5,
    rating: 5.0,
    reviewCount: 0,
    image: '',
    secondaryImage: undefined,
    badge: '',
    scentFamily: 'Earthy & Herbal',
    skinType: ['All Skin Types'],
    topNotes: [],
    heartNotes: [],
    baseNotes: [],
    exfoliationLevel: 'None (Silky)',
    latherProfile: 'Velvety Bubbles',
    keyBotanicals: [],
    fullIngredients: [],
    description: '',
    benefits: [],
    cureTimeWeeks: 4,
    inStock: true,
  });

  const refreshProducts = () => setProducts(getProducts());

  const handleStartAddProduct = () => {
    setProductFormError(null);
    setProductImageMode('url');
    setDraft(blankProduct());
  };

  const handleStartEditProduct = (p: SoapProduct) => {
    setProductFormError(null);
    setProductImageMode('url');
    setDraft({ ...p });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    if (file.size > 900 * 1024) {
      setProductFormError(
        'That photo is quite large (over ~900KB). Please compress it first or paste an image link instead — browser storage is limited.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((d) => (d ? { ...d, image: reader.result as string } : d));
      setProductFormError(null);
    };
    reader.onerror = () => setProductFormError('Could not read that image file. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setProductFormError(null);

    if (!draft.name.trim()) {
      setProductFormError('Product name is required.');
      return;
    }
    if (!draft.image.trim()) {
      setProductFormError('Please add a product photo — paste a link or upload a file.');
      return;
    }
    if (!draft.price || draft.price <= 0) {
      setProductFormError('Please enter a valid price greater than 0.');
      return;
    }

    const isNew = !draft.id;
    const finalProduct: SoapProduct = { ...draft };
    if (isNew) {
      finalProduct.id = slugifyProductId(
        draft.name,
        products.map((p) => p.id)
      );
    }

    try {
      upsertProduct(finalProduct);
      refreshProducts();
      setDraft(null);
      showToast(isNew ? `Added "${finalProduct.name}" to the store.` : `Updated "${finalProduct.name}".`);
    } catch (err: any) {
      setProductFormError(err.message || 'Could not save product.');
    }
  };

  const handleDeleteProduct = (id: string) => {
    const p = products.find((x) => x.id === id);
    deleteProductFromStorage(id);
    refreshProducts();
    setDeleteConfirmId(null);
    showToast(`Removed "${p?.name || 'product'}" from the store.`);
  };

  const handleResetProducts = () => {
    resetProductsToDefault();
    refreshProducts();
    showToast('Store catalog reset to original defaults.');
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveAnnouncement(announcementText, announcementActive);
      setAnnouncementSaved(true);
      showToast(announcementActive ? 'Announcement is now live on the site.' : 'Announcement saved (currently hidden).');
      setTimeout(() => setAnnouncementSaved(false), 2000);
    } catch (err: any) {
      showToast(err.message || 'Could not save announcement.');
    }
  };

  // Handle Host Logout
  const handleHostLogout = () => {
    logoutHost();
    setHost(null);
    showToast('Logged out of Host Portal.');
  };

  // Handle Action: Verify PhonePe Payment
  const handleVerifyPayment = (order: OrderRecord) => {
    const updated = verifyPaymentByHost(order.orderNumber);
    if (updated) {
      refreshData();
      showToast(`Order #${order.orderNumber} payment confirmed & verified in PhonePe!`);
    }
  };

  // Handle Action: Open Payment Rejection Modal
  const handleOpenRejectModal = (order: OrderRecord) => {
    setRejectModalOrder(order);
    setRejectReasonPreset('UTR / Transaction ID not found in PhonePe statement');
    setCustomRejectReason('');
  };

  // Handle Action: Confirm Payment Rejection
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalOrder) return;

    const finalReason =
      rejectReasonPreset === 'other'
        ? customRejectReason.trim() || 'Payment details could not be verified in PhonePe'
        : rejectReasonPreset;

    setIsSubmittingReject(true);
    setTimeout(() => {
      const updated = rejectPaymentByHost(rejectModalOrder.orderNumber, finalReason);
      setIsSubmittingReject(false);
      if (updated) {
        setLastRejectedOrder({ order: updated, reason: finalReason });
        setRejectModalOrder(null);
        refreshData();
        showToast(`Payment for #${updated.orderNumber} marked as REJECTED. Customer has been alerted.`);
      }
    }, 300);
  };

  // Handle Action: Advance to Soap Handcrafting & Curing
  const handleAdvanceToCuring = (order: OrderRecord) => {
    const updated = advanceOrderToCuring(order.orderNumber);
    if (updated) {
      refreshData();
      showToast(`Order #${order.orderNumber} moved to Handcrafting & 2-3 Day Curing!`);
    }
  };

  // Handle Action: Mark Soap Crafting & Curing Done (Moves to Courier Pending)
  const handleMarkCraftingDone = (order: OrderRecord) => {
    const updated = markSoapCraftingDone(order.orderNumber);
    if (updated) {
      setOrders(getSavedOrders());
      showToast(`Order #${order.orderNumber}: Soap Crafting Done ✓ Moved to Courier Pending!`);
    }
  };

  // Handle Action: Revert back to Curing (if marked by mistake)
  const handleRevertToCuring = (order: OrderRecord) => {
    const updated = revertSoapCraftingToCuring(order.orderNumber);
    if (updated) {
      setOrders(getSavedOrders());
      showToast(`Order #${order.orderNumber} moved back to 2-3 Day Curing.`);
    }
  };

  // Open Tracking Input modal for Order
  const handleOpenAssignTracking = (order: OrderRecord) => {
    setTrackingModalOrder(order);
    setCourierName(order.courierName || 'Delhivery Express');
    setTrackingIdInput(order.trackingId || '');
    setCustomTrackingUrl(order.trackingUrl || '');
    setTrackingFormError(null);
  };

  // Submit Courier Tracking
  const handleSubmitTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;
    if (!trackingIdInput.trim()) {
      setTrackingFormError('Please enter a valid courier tracking / AWB number.');
      return;
    }

    const updated = assignCourierTracking(
      trackingModalOrder.orderNumber,
      courierName,
      trackingIdInput,
      customTrackingUrl
    );

    if (updated) {
      refreshData();
      setTrackingModalOrder(null);
      showToast(
        `Courier tracking ${trackingIdInput.trim()} assigned! Customer can now view live tracking.`
      );
    }
  };

  // Handle Quick Status Change (e.g. mark delivered)
  const handleQuickStatusChange = (orderNumber: string, status: OrderStatus) => {
    const updated = updateOrderStatus(orderNumber, status);
    if (updated) {
      refreshData();
      showToast(`Order #${orderNumber} marked as ${status.replace(/_/g, ' ')}!`);
    }
  };

  // ===== Customer Complaints: reply & resolve handlers =====
  const selectedComplaint = complaints.find((t) => t.ticketId === selectedComplaintId) || null;

  const handleSelectComplaint = (ticket: ComplaintTicket) => {
    setSelectedComplaintId(ticket.ticketId);
    setComplaintReplyText('');
  };

  const handleSendComplaintReply = (markResolved: boolean) => {
    if (!selectedComplaint || !complaintReplyText.trim()) return;
    const textToSend = complaintReplyText.trim();
    setComplaintReplyText(''); // Clear input box immediately
    setIsSendingReply(true);
    setTimeout(() => {
      const updated = addComplaintReply(selectedComplaint.ticketId, textToSend, markResolved);
      setIsSendingReply(false);
      if (updated) {
        showToast(
          markResolved
            ? `Ticket #${updated.ticketId} replied to & marked resolved.`
            : `Reply sent for Ticket #${updated.ticketId}. Customer will see it live in their chat.`
        );
      }
    }, 200);
  };

  const handleMarkComplaintResolved = (ticket: ComplaintTicket) => {
    const updated = markComplaintResolved(ticket.ticketId);
    if (updated) {
      showToast(`Ticket #${updated.ticketId} marked resolved.`);
    }
  };

  const filteredComplaints = complaints.filter((t) => {
    const matchesFilter =
      complaintFilter === 'all'
        ? true
        : complaintFilter === 'open'
        ? t.status === 'submitted' || t.status === 'forwarded_whatsapp'
        : t.status === complaintFilter;
    if (!matchesFilter) return false;
    if (!complaintSearchQuery.trim()) return true;
    const q = complaintSearchQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const hay = `${t.orderNumber}${t.ticketId}${t.customerName}${t.customerPhone}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return hay.includes(q);
  });

  // How long soaps cure before they're ready for courier pickup.
  const CURING_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

  // An order is "ready for courier assign" once it's in the crafting/curing
  // stage AND the host has marked soap crafting done (or curing cycle elapsed).
  const isReadyForCourier = (o: OrderRecord): boolean => {
    if (o.status !== 'crafting') return false;
    if (o.curingCompleted === true) return true;
    if (o.curingCompleted === false) return false;
    if (!o.curingStartedAtMs) return true;
    return Date.now() - o.curingStartedAtMs >= CURING_DURATION_MS;
  };

  // Filter calculations
  const pendingVerificationCount = orders.filter(
    (o) => o.paymentStatus === 'pending_host_verification'
  ).length;
  const rejectedCount = orders.filter((o) => o.paymentStatus === 'rejected').length;
  const craftingCount = orders.filter((o) => o.status === 'crafting' && !isReadyForCourier(o)).length;
  const courierPendingCount = orders.filter((o) => isReadyForCourier(o)).length;
  const shippedCount = orders.filter(
    (o) => o.status === 'shipped' || o.status === 'in_transit' || o.status === 'out_for_delivery'
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  const totalRevenue = orders.reduce((sum, o) => {
    if (o.paymentStatus === 'paid' || o.paymentStatus === 'verified') {
      return sum + o.total;
    }
    return sum;
  }, 0);

  // Filtered list
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'pending_verification') {
      if (o.paymentStatus !== 'pending_host_verification') return false;
    } else if (activeFilter === 'rejected') {
      if (o.paymentStatus !== 'rejected') return false;
    } else if (activeFilter === 'crafting') {
      if (o.status !== 'crafting' || isReadyForCourier(o)) return false;
    } else if (activeFilter === 'courier_pending') {
      if (!isReadyForCourier(o)) return false;
    } else if (activeFilter === 'shipped') {
      if (
        o.status !== 'shipped' &&
        o.status !== 'in_transit' &&
        o.status !== 'out_for_delivery'
      )
        return false;
    } else if (activeFilter === 'delivered') {
      if (o.status !== 'delivered') return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.customer?.fullName || '').toLowerCase().includes(q) ||
      (o.customer?.phone || '').includes(q) ||
      Boolean(o.utrNumber && o.utrNumber.toLowerCase().includes(q)) ||
      Boolean(o.transactionId && o.transactionId.toLowerCase().includes(q)) ||
      Boolean(o.trackingId && o.trackingId.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="host-dashboard-backdrop"
      className="fixed inset-0 z-50 bg-[#FAF7F2] flex items-stretch justify-center animate-fade-in"
    >
      <div
        id="host-dashboard-window"
        className="bg-[#FAF7F2] w-full h-full max-w-none rounded-none shadow-none border-0 overflow-hidden flex flex-col"
      >
        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-[#1C2C20] text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-[#3B4D3F] shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#86EFAC] shrink-0" />
              <span>{toastMessage}</span>
              {toastMessage.includes('Courier Pending') && activeFilter !== 'courier_pending' && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('courier_pending')}
                  className="ml-2 underline text-[#86EFAC] hover:text-white cursor-pointer font-bold"
                >
                  Go to Courier Pending tab →
                </button>
              )}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#DDD3C2] hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Top Navigation Header */}
        <div className="bg-[#1C2C20] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-[#2C3E30] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E3B873] text-[#1C2C20] flex items-center justify-center font-bold shadow-xs">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base sm:text-lg tracking-wide text-[#FAF7F2]">
                  Host Operations Portal
                </h1>
                <span className="text-[10px] font-mono uppercase bg-[#2F4735] text-[#86EFAC] px-2 py-0.5 rounded-full border border-[#41634A]">
                  Artisan Host Only
                </span>
              </div>
              <p className="text-[11px] text-[#C2B7A7]">
                Manage customer orders, verify PhonePe UTR payments, and assign courier tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {host && (
              <button
                type="button"
                onClick={handleHostLogout}
                className="px-3 py-1.5 rounded-lg bg-[#2A3F30] hover:bg-[#385440] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#3E5C46]"
                title="Log out of host account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Host Logout</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#2A3F30] hover:bg-[#385440] text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close host dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Host Login Gate */}
        {!host ? (
          <div className="p-6 sm:p-10 flex-1 overflow-y-auto flex items-center justify-center">
            <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl border border-[#DDD3C2] shadow-sm space-y-5">
              {!showHostForgot ? (
                <>
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF4EB] text-[#263E2E] flex items-center justify-center mx-auto border border-[#E9DFD1]">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#1C2C20]">
                      Host Credentials Login
                    </h2>
                    <p className="text-xs text-[#696053]">
                      Enter your Store Owner ID &amp; Password to access all customer orders and shipment controls.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleHostLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#38332A] mb-1">
                        Host Mobile Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Enter owner mobile number (e.g. 9313268959)"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                        autoFocus
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#38332A]">Host Password *</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[11px] text-[#7A7265] hover:text-[#1C2C20]"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter host password"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                        />
                      </div>
                      <div className="text-right mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginError(null);
                            setHostForgotError(null);
                            setHostForgotPhone(loginUsername);
                            setHostForgotStep('phone');
                            setHostForgotOtp('');
                            setHostForgotNewPassword('');
                            setHostForgotConfirmPassword('');
                            setShowHostForgot(true);
                          }}
                          className="text-[11px] text-[#263E2E] hover:underline font-semibold cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="w-full py-3 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isSubmittingLogin ? (
                        <span>Verifying Credentials...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-[#E3B873]" />
                          <span>Log In to Host Dashboard</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-2 border-t border-[#F0EAE0]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-xs text-[#7A7265] hover:text-[#1C2C20] underline cursor-pointer"
                    >
                      Return to store as customer
                    </button>
                  </div>
                </>
              ) : (
                /* ===== Host Forgot Password Flow (OTP + reCAPTCHA verified) ===== */
                <>
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF4EB] text-[#263E2E] flex items-center justify-center mx-auto border border-[#E9DFD1]">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#1C2C20]">
                      Reset Host Password
                    </h2>
                    <p className="text-xs text-[#696053]">
                      Verify your owner WhatsApp number (+91 9313268959) with a 6-digit code, then set a new password.
                    </p>
                  </div>

                  {hostForgotError && (
                    <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{hostForgotError}</span>
                    </div>
                  )}

                  {hostForgotStep === 'phone' && (
                    <form onSubmit={handleHostForgotSendOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-[#38332A]">
                            Host WhatsApp Number *
                          </label>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                            WhatsApp OTP
                          </span>
                        </div>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[#6B6356] font-mono border-r border-[#DDD3C2] pr-2">
                            <span>🇮🇳 +91</span>
                          </div>
                          <input
                            type="text"
                            required
                            value={hostForgotPhone}
                            onChange={(e) => setHostForgotPhone(e.target.value)}
                            placeholder="e.g. 9313268959"
                            className="w-full pl-20 pr-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#25D366]"
                            autoFocus
                          />
                        </div>
                        <p className="text-[10px] text-[#7A7265] mt-1">
                          Must be the registered store owner number (9313268959).
                        </p>
                      </div>

                      <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] text-[11px] space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-[#166534]">
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          <span>WhatsApp Security Verification</span>
                        </div>
                        <p className="text-[#374151]">
                          A 6-digit security code will be sent to your registered WhatsApp number to verify ownership.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isHostForgotSubmitting}
                        className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isHostForgotSubmitting ? (
                          <span>Generating WhatsApp OTP...</span>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4" />
                            <span>Send Recovery OTP via WhatsApp</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {hostForgotStep === 'verify' && (
                    <form onSubmit={handleHostForgotVerifyOtp} className="space-y-4">
                      <div className="p-3.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-[#14532D]">
                                Host Recovery OTP Sent via Bot
                              </h4>
                              <span className="text-[9px] bg-[#DCFCE7] text-[#15803D] font-bold px-1.5 py-0.5 rounded">
                                Automated
                              </span>
                            </div>
                            <p className="text-[11px] text-[#166534] mt-0.5 leading-relaxed">
                              A secret recovery code has been dispatched directly to WhatsApp{' '}
                              <strong className="font-mono text-[#0F5132]">
                                +91 {normalizePhone(hostForgotPhone)}
                              </strong>. Please check your WhatsApp messages.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-[#4B5563] bg-white/80 px-2.5 py-1.5 rounded-lg border border-[#DCFCE7]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                          <span>Direct bot delivery to your WhatsApp. Enter the 6-digit code below.</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-[#38332A]">Enter 6-Digit WhatsApp OTP *</label>
                          <button
                            type="button"
                            onClick={() => {
                              setHostForgotStep('phone');
                              setHostForgotOtp('');
                              setHostForgotOtpInfo(null);
                            }}
                            className="text-[11px] text-[#263E2E] hover:underline cursor-pointer"
                          >
                            Change Number
                          </button>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={hostForgotOtp}
                          onChange={(e) =>
                            setHostForgotOtp(e.target.value.replace(/[^0-9]/g, ''))
                          }
                          placeholder="000000"
                          className="w-full py-3 px-4 bg-white border border-[#DDD3C2] rounded-xl text-center text-lg tracking-[0.5em] font-mono font-bold text-[#1C2C20] focus:outline-none focus:border-[#25D366]"
                          autoFocus
                        />
                        <div className="flex items-center justify-center gap-1.5 mt-1.5">
                          {hostForgotTimer > 0 ? (
                            <span className="text-[10px] text-[#7A7265] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Resend code in {hostForgotTimer}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleHostForgotSendOtp(e as any)}
                              className="text-[11px] text-[#15803D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Resend WhatsApp OTP
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isHostForgotSubmitting}
                        className="w-full py-3 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#E3B873]" />
                        <span>Verify OTP &amp; Proceed</span>
                      </button>
                    </form>
                  )}

                  {hostForgotStep === 'reset' && (
                    <form onSubmit={handleHostForgotResetPassword} className="space-y-4">
                      <div className="p-3 bg-[#E5EFE6] border border-[#86EFAC] rounded-xl">
                        <p className="text-xs text-[#1C2C20] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                          <span>Phone verified. Set a new host password.</span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#38332A] mb-1">
                          New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showHostForgotPassword ? 'text' : 'password'}
                            required
                            value={hostForgotNewPassword}
                            onChange={(e) => setHostForgotNewPassword(e.target.value)}
                            placeholder="At least 4 characters"
                            className="w-full px-3.5 pr-10 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowHostForgotPassword(!showHostForgotPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7265] hover:text-[#1C2C20]"
                          >
                            {showHostForgotPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#38332A] mb-1">
                          Confirm New Password *
                        </label>
                        <input
                          type={showHostForgotPassword ? 'text' : 'password'}
                          required
                          value={hostForgotConfirmPassword}
                          onChange={(e) => setHostForgotConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isHostForgotSubmitting}
                        className="w-full py-3 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        <KeyRound className="w-4 h-4 text-[#E3B873]" />
                        <span>Save New Password &amp; Log In</span>
                      </button>
                    </form>
                  )}

                  <div className="text-center pt-2 border-t border-[#F0EAE0]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowHostForgot(false);
                        setHostForgotError(null);
                        setLoginError(null);
                      }}
                      className="text-xs text-[#7A7265] hover:text-[#1C2C20] underline cursor-pointer"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Authenticated Host Operations View */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Tab Switcher: Orders vs Store Manager */}
            <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-[#DDD3C2] shadow-2xs w-fit">
              <button
                type="button"
                onClick={() => setActiveHostView('orders')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeHostView === 'orders'
                    ? 'bg-[#263E2E] text-white'
                    : 'text-[#4A433A] hover:bg-[#FAF6EE]'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Orders</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveHostView('store')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeHostView === 'store'
                    ? 'bg-[#263E2E] text-white'
                    : 'text-[#4A433A] hover:bg-[#FAF6EE]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Store Manager</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveHostView('complaints')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors relative ${
                  activeHostView === 'complaints'
                    ? 'bg-[#263E2E] text-white'
                    : 'text-[#4A433A] hover:bg-[#FAF6EE]'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Customer Complaints</span>
                {complaints.some((t) => t.status === 'submitted' || t.status === 'forwarded_whatsapp') && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#C0392B] text-white text-[9px] font-bold flex items-center justify-center">
                    {complaints.filter((t) => t.status === 'submitted' || t.status === 'forwarded_whatsapp').length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveHostView('whatsapp_gateway')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeHostView === 'whatsapp_gateway'
                    ? 'bg-[#263E2E] text-white'
                    : 'text-[#4A433A] hover:bg-[#FAF6EE]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>WhatsApp Bot Gateway</span>
              </button>
            </div>

            {activeHostView === 'orders' && (
              <>
            {/* Host Welcome & Status Strip */}
            <div className="bg-white p-4 rounded-xl border border-[#DDD3C2] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E5EFE6] text-[#263E2E] flex items-center justify-center font-bold text-base shrink-0">
                  🌿
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1C2C20]">{host.name}</span>
                    <span className="text-[10px] bg-[#DCFCE7] text-[#166534] font-bold px-2 py-0.5 rounded-full">
                      Active Host Session
                    </span>
                  </div>
                  <p className="text-xs text-[#696053]">
                    Connected to store database • {orders.length} total orders recorded
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={refreshData}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE0] text-[#4A433A] border border-[#DDD3C2] font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Orders</span>
                </button>
                {onSwitchToCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToCustomer();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>View Customer Store</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div
                onClick={() => setActiveFilter('pending_verification')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'pending_verification'
                    ? 'bg-[#FEF3C7] border-[#F59E0B] ring-2 ring-[#F59E0B]'
                    : 'bg-white border-[#DDD3C2] hover:border-[#F59E0B]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#92400E] uppercase">
                    Pending PhonePe
                  </span>
                  <Clock className="w-4 h-4 text-[#D97706]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#78350F] mt-1">
                  {pendingVerificationCount}
                </div>
                <span className="text-[10px] text-[#92400E]">Verify UTR in PhonePe</span>
              </div>

              <div
                onClick={() => setActiveFilter('crafting')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'crafting'
                    ? 'bg-[#E5EFE6] border-[#263E2E] ring-2 ring-[#263E2E]'
                    : 'bg-white border-[#DDD3C2] hover:border-[#263E2E]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#166534] uppercase">
                    In 2-3 Day Curing
                  </span>
                  <Sparkles className="w-4 h-4 text-[#166534]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#166534] mt-1">
                  {craftingCount}
                </div>
                <span className="text-[10px] text-[#55695A]">Artisan drying &amp; curing</span>
              </div>

              <div
                onClick={() => setActiveFilter('courier_pending')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'courier_pending'
                    ? 'bg-[#FFE4D5] border-[#C2410C] ring-2 ring-[#C2410C]'
                    : 'bg-white border-[#DDD3C2] hover:border-[#C2410C]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#9A3412] uppercase">
                    Courier Pending
                  </span>
                  <Package className="w-4 h-4 text-[#C2410C]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#9A3412] mt-1">
                  {courierPendingCount}
                </div>
                <span className="text-[10px] text-[#9A3412]">Cured — assign courier now</span>
              </div>

              <div
                onClick={() => setActiveFilter('shipped')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'shipped'
                    ? 'bg-[#EDE9FE] border-[#7C3AED] ring-2 ring-[#7C3AED]'
                    : 'bg-white border-[#DDD3C2] hover:border-[#7C3AED]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5B21B6] uppercase">
                    Dispatched / Transit
                  </span>
                  <Truck className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#5B21B6] mt-1">
                  {shippedCount}
                </div>
                <span className="text-[10px] text-[#6D28D9]">Tracking AWB assigned</span>
              </div>

              <div
                onClick={() => setActiveFilter('delivered')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'delivered'
                    ? 'bg-[#DCFCE7] border-[#15803D] ring-2 ring-[#15803D]'
                    : 'bg-white border-[#DDD3C2] hover:border-[#15803D]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#15803D] uppercase">
                    Delivered
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#15803D] mt-1">
                  {deliveredCount}
                </div>
                <span className="text-[10px] text-[#15803D]">Doorstep delivered</span>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-[#DDD3C2] space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8A8174] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order # (OB-XXXX), Customer Name, Phone, or UTR / Txn ID..."
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#DDD3C2] rounded-lg text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7A7265] hover:text-[#1C2C20]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Selector Tabs */}
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { key: 'all', label: `All (${orders.length})` },
                    {
                      key: 'pending_verification',
                      label: `⚠️ Pending PhonePe (${pendingVerificationCount})`,
                    },
                    {
                      key: 'rejected',
                      label: `❌ Rejected (${rejectedCount})`,
                    },
                    { key: 'crafting', label: `🌿 2-3 Day Curing (${craftingCount})` },
                    {
                      key: 'courier_pending',
                      label: `📦 Courier Pending (${courierPendingCount})`,
                    },
                    { key: 'shipped', label: `🚚 Dispatched (${shippedCount})` },
                    { key: 'delivered', label: `✅ Delivered (${deliveredCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveFilter(tab.key as any)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                        activeFilter === tab.key
                          ? tab.key === 'rejected'
                            ? 'bg-[#DC2626] text-white shadow-xs'
                            : 'bg-[#263E2E] text-white shadow-xs'
                          : tab.key === 'rejected' && rejectedCount > 0
                          ? 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FCA5A5]'
                          : 'bg-[#FAF7F2] text-[#554D41] hover:bg-[#EAE2D5]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders List Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#1C2C20] uppercase tracking-wider">
                  Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
                </span>
                <span className="text-[11px] text-[#696053]">
                  Host Verification &amp; Tracking Assignment Controls
                </span>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-[#DDD3C2] p-6 space-y-2">
                  <Package className="w-10 h-10 text-[#A89F91] mx-auto" />
                  <h3 className="font-display text-base font-bold text-[#1C2C20]">
                    No Orders Match the Selected Filter
                  </h3>
                  <p className="text-xs text-[#696053]">
                    Try clearing your search query or selecting &quot;All&quot; from the filter tabs above.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-2 text-xs text-[#263E2E] font-bold hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((ord) => {
                    const isPendingUtr = ord.paymentStatus === 'pending_host_verification';
                    const isDispatched = Boolean(ord.trackingId);

                    return (
                      <div
                        key={ord.orderNumber}
                        className={`bg-white rounded-xl border p-4 shadow-2xs space-y-3 transition-all ${
                          isPendingUtr
                            ? 'border-[#F59E0B] ring-1 ring-[#FCD34D] bg-[#FFFDF9]'
                            : 'border-[#DDD3C2]'
                        }`}
                      >
                        {/* Order Header Bar */}
                        <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-[#F0EBE1]">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-sm text-[#1C2C20]">
                                #{ord.orderNumber}
                              </span>

                              {/* Status Badges */}
                              {isPendingUtr ? (
                                <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>Action Required: Verify PhonePe UTR</span>
                                </span>
                              ) : ord.paymentStatus === 'verified' || ord.paymentStatus === 'paid' ? (
                                <span className="bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Payment Confirmed</span>
                                </span>
                              ) : (
                                <span className="bg-[#EDE5D8] text-[#5A5144] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Cash on Delivery
                                </span>
                              )}

                              <span className="text-[10px] bg-[#FAF7F2] border border-[#E0D6C6] text-[#4A433A] font-semibold px-2 py-0.5 rounded-full">
                                Status:{' '}
                                {ord.status === 'crafting'
                                  ? isReadyForCourier(ord)
                                    ? 'COURIER PENDING'
                                    : '2-3 DAY CURING'
                                  : (ord.status || 'placed').toUpperCase()}
                              </span>
                            </div>

                            <div className="text-[11px] text-[#7A7265] mt-1 flex flex-wrap items-center gap-2">
                              <span>Placed: {ord.date || 'Recent'}</span>
                              <span>•</span>
                              <span>
                                Customer: <strong className="text-[#1C2C20]">{ord.customer?.fullName || 'Valued Customer'}</strong> (+91 {ord.customer?.phone || ''})
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-[#7A7265] uppercase block">
                              Order Total
                            </span>
                            <span className="text-base font-bold text-[#263E2E] font-mono">
                              ₹{ord.total}
                            </span>
                          </div>
                        </div>

                        {/* Middle Content: Items & Address & Payment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          {/* Col 1: Ordered Soaps */}
                          <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DFD3] space-y-1.5">
                            <span className="font-bold text-[11px] text-[#1C2C20] block uppercase tracking-wide">
                              Items in Parcel ({ord.items.reduce((s, i) => s + i.quantity, 0)})
                            </span>
                            <div className="space-y-1">
                              {ord.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-[11px] text-[#3D372E]"
                                >
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

                          {/* Col 2: Shipping Destination */}
                          <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DFD3] space-y-1">
                            <span className="font-bold text-[11px] text-[#1C2C20] block uppercase tracking-wide">
                              Delivery Address
                            </span>
                            <p className="text-[11px] text-[#4A433A] leading-relaxed">
                              {ord.customer?.address || ''}, {ord.customer?.city || ''}, {ord.customer?.state || ''} -{' '}
                              <strong>{ord.customer?.pincode || ''}</strong>
                            </p>
                            {ord.customer?.deliveryNotes && (
                              <p className="text-[10px] text-[#78350F] bg-[#FFFBEB] p-1 rounded">
                                📝 Note: {ord.customer.deliveryNotes}
                              </p>
                            )}
                          </div>

                          {/* Col 3: Payment & UTR Verification Box */}
                          <div
                            className={`p-3 rounded-lg border space-y-1.5 ${
                              ord.paymentStatus === 'rejected'
                                ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                                : isPendingUtr
                                ? 'bg-[#FFFBEB] border-[#FCD34D]'
                                : 'bg-[#FAF7F2] border-[#E8DFD3]'
                            }`}
                          >
                            <span className="font-bold text-[11px] text-[#1C2C20] block uppercase tracking-wide">
                              Payment Verification
                            </span>
                            <div className="text-[11px] space-y-0.5">
                              <p>
                                <strong>Method:</strong> {(ord.paymentMethod || 'phonepe').toUpperCase()}
                              </p>
                              <div className="flex items-center gap-1">
                                <strong>UTR / Txn ID:</strong>
                                <span className="font-mono font-bold text-xs bg-white px-1.5 py-0.5 rounded border border-[#DDD3C2] text-[#263E2E]">
                                  {ord.utrNumber || ord.transactionId || 'None'}
                                </span>
                              </div>
                              {ord.paymentVerifiedAt && (
                                <p className="text-[10px] text-[#166534] font-medium">
                                  ✓ Verified by Host on {ord.paymentVerifiedAt}
                                </p>
                              )}
                              {ord.paymentStatus === 'rejected' && (
                                <div className="mt-1 p-1.5 rounded bg-white border border-[#FCA5A5] text-[10px] text-[#991B1B] space-y-0.5">
                                  <div className="flex items-center gap-1 font-bold text-[#DC2626]">
                                    <XCircle className="w-3 h-3 shrink-0" />
                                    <span>UTR Rejected by Host</span>
                                  </div>
                                  <p><strong>Reason:</strong> {ord.rejectionReason || 'UTR not found in PhonePe'}</p>
                                  {ord.paymentRejectedAt && (
                                    <p className="text-[9px] text-[#A84242]">Rejected at: {ord.paymentRejectedAt}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tracking Details Banner (if assigned or pending) */}
                        <div className="p-3 bg-[#FAF6EE] rounded-lg border border-[#E9E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Truck className="w-3.5 h-3.5 text-[#263E2E]" />
                              <span className="font-bold text-[#1C2C20]">
                                Courier: {ord.courierName || 'Not Assigned Yet'}
                              </span>
                              {isDispatched ? (
                                <span className="text-[10px] bg-[#DCFCE7] text-[#166534] px-1.5 py-0.5 rounded font-bold font-mono">
                                  AWB: {ord.trackingId}
                                </span>
                              ) : ord.status === 'crafting' && isReadyForCourier(ord) ? (
                                <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-[#86EFAC]">
                                  <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                                  <span>Soap Crafting Done ✓ Ready for Courier</span>
                                </span>
                              ) : (
                                <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                  <span>⏳ Handcrafting &amp; 2-3 Day Curing in progress</span>
                                </span>
                              )}
                            </div>
                            {isDispatched && ord.dispatchDate && (
                              <p className="text-[11px] text-[#554D41]">
                                Dispatched on: {ord.dispatchDate} • {ord.estimatedDelivery}
                              </p>
                            )}
                            {!isDispatched && ord.status === 'crafting' && isReadyForCourier(ord) && ord.curingCompletedAt && (
                              <p className="text-[10px] text-[#15803D]">
                                Soap crafting completed on {ord.curingCompletedAt}. Awaiting courier docket assignment.
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isDispatched && ord.trackingUrl && (
                              <a
                                href={ord.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F2ECE2] text-[#263E2E] border border-[#DDD3C2] text-[11px] font-semibold flex items-center gap-1"
                              >
                                <span>Check Tracking</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {/* Direct WhatsApp Message to Customer */}
                            <a
                              href={`https://wa.me/91${normalizePhone(ord.customer?.phone)}?text=${encodeURIComponent(
                                `Hi ${ord.customer?.fullName || 'there'}! Nikita here from Organic Bloom regarding your Order #${ord.orderNumber}.${
                                  ord.paymentStatus === 'rejected'
                                    ? ` We could not verify your PhonePe payment reference (${ord.utrNumber || ord.transactionId || 'None'}). Reason: ${ord.rejectionReason || 'UTR not found'}. Please reply with a payment screenshot or updated 12-digit UTR.`
                                    : isDispatched
                                    ? ` Your botanical soaps are cured & dispatched via ${ord.courierName} (AWB: ${ord.trackingId}).`
                                    : isPendingUtr
                                    ? ` We are verifying your PhonePe payment for ₹${ord.total} (UTR: ${ord.utrNumber || ord.transactionId}).`
                                    : ` Your soap batch is currently curing safely (2-3 days).`
                                }`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5A] text-white text-[11px] font-semibold flex items-center gap-1"
                              title="Chat with customer on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 fill-white" />
                              <span>WhatsApp Customer</span>
                            </a>
                          </div>
                        </div>

                        {/* HOST ACTION BUTTONS */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F0EBE1]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Step 1: Verify or Reject PhonePe Payment button */}
                            {isPendingUtr && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPayment(ord)}
                                  className="px-3.5 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                  title="Approve and confirm payment in PhonePe"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                                  <span>✓ Verify Payment (Matches PhonePe)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(ord)}
                                  className="px-3 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                  title="Reject invalid transaction ID and notify customer"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-white" />
                                  <span>✕ Reject Txn ID / UTR</span>
                                </button>
                              </>
                            )}

                            {/* If already rejected, show badge and allow re-verification */}
                            {ord.paymentStatus === 'rejected' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#DC2626] bg-[#FEE2E2] px-2.5 py-1.5 rounded-lg border border-[#FCA5A5] flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                                  <span>Payment Rejected</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPayment(ord)}
                                  className="px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="If customer sent valid proof or re-paid, verify payment"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-[#86EFAC]" />
                                  <span>Re-verify &amp; Approve Payment</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(ord)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE0] text-[#7A7265] text-xs font-medium border border-[#DDD3C2] cursor-pointer"
                                  title="Update rejection reason"
                                >
                                  Change Rejection Reason
                                </button>
                              </div>
                            )}

                            {/* Step 2: Advance to Soap Handcrafting & Curing */}
                            {ord.status === 'confirmed' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceToCuring(ord)}
                                className="px-3.5 py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                <span>🌿 Move to 2-3 Day Curing</span>
                              </button>
                            )}

                            {/* Step 2b: In 2-3 Day Curing -> Soap Crafting Done button (NO Assign Courier button here) */}
                            {ord.status === 'crafting' && !isReadyForCourier(ord) && (
                              <button
                                type="button"
                                onClick={() => handleMarkCraftingDone(ord)}
                                className="px-3.5 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                title="Mark soap curing and handcrafting finished, move to Courier Pending tab"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                                <span>Soap Crafting Done ✓</span>
                              </button>
                            )}

                            {/* Step 3: In Courier Pending -> Assign Courier Details & Dispatch button */}
                            {ord.status === 'crafting' && isReadyForCourier(ord) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignTracking(ord)}
                                  className="px-3.5 py-2 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                  title="Assign courier partner and tracking AWB number"
                                >
                                  <Truck className="w-3.5 h-3.5 text-[#E3B873]" />
                                  <span>📦 Assign Courier Details &amp; Dispatch</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRevertToCuring(ord)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE0] text-[#7A7265] text-xs font-medium border border-[#DDD3C2] cursor-pointer transition-colors"
                                  title="Move back to 2-3 Day Curing if marked by mistake"
                                >
                                  <span>↩ Back to Curing</span>
                                </button>
                              </>
                            )}

                            {/* If already dispatched / in transit, allow updating courier tracking if needed */}
                            {isDispatched && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignTracking(ord)}
                                className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE0] text-[#263E2E] border border-[#DDD3C2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                                title="Edit courier name or AWB docket number"
                              >
                                <Truck className="w-3.5 h-3.5 text-[#263E2E]" />
                                <span>Update Courier Tracking #</span>
                              </button>
                            )}
                          </div>

                          {/* Step 4: Quick status updates (e.g. mark delivered) */}
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-[#7A7265]">Quick Status:</span>
                            {ord.status !== 'delivered' ? (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(ord.orderNumber, 'delivered')}
                                className="px-2.5 py-1 rounded-md bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] font-bold border border-[#86EFAC] cursor-pointer"
                              >
                                Mark Delivered ✓
                              </button>
                            ) : (
                              <span className="text-[#15803D] font-bold">✓ Delivered</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
              </>
            )}

            {activeHostView === 'store' && (
              <div className="space-y-5">
                {/* ---- Announcement Banner Editor ---- */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#DDD3C2] shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF4EB] text-[#263E2E] flex items-center justify-center border border-[#E9DFD1] shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1C2C20]">Homepage Announcement</h3>
                      <p className="text-[11px] text-[#7A7265]">
                        Shows as a banner strip at the very top of your site, above the menu.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveAnnouncement} className="space-y-3">
                    <textarea
                      rows={2}
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="e.g. 🎉 Diwali Sale — Flat 20% off on all soaps this week!"
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={announcementActive}
                          onChange={(e) => setAnnouncementActive(e.target.checked)}
                          className="w-4 h-4 accent-[#263E2E] cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-[#38332A]">
                          Show this banner live on the site
                        </span>
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5 text-[#E3B873]" />
                        <span>{announcementSaved ? 'Saved!' : 'Save Announcement'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* ---- Product Catalog Manager ---- */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#DDD3C2] shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF4EB] text-[#263E2E] flex items-center justify-center border border-[#E9DFD1] shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1C2C20]">Product Catalog</h3>
                        <p className="text-[11px] text-[#7A7265]">
                          {products.length} product{products.length === 1 ? '' : 's'} — edit
                          prices, photos, descriptions, or add new soaps.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetProducts}
                        title="Reset catalog to the original defaults"
                        className="px-3 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#4A433A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-[#DDD3C2]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reset to Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStartAddProduct}
                        className="px-3.5 py-2 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E3B873]" />
                        <span>Add New Soap</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="border border-[#EAE2D5] rounded-xl overflow-hidden bg-[#FAF7F2] flex flex-col"
                      >
                        <div className="h-32 bg-[#F0EAE0] flex items-center justify-center overflow-hidden">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-[#B9AF9E]" />
                          )}
                        </div>
                        <div className="p-3 space-y-1.5 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-xs text-[#1C2C20] leading-tight">
                              {p.name}
                            </h4>
                            {!p.inStock && (
                              <span className="text-[9px] font-bold uppercase bg-[#FEE2E2] text-[#991B1B] px-1.5 py-0.5 rounded shrink-0">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#7A7265] line-clamp-2">{p.subtitle}</p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-sm font-bold text-[#263E2E]">₹{p.price}</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[10px] text-[#B9AF9E] line-through">
                                ₹{p.originalPrice}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 pt-1.5 mt-auto">
                            <button
                              type="button"
                              onClick={() => handleStartEditProduct(p)}
                              className="flex-1 py-1.5 rounded-lg bg-white hover:bg-[#F2ECE2] border border-[#DDD3C2] text-[#263E2E] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            {deleteConfirmId === p.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="flex-1 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Confirm</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="flex-1 py-1.5 rounded-lg bg-white hover:bg-[#FEE2E2] border border-[#DDD3C2] text-[#991B1B] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---- Customer Complaints Section ---- */}
            {activeHostView === 'complaints' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white border border-[#DDD3C2] shadow-xs">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#1C2C20]">Customer Complaints</h3>
                      <p className="text-xs text-[#786F63] mt-0.5">
                        Tickets raised via the Care Bot — including customers who never had
                        WhatsApp to send their ticket. Search by order ID, ticket ID, name or
                        phone, then reply directly here.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-[#F5EFE6] text-[#5C5449] px-2.5 py-1 rounded-full shrink-0">
                      {complaints.length} total
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#9A9184] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={complaintSearchQuery}
                        onChange={(e) => setComplaintSearchQuery(e.target.value)}
                        placeholder="Search by Order ID, Ticket ID, name or phone..."
                        className="w-full pl-9 pr-3 py-2 bg-[#FAF6EE] border border-[#DDD3C2] rounded-lg text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                      />
                    </div>
                    <div className="flex gap-1.5 bg-[#F5EFE6] p-1 rounded-lg w-fit">
                      {(['all', 'open', 'replied', 'resolved'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setComplaintFilter(f)}
                          className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold capitalize cursor-pointer transition-colors ${
                            complaintFilter === f
                              ? 'bg-[#263E2E] text-white'
                              : 'text-[#5C5449] hover:text-[#1C2C20]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredComplaints.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#9A9184]">
                      No complaint tickets {complaintSearchQuery ? 'match your search' : 'yet'}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-3">
                      {/* Ticket list */}
                      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                        {filteredComplaints.map((t) => (
                          <button
                            key={t.ticketId}
                            type="button"
                            onClick={() => handleSelectComplaint(t)}
                            className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                              selectedComplaintId === t.ticketId
                                ? 'bg-[#EAF3EC] border-[#263E2E]'
                                : 'bg-[#FAF6EE] border-[#E5DCCF] hover:border-[#C9BCA6]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-[#1C2C20]">#{t.ticketId}</span>
                              <span
                                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  t.status === 'resolved'
                                    ? 'bg-[#DCFCE7] text-[#15803D]'
                                    : t.status === 'replied'
                                    ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                                    : 'bg-[#FEF3C7] text-[#92400E]'
                                }`}
                              >
                                {t.status === 'resolved'
                                  ? 'Resolved'
                                  : t.status === 'replied'
                                  ? 'Replied'
                                  : 'Awaiting Reply'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#5D5548] mt-1">
                              Order #{t.orderNumber} • {t.customerName}
                            </div>
                            <div className="text-[10px] text-[#8C8477] mt-0.5 capitalize">
                              {t.category.replace('_', ' ')} • {t.affectedProduct}
                            </div>
                            <div className="text-[10px] text-[#A69C8C] mt-1">{t.createdAt}</div>
                          </button>
                        ))}
                      </div>

                      {/* Ticket detail + reply */}
                      <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#E5DCCF]">
                        {!selectedComplaint ? (
                          <div className="h-full flex items-center justify-center text-center text-xs text-[#9A9184] py-16">
                            Select a ticket to view details and reply.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-[#1C2C20]">
                                Ticket #{selectedComplaint.ticketId}
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${normalizePhone(selectedComplaint.customerPhone)}`,
                                    '_blank'
                                  )
                                }
                                className="text-[10px] font-bold text-[#263E2E] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp Customer
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 rounded-lg bg-white border border-[#E5DCCF]">
                                <span className="block text-[9px] text-[#9A9184] uppercase font-bold">Order</span>
                                <span className="font-mono font-bold text-[#1C2C20]">
                                  #{selectedComplaint.orderNumber}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-[#E5DCCF]">
                                <span className="block text-[9px] text-[#9A9184] uppercase font-bold">Customer</span>
                                <span className="font-bold text-[#1C2C20]">{selectedComplaint.customerName}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-[#E5DCCF]">
                                <span className="block text-[9px] text-[#9A9184] uppercase font-bold">Phone</span>
                                <span className="font-mono text-[#1C2C20]">{selectedComplaint.customerPhone}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-[#E5DCCF]">
                                <span className="block text-[9px] text-[#9A9184] uppercase font-bold">Category</span>
                                <span className="font-bold text-[#1C2C20] capitalize">
                                  {selectedComplaint.category.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-white border border-[#E5DCCF] text-xs">
                              <span className="block text-[9px] text-[#9A9184] uppercase font-bold mb-1">
                                Affected Product
                              </span>
                              <span className="text-[#2C2926] font-medium">{selectedComplaint.affectedProduct}</span>
                              <span className="block text-[9px] text-[#9A9184] uppercase font-bold mt-2 mb-1">
                                Description
                              </span>
                              <p className="text-[#2C2926] leading-relaxed">{selectedComplaint.description}</p>
                            </div>

                            {selectedComplaint.messages.length > 0 && (
                              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {selectedComplaint.messages.map((m) => (
                                  <div
                                    key={m.id}
                                    className={`p-2.5 rounded-lg text-xs border ${
                                      m.sender === 'host'
                                        ? 'bg-[#EAF3EC] border-[#BFDCC6] ml-6'
                                        : 'bg-white border-[#E5DCCF] mr-6'
                                    }`}
                                  >
                                    <span
                                      className={`block text-[9px] uppercase font-bold mb-1 ${
                                        m.sender === 'host' ? 'text-[#15803D]' : 'text-[#786F63]'
                                      }`}
                                    >
                                      {m.sender === 'host' ? 'You (Host)' : 'Customer'} • {m.timestamp}
                                    </span>
                                    {m.text && <p className="text-[#2C2926] leading-relaxed">{m.text}</p>}
                                    {m.photo && (
                                      <img
                                        src={m.photo}
                                        alt="Customer attachment"
                                        className="mt-1.5 rounded-lg max-h-40 object-cover border border-[#DDD3C2]"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div>
                              <label className="block text-[10px] font-bold text-[#38332A] mb-1.5 uppercase">
                                Reply to Customer
                              </label>
                              <textarea
                                value={complaintReplyText}
                                onChange={(e) => setComplaintReplyText(e.target.value)}
                                rows={3}
                                placeholder="Type your reply — e.g. replacement details, refund status, apology..."
                                className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-lg text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E] resize-none"
                              />
                              <div className="flex flex-wrap gap-2 mt-2">
                                <button
                                  type="button"
                                  disabled={!complaintReplyText.trim() || isSendingReply}
                                  onClick={() => handleSendComplaintReply(false)}
                                  className="px-3.5 py-2 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send Reply</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={!complaintReplyText.trim() || isSendingReply}
                                  onClick={() => handleSendComplaintReply(true)}
                                  className="px-3.5 py-2 rounded-lg bg-[#EAF3EC] hover:bg-[#DCEFDF] text-[#15803D] border border-[#BFDCC6] text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Reply &amp; Mark Resolved</span>
                                </button>
                                {selectedComplaint.status !== 'resolved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkComplaintResolved(selectedComplaint)}
                                    className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F5EFE6] border border-[#DDD3C2] text-[#5C5449] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Mark Resolved</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeHostView === 'whatsapp_gateway' && (
              <WhatsAppGatewaySettings hostPhone={host.phone} />
            )}
          </div>
        )}

        {/* SUB-MODAL: Assign Courier Tracking Number */}
        {trackingModalOrder && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-3 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#DDD3C2] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#263E2E] text-white flex items-center justify-center">
                    <Truck className="w-4 h-4 text-[#E3B873]" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#1C2C20]">
                      Assign Courier Tracking
                    </h3>
                    <p className="text-[11px] text-[#7A7265]">
                      Order #{trackingModalOrder.orderNumber} • {trackingModalOrder.customer.fullName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="text-[#7A7265] hover:text-[#1C2C20] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {trackingFormError && (
                <div className="p-2.5 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">
                  {trackingFormError}
                </div>
              )}

              <form onSubmit={handleSubmitTracking} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#38332A] mb-1">
                    Courier Partner *
                  </label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-lg text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  >
                    <option value="Delhivery Express">Delhivery Express</option>
                    <option value="Blue Dart Air">Blue Dart Air</option>
                    <option value="India Post Air Cargo / Speed Post">
                      India Post Air Cargo / Speed Post
                    </option>
                    <option value="DTDC Courier">DTDC Courier</option>
                    <option value="Xpressbees Logistics">Xpressbees Logistics</option>
                    <option value="Shadowfax">Shadowfax</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#38332A] mb-1">
                    AWB Tracking Docket Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEL948201934IN or 184920492"
                    value={trackingIdInput}
                    onChange={(e) => setTrackingIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-lg font-mono text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    autoFocus
                  />
                  <p className="text-[10px] text-[#7A7265] mt-1">
                    This exact tracking number will be immediately visible on the customer&apos;s live tracking screen.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-[#524B40] mb-1">
                    Custom Tracking Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.delhivery.com/track/package/..."
                    value={customTrackingUrl}
                    onChange={(e) => setCustomTrackingUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-lg text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  />
                  <p className="text-[10px] text-[#7A7265] mt-0.5">
                    Leave blank to auto-generate the official courier portal link.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EBE1]">
                  <button
                    type="button"
                    onClick={() => setTrackingModalOrder(null)}
                    className="px-3.5 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#4A433A] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white font-bold cursor-pointer shadow-xs"
                  >
                    Confirm &amp; Assign Tracking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL: Reject Payment Reference */}
        {rejectModalOrder && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-[#FCA5A5] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#FEE2E2] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center border border-[#FCA5A5]">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1C2C20]">
                      Reject Payment Reference
                    </h3>
                    <p className="text-[11px] text-[#7A7265]">
                      Order #{rejectModalOrder.orderNumber} • Amount: ₹{rejectModalOrder.total}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectModalOrder(null)}
                  className="p-1 rounded-lg text-[#7A7265] hover:bg-[#F2ECE2] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order and customer info recap */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E9E0D4] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#696053]">Customer:</span>
                  <span className="font-bold text-[#1C2C20]">
                    {rejectModalOrder.customer?.fullName} (+91 {rejectModalOrder.customer?.phone})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#696053]">Submitted UTR / Txn ID:</span>
                  <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-[#DDD3C2] text-[#991B1B]">
                    {rejectModalOrder.utrNumber || rejectModalOrder.transactionId || 'None'}
                  </span>
                </div>
                <div className="text-[11px] text-[#78350F] bg-[#FFFBEB] p-2 rounded-lg border border-[#FDE68A]">
                  ⚠️ <strong>Customer Notification:</strong> When rejected, the customer&apos;s order tracking portal will immediately show this rejection status and reason, along with an instant UTR resubmission form.
                </div>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#38332A] mb-1.5">
                    Select Rejection Reason *
                  </label>
                  <div className="space-y-1.5">
                    {[
                      'UTR / Transaction ID not found in PhonePe statement',
                      `Amount received does not match order total (₹${rejectModalOrder.total})`,
                      'Invalid, incomplete, or dummy UTR entered',
                      'Duplicate transaction reference already utilized',
                      'other',
                    ].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          rejectReasonPreset === reason
                            ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
                            : 'bg-white border-[#DDD3C2] text-[#4A433A] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="rejectionReason"
                          value={reason}
                          checked={rejectReasonPreset === reason}
                          onChange={() => setRejectReasonPreset(reason)}
                          className="mt-0.5 text-[#DC2626] focus:ring-[#DC2626]"
                        />
                        <span className="text-xs font-medium">
                          {reason === 'other' ? 'Other custom reason (type below)' : reason}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {rejectReasonPreset === 'other' && (
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">
                      Custom Explanation for Customer *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={customRejectReason}
                      onChange={(e) => setCustomRejectReason(e.target.value)}
                      placeholder="e.g. Received ₹150 instead of ₹350, please check transfer details..."
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-lg text-xs text-[#2C2926] focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#FEE2E2]">
                  {/* Quick direct WhatsApp notification link */}
                  <a
                    href={`https://wa.me/91${normalizePhone(rejectModalOrder.customer?.phone)}?text=${encodeURIComponent(
                      `Hi ${rejectModalOrder.customer?.fullName}! Nikita here from Organic Bloom regarding Order #${rejectModalOrder.orderNumber}. We were unable to verify your PhonePe payment reference (${rejectModalOrder.utrNumber || rejectModalOrder.transactionId || 'None'}). Reason: ${rejectReasonPreset === 'other' ? (customRejectReason || 'Payment not found') : rejectReasonPreset}. Please re-check and submit your valid 12-digit UTR on your order tracking link or reply here with your payment screenshot.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5A] text-white text-[11px] font-bold flex items-center gap-1.5"
                    title="Send rejection explanation directly on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp Customer</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalOrder(null)}
                      className="px-3.5 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#4A433A] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReject}
                      className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isSubmittingReject ? 'Rejecting...' : 'Confirm Rejection'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL: Add / Edit Product (Store Manager) */}
        {draft && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl border border-[#DDD3C2] shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EBE1] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF4EB] text-[#263E2E] flex items-center justify-center border border-[#E9DFD1]">
                    {draft.id ? <Pencil className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
                  </div>
                  <h3 className="font-display font-bold text-base text-[#1C2C20]">
                    {draft.id ? `Edit "${draft.name || 'Product'}"` : 'Add New Soap'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#4A433A] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
                {productFormError && (
                  <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{productFormError}</span>
                  </div>
                )}

                {/* Photo */}
                <div>
                  <label className="block font-bold text-[#38332A] mb-1.5">Product Photo *</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setProductImageMode('url')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border ${
                        productImageMode === 'url'
                          ? 'bg-[#263E2E] text-white border-[#263E2E]'
                          : 'bg-white text-[#4A433A] border-[#DDD3C2]'
                      }`}
                    >
                      Paste Image Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductImageMode('upload')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border ${
                        productImageMode === 'upload'
                          ? 'bg-[#263E2E] text-white border-[#263E2E]'
                          : 'bg-white text-[#4A433A] border-[#DDD3C2]'
                      }`}
                    >
                      Upload From Device
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 rounded-xl bg-[#FAF7F2] border border-[#DDD3C2] flex items-center justify-center overflow-hidden shrink-0">
                      {draft.image ? (
                        <img src={draft.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-[#B9AF9E]" />
                      )}
                    </div>
                    <div className="flex-1">
                      {productImageMode === 'url' ? (
                        <input
                          type="text"
                          value={draft.image}
                          onChange={(e) => setDraft((d) => (d ? { ...d, image: e.target.value } : d))}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                        />
                      ) : (
                        <>
                          <label className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE2] border border-dashed border-[#C7BBA6] rounded-xl text-[#4A433A] font-semibold cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Choose Photo File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-[#7A7265] mt-1">
                            Keep it under ~900KB. Large photos may fail to save.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={draft.name}
                      onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                      placeholder="e.g. Rose & Honey Soap"
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">Subtitle / Tagline</label>
                    <input
                      type="text"
                      value={draft.subtitle}
                      onChange={(e) => setDraft((d) => (d ? { ...d, subtitle: e.target.value } : d))}
                      placeholder="e.g. Gentle Glow for Everyday Skin"
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>
                </div>

                {/* Category, Price, Original Price */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">Category</label>
                    <select
                      value={draft.category}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, category: e.target.value as SoapProduct['category'] } : d))
                      }
                      className="w-full px-2.5 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    >
                      <option value="bar">Bar</option>
                      <option value="bundle">Bundle</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={draft.price || ''}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, price: Number(e.target.value) } : d))
                      }
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">MRP (optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.originalPrice || ''}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, originalPrice: e.target.value ? Number(e.target.value) : undefined } : d
                        )
                      }
                      placeholder="For strikethrough"
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">Weight (oz)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={draft.weightOz || ''}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, weightOz: Number(e.target.value) } : d))
                      }
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>
                </div>

                {/* Badge & Cure Time & In Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">Badge Text (optional)</label>
                    <input
                      type="text"
                      value={draft.badge || ''}
                      onChange={(e) => setDraft((d) => (d ? { ...d, badge: e.target.value } : d))}
                      placeholder="e.g. Bestseller • Only ₹99"
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#38332A] mb-1">Cure Time (weeks)</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.cureTimeWeeks || ''}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, cureTimeWeeks: Number(e.target.value) } : d))
                      }
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={draft.inStock}
                        onChange={(e) => setDraft((d) => (d ? { ...d, inStock: e.target.checked } : d))}
                        className="w-4 h-4 accent-[#263E2E] cursor-pointer"
                      />
                      <span className="font-bold text-[#38332A]">In Stock</span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-[#38332A] mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={draft.description}
                    onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                    placeholder="Tell customers what makes this soap special..."
                    className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  />
                </div>

                {/* Benefits */}
                <div>
                  <label className="block font-bold text-[#38332A] mb-1">
                    Key Benefits <span className="font-normal text-[#7A7265]">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={draft.benefits.join(', ')}
                    onChange={(e) =>
                      setDraft((d) =>
                        d
                          ? {
                              ...d,
                              benefits: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            }
                          : d
                      )
                    }
                    placeholder="e.g. Deep cleanses, Fights acne, Soothes irritation"
                    className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  />
                </div>

                {/* More details (advanced, optional) */}
                <details className="border border-[#EAE2D5] rounded-xl">
                  <summary className="px-3 py-2.5 font-bold text-[#38332A] cursor-pointer select-none">
                    More Details (optional)
                  </summary>
                  <div className="px-3 pb-3 pt-1 space-y-3 border-t border-[#F0EBE1]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-[#38332A] mb-1">Scent Family</label>
                        <select
                          value={draft.scentFamily}
                          onChange={(e) =>
                            setDraft((d) =>
                              d ? { ...d, scentFamily: e.target.value as SoapProduct['scentFamily'] } : d
                            )
                          }
                          className="w-full px-2.5 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                        >
                          <option value="Floral & Calming">Floral &amp; Calming</option>
                          <option value="Citrus & Uplifting">Citrus &amp; Uplifting</option>
                          <option value="Earthy & Herbal">Earthy &amp; Herbal</option>
                          <option value="Detox & Clarifying">Detox &amp; Clarifying</option>
                          <option value="Warm & Honey">Warm &amp; Honey</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-[#38332A] mb-1">Exfoliation</label>
                        <select
                          value={draft.exfoliationLevel}
                          onChange={(e) =>
                            setDraft((d) =>
                              d
                                ? { ...d, exfoliationLevel: e.target.value as SoapProduct['exfoliationLevel'] }
                                : d
                            )
                          }
                          className="w-full px-2.5 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                        >
                          <option value="None (Silky)">None (Silky)</option>
                          <option value="Ultra Gentle">Ultra Gentle</option>
                          <option value="Medium Botanical Scrub">Medium Botanical Scrub</option>
                          <option value="Deep Mineral Scrub">Deep Mineral Scrub</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-[#38332A] mb-1">Lather</label>
                        <select
                          value={draft.latherProfile}
                          onChange={(e) =>
                            setDraft((d) =>
                              d ? { ...d, latherProfile: e.target.value as SoapProduct['latherProfile'] } : d
                            )
                          }
                          className="w-full px-2.5 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                        >
                          <option value="Ultra Creamy">Ultra Creamy</option>
                          <option value="Velvety Bubbles">Velvety Bubbles</option>
                          <option value="Dense Froth">Dense Froth</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#38332A] mb-1">
                        Skin Type <span className="font-normal text-[#7A7265]">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={draft.skinType.join(', ')}
                        onChange={(e) =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  skinType: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean) as SoapProduct['skinType'],
                                }
                              : d
                          )
                        }
                        placeholder="Sensitive, Dry, Oily, Combination, Normal, All Skin Types"
                        className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#38332A] mb-1">
                        Key Botanicals <span className="font-normal text-[#7A7265]">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={draft.keyBotanicals.join(', ')}
                        onChange={(e) =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  keyBotanicals: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                }
                              : d
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#38332A] mb-1">
                        Full Ingredients List <span className="font-normal text-[#7A7265]">(comma-separated)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={draft.fullIngredients.join(', ')}
                        onChange={(e) =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  fullIngredients: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                }
                              : d
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                      />
                    </div>
                  </div>
                </details>
              </form>

              <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#F0EBE1] shrink-0 bg-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-[#EAE2D5] border border-[#DDD3C2] text-[#4A433A] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveProduct(e as any)}
                  className="px-4 py-2 rounded-lg bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 text-[#E3B873]" />
                  <span>{draft.id ? 'Save Changes' : 'Add Product'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
