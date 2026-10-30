// Pang-save ng maliliit na data sa phone.
// Ang session (may token) ay sine-save sa SecureStore: naka-encrypt ito sa phone.
// Sa web wala ang SecureStore, kaya AsyncStorage ang gamit doon.
// Hindi nagla-lock ang app kahit pumalya ang pag-save.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useSecure = Platform.OS !== 'web';

async function readRaw(key) {
    return useSecure ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key);
}

async function writeRaw(key, value) {
    return useSecure ? SecureStore.setItemAsync(key, value) : AsyncStorage.setItem(key, value);
}

async function deleteRaw(key) {
    return useSecure ? SecureStore.deleteItemAsync(key) : AsyncStorage.removeItem(key);
}

export async function getJSON(key, fallback) {
    try {
        const raw = await readRaw(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export async function setJSON(key, value) {
    try {
        await writeRaw(key, JSON.stringify(value));
    } catch {
        // Hindi kritikal kapag hindi na-save
    }
}

export async function remove(key) {
    try {
        await deleteRaw(key);
    } catch {
        // Hindi kritikal
    }
}
