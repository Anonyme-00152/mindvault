"use client";

import { FileText, File as FileIcon, Film } from "lucide-react";
import { useObjectURL } from "@/lib/hooks";
import type { VaultFile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FileThumb({ file, className }: { file: VaultFile; className?: string }) {
  const url = useObjectURL(file.blob);
  return (
    <div className={cn("relative bg-glass flex items-center justify-center overflow-hidden", className)}>
      {file.kind === "image" && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
      ) : file.kind === "video" && url ? (
        <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
      ) : file.kind === "document" ? (
        <FileText size={22} className="text-fg-faint" />
      ) : file.kind === "video" ? (
        <Film size={22} className="text-fg-faint" />
      ) : (
        <FileIcon size={22} className="text-fg-faint" />
      )}
    </div>
  );
}
