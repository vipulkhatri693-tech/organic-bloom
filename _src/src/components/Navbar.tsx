import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, Menu, X, Search, Instagram, MapPin, Phone, MessageCircle, Truck, User, KeyRound, AlertTriangle, ShieldCheck, LogOut } from 'lucide-react';
import { CartItem, UserAccount } from '../types';
import { BRAND_INFO } from '../data/soaps';
import { BrandLogo } from './BrandLogo';
import { getCurrentUser, logoutUser } from '../utils/authStorage';

interface NavbarProps {
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenQuiz: () => void;
  onOpenTracking?: () => void;
  onOpenAuth?: () => void;
  onOpenComplaint?: () => void;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cart,
  onOpenCart,
  onOpenQuiz,
  onOpenTracking,
  onOpenAuth,
  onOpenComplaint,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('user_auth_change', handleAuthChange);
    return () => window.removeEventListener('user_auth_change', handleAuthChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string, categoryFilter?: string) => {
    setMobileMenuOpen(false);
    if (categoryFilter) {
      onSelectCategory(categoryFilter);
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Top Announcement Bar */}
      {!announcementDismissed && (
        <div
          id="announcement-bar"
          className="bg-[#1C2C20] text-[#E7EFE8] text-xs py-2 px-4 border-b border-[#2C4533]"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="hidden md:flex items-center gap-2 text-[#C4DCC8]">
              <MapPin className="w-3.5 h-3.5 text-[#E3B873]" />
              <span>Botanical Cold Process Atelier • Pan-India Courier</span>
            </div>
            <div className="flex-1 text-center font-medium tracking-wide text-[11px] sm:text-xs">
              <span>
                ✨ <strong className="text-[#E3B873]">Value Combo:</strong> 2 Charcoal + 1 Rice + 1 Bridal Ubtan — our best-selling bundle!
              </span>
              <a
                href={BRAND_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-2 hidden sm:inline-flex items-center gap-1 underline font-semibold text-[#E3B873] hover:text-white"
              >
                <Instagram className="w-3 h-3 inline" />
                <span>@{BRAND_INFO.instagram}</span>
              </a>
              <a
                href={BRAND_INFO.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-2 hidden lg:inline-flex items-center gap-1 text-[#C4DCC8] hover:text-white"
              >
                <MessageCircle className="w-3 h-3 text-[#58D68D] inline" />
                <span>Orders: {BRAND_INFO.phoneFormatted}</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`tel:${BRAND_INFO.phone}`}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#A6C5AD] hover:text-white bg-[#29422F] px-2 py-0.5 rounded"
              >
                <Phone className="w-3 h-3" />
                <span>{BRAND_INFO.phoneFormatted}</span>
              </a>
              <button
                onClick={() => setAnnouncementDismissed(true)}
                className="text-[#9DB9A5] hover:text-white transition-colors p-0.5 cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav
        id="main-nav"
        className={`w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md shadow-sm border-b border-[#E8E1D5]'
            : 'bg-[#FAF7F2] border-b border-[#ECE5DA]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Mobile Menu Toggle & Search */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#2C2926] hover:text-[#263E2E] rounded-md transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button
              id="mobile-search-toggle"
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="p-2 text-[#5A554E] hover:text-[#263E2E]"
              aria-label="Search Soaps"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Logo & Location Emblem */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group"
            >
              <BrandLogo size="md" />
            </a>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 text-[14px] font-medium text-[#48433C]">
            <button
              onClick={() => handleNavClick('collection', 'all')}
              className="hover:text-[#263E2E] transition-colors cursor-pointer py-1"
            >
              All Soaps
            </button>
            <button
              onClick={() => handleNavClick('collection', 'charcoal')}
              className="hover:text-[#263E2E] transition-colors cursor-pointer py-1"
            >
              Charcoal Soap
            </button>
            <button
              onClick={() => handleNavClick('collection', 'rice')}
              className="hover:text-[#263E2E] transition-colors cursor-pointer py-1"
            >
              Rice Soap
            </button>
            <button
              onClick={() => handleNavClick('collection', 'bridal')}
              className="hover:text-[#263E2E] transition-colors cursor-pointer py-1"
            >
              Bridal Ubtan
            </button>
            <button
              onClick={() => handleNavClick('collection', 'bundle')}
              className="hover:text-[#263E2E] transition-colors cursor-pointer py-1 flex items-center gap-1.5"
            >
              <span>4-in-1 Combo</span>
              <span className="bg-[#E4ECE4] text-[#263E2E] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Best Value
              </span>
            </button>
            <button
              onClick={() => handleNavClick('craft-ritual')}
              className="hover:text-[#263E2E] transition-colors cursor-pointer py-1"
            >
              Melt &amp; Pour Craft
            </button>
          </div>

          {/* Right Action Icons & Social Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Instagram Quick Link */}
            <a
              href={BRAND_INFO.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#1C2C20] bg-[#EFE8DC] hover:bg-[#E5DDCE] border border-[#D9CEBE] transition-colors"
              title="Visit Instagram @organic_bloom03"
            >
              <Instagram className="w-3.5 h-3.5 text-[#C48039]" />
              <span>@{BRAND_INFO.instagram}</span>
            </a>

            {/* Desktop Search Toggle */}
            <div className="hidden md:flex items-center relative">
              {showSearchInput ? (
                <div className="flex items-center relative animate-fade-in">
                  <input
                    id="desktop-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Rice, Charcoal, Ubtan..."
                    className="w-52 text-xs bg-[#F2ECE2] border border-[#DCD3C4] rounded-full py-2 pl-8 pr-7 text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                    autoFocus
                  />
                  <Search className="w-3.5 h-3.5 text-[#7E7870] absolute left-3" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-[#888177] hover:text-[#2C2926] text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <button
                  id="desktop-search-btn"
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 text-[#5E5850] hover:text-[#263E2E] hover:bg-[#F2ECE2] rounded-full transition-colors cursor-pointer"
                  title="Search soaps"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Customer Login or User Badge with explicit Logout option */}
            {currentUser ? (
              <div className="hidden sm:inline-flex items-center gap-1.5">
                <button
                  id="nav-user-profile-btn"
                  onClick={() => onOpenTracking?.()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E5EFE6] text-[#1C2C20] hover:bg-[#D8E8DA] border border-[#BBD5BF] transition-all cursor-pointer shadow-xs"
                  title={`Logged in as ${currentUser.fullName} (+91 ${currentUser.phone}) - Click to view order history`}
                >
                  <User className="w-3.5 h-3.5 text-[#263E2E]" />
                  <span>{currentUser.fullName.split(' ')[0]}</span>
                </button>
                <button
                  id="nav-logout-btn"
                  onClick={() => {
                    logoutUser();
                    setCurrentUser(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[#842029] bg-[#FEE2E2] hover:bg-[#FCA5A5] border border-[#FCA5A5] transition-all cursor-pointer shadow-xs"
                  title="Log out of this account"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden xl:inline">Log Out</span>
                </button>
              </div>
            ) : (
              <button
                id="nav-login-btn"
                onClick={() => onOpenAuth?.()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF4EB] text-[#2C2926] hover:bg-[#F2E8D7] border border-[#DDD3C2] transition-all cursor-pointer shadow-xs"
                title="Login via Mobile Number or Password to access your order history"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#C48039]" />
                <span>Log In</span>
              </button>
            )}

            {/* Support Bot / Complaint Trigger */}
            {onOpenComplaint && (
              <button
                id="nav-support-bot-btn"
                onClick={() => onOpenComplaint()}
                className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-[#8C4A15] bg-[#FAF0E6] hover:bg-[#F3E5D4] border border-[#E8CEB5] transition-colors cursor-pointer"
                title="Report issue or file a complaint with our Herbal Care Bot"
              >
                <AlertTriangle className="w-3 h-3 text-[#C48039]" />
                <span>Support Bot</span>
              </button>
            )}

            {/* Track Order CTA */}
            {onOpenTracking && (
              <button
                id="nav-track-order-btn"
                onClick={onOpenTracking}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F5EFE6] text-[#2C2926] hover:bg-[#EAE1D3] border border-[#DDD3C2] transition-all cursor-pointer shadow-xs"
                title="Track your order status and view order history"
              >
                <Truck className="w-3.5 h-3.5 text-[#263E2E]" />
                <span>Orders &amp; Track</span>
              </button>
            )}

            {/* Skin Quiz CTA */}
            <button
              id="nav-scent-quiz-btn"
              onClick={onOpenQuiz}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E4ECE4] text-[#263E2E] hover:bg-[#D5E1D6] border border-[#B9CBB9] transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C48039]" />
              <span>Soap Quiz</span>
            </button>

            {/* Cart Drawer Trigger */}
            <button
              id="open-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 rounded-full bg-[#263E2E] text-[#FAF7F2] hover:bg-[#1E3224] transition-all shadow-xs cursor-pointer group"
              aria-label={`Open shopping cart with ${totalCartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-105" />
              <span className="hidden sm:inline-block text-xs font-semibold tracking-wider uppercase">
                Cart
              </span>
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#C88A58] text-[#FFFFFF] text-[11px] font-bold">
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input Sub-bar */}
        {showSearchInput && (
          <div className="md:hidden px-4 pb-3 border-t border-[#ECE5DA] pt-2 bg-[#FAF7F2]">
            <div className="relative">
              <input
                id="mobile-search-field"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Rice, Charcoal, Ubtan, Combos..."
                className="w-full text-sm bg-[#F2ECE2] border border-[#DCD3C4] rounded-lg py-2 pl-9 pr-8 text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
              />
              <Search className="w-4 h-4 text-[#7E7870] absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-[#888177] text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="lg:hidden bg-[#FAF7F2] border-b border-[#E4DCCF] px-4 py-4 space-y-2.5 animate-slide-down"
          >
            <button
              onClick={() => handleNavClick('collection', 'all')}
              className="block w-full text-left py-2 font-medium text-[#2C2926] hover:text-[#263E2E]"
            >
              All Soaps
            </button>
            <button
              onClick={() => handleNavClick('collection', 'charcoal')}
              className="block w-full text-left py-2 font-medium text-[#2C2926] hover:text-[#263E2E]"
            >
              🖤 Charcoal Soap — Deep Cleansing &amp; Oil Control
            </button>
            <button
              onClick={() => handleNavClick('collection', 'rice')}
              className="block w-full text-left py-2 font-medium text-[#2C2926] hover:text-[#263E2E]"
            >
              🌾 Rice Soap — Tan Removal &amp; Soft Skin
            </button>
            <button
              onClick={() => handleNavClick('collection', 'bridal')}
              className="block w-full text-left py-2 font-medium text-[#2C2926] hover:text-[#263E2E]"
            >
              ✨ Bridal Ubtan Glow — 18 Herbal Ayurvedic Blend
            </button>
            <button
              onClick={() => handleNavClick('collection', 'bundle')}
              className="flex items-center justify-between w-full text-left py-2 font-medium text-[#2C2926] hover:text-[#263E2E]"
            >
              <span>4-in-1 Charcoal Max Combo</span>
              <span className="bg-[#263E2E] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                Best Value
              </span>
            </button>
            <button
              onClick={() => handleNavClick('craft-ritual')}
              className="block w-full text-left py-2 font-medium text-[#2C2926] hover:text-[#263E2E]"
            >
              Melt &amp; Pour Craft
            </button>

            <div className="pt-3 border-t border-[#E8DFD3] space-y-2">
              <a
                href={BRAND_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-[#F0EAE0] text-[#2C2926] text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Instagram className="w-4 h-4 text-[#C48039]" />
                <span>Follow on Instagram: @{BRAND_INFO.instagram}</span>
              </a>
              <a
                href={BRAND_INFO.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-[#E7F3EB] text-[#1E3E26] text-xs font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp Orders: {BRAND_INFO.phoneFormatted}</span>
              </a>
              {/* User Account / Login inside Mobile Drawer */}
              {currentUser ? (
                <div className="p-3 rounded-xl bg-[#E5EFE6] border border-[#C6DCC9] flex items-center justify-between">
                  <div className="text-xs text-[#1C2C20]">
                    <span className="text-[10px] text-[#263E2E] block uppercase font-bold">
                      👤 Logged In Customer
                    </span>
                    <strong className="text-xs">{currentUser.fullName}</strong>
                    <span className="text-[11px] text-[#554E44] block">
                      +91 {currentUser.phone}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logoutUser();
                      setCurrentUser(null);
                    }}
                    className="text-[11px] font-bold text-[#842029] bg-white px-2.5 py-1 rounded-lg border border-[#FCA5A5] hover:bg-[#FEE2E2] cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth?.();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FAF4EB] text-[#2C2926] text-xs font-bold flex items-center justify-center gap-2 border border-[#DDD3C2] cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#C48039]" />
                  <span>Customer Login (Mobile OTP / PIN)</span>
                </button>
              )}

              {/* Support Bot / Complaint Trigger */}
              {onOpenComplaint && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenComplaint();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FAF0E6] text-[#8C4A15] text-xs font-bold flex items-center justify-center gap-2 border border-[#E8CEB5] cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#C48039]" />
                  <span>Report Issue / Support Bot (Delivered Orders)</span>
                </button>
              )}

              {onOpenTracking && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTracking();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F0EAE0] text-[#2C2926] text-xs font-semibold flex items-center justify-center gap-2 border border-[#D9CEBE]"
                >
                  <Truck className="w-3.5 h-3.5 text-[#263E2E]" />
                  <span>My Orders &amp; Live Tracking</span>
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenQuiz();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#263E2E] text-[#FAF7F2] text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E3B873]" />
                <span>Take the Soap Match Quiz</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
