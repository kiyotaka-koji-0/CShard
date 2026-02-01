import React, { useState, useEffect } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { RootStackParamList, SpreadsheetData, Entry } from '../types';
import { ExcelService } from '../services/ExcelService';
import { StorageService } from '../services/StorageService';
import { theme } from '../styles/theme';
import EntryCard from '../components/EntryCard';

type EditorScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Editor'>;
type EditorScreenRouteProp = RouteProp<RootStackParamList, 'Editor'>;

interface Props {
    navigation: EditorScreenNavigationProp;
    route: EditorScreenRouteProp;
}

export default function EditorScreen({ navigation, route }: Props) {
    const { config } = route.params;

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Add export button to header
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
                    <Text style={styles.exportButtonText}>
                        {exporting ? '...' : 'Export'}
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [exporting, entries, spreadsheetData]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Use the header row index from config (default to 1 if not set)
            const headerRowIndex = config.headerRowIndex || 1;
            const data = await ExcelService.readExcelFileWithHeaderRow(config.fileUri, headerRowIndex);
            setSpreadsheetData(data);
            setEntries(data.entries);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load file data');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEntry = (entryId: string, updatedCells: Entry['cells']) => {
        setEntries(prev =>
            prev.map(entry =>
                entry.id === entryId
                    ? { ...entry, cells: updatedCells }
                    : entry
            )
        );
    };

    const handleDeleteEntry = (entryId: string) => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setEntries(prev => prev.filter(entry => entry.id !== entryId));
                    },
                },
            ]
        );
    };

    const handleAddEntry = () => {
        if (!spreadsheetData) return;

        const newEntry: Entry = {
            id: `new-${Date.now()}`,
            cells: {},
            rowIndex: entries.length + 2, // +2 for header row and 1-based indexing
        };

        // Initialize cells with empty values but preserve column styles
        config.selectedHeaders.forEach(header => {
            newEntry.cells[header] = {
                value: '',
                style: spreadsheetData.columnStyles[header],
                originalColumnIndex: spreadsheetData.headers.indexOf(header),
            };
        });

        setEntries(prev => [...prev, newEntry]);
    };

    const handleExport = async () => {
        if (!spreadsheetData) return;

        try {
            setExporting(true);

            // Create updated spreadsheet data
            const updatedData: SpreadsheetData = {
                ...spreadsheetData,
                entries,
            };

            // Generate output filename
            const timestamp = new Date().toISOString().split('T')[0];
            const outputFileName = `${config.fileTitle}_${timestamp}.xlsx`;

            // Write Excel file
            const outputUri = await ExcelService.writeExcelFile(
                updatedData,
                config.fileUri,
                outputFileName
            );

            // Share file
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(outputUri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Export Spreadsheet',
                });
            } else {
                Alert.alert('Success', `File saved to: ${outputFileName}`);
            }

            // Update config with new entry count
            const updatedConfig = {
                ...config,
                entryCount: entries.length,
                lastModified: Date.now(),
            };
            await StorageService.saveFileConfig(updatedConfig);

        } catch (error) {
            console.error('Error exporting file:', error);
            Alert.alert('Export Failed', 'Failed to export file. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.entryCount}>
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </Text>
            </View>

            <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    // Extract unique colors from the file for the color picker
                    const availableColors = extractColorsFromData();

                    return (
                        <EntryCard
                            entry={item}
                            config={config}
                            onUpdate={handleUpdateEntry}
                            onDelete={handleDeleteEntry}
                            availableColors={availableColors}
                        />
                    );
                }}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No entries found</Text>
                    </View>
                }
            />

            {/* Add Entry FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleAddEntry}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );

    // Helper to extract colors from spreadsheet data
    function extractColorsFromData(): string[] {
        const colors = new Set<string>();

        // Get colors from entries
        for (const entry of entries) {
            for (const cellData of Object.values(entry.cells)) {
                if (cellData?.style?.backgroundColor) {
                    colors.add(cellData.style.backgroundColor);
                }
                if (cellData?.style?.color) {
                    colors.add(cellData.style.color);
                }
            }
        }

        // Get colors from column styles
        if (spreadsheetData?.columnStyles) {
            for (const style of Object.values(spreadsheetData.columnStyles)) {
                if (style?.backgroundColor) {
                    colors.add(style.backgroundColor);
                }
                if (style?.color) {
                    colors.add(style.color);
                }
            }
        }

        return Array.from(colors);
    }
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
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    header: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    entryCount: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textSecondary,
    },
    listContainer: {
        padding: theme.spacing.md,
    },
    emptyContainer: {
        padding: theme.spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    exportButton: {
        marginRight: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: theme.borderRadius.md,
    },
    exportButtonText: {
        color: '#fff',
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        right: theme.spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    fabIcon: {
        fontSize: 28,
        color: '#fff',
        fontWeight: theme.fontWeight.bold,
    },
});
