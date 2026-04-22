export interface StoredVerifiedLocation {
  lat: number;
  lng: number;
  locationName: string;
  locationRadius?: number;
  memberId?: number;
  verifiedAt: string;
}

const STORAGE_KEY = "getchu.verifiedLocation";

function readAll(): Record<string, StoredVerifiedLocation> {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function getMemberKey(memberId?: number) {
  return memberId ? `member:${memberId}` : "guest";
}

export function saveVerifiedLocation(location: Omit<StoredVerifiedLocation, "verifiedAt">) {
  const nextLocation: StoredVerifiedLocation = {
    ...location,
    verifiedAt: new Date().toISOString(),
  };
  const allLocations = readAll();

  allLocations[getMemberKey(location.memberId)] = nextLocation;
  allLocations.guest = nextLocation;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allLocations));
}

export function getVerifiedLocation(memberId?: number) {
  const allLocations = readAll();
  return memberId ? allLocations[getMemberKey(memberId)] ?? null : allLocations.guest ?? null;
}
