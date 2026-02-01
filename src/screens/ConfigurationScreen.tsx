import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, FileConfig } from '../types';
import { ExcelService } from '../services/ExcelService';
import { StorageService } from '../services/StorageService';
import { theme } from '../styles/theme';

type ConfigurationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Configuration'>;
type ConfigurationScreenRouteProp = RouteProp<RootStackParamList, 'Configuration'>;

interface Props {
    navigation: ConfigurationScreenNavigationProp;
    route: ConfigurationScreenRouteProp;
}

// Raw row data from Excel
interface RawRowData {
    rowIndex: number;
    cells: string[];
}

export default function ConfigurationScreen({ navigation, route }: Props) {
    const { fileUri, fileName, existingConfig } = route.params;

    const [loading, setLoading] = useState(true);
    const [rawRows, setRawRows] = useState<RawRowData[]>([]);
    const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(1);
    const [selectedTitleColumn, setSelectedTitleColumn] = useState<number>(0);
    const [fileTitle, setFileTitle] = useState(fileName.replace(/\.(xlsx|xls|csv)$/i, ''));
    const [step, setStep] = useState<'selectHeaderRow' | 'selectTitleColumn'>('selectHeaderRow');

    useEffect(() => {
        loadFile();
    }, []);

    const loadFile = async () => {
        try {
            setLoading(true);
            const rows = await ExcelService.readRawRows(fileUri);
            setRawRows(rows);

            // Default to first row as header
            if (rows.length > 0) {
                setSelectedHeaderRow(1);
            }
        } catch (error) {
            console.error('Error loading file:', error);
            Alert.alert('Error', 'Failed to read file. Please try another file.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    // Get headers from selected row
    const getHeaders = (): string[] => {
        const headerRowData = rawRows.find(r => r.rowIndex === selectedHeaderRow);
        return headerRowData?.cells || [];
    };

    const handleSelectHeaderRow = (rowIndex: number) => {
        setSelectedHeaderRow(rowIndex);
    };

    const handleContinueToTitleSelection = () => {
        const headers = getHeaders();
        if (headers.length === 0) {
            Alert.alert('Error', 'Selected row has no data. Please select another row.');
            return;
        }
        setStep('selectTitleColumn');
    };

    const handleContinueToEditor = async () => {
        const headers = getHeaders();

        if (!fileTitle.trim()) {
            Alert.alert('Error', 'Please enter a file title');
            return;
        }

        try {
            // Now read the full data using selected header row
            const spreadsheetData = await ExcelService.readExcelFileWithHeaderRow(fileUri, selectedHeaderRow);

            const config: FileConfig = {
                id: existingConfig?.id || `file-${Date.now()}`,
                fileName,
                fileTitle: fileTitle.trim(),
                selectedHeaders: headers, // All headers from the selected row
                differentiationColumn: headers[selectedTitleColumn] || headers[0],
                fileUri,
                lastModified: Date.now(),
                entryCount: spreadsheetData.entries.length,
                headerRowIndex: selectedHeaderRow,
            };

            await StorageService.saveFileConfig(config);

            // Add to history
            await StorageService.addToHistory({
                config,
                previewData: {
                    firstEntryDiff: spreadsheetData.entries[0]?.cells[config.differentiationColumn]?.value?.toString() || '',
                    entryCount: config.entryCount,
                },
            });

            navigation.navigate('Editor', { config });
        } catch (error) {
            console.error('Error saving config:', error);
            Alert.alert('Error', 'Failed to save configuration');
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Reading file...</Text>
            </View>
        );
    }

    if (rawRows.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text>No data found in file</Text>
            </View>
        );
    }

    const headers = getHeaders();

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* File Title Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>File Title</Text>
                    <Text style={styles.sectionDescription}>
                        Give this file a memorable name
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={fileTitle}
                        onChangeText={setFileTitle}
                        placeholder="Enter file title"
                        placeholderTextColor={theme.colors.textLight}
                    />
                </View>

                {step === 'selectHeaderRow' ? (
                    <>
                        {/* Step 1: Select Header Row */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Header Row</Text>
                            <Text style={styles.sectionDescription}>
                                Choose the row that contains field names (e.g., S.No, Name, Amount)
                            </Text>

                            {rawRows.slice(0, 10).map((row) => (
                                <TouchableOpacity
                                    key={row.rowIndex}
                                    style={[
                                        styles.rowCard,
                                        selectedHeaderRow === row.rowIndex && styles.rowCardSelected,
                                    ]}
                                    onPress={() => handleSelectHeaderRow(row.rowIndex)}
                                >
                                    <View style={styles.rowHeader}>
                                        <Text style={styles.rowNumber}>Row {row.rowIndex}</Text>
                                        {selectedHeaderRow === row.rowIndex && (
                                            <Text style={styles.selectedBadge}>✓ Selected</Text>
                                        )}
                                    </View>
                                    <View style={styles.cellsContainer}>
                                        {row.cells.slice(0, 5).map((cell, idx) => (
                                            <View key={idx} style={styles.cellPreview}>
                                                <Text style={styles.cellText} numberOfLines={1}>
                                                    {cell || '(empty)'}
                                                </Text>
                                            </View>
                                        ))}
                                        {row.cells.length > 5 && (
                                            <Text style={styles.moreText}>+{row.cells.length - 5} more</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {rawRows.length > 10 && (
                                <Text style={styles.noteText}>
                                    Showing first 10 rows. Total: {rawRows.length} rows
                                </Text>
                            )}
                        </View>
                    </>
                ) : (
                    <>
                        {/* Step 2: Select Card Title Column */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Card Title Column</Text>
                            <Text style={styles.sectionDescription}>
                                Choose which field to display as the card title (e.g., Name)
                            </Text>

                            <View style={styles.headerGrid}>
                                {headers.map((header, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[
                                            styles.headerChip,
                                            selectedTitleColumn === idx && styles.headerChipSelected,
                                        ]}
                                        onPress={() => setSelectedTitleColumn(idx)}
                                    >
                                        <Text
                                            style={[
                                                styles.headerChipText,
                                                selectedTitleColumn === idx && styles.headerChipTextSelected,
                                            ]}
                                        >
                                            {header || `Column ${idx + 1}`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Preview */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoTitle}>Preview</Text>
                            <Text style={styles.infoText}>
                                📊 Fields: {headers.join(', ')}
                            </Text>
                            <Text style={styles.infoText}>
                                🏷️ Card title: {headers[selectedTitleColumn] || 'Column 1'}
                            </Text>
                            <Text style={styles.infoText}>
                                📂 {rawRows.length - 1} entries (after header row)
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setStep('selectHeaderRow')}
                        >
                            <Text style={styles.backButtonText}>← Change Header Row</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.footer}>
                {step === 'selectHeaderRow' ? (
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinueToTitleSelection}
                    >
                        <Text style={styles.continueButtonText}>
                            Continue with Row {selectedHeaderRow} →
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinueToEditor}
                    >
                        <Text style={styles.continueButtonText}>Continue to Editor →</Text>
                    </TouchableOpacity>
                )}
            </View>
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
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    sectionDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
    },
    rowCard: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    rowCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    rowNumber: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    selectedBadge: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.semibold,
    },
    cellsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
    },
    cellPreview: {
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    cellText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text,
        maxWidth: 80,
    },
    moreText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        alignSelf: 'center',
        marginLeft: theme.spacing.xs,
    },
    noteText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },
    headerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    headerChip: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    headerChipSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    headerChipText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
    },
    headerChipTextSelected: {
        color: '#fff',
        fontWeight: theme.fontWeight.semibold,
    },
    infoBox: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        marginBottom: theme.spacing.md,
    },
    infoTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    infoText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    backButton: {
        padding: theme.spacing.sm,
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
    },
    footer: {
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    continueButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        ...theme.shadows.md,
    },
    continueButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: '#fff',
    },
});
