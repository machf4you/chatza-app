// client/src/brands.js
export const BRAND_CONFIG = {
  chatza: {
    key: "chatza",
    name: "Chatza",
    primaryColor: "#9FC743", // Lime Green for Chatza
    accentColor: "rgba(159, 199, 67, 0.1)", // Lime tint
  },
  chili: {
    key: "chili",
    name: "Smoking Chili Media",
    primaryColor: "#ef4444", // Chili Red
    accentColor: "rgba(239, 68, 68, 0.1)", // Red tint
  },
  tse: {
    key: "tse",
    name: "The Search Equation",
    primaryColor: "#3b82f6", // Blue
    accentColor: "rgba(59, 130, 246, 0.1)", // Blue tint
  }
};

export function getBrandConfig() {
  const params = new URLSearchParams(window.location.search);
  const q = (params.get("brand") || "").trim().toLowerCase();

  // If a valid brand matches the query, return it
  if (q && BRAND_CONFIG[q]) {
    return BRAND_CONFIG[q];
  }

  // Fallback default is Chatza
  return BRAND_CONFIG.chatza;
}
