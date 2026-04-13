import { Stack } from 'expo-router';

export default function HabitsStackLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false, 
        }}>
            <Stack.Screen 
                name="index" 
                options={{ title: 'Transactions Overview' }} 
            />
        </Stack>
    );
}