import { pushOrderToCloud, subscribeToOrdersCloud } from "./cloudSync";

const STORAGE_KEY = "organic_bloom_orders";

// Helper to create date strings
const getFormattedDate = (offsetHours = 0) => {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const generateTrackingMilestones = (
  status,
  city = "Mumbai",
  orderDate,
  courierName,
  trackingId,
) => {
  const isCompletedOrPassed = (targetStatus) => {
    const order = [
      "placed",
      "confirmed",
      "crafting",
      "shipped",
      "in_transit",
      "out_for_delivery",
      "delivered",
    ];
    return order.indexOf(status) >= order.indexOf(targetStatus);
  };

  const hasDispatched = isCompletedOrPassed("shipped") && Boolean(trackingId);

  return [
    {
      status: "placed",
      label: "Order Placed & Logged",
      description:
        "Order received. Payment details & UTR submitted for host verification.",
      timestamp: orderDate || getFormattedDate(-24),
      location: "Organic Bloom Studio",
      completed: true,
      current: status === "placed",
    },
    {
      status: "confirmed",
      label: "Payment Verified & Order Confirmed",
      description:
        "Host verified transaction via PhonePe / Bank. Order scheduled for batch creation.",
      timestamp: getFormattedDate(-20),
      location: "Studio Operations",
      completed: isCompletedOrPassed("confirmed"),
      current: status === "confirmed",
    },
    {
      status: "crafting",
      label: "Handcrafting & Soap Curing (2-3 Days)",
      description:
        "Pure melt & pour herbal soaps hand-poured, cured, and hermetically sealed with moisture-resistant protective film.",
      timestamp: getFormattedDate(-16),
      location: "Soap Crafting Studio",
      completed: isCompletedOrPassed("crafting"),
      current: status === "crafting",
    },
    {
      status: "shipped",
      label: hasDispatched
        ? `Dispatched via ${courierName || "Courier"}`
        : "Courier Dispatch & AWB Generation",
      description: hasDispatched
        ? `Handed over to courier. AWB Tracking Docket: ${trackingId}`
        : "Curing in progress. Courier tracking number will be assigned by the artisan upon dispatch.",
      timestamp: hasDispatched
        ? getFormattedDate(-10)
        : "Pending Curing Completion",
      location: hasDispatched
        ? `${courierName || "Courier"} Air Cargo Hub`
        : "Packaging Facility",
      completed: isCompletedOrPassed("shipped"),
      current: status === "shipped",
    },
    {
      status: "in_transit",
      label: "In Transit to Destination City",
      description: `Shipment in transit moving towards destination hub in ${city}.`,
      timestamp: getFormattedDate(-4),
      location: `Regional Sorting Hub → ${city}`,
      completed: isCompletedOrPassed("in_transit"),
      current: status === "in_transit",
    },
    {
      status: "out_for_delivery",
      label: "Out for Doorstep Delivery",
      description:
        "Assigned to local delivery associate. Doorstep arrival scheduled today.",
      timestamp: getFormattedDate(0),
      location: `Local Delivery Center, ${city}`,
      completed: isCompletedOrPassed("out_for_delivery"),
      current: status === "out_for_delivery",
    },
    {
      status: "delivered",
      label: "Delivered to Doorstep",
      description: "Handcrafted botanical package successfully delivered.",
      timestamp: getFormattedDate(24),
      location: `${city} Delivery Address`,
      completed: status === "delivered",
      current: status === "delivered",
    },
  ];
};

// Seed realistic demo orders if user has no orders yet
export const getSampleDemoOrders = () => {
  return [
    {
      orderNumber: "OB-512940",
      date: getFormattedDate(-2),
      customer: {
        fullName: "Rohit Verma",
        phone: "+91 98192 83741",
        email: "rohit.verma@example.com",
        address: "Flat 604, Orchid Heights, Sector 18",
        city: "Noida",
        state: "Uttar Pradesh",
        pincode: "201301",
        deliveryNotes: "Leave with security guard if not available.",
      },
      items: [
        {
          product: {
            id: "charcoal-soap",
            name: "Charcoal Soap",
            subtitle: "Nature's Pure Touch for Radiant You",
            category: "bar",
            price: 99,
            weightOz: 3.5,
            rating: 5.0,
            reviewCount: 12,
            image: "/images/charcoal-soap.svg",
            secondaryImage: "/images/charcoal-soap-crop.svg",
            scentFamily: "Detox & Clarifying",
            skinType: ["Oily", "Combination"],
            topNotes: ["Activated Charcoal"],
            heartNotes: ["Tea Tree"],
            baseNotes: ["Cedarwood"],
            exfoliationLevel: "None (Silky)",
            latherProfile: "Dense Froth",
            keyBotanicals: ["Bamboo Charcoal"],
            fullIngredients: ["Melt & Pour Base"],
            description: "Detoxifying soap.",
            benefits: ["Oil Control"],
            cureTimeWeeks: 1,
            inStock: true,
          },
          quantity: 2,
        },
      ],
      subtotal: 198,
      shipping: 40,
      total: 238,
      paymentMethod: "phonepe",
      paymentStatus: "pending_host_verification",
      transactionId: "429183749201",
      utrNumber: "429183749201",
      status: "placed",
      courierName: "",
      trackingId: "",
      trackingUrl: "",
      estimatedDelivery: "Dispatched once cured & payment verified",
      milestones: generateTrackingMilestones(
        "placed",
        "Noida",
        getFormattedDate(-2),
      ),
    },
    {
      orderNumber: "OB-849201",
      date: getFormattedDate(-18),
      customer: {
        fullName: "Aarav Sharma",
        phone: "+91 98765 43210",
        email: "aarav.sharma@example.com",
        address: "402, Lotus Heights, Link Road, Andheri West",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400053",
        deliveryNotes: "Please ring the bell twice.",
      },
      items: [
        {
          product: {
            id: "rice-soap",
            name: "Rice Soap",
            subtitle: "Naturally Better, Beautifully You",
            category: "bar",
            price: 149,
            weightOz: 3.5,
            rating: 5.0,
            reviewCount: 14,
            image: "/images/rice-soap.svg",
            secondaryImage: "/images/rice-soap-crop.svg",
            scentFamily: "Warm & Honey",
            skinType: ["All Skin Types"],
            topNotes: ["Brown Rice Water"],
            heartNotes: ["Sweet Milk"],
            baseNotes: ["Raw Honey"],
            exfoliationLevel: "Ultra Gentle",
            latherProfile: "Ultra Creamy",
            keyBotanicals: ["Rice Extract"],
            fullIngredients: ["Pure Coconut & Glycerin Melt & Pour Base"],
            description: "Gentle radiance soap.",
            benefits: ["Brightening"],
            cureTimeWeeks: 1,
            inStock: true,
          },
          quantity: 2,
        },
        {
          product: {
            id: "charcoal-soap",
            name: "Charcoal Soap",
            subtitle: "Nature's Pure Touch for Radiant You",
            category: "bar",
            price: 99,
            weightOz: 3.5,
            rating: 5.0,
            reviewCount: 12,
            image: "/images/charcoal-soap.svg",
            secondaryImage: "/images/charcoal-soap-crop.svg",
            scentFamily: "Detox & Clarifying",
            skinType: ["Oily", "Combination"],
            topNotes: ["Activated Charcoal"],
            heartNotes: ["Tea Tree"],
            baseNotes: ["Cedarwood"],
            exfoliationLevel: "None (Silky)",
            latherProfile: "Dense Froth",
            keyBotanicals: ["Bamboo Charcoal"],
            fullIngredients: ["Melt & Pour Base"],
            description: "Detoxifying soap.",
            benefits: ["Oil Control"],
            cureTimeWeeks: 1,
            inStock: true,
          },
          quantity: 1,
        },
      ],
      subtotal: 397,
      shipping: 40,
      total: 437,
      paymentMethod: "phonepe",
      paymentStatus: "verified",
      paymentVerifiedByHost: true,
      transactionId: "381928475619",
      utrNumber: "381928475619",
      status: "crafting",
      curingCompleted: true,
      curingCompletedAt: getFormattedDate(-16),
      courierName: "",
      trackingId: "",
      trackingUrl: "",
      estimatedDelivery: "Ready for courier dispatch in 1-2 days",
      milestones: generateTrackingMilestones(
        "crafting",
        "Mumbai",
        getFormattedDate(-18),
      ),
    },
    {
      orderNumber: "OB-923145",
      date: getFormattedDate(-28),
      customer: {
        fullName: "Pooja Patel",
        phone: "+91 98251 44320",
        email: "pooja.patel@example.com",
        address: "B-12, Shivalik Greens, SG Highway",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380054",
      },
      items: [
        {
          product: {
            id: "bridal-ubtan-soap",
            name: "Bridal Ubtan Glow Soap",
            subtitle: "18 Ayurvedic Herbs • Haldi & Chandan",
            category: "bar",
            price: 199,
            weightOz: 4.2,
            rating: 5.0,
            reviewCount: 28,
            image: "/images/ubtan-soap.svg",
            secondaryImage: "/images/ubtan-soap-crop.svg",
            scentFamily: "Warm & Honey",
            skinType: ["All Skin Types"],
            topNotes: ["Kasturi Manjal"],
            heartNotes: ["Sandalwood"],
            baseNotes: ["Kesar"],
            exfoliationLevel: "Medium Botanical Scrub",
            latherProfile: "Velvety Bubbles",
            keyBotanicals: ["Turmeric", "Saffron"],
            fullIngredients: ["Ayurvedic Herbal Blend"],
            description: "Bridal glow soap.",
            benefits: ["Glow"],
            cureTimeWeeks: 1,
            inStock: true,
          },
          quantity: 2,
        },
      ],
      subtotal: 398,
      shipping: 0,
      total: 398,
      paymentMethod: "phonepe",
      paymentStatus: "verified",
      paymentVerifiedByHost: true,
      transactionId: "PP92314598251443",
      utrNumber: "PP92314598251443",
      status: "delivered",
      courierName: "Blue Dart Air",
      trackingId: "BD92314500IN",
      trackingUrl: "https://www.bluedart.com/tracking",
      estimatedDelivery: "Delivered (Signed by Pooja)",
      milestones: generateTrackingMilestones(
        "delivered",
        "Ahmedabad",
        getFormattedDate(-28),
      ),
    },
  ];
};

// Normalizes a raw order object (from localStorage OR Firestore) into a safe
// OrderRecord so missing properties from older app versions never throw.
const sanitizeOrder = (ord) => ({
  orderNumber:
    ord.orderNumber || `OB-${Math.floor(100000 + Math.random() * 900000)}`,
  date: ord.date || "Recent",
  customer: {
    fullName: ord.customer?.fullName || "Valued Customer",
    phone: ord.customer?.phone || "",
    email: ord.customer?.email || "",
    address: ord.customer?.address || "",
    city: ord.customer?.city || "",
    state: ord.customer?.state || "",
    pincode: ord.customer?.pincode || "",
    deliveryNotes: ord.customer?.deliveryNotes || "",
  },
  items: Array.isArray(ord.items) ? ord.items : [],
  subtotal: typeof ord.subtotal === "number" ? ord.subtotal : 0,
  shipping: typeof ord.shipping === "number" ? ord.shipping : 0,
  total:
    typeof ord.total === "number"
      ? ord.total
      : (ord.subtotal || 0) + (ord.shipping || 0),
  paymentMethod: ord.paymentMethod || "phonepe",
  paymentStatus: ord.paymentStatus || "pending_host_verification",
  paymentVerifiedByHost: Boolean(ord.paymentVerifiedByHost),
  paymentVerifiedAt: ord.paymentVerifiedAt,
  paymentRejectedAt: ord.paymentRejectedAt,
  rejectionReason: ord.rejectionReason,
  transactionId: ord.transactionId || ord.utrNumber || "",
  utrNumber: ord.utrNumber || ord.transactionId || "",
  status: ord.status || "placed",
  courierName: ord.courierName || "",
  trackingId: ord.trackingId || "",
  trackingUrl: ord.trackingUrl || "",
  dispatchDate: ord.dispatchDate,
  estimatedDelivery: ord.estimatedDelivery || "Curing in progress (2-3 days)",
  curingStartedAt: ord.curingStartedAt,
  curingStartedAtMs: ord.curingStartedAtMs,
  curingCompleted:
    ord.curingCompleted === true
      ? true
      : ord.curingCompleted === false
        ? false
        : undefined,
  curingCompletedAt: ord.curingCompletedAt || undefined,
  curingCompletedAtMs:
    typeof ord.curingCompletedAtMs === "number"
      ? ord.curingCompletedAtMs
      : undefined,
  milestones: Array.isArray(ord.milestones) ? ord.milestones : [],
});

export const CURING_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export const isReadyForCourier = (o) => {
  if (o.status !== "crafting") return false;
  if (o.curingCompleted === true) return true;
  if (o.curingCompleted === false) return false;
  if (!o.curingStartedAtMs) return true;
  return Date.now() - o.curingStartedAtMs >= CURING_DURATION_MS;
};

export const getSavedOrders = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const samples = getSampleDemoOrders();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
      return samples;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeOrder);
  } catch (e) {
    console.error("Failed to load orders from localStorage:", e);
    return getSampleDemoOrders();
  }
};

// Live order feed for the Host Portal: subscribes to Firestore (so orders and
// payment/UTR submissions placed by customers on their OWN devices show up
// immediately here too) and keeps localStorage as an offline cache. Falls
// back to localStorage-only + same-tab 'orders_updated' events if Firestore
// isn't configured. Returns an unsubscribe function — call it on unmount.
export const subscribeToOrders = (onChange) => {
  const cloudUnsub = subscribeToOrdersCloud((cloudOrders) => {
    if (cloudOrders.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudOrders));
      } catch (e) {
        console.error("Failed to cache cloud orders locally:", e);
      }
      onChange(cloudOrders.map(sanitizeOrder));
    } else {
      // No cloud docs yet (fresh Firestore, or none pushed yet) — show local cache.
      onChange(getSavedOrders());
    }
  });

  // Same-tab fallback so local mutations (or a non-cloud setup) still refresh the UI.
  const localHandler = () => onChange(getSavedOrders());
  window.addEventListener("orders_updated", localHandler);
  // Fire once immediately so the UI has data before the first snapshot arrives.
  onChange(getSavedOrders());

  return () => {
    cloudUnsub();
    window.removeEventListener("orders_updated", localHandler);
  };
};

export const saveOrderRecord = (order) => {
  try {
    const existing = getSavedOrders();
    // Remove if already exists with same orderNumber
    const filtered = existing.filter(
      (o) => o.orderNumber !== order.orderNumber,
    );
    filtered.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(
      new CustomEvent("orders_updated", { detail: filtered }),
    );
    pushOrderToCloud(order);
  } catch (e) {
    console.error("Failed to save order to localStorage:", e);
  }
};

export const verifyOrderPayment = (orderNumber) => {
  const orders = getSavedOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const order = orders[idx];
  order.paymentStatus = "verified";
  order.paymentVerifiedByHost = true;
  order.paymentVerifiedAt = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (order.status === "placed") {
    order.status = "confirmed";
  }
  order.milestones = generateTrackingMilestones(
    order.status,
    order.customer.city,
    order.date,
    order.courierName,
    order.trackingId,
  );

  orders[idx] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
  pushOrderToCloud(order);
  return order;
};

// Host action alias
export const verifyPaymentByHost = verifyOrderPayment;

export const rejectPaymentByHost = (orderNumber, reason) => {
  const orders = getSavedOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const order = { ...orders[idx] };
  const cleanReason =
    reason?.trim() || "UTR / Payment reference not found in PhonePe statement";
  const timestamp = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  order.paymentStatus = "rejected";
  order.paymentVerifiedByHost = false;
  order.paymentRejectedAt = timestamp;
  order.rejectionReason = cleanReason;

  // Add alert milestone
  order.milestones = [
    {
      status: order.status,
      label: "Payment / UTR Verification Rejected",
      description: `Host Nikita Khatri could not verify UTR (${order.utrNumber || order.transactionId || "None"}). Reason: ${cleanReason}`,
      timestamp,
      location: "Ahmedabad Atelier",
      completed: true,
      current: true,
    },
    ...order.milestones.map((m) => ({ ...m, current: false })),
  ];

  orders[idx] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
  window.dispatchEvent(
    new CustomEvent("order_payment_rejected", { detail: order }),
  );
  pushOrderToCloud(order);
  return order;
};

export const resubmitPaymentUtr = (orderNumber, newUtr) => {
  const orders = getSavedOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const order = { ...orders[idx] };
  const cleanUtr = newUtr.trim();
  const timestamp = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  order.utrNumber = cleanUtr;
  order.transactionId = cleanUtr;
  order.paymentStatus = "pending_host_verification";
  order.paymentRejectedAt = undefined;
  order.rejectionReason = undefined;

  order.milestones = [
    {
      status: order.status,
      label: "New UTR Submitted by Customer",
      description: `New reference UTR ${cleanUtr} submitted. Under review by Store Host.`,
      timestamp,
      location: "Customer Portal",
      completed: true,
      current: true,
    },
    ...order.milestones.map((m) => ({ ...m, current: false })),
  ];

  orders[idx] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
  pushOrderToCloud(order);
  return order;
};

export const advanceOrderToCuring = (orderNumber) => {
  const orders = getSavedOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const order = orders[idx];
  order.status = "crafting";
  order.curingCompleted = false;
  order.curingCompletedAt = undefined;
  order.curingCompletedAtMs = undefined;
  order.curingStartedAtMs = Date.now();
  order.curingStartedAt = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  order.milestones = generateTrackingMilestones(
    "crafting",
    order.customer.city,
    order.date,
    order.courierName,
    order.trackingId,
  );

  orders[idx] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
  pushOrderToCloud(order);
  return order;
};

export const markSoapCraftingDone = (orderNumber) => {
  const orders = getSavedOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const order = orders[idx];
  order.curingCompleted = true;
  order.curingCompletedAtMs = Date.now();
  order.curingCompletedAt = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const timestamp = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  order.milestones = [
    {
      status: "crafting",
      label: "Soap Crafting & Curing Completed",
      description:
        "Handcrafted botanical soaps cured & quality inspected. Packed and ready for courier pickup.",
      timestamp,
      location: "Organic Bloom Atelier",
      completed: true,
      current: true,
    },
    ...order.milestones.map((m) => ({ ...m, current: false })),
  ];

  orders[idx] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
  pushOrderToCloud(order);
  return order;
};

export const revertSoapCraftingToCuring = (orderNumber) => {
  const orders = getSavedOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const order = orders[idx];
  order.curingCompleted = false;
  order.curingCompletedAt = undefined;
  order.curingCompletedAtMs = undefined;
  if (!order.curingStartedAtMs) {
    order.curingStartedAtMs = Date.now();
  }

  orders[idx] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
  pushOrderToCloud(order);
  return order;
};

export const assignCourierTracking = (
  orderNumber,
  courierName,
  trackingId,
  customTrackingUrl,
) => {
  const orders = getSavedOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const order = orders[idx];
  const cleanTracking = trackingId.trim();
  order.courierName = courierName.trim();
  order.trackingId = cleanTracking;

  // Derive tracking URL based on carrier
  let url = customTrackingUrl?.trim();
  if (!url) {
    const lowerCarrier = courierName.toLowerCase();
    if (lowerCarrier.includes("delhivery")) {
      url = `https://www.delhivery.com/track/package/${cleanTracking}`;
    } else if (
      lowerCarrier.includes("blue dart") ||
      lowerCarrier.includes("bluedart")
    ) {
      url = `https://www.bluedart.com/tracking`;
    } else if (
      lowerCarrier.includes("india post") ||
      lowerCarrier.includes("speed post")
    ) {
      url = `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    } else if (lowerCarrier.includes("dtdc")) {
      url = `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strAwbNo=${cleanTracking}`;
    } else if (lowerCarrier.includes("xpressbees")) {
      url = `https://www.xpressbees.com/shipment/tracking?awb=${cleanTracking}`;
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(`${courierName} tracking ${cleanTracking}`)}`;
    }
  }
  order.trackingUrl = url;
  order.status = "shipped";
  order.dispatchDate = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  order.estimatedDelivery = "Expected in 2-4 business days";
  order.milestones = generateTrackingMilestones(
    "shipped",
    order.customer.city,
    order.date,
    order.courierName,
    order.trackingId,
  );

  orders[idx] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
  pushOrderToCloud(order);
  return order;
};

export const updateOrderStatus = (orderNumber, status) => {
  const orders = getSavedOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const order = orders[idx];
  order.status = status;
  order.milestones = generateTrackingMilestones(
    status,
    order.customer.city,
    order.date,
    order.courierName,
    order.trackingId,
  );

  orders[idx] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("orders_updated", { detail: orders }));
  pushOrderToCloud(order);
  return order;
};

export const findOrder = (query) => {
  if (!query || typeof query !== "string") return undefined;
  const cleanQuery = query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!cleanQuery) return undefined;

  const orders = getSavedOrders();
  return orders.find((o) => {
    const cleanNum = (o.orderNumber || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const cleanPhone = (o.customer?.phone || "").replace(/[^0-9]/g, "");
    const cleanTrack = (o.trackingId || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return (
      cleanNum.includes(cleanQuery) ||
      cleanPhone.includes(cleanQuery) ||
      cleanTrack.includes(cleanQuery)
    );
  });
};
