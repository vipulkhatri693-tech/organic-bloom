// Firebase setup for real Mobile OTP (SMS) login.
//
// SETUP REQUIRED before this works:
// 1. Create a free Firebase project: https://console.firebase.google.com
// 2. In the project, go to Build > Authentication > Sign-in method,
//    enable "Phone" as a sign-in provider.
// 3. Go to Project settings (gear icon) > General > Your apps > Add app > Web (</>) icon.
//    Register the app, copy the firebaseConfig values shown there.
// 4. Create a file named `.env` in the project root (copy from .env.example)
//    and paste your values into the VITE_FIREBASE_* variables.
// 5. In Firebase Authentication > Settings > Authorized domains, add:
//      - localhost (usually already there, for local testing)
//      - your Netlify domain, e.g. orgianicbloom.netlify.app
//
// Without a valid .env file, phone OTP login will show a configuration error.

import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyB4nKQZlzGnvS7XU8wSfbQoCTGhhddxz_k",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "organic-bloom-8995c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "organic-bloom-8995c",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "organic-bloom-8995c.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "667949373357",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:667949373357:web:1df984411bc1fdb1273324",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Shared cloud database for orders + complaint tickets
  db = getFirestore(app);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[Organic Bloom] Firebase is not configured. Add VITE_FIREBASE_* keys to your .env file to enable real Mobile OTP login.",
  );
}

export { auth, db };

// Creates (or re-creates) an invisible reCAPTCHA bound to the given container id.
export const getRecaptchaVerifier = (containerId) => {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please contact the site owner.",
    );
  }
  const w = window;
  if (!w.__obRecaptchaVerifiers) {
    w.__obRecaptchaVerifiers = {};
  }

  // If a verifier already exists for this container, clean it up first
  if (w.__obRecaptchaVerifiers[containerId]) {
    try {
      w.__obRecaptchaVerifiers[containerId].clear();
    } catch {
      // ignore
    }
    delete w.__obRecaptchaVerifiers[containerId];
  }

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      resetRecaptcha(containerId);
    },
  });

  w.__obRecaptchaVerifiers[containerId] = verifier;
  return verifier;
};

export const resetRecaptcha = (containerId) => {
  const w = window;
  if (!w.__obRecaptchaVerifiers) return;
  const clearOne = (id) => {
    try {
      w.__obRecaptchaVerifiers[id]?.clear();
    } catch {
      // ignore
    }
    delete w.__obRecaptchaVerifiers[id];
  };
  if (containerId) {
    clearOne(containerId);
  } else {
    Object.keys(w.__obRecaptchaVerifiers).forEach(clearOne);
  }
};

// Sends a real SMS OTP to the given Indian mobile number (strictly formatted to E.164 +91XXXXXXXXXX)
export const sendFirebaseOTP = async (rawPhone, containerId) => {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please contact the site owner.",
    );
  }
  const digits = rawPhone.replace(/\D/g, "");
  const tenDigits =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.slice(-10);

  if (tenDigits.length !== 10) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }

  const fullPhone = `+91${tenDigits}`;
  const verifier = getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(auth, fullPhone, verifier);
};
