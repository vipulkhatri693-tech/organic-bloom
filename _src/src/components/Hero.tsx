import React, { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, MapPin, Instagram, Package } from 'lucide-react';
import { BRAND_INFO, SOAP_PRODUCTS } from '../data/soaps';
import { SoapProduct } from '../types';

interface HeroProps {
  onExploreClick: () => void;
  onOpenQuiz: () => void;
  onCraftClick: () => void;
  onSelectProduct?: (productId: string) => void;
  // Live, host-editable product catalog. Passing this in (instead of hardcoding
  // combo photos/prices here) means edits made in the Host Portal's product
  // editor — photo, price, name — automatically show up in this top banner too.
  products?: SoapProduct[];
}

// Structural/presentation info for each banner slide that isn't stored on the
// product record itself (tab label, bar breakdown chips). The live values
// (photo, title, price, originalPrice) are merged in from the actual product
// data at render time via buildCombos().
const COMBO_LAYOUT: Record<
  string,
  { tabLabel: string; barsCount: string; breakdown: string; items: { label: string; name: string; value: string }[] }
> = {
  'combo-rice-ubtan': {
    tabLabel: 'Rice + Charcoal',
    barsCount: '2 Full Bars',
    breakdown: '1 Rice Soap + 1 Charcoal Soap',
    items: [
      { label: '1x Brighten', name: 'Rice Soap', value: '₹149 MRP' },
      { label: '1x Detox', name: 'Charcoal Soap', value: '₹99 MRP' },
    ],
  },
  'combo-trio': {
    tabLabel: '3-in-1 Trio',
    barsCount: '3 Full Bars',
    breakdown: '1 Rice + 1 Charcoal + 1 Bridal Ubtan Soap',
    items: [
      { label: '1x Detox', name: 'Charcoal', value: '₹99 MRP' },
      { label: '1x Brighten', name: 'Rice Soap', value: '₹149 MRP' },
      { label: '1x Glow', name: 'Bridal Ubtan', value: '₹199 MRP' },
    ],
  },
  'combo-charcoal-max': {
    tabLabel: '4-in-1 Max',
    barsCount: '4 Full Bars',
    breakdown: '2 Charcoal + 1 Rice + 1 Bridal Ubtan Soap',
    items: [
      { label: '2x Detox', name: 'Charcoal Bars', value: '₹99 each' },
      { label: '1x Brighten', name: 'Rice Soap', value: '₹149 MRP' },
      { label: '1x Glow', name: 'Bridal Ubtan', value: '₹199 MRP' },
    ],
  },
};

const COMBO_ORDER = ['combo-rice-ubtan', 'combo-trio', 'combo-charcoal-max'];

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onOpenQuiz, products }) => {
  const [activeComboId, setActiveComboId] = useState<string>('combo-charcoal-max');

  // Merge live product data (photo, title, price) with the static layout info above.
  const catalog = products && products.length > 0 ? products : SOAP_PRODUCTS;
  const combos = COMBO_ORDER.map((id) => {
    const layout = COMBO_LAYOUT[id];
    const product = catalog.find((p) => p.id === id);
    if (!product) return null;
    return {
      id,
      tabLabel: layout.tabLabel,
      price: product.price,
      originalPrice: product.originalPrice ?? product.price,
      saveText: `Save ₹${Math.max(0, (product.originalPrice ?? product.price) - product.price)}`,
      title: product.name,
      barsCount: layout.barsCount,
      breakdown: layout.breakdown,
      image: product.image,
      items: layout.items,
    };
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  const currentCombo = combos.find((c) => c.id === activeComboId) || combos[combos.length - 1] || combos[0];

  if (!currentCombo) return null;

  return (
    <section id="hero-section" className="relative overflow-hidden pt-6 pb-14 lg:pt-12 lg:pb-20 bg-gradient-to-b from-[#FAF7F2] via-[#F4EFE6] to-[#FAF7F2]">
      {/* Background organic glow accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E5ECE5] rounded-full blur-3xl -z-10 opacity-70 transform translate-x-1/4 -translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F2E5D5] rounded-full blur-3xl -z-10 opacity-60 transform -translate-x-1/4 translate-y-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Brand Story & Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Eyebrow with Botanical Artisanal Soaps & Instagram */}
            <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAE2D5] border border-[#DDD3C2] text-[#373129] text-xs font-semibold">
              <span className="flex items-center gap-1 text-[#263E2E]">
                <MapPin className="w-3.5 h-3.5 text-[#C48039]" />
                <span>Handmade Botanical Soaps</span>
              </span>
              <span className="text-[#998F82]">•</span>
              <a
                href={BRAND_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#263E2E] hover:text-[#C48039] transition-colors"
              >
                <Instagram className="w-3 h-3 text-[#C48039]" />
                <span>@{BRAND_INFO.instagram}</span>
              </a>
              <span className="text-[#998F82] hidden sm:inline">•</span>
              <span className="hidden sm:inline text-[#685F54] bg-[#F7F2EB] px-2 py-0.5 rounded-full text-[11px]">
                Meesho Available
              </span>
            </div>

            {/* Main Authentic Slogan from user's poster */}
            <div>
              <span className="block text-xs uppercase tracking-[0.25em] text-[#C48039] font-bold mb-2 font-serif-sub">
                Organic Bloom Artisanal Melt &amp; Pour
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1C2C20] leading-[1.1] tracking-tight">
                Naturally Better, <br className="hidden sm:inline" />
                <span className="italic font-normal text-[#2E4D36]">Beautifully You.</span>
              </h1>
            </div>

            {/* Subtitle with user's core products */}
            <p className="text-sm sm:text-base text-[#524B42] leading-relaxed max-w-2xl">
              Switch to chemical-free bathing with Organic Bloom. Handcrafted using the authentic Melt &amp; Pour process: pure natural base is gently melted down, enriched with real herbs and botanical actives, and hand-poured with zero sulfates. Choose our signature single bars, or save big with our 3 special value combos:
              <strong className="text-[#263E2E]"> Rice + Charcoal</strong>,
              <strong className="text-[#263E2E]"> 3-in-1 Trio</strong>, or
              <strong className="text-[#263E2E]"> 4-in-1 Charcoal Max</strong>!
            </p>

            {/* Quick 3-Pill Interactive Product Badges — tap any to jump straight
                to that soap (with full price + details) in the catalog below. */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
              {[
                { id: 'rice-soap', tag: 'Tan Removal', name: 'Rice Soap' },
                { id: 'charcoal-soap', tag: 'Deep Detox', name: 'Charcoal Soap' },
                { id: 'bridal-ubtan-soap', tag: '18 Herbs Glow', name: 'Bridal Ubtan' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onExploreClick();
                    setTimeout(() => {
                      document.getElementById(`product-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                  }}
                  className="p-2.5 rounded-xl bg-white border border-[#E2D8CA] shadow-2xs text-center cursor-pointer hover:border-[#263E2E] hover:shadow-sm transition-all"
                >
                  <span className="block text-[10px] text-[#7B7366] uppercase font-bold tracking-wider">{p.tag}</span>
                  <strong className="font-display text-xs sm:text-sm text-[#1C2C20] block truncate">{p.name}</strong>
                  <span className="text-[10px] font-semibold text-[#C48039]">View Price →</span>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-shop-btn"
                onClick={onExploreClick}
                className="px-6 py-3.5 rounded-full bg-[#263E2E] text-[#FAF7F2] font-semibold text-xs sm:text-sm hover:bg-[#1C2F22] transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer group"
              >
                <span>Shop All Soaps &amp; Combos</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                id="hero-combo-btn"
                onClick={() => {
                  onExploreClick();
                  const el = document.getElementById(`product-${activeComboId}`);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3.5 rounded-full bg-[#FAF7F2] text-[#263E2E] font-semibold text-xs sm:text-sm border-2 border-[#263E2E] hover:bg-[#E8F0E9] transition-all duration-200 shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#C48039]" />
                <span>View {currentCombo.tabLabel}</span>
              </button>

              <button
                id="hero-quiz-btn"
                onClick={onOpenQuiz}
                className="text-xs font-semibold text-[#5A554D] hover:text-[#263E2E] underline underline-offset-4 transition-colors cursor-pointer py-2"
              >
                Skin Routine Quiz →
              </button>
            </div>

            {/* Trust / Purity Commitments */}
            <div className="pt-4 border-t border-[#E8DFD3] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#453F36]">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#263E2E] shrink-0" />
                <span>Sulfate &amp; Paraben Free</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#263E2E] shrink-0" />
                <span>Cruelty-Free Handmade</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#263E2E] shrink-0" />
                <span>100% Pure Natural Herbs</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#263E2E] shrink-0" />
                <span>Pan India Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase with Real Soap Photos & 3 Combo Switcher */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#DDD3C2] shadow-xl p-4 sm:p-5">
              {/* Combo Selector Tabs */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8DFD3]">
                <div className="flex items-center gap-1.5 bg-[#EAE2D5] p-1 rounded-lg">
                  {combos.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveComboId(c.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        activeComboId === c.id
                          ? 'bg-[#263E2E] text-white shadow-xs'
                          : 'text-[#5C5449] hover:text-[#1C2C20]'
                      }`}
                    >
                      {c.tabLabel}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-bold bg-[#E6EFE7] text-[#263E2E] px-2.5 py-1 rounded-full">
                  Special Bundle
                </span>
              </div>

              {/* Combo Real Photo Image — tap to jump straight to this combo
                  (with full pricing) in the catalog below. */}
              <button
                type="button"
                onClick={() => {
                  onExploreClick();
                  setTimeout(() => {
                    document.getElementById(`product-${currentCombo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 50);
                }}
                className="block w-full text-left cursor-pointer aspect-[4/3] rounded-xl overflow-hidden relative bg-[#EDE5D8]"
              >
                <img
                  src={currentCombo.image}
                  alt={`${currentCombo.title} by Organic Bloom`}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C2C20]/90 via-black/25 to-transparent" />

                {/* Badges on image */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF7F2]/95 text-[#263E2E] shadow-sm backdrop-blur-xs">
                    {currentCombo.barsCount}
                  </span>
                </div>

                {/* Bottom text inside image */}
                <div className="absolute bottom-3 left-3 right-3 text-[#FAF7F2]">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-[#E3B873] font-bold uppercase tracking-wider">
                        Handcrafted Value Combo
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight">
                        {currentCombo.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#E3B873] flex items-center gap-1 justify-end">
                        View Price <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#DCE7DF] mt-1 line-clamp-1">
                    {currentCombo.breakdown}
                  </p>
                </div>
              </button>

              {/* Mini Breakdown of Bars inside the selected combo */}
              <div className={`mt-3.5 grid gap-2 text-center text-xs ${currentCombo.items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {currentCombo.items.map((it, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[#F5EFE6] border border-[#E5DCCF]">
                    <span className="text-[10px] text-[#786F63] block font-medium">{it.label}</span>
                    <span className="font-bold text-[#1C2C20] text-[11px] block truncate">{it.name}</span>
                  </div>
                ))}
              </div>

              {/* Direct Add Combo to Cart Callout */}
              <div className="mt-3 pt-3 border-t border-[#E8DFD3] flex items-center justify-between text-xs text-[#524B43]">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Package className="w-3.5 h-3.5 text-[#263E2E]" />
                  <span>Moisture-Locked Safe Box</span>
                </div>
                <button
                  onClick={() => {
                    onExploreClick();
                    const el = document.getElementById(`product-${activeComboId}`);
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-bold text-[#263E2E] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Select &amp; Order</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

