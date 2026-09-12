import React, { useState } from "react";
import { Wind, Droplets, Sun, Check, Plus } from "lucide-react";

export const SoapCareGuide = ({ products, onAddToCart }) => {
  const [addedAccessoryId, setAddedAccessoryId] = useState(null);

  const cedarDish = products.find((p) => p.id === "accessory-cedar-dish");
  const sisalPouch = products.find((p) => p.id === "accessory-sisal-pouch");

  const handleAdd = (product) => {
    onAddToCart(product);
    setAddedAccessoryId(product.id);
    setTimeout(() => {
      setAddedAccessoryId(null);
    }, 1200);
  };

  const careTips = [
    {
      icon: Wind,
      title: "Breathe Between Washes",
      text: "Artisanal Melt & Pour soaps do not contain synthetic hardening chemicals. Allowing air to circulate around the bar keeps it solid and firm.",
    },
    {
      icon: Droplets,
      title: "Never Let It Sit in Puddles",
      text: "Water pooling under a soap bar softens natural glycerin prematurely. A slatted or channeled dish channels moisture away in seconds.",
    },
    {
      icon: Sun,
      title: "Rescue Every Last Sliver",
      text: "When your bar wears down to a small thin wafer, slip it inside a sisal agave pouch with new slivers to produce endless rich lather.",
    },
  ];

  return (
    <section
      id="care-guide"
      className="py-16 sm:py-24 bg-[#FAF7F2] border-t border-[#E8DFD3]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold tracking-widest text-[#263E2E] uppercase">
            Artisan Longevity Guide
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C2C20] mt-1.5">
            How to make your bars last 40+ washes.
          </h2>
          <p className="text-sm sm:text-base text-[#5B544B] mt-2.5">
            Natural soaps are rich in moisturizing glycerin that thirsts for
            air. Follow these simple daily rituals to double each bar’s life.
          </p>
        </div>

        {/* 3 Care Tips Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {careTips.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <div
                key={idx}
                className="bg-[#F6EFE6] rounded-xl p-6 border border-[#E3D9CC] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#DDD3C2] flex items-center justify-center text-[#263E2E] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#1F3325] mb-2">
                    {tip.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#544D43] leading-relaxed">
                    {tip.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Companion Accessories Bar */}
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#DDD3C2] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E8DFD3]">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#1C2C20]">
                Botanical Care Accessories
              </h3>
              <p className="text-xs text-[#6B6358] mt-0.5">
                Designed specifically to keep Melt &amp; Pour bars dry, firm,
                and lasting 50% longer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Cedar Dish */}
            {cedarDish && (
              <div className="p-4 rounded-xl bg-white border border-[#DDD3C2] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#EFE9DF]">
                    <img
                      src={cedarDish.image}
                      alt={cedarDish.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-semibold text-[#1C2C20]">
                      {cedarDish.name}
                    </h4>
                    <p className="text-xs text-[#6B6358]">
                      {cedarDish.subtitle}
                    </p>
                    <span className="font-display text-base font-bold text-[#1C2C20] mt-1 block">
                      ₹{cedarDish.price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAdd(cedarDish)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    addedAccessoryId === cedarDish.id
                      ? "bg-[#528C5F] text-white"
                      : "bg-[#263E2E] text-[#FAF7F2] hover:bg-[#1B2F21]"
                  }`}
                >
                  {addedAccessoryId === cedarDish.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Sisal Pouch */}
            {sisalPouch && (
              <div className="p-4 rounded-xl bg-white border border-[#DDD3C2] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#EFE9DF]">
                    <img
                      src={sisalPouch.image}
                      alt={sisalPouch.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-semibold text-[#1C2C20]">
                      {sisalPouch.name}
                    </h4>
                    <p className="text-xs text-[#6B6358]">
                      {sisalPouch.subtitle}
                    </p>
                    <span className="font-display text-base font-bold text-[#1C2C20] mt-1 block">
                      ₹{sisalPouch.price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAdd(sisalPouch)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    addedAccessoryId === sisalPouch.id
                      ? "bg-[#528C5F] text-white"
                      : "bg-[#263E2E] text-[#FAF7F2] hover:bg-[#1B2F21]"
                  }`}
                >
                  {addedAccessoryId === sisalPouch.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
