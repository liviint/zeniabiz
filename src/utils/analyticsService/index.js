import analytics from '@react-native-firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AnalyticsService = {
    async logFirstEvent(eventName, params = {}) {
        try {
            const key = `analytics_${eventName}`;

            const alreadyLogged = await AsyncStorage.getItem(key);

            if (alreadyLogged) return;

            await analytics().logEvent(eventName, params);

            await AsyncStorage.setItem(key, 'true');
        } catch (error) {
            console.log('Analytics Error:', error);
        }
    },

    async logEvent(eventName, params = {}) {
        try {
            await analytics().logEvent(eventName, params);
        } catch (error) {
            console.log('Analytics Error:', error);
        }
    }
};