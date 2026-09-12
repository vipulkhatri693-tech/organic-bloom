package com.organicbloom.model;

import java.util.List;

/** Small value types for static storefront content sections. */
public final class Content {
    private Content() {
    }

    public record Faq(String question, String answer) {
    }

    public record CraftStep(int step, String title, String timeframe, String description, String detail, String image) {
    }

    public record Pillar(String title, String description, String tag) {
    }
}
