"use client";

import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/shared/components/ui";
import { Download } from "lucide-react";

export function InstallButton() {
  const { isInstallable, install, isInstalled } = usePWA();

  if (isInstalled) return null;

  if (!isInstallable) return null;

  return (
    <Button
      onClick={install}
      className="fixed bottom-20 right-4 z-50 shadow-lg !px-4 !py-3 rounded-full"
      size="sm"
    >
      <Download className="w-4 h-4 mr-2" />
      Instalar App
    </Button>
  );
}

export default InstallButton;