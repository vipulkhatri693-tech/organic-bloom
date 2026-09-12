// Host-editable site content: product catalog + homepage announcement banner.
//
// Every edit is saved to localStorage (fast, works offline) AND synced to a
// shared Firestore database in real time (see utils/cloudSync.ts), so a photo
// or price change made in the Host Portal shows up on every visitor's device
// immediately — not just the browser the host happened to edit from. If
// Firestore isn't configured (missing .env keys), everything still works,
// it just stays local to that one browser like before.
//
// - The very first time anyone loads the site (with no cloud data yet), the
//   product catalog is "seeded" from the hardcoded SOAP_PRODUCTS defaults
//   (src/data/soaps.ts).
// - From then on, every read/write goes through localStorage + Firestore,
//   NOT the hardcoded file — use "Reset to Default Products" in the Host
//   Portal to go back to the code defaults on every device.

import { SOAP_PRODUCTS } from '../data/soaps';
import { SoapProduct } from '../types';
import {
  pushProductToCloud,
  deleteProductFromCloud,
  replaceAllProductsInCloud,
  subscribeToProductsCloud,
  pushAnnouncementToCloud,
  subscribeToAnnouncementCloud,
} from './cloudSync';

const PRODUCTS_KEY = 'organic_bloom_products_v1';
const ANNOUNCEMENT_KEY = 'organic_bloom_announcement_v1';

// ---------------- Products ----------------

export const getProducts = (): SoapProduct[] => {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to read products from storage:', e);
  }
  // First run (or corrupted storage): seed from the hardcoded defaults.
  const seeded = JSON.parse(JSON.stringify(SOAP_PRODUCTS)) as SoapProduct[];
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(seeded));
  } catch (e) {
    console.error('Failed to seed products into storage:', e);
  }
  return seeded;
};

const saveProducts = (products: SoapProduct[]): void => {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('ob_products_change'));
  } catch (e) {
    console.error('Failed to save products:', e);
    throw new Error(
      'Could not save changes. Your browser storage might be full — try using smaller photos or a paste-a-link image instead of uploading.'
    );
  }
};

// Live product catalog for the storefront + Host Portal. Subscribes to
// Firestore (so a photo/price edit made on the host's device appears on
// every visitor's device in real time) and keeps localStorage as an offline
// cache/fallback. Falls back to localStorage-only + same-tab
// 'ob_products_change' events if Firestore isn't configured. Returns an
// unsubscribe function.
export const subscribeToProducts = (onChange: (products: SoapProduct[]) => void): (() => void) => {
  const cloudUnsub = subscribeToProductsCloud((cloudProducts) => {
    if (cloudProducts.length > 0) {
      try {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(cloudProducts));
      } catch (e) {
        console.error('Failed to cache cloud products locally:', e);
      }
      onChange(cloudProducts);
    } else {
      // No cloud docs yet (fresh Firestore) — show local cache/defaults.
      onChange(getProducts());
    }
  });

  const localHandler = () => onChange(getProducts());
  window.addEventListener('ob_products_change', localHandler);
  onChange(getProducts());

  return () => {
    cloudUnsub();
    window.removeEventListener('ob_products_change', localHandler);
  };
};

// Create a new product or update an existing one (matched by id).
export const upsertProduct = (product: SoapProduct): void => {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.push(product);
  }
  saveProducts(products);
  pushProductToCloud(product);
};

export const deleteProduct = (id: string): void => {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
  deleteProductFromCloud(id);
};

export const resetProductsToDefault = (): void => {
  const seeded = JSON.parse(JSON.stringify(SOAP_PRODUCTS)) as SoapProduct[];
  saveProducts(seeded);
  replaceAllProductsInCloud(seeded);
};

// Generates a safe, unique product id from a name (used for new products).
export const slugifyProductId = (name: string, existingIds: string[]): string => {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'soap';
  let id = base;
  let counter = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  return id;
};

// ---------------- Homepage Announcement Banner ----------------

export interface SiteAnnouncement {
  text: string;
  active: boolean;
  updatedAt: string;
}

export const getAnnouncement = (): SiteAnnouncement | null => {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read announcement:', e);
  }
  return null;
};

export const saveAnnouncement = (text: string, active: boolean): void => {
  const data: SiteAnnouncement = {
    text: text.trim(),
    active,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('ob_announcement_change'));
    pushAnnouncementToCloud(data);
  } catch (e) {
    console.error('Failed to save announcement:', e);
    throw new Error('Could not save announcement. Please try again.');
  }
};

// Live announcement banner feed, same real-time pattern as products/orders.
export const subscribeToAnnouncement = (
  onChange: (announcement: SiteAnnouncement | null) => void
): (() => void) => {
  const cloudUnsub = subscribeToAnnouncementCloud((cloudAnnouncement) => {
    if (cloudAnnouncement) {
      try {
        localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(cloudAnnouncement));
      } catch (e) {
        console.error('Failed to cache cloud announcement locally:', e);
      }
    }
    onChange(cloudAnnouncement || getAnnouncement());
  });

  const localHandler = () => onChange(getAnnouncement());
  window.addEventListener('ob_announcement_change', localHandler);
  onChange(getAnnouncement());

  return () => {
    cloudUnsub();
    window.removeEventListener('ob_announcement_change', localHandler);
  };
};
