import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MessageCircle,
  Bot,
  Package,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Send,
  ChevronRight,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquarePlus,
} from "lucide-react";
import { getSavedOrders, findOrder } from "../utils/orderStorage";
import {
  getCurrentUser,
  saveComplaintTicket,
  findComplaintTicket,
  subscribeToComplaints,
  addComplaintMessage,
  normalizePhone,
  getComplaintTickets,
} from "../utils/authStorage";
import { BRAND_INFO } from "../data/soaps";

export const ComplaintBotModal = ({
  isOpen,
  onClose,
  preselectedOrderNumber,
  onOpenAuth,
}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);

  // Bot Flow Steps: 1: select_order, 2: select_category, 3: select_product_details, 4: summary_whatsapp
  const [currentStep, setCurrentStep] = useState("select_order");

  // Complaint Form State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [manualOrderId, setManualOrderId] = useState("");
  const [category, setCategory] = useState("damaged");
  const [affectedProduct, setAffectedProduct] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [generatedWaUrl, setGeneratedWaUrl] = useState("");

  // Bot typing simulation
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Top-level mode: 'new' = raising a new complaint, 'track' = 1:1 live support chat & tracking
  const [mode, setMode] = useState("track");
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedTicket, setTrackedTicket] = useState(null);
  const [trackError, setTrackError] = useState(null);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpPhoto, setFollowUpPhoto] = useState(null);
  const [followUpPhotoError, setFollowUpPhotoError] = useState(null);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [showResolvedArchive, setShowResolvedArchive] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);

  const messagesEndRef = useRef(null);

  // Live-subscribe to complaints so updates and host replies appear live without page reload
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToComplaints((tickets) => {
      setAllComplaints(tickets);
      if (trackedTicket) {
        const fresh = tickets.find(
          (t) => t.ticketId === trackedTicket.ticketId,
        );
        if (fresh) setTrackedTicket(fresh);
      }
    });
    return unsub;
  }, [isOpen, trackedTicket?.ticketId]);

  // Auto-scroll to the bottom of the conversation whenever messages update
  useEffect(() => {
    if (trackedTicket) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    }
  }, [trackedTicket?.messages?.length, trackedTicket?.ticketId]);

  const handleTrackSearch = (e) => {
    e.preventDefault();
    setTrackError(null);
    const found = findComplaintTicket(trackQuery);
    if (!found) {
      setTrackError(
        "Couldn't find a complaint with that Order ID or Ticket ID. Double-check and try again.",
      );
      setTrackedTicket(null);
      return;
    }
    setTrackedTicket(found);
  };

  const handleFollowUpPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFollowUpPhotoError(null);
    if (file.size > 900 * 1024) {
      setFollowUpPhotoError(
        "That photo is quite large (over ~900KB). Please compress it first or attach a smaller one.",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFollowUpPhoto(reader.result);
    reader.onerror = () =>
      setFollowUpPhotoError(
        "Could not read that photo. Please try a different file.",
      );
    reader.readAsDataURL(file);
  };

  const handleSendFollowUp = () => {
    if (!trackedTicket || (!followUpText.trim() && !followUpPhoto)) return;
    const textToSend =
      followUpText.trim() || (followUpPhoto ? "Photo attached." : "");
    const photoToSend = followUpPhoto || undefined;

    // Immediately clear input and attachment so nothing is stuck in the input box!
    setFollowUpText("");
    setFollowUpPhoto(null);
    setFollowUpPhotoError(null);
    setIsSendingFollowUp(true);

    setTimeout(() => {
      const updated = addComplaintMessage(
        trackedTicket.ticketId,
        "customer",
        textToSend,
        { photo: photoToSend },
      );
      setIsSendingFollowUp(false);
      if (updated) {
        setTrackedTicket(updated);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 60);
      }
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      setTrackQuery("");
      setTrackError(null);
      setFollowUpText("");
      setFollowUpPhoto(null);
      setFollowUpPhotoError(null);
      setShowManualSearch(false);
      setShowResolvedArchive(false);

      const user = getCurrentUser();
      setCurrentUser(user);
      const orders = getSavedOrders();
      setAllOrders(orders);
      const complaints = getComplaintTickets();
      setAllComplaints(complaints);

      if (preselectedOrderNumber) {
        if (preselectedOrderNumber.startsWith("OB-CMP-")) {
          setMode("track");
          const found = findComplaintTicket(preselectedOrderNumber);
          if (found) {
            setTrackedTicket(found);
            return;
          }
        }
        const found = findOrder(preselectedOrderNumber);
        if (found) {
          setSelectedOrder(found);
          setManualOrderId(found.orderNumber);
          setAffectedProduct(found.items[0]?.product.name || "Entire Parcel");
          setCurrentStep("select_category");
          setMode("new");
          setTrackedTicket(null);
          return;
        }
      }

      // If user is logged in, automatically show their open tickets or open chat
      if (user?.phone) {
        const uPhone = normalizePhone(user.phone);
        const userOpen = complaints.filter(
          (t) =>
            normalizePhone(t.customerPhone) === uPhone &&
            t.status !== "resolved",
        );
        if (userOpen.length > 0) {
          setMode("track");
          if (userOpen.length === 1) {
            setTrackedTicket(userOpen[0]);
          } else {
            setTrackedTicket(null);
          }
          return;
        }
      }

      // Default to new mode
      setMode("new");
      setTrackedTicket(null);
      const deliveredOrder =
        orders.find((o) => o.status === "delivered") || orders[0];
      if (deliveredOrder) {
        setSelectedOrder(deliveredOrder);
        setManualOrderId(deliveredOrder.orderNumber);
        setAffectedProduct(
          deliveredOrder.items[0]?.product.name || "Entire Parcel",
        );
      }
      setCurrentStep("select_order");
    }
  }, [isOpen, preselectedOrderNumber]);

  if (!isOpen) return null;

  const handleSelectOrderAndProceed = (ord) => {
    setSelectedOrder(ord);
    setManualOrderId(ord.orderNumber);
    setAffectedProduct(ord.items[0]?.product.name || "Entire Parcel");
    setIsBotThinking(true);
    setTimeout(() => {
      setIsBotThinking(false);
      setCurrentStep("select_category");
    }, 400);
  };

  const handleManualOrderSubmit = (e) => {
    e.preventDefault();
    if (!manualOrderId || !manualOrderId.trim()) return;
    const cleanId = manualOrderId.trim();
    const found = findOrder(cleanId);
    if (found) {
      handleSelectOrderAndProceed(found);
    } else {
      // Create a dummy placeholder order if order was placed offline
      const tempOrder = {
        orderNumber: cleanId.toUpperCase(),
        date: "Recent Order",
        customer: {
          fullName: currentUser?.fullName || "Customer",
          phone: currentUser?.phone || "Not Provided",
          address: "",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "",
        },
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0,
        paymentMethod: "phonepe",
        paymentStatus: "verified",
        status: "delivered",
        courierName: "Courier Partner",
        trackingId: "DEL84920193IN",
        trackingUrl: "",
        estimatedDelivery: "Delivered",
        milestones: [],
      };
      setSelectedOrder(tempOrder);
      setAffectedProduct("Handcrafted Soap Bar");
      setIsBotThinking(true);
      setTimeout(() => {
        setIsBotThinking(false);
        setCurrentStep("select_category");
      }, 400);
    }
  };

  const handleSelectCategoryAndProceed = (cat) => {
    setCategory(cat);
    setIsBotThinking(true);
    setTimeout(() => {
      setIsBotThinking(false);
      setCurrentStep("select_product_details");
    }, 350);
  };

  const handleGenerateComplaintTicket = () => {
    const newTicketId = `OB-CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(newTicketId);

    const custName =
      currentUser?.fullName ||
      selectedOrder?.customer.fullName ||
      "Valued Customer";
    const custPhone =
      currentUser?.phone || selectedOrder?.customer.phone || "Provided in Chat";

    const categoryLabels = {
      damaged: "Broken / Crushed / Melted in Transit",
      wrong_item: "Wrong Soap or Variant Received",
      missing_sample: "Missing Free Sample / Wooden Soap Dish",
      skin_reaction: "Herbal Consultation / Skin Reaction Concern",
      delivery_delay: "Courier Delay / Marked Delivered False Status",
      other: "General Quality Complaint / Feedback",
    };

    const complaintRecord = {
      ticketId: newTicketId,
      orderNumber: selectedOrder?.orderNumber || manualOrderId || "OB-ORDER",
      createdAt: new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      customerName: custName,
      customerPhone: custPhone,
      category,
      affectedProduct: affectedProduct || "Handcrafted Soap",
      description: customerNote || "Package issue during courier transit",
      status: "submitted",
      messages: [],
    };

    saveComplaintTicket(complaintRecord);

    // Build structured WhatsApp message for Nikita Khatri
    const waText = encodeURIComponent(
      `🚨 *ORGANIC BLOOM COMPLAINT TICKET [${newTicketId}]*\n\n` +
        `Hello Nikita! I am reporting an issue with my delivered order:\n\n` +
        `• *Order Number:* ${complaintRecord.orderNumber}\n` +
        `• *Customer Name:* ${complaintRecord.customerName}\n` +
        `• *Contact Phone:* ${complaintRecord.customerPhone}\n` +
        `• *Issue Category:* ${categoryLabels[category]}\n` +
        `• *Affected Soap/Item:* ${complaintRecord.affectedProduct}\n` +
        `• *Customer Note:* ${complaintRecord.description}\n` +
        `• *Delivered Status:* ${selectedOrder?.status?.toUpperCase() || "DELIVERED"}\n\n` +
        `Please look into this and let me know the replacement or refund resolution. Thank you!`,
    );

    const fullUrl = `https://wa.me/${BRAND_INFO.whatsapp}?text=${waText}`;
    setGeneratedWaUrl(fullUrl);

    setIsBotThinking(true);
    setTimeout(() => {
      setIsBotThinking(false);
      setCurrentStep("summary_whatsapp");
    }, 450);
  };

  const getCategoryTitle = (cat) => {
    switch (cat) {
      case "damaged":
        return "📦 Soap Damaged / Melted in Transit";
      case "wrong_item":
        return "🔄 Wrong Product / Variant Received";
      case "missing_sample":
        return "🎁 Missing Free Sample or Soap Dish";
      case "skin_reaction":
        return "🌿 Skin Reaction or Herbal Consultation";
      case "delivery_delay":
        return "🚚 Courier Delivery Issue";
      default:
        return "💬 Other Issue or Feedback";
    }
  };

  const userPhoneNorm = currentUser?.phone
    ? normalizePhone(currentUser.phone)
    : "";
  const myComplaints = userPhoneNorm
    ? allComplaints.filter((t) => {
        const p = normalizePhone(t.customerPhone);
        return p && p === userPhoneNorm;
      })
    : [];
  const openComplaints = myComplaints.filter((t) => t.status !== "resolved");
  const resolvedComplaints = myComplaints.filter(
    (t) => t.status === "resolved",
  );

  return (
    <div
      id="complaint-bot-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div
        id="complaint-bot-card"
        className="bg-[#FAF7F2] w-full max-w-lg rounded-2xl shadow-2xl border border-[#E4DCCF] overflow-hidden relative my-auto p-4 sm:p-6 flex flex-col max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#4A443A] hover:text-[#2C2926] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Bot Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8DFD3]">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-[#263E2E] text-[#E3B873] flex items-center justify-center shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <span className="w-3 h-3 rounded-full bg-[#22C55E] ring-2 ring-white absolute -bottom-0.5 -right-0.5"></span>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C2C20]">
              Organic Bloom Care Assistant
            </h2>
            <p className="text-[11px] text-[#696053]">
              Customer Support • Fast Replacement &amp; Direct WhatsApp
              Resolution
            </p>
          </div>
        </div>

        {/* Mode Toggle: Report New Issue vs Live Support & Chats */}
        <div className="flex gap-1.5 bg-[#F5EFE6] p-1 rounded-xl mt-3 border border-[#E8DFD3]">
          <button
            type="button"
            onClick={() => setMode("track")}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              mode === "track"
                ? "bg-[#263E2E] text-white shadow-xs"
                : "text-[#5C5449] hover:text-[#1C2C20] hover:bg-[#EFE7DC]"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Live Support &amp; Chats</span>
            {openComplaints.length > 0 && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  mode === "track"
                    ? "bg-[#3D6347] text-white"
                    : "bg-[#263E2E] text-white"
                }`}
              >
                {openComplaints.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("new");
              setTrackedTicket(null);
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              mode === "new"
                ? "bg-[#263E2E] text-white shadow-xs"
                : "text-[#5C5449] hover:text-[#1C2C20] hover:bg-[#EFE7DC]"
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Report New Issue</span>
          </button>
        </div>

        {/* ================= TRACK / 1:1 LIVE SUPPORT MODE ================= */}
        {mode === "track" && (
          <div className="flex-1 overflow-y-auto py-2.5 space-y-3 pr-1 text-xs">
            {!trackedTicket ? (
              /* LIST OF TICKETS (OR SEARCH FORM) */
              <div className="space-y-3">
                {currentUser?.phone ? (
                  /* LOGGED-IN USER: AUTOMATIC TICKET FEED */
                  <div className="space-y-3">
                    <div className="bg-[#FAF4EB] border border-[#E8DFD3] rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                          <span className="font-bold text-xs text-[#1C2C20]">
                            Active Care for {currentUser.fullName}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7A7265] mt-0.5">
                          Linked Mobile: +91 {userPhoneNorm} • Real-time Host
                          Replies
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3EC] text-[#15803D] border border-[#BFDCC6]">
                        {openComplaints.length} Open{" "}
                        {openComplaints.length === 1 ? "Chat" : "Chats"}
                      </span>
                    </div>

                    {/* Open / In-Progress Tickets (Visible until host resolves them) */}
                    {openComplaints.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#786F63]">
                            Active Support Chats ({openComplaints.length})
                          </span>
                          <span className="text-[10px] text-[#15803D] font-medium">
                            Live updates enabled
                          </span>
                        </div>

                        {openComplaints.map((t) => {
                          const hasHostReply =
                            t.status === "replied" ||
                            t.messages.some((m) => m.sender === "host");
                          const lastMsg =
                            t.messages.length > 0
                              ? t.messages[t.messages.length - 1]
                              : null;

                          return (
                            <div
                              key={t.ticketId}
                              onClick={() => setTrackedTicket(t)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-xs group ${
                                hasHostReply
                                  ? "bg-[#F2FAF4] border-[#A7D8B3] hover:border-[#15803D]"
                                  : "bg-white border-[#E5DCCF] hover:border-[#263E2E]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-[#1C2C20] group-hover:text-[#263E2E]">
                                      Ticket #{t.ticketId}
                                    </span>
                                    <span className="text-[10px] text-[#8C8477] font-medium">
                                      Order #{t.orderNumber}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#4A433A] font-semibold mt-0.5">
                                    {t.affectedProduct}
                                  </p>
                                </div>
                                <div>
                                  {hasHostReply ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping"></span>
                                      🌿 Nikita Replied
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#EAF3EC] px-2 py-0.5 rounded-full border border-[#BFDCC6]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                                      Active Support
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Last message preview snippet */}
                              <div className="text-[11px] text-[#5C5449] bg-white/70 p-2 rounded-lg border border-[#EAE3D7] flex items-center justify-between gap-2 mt-1">
                                <p className="truncate">
                                  {lastMsg ? (
                                    <span>
                                      <strong>
                                        {lastMsg.sender === "host"
                                          ? "🌿 Nikita: "
                                          : "You: "}
                                      </strong>
                                      {lastMsg.text || "Photo attached"}
                                    </span>
                                  ) : (
                                    <span>
                                      <strong>You: </strong>
                                      {t.description}
                                    </span>
                                  )}
                                </p>
                                <span className="text-[10px] font-bold text-[#263E2E] group-hover:underline shrink-0 flex items-center gap-0.5">
                                  Open Chat <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-[#9A9184] mt-2">
                                <span>Opened: {t.createdAt}</span>
                                <span>
                                  {getCategoryTitle(t.category).split(" ")[1] ||
                                    "Support"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* No open tickets for logged-in user */
                      <div className="p-5 rounded-2xl bg-white border border-[#E5DCCF] text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-[#EAF3EC] text-[#15803D] flex items-center justify-center mx-auto text-lg">
                          🌿
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-[#1C2C20]">
                            No Active Support Tickets
                          </h3>
                          <p className="text-[11px] text-[#6E6659] max-w-xs mx-auto mt-1 leading-relaxed">
                            You don't have any open complaints or pending issues
                            for phone +91 {userPhoneNorm}.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMode("new");
                            setCurrentStep("select_order");
                          }}
                          className="px-4 py-2 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                          <span>Report Issue with an Order</span>
                        </button>
                      </div>
                    )}

                    {/* Past Resolved Tickets Archive */}
                    {resolvedComplaints.length > 0 && (
                      <div className="pt-2 border-t border-[#E8DFD3]">
                        <button
                          type="button"
                          onClick={() =>
                            setShowResolvedArchive((prev) => !prev)
                          }
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-[#F5EFE6] hover:bg-[#ECE3D4] text-[#5C5449] text-xs font-semibold cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                            <span>
                              Past Resolved Tickets ({resolvedComplaints.length}
                              )
                            </span>
                          </span>
                          {showResolvedArchive ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {showResolvedArchive && (
                          <div className="space-y-2 mt-2">
                            {resolvedComplaints.map((t) => (
                              <div
                                key={t.ticketId}
                                onClick={() => setTrackedTicket(t)}
                                className="p-2.5 rounded-lg bg-white border border-[#E5DCCF] hover:border-[#15803D] cursor-pointer text-xs space-y-1 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#1C2C20]">
                                    Ticket #{t.ticketId} • Order #
                                    {t.orderNumber}
                                  </span>
                                  <span className="text-[9px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                                    Resolved
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#7A7265] truncate">
                                  {t.affectedProduct} — {t.description}
                                </p>
                                <span className="text-[10px] text-[#263E2E] font-medium hover:underline block text-right">
                                  View history or reopen →
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Search Toggle for older orders or other numbers */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowManualSearch((prev) => !prev)}
                        className="text-[11px] text-[#786F63] hover:text-[#263E2E] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3 h-3" />
                        <span>
                          {showManualSearch
                            ? "Hide manual search"
                            : "Have a Ticket ID or Order # from another phone?"}
                        </span>
                      </button>

                      {showManualSearch && (
                        <form
                          onSubmit={handleTrackSearch}
                          className="space-y-2 mt-2 p-3 bg-white border border-[#E5DCCF] rounded-xl"
                        >
                          <p className="text-[11px] text-[#6E6659]">
                            Enter an Order ID (e.g. OB-84920) or Ticket ID (e.g.
                            OB-CMP-1234):
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={trackQuery}
                              onChange={(e) => setTrackQuery(e.target.value)}
                              placeholder="Ticket ID or Order ID"
                              className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#DDD3C2] rounded-lg text-xs font-mono text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                            />

                            <button
                              type="submit"
                              className="px-3.5 py-2 rounded-lg bg-[#263E2E] text-white text-xs font-semibold hover:bg-[#1A2E20] cursor-pointer"
                            >
                              Search
                            </button>
                          </div>
                          {trackError && (
                            <p className="text-[11px] text-[#C0392B] bg-[#FDEDEC] border border-[#F5C6CB] rounded-lg p-2">
                              {trackError}
                            </p>
                          )}
                        </form>
                      )}
                    </div>
                  </div>
                ) : (
                  /* GUEST / NOT LOGGED IN: PROMPT LOGIN OR SEARCH BY ID */
                  <div className="space-y-3">
                    {/* Login prompt card */}
                    <div className="p-3.5 rounded-xl bg-[#FAF4EB] border border-[#E8DFD3] flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#263E2E] text-[#E3B873] flex items-center justify-center shrink-0 text-sm font-bold">
                        🌿
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-bold text-xs text-[#1C2C20]">
                          Log In to See All Your Support Chats Automatically
                        </h4>
                        <p className="text-[11px] text-[#6E6659] leading-relaxed">
                          If you logged in with your mobile number, all your
                          active complaints and host replies are stored safely
                          in your personal support dashboard.
                        </p>
                        {onOpenAuth && (
                          <button
                            type="button"
                            onClick={onOpenAuth}
                            className="px-3 py-1.5 rounded-lg bg-[#263E2E] text-white text-[11px] font-bold hover:bg-[#1A2E20] cursor-pointer shadow-xs inline-flex items-center gap-1"
                          >
                            <span>Log In with Mobile Number</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Manual Search Form */}
                    <form
                      onSubmit={handleTrackSearch}
                      className="space-y-2.5 p-3.5 bg-white border border-[#E5DCCF] rounded-xl"
                    >
                      <p className="text-[#5A5246] leading-relaxed">
                        Or enter your <strong>Order ID</strong> or{" "}
                        <strong>Ticket ID</strong> (e.g. OB-CMP-1234) to see
                        your complaint status and live 1:1 chat:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={trackQuery}
                          onChange={(e) => setTrackQuery(e.target.value)}
                          placeholder="Order ID or Ticket ID (e.g. OB-CMP-1234)"
                          className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#DDD3C2] rounded-lg text-xs font-mono text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                        />

                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-[#263E2E] text-white text-xs font-semibold hover:bg-[#1A2E20] cursor-pointer"
                        >
                          Find Ticket
                        </button>
                      </div>
                      {trackError && (
                        <p className="text-[11px] text-[#C0392B] bg-[#FDEDEC] border border-[#F5C6CB] rounded-lg p-2.5">
                          {trackError}
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE 1-ON-1 CHAT WINDOW */
              <div className="space-y-2.5 flex flex-col h-full">
                {/* 1:1 Chat Top Bar */}
                <div className="p-3 rounded-xl bg-white border border-[#E5DCCF] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackedTicket(null);
                        setTrackQuery("");
                      }}
                      className="text-[11px] font-bold text-[#263E2E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>← All Support Chats</span>
                      {openComplaints.length > 0 && (
                        <span>({openComplaints.length} open)</span>
                      )}
                    </button>

                    <div>
                      {trackedTicket.status === "resolved" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#86EFAC]">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved
                        </span>
                      ) : trackedTicket.status === "replied" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#86EFAC]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping"></span>
                          🌿 Nikita Replied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#EAF3EC] px-2.5 py-0.5 rounded-full border border-[#BFDCC6]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                          Active Support Chat
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specialist & Ticket info strip */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#F0EAE0]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#263E2E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        🌿
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#1C2C20]">
                            Nikita Khatri
                          </span>
                          <span className="text-[9px] text-[#15803D] bg-[#EAF3EC] px-1.5 py-0.2 rounded font-medium">
                            Store Host &amp; Care
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7A7265]">
                          Order #{trackedTicket.orderNumber} •{" "}
                          {trackedTicket.affectedProduct}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C8477] bg-[#FAF7F2] px-2 py-1 rounded border border-[#E5DCCF]">
                      #{trackedTicket.ticketId}
                    </span>
                  </div>
                </div>

                {/* 1:1 Conversation Stream */}
                <div className="space-y-3 py-1 overflow-y-auto max-h-[38vh] pr-1">
                  {/* Customer's Initial Ticket Description as first message */}
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-[#263E2E] text-white p-3 rounded-2xl rounded-tr-xs shadow-xs space-y-1 max-w-[85%]">
                      <div className="flex items-center justify-between gap-3 text-[10px] text-[#BFD6C5]">
                        <span className="font-bold uppercase">You</span>
                        <span>{trackedTicket.createdAt}</span>
                      </div>
                      <div className="text-[10px] text-[#E3B873] font-medium">
                        Issue: {getCategoryTitle(trackedTicket.category)}
                      </div>
                      <p className="leading-relaxed text-xs">
                        {trackedTicket.description}
                      </p>
                    </div>
                  </div>

                  {/* Thread Messages */}
                  {trackedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2 ${m.sender === "host" ? "" : "justify-end"}`}
                    >
                      {m.sender === "host" && (
                        <div className="w-7 h-7 rounded-full bg-[#263E2E] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs">
                          🌿
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl shadow-xs space-y-1.5 max-w-[85%] ${
                          m.sender === "host"
                            ? "bg-white border border-[#DDD3C2] rounded-tl-xs text-[#2C2926]"
                            : "bg-[#263E2E] text-white rounded-tr-xs"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between gap-3 text-[10px] font-semibold ${
                            m.sender === "host"
                              ? "text-[#15803D]"
                              : "text-[#BFD6C5]"
                          }`}
                        >
                          <span className="uppercase">
                            {m.sender === "host"
                              ? "Nikita Khatri (Store Host)"
                              : "You"}
                          </span>
                          <span className="text-[9px] text-[#8C8477] font-normal">
                            {m.timestamp}
                          </span>
                        </div>
                        {m.text && (
                          <p className="leading-relaxed text-xs">{m.text}</p>
                        )}
                        {m.photo && (
                          <img
                            src={m.photo}
                            alt="Attached proof"
                            className="rounded-lg max-h-48 object-cover border border-[#DDD3C2]"
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty state: awaiting host reply */}
                  {trackedTicket.messages.length === 0 && (
                    <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DCCF] text-center space-y-1">
                      <p className="text-[11px] font-semibold text-[#1C2C20]">
                        🌿 Nikita has received Ticket #{trackedTicket.ticketId}
                      </p>
                      <p className="text-[10px] text-[#7A7265] leading-relaxed">
                        Nikita usually replies within 15–30 minutes during
                        business hours. You can type more details or attach
                        photos below.
                      </p>
                    </div>
                  )}

                  {/* Resolved Banner */}
                  {trackedTicket.status === "resolved" && (
                    <div className="p-2.5 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-center text-[11px] text-[#15803D] font-medium space-y-0.5">
                      <p className="font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        This ticket was marked as resolved by store team.
                      </p>
                      <p className="text-[10px] text-[#166534]">
                        Need further assistance? Simply write below to continue
                        the chat!
                      </p>
                    </div>
                  )}

                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* 1:1 Message Input Box */}
                <div className="pt-2 border-t border-[#E8DFD3] space-y-2 bg-[#FAF7F2]">
                  <div className="relative">
                    <textarea
                      value={followUpText}
                      onChange={(e) => setFollowUpText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendFollowUp();
                        }
                      }}
                      rows={2}
                      placeholder="Type your message to Nikita... (Press Enter to send)"
                      className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E] resize-none"
                    />
                  </div>

                  {followUpPhoto && (
                    <div className="relative w-fit">
                      <img
                        src={followUpPhoto}
                        alt="To attach"
                        className="h-16 rounded-lg border border-[#DDD3C2] object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => setFollowUpPhoto(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C0392B] text-white flex items-center justify-center text-[10px] cursor-pointer"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {followUpPhotoError && (
                    <p className="text-[10px] text-[#C0392B]">
                      {followUpPhotoError}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 rounded-xl bg-white hover:bg-[#F5EFE6] border border-[#DDD3C2] text-[#5C5449] text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-colors">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFollowUpPhotoChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={
                        (!followUpText.trim() && !followUpPhoto) ||
                        isSendingFollowUp
                      }
                      onClick={handleSendFollowUp}
                      className="flex-1 px-4 py-2 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {isSendingFollowUp ? "Sending..." : "Send Message"}
                      </span>
                    </button>
                  </div>

                  {/* Instant WhatsApp escalation fallback */}
                  <div className="pt-1 flex items-center justify-between text-[10px] text-[#786F63]">
                    <span>Need instant WhatsApp response?</span>
                    <a
                      href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                        `Hello Nikita! Following up on Ticket #${trackedTicket.ticketId} for Order #${trackedTicket.orderNumber}.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#263E2E] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 text-[#25D366]" />
                      <span>WhatsApp Nikita (+91 93132 68959) →</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= NEW COMPLAINT MODE (existing flow) ================= */}
        {mode === "new" && (
          <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 text-xs">
            {/* Bot Greeting Bubble */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-[#263E2E] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                🌿
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-xs border border-[#E4DCCF] shadow-xs text-[#2C2926] space-y-1 max-w-[85%]">
                <p className="font-semibold text-[#1C2C20]">Hello!</p>
                <p className="text-[#5A5246] leading-relaxed">
                  Our botanical soaps are carefully handcrafted. If your
                  delivered parcel has any transit damage, wrong item, or
                  quality concern, we will resolve it promptly with a free
                  replacement.
                </p>
              </div>
            </div>

            {/* STEP 1: SELECT ORDER */}
            {currentStep === "select_order" && (
              <div className="space-y-3 animate-fade-in pl-9">
                <div className="bg-[#FAF4EB] p-3 rounded-xl border border-[#E8DFD3] space-y-2">
                  <span className="font-bold text-[#1C2C20] block">
                    1. Which Order would you like to report?
                  </span>

                  {/* List of customer's recent orders */}
                  {allOrders.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#7A7265] uppercase font-semibold">
                        Your Recent Orders:
                      </span>
                      {allOrders.slice(0, 3).map((ord) => (
                        <button
                          key={ord.orderNumber}
                          type="button"
                          onClick={() => handleSelectOrderAndProceed(ord)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            selectedOrder?.orderNumber === ord.orderNumber
                              ? "bg-white border-[#263E2E] ring-1 ring-[#263E2E]"
                              : "bg-white/80 border-[#DDD3C2] hover:border-[#263E2E]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#1C2C20]">
                                {ord.orderNumber}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                  ord.status === "delivered"
                                    ? "bg-[#DCFCE7] text-[#166534]"
                                    : "bg-[#EDE5D8] text-[#5C5346]"
                                }`}
                              >
                                {(ord.status || "placed").toUpperCase()}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#7A7265] block mt-0.5">
                              {(ord.items || [])
                                .map(
                                  (i) =>
                                    `${i.quantity}x ${i.product?.name || "Soap"}`,
                                )
                                .join(", ")}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#263E2E]" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manual Order ID Entry */}
                  <form
                    onSubmit={handleManualOrderSubmit}
                    className="pt-2 border-t border-[#E8DFD3] flex gap-2"
                  >
                    <input
                      type="text"
                      value={manualOrderId}
                      onChange={(e) => setManualOrderId(e.target.value)}
                      placeholder="Enter Order ID (e.g. OB-849201)"
                      className="flex-1 px-3 py-1.5 bg-white border border-[#DDD3C2] rounded-lg text-xs font-mono text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />

                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-[#263E2E] text-white text-xs font-semibold hover:bg-[#1A2E20] cursor-pointer"
                    >
                      Select
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* STEP 2: SELECT CATEGORY OF PROBLEM */}
            {currentStep === "select_category" && (
              <div className="space-y-3 animate-fade-in pl-9">
                {/* Selected Order Pill */}
                <div className="inline-flex items-center gap-2 bg-[#E5EFE6] px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#166534]">
                  <Package className="w-3.5 h-3.5" />
                  <span>
                    Selected: #{selectedOrder?.orderNumber || manualOrderId}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("select_order")}
                    className="underline text-[10px] text-[#263E2E] cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <div className="bg-[#FAF4EB] p-3 rounded-xl border border-[#E8DFD3] space-y-2">
                  <span className="font-bold text-[#1C2C20] block">
                    2. What issue occurred with this order?
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectCategoryAndProceed("damaged")}
                      className="p-2.5 rounded-lg bg-white border border-[#DDD3C2] hover:border-[#263E2E] hover:bg-[#F9F6F0] text-left transition-colors cursor-pointer space-y-0.5"
                    >
                      <span className="font-bold text-[#1C2C20] block">
                        📦 Soap Damaged / Broken
                      </span>
                      <span className="text-[10px] text-[#7A7265] block">
                        Crushed in courier transit or melted
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectCategoryAndProceed("wrong_item")
                      }
                      className="p-2.5 rounded-lg bg-white border border-[#DDD3C2] hover:border-[#263E2E] hover:bg-[#F9F6F0] text-left transition-colors cursor-pointer space-y-0.5"
                    >
                      <span className="font-bold text-[#1C2C20] block">
                        🔄 Wrong Item Received
                      </span>
                      <span className="text-[10px] text-[#7A7265] block">
                        Received different soap or bundle
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectCategoryAndProceed("missing_sample")
                      }
                      className="p-2.5 rounded-lg bg-white border border-[#DDD3C2] hover:border-[#263E2E] hover:bg-[#F9F6F0] text-left transition-colors cursor-pointer space-y-0.5"
                    >
                      <span className="font-bold text-[#1C2C20] block">
                        🎁 Missing Freebie / Sample
                      </span>
                      <span className="text-[10px] text-[#7A7265] block">
                        Free sample or wooden dish missing
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectCategoryAndProceed("skin_reaction")
                      }
                      className="p-2.5 rounded-lg bg-white border border-[#DDD3C2] hover:border-[#263E2E] hover:bg-[#F9F6F0] text-left transition-colors cursor-pointer space-y-0.5"
                    >
                      <span className="font-bold text-[#1C2C20] block">
                        🌿 Skin Consultation / Reaction
                      </span>
                      <span className="text-[10px] text-[#7A7265] block">
                        Active botanical query or dryness
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectCategoryAndProceed("delivery_delay")
                      }
                      className="p-2.5 rounded-lg bg-white border border-[#DDD3C2] hover:border-[#263E2E] hover:bg-[#F9F6F0] text-left transition-colors cursor-pointer space-y-0.5"
                    >
                      <span className="font-bold text-[#1C2C20] block">
                        🚚 False Delivered / Delay
                      </span>
                      <span className="text-[10px] text-[#7A7265] block">
                        Courier issue or parcel delay
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCategoryAndProceed("other")}
                      className="p-2.5 rounded-lg bg-white border border-[#DDD3C2] hover:border-[#263E2E] hover:bg-[#F9F6F0] text-left transition-colors cursor-pointer space-y-0.5"
                    >
                      <span className="font-bold text-[#1C2C20] block">
                        💬 Other Feedback / Query
                      </span>
                      <span className="text-[10px] text-[#7A7265] block">
                        General question for Nikita
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PRODUCT & DETAILS */}
            {currentStep === "select_product_details" && (
              <div className="space-y-3 animate-fade-in pl-9">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#E5EFE6] px-2 py-0.5 rounded text-[10px] font-semibold text-[#166534]">
                    #{selectedOrder?.orderNumber}
                  </span>
                  <span className="bg-[#EDE5D8] px-2 py-0.5 rounded text-[10px] font-semibold text-[#3B352D]">
                    {getCategoryTitle(category)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("select_category")}
                    className="underline text-[10px] text-[#263E2E] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="bg-[#FAF4EB] p-3.5 rounded-xl border border-[#E8DFD3] space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1C2C20] mb-1">
                      3. Which product or item is affected?
                    </label>
                    {selectedOrder && selectedOrder.items.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedOrder.items.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setAffectedProduct(item.product.name)
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer ${
                              affectedProduct === item.product.name
                                ? "bg-[#263E2E] text-white border-[#263E2E]"
                                : "bg-white text-[#2C2926] border-[#D8CEBE] hover:bg-[#F5EFE6]"
                            }`}
                          >
                            {item.quantity}x {item.product.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setAffectedProduct("Entire Package / All Items")
                          }
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer ${
                            affectedProduct === "Entire Package / All Items"
                              ? "bg-[#263E2E] text-white border-[#263E2E]"
                              : "bg-white text-[#2C2926] border-[#D8CEBE] hover:bg-[#F5EFE6]"
                          }`}
                        >
                          Entire Parcel
                        </button>
                      </div>
                    ) : null}

                    <input
                      type="text"
                      value={affectedProduct}
                      onChange={(e) => setAffectedProduct(e.target.value)}
                      placeholder="e.g. Bridal Ubtan Glow Soap, Charcoal Bar"
                      className="w-full px-3 py-1.5 bg-white border border-[#DDD3C2] rounded-lg text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C2C20] mb-1">
                      Brief Description of the Issue:
                    </label>
                    <textarea
                      rows={2}
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="e.g. Parcel box crushed during courier transit, need replacement bar..."
                      className="w-full px-3 py-1.5 bg-white border border-[#DDD3C2] rounded-lg text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    />

                    {/* Quick helper chips */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        "Outer box was crushed",
                        "Soap bar arrived cracked",
                        "Need replacement soap",
                        "Different fragrance delivered",
                      ].map((chip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setCustomerNote((prev) =>
                              prev ? `${prev} • ${chip}` : chip,
                            )
                          }
                          className="text-[10px] bg-white border border-[#DDD3C2] hover:bg-[#F2ECE2] px-2 py-0.5 rounded text-[#4A433A] cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateComplaintTicket}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <span>Generate Ticket &amp; Connect to WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUMMARY & WHATSAPP DOCKET */}
            {currentStep === "summary_whatsapp" && (
              <div className="space-y-3 animate-fade-in pl-9">
                <div className="p-3.5 bg-white rounded-xl border border-[#263E2E] shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-ping"></span>
                      <span className="font-bold text-xs text-[#1C2C20]">
                        Complaint Ticket Created: #{ticketId}
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] font-bold px-2 py-0.5 rounded">
                      Logged with Store Team
                    </span>
                  </div>

                  {/* Docket Summary */}
                  <div className="space-y-1 text-[11px] text-[#38332B] bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8DFD3]">
                    <p>
                      <strong>Order ID:</strong> #
                      {selectedOrder?.orderNumber || manualOrderId}
                    </p>
                    <p>
                      <strong>Issue:</strong> {getCategoryTitle(category)}
                    </p>
                    <p>
                      <strong>Affected Soap:</strong>{" "}
                      {affectedProduct || "Handcrafted Soap"}
                    </p>
                    {customerNote && (
                      <p>
                        <strong>Details:</strong> {customerNote}
                      </p>
                    )}
                    <p>
                      <strong>Atelier Guarantee:</strong> 100% Doorstep
                      Replacement or Free Refund
                    </p>
                  </div>

                  <p className="text-[11px] text-[#4A433A] leading-relaxed">
                    Your ticket is saved in our system. Nikita Khatri has
                    received it and can reply directly in your 1-on-1 support
                    chat right here. You can also send it over WhatsApp:
                  </p>

                  {/* Primary Action 1: Open 1-on-1 Live Chat */}
                  <button
                    type="button"
                    onClick={() => {
                      const fresh =
                        findComplaintTicket(ticketId) ||
                        allComplaints.find((t) => t.ticketId === ticketId);
                      if (fresh) {
                        setTrackedTicket(fresh);
                      }
                      setMode("track");
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open 1-on-1 Live Chat with Nikita</span>
                  </button>

                  {/* Primary Action 2: WhatsApp */}
                  <a
                    href={generatedWaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>
                      Send Ticket to Nikita on WhatsApp (+91 93132 68959)
                    </span>
                  </a>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-[#7A7265]">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("select_order")}
                      className="hover:underline text-[#263E2E] cursor-pointer"
                    >
                      ← Start Another Query
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="hover:underline text-[#4A433A] cursor-pointer"
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isBotThinking && (
              <div className="flex items-center gap-2 pl-9 text-xs text-[#7A7265]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#263E2E]" />
                <span>Care Assistant is preparing response...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
