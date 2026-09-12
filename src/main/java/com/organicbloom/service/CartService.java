package com.organicbloom.service;

import com.organicbloom.data.CatalogData;
import com.organicbloom.model.CartItem;
import com.organicbloom.model.Product;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CartService {

    private static final String CART_KEY = "cart";

    @SuppressWarnings("unchecked")
    private Map<String, Integer> raw(HttpSession session) {
        Map<String, Integer> cart = (Map<String, Integer>) session.getAttribute(CART_KEY);
        if (cart == null) {
            cart = new LinkedHashMap<>();
            session.setAttribute(CART_KEY, cart);
        }
        return cart;
    }

    public void add(HttpSession session, String productId, int quantity) {
        if (CatalogData.findById(productId) == null || quantity <= 0) {
            return;
        }
        Map<String, Integer> cart = raw(session);
        cart.merge(productId, quantity, Integer::sum);
    }

    public void setQuantity(HttpSession session, String productId, int quantity) {
        Map<String, Integer> cart = raw(session);
        if (quantity <= 0) {
            cart.remove(productId);
        } else if (CatalogData.findById(productId) != null) {
            cart.put(productId, quantity);
        }
    }

    public void remove(HttpSession session, String productId) {
        raw(session).remove(productId);
    }

    public void clear(HttpSession session) {
        session.removeAttribute(CART_KEY);
    }

    public List<CartItem> items(HttpSession session) {
        List<CartItem> items = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : raw(session).entrySet()) {
            Product product = CatalogData.findById(entry.getKey());
            if (product != null) {
                items.add(new CartItem(product, entry.getValue()));
            }
        }
        return items;
    }

    public int totalCount(HttpSession session) {
        return raw(session).values().stream().mapToInt(Integer::intValue).sum();
    }

    public int subtotal(HttpSession session) {
        return items(session).stream().mapToInt(CartItem::getLineTotal).sum();
    }

    public int shipping(HttpSession session) {
        int subtotal = subtotal(session);
        if (subtotal == 0) {
            return 0;
        }
        return subtotal >= CatalogData.Brand.FREE_DELIVERY_THRESHOLD ? 0 : 49;
    }

    public int total(HttpSession session) {
        return subtotal(session) + shipping(session);
    }
}
