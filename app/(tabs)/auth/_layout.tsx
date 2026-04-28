import { Stack } from 'expo-router';

export default function ExpensesStackLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false, 
        }}>
            <Stack.Screen 
                name="index" 
                options={{ title: 'Auth' }} 
            />
            <Stack.Screen 
                name="login/index" 
                options={{ title: 'Login' }} 
            />

            <Stack.Screen 
                name="signup/index" 
                options={{ title: 'Sign Up' }} 
            />
            
            <Stack.Screen 
                name="verify-email/index" 
                options={{ title: 'Veify Email' }} 
            />

            <Stack.Screen 
                name="reset-password-confirm/index" 
                options={{ title: 'Veify Email' }} 
            />

            <Stack.Screen 
                name="reset-password/index" 
                options={{ title: 'Veify Email' }} 
            />

        </Stack>
    );
}