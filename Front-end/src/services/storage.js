// Pang-save ng maliliit na data sa phone (AsyncStorage). Hindi ito nagla-lock kahit pumalya.
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
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Hindi kritikal kapag hindi na-save
    }
}

export async function remove(key) {
    try {
        await AsyncStorage.removeItem(key);
    } catch {
        // Hindi kritikal
    }
}
