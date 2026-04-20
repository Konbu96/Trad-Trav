/** 同一セッション内で 404 等になった Place 写真 URL を覚え、再リクエストを避ける */
const failedPhotoUrls = new Set<string>();

export function markPlacePhotoFailed(url: string) {
  failedPhotoUrls.add(url);
}

export function isPlacePhotoKnownFailed(url: string) {
  return failedPhotoUrls.has(url);
}
