package com.organicbloom.data;

import com.organicbloom.model.Content;
import com.organicbloom.model.Product;

import java.util.List;

/** Static, hand-ported catalog and content data (mirrors the original data/soaps.ts). */
public final class CatalogData {
    private CatalogData() {
    }

    public static final class Brand {
        public static final String NAME = "Organic Bloom";
        public static final String TAGLINE = "Naturally Better, Beautifully You";
        public static final String SUB_TAGLINE = "Melt & Pour • Pure Herbs • 100% Handmade";
        public static final String INSTAGRAM = "organic_bloom03";
        public static final String INSTAGRAM_URL = "https://www.instagram.com/organic_bloom03/";
        public static final String LOCATION = "Ahmedabad, Gujarat, India";
        public static final String EMAIL = "khatrinikita053@gmail.com";
        public static final String PHONE = "+919313268959";
        public static final String PHONE_FORMATTED = "+91 93132 68959";
        public static final String WHATSAPP_URL = "https://wa.me/919313268959";
        public static final String UPI_ID = "khatrinikita03@ybl";
        public static final String BANK_NAME = "HDFC Bank - 6686";
        public static final int FREE_DELIVERY_THRESHOLD = 499;
    }

    public static final List<Product> PRODUCTS = List.of(
            new Product(
                    "charcoal-soap", "Charcoal Soap", "Nature's Pure Touch for Radiant You",
                    "bar", 99, 149, 3.5, 5.0, 0,
                    "/images/charcoal-soap.svg", "/images/charcoal-soap-crop.svg",
                    "Deep Detox • Only ₹99", "Detox & Clarifying",
                    List.of("Oily", "Combination", "Normal", "All Skin Types"),
                    List.of("Activated Bamboo Charcoal", "Crisp Tea Tree"),
                    List.of("Eucalyptus Leaf", "Crushed Neem"),
                    List.of("Earthy Cedarwood", "Pure Castor Base"),
                    "Medium Botanical Scrub", "Dense Froth",
                    List.of("Steam-Activated Bamboo Charcoal", "Organic Tea Tree Leaf Oil",
                            "Cold-Pressed Neem Oil", "Extra Virgin Olive Oil", "Pure Coconut Oil"),
                    List.of("Pure Vegetable Glycerin Base", "Activated Bamboo Charcoal Powder",
                            "Melaleuca Alternifolia (Tea Tree) Oil", "Castor Seed Oil", "Neem Extract",
                            "Pure Spring Water"),
                    "Handcrafted using our authentic Melt & Pour artisan process: pure organic plant base is gently melted down, enriched with steam-activated bamboo charcoal, crisp tea tree, and pure neem extract, then hand-poured into our signature flower-petal carved mold. Deeply draws out impurities and controls excess oil without harsh chemical sulfates.",
                    List.of("Authentic Melt & Pour Process: 100% natural base melted and infused with pure herbs",
                            "Deep Cleansing & Detoxifying — draws out deep-seated impurities",
                            "Gentle on skin — formulated for daily morning and evening use",
                            "Controls excess sebum and prevents acne/breakouts",
                            "Paraben Free, Sulphate Free, Cruelty Free, Eco Friendly"),
                    1, true),
            new Product(
                    "rice-soap", "Rice Soap", "Gentle • Pure • Nourishing",
                    "bar", 149, 199, 3.8, 5.0, 0,
                    "/images/rice-soap.svg", "/images/rice-soap-crop.svg",
                    "Tan Removal & Softening", "Warm & Honey",
                    List.of("Sensitive", "Dry", "Normal", "All Skin Types"),
                    List.of("Organic Rice Milk Extract", "Sweet Almond Mist"),
                    List.of("Steamed Jasmine Rice", "Colloidal Oat Flour"),
                    List.of("Raw Shea Butter", "Pure Cold-Pressed Coconut"),
                    "Ultra Gentle", "Ultra Creamy",
                    List.of("Pure Fermented Rice Extract", "Cold-Pressed Sweet Almond Oil",
                            "Organic Coconut Oil", "Natural Plant Squalane", "Vitamin E"),
                    List.of("Pure Nourishing Plant Soap Base", "Oryza Sativa (Rice) Bran Extract",
                            "Sweet Almond Oil", "Organic Castor Oil", "Raw Shea Butter",
                            "Natural Vegetable Glycerin", "Pure Distilled Water"),
                    "Crafted via our artisanal Melt & Pour technique: pure nourishing soap base is melted down and infused with freshly extracted rice milk, sweet almond oil, and raw shea butter. Naturally fades stubborn sun tan, restores smooth texture, and provides a radiant, healthy glow.",
                    List.of("Artisanal Melt & Pour Method with direct fresh rice milk infusion",
                            "Brightens skin tone and visibly reduces sun tan",
                            "Imparts a soft, lit-from-within radiant skin glow",
                            "100% Sulfate & Paraben Free, gentle enough for daily face & body cleansing",
                            "Pure • Organic • Handmade with Botanical Care"),
                    1, true),
            new Product(
                    "bridal-ubtan-soap", "Bridal Ubtan Glow Soap",
                    "18 Authentic Ayurvedic Herbs • Haldi • Chandan • Kesar",
                    "bar", 199, 249, 4.2, 5.0, 0,
                    "/images/ubtan-soap.svg", "/images/ubtan-soap-crop.svg",
                    "18 Natural Herbs • Bestseller", "Earthy & Herbal",
                    List.of("All Skin Types", "Sensitive", "Dry", "Combination"),
                    List.of("Kashmiri Kesar (Saffron)", "Wild Turmeric (Kasturi Haldi)"),
                    List.of("Mysore Chandan (Sandalwood)", "Damask Rose Petals"),
                    List.of("Gram Flour (Besan)", "Golden Jojoba & Sweet Almond"),
                    "Ultra Gentle", "Velvety Bubbles",
                    List.of("18 Precious Ayurvedic Herbs", "Pure Kasturi Haldi",
                            "Sacred Chandan (Sandalwood)", "Kashmiri Kesar (Saffron)",
                            "Sun-Dried Rose Petals", "Sweet Almond Oil", "Besan (Gram Flour Exfoliant)"),
                    List.of("Pure Natural Plant Soap Base", "Kasturi Manjal (Wild Turmeric)",
                            "Santalum Album (Sandalwood) Powder", "Crocus Sativus (Saffron) Stigma Extract",
                            "Gram Flour (Besan)", "Rosa Damascena (Rose) Petal Powder",
                            "Licorice (Mulethi) Root Extract", "Sweet Almond Oil", "Natural Plant Glycerin"),
                    "Traditional Vedic Ubtan handcrafted through Melt & Pour artisan craft: pure natural base is completely melted, then blended with 18 sacred Ayurvedic herbs including Kasturi Haldi, Chandan, Kesar, and sweet almond. Imparts instant celebratory radiance and silky soft skin.",
                    List.of("Authentic Melt & Pour craft: Pure base melted and blended with 18 raw Ayurvedic herbs",
                            "Infused with Haldi, Chandan, Kesar for bridal-level radiance",
                            "Effective natural de-tanning and gentle botanical micro-exfoliation",
                            "Nourishes, hydrates & enhances natural skin glow",
                            "100% Handcrafted Artisanal Soaps • Zero Chemical Detergents"),
                    1, true),
            new Product(
                    "combo-rice-ubtan", "Rice + Charcoal Radiance Combo",
                    "1 Rice Soap + 1 Charcoal Soap",
                    "bundle", 179, 248, 7.3, 5.0, 0,
                    "/images/charcoal-soap-crop.svg", "/images/rice-soap-crop.svg",
                    "Special Combo • ₹179 (Save ₹69)", "Detox & Clarifying",
                    List.of("All Skin Types", "Oily", "Combination", "Sensitive"),
                    List.of("Rice Milk Brightening", "Activated Bamboo Charcoal"),
                    List.of("Jasmine Rice & Almond", "Tea Tree & Eucalyptus"),
                    List.of("Raw Shea Butter", "Pure Coconut & Castor Base"),
                    "Medium Botanical Scrub", "Dense Froth",
                    List.of("1x Pure Rice Soap Bar (Softening, Tan Removal & Radiance — ₹149 MRP)",
                            "1x Activated Charcoal Soap Bar (Deep Pore Cleansing & Oil Control — ₹99 MRP)"),
                    List.of("Pure handcrafted Melt & Pour bundle containing 1 full-size Rice Soap and 1 full-size Activated Charcoal Soap, individually sealed to lock in moisture and active freshness."),
                    "Our daily detox-and-glow duo, handcrafted through our authentic Melt & Pour process, at an unbeatable combo price! Includes 1 Rice Soap for gentle skin lightening and daily softening, plus 1 Activated Charcoal Soap for deep pore cleansing and oil control. MRP ₹248, special combo price only ₹179!",
                    List.of("Great savings: 2 full-size Melt & Pour handcrafted soaps for just ₹179 (MRP ₹248, Save ₹69)",
                            "1x Rice Soap (₹149) + 1x Activated Charcoal Soap (₹99)",
                            "Complete daily routine: Deep detox cleansing with gentle brightening & softness",
                            "100% Sulfate & Paraben Free, handmade Melt & Pour botanical craft"),
                    1, true),
            new Product(
                    "combo-trio", "3-in-1 Daily Radiance Trio Combo",
                    "1 Rice + 1 Charcoal + 1 Bridal Ubtan Soap",
                    "bundle", 399, 447, 11.5, 5.0, 0,
                    "/images/combo-max.svg", "/images/charcoal-soap.svg",
                    "Trio Value Pack • ₹399", "Earthy & Herbal",
                    List.of("All Skin Types"),
                    List.of("Activated Charcoal Detox", "Rice Milk Nourish", "Ayurvedic Saffron"),
                    List.of("Tea Tree & Eucalyptus", "Sandalwood & Kasturi Haldi"),
                    List.of("Virgin Coconut & Cold-Pressed Almond Oil"),
                    "Medium Botanical Scrub", "Dense Froth",
                    List.of("1x Activated Charcoal Soap (Deep Pore Cleansing & Oil Control — ₹99 MRP)",
                            "1x Pure Rice Soap (Baby-Soft Texture & Tan Removal — ₹149 MRP)",
                            "1x Bridal Ubtan Glow Soap (18 Vedic Herbs & Festive Radiance — ₹199 MRP)"),
                    List.of("Complete trio of 3 signature handcrafted Melt & Pour botanical soaps, individually moisture-sealed to preserve herbal goodness."),
                    "The complete 3-soap spectrum! Experience every signature creation from our botanical workshop: 1 Charcoal Soap for deep oil control & detox, 1 Rice Soap for nourishing hydration & de-tan, and 1 Bridal Ubtan Soap for golden festive glow. Total MRP ₹447, available now for only ₹399!",
                    List.of("Complete 3-soap collection: 1 Rice + 1 Charcoal + 1 Bridal Ubtan for ₹399",
                            "Covers every skincare goal: Detox, De-tan, and Ayurvedic bridal glow",
                            "Handcrafted Melt & Pour process: Pure base gently melted and infused with raw herbs",
                            "Pan-India doorstep courier with COD and UPI options"),
                    1, true),
            new Product(
                    "combo-charcoal-max", "4-in-1 Charcoal Max Combo",
                    "2 Charcoal + 1 Rice + 1 Bridal Ubtan Soap",
                    "bundle", 449, 599, 15.0, 5.0, 0,
                    "/images/combo-max.svg", "/images/charcoal-soap-crop.svg",
                    "Super Saver • Save ₹150", "Earthy & Herbal",
                    List.of("All Skin Types"),
                    List.of("Charcoal Detox", "Rice Brightening", "Ubtan Saffron Glow"),
                    List.of("Sandalwood & Haldi", "Tea Tree & Eucalyptus"),
                    List.of("Pure Ayurvedic Carrier Oils"),
                    "Medium Botanical Scrub", "Ultra Creamy",
                    List.of("2x Activated Charcoal Bars (Deep Cleansing & Detoxifying, Only ₹99 each)",
                            "1x Pure Rice Soap Bar (Softening, Tan-Removal & Radiance)",
                            "1x Bridal Ubtan Glow Soap Bar (18-Herb Radiant De-tan)"),
                    List.of("Complete herbal set of 4 artisanal Melt & Pour soaps individually moisture-sealed to preserve active herbal freshness."),
                    "The ultimate complete family care bundle! Includes 2 Charcoal Soaps for deep oil control and detox, 1 Rice Soap for daily brightening and softness, and 1 Bridal Ubtan Soap for weekend radiance and de-tanning.",
                    List.of("Maximum savings: 4 premium artisan soaps for just ₹449 (MRP ₹599, Save ₹150)",
                            "Includes: 2 Charcoal + 1 Rice + 1 Bridal Ubtan",
                            "Complete 360° skin ritual: Detox, Brighten & Glow",
                            "Artisan Melt & Pour craft with pure melted base and active herb infusions",
                            "Moisture-Sealed Safe Dispatch with Pan-India delivery",
                            "Orders via WhatsApp +91 93132 68959 & Instagram @organic_bloom03"),
                    1, true)
    );

    public static final List<Content.Pillar> PILLARS = List.of(
            new Content.Pillar("Handcrafted Melt & Pour",
                    "Handcrafted in our botanical atelier using authentic Melt & Pour craft: pure natural base is gently melted down, enriched with active herbs, and hand-poured in micro-batches.",
                    "Artisanal Roots"),
            new Content.Pillar("Rice, Charcoal & 18 Herbs",
                    "Each soap solves a dedicated skin goal: gentle tan removal with pure Rice milk (₹149), deep detox with Charcoal (₹99), and luminous glow with 18 Vedic herbs (₹199), plus 3 value combos!",
                    "Targeted Natural Actives"),
            new Content.Pillar("100% Sulfate & Paraben Free",
                    "Zero SLS, zero petrochemicals, zero synthetic parabens or artificial hardening agents. Only pure saponified plant butters and skin-cherishing natural oils.",
                    "Clean & Honest Skin"),
            new Content.Pillar("Secure Pan-India Doorstep Delivery",
                    "Every bar is wrapped with moisture-resistant protective sealing to safeguard active herbal freshness, and safely dispatched across India with tracking.",
                    "Safe Courier Dispatch")
    );

    public static final List<Content.CraftStep> CRAFT_STEPS = List.of(
            new Content.CraftStep(1, "Pure Base Gentle Melting", "Step 1 • Low-Heat Melting",
                    "We start with a 100% pure, sulfate-free natural plant and vegetable glycerin base. The base is cut into even cubes and gently melted at controlled low temperatures, ensuring natural moisture is locked in without scorching or degrading the delicate base oils.",
                    "Controlled melting protects natural glycerin and avoids heat degradation of plant lipids.",
                    "/images/studio-melting-mixing.svg"),
            new Content.CraftStep(2, "Fresh Herb & Botanical Infusion", "Step 2 • Direct Herbal Blending",
                    "While the base is smoothly molten, we fold in authentic raw herbs and concentrated botanical extracts: steam-activated bamboo charcoal with tea tree, fresh organic rice milk extract with sweet almond, or 18 sacred Ayurvedic herbs including Kasturi Haldi, Chandan, and Kashmiri Kesar.",
                    "Herbs and botanical actives are blended directly into the liquid base for deep dermal efficacy.",
                    "/images/studio-melting-mixing.svg"),
            new Content.CraftStep(3, "Hand-Pouring & Floral Sculpting", "Step 3 • Atelier Micro-Batches",
                    "The herb-rich molten blend is carefully hand-poured into our signature custom molds in our botanical atelier, including our iconic flower-petal carved mold, then left to set and cure naturally without any artificial hardeners.",
                    "Natural setting preserves the botanical actives and gives each bar its signature sculpted finish.",
                    "/images/combo-max.svg")
    );

    public static final List<Content.Faq> FAQS = List.of(
            new Content.Faq("What are the 3 signature soaps and combos by Organic Bloom?",
                    "We handcraft 3 specialized Melt & Pour soaps: (1) Rice Soap (₹149) for baby-soft, radiant skin & de-tanning; (2) Charcoal Soap (₹99) for deep pore cleansing & oil control; and (3) Bridal Ubtan Glow Soap (₹199) with 18 precious Ayurvedic herbs for festive glow. We also offer 3 high-saving combos: Rice + Charcoal (₹179), 3-in-1 Radiance Trio: Rice + Charcoal + Ubtan (₹399), and the 4-in-1 Charcoal Max Combo: 2 Charcoal + 1 Rice + 1 Ubtan (₹449)."),
            new Content.Faq("What is the Melt & Pour artisan process you follow?",
                    "Our soaps are made using the authentic Melt & Pour process: We take 100% pure, natural, and sulfate-free plant base, gently melt it down at controlled low temperatures, and directly fold in real active herbs and extracts—such as freshly extracted rice milk, steam-activated bamboo charcoal, and 18 sacred Ayurvedic herbs like Haldi, Chandan, and Kesar. The molten botanical blend is hand-poured into artisanal molds to set naturally without harsh chemicals or artificial hardeners."),
            new Content.Faq("What combos are available and how much do I save?",
                    "We offer 3 value combos: (1) Rice + Charcoal Combo for just ₹179 (Original ₹248, Save ₹69!); (2) 3-in-1 Daily Radiance Trio (1 Rice + 1 Charcoal + 1 Bridal Ubtan) for ₹399 (Original ₹447, Save ₹48); and (3) 4-in-1 Charcoal Max Combo (2 Charcoal + 1 Rice + 1 Bridal Ubtan) for ₹449 (Original ₹599, Save ₹150!)."),
            new Content.Faq("Are your soaps 100% sulfate and paraben free?",
                    "Yes! All Organic Bloom soaps are 100% free from SLS/SLES sulfates, parabens, synthetic detergents, artificial hardeners, and mineral oils. They retain rich, natural vegetable glycerin to keep your skin hydrated and supple after every wash."),
            new Content.Faq("Where are you based and how do you ship?",
                    "Organic Bloom is based in Ahmedabad, Gujarat, India. We ship across India via reliable couriers with moisture-resistant protective packaging to preserve active herbal freshness. We accept Cash on Delivery (COD), PhonePe (UPI QR), and Google Pay. You can order directly via our Instagram @organic_bloom03, WhatsApp us at +91 93132 68959, or email khatrinikita053@gmail.com."),
            new Content.Faq("How long does each handcrafted bar last?",
                    "Our pure Melt & Pour bars are formulated to be dense and moisture-rich. When kept on a well-draining soap dish away from stagnant water, each bar provides 30 to 45 daily washes.")
    );

    public static Product findById(String id) {
        return PRODUCTS.stream().filter(p -> p.id().equals(id)).findFirst().orElse(null);
    }
}
