package com.organicbloom.controller;

import com.organicbloom.data.CatalogData;
import com.organicbloom.service.CartService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** Values injected into every rendered view (cart badge + brand info). */
@ControllerAdvice
public class GlobalModelAdvice {

    private final CartService cartService;

    public GlobalModelAdvice(CartService cartService) {
        this.cartService = cartService;
    }

    @ModelAttribute
    public void addGlobals(HttpSession session, org.springframework.ui.Model model) {
        model.addAttribute("cartCount", cartService.totalCount(session));
        model.addAttribute("brandName", CatalogData.Brand.NAME);
        model.addAttribute("brandInstagram", CatalogData.Brand.INSTAGRAM);
        model.addAttribute("brandInstagramUrl", CatalogData.Brand.INSTAGRAM_URL);
        model.addAttribute("brandWhatsappUrl", CatalogData.Brand.WHATSAPP_URL);
        model.addAttribute("brandPhone", CatalogData.Brand.PHONE);
        model.addAttribute("brandPhoneFormatted", CatalogData.Brand.PHONE_FORMATTED);
        model.addAttribute("brandEmail", CatalogData.Brand.EMAIL);
        model.addAttribute("brandUpiId", CatalogData.Brand.UPI_ID);
        model.addAttribute("brandBankName", CatalogData.Brand.BANK_NAME);
        model.addAttribute("freeDeliveryThreshold", CatalogData.Brand.FREE_DELIVERY_THRESHOLD);
    }
}
