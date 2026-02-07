"use client";

import Link from "next/link";
import { StyleBrowser } from "@/components/style-browser";
import { useCreationStore } from "@/store/creation";

export default function StylesPage() {
  const { selectedStyle, inputImage, setStep } = useCreationStore();

  return (
    <div className="space-y-6">
      <StyleBrowser />

      {selectedStyle && (
        <div className="card sticky bottom-4 sm:bottom-6 z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-aurora-200 bg-aurora-50 p-3 sm:p-4 shadow-xl dark:border-aurora-900/50 dark:bg-aurora-900/20">
          <p className="text-sm font-semibold">
            Selected: <span className="text-aurora-600">{selectedStyle.name}</span>
          </p>
          {inputImage ? (
            <Link
              href="/create"
              onClick={() => setStep(2)}
              className="button button-primary"
            >
              Continue to Generate
            </Link>
          ) : (
            <Link
              href="/create"
              onClick={() => setStep(1)}
              className="button button-primary"
            >
              Upload an Image First
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
