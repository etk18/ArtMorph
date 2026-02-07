import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODEL = "black-forest-labs/FLUX.1-Kontext-dev";

type StyleDef = {
  key: string;
  name: string;
  prefix: string;
  suffix: string;
  guidanceScale?: number;
  steps?: number;
};

const upsertSection = (key: string, name: string, description: string, sortOrder: number) =>
  prisma.styleSection.upsert({
    where: { key },
    update: { name, description, sortOrder },
    create: { key, name, description, sortOrder }
  });

const upsertStyle = (sectionId: string, style: StyleDef) =>
  prisma.styleConfig.upsert({
    where: { key: style.key },
    update: {
      name: style.name,
      sectionId,
      baseModel: MODEL,
      promptPrefix: style.prefix,
      promptSuffix: style.suffix,
      negativePrompt: null,
      controlnetModule: null,
      controlnetWeight: null,
      guidanceScale: style.guidanceScale ?? 2.5,
      strength: null,
      promptTemplate: { prefix: style.prefix, suffix: style.suffix },
      params: { steps: style.steps ?? 28 },
      isActive: true
    },
    create: {
      key: style.key,
      name: style.name,
      sectionId,
      baseModel: MODEL,
      promptPrefix: style.prefix,
      promptSuffix: style.suffix,
      negativePrompt: null,
      controlnetModule: null,
      controlnetWeight: null,
      guidanceScale: style.guidanceScale ?? 2.5,
      strength: null,
      promptTemplate: { prefix: style.prefix, suffix: style.suffix },
      params: { steps: style.steps ?? 28 },
      isActive: true
    }
  });

const seed = async () => {
  // ── Sections ──────────────────────────────────────────────
  const cinematic = await upsertSection("cinematic", "Cinematic", "Film-inspired styles", 1);
  const illustration = await upsertSection("illustration", "Illustration", "Painterly and illustrated looks", 2);
  const classic = await upsertSection("classic-art", "Classic Art", "Traditional fine-art movements", 3);
  const modern = await upsertSection("modern", "Modern & Digital", "Contemporary digital art styles", 4);
  const photo = await upsertSection("photography", "Photography", "Photographic treatments and filters", 5);

  // ── Cinematic ─────────────────────────────────────────────
  await upsertStyle(cinematic.id, {
    key: "cinematic-noir",
    name: "Film Noir",
    prefix: "Transform this image into a dramatic black and white film noir scene.",
    suffix: "Apply deep shadows, high contrast lighting, film grain texture, and moody classic cinema atmosphere."
  });

  await upsertStyle(cinematic.id, {
    key: "cinematic-golden",
    name: "Golden Hour",
    prefix: "Transform this image to look like it was shot during golden hour.",
    suffix: "Apply warm amber tones, soft lens flare, long shadows, and a dreamy cinematic color grade."
  });

  await upsertStyle(cinematic.id, {
    key: "cinematic-scifi",
    name: "Sci-Fi Neon",
    prefix: "Transform this image into a futuristic cyberpunk scene.",
    suffix: "Apply neon lighting in pink and cyan, rain-slicked surfaces with reflections, holographic elements, and a dark sci-fi atmosphere."
  });

  await upsertStyle(cinematic.id, {
    key: "cinematic-vintage",
    name: "Vintage Film",
    prefix: "Transform this image to look like a vintage photograph from the 1970s.",
    suffix: "Apply faded warm tones, light leaks, film grain, slight vignette, and retro analog color grading."
  });

  // ── Illustration ──────────────────────────────────────────
  await upsertStyle(illustration.id, {
    key: "storybook-ink",
    name: "Storybook Ink",
    prefix: "Transform this image into a storybook illustration.",
    suffix: "Apply ink outlines, soft watercolor wash, paper texture, delicate shading, and a charming children's book art style."
  });

  await upsertStyle(illustration.id, {
    key: "anime-style",
    name: "Anime",
    prefix: "Transform this image into an anime-style illustration.",
    suffix: "Apply clean cel-shading, vibrant anime colors, large expressive eyes, sharp linework, and a Japanese animation aesthetic."
  });

  await upsertStyle(illustration.id, {
    key: "comic-book",
    name: "Comic Book",
    prefix: "Transform this image into a bold comic book panel.",
    suffix: "Apply thick black outlines, Ben-Day dots, vivid flat colors, dramatic ink shading, and a classic American comic style."
  });

  await upsertStyle(illustration.id, {
    key: "pixel-art",
    name: "Pixel Art",
    prefix: "Transform this image into retro pixel art.",
    suffix: "Apply a limited color palette, visible square pixels, dithering patterns, and a charming 16-bit video game aesthetic."
  });

  await upsertStyle(illustration.id, {
    key: "line-drawing",
    name: "Pencil Sketch",
    prefix: "Transform this image into a detailed pencil sketch.",
    suffix: "Apply fine graphite pencil strokes, cross-hatching for shading, white paper background, and a hand-drawn look."
  });

  // ── Classic Art ───────────────────────────────────────────
  await upsertStyle(classic.id, {
    key: "oil-painting",
    name: "Oil Painting",
    prefix: "Transform this image into a classical oil painting.",
    suffix: "Apply visible impasto brushstrokes, rich color blending, canvas texture, Renaissance-style lighting, and a museum-worthy fine art look."
  });

  await upsertStyle(classic.id, {
    key: "impressionist",
    name: "Impressionist",
    prefix: "Transform this image into a French Impressionist painting.",
    suffix: "Apply loose dappled brushstrokes, soft pastel colors, luminous natural light, and the style of Monet or Renoir."
  });

  await upsertStyle(classic.id, {
    key: "watercolor",
    name: "Watercolor",
    prefix: "Transform this image into a delicate watercolor painting.",
    suffix: "Apply translucent color washes, soft bleeding edges, visible paper texture, wet-on-wet blending, and a luminous airy feel."
  });

  await upsertStyle(classic.id, {
    key: "pop-art",
    name: "Pop Art",
    prefix: "Transform this image into bold pop art in the style of Andy Warhol.",
    suffix: "Apply bright saturated flat colors, high contrast, halftone dot patterns, thick outlines, and a playful 1960s aesthetic."
  });

  await upsertStyle(classic.id, {
    key: "ukiyo-e",
    name: "Ukiyo-e",
    prefix: "Transform this image into a Japanese ukiyo-e woodblock print.",
    suffix: "Apply flat areas of color, flowing black outlines, stylized waves and clouds, and the elegant aesthetic of Hokusai or Hiroshige."
  });

  // ── Modern & Digital ──────────────────────────────────────
  await upsertStyle(modern.id, {
    key: "low-poly",
    name: "Low Poly",
    prefix: "Transform this image into a low-poly geometric artwork.",
    suffix: "Apply triangular facets, flat-shaded polygons, a clean geometric aesthetic, subtle color gradients within each polygon."
  });

  await upsertStyle(modern.id, {
    key: "3d-render",
    name: "3D Render",
    prefix: "Transform this image into a stylized 3D render.",
    suffix: "Apply smooth plastic-like surfaces, soft studio lighting, ambient occlusion, subtle reflections, and a clean Pixar-style 3D aesthetic."
  });

  await upsertStyle(modern.id, {
    key: "vaporwave",
    name: "Vaporwave",
    prefix: "Transform this image into a vaporwave aesthetic.",
    suffix: "Apply pink and purple gradients, glitch effects, retro Greek statues, palm trees, sunset grids, and nostalgic 80s-90s digital art vibes."
  });

  await upsertStyle(modern.id, {
    key: "graffiti",
    name: "Street Graffiti",
    prefix: "Transform this image into vibrant street graffiti art.",
    suffix: "Apply spray paint texture, dripping paint, bold lettering styles, brick wall background, and an urban street art aesthetic."
  });

  // ── Photography ───────────────────────────────────────────
  await upsertStyle(photo.id, {
    key: "photo-bw",
    name: "Black & White",
    prefix: "Convert this image to a striking black and white photograph.",
    suffix: "Apply deep contrast, rich tonal range, fine grain, dramatic shadows, and the timeless look of Ansel Adams photography."
  });

  await upsertStyle(photo.id, {
    key: "photo-tiltshift",
    name: "Tilt-Shift Miniature",
    prefix: "Transform this image to look like a tilt-shift miniature photograph.",
    suffix: "Apply selective focus blur at top and bottom, increased color saturation, and make the scene look like a tiny detailed diorama."
  });

  await upsertStyle(photo.id, {
    key: "photo-infrared",
    name: "Infrared",
    prefix: "Transform this image into a faux infrared photograph.",
    suffix: "Apply white or pink foliage, deep dark skies, surreal color palette, and the ethereal dreamlike look of infrared photography."
  });

  await upsertStyle(photo.id, {
    key: "photo-duotone",
    name: "Duotone",
    prefix: "Transform this image into a bold duotone treatment.",
    suffix: "Apply a striking two-color gradient map using complementary colors, high contrast, and a modern graphic design aesthetic."
  });
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
