package com.organicbloom.model;

import java.util.List;

public record Product(
        String id,
        String name,
        String subtitle,
        String category,
        int price,
        Integer originalPrice,
        double weightOz,
        double rating,
        int reviewCount,
        String image,
        String secondaryImage,
        String badge,
        String scentFamily,
        List<String> skinType,
        List<String> topNotes,
        List<String> heartNotes,
        List<String> baseNotes,
        String exfoliationLevel,
        String latherProfile,
        List<String> keyBotanicals,
        List<String> fullIngredients,
        String description,
        List<String> benefits,
        int cureTimeWeeks,
        boolean inStock
) {
    public int savings() {
        return originalPrice == null ? 0 : Math.max(0, originalPrice - price);
    }

    public String primaryActive() {
        if (id.contains("rice")) return "Rice Extract";
        if (id.contains("charcoal")) return "Bamboo Charcoal";
        if (id.contains("bridal")) return "18 Vedic Herbs";
        return "Full Routine";
    }
}
