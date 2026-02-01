import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList, FileHistoryItem } from '../types';
import { StorageService } from '../services/StorageService';
import { theme } from '../styles/theme';
import FileHistoryItemComponent from '../components/FileHistoryItem';
import { useFocusEffect } from '@react-navigation/native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
    const [history, setHistory] = useState<FileHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const loadHistory = async () => {
        try {
            setLoading(true);
            const historyData = await StorageService.getHistory();
            setHistory(historyData);
        } catch (error) {
            console.error('Error loading history:', error);
            Alert.alert('Error', 'Failed to load file history');
        } finally {
            setLoading(false);
        }
    };

    const handleAddFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/csv'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];

            navigation.navigate('Configuration', {
                fileUri: file.uri,
                fileName: file.name,
            });
        } catch (error) {
            console.error('Error picking file:', error);
            Alert.alert('Error', 'Failed to pick file. Please try again.');
        }
    };

    const handleOpenFile = (item: FileHistoryItem) => {
        navigation.navigate('Editor', {
            config: item.config,
        });
    };

    const handleDeleteFile = async (configId: string) => {
        Alert.alert(
            'Delete File',
            'Remove this file from history?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await StorageService.removeFromHistory(configId);
                            await loadHistory();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete file');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Files</Text>
                <Text style={styles.subtitle}>
                    Manage and edit your spreadsheets with ease
                </Text>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddFile}>
                <Text style={styles.addButtonIcon}>+</Text>
                <Text style={styles.addButtonText}>Add Spreadsheet</Text>
            </TouchableOpacity>

            {history.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyTitle}>No files yet</Text>
                    <Text style={styles.emptyText}>
                        Tap "Add Spreadsheet" to import your first file
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.config.id}
                    renderItem={({ item }) => (
                        <FileHistoryItemComponent
                            item={item}
                            onPress={() => handleOpenFile(item)}
                            onDelete={() => handleDeleteFile(item.config.id)}
                        />
                    )}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        margin: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.md,
    },
    addButtonIcon: {
        fontSize: theme.fontSize.xl,
        color: '#fff',
        fontWeight: theme.fontWeight.bold,
        marginRight: theme.spacing.sm,
    },
    addButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: '#fff',
    },
    listContainer: {
        padding: theme.spacing.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
});
