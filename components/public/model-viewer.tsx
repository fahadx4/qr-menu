"use client";

import { useEffect, useState } from "react";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────
   JSX declaration for <model-viewer> custom element
   Augments the "react" module's JSX.IntrinsicElements so TypeScript
   recognises the web component under react-jsx transform.
────────────────────────────────────────────── */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean;
          "auto-rotate"?: boolean;
          "camera-controls"?: boolean;
          poster?: string;
          "shadow-intensity"?: string;
          "ar-modes"?: string;
          style?: React.CSSProperties;
          "ios-src"?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ModelViewerProps {
  src?: string;
  poster?: string;
  alt?: string;
  className?: string;
}

export function ModelViewer({ src, poster, alt, className }: ModelViewerProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import("@google/model-viewer").then(() => {
      setLoaded(true);
    });
  }, []);

  if (!src) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/60 text-muted-foreground",
          className
        )}
      >
        <Box className="w-12 h-12 opacity-40" />
        <span className="text-sm">No 3D model uploaded</span>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-muted/60",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
          <span className="text-xs">Loading 3D viewer…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden", className)}>
      <model-viewer
        src={src}
        alt={alt ?? "3D model"}
        poster={poster}
        auto-rotate
        camera-controls
        ar
        ar-modes="webxr scene-viewer quick-look"
        shadow-intensity="1"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
