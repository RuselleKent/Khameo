import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export async function setJSON(key, value) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}
export async function remove(key) {
  try { await AsyncStorage.removeItem(key); } catch {}
}
