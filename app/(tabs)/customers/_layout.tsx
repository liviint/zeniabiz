import { Stack } from 'expo-router';

export default function ExpensesStackLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false, 
        }}>
            <Stack.Screen 
                name="index" 
                options={{ title: 'Customers Overview' }} 
            />
            <Stack.Screen 
                name="[id]/index" 
                options={{ title: 'View Customer' }} 
            />

        </Stack>
    );
}