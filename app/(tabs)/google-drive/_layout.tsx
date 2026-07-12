import { Stack } from 'expo-router';

export default function ExpensesStackLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false, 
        }}>
            <Stack.Screen 
                name="index" 
                options={{ title: 'Google Drive' }} 
            />
        </Stack>
    );
}