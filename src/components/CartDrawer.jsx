import React, { useState } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Tag,
  Truck,
  MapPin,
} from "lucide-react";

export const CartDrawer = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onOpenCheckout,
}) => {
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [selectedSample, setSelectedSample] = useState("Rice Soap Mini Sample");

  if (!isOpen) return null;

  // Free shipping on ₹499 or more
  const FREE_SHIPPING_THRESHOLD = 499;

  const rawSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.percentOff > 0) {
      discountAmount = Math.round(
        (rawSubtotal * appliedPromo.percentOff) / 100,
      );
    } else if (appliedPromo.fixedOff > 0) {
      discountAmount = Math.min(rawSubtotal, appliedPromo.fixedOff);
    }
  }

  const subtotal = Math.max(0, rawSubtotal - discountAmount);
  const qualifiesForFreeShipping =
    rawSubtotal >= FREE_SHIPPING_THRESHOLD || appliedPromo?.code === "FREESHIP";
  const shippingFee = qualifiesForFreeShipping || cart.length === 0 ? 0 : 40;
  const grandTotal = subtotal + shippingFee;

  const progressToFreeShipping = Math.min(
    100,
    (rawSubtotal / FREE_SHIPPING_THRESHOLD) * 100,
  );
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - rawSubtotal,
  );

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError("");
    const code = (promoInput || "").trim().toUpperCase();

    if (code === "BLOOM10") {
      setAppliedPromo({
        code: "BLOOM10",
        percentOff: 10,
        fixedOff: 0,
      });
      setPromoInput("");
    } else if (
      code === "ORGANIC50" ||
      code === "BLOOM50" ||
      code === "AHMEDABAD"
    ) {
      setAppliedPromo({ code: "ORGANIC50", percentOff: 0, fixedOff: 50 });
      setPromoInput("");
    } else if (code === "FREESHIP") {
      setAppliedPromo({ code: "FREESHIP", percentOff: 0, fixedOff: 0 });
      setPromoInput("");
    } else {
      setPromoError('Invalid code. Try "BLOOM10", "ORGANIC50" or "FREESHIP"');
    }
  };

  const sampleOptions = [
    "Rice Soap Mini Sample (Tan Removal)",
    "Charcoal Soap Mini Sample (Deep Detox)",
    "Bridal Ubtan Glow Mini Sample (18 Herbs)",
  ];

  return (
    <div
      id="cart-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in"
    >
      <div
        id="cart-drawer"
        className="bg-[#FAF7F2] w-full max-w-md h-full shadow-2xl border-l border-[#E4DCCF] flex flex-col justify-between overflow-hidden animate-slide-left"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E8DFD3] flex items-center justify-between bg-[#F5EFE6]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#263E2E]" />
            <h2 className="font-display text-xl font-semibold text-[#1C2C20]">
              Your Soap Bag
            </h2>
            <span className="text-xs bg-[#E5EFE5] text-[#263E2E] font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6B6459] hover:text-[#2C2926] hover:bg-[#EAE2D5] transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-[#EAF2EB] px-5 py-3 border-b border-[#D7E6D9]">
          <div className="flex items-center justify-between text-xs text-[#263E2E] font-medium mb-1.5">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              {qualifiesForFreeShipping ? (
                <span className="font-bold">
                  You unlocked FREE Pan-India Delivery!
                </span>
              ) : (
                <span>
                  Add{" "}
                  <strong className="font-bold">
                    ₹{remainingForFreeShipping}
                  </strong>{" "}
                  more for Free Shipping
                </span>
              )}
            </div>
            <span className="font-bold">
              {Math.round(progressToFreeShipping)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#D3E4D6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#263E2E] transition-all duration-300 rounded-full"
              style={{ width: `${progressToFreeShipping}%` }}
            />
          </div>
        </div>

        {/* Cart Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-[#736B61] space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#EAE2D5] flex items-center justify-center mx-auto text-[#263E2E]">
                <ShoppingBag className="w-6 h-6 opacity-60" />
              </div>
              <p className="font-display text-xl text-[#2C2926]">
                Your bag is currently empty
              </p>
              <p className="text-xs max-w-xs mx-auto">
                Explore our Rice Soap (₹149), Charcoal Soap (₹100), Bridal Ubtan
                (₹199), and 4-in-1 Combo (₹449).
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-full bg-[#263E2E] text-white text-xs font-semibold hover:bg-[#1A2E20]"
              >
                Discover Collection
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3.5 rounded-xl bg-white border border-[#E4DCCF] flex gap-3 shadow-2xs items-center"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#EFE9DF] shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-sm font-semibold text-[#1C2C20] truncate">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-[#968E82] hover:text-[#B33927] p-0.5 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-[#7A7267] line-clamp-1">
                    {item.product.category === "bar"
                      ? "Handmade soap bar"
                      : "Value combo pack"}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-[#DDD3C2] rounded-full bg-[#FAF7F2] px-1.5 py-0.5">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="p-0.5 text-[#655E53] hover:text-[#2C2926] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#2C2926]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="p-0.5 text-[#655E53] hover:text-[#2C2926] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="font-display text-sm font-bold text-[#1C2C20]">
                      ₹{item.product.price * item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Complimentary Sample Picker */}
          {cart.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E6DCCF] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#263E2E]">
                <Sparkles className="w-3.5 h-3.5 text-[#C48039]" />
                <span>Complimentary Handmade Sample Bar</span>
              </div>
              <p className="text-[11px] text-[#6E665B]">
                Included free with your order to try our other signature bar:
              </p>
              <select
                value={selectedSample}
                onChange={(e) => setSelectedSample(e.target.value)}
                className="w-full text-xs bg-white border border-[#DDD3C2] rounded-lg px-2.5 py-1.5 text-[#2C2926] focus:outline-none"
              >
                {sampleOptions.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s} (Free)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Promo Code Input */}
          {cart.length > 0 && (
            <div className="pt-2">
              {appliedPromo ? (
                <div className="flex items-center justify-between p-2.5 bg-[#E4ECE4] rounded-lg text-xs text-[#263E2E]">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-bold">
                      Code applied: {appliedPromo.code}
                    </span>
                    {appliedPromo.percentOff > 0 && (
                      <span>(-{appliedPromo.percentOff}%)</span>
                    )}
                    {appliedPromo.fixedOff > 0 && (
                      <span>(-₹{appliedPromo.fixedOff})</span>
                    )}
                  </div>
                  <button
                    onClick={() => setAppliedPromo(null)}
                    className="text-xs underline font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code (e.g. BLOOM10, ORGANIC50)"
                    className="flex-1 text-xs bg-white border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926] uppercase"
                  />

                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#E7E0D3] text-[#2C2926] hover:bg-[#DDD4C5] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
              {promoError && (
                <p className="text-[11px] text-[#B33927] mt-1">{promoError}</p>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-5 bg-[#F5EFE6] border-t border-[#E8DFD3] space-y-3">
            <div className="space-y-1.5 text-xs text-[#5D554B]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{rawSubtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#263E2E] font-medium">
                  <span>Special Discount</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Pan-India Delivery</span>
                <span>
                  {shippingFee === 0 ? (
                    <strong className="text-[#263E2E]">FREE</strong>
                  ) : (
                    `₹${shippingFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1C2C20] pt-2 border-t border-[#DDD3C2]">
                <span className="font-display">Estimated Total</span>
                <span className="font-display text-lg">₹{grandTotal}</span>
              </div>
            </div>

            <button
              id="proceed-checkout-btn"
              onClick={() => {
                onClose();
                onOpenCheckout(
                  discountAmount,
                  appliedPromo?.code || "",
                  selectedSample,
                );
              }}
              className="w-full py-3.5 px-4 rounded-full bg-[#263E2E] text-[#FAF7F2] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#1A2E20] transition-colors shadow-sm cursor-pointer group"
            >
              <span>Proceed to Checkout — ₹{grandTotal}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="text-[10px] text-center text-[#827B70] flex items-center justify-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#263E2E]" />
              <span>
                Handcrafted Botanical Bars • Pan-India Delivery • 100% Pure
                Herbs
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
