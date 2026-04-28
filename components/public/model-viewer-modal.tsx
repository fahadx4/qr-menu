"use client";

import { Smartphone } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModelViewer } from "@/components/public/model-viewer";

interface ModelViewerModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  src: string;
  poster?: string;
  name: string;
}

export function ModelViewerModal({
  open,
  onOpenChange,
  src,
  poster,
  name,
}: ModelViewerModalProps) {
  function handleOpenAR() {
    if (typeof navigator === "undefined") return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // AR Quick Look — trigger via a hidden anchor
      const link = document.createElement("a");
      link.href = `${src}#allowsContentScaling=0`;
      link.rel = "ar";
      const img = document.createElement("img");
      link.appendChild(img);
      link.click();
    } else if (isAndroid) {
      toast.info("Open in AR mode on your device");
    } else {
      toast.info("AR is available on mobile devices");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 gap-4">
        <DialogHeader>
          <DialogTitle>{name} — 3D View</DialogTitle>
        </DialogHeader>

        {/* 3D viewer */}
        <div style={{ height: 420 }}>
          <ModelViewer
            src={src}
            poster={poster}
            alt={`${name} 3D model`}
            className="w-full h-full"
          />
        </div>

        {/* Caption */}
        <p className="text-xs text-muted-foreground text-center">
          Rotate &amp; zoom with touch or mouse &bull; Tap AR to view in your space
        </p>

        {/* AR button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2"
          onClick={handleOpenAR}
        >
          <Smartphone className="w-4 h-4" />
          Open in AR
        </Button>
      </DialogContent>
    </Dialog>
  );
}
