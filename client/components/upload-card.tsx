"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadImage } from "@/lib/api";
import { useCreationStore } from "@/store/creation";

export const UploadCard = ({ onSuccess }: { onSuccess?: (img: any) => void }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const { setInputImage } = useCreationStore();

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFile = async (file: File) => {
    setLoading(true);
    setStatus(null);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const blobUrl = URL.createObjectURL(file);
    previewUrlRef.current = blobUrl;
    setPreview(blobUrl);

    try {
      const response = await uploadImage(file);
      setStatus(`Uploaded. Preview URL ready.`);
      const imgData = {
        id: response.image.id,
        storagePath: response.image.storagePath,
        previewUrl: response.previewUrl
      };

      setInputImage(imgData);

      if (onSuccess) onSuccess(imgData);

    } catch (error) {
      const message = (error as { message?: string })?.message ?? "Upload failed";
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      void handleFile(file);
    }
  };

  return (
    <div className="card p-4 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gradient-start)]/20 to-[var(--gradient-end)]/10">
          <UploadCloud size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">Upload an image</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            PNG, JPG, or WEBP up to 10MB.
          </p>
        </div>
      </div>

      <label
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all ${
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent-surface)] scale-[1.01]"
            : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] hover:bg-[var(--accent-surface)]"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
        />
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-surface)]">
          <UploadCloud size={22} className="text-[var(--accent)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Drag a file here or <span className="text-[var(--accent)]">click to browse</span>
        </p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">Supports PNG, JPG, WEBP</p>
      </label>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--accent)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          Uploading...
        </div>
      )}
      {status && !loading && <p className="mt-4 text-sm text-[var(--text-secondary)]">{status}</p>}

      {preview && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--glass-border)] shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="h-72 w-full object-cover"
          />
        </div>
      )}
    </div>
  );
};
