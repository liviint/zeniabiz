import { Stack } from 'expo-router';

export default function ExpensesStackLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false, 
        }}>
            <Stack.Screen 
                name="index" 
                options={{ title: 'Expenses Overview' }} 
            />
            <Stack.Screen 
                name="[id]/index" 
                options={{ title: 'View Expense' }} 
            />

            <Stack.Screen 
                name="[id]/edit/index" 
                options={{ title: 'Edit Expense' }} 
            />
            
            <Stack.Screen 
                name="add/index" 
                options={{ title: 'Add Expense' }} 
            />

            <Stack.Screen 
                name="categories/index" 
                options={{ title: 'Categories Overview' }} 
            />
            <Stack.Screen 
                name="categories/[id]/index" 
                options={{ title: 'View Category' }} 
            />

            <Stack.Screen 
                name="categories/[id]/edit/index" 
                options={{ title: 'Edit Category' }} 
            />
            
            <Stack.Screen 
                name="categories/add/index" 
                options={{ title: 'Add Category' }} 
            />

            
            <Stack.Screen 
                name="templates/index" 
                options={{ title: 'Template Overview' }} 
            />
            <Stack.Screen 
                name="templates/[id]/index" 
                options={{ title: 'View Template' }} 
            />

            <Stack.Screen 
                name="templates/[id]/edit/index" 
                options={{ title: 'Edit Template' }} 
            />
            
            <Stack.Screen 
                name="templates/add/index" 
                options={{ title: 'Add Template' }} 
            />
            

        </Stack>
    );
}