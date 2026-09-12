import React from 'react';
import { Droplet, MapPin, Sparkles, PackageCheck, ShieldCheck, HeartHandshake } from 'lucide-react';
import { BRAND_INFO } from '../data/soaps';

export const BrandPillars: React.FC = () => {
  const pillars = [
    {
      icon: MapPin,
      title: 'Handcrafted Melt & Pour',
      description: 'Handcrafted in our botanical atelier using authentic Melt & Pour craft: pure natural base is gently melted down, enriched with active herbs, and hand-poured in micro-batches.',
      tag: 'Artisanal Roots'
    },
    {
      icon: Sparkles,
      title: 'Rice, Charcoal & 18 Herbs',
      description: 'Each soap solves a dedicated skin goal: gentle tan removal with pure Rice milk (₹149), deep detox with Charcoal (₹99), and luminous glow with 18 Vedic herbs (₹199), plus 3 value combos!',
      tag: 'Targeted Natural Actives'
    },
    {
      icon: ShieldCheck,
      title: '100% Sulfate & Paraben Free',
      description: 'Zero SLS, zero petrochemicals, zero synthetic parabens or artificial hardening agents. Only pure saponified plant butters and skin-cherishing natural oils.',
      tag: 'Clean & Honest Skin'
    },
    {
      icon: PackageCheck,
      title: 'Secure Pan-India Doorstep Delivery',
      description: 'Every bar is wrapped with moisture-resistant protective sealing to safeguard active herbal freshness, and safely dispatched across India with tracking.',
      tag: 'Safe Courier Dispatch'
    }
  ];

  return (
    <section id="brand-pillars" className="py-14 bg-[#F5F0EA] border-y border-[#E8DFD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold tracking-widest text-[#263E2E] uppercase">
            The Organic Bloom Promise
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1F3325] mt-1.5">
            Naturally Better, Beautifully You
          </h2>
          <p className="text-sm sm:text-base text-[#5C554C] mt-2.5">
            Crafted with passion using honest ingredients, fair pricing, and pure botanical nourishment for your everyday bath ritual.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-[#FAF7F2] rounded-xl p-6 border border-[#E4DCCF] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#E6EFE7] border border-[#CADBCB] flex items-center justify-center text-[#263E2E] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-[#8B5A2B] uppercase tracking-wider block mb-1">
                    {pillar.tag}
                  </span>
                  <h3 className="font-display text-xl font-semibold text-[#213527] mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5B544B] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
