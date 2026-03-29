import AsyncStorage from '@react-native-async-storage/async-storage';

export const safeLocalStorage = {
getItem: async (key) => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) :  null;
    } catch (error) {
        console.error('Error getting item:', error);
        return null;
    }
},

setItem: async (key, value) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
        console.log(key,value,"setting user store")
    } catch (error) {
        console.error('Error setting item:', error);
    }
},

removeItem: async (key) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing item:', error);
    }
},

clear: async () => {
    try {
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
    },
};
