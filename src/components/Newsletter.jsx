import React, { useState } from "react";
import { Check, ArrowRight } from "lucide-react";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubscribed(true);
  };

  return (
    <section
      id="newsletter-section"
      className="py-16 bg-[#263E2E] text-[#FAF7F2] relative overflow-hidden"
    >
      {/* Background botanical ornament */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#34533D] rounded-full blur-3xl opacity-40 transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Official Brand Seal Logo */}
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-[#E3B873] mx-auto mb-3 bg-[#EFE6D5]">
          <img
            src="/organic-bloom-logo.svg"
            alt="Organic Bloom Official Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <span className="text-xs uppercase tracking-widest text-[#E3B873] font-semibold">
          Organic Bloom Family
        </span>

        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white mt-2">
          Join the Bloom Circle &amp; Receive 15% Off
        </h2>

        <p className="text-xs sm:text-sm text-[#C6D8CB] mt-2 max-w-xl mx-auto leading-relaxed">
          Be first to access our limited small-batch seasonal cures, botanical
          harvesting notes, and wildflower gardening tips.
        </p>

        {subscribed ? (
          <div className="mt-8 p-4 rounded-xl bg-[#34533D] border border-[#4E755B] max-w-md mx-auto animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-white font-bold text-sm mb-1">
              <Check className="w-4 h-4 text-[#E3B873]" />
              <span>Welcome to the Bloom Circle!</span>
            </div>
            <p className="text-xs text-[#C6D8CB]">
              Your 15% discount code is{" "}
              <strong className="text-[#E3B873] font-mono">BLOOM15</strong>. It
              has been automatically copied for your next bag!
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 text-xs bg-[#1F3325] border border-[#3E5F49] rounded-full px-4 py-3 text-white placeholder-[#8DA894] focus:outline-none focus:border-[#E3B873]"
            />

            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-[#E3B873] hover:bg-[#D4A760] text-[#1B2F21] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Subscribe</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="mt-5 flex items-center justify-center gap-6 text-[11px] text-[#A2BFA8]">
          <span>✓ Zero spam</span>
          <span>✓ 15% off first order</span>
          <span>✓ Pure botanical skincare tips</span>
        </div>
      </div>
    </section>
  );
};
