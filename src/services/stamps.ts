import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stamp } from "../types/stamp";
import { getDayKey } from "../utils/date";

const STAMPS_KEY = "stamps";

export async function getAllStamps(): Promise<Stamp[]> {
  const raw = await AsyncStorage.getItem(STAMPS_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function saveStamp(uri: string, caption: string): Promise<Stamp> {
  const newStamp: Stamp = {
    id: Date.now().toString(),
    uri,
    caption,
    createdAt: new Date().toISOString(),
    dayKey: getDayKey(new Date()),
  };

  const stamps = await getAllStamps();
  const updated = [newStamp, ...stamps];
  await AsyncStorage.setItem(STAMPS_KEY, JSON.stringify(updated));

  return newStamp;
}

export async function getStampsByDay(dayKey: string): Promise<Stamp[]> {
  const stamps = await getAllStamps();
  return stamps.filter((stamp) => stamp.dayKey === dayKey);
}

export async function getGroupedStamps(): Promise<Record<string, Stamp[]>> {
  const stamps = await getAllStamps();

  return stamps.reduce<Record<string, Stamp[]>>((acc, stamp) => {
    if (!acc[stamp.dayKey]) acc[stamp.dayKey] = [];
    acc[stamp.dayKey].push(stamp);
    return acc;
  }, {});
}