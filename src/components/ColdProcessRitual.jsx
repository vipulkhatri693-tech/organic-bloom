import React, { useState } from "react";
import { CRAFT_STEPS } from "../data/soaps";
import {
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Heart,
  Flame,
} from "lucide-react";

export const ColdProcessRitual = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const activeStep = CRAFT_STEPS[activeStepIndex];

  return (
    <section
      id="craft-ritual"
      className="py-16 sm:py-24 bg-[#FAF7F2] border-t border-[#E8DFD3]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold tracking-widest text-[#263E2E] uppercase flex items-center justify-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#C48039]" />
            <span>Melt &amp; Pour Artisan Craft</span>
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C2C20] mt-1.5">
            The Melt &amp; Pour Herbal Ritual
          </h2>
          <p className="text-sm sm:text-base text-[#5E574E] mt-3">
            We gently melt our pure natural plant base over low heat and blend
            in authentic raw herbs, botanical extracts, and nourishing essential
            oils. Zero harsh chemicals, zero synthetic hardeners — pure
            nourishment for your skin.
          </p>
        </div>

        {/* Step Tabs Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {CRAFT_STEPS.map((step, idx) => (
            <button
              key={step.step}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                activeStepIndex === idx
                  ? "bg-[#263E2E] text-[#FAF7F2] border-[#263E2E] shadow-md"
                  : "bg-[#F2ECE2] text-[#474138] hover:bg-[#EAE2D5] border-[#DDD3C2]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold tracking-wider ${
                    activeStepIndex === idx
                      ? "text-[#E3B873]"
                      : "text-[#885A2C]"
                  }`}
                >
                  PHASE {step.step}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    activeStepIndex === idx
                      ? "bg-[#3A5643] text-white"
                      : "bg-[#E3D8C8] text-[#554E44]"
                  }`}
                >
                  {step.timeframe}
                </span>
              </div>
              <div className="font-display text-base font-semibold leading-tight line-clamp-1">
                {step.title}
              </div>
            </button>
          ))}
        </div>

        {/* Interactive Feature Panel */}
        <div className="bg-[#F6EFE6] rounded-2xl border border-[#DDD3C2] p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Step Detail Content */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#263E2E] text-white text-xs font-bold flex items-center justify-center">
                {activeStep.step}
              </span>
              <span className="text-xs uppercase font-bold text-[#885A2C] tracking-wider">
                {activeStep.timeframe}
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#1F3325]">
              {activeStep.title}
            </h3>

            <p className="text-sm sm:text-base text-[#4E473D] leading-relaxed">
              {activeStep.description}
            </p>

            {/* Micro Callout Card */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E3D9CC] flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#C48039] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-[#263E2E] block">
                  The Herbal Infusion Advantage
                </span>
                <p className="text-xs text-[#595247] mt-0.5">
                  {activeStep.detail}
                </p>
              </div>
            </div>

            {/* Quick comparison bullets */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#635B50]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#263E2E]" />
                <span>100% Pure Natural Base</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#263E2E]" />
                <span>Direct Active Herb Infusion</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#263E2E]" />
                <span>High Moisture Vegetable Glycerin</span>
              </div>
            </div>
          </div>

          {/* Step Visual Image */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-[#EBE3D7] border border-[#DDD3C2]">
              <img
                src={activeStep.image}
                alt={activeStep.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/studio-melting-mixing.svg";
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white text-xs">
                <span className="bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-medium">
                  Artisan Herbal Atelier • Step {activeStep.step}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Melt & Pour vs Commercial Comparison Bar */}
        <div className="mt-14 p-6 sm:p-8 bg-[#FAF7F2] rounded-2xl border border-[#DDD3C2] shadow-xs">
          <h4 className="font-display text-xl sm:text-2xl font-semibold text-[#1C2C20] text-center mb-6">
            Organic Bloom Melt &amp; Pour vs. Commercial Synthetic Bars
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-[#EAF3EB] border border-[#C6DCB8]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#263E2E] mb-2">
                <Heart className="w-4 h-4 text-[#263E2E]" />
                <span>Organic Bloom Melt &amp; Pour Herb Craft</span>
              </div>
              <ul className="space-y-2 text-xs text-[#3E5243]">
                <li className="flex items-center gap-2">
                  <span className="text-[#263E2E] font-bold">✓</span>
                  <span>
                    Pure natural base melted gently without chemical lye or
                    industrial fumes
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#263E2E] font-bold">✓</span>
                  <span>
                    Direct infusion of raw active herbs: Rice Milk, Bamboo
                    Charcoal, &amp; 18 Ayurvedic Herbs
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#263E2E] font-bold">✓</span>
                  <span>
                    100% vegetable glycerin retained for immediate barrier
                    hydration &amp; baby-soft feel
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#263E2E] font-bold">✓</span>
                  <span>
                    Handcrafted in small batches with 100% natural herbs &amp;
                    botanical powders
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-[#F6ECEB] border border-[#ECCDC9]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#96372D] mb-2">
                <ShieldAlert className="w-4 h-4 text-[#96372D]" />
                <span>Commercial Synthetic Soap Bars</span>
              </div>
              <ul className="space-y-2 text-xs text-[#6F433E]">
                <li className="flex items-center gap-2">
                  <span className="text-[#96372D] font-bold">✗</span>
                  <span>
                    Natural glycerin is stripped away in industrial plants to
                    sell in luxury creams
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#96372D] font-bold">✗</span>
                  <span>
                    Synthetic detergent pellets (SLS/SLES) extruded under heavy
                    pressure in 30 seconds
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#96372D] font-bold">✗</span>
                  <span>
                    Harsh chemical hardeners and artificial scents that irritate
                    sensitive skin
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#96372D] font-bold">✗</span>
                  <span>
                    Single-use plastic wrappers contributing to
                    non-biodegradable waste
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
