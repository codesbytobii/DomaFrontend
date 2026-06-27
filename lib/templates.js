/**
 * templates.js — report-card template helpers.
 * Template definitions are now stored server-side (platform level); these
 * helpers use the API data the school's /settings/templates endpoint returns.
 * The STATIC_TEMPLATES constant below is used only as a fallback for the
 * platform's preview modal (which uses sample data, not a real child's record).
 */

export const STATIC_TEMPLATES = [
  { id: "classic", key: "classic", base: "classic", name: "Classic", desc: "Traditional bordered Nigerian report sheet.", packages: ["Starter", "School Suite", "Full School"] },
  { id: "minimal", key: "minimal", base: "minimal", name: "Minimal", desc: "Compact monochrome layout — ink-light, ideal for bulk printing.", packages: ["Starter", "School Suite", "Full School"] },
  { id: "modern", key: "modern", base: "modern", name: "Modern", desc: "Clean summary tiles with colour-coded grades.", packages: ["School Suite", "Full School"] },
  { id: "branded", key: "branded", base: "branded", name: "Branded (Premium)", desc: "School crest, custom colours and a watermark.", packages: ["Full School"] },
];

export function getTemplate(id) {
  return STATIC_TEMPLATES.find((t) => t.id === id) || STATIC_TEMPLATES[0];
}

export function isTemplateAvailable(template, plan) {
  return (template.packages || []).includes(plan);
}

const PLAN_ORDER = ["Starter", "School Suite", "Full School"];
export function lowestPlanFor(template) {
  for (const p of PLAN_ORDER) if ((template.packages || []).includes(p)) return p;
  return "—";
}

export function resolveTemplate(defaultId, plan, templates = STATIC_TEMPLATES) {
  const t = templates.find((x) => x.id === defaultId || x.key === defaultId) || templates[0];
  if (!t) return STATIC_TEMPLATES[0];
  if (isTemplateAvailable(t, plan)) return t;
  return templates.find((x) => isTemplateAvailable(x, plan)) || STATIC_TEMPLATES[0];
}
