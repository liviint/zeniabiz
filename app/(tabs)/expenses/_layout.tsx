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
            <Stack.Screen 
                name="[id]/index" 
                options={{ title: 'View Transaction' }} 
            />

            <Stack.Screen 
                name="[id]/edit/index" 
                options={{ title: 'Edit Transaction' }} 
            />
            
            <Stack.Screen 
                name="add/index" 
                options={{ title: 'Add Transaction' }} 
            />
        </Stack>
    );
}