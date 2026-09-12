import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Truck,
  Mail,
  FileText,
} from "lucide-react";
import { BRAND_INFO } from "../data/soaps";
import { PhonePeQRCard } from "./PhonePeQRCard";
import {
  saveOrderRecord,
  generateTrackingMilestones,
} from "../utils/orderStorage";
import { getCurrentUser, registerUser } from "../utils/authStorage";

export const CheckoutModal = ({
  isOpen,
  onClose,
  cart,
  promoDiscount,
  promoCode,
  selectedSample,
  onOrderCompleted,
  onOpenTracking,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "phonepe",
    orderNotes: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isPaidVerified, setIsPaidVerified] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // If checkout is opened with items in cart, reset confirmed state and auto-fill if user logged in
  useEffect(() => {
    if (isOpen) {
      if (cart.length > 0) {
        setIsConfirmed(false);
        setOrderNumber("");
        setTrackingNumber("");
        setIsPaidVerified(false);
        setValidationError(null);
      }
      const loggedIn = getCurrentUser();
      if (loggedIn) {
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || loggedIn.fullName || "",
          phone: prev.phone || loggedIn.phone || "",
          email: prev.email || loggedIn.email || "",
          address: prev.address || loggedIn.address || "",
          city: prev.city || loggedIn.city || "",
          state: prev.state || loggedIn.state || "",
          pincode: prev.pincode || loggedIn.pincode || "",
        }));
      }
    }
  }, [isOpen, cart.length]);

  const handleStartNewOrder = () => {
    setIsConfirmed(false);
    setOrderNumber("");
    setTrackingNumber("");
    setIsPaidVerified(false);
    onClose();
    const el = document.getElementById("collection");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  if (!isOpen) return null;

  const rawSubtotal = cart.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0,
  );
  const subtotal = Math.max(0, rawSubtotal - promoDiscount);
  const shipping = rawSubtotal >= 499 || promoCode === "FREESHIP" ? 0 : 40;
  const total = subtotal + shipping;

  const generateWhatsAppMessage = (ordNum, txId, isPaid, chosenMethod) => {
    const itemsList = cart
      .map(
        (item) =>
          `• ${item.quantity}x ${item.product.name} (₹${item.product.price * item.quantity})`,
      )
      .join("\n");
    const finalMethod = chosenMethod || formData.paymentMethod || "phonepe";
    const payModeName =
      finalMethod === "cod"
        ? "Cash on Delivery (COD)"
        : finalMethod === "gpay"
          ? "Google Pay (GPay)"
          : finalMethod === "phonepe"
            ? "PhonePe (UPI QR)"
            : "UPI Transfer";

    const paymentStatusText =
      finalMethod === "cod"
        ? "Cash on Delivery (COD at Doorstep) 📦"
        : `PhonePe / UPI (Submitted UTR: ${txId || "Pending"}) ⏳ Host Verification Required`;

    const text = `*🌿 NEW ORDER — ORGANIC BLOOM*
*Order No:* ${ordNum}
*Customer Name:* ${formData.fullName}
*WhatsApp / Phone:* ${formData.phone}
*Email:* ${formData.email || "N/A"}

*📦 Delivery Address:*
${formData.address}
${formData.city}, ${formData.state} - ${formData.pincode}
${formData.orderNotes ? `*Delivery Notes:* ${formData.orderNotes}\n` : ""}
*✨ Items Ordered:*
${itemsList}
*🎁 Complimentary Sample:* ${selectedSample}
*Subtotal:* ₹${subtotal}
*Courier Charges:* ${shipping === 0 ? "FREE" : `₹${shipping}`}
*Total Amount Payable:* ₹${total}
*💳 Payment Method:* ${(finalMethod || "phonepe").toUpperCase()}
*🔢 Submitted UTR / Txn ID:* ${txId || (finalMethod === "cod" ? "N/A (Cash on Delivery)" : "To be verified")}

*Status:* ${finalMethod === "cod" ? "COD Order Placed" : "Payment Submitted — Awaiting Host PhonePe Verification"}
Please verify in PhonePe App / HDFC Account 6686 to confirm this order. Thank you!`;

    return encodeURIComponent(text);
  };

  const executeOrder = (options) => {
    // Validate required fields
    if (
      !formData.fullName.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim()
    ) {
      setValidationError(
        "Please fill in your Name, Phone Number, and Delivery Address.",
      );
      const formEl = document.getElementById("checkout-form");
      formEl?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const finalMethod = options?.chosenMethod || formData.paymentMethod;
    const finalTxId = options?.txId || transactionId.trim();

    // Enforce UTR for PhonePe / UPI
    if (finalMethod !== "cod" && (!finalTxId || finalTxId.length < 6)) {
      setValidationError(
        "Please enter your 12-digit UTR No. or Transaction ID from PhonePe to submit your order.",
      );
      const qrEl = document.getElementById("phonepe-qr-card");
      qrEl?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setValidationError(null);
    setIsProcessing(true);

    const generatedOrderNum = `OB-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      setIsProcessing(false);
      setIsConfirmed(true);
      setOrderNumber(generatedOrderNum);
      setTrackingNumber(""); // No fake tracking! Real tracking assigned by host on dispatch
      setIsPaidVerified(false); // Host must verify UTR in PhonePe
      if (finalTxId) setTransactionId(finalTxId);

      // Save order record with pending verification and unassigned tracking
      const newOrder = {
        orderNumber: generatedOrderNum,
        date: new Date().toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        customer: {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          deliveryNotes: formData.orderNotes,
        },
        items: cart,
        subtotal,
        shipping,
        total,
        paymentMethod: finalMethod,
        paymentStatus:
          finalMethod === "cod" ? "pending_cod" : "pending_host_verification",
        transactionId: finalTxId || undefined,
        utrNumber: finalTxId || undefined,
        status: "placed",
        courierName: "",
        trackingId: "",
        trackingUrl: "",
        estimatedDelivery:
          "Curing in progress (2-3 days). Tracking provided upon dispatch.",
        milestones: generateTrackingMilestones("placed", formData.city),
      };

      saveOrderRecord(newOrder);

      // Save customer profile for customer login access
      if (formData.fullName && formData.phone) {
        registerUser({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        });
      }

      // Order confirmation happens entirely in-app (see isConfirmed screen
      // below) — we no longer force-open WhatsApp on every order. The
      // customer can still tap "WhatsApp Nikita Khatri" on that screen if
      // they want to, but it's optional now; the order (with UTR) has
      // already been saved and synced to the Host Portal automatically.
      onOrderCompleted();
    }, 850);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeOrder();
  };

  const handleQrPaymentSuccess = (info) => {
    executeOrder({
      isPaid: true,
      txId: info.transactionId,
      chosenMethod: "phonepe",
    });
  };

  return (
    <div
      id="checkout-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div
        id="checkout-modal"
        className="bg-[#FAF7F2] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E4DCCF] overflow-hidden relative my-auto p-5 sm:p-8"
      >
        {/* Close Button */}
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#4A443A] hover:text-[#2C2926] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isConfirmed ? (
          /* Order Confirmation Screen */
          <div className="text-center py-2 space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-[#E5EFE6] text-[#263E2E] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-[#15803D]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-[#263E2E] font-bold">
                Order Placed Successfully!
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C2C20]">
                Thank You,{" "}
                {formData.fullName.split(" ")[0] || "Valued Customer"}!
              </h2>
              <p className="text-xs sm:text-sm text-[#5D554C] max-w-md mx-auto">
                Order{" "}
                <strong className="font-mono text-[#263E2E] bg-white px-2 py-0.5 rounded border border-[#DDD3C2]">
                  {orderNumber}
                </strong>{" "}
                has been received by Nikita Khatri.
              </p>
            </div>

            {/* Payment & Host Verification Status Badge */}
            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E9DFCF] text-left max-w-lg mx-auto space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#263E2E] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#5F259F]" />
                  <span>Payment Status:</span>
                </span>
                {formData.paymentMethod === "cod" ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#EAE2D5] text-[#2C2926] font-bold text-[11px]">
                    Cash on Delivery (Pay at Doorstep)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-bold text-[11px] border border-[#FCD34D]">
                    Pending Host PhonePe Verification
                  </span>
                )}
              </div>

              {transactionId && (
                <div className="bg-white p-2 rounded-lg border border-[#E2D8C7] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#7A7265] block">
                      Submitted UTR / Txn ID
                    </span>
                    <span className="font-mono font-bold text-[#5F259F] text-xs">
                      {transactionId}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#15803D] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded">
                    Transmitted to Host
                  </span>
                </div>
              )}

              <p className="text-[11px] text-[#6B6459] leading-relaxed">
                Host Nikita Khatri will verify your transaction in the PhonePe
                Business app. Once verified, your order status will update to{" "}
                <strong>Payment Confirmed</strong>.
              </p>
            </div>

            {/* Handcrafted Curing & Real Dispatch Notice */}
            <div className="p-4 rounded-xl bg-white border border-[#DDD3C2] shadow-xs text-left max-w-lg mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C2C20]">
                  <Sparkles className="w-4 h-4 text-[#E3B873]" />
                  <span>Fresh Botanical Handcrafting &amp; Curing</span>
                </div>
                <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#1B5E20] px-2 py-0.5 rounded-full">
                  2-3 Business Days
                </span>
              </div>

              <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#EBE3D7] text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-[#263E2E] font-bold">
                  <Truck className="w-4 h-4 text-[#263E2E]" />
                  <span>Real Courier Tracking (AWB Number)</span>
                </div>
                <p className="text-[11px] text-[#6B6459] leading-relaxed">
                  We do not generate fake tracking links. Handcrafted herbal
                  soaps require 2-3 days for curing and hermetic
                  moisture-sealing. Once your parcel is handed over to the
                  courier (Delhivery, Blue Dart, or India Post), the host will
                  input the genuine courier tracking number in the system, and
                  it will appear in your Tracking Portal immediately.
                </p>
              </div>

              {/* Action Buttons for Tracking & WhatsApp */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenTracking) onOpenTracking(orderNumber);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Truck className="w-4 h-4" />
                  <span>View Order Status in Portal</span>
                </button>

                <a
                  href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${generateWhatsAppMessage(orderNumber, transactionId, false)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp Nikita Khatri</span>
                </a>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              <button
                onClick={handleStartNewOrder}
                className="px-5 py-2.5 rounded-full bg-[#263E2E] hover:bg-[#1A2E20] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E3B873]" />
                <span>Place Another Order / Buy More Soaps</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenTracking) onOpenTracking(orderNumber);
                }}
                className="px-5 py-2.5 rounded-full bg-[#EAE2D5] hover:bg-[#DFD5C6] text-[#2C2926] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#263E2E]" />
                <span>View All Orders &amp; History</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-full bg-white border border-[#DDD3C2] text-[#4A433A] font-semibold hover:bg-[#FAF7F2] cursor-pointer"
              >
                Back to Store
              </button>
              <a
                href={`mailto:${BRAND_INFO.email}?subject=Order%20Confirmation%20${orderNumber}&body=${generateWhatsAppMessage(orderNumber, transactionId, isPaidVerified)}`}
                className="px-4 py-2.5 rounded-full bg-white border border-[#DDD3C2] text-[#4A433A] font-semibold hover:bg-[#FAF7F2] flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-[#263E2E]" />
                <span>Email Copy</span>
              </a>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DFD3]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#263E2E]" />
                <h2 className="font-display text-2xl font-semibold text-[#1C2C20]">
                  Order Checkout
                </h2>
              </div>
              <span className="text-[11px] text-[#263E2E] bg-[#E5EFE5] px-2.5 py-0.5 rounded-full font-semibold">
                Pan-India Courier • Handcrafted Herbal Soaps
              </span>
            </div>

            {validationError && (
              <div className="mb-3 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold">
                ⚠️ {validationError}
              </div>
            )}

            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A433A] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nikita, Priya Sharma"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A433A] mb-1">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98765 XXXXX (10-digit mobile number)"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A433A] mb-1">
                  Email Address (for invoice &amp; dispatch receipt)
                </label>
                <input
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full text-xs bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                />
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-xs font-semibold text-[#4A433A] mb-1">
                  Complete Delivery Address (House No., Flat/Society, Street,
                  Area) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Shivalik Residency, Near Vastrapur Lake"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full text-xs bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A433A] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A433A] mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A433A] mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="380015"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                  />
                </div>
              </div>

              {/* Payment Methods (PhonePe Recommended, GPay, COD) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#263E2E] mb-2 uppercase tracking-wider">
                  Select Payment Option *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* PhonePe (Recommended) */}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: "phonepe" })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      formData.paymentMethod === "phonepe"
                        ? "bg-[#1C2C20] text-white border-[#1C2C20] ring-2 ring-[#263E2E]"
                        : "bg-white text-[#332E27] border-[#DDD3C2] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1">
                        <span>PhonePe / QR</span>
                      </span>
                      <span className="text-[10px] font-bold bg-[#5F259F] text-white px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                    </div>
                    <p
                      className={`text-[11px] leading-tight ${formData.paymentMethod === "phonepe" ? "text-[#D0DFC9]" : "text-[#6B6459]"}`}
                    >
                      Scan QR or Pay to khatrinikita03@ybl
                    </p>
                  </button>

                  {/* Google Pay / Any UPI */}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: "gpay" })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      formData.paymentMethod === "gpay"
                        ? "bg-[#1C2C20] text-white border-[#1C2C20] ring-2 ring-[#263E2E]"
                        : "bg-white text-[#332E27] border-[#DDD3C2] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1">
                        <span>Google Pay / UPI</span>
                      </span>
                      <span className="text-[10px] font-bold bg-[#4285F4] text-white px-1.5 py-0.5 rounded">
                        GPay
                      </span>
                    </div>
                    <p
                      className={`text-[11px] leading-tight ${formData.paymentMethod === "gpay" ? "text-[#D0DFC9]" : "text-[#6B6459]"}`}
                    >
                      Instant UPI: khatrinikita03@ybl
                    </p>
                  </button>

                  {/* COD */}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: "cod" })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      formData.paymentMethod === "cod"
                        ? "bg-[#1C2C20] text-white border-[#1C2C20] ring-2 ring-[#263E2E]"
                        : "bg-white text-[#332E27] border-[#DDD3C2] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1">
                        <span>Cash on Delivery</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          formData.paymentMethod === "cod"
                            ? "bg-[#E3B873] text-[#1C2C20]"
                            : "bg-[#EAE2D5] text-[#4A433A]"
                        }`}
                      >
                        COD
                      </span>
                    </div>
                    <p
                      className={`text-[11px] leading-tight ${formData.paymentMethod === "cod" ? "text-[#D0DFC9]" : "text-[#6B6459]"}`}
                    >
                      Pay cash or scan QR when delivered at doorstep
                    </p>
                  </button>
                </div>

                {/* Embedded PhonePe QR Card with Scanner & 1-Click Verification */}
                {formData.paymentMethod !== "cod" && (
                  <div className="mt-3 animate-fade-in">
                    <div className="mb-2 px-3 py-2 bg-[#FAF4EA] rounded-xl border border-[#E2D8C7] text-xs text-[#4A4339] flex items-center justify-between">
                      <span className="font-medium">
                        💡 Scan the QR code or tap Pay via PhonePe. Copy the
                        12-digit UTR No. and submit below so the host can verify
                        and approve your order.
                      </span>
                    </div>
                    <PhonePeQRCard
                      amount={total}
                      orderNumber={orderNumber || undefined}
                      onPaymentSuccess={handleQrPaymentSuccess}
                    />
                  </div>
                )}
              </div>

              {/* Order Summary Pill */}
              <div className="p-3.5 rounded-xl bg-[#F5EFE6] border border-[#E4DCCF] text-xs space-y-1">
                <div className="flex justify-between text-[#5E574E]">
                  <span>
                    Items in Bag ({cart.reduce((s, i) => s + i.quantity, 0)}):
                  </span>
                  <span>₹{rawSubtotal}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-[#263E2E] font-medium">
                    <span>Special Discount ({promoCode}):</span>
                    <span>-₹{promoDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5E574E]">
                  <span>Pan-India Courier:</span>
                  <span>
                    {shipping === 0 ? (
                      <strong className="text-[#263E2E]">FREE</strong>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#1C2C20] pt-1.5 border-t border-[#DDD3C2]">
                  <span>Total Payable:</span>
                  <span className="text-base text-[#263E2E]">₹{total}</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-full bg-[#263E2E] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1A2E20] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Confirming Your Order...
                    </span>
                  ) : (
                    <>
                      <span>
                        Complete Order — ₹{total} (
                        {formData.paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : "PhonePe / UPI"}
                        )
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A7266] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#263E2E]" />
                <span>Orders Managed Directly: +91 93132 68959</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
