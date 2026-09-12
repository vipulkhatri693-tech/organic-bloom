import React, { useState, useEffect } from "react";
import { BRAND_INFO } from "../data/soaps";
import {
  Star,
  CheckCircle,
  Plus,
  MessageCircle,
  Heart,
  ShieldCheck,
  Instagram,
} from "lucide-react";

export const ReviewsSection = () => {
  const [reviewsList, setReviewsList] = useState(() => {
    try {
      const saved = localStorage.getItem("organic_bloom_customer_reviews");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showReviewModal, setShowReviewModal] = useState(false);

  // New review form states
  const [newAuthor, setNewAuthor] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newProduct, setNewProduct] = useState("Rice Soap (₹149)");
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newSkinType, setNewSkinType] = useState("Sensitive");
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        "organic_bloom_customer_reviews",
        JSON.stringify(reviewsList),
      );
    } catch (e) {
      console.error("Error saving review to local storage", e);
    }
  }, [reviewsList]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim() || !newTitle.trim()) return;

    const createdReview = {
      id: `rev-user-${Date.now()}`,
      author: newAuthor.trim(),
      location: newLocation.trim() || "Verified Customer",
      productName: newProduct,
      rating: newRating,
      date: "Just now",
      title: newTitle.trim(),
      comment: newComment.trim(),
      skinType: newSkinType.trim(),
      verified: true,
    };

    setReviewsList([createdReview, ...reviewsList]);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setShowReviewModal(false);
      setNewAuthor("");
      setNewLocation("");
      setNewTitle("");
      setNewComment("");
    }, 1200);
  };

  return (
    <section
      id="reviews-section"
      className="py-16 sm:py-20 bg-[#F5EFE6] border-t border-[#E8DFD3]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Transparency Promise */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#E3D9CC] gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#263E2E] uppercase tracking-widest mb-1.5">
              <ShieldCheck className="w-4 h-4 text-[#263E2E]" />
              <span>100% Verified Customer Reviews</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1F3325]">
              Real Customer Feedback
            </h2>
            <p className="text-xs sm:text-sm text-[#5D554C] mt-1 max-w-2xl">
              We stand by complete authenticity. Every soap bar is handcrafted
              with pure botanical oils and raw herbs. Share your genuine
              feedback or message us directly on WhatsApp!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/${BRAND_INFO.whatsapp}?text=Hi%20Organic%20Bloom,%20I%20would%20like%20to%20share%20my%20feedback%20or%20review%20for%20your%20soaps!`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full bg-[#1E3E26] text-white text-xs font-semibold hover:bg-[#152C1B] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Review on WhatsApp</span>
            </a>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2.5 rounded-full bg-[#263E2E] text-[#FAF7F2] text-xs font-semibold hover:bg-[#1A2E20] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* If no user reviews yet, show warm authentic invitation */}
        {reviewsList.length === 0 ? (
          <div className="bg-[#FAF7F2] rounded-2xl p-8 sm:p-10 border border-[#DDD3C2] text-center max-w-3xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#E5ECE5] text-[#263E2E] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-[#A05C2C]" />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#1C2C20] mb-2">
              Authentic Experience First
            </h3>
            <p className="text-sm text-[#5D554C] max-w-xl mx-auto leading-relaxed mb-6">
              Unlike mass commercial brands, we have removed all fake
              testimonials. We craft each Charcoal, Rice, and Bridal Ubtan soap
              in small batches. When you receive your order, we would love for
              you to share your genuine experience!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-2.5 rounded-full bg-[#263E2E] text-white text-xs font-semibold hover:bg-[#1C2E21] cursor-pointer"
              >
                Be the First to Review
              </button>
              <a
                href={BRAND_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full bg-[#EAE2D5] text-[#263E2E] text-xs font-semibold hover:bg-[#DFD5C6] flex items-center gap-1.5"
              >
                <Instagram className="w-3.5 h-3.5 text-[#A05C2C]" />
                <span>DM us on @{BRAND_INFO.instagram}</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewsList.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#FAF7F2] rounded-2xl p-6 border border-[#DDD3C2] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E5ECE5] text-[#263E2E] font-bold flex items-center justify-center text-sm">
                        {(rev.author || "C").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#25392A] flex items-center gap-1.5">
                          <span>{rev.author || "Verified Customer"}</span>
                          <span className="inline-flex items-center text-[10px] font-medium text-[#263E2E] bg-[#E3EDE4] px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                            Verified Customer
                          </span>
                        </div>
                        <span className="text-[11px] text-[#787065]">
                          {rev.location || "India"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#867E73]">
                      {rev.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[#C48039] mb-1.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C48039]" />
                    ))}
                  </div>
                  <h4 className="font-display text-lg font-semibold text-[#1C2C20] mb-2">
                    &ldquo;{rev.title}&rdquo;
                  </h4>
                  <p className="text-xs sm:text-sm text-[#50483E] leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#E8DFD3] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#263E2E] bg-[#EAF2EC] px-2 py-0.5 rounded font-medium">
                    {rev.skinType}
                  </span>
                  <span className="text-[11px] text-[#696155] italic">
                    {rev.productName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Write Review */}
        {showReviewModal && (
          <div
            id="review-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowReviewModal(false);
            }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-[#FAF7F2] w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-[#DDD3C2] shadow-2xl relative">
              <h3 className="font-display text-2xl font-semibold text-[#1C2C20] mb-1">
                Share Your Genuine Review
              </h3>
              <p className="text-xs text-[#6E675D] mb-5">
                We value honest, real customer feedback for our botanical
                artisanal soaps.
              </p>

              {formSubmitted ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#E5EFE6] text-[#263E2E] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-display text-xl font-bold text-[#1C2C20]">
                    Thank You for Your Feedback!
                  </h4>
                  <p className="text-xs text-[#635B50] mt-1">
                    Your genuine review has been added to our page.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitReview}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-semibold text-[#3D372F] mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="e.g. Nikita, Priya, Rahul..."
                      className="w-full bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#3D372F] mb-1">
                        City / Location
                      </label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="e.g. Surat, Mumbai, Delhi, Jaipur"
                        className="w-full bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#3D372F] mb-1">
                        Skin Type
                      </label>
                      <input
                        type="text"
                        value={newSkinType}
                        onChange={(e) => setNewSkinType(e.target.value)}
                        placeholder="e.g. Sensitive / Oily / Normal"
                        className="w-full bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D372F] mb-1">
                      Soap / Combo Purchased
                    </label>
                    <select
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      className="w-full bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                    >
                      <option value="Charcoal Soap (₹99)">
                        Charcoal Soap — ₹99 (Deep Detox &amp; Oil Control)
                      </option>
                      <option value="Rice Soap (₹149)">
                        Rice Soap — ₹149 (Tan Removal &amp; Softening)
                      </option>
                      <option value="Bridal Ubtan Soap (₹199)">
                        Bridal Ubtan Soap — ₹199 (18 Ayurvedic Herbs Glow)
                      </option>
                      <option value="Rice + Charcoal Combo (₹179)">
                        Rice + Charcoal Combo — ₹179 (1 Rice + 1 Charcoal)
                      </option>
                      <option value="3-in-1 Daily Radiance Trio (₹399)">
                        3-in-1 Daily Radiance Trio — ₹399 (1 Rice + 1 Charcoal +
                        1 Ubtan)
                      </option>
                      <option value="4-in-1 Charcoal Max Combo (₹449)">
                        4-in-1 Charcoal Max Combo — ₹449 (2 Charcoal + 1 Rice +
                        1 Ubtan)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D372F] mb-1">
                      Star Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating
                                ? "fill-[#C48039] text-[#C48039]"
                                : "text-[#DDD3C2]"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D372F] mb-1">
                      Review Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Very soft on skin, completely natural aroma"
                      className="w-full bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D372F] mb-1">
                      Your Honest Review
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Tell us how the lather, fragrance and skin feel after use..."
                      className="w-full bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      className="px-4 py-2 rounded-lg text-[#6B6459] hover:bg-[#EAE2D5]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-[#263E2E] text-white font-semibold hover:bg-[#1A2D20]"
                    >
                      Post Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
