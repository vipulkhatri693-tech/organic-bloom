import React, { useState } from 'react';
import { FAQS } from '../data/soaps';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="py-16 sm:py-24 bg-[#FAF7F2] border-t border-[#E8DFD3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold tracking-widest text-[#263E2E] uppercase">
            Curious Minds
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C2C20] mt-1.5">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#5C554C] mt-2">
            Everything you need to know about our Melt &amp; Pour artisan process, raw botanical infusions, combos, and zero-chemical formulations.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#F5EFE6] rounded-xl border border-[#DDD3C2] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-display text-base sm:text-lg font-semibold text-[#1F3325]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#263E2E] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#544D42] leading-relaxed border-t border-[#E6DDCE] pt-3 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
