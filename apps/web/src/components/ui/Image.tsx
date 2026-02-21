import React from "react";
import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: "square" | "video" | "wide" | "portrait";
  overlay?: boolean;
  overlayContent?: React.ReactNode;
  onClick?: () => void;
}

export function Image({
  aspectRatio = "video",
  overlay = false,
  overlayContent,
  onClick,
  className,
  alt = "",
  ...props
}: ImageProps) {
  const aspectRatios = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[21/9]",
    portrait: "aspect-[3/4]",
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg", 
        aspectRatios[aspectRatio], 
        onClick && "cursor-pointer hover:opacity-90 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      <img
        alt={alt}
        className="w-full h-full object-cover"
        {...props}
      />
      {overlay && overlayContent && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
