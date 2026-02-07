import { StyleConfig } from "@prisma/client";

type PromptTemplate = {
  template?: string;
  prefix?: string;
  suffix?: string;
  negative?: string;
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const mergeParts = (parts: Array<string | undefined | null>) =>
  normalize(parts.filter(Boolean).join(", "));

const resolveTemplate = (style: StyleConfig): PromptTemplate => {
  const template = style.promptTemplate as PromptTemplate | null;
  return {
    template: template?.template,
    prefix: template?.prefix ?? style.promptPrefix ?? undefined,
    suffix: template?.suffix ?? style.promptSuffix ?? undefined,
    negative: template?.negative ?? style.negativePrompt ?? undefined
  };
};

export const composePrompt = (style: StyleConfig, userPrompt?: string | null) => {
  const template = resolveTemplate(style);
  const basePrompt = userPrompt?.trim() || "";

  if (template.template) {
    const rendered = template.template
      .replace(/{{\s*prompt\s*}}/gi, basePrompt)
      .replace(/{{\s*prefix\s*}}/gi, template.prefix ?? "")
      .replace(/{{\s*suffix\s*}}/gi, template.suffix ?? "");
    return normalize(rendered);
  }

  // Build an instruction-style prompt for img2img models like instruct-pix2pix.
  // If user provides context, weave it in; otherwise rely on style prefix/suffix.
  const styleParts = mergeParts([template.prefix, template.suffix]);
  if (basePrompt) {
    return normalize(`${styleParts}, ${basePrompt}`);
  }
  return styleParts;
};

export const composeNegativePrompt = (
  style: StyleConfig,
  userNegative?: string | null
) => {
  const template = resolveTemplate(style);
  return mergeParts([template.negative, userNegative ?? undefined]);
};
