/** 2点間の球面距離（メートル） */
export function getDistanceMeters(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(toLatitude - fromLatitude);
  const dLng = toRadians(toLongitude - fromLongitude);
  const startLat = toRadians(fromLatitude);
  const endLat = toRadians(toLatitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(startLat) * Math.cos(endLat);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 直線距離からお車での目安所要時間（分）。道のり約1.35倍・平均時速35km/h の簡易推定 */
export function estimateDrivingMinutesFromCrowMeters(meters: number): number {
  const birdKm = meters / 1000;
  const roadKm = birdKm * 1.35;
  const minutes = Math.round((roadKm / 35) * 60);
  return Math.max(1, Math.min(minutes, 24 * 60));
}

/** 直線キロ表示（1桁小数または整数） */
export function formatStraightLineKm(meters: number): string {
  const km = meters / 1000;
  if (km < 10) return String(Math.round(km * 10) / 10);
  return String(Math.round(km));
}
