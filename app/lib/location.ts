export function makeLocationKey(latitude: number, longitude: number, digits: number = 3) {
  return `${latitude.toFixed(digits)}:${longitude.toFixed(digits)}`;
}
