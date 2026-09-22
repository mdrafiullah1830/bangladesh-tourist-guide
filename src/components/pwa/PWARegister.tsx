"use client";

import { useEffect, useState } from "react";

/**
 * Registers the service worker and surfaces a tiny "offline ready" indicator.
 * Also adds an apple-touch-icon link for iOS home-screen installs.
 */
export function PWARegister() {
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // iOS home-screen icon
    const iconLink = document.createElement("link");
    iconLink.rel = "apple-touch-icon";
    iconLink.href = "/icons/icon-180.png";
    document.head.appendChild(iconLink);

    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // dev-এ SW disable

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => setIsOfflineReady(true))
        .catch(() => {
          /* registration failed — app still works online-only */
        });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  if (!isOfflineReady) return null;
  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-4 right-4 z-[90] bg-green-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg"
    >
      📥 Offline ready
    </div>
  );
}
