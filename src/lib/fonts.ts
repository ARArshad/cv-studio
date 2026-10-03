import type { FontKey } from "./types";

export const FONTS: { key: FontKey; name: string; css: string; kind: "Sans" | "Serif" }[] = [
  { key: "inter", name: "Inter", css: "var(--f-inter), system-ui, sans-serif", kind: "Sans" },
  { key: "lato", name: "Lato", css: "var(--f-lato), system-ui, sans-serif", kind: "Sans" },
  { key: "roboto", name: "Roboto", css: "var(--f-roboto), system-ui, sans-serif", kind: "Sans" },
  { key: "openSans", name: "Open Sans", css: "var(--f-open-sans), system-ui, sans-serif", kind: "Sans" },
  { key: "sourceSans", name: "Source Sans", css: "var(--f-source-sans), system-ui, sans-serif", kind: "Sans" },
  { key: "montserrat", name: "Montserrat", css: "var(--f-montserrat), system-ui, sans-serif", kind: "Sans" },
  { key: "raleway", name: "Raleway", css: "var(--f-raleway), system-ui, sans-serif", kind: "Sans" },
  { key: "merriweather", name: "Merriweather", css: "var(--f-merriweather), Georgia, serif", kind: "Serif" },
  { key: "lora", name: "Lora", css: "var(--f-lora), Georgia, serif", kind: "Serif" },
  { key: "playfair", name: "Playfair Display", css: "var(--f-playfair), Georgia, serif", kind: "Serif" },
  { key: "ebGaramond", name: "EB Garamond", css: "var(--f-eb-garamond), Georgia, serif", kind: "Serif" },
];

export function fontCss(key: FontKey): string {
  return (FONTS.find((f) => f.key === key) ?? FONTS[0]).css;
}
