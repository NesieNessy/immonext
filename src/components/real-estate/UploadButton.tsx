"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

interface UploadButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  buttonText?: string;
  onFileSelect?: (files: FileList | null) => void;
}

export function UploadButton({
  label,
  buttonText = "Choose File",
  onFileSelect,
  className,
  ...props
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string>("");

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
    }
    onFileSelect?.(files);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm text-foreground">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer",
            "hover:bg-primary/90 transition-all duration-200",
            className
          )}
        >
          <Upload size={20} />
          {buttonText}
        </button>
        {fileName && (
          <span className="text-sm text-muted-foreground truncate">
            {fileName}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}