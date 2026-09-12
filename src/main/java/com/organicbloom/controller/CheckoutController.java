package com.organicbloom.controller;

import com.organicbloom.model.CartItem;
import com.organicbloom.service.CartService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Controller
public class CheckoutController {

    private final CartService cartService;

    public CheckoutController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/checkout")
    public String checkout(HttpSession session, Model model, RedirectAttributes ra) {
        List<CartItem> items = cartService.items(session);
        if (items.isEmpty()) {
            ra.addFlashAttribute("flash", "Your bag is empty. Add a soap before checking out.");
            return "redirect:/cart";
        }
        model.addAttribute("items", items);
        model.addAttribute("subtotal", cartService.subtotal(session));
        model.addAttribute("shipping", cartService.shipping(session));
        model.addAttribute("total", cartService.total(session));
        return "checkout";
    }

    @PostMapping("/checkout")
    public String placeOrder(@RequestParam String fullName,
                             @RequestParam String phone,
                             @RequestParam String address,
                             @RequestParam String city,
                             @RequestParam String pincode,
                             @RequestParam(defaultValue = "COD") String payment,
                             HttpSession session,
                             Model model,
                             RedirectAttributes ra) {
        List<CartItem> items = cartService.items(session);
        if (items.isEmpty()) {
            ra.addFlashAttribute("flash", "Your bag is empty.");
            return "redirect:/cart";
        }
        int total = cartService.total(session);
        int itemCount = cartService.totalCount(session);
        String orderId = "OB-" + ThreadLocalRandom.current().nextInt(100000, 999999);

        model.addAttribute("orderId", orderId);
        model.addAttribute("fullName", fullName);
        model.addAttribute("phone", phone);
        model.addAttribute("address", address);
        model.addAttribute("city", city);
        model.addAttribute("pincode", pincode);
        model.addAttribute("payment", payment);
        model.addAttribute("items", items);
        model.addAttribute("total", total);
        model.addAttribute("itemCount", itemCount);

        cartService.clear(session);
        return "confirmation";
    }
}
