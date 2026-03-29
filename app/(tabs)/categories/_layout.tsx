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
                options={{ title: 'Single Category' }} 
            />
            <Stack.Screen 
                name="[id]/edit/index" 
                options={{ title: 'Edit Category' }} 
            />
            
            <Stack.Screen 
                name="add/index" 
                options={{ title: 'New Category' }} 
            />
            <Stack.Screen 
                name="stats/index" 
                options={{ title: 'Category Stats' }} 
            />
        </Stack>
    );
}