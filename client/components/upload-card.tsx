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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
          <UploadCloud size={20} className="text-[var(--text-secondary)]" />
        </div>
        <div>
          <h2 className="section-title">Upload an image</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            PNG, JPG, or WEBP up to 10MB.
          </p>
        </div>
      </div>

      <label
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center transition ${
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
            : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)]"
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
        <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
          Drag a file here or click to browse
        </p>
      </label>

      {loading && <p className="mt-4 text-sm text-[var(--text-secondary)] animate-pulse">Uploading...</p>}
      {status && !loading && <p className="mt-4 text-sm text-[var(--text-secondary)]">{status}</p>}

      {preview && (
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border)]">
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
