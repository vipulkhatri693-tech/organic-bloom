package com.organicbloom.controller;

import com.organicbloom.service.CartService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/cart")
    public String cart(HttpSession session, Model model) {
        populate(session, model);
        return "cart";
    }

    @PostMapping("/cart/add")
    public String add(@RequestParam String productId,
                      @RequestParam(defaultValue = "1") int quantity,
                      @RequestParam(defaultValue = "/cart") String redirect,
                      HttpSession session) {
        cartService.add(session, productId, quantity);
        return "redirect:" + safeRedirect(redirect);
    }

    @PostMapping("/cart/update")
    public String update(@RequestParam String productId,
                         @RequestParam int quantity,
                         HttpSession session) {
        cartService.setQuantity(session, productId, quantity);
        return "redirect:/cart";
    }

    @PostMapping("/cart/remove")
    public String remove(@RequestParam String productId, HttpSession session) {
        cartService.remove(session, productId);
        return "redirect:/cart";
    }

    private void populate(HttpSession session, Model model) {
        model.addAttribute("items", cartService.items(session));
        model.addAttribute("subtotal", cartService.subtotal(session));
        model.addAttribute("shipping", cartService.shipping(session));
        model.addAttribute("total", cartService.total(session));
    }

    private String safeRedirect(String redirect) {
        // Only allow app-internal redirects.
        if (redirect == null || !redirect.startsWith("/") || redirect.startsWith("//")) {
            return "/cart";
        }
        return redirect;
    }
}
