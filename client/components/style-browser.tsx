"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCreationStore } from "@/store/creation";
import { Check } from "lucide-react";

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
    return <div className="card p-6 text-sm text-[var(--text-secondary)]">Loading styles...</div>;
  }

  if (!sections.length) {
    return <div className="card p-6 text-sm text-[var(--text-secondary)]">No styles available yet.</div>;
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="card p-3 sm:p-4">
        <h2 className="section-title mb-3">Sections</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveKey(section.key)}
              className={`shrink-0 rounded-lg border px-3 py-2 sm:px-4 sm:py-3 text-left transition ${activeKey === section.key
                ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text)]"
                : "border-[var(--border)] hover:border-[var(--border-strong)]"
                }`}
            >
              <div className="text-sm font-semibold">{section.name}</div>
              <p className="hidden text-xs text-[var(--text-tertiary)] lg:block">{section.description}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="card p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="section-title">{activeSection?.name}</h2>
          <p className="text-sm text-[var(--text-secondary)]">
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
                className={`group relative flex flex-col items-start rounded-xl border p-3 sm:p-5 text-left transition-all ${isSelected
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  }`}
              >
                <div className="text-base font-semibold">{style.name}</div>
                <p className="text-xs text-[var(--text-tertiary)]">{style.baseModel}</p>
                <div className="mt-3 text-xs text-[var(--text-tertiary)]">
                  <div>Prefix: {style.promptPrefix ?? "-"}</div>
                </div>

                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)]">
                    <Check size={12} strokeWidth={3} />
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
