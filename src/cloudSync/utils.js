import uuid from "react-native-uuid";

export function generateUUID() {
    return uuid.v4();
}

export function nowISO() {
    return new Date().toISOString()
}

export function getNextRetryTime(retryCount) {
  const delays = [
    5000,    // 5 sec
    10000,   // 10 sec
    30000,   // 30 sec
    60000,   // 1 min
    300000   // 5 min
  ]

  const delay = delays[Math.min(retryCount, delays.length - 1)]

  return new Date(Date.now() + delay).toISOString()
}