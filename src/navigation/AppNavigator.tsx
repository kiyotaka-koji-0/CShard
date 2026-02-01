import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import HomeScreen from '../screens/HomeScreen';
import ConfigurationScreen from '../screens/ConfigurationScreen';
import EditorScreen from '../screens/EditorScreen';
import { theme } from '../styles/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: theme.colors.primary,
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'CShard' }}
                />
                <Stack.Screen
                    name="Configuration"
                    component={ConfigurationScreen}
                    options={{ title: 'Configure File' }}
                />
                <Stack.Screen
                    name="Editor"
                    component={EditorScreen}
                    options={({ route }) => ({
                        title: route.params.config.fileTitle || 'Editor'
                    })}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
