// Shared cloud sync layer (Firebase Firestore) for orders + complaint tickets.
//
// WHY THIS EXISTS:
// This is a static site with no backend server, so all data used to live only
// in each visitor's browser localStorage. That meant when a customer placed
// an order, submitted a UTR, or raised a complaint on THEIR phone, none of it
// ever reached the Host Portal unless they separately sent it over WhatsApp.
//
// This file pushes every order/complaint write to a shared Firestore database
// (using the same Firebase project already set up for OTP login) and lets the
// Host Portal subscribe to live updates from ANY device. If Firestore isn't
// configured/reachable (e.g. missing .env keys, or offline), everything
// silently falls back to the existing localStorage-only behaviour so nothing
// breaks — it just won't sync across devices until Firestore is set up.
//
// SETUP REQUIRED in the Firebase Console (console.firebase.google.com):
// 1. Build > Firestore Database > Create database (choose a region close to
//    India, e.g. asia-south1). Start in "test mode" is fine for now.
// 2. Rules tab — since customers are not Firebase-authenticated (host login
//    is a separate simple username/password system), use rules that allow
//    the app to read/write these two collections, e.g.:
//      rules_version = '2';
//      service cloud.firestore {
//        match /databases/{database}/documents {
//          match /orders/{orderId} { allow read, write: if true; }
//          match /complaints/{ticketId} { allow read, write: if true; }
//          match /products/{productId} { allow read, write: if true; }
//          match /siteContent/{docId} { allow read, write: if true; }
//        }
//      }
//    This is intentionally open (no backend to enforce auth) — acceptable for
//    a small storefront, but note it means anyone with the config could read/
//    write this data. Tighten later if needed.

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";

const ORDERS_COLLECTION = "orders";
const COMPLAINTS_COLLECTION = "complaints";
const PRODUCTS_COLLECTION = "products";
const CONTENT_COLLECTION = "siteContent";
const ANNOUNCEMENT_DOC_ID = "announcement";

export const isCloudSyncEnabled = () => isFirebaseConfigured && Boolean(db);

// ---------------- Orders ----------------

export const pushOrderToCloud = (order) => {
  if (!isCloudSyncEnabled() || !db) return;
  try {
    const cleanPayload = JSON.parse(
      JSON.stringify({ ...order, _updatedAt: Date.now() }),
    );
    setDoc(
      doc(collection(db, ORDERS_COLLECTION), order.orderNumber),
      cleanPayload,
      { merge: false },
    ).catch((e) =>
      console.error("[Organic Bloom] Failed to sync order to cloud:", e),
    );
  } catch (e) {
    console.error("[Organic Bloom] Failed to sync order to cloud:", e);
  }
};

// Subscribes to live order updates from Firestore. Calls onChange with the
// full, newest-first order list every time anything changes (new order,
// payment verified, courier assigned, etc.) from ANY device. Returns an
// unsubscribe function. No-ops (returns a no-op unsubscribe) if cloud sync
// isn't configured — caller should keep using localStorage in that case.
export const subscribeToOrdersCloud = (onChange) => {
  if (!isCloudSyncEnabled() || !db) {
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, ORDERS_COLLECTION),
      (snapshot) => {
        const orders = snapshot.docs
          .map((d) => d.data())
          .sort((a, b) => (b._updatedAt || 0) - (a._updatedAt || 0));
        onChange(orders);
      },
      (err) =>
        console.error("[Organic Bloom] Orders cloud subscription error:", err),
    );
  } catch (e) {
    console.error("[Organic Bloom] Failed to subscribe to orders cloud:", e);
    return () => {};
  }
};

// ---------------- Complaint Tickets ----------------

export const pushComplaintToCloud = (ticket) => {
  if (!isCloudSyncEnabled() || !db) return;
  try {
    setDoc(
      doc(collection(db, COMPLAINTS_COLLECTION), ticket.ticketId),
      { ...ticket, _updatedAt: Date.now() },
      { merge: true },
    ).catch((e) =>
      console.error("[Organic Bloom] Failed to sync complaint to cloud:", e),
    );
  } catch (e) {
    console.error("[Organic Bloom] Failed to sync complaint to cloud:", e);
  }
};

export const subscribeToComplaintsCloud = (onChange) => {
  if (!isCloudSyncEnabled() || !db) {
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, COMPLAINTS_COLLECTION),
      (snapshot) => {
        const tickets = snapshot.docs
          .map((d) => d.data())
          .sort((a, b) => (b._updatedAt || 0) - (a._updatedAt || 0));
        onChange(tickets);
      },
      (err) =>
        console.error(
          "[Organic Bloom] Complaints cloud subscription error:",
          err,
        ),
    );
  } catch (e) {
    console.error(
      "[Organic Bloom] Failed to subscribe to complaints cloud:",
      e,
    );
    return () => {};
  }
};

// ---------------- Products (catalog: photos, prices, descriptions) ----------------
//
// Each product is stored as its OWN Firestore document (keyed by product id),
// rather than one big array in a single document. Host-uploaded photos are
// base64 data URLs up to ~900KB each — a single "all products" document would
// risk hitting Firestore's 1MB-per-document limit with just a couple of
// photos. Per-product documents keep each write comfortably under that limit
// and mean one product's photo update doesn't require rewriting every product.

export const pushProductToCloud = (product) => {
  if (!isCloudSyncEnabled() || !db) return;
  try {
    setDoc(
      doc(collection(db, PRODUCTS_COLLECTION), product.id),
      { ...product, _updatedAt: Date.now() },
      { merge: false },
    ).catch((e) =>
      console.error("[Organic Bloom] Failed to sync product to cloud:", e),
    );
  } catch (e) {
    console.error("[Organic Bloom] Failed to sync product to cloud:", e);
  }
};

export const deleteProductFromCloud = (productId) => {
  if (!isCloudSyncEnabled() || !db) return;
  try {
    deleteDoc(doc(collection(db, PRODUCTS_COLLECTION), productId)).catch((e) =>
      console.error("[Organic Bloom] Failed to delete product from cloud:", e),
    );
  } catch (e) {
    console.error("[Organic Bloom] Failed to delete product from cloud:", e);
  }
};

// Replaces the ENTIRE cloud product catalog with the given list (used by
// "Reset to Default Products"): deletes any cloud product not in the list,
// then writes every product in the list.
export const replaceAllProductsInCloud = async (products) => {
  if (!isCloudSyncEnabled() || !db) return;
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const keepIds = new Set(products.map((p) => p.id));
    const deletions = snapshot.docs
      .filter((d) => !keepIds.has(d.id))
      .map((d) =>
        deleteDoc(d.ref).catch((e) =>
          console.error("[Organic Bloom] Cleanup delete failed:", e),
        ),
      );
    await Promise.all(deletions);
    products.forEach((p) => pushProductToCloud(p));
  } catch (e) {
    console.error("[Organic Bloom] Failed to reset cloud products:", e);
  }
};

// Live product catalog feed — used by the storefront AND the Host Portal so
// a photo/price edit made on the host's device shows up on every visitor's
// device immediately, instead of being stuck in that one browser's storage.
export const subscribeToProductsCloud = (onChange) => {
  if (!isCloudSyncEnabled() || !db) {
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, PRODUCTS_COLLECTION),
      (snapshot) => {
        const products = snapshot.docs.map((d) => {
          const data = d.data();
          const { _updatedAt, ...rest } = data;
          return rest;
        });
        onChange(products);
      },
      (err) =>
        console.error(
          "[Organic Bloom] Products cloud subscription error:",
          err,
        ),
    );
  } catch (e) {
    console.error("[Organic Bloom] Failed to subscribe to products cloud:", e);
    return () => {};
  }
};

// ---------------- Homepage Announcement Banner ----------------

export const pushAnnouncementToCloud = (announcement) => {
  if (!isCloudSyncEnabled() || !db) return;
  try {
    setDoc(
      doc(collection(db, CONTENT_COLLECTION), ANNOUNCEMENT_DOC_ID),
      { ...announcement, _updatedAt: Date.now() },
      { merge: false },
    ).catch((e) =>
      console.error("[Organic Bloom] Failed to sync announcement to cloud:", e),
    );
  } catch (e) {
    console.error("[Organic Bloom] Failed to sync announcement to cloud:", e);
  }
};

export const subscribeToAnnouncementCloud = (onChange) => {
  if (!isCloudSyncEnabled() || !db) {
    return () => {};
  }
  try {
    return onSnapshot(
      doc(collection(db, CONTENT_COLLECTION), ANNOUNCEMENT_DOC_ID),
      (snap) => {
        if (!snap.exists()) {
          onChange(null);
          return;
        }
        const { _updatedAt, ...rest } = snap.data();
        onChange(rest);
      },
      (err) =>
        console.error(
          "[Organic Bloom] Announcement cloud subscription error:",
          err,
        ),
    );
  } catch (e) {
    console.error(
      "[Organic Bloom] Failed to subscribe to announcement cloud:",
      e,
    );
    return () => {};
  }
};
