import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Eye,
  Plus,
  Check,
  Star,
  Filter,
  Heart,
  ShoppingBag,
} from "lucide-react";

export const ProductCatalog = ({
  products,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  onQuickView,
  onAddToCart,
}) => {
  const [selectedSkinFilter, setSelectedSkinFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [addedProductId, setAddedProductId] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [cardViewMode, setCardViewMode] = useState({});

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleAddWithFeedback = (product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1400);
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Specific category filter
        if (activeCategory === "rice") return p.id === "rice-soap";
        if (activeCategory === "charcoal") return p.id === "charcoal-soap";
        if (activeCategory === "bridal") return p.id === "bridal-ubtan-soap";
        if (activeCategory === "bar" && p.category !== "bar") return false;
        if (activeCategory === "bundle" && p.category !== "bundle")
          return false;

        // Skin type filter
        if (
          selectedSkinFilter === "sensitive" ||
          selectedSkinFilter === "oily"
        ) {
          const targetTag =
            selectedSkinFilter === "sensitive" ? "Sensitive" : "Oily";
          if (!p.skinType.includes(targetTag)) return false;
        }
        if (selectedSkinFilter === "bridal") {
          // "Festive Bridal Glow" isn't a skin-type tag — it means products
          // built around the Bridal Ubtan soap (18-herb festive glow).
          if (!(
            p.id === "bridal-ubtan-soap" ||
            p.id === "combo-trio" ||
            p.id === "combo-charcoal-max"
          )) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSub = p.subtitle.toLowerCase().includes(q);
          const matchBotanicals = p.keyBotanicals.some((b) =>
            b.toLowerCase().includes(q),
          );
          const matchIngredients = p.fullIngredients.some((i) =>
            i.toLowerCase().includes(q),
          );
          return matchName || matchSub || matchBotanicals || matchIngredients;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        // Default featured: combos first, then bridal ubtan, then rice, then charcoal
        return (b.badge ? 1 : 0) - (a.badge ? 1 : 0);
      });
  }, [products, activeCategory, selectedSkinFilter, searchQuery, sortBy]);

  const categories = [
    { id: "all", label: "All Soaps & Combos (6)" },
    { id: "bar", label: "Individual Soaps (3)" },
    { id: "bundle", label: "Value Combos (3 Deals)" },
    { id: "rice", label: "🌾 Rice Soap (₹149)" },
    { id: "charcoal", label: "🖤 Charcoal Soap (₹99)" },
    { id: "bridal", label: "✨ Bridal Ubtan (₹199)" },
  ];

  const skinTypes = [
    { id: "all", label: "All Skin Needs" },
    { id: "sensitive", label: "Tan Removal & Gentle" },
    { id: "oily", label: "Deep Pore Detox & Oily" },
    { id: "bridal", label: "Festive Bridal Glow" },
  ];

  return (
    <section
      id="collection"
      className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#E8DFD3] gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#263E2E] uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C48039]" />
            <span>Organic Bloom Handcrafted Collection</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1C2C20]">
            Handmade Goodness for Healthy, Glowing Skin
          </h2>
          <p className="text-sm text-[#5F584E] mt-2 max-w-2xl">
            Sulfate &amp; paraben free, Melt &amp; Pour artisan soaps crafted in
            small batches. Pure natural base is melted down and infused with
            active botanical herbs. Available individually or in high-value
            combo packs!
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <label
            htmlFor="sort-select"
            className="text-xs font-medium text-[#655E54] shrink-0"
          >
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-medium bg-[#FAF7F2] border border-[#DDD3C2] rounded-lg px-3 py-2 text-[#2C2926] focus:outline-none focus:border-[#263E2E] cursor-pointer"
          >
            <option value="featured">Featured &amp; Best Values</option>
            <option value="price-low">Price: Low to High (from ₹100)</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeCategory === cat.id
                ? "bg-[#263E2E] text-[#FAF7F2] shadow-xs"
                : "bg-[#F2ECE2] text-[#4E483F] hover:bg-[#E5DDCF]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sub-Filter: Skin Target Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-[#F8F4ED] p-3 rounded-xl border border-[#E9E0D3]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#655E54] mr-2">
          <Filter className="w-3.5 h-3.5 text-[#263E2E]" />
          <span>Skin Goal:</span>
        </div>
        {skinTypes.map((st) => (
          <button
            key={st.id}
            onClick={() => setSelectedSkinFilter(st.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedSkinFilter === st.id
                ? "bg-[#263E2E] text-white"
                : "bg-white text-[#4A433A] hover:bg-[#EFE7DC] border border-[#DED3C4]"
            }`}
          >
            {st.label}
          </button>
        ))}

        {/* Clear search badge if active */}
        {searchQuery && (
          <div className="ml-auto flex items-center gap-2 text-xs bg-[#E4ECE4] text-[#263E2E] px-2.5 py-1 rounded-md">
            <span>Query: &ldquo;{searchQuery}&rdquo;</span>
            <button
              onClick={() => setSearchQuery("")}
              className="hover:font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD3]">
          <p className="font-display text-2xl text-[#2C2926]">
            No products found
          </p>
          <p className="text-sm text-[#6C655A] mt-2">
            Try resetting your search query or selecting another filter.
          </p>
          <button
            onClick={() => {
              setActiveCategory("all");
              setSelectedSkinFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 px-4 py-2 bg-[#263E2E] text-white rounded-full text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {filteredProducts.map((product) => {
          const isWishlisted = wishlist.includes(product.id);
          const isJustAdded = addedProductId === product.id;
          const isSpecialMaxCombo = product.id === "combo-charcoal-max";
          const isCropped = cardViewMode[product.id] === "crop";
          const displayedImage =
            isCropped && product.secondaryImage
              ? product.secondaryImage
              : product.image;

          return (
            <div
              key={product.id}
              id={`product-${product.id}`}
              className={`group bg-[#FAF7F2] rounded-2xl overflow-hidden border shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                isSpecialMaxCombo
                  ? "border-2 border-[#C48039] ring-2 ring-[#F4E3CB]/60"
                  : "border-[#E6DDCF]"
              }`}
            >
              {/* Product Visual Container */}
              <div className="relative aspect-[4/3] bg-[#EFE9DF] overflow-hidden">
                <img
                  src={displayedImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />

                {/* Badges */}
                {product.badge && (
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[#263E2E] text-[#FAF7F2] shadow-sm">
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Image View Toggle: Poster vs Cropped Bar */}
                {product.secondaryImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardViewMode((prev) => ({
                        ...prev,
                        [product.id]:
                          prev[product.id] === "crop" ? "poster" : "crop",
                      }));
                    }}
                    className="absolute top-3 right-13 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-xs text-[#263E2E] shadow-sm hover:bg-white border border-[#DDD3C5] transition-all cursor-pointer flex items-center gap-1"
                    title="Toggle between Poster and Cropped Soap Bar"
                  >
                    <span>{isCropped ? "🧼 Soap Close-up" : "📄 Poster"}</span>
                  </button>
                )}

                {/* Wishlist Heart Icon */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#554E44] hover:text-[#B33927] transition-colors shadow-xs cursor-pointer"
                  aria-label="Add to wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted ? "fill-[#B33927] text-[#B33927]" : ""
                    }`}
                  />
                </button>

                {/* Hover Quick View Trigger */}
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4">
                  <button
                    onClick={() => onQuickView(product)}
                    className="px-4 py-2 rounded-full bg-[#FAF7F2]/95 backdrop-blur-sm text-[#263E2E] text-xs font-semibold flex items-center gap-1.5 shadow-md hover:bg-[#FFFFFF] transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Formulation</span>
                  </button>
                </div>

                {/* Category Pill Tag on image */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white">
                    {product.category === "bundle"
                      ? "Value Pack"
                      : "Handmade Bar"}
                  </span>
                  <span className="text-[10px] text-white/90 bg-[#263E2E]/80 backdrop-blur-xs px-2 py-0.5 rounded">
                    Pure Botanical
                  </span>
                </div>
              </div>

              {/* Product Info Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Rating & Origin */}
                  <div className="flex items-center justify-between text-xs text-[#6B645A] mb-1.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#C48039] text-[#C48039]" />
                      <span className="font-bold text-[#2C2926]">
                        {product.rating}
                      </span>
                      <span>({product.reviewCount})</span>
                    </div>
                    <span className="text-[11px] text-[#263E2E] bg-[#E8EFE8] px-2 py-0.5 rounded font-semibold">
                      {product.id.includes("rice")
                        ? "Rice Extract"
                        : product.id.includes("charcoal")
                          ? "Bamboo Charcoal"
                          : product.id.includes("bridal")
                            ? "18 Vedic Herbs"
                            : "Full Routine"}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="font-display text-xl font-bold text-[#1C2C20] group-hover:text-[#263E2E] transition-colors leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#6B6459] mt-1 font-serif-sub line-clamp-1">
                    {product.subtitle}
                  </p>

                  {/* Key Botanicals Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {product.keyBotanicals.slice(0, 3).map((herb, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium bg-[#F1EBE0] text-[#554E45] px-2 py-0.5 rounded-full"
                      >
                        {herb}
                      </span>
                    ))}
                  </div>

                  {/* Key Benefit Description Snippet */}
                  <p className="text-xs text-[#524B41] mt-3 leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                </div>

                {/* Price & Add to Bag Footer */}
                <div className="mt-5 pt-3.5 border-t border-[#E8DFD3] flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-2xl font-bold text-[#1C2C20]">
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-[#8A8277] line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                      {product.originalPrice && (
                        <span className="text-[11px] text-[#263E2E] font-bold">
                          Save ₹{product.originalPrice - product.price}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#7A7368]">
                      {product.category === "bar"
                        ? "100% Pure Natural Herbs"
                        : "Combo Discount Pack"}
                    </span>
                  </div>

                  <button
                    id={`add-to-cart-btn-${product.id}`}
                    onClick={() => handleAddWithFeedback(product)}
                    className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                      isJustAdded
                        ? "bg-[#528C5F] text-white scale-105"
                        : "bg-[#263E2E] text-[#FAF7F2] hover:bg-[#1A2D20] shadow-xs hover:shadow-sm"
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special Callout for the 4-in-1 Charcoal Max Combo */}
      <div className="mt-12 bg-gradient-to-r from-[#263E2E] to-[#1C2C20] text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-[#3E5C46] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#E3B873] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Best Seller Value Pack</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
            4-in-1 Charcoal Max Combo for ₹449
          </h3>
          <p className="text-xs sm:text-sm text-[#C4D9C8] max-w-xl">
            Get{" "}
            <strong>
              2 Charcoal Soaps + 1 Rice Soap + 1 Bridal Ubtan Soap
            </strong>{" "}
            in one curated box. Deep pore detox for the week, daily rice
            brightening, and traditional wedding-level haldi chandan glow on
            weekends.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-[#E3B873] pt-1">
            <span>✓ 2 Charcoal (₹200)</span>
            <span>✓ 1 Rice Soap (₹149)</span>
            <span>✓ 1 Bridal Ubtan (₹199)</span>
            <span className="font-bold text-white bg-[#34533D] px-2 py-0.5 rounded">
              You Pay Only ₹449
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            const combo = products.find((p) => p.id === "combo-charcoal-max");
            if (combo) handleAddWithFeedback(combo);
          }}
          className="px-6 py-3.5 rounded-full bg-[#E3B873] hover:bg-[#D4A760] text-[#1C2C20] font-bold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-md flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add 4-in-1 Combo (₹449)</span>
        </button>
      </div>
    </section>
  );
};
