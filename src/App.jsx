/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  getProducts,
  subscribeToProducts,
  subscribeToAnnouncement,
} from "./utils/contentStorage";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { BrandPillars } from "./components/BrandPillars";
import { ProductCatalog } from "./components/ProductCatalog";
import { ProductQuickView } from "./components/ProductQuickView";
import { ScentQuiz } from "./components/ScentQuiz";
import { ColdProcessRitual } from "./components/ColdProcessRitual";
import { SoapCareGuide } from "./components/SoapCareGuide";
import { ReviewsSection } from "./components/ReviewsSection";
import { FaqSection } from "./components/FaqSection";
import { Newsletter } from "./components/Newsletter";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { OrderTrackingModal } from "./components/OrderTrackingModal";
import { AuthModal } from "./components/AuthModal";
import { ComplaintBotModal } from "./components/ComplaintBotModal";
import { HostDashboardModal } from "./components/HostDashboardModal";
import { Check } from "lucide-react";

export default function App() {
  // Product catalog + announcement — live from Firestore (real-time across
  // every device) with localStorage as an offline cache/fallback. See
  // src/utils/contentStorage.ts and src/utils/cloudSync.ts.
  const [products, setProducts] = useState(() => getProducts());
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubAnnouncement = subscribeToAnnouncement(setAnnouncement);
    return () => {
      unsubProducts();
      unsubAnnouncement();
    };
  }, []);

  // Cart state initialized with 1 popular sample bar so the user immediately experiences the interactive cart
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("organic_bloom_cart");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    // Default starter item
    return [
      {
        product: getProducts()[0],
        quantity: 1,
      },
    ];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintOrderNumber, setComplaintOrderNumber] = useState(undefined);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState(undefined);
  const [trackingInitialTab, setTrackingInitialTab] = useState("tracking");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const [checkoutData, setCheckoutData] = useState({
    discount: 0,
    code: "",
    sample: "Rice Soap Mini Sample",
  });

  // Host/Seller portal is a completely separate hidden route.
  // Customers browsing the normal site never see any link/button to it.
  // Only someone who knows the direct URL can reach it: yourdomain.com/rev53st-host-portal
  const isHostPortalRoute =
    typeof window !== "undefined" &&
    window.location.pathname.replace(/\/+$/, "") === "/rev53st-host-portal";

  // Persist cart
  useEffect(() => {
    localStorage.setItem("organic_bloom_cart", JSON.stringify(cart));
  }, [cart]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleAddToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prevCart, { product, quantity }];
    });
    showToast(`Added ${product.name} to your bag`);
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleOpenCheckout = (promoDiscount, promoCode, selectedSample) => {
    setCheckoutData({
      discount: promoDiscount,
      code: promoCode,
      sample: selectedSample,
    });
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = () => {
    setCart([]);
    localStorage.removeItem("organic_bloom_cart");
  };

  const handleOpenTracking = (orderNum, initialTab = "tracking") => {
    setTrackingOrderNumber(orderNum);
    setTrackingInitialTab(initialTab);
    setIsTrackingOpen(true);
  };

  const handlePlaceNewOrder = () => {
    setIsTrackingOpen(false);
    setIsCheckoutOpen(false);
    const el = document.getElementById("collection");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReorder = (items) => {
    setCart((prev) => {
      let updated = [...prev];
      items.forEach((item) => {
        const existing = updated.find((i) => i.product.id === item.product.id);
        if (existing) {
          updated = updated.map((i) =>
            i.product.id === item.product.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          );
        } else {
          updated.push({ product: item.product, quantity: item.quantity });
        }
      });
      return updated;
    });
    setIsTrackingOpen(false);
    setIsCartOpen(true);
    showToast("Items added back to your bag!");
  };

  const handleExploreClick = () => {
    const el = document.getElementById("collection");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCraftClick = () => {
    const el = document.getElementById("craft-ritual");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  // === HOST / SELLER PORTAL (completely separate from the customer site) ===
  // When visiting /rev53st-host-portal directly, render ONLY the host dashboard.
  // The customer storefront (Navbar, Hero, products, cart, etc.) never mounts here,
  // and there is no button/link anywhere on the customer site pointing to this route.
  if (isHostPortalRoute) {
    return (
      <div className="min-h-screen bg-[#0F1B12]">
        <HostDashboardModal
          isOpen={true}
          onClose={() => {
            window.location.href = "/";
          }}
          onSwitchToCustomer={() => {
            window.location.href = "/";
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C2926]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#263E2E] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up border border-[#42644A]">
          <div className="w-5 h-5 rounded-full bg-[#3C5D45] flex items-center justify-center text-[#E3B873]">
            <Check className="w-3 h-3" />
          </div>
          <span>{toastMessage}</span>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-2 underline text-[#E3B873] hover:text-white cursor-pointer"
          >
            View Bag
          </button>
        </div>
      )}

      {/* Host Announcement Banner */}
      {announcement && announcement.active && announcement.text && (
        <div className="bg-[#263E2E] text-[#FAF7F2] text-center text-xs sm:text-sm font-semibold px-4 py-2.5 border-b border-[#3E5C46]">
          {announcement.text}
        </div>
      )}

      {/* Primary Sticky Header */}
      <Navbar
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenTracking={() => handleOpenTracking()}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenComplaint={() => {
          setComplaintOrderNumber(undefined);
          setIsComplaintOpen(true);
        }}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* Editorial Hero Section */}
        <Hero
          onExploreClick={handleExploreClick}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onCraftClick={handleCraftClick}
          products={products}
        />

        {/* Brand Value Pillars */}
        <BrandPillars />

        {/* Product Catalog & Filterable Showcase */}
        <ProductCatalog
          products={products}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onQuickView={(product) => setQuickViewProduct(product)}
          onAddToCart={(product) => handleAddToCart(product, 1)}
        />

        {/* The Authentic Melt & Pour Craft Timeline */}
        <ColdProcessRitual />

        {/* Soap Care, Longevity & Accessories */}
        <SoapCareGuide
          products={products}
          onAddToCart={(product) => handleAddToCart(product, 1)}
        />

        {/* Customer Reviews & Verification */}
        <ReviewsSection />

        {/* Collapsible FAQ Section */}
        <FaqSection />

        {/* Newsletter & Bloom Circle Club */}
        <Newsletter />
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => setActiveCategory(cat)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenTracking={() => handleOpenTracking()}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenComplaint={() => {
          setComplaintOrderNumber(undefined);
          setIsComplaintOpen(true);
        }}
      />

      {/* Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(product, qty) => handleAddToCart(product, qty)}
      />

      {/* Scent & Skin Diagnostic Quiz Modal */}
      <ScentQuiz
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        products={products}
        onAddToCart={(product) => handleAddToCart(product, 1)}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOpenCheckout={handleOpenCheckout}
      />

      {/* Realistic Checkout & Order Confirmation Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        promoDiscount={checkoutData.discount}
        promoCode={checkoutData.code}
        selectedSample={checkoutData.sample}
        onOrderCompleted={handleOrderCompleted}
        onOpenTracking={(ordNum) => handleOpenTracking(ordNum, "tracking")}
      />

      {/* Live Order Tracking & Shipment Status Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderNumber={trackingOrderNumber}
        initialTab={trackingInitialTab}
        onPlaceNewOrder={handlePlaceNewOrder}
        onReorder={handleReorder}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenComplaint={(ordNum) => {
          setComplaintOrderNumber(ordNum);
          setIsComplaintOpen(true);
        }}
      />

      {/* Customer Mobile OTP & Password Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          showToast(`Logged in as ${user.fullName}`);
          handleOpenTracking(undefined, "history");
        }}
      />

      {/* Order Complaint & WhatsApp Escalation Bot Modal */}
      <ComplaintBotModal
        isOpen={isComplaintOpen}
        onClose={() => setIsComplaintOpen(false)}
        preselectedOrderNumber={complaintOrderNumber}
        onOpenAuth={() => {
          setIsComplaintOpen(false);
          setIsAuthOpen(true);
        }}
      />
    </div>
  );
}
