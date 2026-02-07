"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCreationStore } from "@/store/creation";

type StyleConfig = {
  id: string;
  key: string;
  name: string;
  promptPrefix?: string | null;
  promptSuffix?: string | null;
  negativePrompt?: string | null;
  baseModel?: string | null;
};

type StyleSection = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  styles: StyleConfig[];
};

export const StyleBrowser = () => {
  const [sections, setSections] = useState<StyleSection[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Zustand Store
  const { selectedStyle, setSelectedStyle } = useCreationStore();

  useEffect(() => {
    apiFetch<{ sections: StyleSection[] }>("/styles/sections")
      .then((data) => {
        setSections(data.sections);
        setActiveKey(data.sections[0]?.key ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeSection = useMemo(
    () => sections.find((section) => section.key === activeKey),
    [sections, activeKey]
  );

  if (loading) {
    return <div className="card p-6">Loading styles...</div>;
  }

  if (!sections.length) {
    return <div className="card p-6">No styles available yet.</div>;
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="card p-3 sm:p-5">
        <h2 className="section-title mb-3 sm:mb-4">Sections</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveKey(section.key)}
              className={`shrink-0 rounded-2xl border px-3 py-2 sm:px-4 sm:py-3 text-left transition ${activeKey === section.key
                ? "border-aurora-400 bg-aurora-100 text-aurora-800 dark:bg-aurora-900/30 dark:text-aurora-100"
                : "border-[var(--border)] hover:border-aurora-300"
                }`}
            >
              <div className="text-sm font-semibold sm:text-base">{section.name}</div>
              <p className="hidden text-xs text-[var(--muted)] lg:block">{section.description}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="card p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="section-title">{activeSection?.name}</h2>
          <p className="text-sm text-[var(--muted)]">
            {activeSection?.description}
          </p>
        </div>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {activeSection?.styles.map((style) => {
            const isSelected = selectedStyle?.id === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style)}
                className={`group relative flex flex-col items-start rounded-3xl border p-3 sm:p-5 text-left transition-all ${isSelected
                  ? "border-aurora-500 ring-2 ring-aurora-500 ring-offset-2 dark:ring-offset-black"
                  : "border-[var(--border)] hover:border-aurora-300 hover:shadow-md"
                  } bg-[var(--bg-elevated)]`}
              >
                <div className="text-lg font-semibold">{style.name}</div>
                <p className="text-xs text-[var(--muted)]">{style.baseModel}</p>
                <div className="mt-4 text-xs text-[var(--muted)]">
                  <div>Prefix: {style.promptPrefix ?? "-"}</div>
                </div>

                {isSelected && (
                  <div className="absolute right-4 top-4 text-aurora-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
