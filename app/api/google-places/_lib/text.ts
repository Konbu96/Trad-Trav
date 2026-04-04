export function normalizePlacesText(text: string) {
  return text
    .toLowerCase()
    .replace(/[()（）「」『』・\s]/g, "");
}
