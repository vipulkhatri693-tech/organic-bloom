import React, { useState } from "react";
import {
  X,
  Star,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";

export const ProductQuickView = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const currentImage = selectedImage || product.image;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div
      id="quickview-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div
        id="quickview-modal"
        className="bg-[#FAF7F2] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E4DCCF] overflow-hidden relative my-auto max-h-[92vh] flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#4A443A] hover:text-[#2C2926] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Product Images */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-[#F5EFE6] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E6DCCF]">
          <div className="relative aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden shadow-sm bg-[#FAF7F2]">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />

            {product.badge && (
              <span className="absolute top-3 left-3 bg-[#263E2E] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {product.badge}
              </span>
            )}
          </div>

          {/* Secondary Thumbnail selector */}
          {product.secondaryImage && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setSelectedImage(product.image)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-2 transition-all cursor-pointer bg-white ${
                  currentImage === product.image
                    ? "border-[#263E2E] shadow-xs"
                    : "border-[#E6DDD0] opacity-75 hover:opacity-100"
                }`}
              >
                <div className="w-9 h-9 rounded overflow-hidden">
                  <img
                    src={product.image}
                    alt="Official Poster"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#2C2926]">
                  Poster View
                </span>
              </button>

              <button
                onClick={() => setSelectedImage(product.secondaryImage)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-2 transition-all cursor-pointer bg-white ${
                  currentImage === product.secondaryImage
                    ? "border-[#263E2E] shadow-xs"
                    : "border-[#E6DDD0] opacity-75 hover:opacity-100"
                }`}
              >
                <div className="w-9 h-9 rounded overflow-hidden">
                  <img
                    src={product.secondaryImage}
                    alt="Artisan Soap Close-up"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#2C2926]">
                  Cropped Soap Bar
                </span>
              </button>
            </div>
          )}

          {/* Small batch metadata pill */}
          <div className="mt-6 pt-4 border-t border-[#E8DFD3] flex items-center justify-between text-xs text-[#5D554C]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#263E2E]" />
              <span>100% Pure Natural Herb Extracts</span>
            </div>
            {product.cureTimeWeeks > 0 && (
              <span>Aged {product.cureTimeWeeks} Weeks</span>
            )}
          </div>
        </div>

        {/* Right: Product Details & Controls */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto max-h-[75vh] md:max-h-[90vh]">
          {/* Header & Rating */}
          <div className="flex items-center gap-2 text-xs text-[#6B645A] mb-1.5">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#C48039] text-[#C48039]" />
              <span className="font-bold text-[#2C2926]">{product.rating}</span>
            </div>
            <span>•</span>
            <span>{product.reviewCount} customer reviews</span>
            <span>•</span>
            <span className="text-[#263E2E] font-medium">
              {product.scentFamily}
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C2C20]">
            {product.name}
          </h2>
          <p className="text-xs text-[#807669] italic mt-0.5">
            {product.subtitle}
          </p>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mt-3 pb-4 border-b border-[#E8DFD3]">
            <span className="font-display text-3xl font-bold text-[#1C2C20]">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-[#888176] line-through">
                ₹{product.originalPrice}
              </span>
            )}
            {product.originalPrice && (
              <span className="text-xs font-bold text-[#263E2E] bg-[#E8EFE8] px-2 py-0.5 rounded">
                Save ₹{product.originalPrice - product.price}
              </span>
            )}
            <span className="text-xs text-[#605A51] ml-auto">
              {product.category === "bundle"
                ? "Value Combo Pack"
                : "Handmade Melt & Pour Bar"}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#50493F] leading-relaxed mt-4">
            {product.description}
          </p>

          {/* Aromatherapy Notes Pyramid */}
          <div className="mt-5 p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E6DDCE] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#263E2E] block">
              Aromatherapeutic Notes
            </span>
            <div className="text-xs space-y-1">
              <div className="flex gap-2">
                <span className="font-semibold text-[#665F55] w-14 shrink-0">
                  Top:
                </span>
                <span className="text-[#2C2926]">
                  {product.topNotes.join(", ")}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-[#665F55] w-14 shrink-0">
                  Heart:
                </span>
                <span className="text-[#2C2926]">
                  {product.heartNotes.join(", ")}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-[#665F55] w-14 shrink-0">
                  Base:
                </span>
                <span className="text-[#2C2926]">
                  {product.baseNotes.join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* Skin Benefits Checklist */}
          <div className="mt-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#263E2E] block mb-2">
              Key Skin Benefits
            </span>
            <ul className="space-y-1.5 text-xs text-[#524B41]">
              {product.benefits.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#263E2E] shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Saponified Ingredients */}
          <div className="mt-5 pt-4 border-t border-[#E8DFD3]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#263E2E] block mb-1">
              Botanical Ingredients
            </span>
            <p className="text-[11px] text-[#696155] leading-relaxed">
              {product.fullIngredients.join(" • ")}
            </p>
            <span className="text-[10px] text-[#867E73] mt-1 block">
              *Certified Organic &amp; Fair-Trade ingredients. Zero palm oil,
              SLS, parabens, or synthetic fragrance.
            </span>
          </div>

          {/* Add to Cart Actions */}
          <div className="mt-6 pt-4 border-t border-[#E8DFD3] flex items-center gap-3">
            {/* Quantity Controls */}
            <div className="flex items-center border border-[#DDD3C2] rounded-full bg-white px-2 py-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1 text-[#655E53] hover:text-[#2C2926] cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-[#2C2926]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1 text-[#655E53] hover:text-[#2C2926] cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Bag Button */}
            <button
              onClick={handleAdd}
              className={`flex-1 py-3 px-5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                addedSuccess
                  ? "bg-[#528C5F] text-white"
                  : "bg-[#263E2E] text-[#FAF7F2] hover:bg-[#1B2F21] shadow-sm"
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Your Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag — ₹{product.price * quantity}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
