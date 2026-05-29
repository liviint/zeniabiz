import { Stack } from 'expo-router';

export default function ExpensesStackLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false, 
        }}>
            <Stack.Screen 
                name="index" 
                options={{ title: 'Credits Overview' }} 
            />
            <Stack.Screen 
                name="[id]/index" 
                options={{ title: 'View Credit' }} 
            />
            
            <Stack.Screen 
                name="add/index" 
                options={{ title: 'Add Credit' }} 
            />

        </Stack>
    );
}