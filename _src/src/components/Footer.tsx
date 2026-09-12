import React, { useState } from 'react';
import { Heart, ShieldCheck, Mail, MapPin, Instagram, Sparkles, ExternalLink, Phone, MessageCircle, QrCode, Copy, Check, Truck } from 'lucide-react';
import { BRAND_INFO } from '../data/soaps';
import { BrandLogo } from './BrandLogo';
import { QRModal } from './QRModal';

interface FooterProps {
  onSelectCategory: (cat: string) => void;
  onOpenQuiz: () => void;
  onOpenTracking?: () => void;
  onOpenAuth?: () => void;
  onOpenComplaint?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenQuiz,
  onOpenTracking,
  onOpenAuth,
  onOpenComplaint,
}) => {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(BRAND_INFO.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const scrollTo = (id: string, cat?: string) => {
    if (cat) onSelectCategory(cat);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1C2C20] text-[#E0EBE2] pt-16 pb-12 border-t border-[#29422F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#2C4533]">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="md" invert />
            <p className="text-xs text-[#A8C4AF] leading-relaxed max-w-sm">
              Handcrafted Melt &amp; Pour herbal soaps: pure plant base is gently melted down, infused with real botanicals, and hand-poured in small batches for healthy, radiant skin.
            </p>

            <div className="space-y-2 pt-2 text-xs text-[#C6DBCB]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E3B873] shrink-0" />
                <span>India • Pan-India Courier Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-[#E3B873] shrink-0" />
                <a
                  href={BRAND_INFO.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white underline font-semibold flex items-center gap-1"
                >
                  <span>@{BRAND_INFO.instagram}</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <a
                  href={BRAND_INFO.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white font-semibold"
                >
                  WhatsApp Orders: {BRAND_INFO.phoneFormatted}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#E3B873] shrink-0" />
                <a href={`mailto:${BRAND_INFO.email}`} className="hover:text-white">
                  Orders &amp; Inquiries: {BRAND_INFO.email}
                </a>
              </div>
            </div>
          </div>

          {/* Nav: Soaps & Combos */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#E3B873] font-bold">
              Our Soaps &amp; Combos
            </h4>
            <ul className="space-y-2 text-xs text-[#B2CDB9]">
              <li>
                <button
                  onClick={() => scrollTo('collection', 'charcoal')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  🖤 Charcoal Soap (₹99)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection', 'rice')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  🌾 Rice Soap (₹149)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection', 'bridal')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  ✨ Bridal Ubtan Soap (₹199)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection', 'bundle')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  🎁 Rice + Charcoal Combo (₹179)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection', 'bundle')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  🎁 3-in-1 Radiance Trio (₹399)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection', 'bundle')}
                  className="hover:text-white transition-colors cursor-pointer font-bold text-[#E3B873] text-left"
                >
                  🎁 4-in-1 Charcoal Max Combo (₹449)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection', 'all')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  View All Soaps
                </button>
              </li>
            </ul>
          </div>

          {/* Nav: The Craft & Brand */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#E3B873] font-bold">
              The Atelier
            </h4>
            <ul className="space-y-2 text-xs text-[#B2CDB9]">
              <li>
                <button
                  onClick={() => scrollTo('brand-pillars')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  The Organic Bloom Promise
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('craft-ritual')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Melt &amp; Pour Method
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenQuiz}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Soap Recommendation Quiz
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('reviews-section')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Customer Feedback
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('faq-section')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  FAQs &amp; Courier Details
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-white transition-colors cursor-pointer text-[#E3B873] font-semibold flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-[#E3B873]" />
                  <span>My Orders &amp; Live Tracking</span>
                </button>
              </li>
              {onOpenAuth && (
                <li>
                  <button
                    onClick={onOpenAuth}
                    className="hover:text-white transition-colors cursor-pointer text-[#A8C4AF]"
                  >
                    🔐 Customer Login (Mobile OTP / PIN)
                  </button>
                </li>
              )}
              {onOpenComplaint && (
                <li>
                  <button
                    onClick={onOpenComplaint}
                    className="hover:text-[#FFA07A] transition-colors cursor-pointer text-[#FFD1BA] font-semibold flex items-center gap-1"
                  >
                    <span>⚠️ Report Issue / Care Bot</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Payment & Purity Commitments */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#E3B873] font-bold">
              Payment Modes Accepted
            </h4>
            <div className="space-y-2 text-xs text-[#A0BFA8]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E3B873]"></span>
                <span className="text-white font-medium">Cash on Delivery (COD)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5F259F]"></span>
                <span className="text-white font-medium">PhonePe / UPI QR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span>
                <span className="text-white font-medium">Google Pay (GPay)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                <span className="text-white font-medium">Direct WhatsApp Orders</span>
              </div>

              {/* Official PhonePe UPI Box in Footer */}
              <div className="p-2.5 rounded-xl bg-[#142217] border border-[#2B4532] space-y-1.5 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#A6C5AD]">Official PhonePe UPI:</span>
                  <button
                    onClick={handleCopyUpi}
                    className="text-[10px] text-[#E3B873] hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {copiedUpi ? <Check className="w-3 h-3 text-[#4ADE80]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono text-xs font-bold text-white tracking-wide">
                  {BRAND_INFO.upiId}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#86A68F]">HDFC Bank - 6686</span>
                  <button
                    onClick={() => setIsQrOpen(true)}
                    className="px-2 py-0.5 rounded bg-[#2A4731] hover:bg-[#34593D] text-[10px] font-semibold text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <QrCode className="w-3 h-3 text-[#E3B873]" />
                    <span>Scan QR</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2C4533] space-y-1.5">
                <div className="flex items-center gap-2 text-[#E3B873]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Chemical &amp; Sulfate Free</span>
                </div>
                <div className="flex items-center gap-2 text-[#E3B873]">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Pure Botanical Melt &amp; Pour Craft</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#86A68F] gap-4">
          <p>© {new Date().getFullYear()} Organic Bloom • Handcrafted Soaps, Ahmedabad, India. Direct orders: +91 93132 68959</p>
          <div className="flex items-center gap-6">
            <a href={BRAND_INFO.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-white">
              Instagram @{BRAND_INFO.instagram}
            </a>
            <span className="hover:text-white cursor-pointer">COD Available</span>
            <button
              onClick={() => setIsQrOpen(true)}
              className="text-[#E3B873] hover:text-white cursor-pointer underline flex items-center gap-1 font-medium"
            >
              <QrCode className="w-3 h-3 inline" />
              <span>Scan PhonePe QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standalone QR Modal */}
      <QRModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </footer>
  );
};
