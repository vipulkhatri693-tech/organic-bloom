import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Sparkles,
  Search,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  LogOut,
  DollarSign,
  RefreshCw,
  XCircle,
  Download,
  X,
  Store,
  ChevronLeft,
} from "lucide-react";
import {
  getSavedOrders,
  verifyPaymentByHost,
  rejectPaymentByHost,
  advanceOrderToCuring,
  assignCourierTracking,
  updateOrderStatus,
} from "../utils/orderStorage";
import {
  getHostSession,
  loginHost,
  logoutHost,
  normalizePhone,
} from "../utils/authStorage";

export const SellerPortal = ({ onSwitchToCustomer }) => {
  const [host, setHost] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Seller Login Form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Tracking Assign modal state
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [courierName, setCourierName] = useState("Delhivery Express");
  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [customTrackingUrl, setCustomTrackingUrl] = useState("");
  const [trackingFormError, setTrackingFormError] = useState(null);

  // Reject Payment Modal state
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReasonPreset, setRejectReasonPreset] = useState(
    "UTR / Transaction ID not found in PhonePe statement",
  );
  const [customRejectReason, setCustomRejectReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [lastRejectedOrder, setLastRejectedOrder] = useState(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = () => {
    const session = getHostSession();
    setHost(session);
    const all = getSavedOrders();
    setOrders(all);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const handleHostAuthChange = () => {
      refreshData();
    };
    const handleOrdersUpdate = () => {
      setOrders(getSavedOrders());
    };
    window.addEventListener("host_auth_change", handleHostAuthChange);
    window.addEventListener("orders_updated", handleOrdersUpdate);
    return () => {
      window.removeEventListener("host_auth_change", handleHostAuthChange);
      window.removeEventListener("orders_updated", handleOrdersUpdate);
    };
  }, []);

  // Handle Seller Login
  const handleSellerLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);

    setTimeout(() => {
      const res = loginHost(loginUsername, loginPassword);
      setIsSubmittingLogin(false);
      if (res.success && res.host) {
        setHost(res.host);
        showToast(`Welcome to Seller Hub, ${res.host.name}!`);
      } else {
        setLoginError(
          res.error ||
            "Invalid seller credentials. Check mobile number & password.",
        );
      }
    }, 400);
  };

  // Handle Seller Logout
  const handleSellerLogout = () => {
    logoutHost();
    setHost(null);
    showToast("Logged out of Seller Hub.");
  };

  // Handle Action: Verify PhonePe Payment
  const handleVerifyPayment = (order) => {
    const updated = verifyPaymentByHost(order.orderNumber);
    if (updated) {
      refreshData();
      showToast(
        `Order #${order.orderNumber} payment confirmed & verified in PhonePe!`,
      );
    }
  };

  // Handle Action: Open Payment Rejection Modal
  const handleOpenRejectModal = (order) => {
    setRejectModalOrder(order);
    setRejectReasonPreset(
      "UTR / Transaction ID not found in PhonePe statement",
    );
    setCustomRejectReason("");
  };

  // Handle Action: Confirm Payment Rejection
  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!rejectModalOrder) return;

    const finalReason =
      rejectReasonPreset === "other"
        ? customRejectReason.trim() ||
          "Payment details could not be verified in PhonePe"
        : rejectReasonPreset;

    setIsSubmittingReject(true);
    setTimeout(() => {
      const updated = rejectPaymentByHost(
        rejectModalOrder.orderNumber,
        finalReason,
      );
      setIsSubmittingReject(false);
      if (updated) {
        setLastRejectedOrder({ order: updated, reason: finalReason });
        setRejectModalOrder(null);
        refreshData();
        showToast(
          `Payment for #${updated.orderNumber} marked as REJECTED. Customer alerted.`,
        );
      }
    }, 300);
  };

  // Handle Action: Advance to Soap Handcrafting & Curing
  const handleAdvanceToCuring = (order) => {
    const updated = advanceOrderToCuring(order.orderNumber);
    if (updated) {
      refreshData();
      showToast(
        `Order #${order.orderNumber} moved to Handcrafting & 2-3 Day Curing!`,
      );
    }
  };

  // Open Tracking Input modal for Order
  const handleOpenAssignTracking = (order) => {
    setTrackingModalOrder(order);
    setCourierName(order.courierName || "Delhivery Express");
    setTrackingIdInput(order.trackingId || "");
    setCustomTrackingUrl(order.trackingUrl || "");
    setTrackingFormError(null);
  };

  // Submit Courier Tracking
  const handleSubmitTracking = (e) => {
    e.preventDefault();
    if (!trackingModalOrder) return;
    if (!trackingIdInput.trim()) {
      setTrackingFormError(
        "Please enter a valid courier tracking / AWB number.",
      );
      return;
    }

    const updated = assignCourierTracking(
      trackingModalOrder.orderNumber,
      courierName,
      trackingIdInput,
      customTrackingUrl,
    );

    if (updated) {
      refreshData();
      setTrackingModalOrder(null);
      showToast(
        `Courier tracking ${trackingIdInput.trim()} assigned! Customer can now view live tracking.`,
      );
    }
  };

  // Handle Quick Status Change (e.g. mark delivered)
  const handleQuickStatusChange = (orderNumber, status) => {
    const updated = updateOrderStatus(orderNumber, status);
    if (updated) {
      refreshData();
      showToast(
        `Order #${orderNumber} marked as ${status.replace(/_/g, " ")}!`,
      );
    }
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast("No orders to export.");
      return;
    }

    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Phone",
      "City",
      "Items",
      "Total Amount",
      "Payment Status",
      "UTR Number",
      "Order Status",
      "Courier",
      "Tracking ID",
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.createdAt || ""}"`,
      `"${o.customer?.fullName || ""}"`,
      `"${o.customer?.phone || ""}"`,
      `"${o.customer?.city || ""}"`,
      `"${o.items?.map((i) => `${i.product.name} x${i.quantity}`).join("; ") || ""}"`,
      `"${o.total}"`,
      `"${o.paymentStatus}"`,
      `"${o.utrNumber || o.transactionId || ""}"`,
      `"${o.status}"`,
      `"${o.courierName || ""}"`,
      `"${o.trackingId || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `OrganicBloom_Orders_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Orders exported to CSV successfully.");
  };

  // Filter calculations
  const pendingVerificationCount = orders.filter(
    (o) => o.paymentStatus === "pending_host_verification",
  ).length;
  const rejectedCount = orders.filter(
    (o) => o.paymentStatus === "rejected",
  ).length;
  const craftingCount = orders.filter((o) => o.status === "crafting").length;
  const shippedCount = orders.filter(
    (o) =>
      o.status === "shipped" ||
      o.status === "in_transit" ||
      o.status === "out_for_delivery",
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  const totalRevenue = orders.reduce((sum, o) => {
    if (o.paymentStatus === "paid" || o.paymentStatus === "verified") {
      return sum + o.total;
    }
    return sum;
  }, 0);

  // Filtered list
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "pending_verification") {
      if (o.paymentStatus !== "pending_host_verification") return false;
    } else if (activeFilter === "rejected") {
      if (o.paymentStatus !== "rejected") return false;
    } else if (activeFilter === "crafting") {
      if (o.status !== "crafting") return false;
    } else if (activeFilter === "shipped") {
      if (
        o.status !== "shipped" &&
        o.status !== "in_transit" &&
        o.status !== "out_for_delivery"
      )
        return false;
    } else if (activeFilter === "delivered") {
      if (o.status !== "delivered") return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (o.orderNumber || "").toLowerCase().includes(q) ||
      (o.customer?.fullName || "").toLowerCase().includes(q) ||
      (o.customer?.phone || "").includes(q) ||
      Boolean(o.utrNumber && o.utrNumber.toLowerCase().includes(q)) ||
      Boolean(o.transactionId && o.transactionId.toLowerCase().includes(q)) ||
      Boolean(o.trackingId && o.trackingId.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="seller-hub-root"
      className="min-h-screen w-full bg-[#FAF7F2] flex flex-col font-sans text-[#2C2926]"
    >
      {/* Top Navbar: Flipkart Seller Hub style */}
      <header className="bg-[#1C2C20] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#2C3E30] sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E3B873] text-[#1C2C20] flex items-center justify-center font-bold text-lg shadow-xs">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base sm:text-xl tracking-wide text-[#FAF7F2]">
                Organic Bloom Seller Hub
              </span>
              <span className="text-[10px] font-bold uppercase bg-[#2F4735] text-[#86EFAC] px-2 py-0.5 rounded-full border border-[#41634A]">
                Merchant Center
              </span>
            </div>
            <p className="text-[11px] text-[#C2B7A7] hidden sm:block">
              Artisan Operations • PhonePe UTR Settlement &amp; Dispatch
              Logistics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Switch to Customer Storefront Button (Flipkart Seller Hub style) */}
          <button
            type="button"
            onClick={onSwitchToCustomer}
            className="px-3.5 py-1.5 rounded-lg bg-[#2A3F30] hover:bg-[#385440] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#3E5C46]"
            title="Open the customer shopping storefront"
          >
            <Store className="w-3.5 h-3.5 text-[#E3B873]" />
            <span>Customer Storefront</span>
            <ExternalLink className="w-3 h-3 text-[#C2B7A7]" />
          </button>

          {host && (
            <button
              type="button"
              onClick={handleSellerLogout}
              className="px-3 py-1.5 rounded-lg bg-[#842029]/80 hover:bg-[#842029] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Log out of seller account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Seller Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Toast alert */}
      {toastMessage && (
        <div className="bg-[#1C2C20] text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-[#3B4D3F] shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 text-[#86EFAC]" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#DDD3C2] hover:text-white text-xs cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Body content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 flex flex-col">
        {!host ? (
          /* Dedicated Flipkart Seller Hub Login Experience */
          <div className="my-auto py-8 sm:py-12 flex items-center justify-center">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl border border-[#DDD3C2] shadow-xl overflow-hidden">
              {/* Left Brand & Feature Column (Flipkart Seller style) */}
              <div className="bg-[#1C2C20] text-white p-8 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A3F30] text-[#E3B873] text-xs font-semibold border border-[#3E5C46]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Merchant Operations Center</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#FAF7F2] leading-tight">
                    Welcome to Organic Bloom Seller Hub
                  </h2>
                  <p className="text-xs sm:text-sm text-[#C2B7A7] leading-relaxed">
                    The central command system for managing handcrafted soap
                    orders, reconciling PhonePe UPI payments, tracking herbal
                    batch curing schedules, and booking express courier
                    shipments.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-[#E5EFE6]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#86EFAC] shrink-0" />
                    <span>
                      1-Click PhonePe UTR Match &amp; Settlement Approval
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#E3B873] shrink-0" />
                    <span>2-3 Day Cold Process Herbal Curing Scheduler</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-[#86EFAC] shrink-0" />
                    <span>
                      Courier Tracking Assignment (Delhivery &amp; BlueDart)
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span>Direct Customer WhatsApp Dispatch Notifications</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2C3E30] flex items-center justify-between text-[11px] text-[#A8C4AF]">
                  <span>Ahmedabad Handcrafted Studio</span>
                  <span>🔒 Secure Seller Environment</span>
                </div>
              </div>

              {/* Right Seller Login Form */}
              <div className="p-8 sm:p-10 flex flex-col justify-center space-y-6 bg-white">
                <div className="space-y-1">
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1C2C20]">
                    Seller Account Login
                  </h3>
                  <p className="text-xs text-[#696053]">
                    Enter your Store Owner mobile number &amp; password to
                    access all orders.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleSellerLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#38332A] mb-1">
                      Seller Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="e.g. 9313268959"
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                      autoFocus
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#38332A]">
                        Seller Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-[#7A7265] hover:text-[#1C2C20]"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter seller password"
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingLogin}
                    className="w-full py-3 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmittingLogin ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#E3B873]" />
                        <span>Log In to Seller Hub</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-3 border-t border-[#F0EAE0]">
                  <button
                    type="button"
                    onClick={onSwitchToCustomer}
                    className="text-xs text-[#7A7265] hover:text-[#1C2C20] underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Shopping as a customer? Go to customer store</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Flipkart Seller Hub Dashboard */
          <div className="space-y-6">
            {/* Top Seller Banner & Control Strip */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DDD3C2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E5EFE6] text-[#263E2E] flex items-center justify-center font-bold text-xl shrink-0 border border-[#C2D8C6]">
                  🌿
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#1C2C20]">
                      {host.name}
                    </span>
                    <span className="text-[10px] bg-[#DCFCE7] text-[#166534] font-bold px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                      Active Seller Session
                    </span>
                  </div>
                  <p className="text-xs text-[#696053]">
                    Mobile: +91 {host.phone} • {orders.length} total customer
                    orders recorded
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={refreshData}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE0] text-[#4A433A] border border-[#DDD3C2] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Orders</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE0] text-[#4A433A] border border-[#DDD3C2] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="Export orders to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#263E2E]" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={onSwitchToCustomer}
                  className="px-4 py-2 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Store className="w-3.5 h-3.5 text-[#E3B873]" />
                  <span>Open Customer Store</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#E3B873]" />
                </button>
              </div>
            </div>

            {/* KPI Metrics Strip (Flipkart Seller style) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div
                onClick={() => setActiveFilter("pending_verification")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                  activeFilter === "pending_verification"
                    ? "bg-[#FEF3C7] border-[#F59E0B] ring-2 ring-[#F59E0B]"
                    : "bg-white border-[#DDD3C2] hover:border-[#F59E0B]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#92400E] uppercase tracking-wider">
                    Needs UTR Check
                  </span>
                  <Clock className="w-4 h-4 text-[#D97706]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#78350F] mt-1.5">
                  {pendingVerificationCount}
                </div>
                <span className="text-[11px] text-[#92400E]">
                  Verify in PhonePe
                </span>
              </div>

              <div
                onClick={() => setActiveFilter("crafting")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                  activeFilter === "crafting"
                    ? "bg-[#E5EFE6] border-[#263E2E] ring-2 ring-[#263E2E]"
                    : "bg-white border-[#DDD3C2] hover:border-[#263E2E]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#166534] uppercase tracking-wider">
                    In 2-3 Day Curing
                  </span>
                  <Sparkles className="w-4 h-4 text-[#166534]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#166534] mt-1.5">
                  {craftingCount}
                </div>
                <span className="text-[11px] text-[#55695A]">
                  Artisan drying &amp; curing
                </span>
              </div>

              <div
                onClick={() => setActiveFilter("shipped")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                  activeFilter === "shipped"
                    ? "bg-[#EDE9FE] border-[#7C3AED] ring-2 ring-[#7C3AED]"
                    : "bg-white border-[#DDD3C2] hover:border-[#7C3AED]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5B21B6] uppercase tracking-wider">
                    Dispatched / Transit
                  </span>
                  <Truck className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#5B21B6] mt-1.5">
                  {shippedCount}
                </div>
                <span className="text-[11px] text-[#6D28D9]">AWB assigned</span>
              </div>

              <div
                onClick={() => setActiveFilter("delivered")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                  activeFilter === "delivered"
                    ? "bg-[#DCFCE7] border-[#15803D] ring-2 ring-[#15803D]"
                    : "bg-white border-[#DDD3C2] hover:border-[#15803D]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#166534] uppercase tracking-wider">
                    Delivered
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#166534] mt-1.5">
                  {deliveredCount}
                </div>
                <span className="text-[11px] text-[#55695A]">
                  Completed orders
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#DDD3C2] shadow-2xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#696053] uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <DollarSign className="w-4 h-4 text-[#263E2E]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#1C2C20] mt-1.5">
                  ₹{totalRevenue}
                </div>
                <span className="text-[11px] text-[#7A7265]">
                  Paid &amp; verified total
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#DDD3C2] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeFilter === "all"
                      ? "bg-[#263E2E] text-white shadow-xs"
                      : "bg-[#FAF7F2] text-[#4A433A] hover:bg-[#F0EAE0]"
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("pending_verification")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeFilter === "pending_verification"
                      ? "bg-[#F59E0B] text-white shadow-xs"
                      : "bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]"
                  }`}
                >
                  Needs Verification ({pendingVerificationCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("crafting")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeFilter === "crafting"
                      ? "bg-[#263E2E] text-white shadow-xs"
                      : "bg-[#E5EFE6] text-[#166534] hover:bg-[#D5E6D7]"
                  }`}
                >
                  In Curing ({craftingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("shipped")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeFilter === "shipped"
                      ? "bg-[#7C3AED] text-white shadow-xs"
                      : "bg-[#EDE9FE] text-[#5B21B6] hover:bg-[#DDD6FE]"
                  }`}
                >
                  Dispatched ({shippedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("rejected")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeFilter === "rejected"
                      ? "bg-[#DC2626] text-white shadow-xs"
                      : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]"
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#7A7265] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Order #, Mobile, UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#7A7265] hover:text-[#1C2C20]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#DDD3C2] text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] text-[#263E2E] flex items-center justify-center mx-auto text-2xl border border-[#E9DFD1]">
                  📦
                </div>
                <h3 className="font-display text-lg font-bold text-[#1C2C20]">
                  No Orders Found
                </h3>
                <p className="text-xs text-[#7A7265] max-w-md mx-auto">
                  {searchQuery
                    ? `No orders match your search "${searchQuery}". Try a different phone number or order number.`
                    : "No customer orders match the current filter."}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-3.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE0] text-xs font-semibold text-[#2C2926] border border-[#DDD3C2] cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord) => {
                  const isPendingUtr =
                    ord.paymentStatus === "pending_host_verification";
                  const isDispatched =
                    ord.status === "shipped" ||
                    ord.status === "in_transit" ||
                    ord.status === "out_for_delivery" ||
                    ord.status === "delivered";

                  return (
                    <div
                      key={ord.orderNumber}
                      className={`bg-white rounded-2xl border transition-all p-4 sm:p-6 space-y-4 shadow-xs ${
                        isPendingUtr
                          ? "border-[#F59E0B] ring-1 ring-[#F59E0B]/30"
                          : ord.paymentStatus === "rejected"
                            ? "border-[#FCA5A5]"
                            : "border-[#DDD3C2]"
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0EBE1]">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm sm:text-base text-[#1C2C20]">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-xs text-[#7A7265]">
                            {ord.createdAt || "Recent"}
                          </span>
                          {ord.paymentMethod === "cod" ? (
                            <span className="text-[11px] bg-[#E0E7FF] text-[#3730A3] px-2 py-0.5 rounded-full font-bold">
                              Cash on Delivery (COD)
                            </span>
                          ) : (
                            <span className="text-[11px] bg-[#EDE9FE] text-[#5B21B6] px-2 py-0.5 rounded-full font-bold">
                              PhonePe UPI (Prepaid)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold capitalize ${
                              ord.status === "delivered"
                                ? "bg-[#DCFCE7] text-[#15803D]"
                                : isDispatched
                                  ? "bg-[#EDE9FE] text-[#6D28D9]"
                                  : ord.status === "crafting"
                                    ? "bg-[#E5EFE6] text-[#166534]"
                                    : "bg-[#FEF3C7] text-[#92400E]"
                            }`}
                          >
                            Status: {ord.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {/* Main Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Column 1: Customer info */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE4D8]">
                          <span className="text-[10px] uppercase font-bold text-[#7A7265] block">
                            👤 Customer Details
                          </span>
                          <div className="font-bold text-sm text-[#1C2C20]">
                            {ord.customer?.fullName || "Valued Customer"}
                          </div>
                          <div className="font-mono text-xs text-[#263E2E] font-semibold">
                            +91 {ord.customer?.phone}
                          </div>
                          <p className="text-[11px] text-[#554D41] leading-relaxed">
                            {ord.customer?.address}, {ord.customer?.city} -{" "}
                            {ord.customer?.pincode}
                          </p>
                        </div>

                        {/* Column 2: Items list */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE4D8]">
                          <span className="text-[10px] uppercase font-bold text-[#7A7265] block">
                            🧼 Ordered Soaps &amp; Combos (
                            {ord.items?.length || 0})
                          </span>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {ord.items?.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-[#1C2C20]">
                                  {it.product.name} ×{" "}
                                  <strong className="font-mono">
                                    {it.quantity}
                                  </strong>
                                </span>
                                <span className="font-mono text-[#554D41]">
                                  ₹{it.product.price * it.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-1.5 border-t border-[#DDD3C2] flex items-center justify-between font-bold text-xs text-[#1C2C20]">
                            <span>Total Bill:</span>
                            <span className="text-sm font-mono text-[#263E2E]">
                              ₹{ord.total}
                            </span>
                          </div>
                        </div>

                        {/* Column 3: Payment details */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE4D8]">
                          <span className="text-[10px] uppercase font-bold text-[#7A7265] block">
                            💳 Payment &amp; UTR Verification
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="text-[#554D41]">
                              Payment Status:
                            </span>
                            <span
                              className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                                ord.paymentStatus === "verified" ||
                                ord.paymentStatus === "paid"
                                  ? "bg-[#DCFCE7] text-[#15803D]"
                                  : ord.paymentStatus === "rejected"
                                    ? "bg-[#FEE2E2] text-[#DC2626]"
                                    : "bg-[#FEF3C7] text-[#D97706]"
                              }`}
                            >
                              {ord.paymentStatus.replace(/_/g, " ")}
                            </span>
                          </div>

                          <div className="pt-1">
                            <span className="text-[#7A7265] block text-[10px]">
                              Customer PhonePe UTR:
                            </span>
                            <strong className="font-mono text-xs text-[#1C2C20] break-all bg-white px-2 py-1 rounded border border-[#DDD3C2] block mt-0.5">
                              {ord.utrNumber ||
                                ord.transactionId ||
                                "No UTR Entered"}
                            </strong>
                          </div>

                          {ord.paymentVerifiedAt && (
                            <p className="text-[10px] text-[#166534] font-medium">
                              ✓ Verified by Host on {ord.paymentVerifiedAt}
                            </p>
                          )}

                          {ord.paymentStatus === "rejected" && (
                            <div className="mt-1 p-1.5 rounded bg-white border border-[#FCA5A5] text-[10px] text-[#991B1B] space-y-0.5">
                              <div className="flex items-center gap-1 font-bold text-[#DC2626]">
                                <XCircle className="w-3 h-3 shrink-0" />
                                <span>UTR Rejected by Seller</span>
                              </div>
                              <p>
                                <strong>Reason:</strong>{" "}
                                {ord.rejectionReason ||
                                  "UTR not found in PhonePe"}
                              </p>
                              {ord.paymentRejectedAt && (
                                <p className="text-[9px] text-[#A84242]">
                                  Rejected at: {ord.paymentRejectedAt}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Courier Tracking Details Banner */}
                      <div className="p-3.5 bg-[#FAF6EE] rounded-xl border border-[#E9E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#263E2E]" />
                            <span className="font-bold text-[#1C2C20]">
                              Courier: {ord.courierName || "Not Assigned Yet"}
                            </span>
                            {isDispatched ? (
                              <span className="text-[10px] bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded font-bold font-mono">
                                AWB: {ord.trackingId}
                              </span>
                            ) : (
                              <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded font-medium">
                                ⏳ In Batch Production &amp; Curing
                              </span>
                            )}
                          </div>
                          {isDispatched && ord.dispatchDate && (
                            <p className="text-[11px] text-[#554D41]">
                              Dispatched: {ord.dispatchDate} • Est:{" "}
                              {ord.estimatedDelivery}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isDispatched && ord.trackingUrl && (
                            <a
                              href={ord.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F2ECE2] text-[#263E2E] border border-[#DDD3C2] text-xs font-semibold flex items-center gap-1"
                            >
                              <span>Track Courier</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {/* Direct WhatsApp Message to Customer */}
                          <a
                            href={`https://wa.me/91${normalizePhone(ord.customer?.phone)}?text=${encodeURIComponent(
                              `Hi ${ord.customer?.fullName || "there"}! Nikita here from Organic Bloom regarding your Order #${ord.orderNumber}.${
                                ord.paymentStatus === "rejected"
                                  ? ` We could not verify your PhonePe payment reference (${ord.utrNumber || ord.transactionId || "None"}). Reason: ${ord.rejectionReason || "UTR not found"}. Please reply with a payment screenshot or updated 12-digit UTR.`
                                  : isDispatched
                                    ? ` Your botanical soaps are cured & dispatched via ${ord.courierName} (AWB: ${ord.trackingId}).`
                                    : isPendingUtr
                                      ? ` We are verifying your PhonePe payment for ₹${ord.total} (UTR: ${ord.utrNumber || ord.transactionId}).`
                                      : ` Your soap batch is currently curing safely (2-3 days).`
                              }`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5A] text-white text-xs font-semibold flex items-center gap-1.5"
                            title="Chat with customer on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp Customer</span>
                          </a>
                        </div>
                      </div>

                      {/* SELLER ACTION BUTTONS */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0EBE1]">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Step 1: Verify or Reject PhonePe Payment */}
                          {isPendingUtr && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerifyPayment(ord)}
                                className="px-3.5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                title="Confirm payment in PhonePe"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                                <span>✓ Accept UTR &amp; Verify Payment</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(ord)}
                                className="px-3.5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                title="Reject invalid UTR"
                              >
                                <XCircle className="w-3.5 h-3.5 text-white" />
                                <span>✕ Reject Txn ID / UTR</span>
                              </button>
                            </>
                          )}

                          {/* Re-verify rejected payment */}
                          {ord.paymentStatus === "rejected" && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#DC2626] bg-[#FEE2E2] px-2.5 py-1.5 rounded-lg border border-[#FCA5A5] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                                <span>Payment Rejected</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleVerifyPayment(ord)}
                                className="px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3 text-[#86EFAC]" />
                                <span>Re-verify &amp; Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(ord)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EAE0] text-[#7A7265] text-xs font-medium border border-[#DDD3C2] cursor-pointer"
                              >
                                Change Rejection Reason
                              </button>
                            </div>
                          )}

                          {/* Step 2: Advance to Soap Handcrafting & Curing */}
                          {ord.status === "confirmed" && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceToCuring(ord)}
                              className="px-3.5 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                              <span>🌿 Move to 2-3 Day Curing</span>
                            </button>
                          )}

                          {/* Step 3: Assign Courier Tracking */}
                          <button
                            type="button"
                            onClick={() => handleOpenAssignTracking(ord)}
                            className="px-3.5 py-2 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5 text-[#E3B873]" />
                            <span>
                              {isDispatched
                                ? "Update Tracking #"
                                : "📦 Assign Courier & Dispatch"}
                            </span>
                          </button>
                        </div>

                        {/* Step 4: Mark Delivered */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[#7A7265]">Status:</span>
                          {ord.status !== "delivered" ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickStatusChange(
                                  ord.orderNumber,
                                  "delivered",
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] font-bold border border-[#86EFAC] cursor-pointer"
                            >
                              Mark Delivered ✓
                            </button>
                          ) : (
                            <span className="text-[#15803D] font-bold bg-[#DCFCE7] px-2 py-1 rounded-md">
                              ✓ Completed &amp; Delivered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* SUB-MODAL: Assign Courier Tracking */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#DDD3C2] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#263E2E] text-white flex items-center justify-center">
                  <Truck className="w-4 h-4 text-[#E3B873]" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[#1C2C20]">
                    Assign Courier Tracking
                  </h3>
                  <p className="text-[11px] text-[#7A7265]">
                    Order #{trackingModalOrder.orderNumber} •{" "}
                    {trackingModalOrder.customer.fullName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="w-7 h-7 rounded-full bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#7A7265] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {trackingFormError && (
              <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">
                {trackingFormError}
              </div>
            )}

            <form onSubmit={handleSubmitTracking} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#38332A] mb-1">
                  Courier Partner *
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                >
                  <option value="Delhivery Express">Delhivery Express</option>
                  <option value="Blue Dart Air">Blue Dart Air</option>
                  <option value="India Post Air Cargo / Speed Post">
                    India Post Air Cargo / Speed Post
                  </option>
                  <option value="DTDC Courier">DTDC Courier</option>
                  <option value="Xpressbees Logistics">
                    Xpressbees Logistics
                  </option>
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
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl font-mono text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  autoFocus
                />

                <p className="text-[10px] text-[#7A7265] mt-1">
                  This tracking number will immediately appear on the
                  customer&apos;s order tracking screen.
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
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#4A433A] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirm &amp; Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Reject Payment Reference */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#FCA5A5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#FEE2E2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1C2C20]">
                    Reject PhonePe Payment Reference
                  </h3>
                  <p className="text-[11px] text-[#7A7265]">
                    Order #{rejectModalOrder.orderNumber} • Amount: ₹
                    {rejectModalOrder.total}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalOrder(null)}
                className="w-7 h-7 rounded-full bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#7A7265] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] text-xs text-[#9B2C2C] space-y-1">
              <p className="font-semibold">
                Customer submitted UTR:
                <span className="font-mono ml-1 font-bold">
                  {rejectModalOrder.utrNumber ||
                    rejectModalOrder.transactionId ||
                    "None"}
                </span>
              </p>
              <p className="text-[11px] text-[#C53030]">
                Marking this payment as rejected will immediately alert the
                customer on their tracking screen and prompt them to re-enter a
                valid 12-digit UTR or send payment screenshot.
              </p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#38332A] mb-1">
                  Reason for Rejection *
                </label>
                <select
                  value={rejectReasonPreset}
                  onChange={(e) => setRejectReasonPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="UTR / Transaction ID not found in PhonePe statement">
                    UTR / Transaction ID not found in PhonePe statement
                  </option>
                  <option value="Received amount does not match total order amount">
                    Received amount does not match total order amount
                  </option>
                  <option value="Duplicate or already used transaction reference">
                    Duplicate or already used transaction reference
                  </option>
                  <option value="Payment was reversed or cancelled by bank">
                    Payment was reversed or cancelled by bank
                  </option>
                  <option value="Invalid format (12-digit numeric UTR required)">
                    Invalid format (12-digit numeric UTR required)
                  </option>
                  <option value="other">Other (Write custom note below)</option>
                </select>
              </div>

              {rejectReasonPreset === "other" && (
                <div>
                  <label className="block font-bold text-[#38332A] mb-1">
                    Custom Explanation for Customer *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Specify why the PhonePe payment could not be verified..."
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#F0EBE1]">
                <a
                  href={`https://wa.me/91${normalizePhone(rejectModalOrder.customer?.phone)}?text=${encodeURIComponent(
                    `Hi ${rejectModalOrder.customer?.fullName || "Customer"}! Regarding your Organic Bloom Order #${rejectModalOrder.orderNumber}: We were unable to verify your PhonePe payment reference (${rejectModalOrder.utrNumber || "None"}). Reason: ${
                      rejectReasonPreset === "other"
                        ? customRejectReason
                        : rejectReasonPreset
                    }. Please reply here with a screenshot of your successful payment so we can dispatch your soaps.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5A] text-white text-[11px] font-bold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>WhatsApp Customer</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalOrder(null)}
                    className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#4A433A] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReject}
                    className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>
                      {isSubmittingReject
                        ? "Rejecting..."
                        : "Confirm Rejection"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
