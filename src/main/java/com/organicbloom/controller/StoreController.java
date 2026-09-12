package com.organicbloom.controller;

import com.organicbloom.data.CatalogData;
import com.organicbloom.model.Product;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Comparator;
import java.util.List;

@Controller
public class StoreController {

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("products", CatalogData.PRODUCTS);
        model.addAttribute("pillars", CatalogData.PILLARS);
        model.addAttribute("craftSteps", CatalogData.CRAFT_STEPS);
        model.addAttribute("faqs", CatalogData.FAQS);
        model.addAttribute("heroCombos", List.of(
                CatalogData.findById("combo-charcoal-max"),
                CatalogData.findById("combo-trio"),
                CatalogData.findById("combo-rice-ubtan")
        ));
        return "index";
    }

    @GetMapping("/product/{id}")
    public String product(@PathVariable String id, Model model, RedirectAttributes ra) {
        Product product = CatalogData.findById(id);
        if (product == null) {
            ra.addFlashAttribute("flash", "That soap could not be found.");
            return "redirect:/";
        }
        List<Product> related = CatalogData.PRODUCTS.stream()
                .filter(p -> !p.id().equals(id))
                .sorted(Comparator.comparingDouble(Product::rating).reversed())
                .limit(3)
                .toList();
        model.addAttribute("product", product);
        model.addAttribute("related", related);
        return "product";
    }
}
