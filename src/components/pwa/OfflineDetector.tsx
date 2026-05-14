"use client";

import { usePWA } from "@/hooks/usePWA";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineDetector() {
  const { isOffline, isOnline } = usePWA();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  if (!showStatus && isOnline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
        isOffline
          ? "bg-red-600 text-white"
          : "bg-green-600 text-white"
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Sem conexão -Modo offline</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>Conectado</span>
        </>
      )}
    </div>
  );
}

export default OfflineDetector;