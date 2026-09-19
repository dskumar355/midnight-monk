// Firebase Cloud Messaging client-side service
import { api } from "./api";

let messaging = null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDevelopmentOnly",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "midnight-monk.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "midnight-monk",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "midnight-monk.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:100000000000:web:mockappid",
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

export const initFirebase = async () => {
  if (messaging) return messaging;
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  try {
    if (!window.firebase) {
      await loadScript("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
    }
    if (!window.firebase?.messaging) {
      await loadScript("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");
    }

    if (!window.firebase?.apps?.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    messaging = window.firebase.messaging();
    return messaging;
  } catch (err) {
    console.log("[FCM] Firebase initialization note:", err.message);
    return null;
  }
};

export const requestFcmToken = async () => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    const msg = await initFirebase();
    if (!msg) return null;

    let registration;
    if ("serviceWorker" in navigator) {
      try {
        const swParams = new URLSearchParams({
          apiKey: firebaseConfig.apiKey || "",
          projectId: firebaseConfig.projectId || "",
          messagingSenderId: firebaseConfig.messagingSenderId || "",
          appId: firebaseConfig.appId || "",
          authDomain: firebaseConfig.authDomain || "",
          storageBucket: firebaseConfig.storageBucket || "",
        }).toString();
        registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams}`);
      } catch (swErr) {
        console.warn("[FCM] Service worker registration note:", swErr.message);
      }
    }

    const tokenOptions = {};
    if (registration) {
      tokenOptions.serviceWorkerRegistration = registration;
    }
    if (VAPID_KEY && VAPID_KEY.trim()) {
      tokenOptions.vapidKey = VAPID_KEY.trim();
    }

    const token = await msg.getToken(tokenOptions);
    if (token) {
      const lastToken = localStorage.getItem("mm_fcm_token");
      if (lastToken !== token) {
        localStorage.setItem("mm_fcm_token", token);
        try {
          await api.registerFcmToken(token, {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
          });
        } catch (apiErr) {
          console.warn("[FCM] Failed to register token with backend:", apiErr.message);
        }
      }
      return token;
    }
    return null;
  } catch (err) {
    console.log("[FCM] Unable to retrieve registration token:", err.message);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise(async (resolve) => {
    try {
      const msg = await initFirebase();
      if (!msg) return;
      msg.onMessage((payload) => {
        resolve(payload);
      });
    } catch (err) {
      console.log("[FCM] onMessageListener note:", err.message);
    }
  });
