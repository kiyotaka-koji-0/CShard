import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { Entry, FileConfig, CellStyle } from '../types';
import { theme } from '../styles/theme';
import FieldInput from './FieldInput';

interface Props {
    entry: Entry;
    config: FileConfig;
    onUpdate: (entryId: string, updatedCells: Entry['cells']) => void;
    onDelete: (entryId: string) => void;
    availableColors?: string[]; // Colors from imported file
}

// Default color palette
const DEFAULT_COLORS = [
    '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF',
    '#9B59B6', '#E91E63', '#00BCD4', '#8BC34A', '#FFC107',
    '#795548', '#607D8B', '#000000', '#FFFFFF',
];

export default function EntryCard({
    entry,
    config,
    onUpdate,
    onDelete,
    availableColors = DEFAULT_COLORS,
}: Props) {
    const [expanded, setExpanded] = useState(false);
    const [colorPickerVisible, setColorPickerVisible] = useState(false);

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    const handleFieldChange = (header: string, value: string) => {
        const updatedCells = {
            ...entry.cells,
            [header]: {
                ...entry.cells[header],
                value,
            },
        };
        onUpdate(entry.id, updatedCells);
    };

    const handleColorChange = (color: string | null) => {
        // Apply color to all cells in this row
        const updatedCells: Entry['cells'] = {};

        for (const [header, cellData] of Object.entries(entry.cells)) {
            const newStyle: CellStyle = { ...cellData.style };
            if (color) {
                newStyle.backgroundColor = color;
            } else {
                delete newStyle.backgroundColor;
            }

            updatedCells[header] = {
                ...cellData,
                style: newStyle,
            };
        }

        onUpdate(entry.id, updatedCells);
        setColorPickerVisible(false);
    };

    // Get differentiation value for card title
    const titleValue = entry.cells[config.differentiationColumn]?.value?.toString() || 'Untitled';

    // Get background color hint (if any)
    const diffCell = entry.cells[config.differentiationColumn];
    const backgroundColor = diffCell?.style?.backgroundColor;
    const subtleBackgroundColor = backgroundColor
        ? backgroundColor + '15' // Add 15% opacity
        : undefined;

    // Combine default colors with available colors from file
    const allColors = [...new Set([...availableColors, ...DEFAULT_COLORS])];

    return (
        <View style={[styles.container, subtleBackgroundColor && { backgroundColor: subtleBackgroundColor }]}>
            {/* Card Header - Always Visible */}
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpanded}
                activeOpacity={0.7}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.title} numberOfLines={1}>
                        {titleValue}
                    </Text>
                    {backgroundColor && (
                        <View style={[styles.colorIndicator, { backgroundColor }]} />
                    )}
                </View>
                <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {/* Card Body - Expandable */}
            {expanded && (
                <View style={styles.body}>
                    {config.selectedHeaders.map((header) => {
                        const cellData = entry.cells[header];
                        if (!cellData) return null;

                        return (
                            <FieldInput
                                key={header}
                                label={header}
                                value={cellData.value}
                                style={cellData.style}
                                onChange={(value) => handleFieldChange(header, value)}
                            />
                        );
                    })}

                    {/* Row Actions */}
                    <View style={styles.actionsRow}>
                        {/* Color Picker Button */}
                        <TouchableOpacity
                            style={styles.colorButton}
                            onPress={() => setColorPickerVisible(true)}
                        >
                            <View style={[
                                styles.colorButtonIndicator,
                                backgroundColor ? { backgroundColor } : { backgroundColor: '#DDD' }
                            ]} />
                            <Text style={styles.colorButtonText}>Row Color</Text>
                        </TouchableOpacity>

                        {/* Delete Button */}
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => onDelete(entry.id)}
                        >
                            <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Color Picker Modal */}
            <Modal
                visible={colorPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setColorPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setColorPickerVisible(false)}
                >
                    <View style={styles.colorPickerContainer}>
                        <Text style={styles.colorPickerTitle}>Select Row Color</Text>

                        <ScrollView contentContainerStyle={styles.colorGrid}>
                            {/* No color option */}
                            <TouchableOpacity
                                style={[styles.colorOption, styles.noColorOption]}
                                onPress={() => handleColorChange(null)}
                            >
                                <Text style={styles.noColorText}>✕</Text>
                            </TouchableOpacity>

                            {allColors.map((color, index) => (
                                <TouchableOpacity
                                    key={`${color}-${index}`}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        backgroundColor === color && styles.colorOptionSelected,
                                    ]}
                                    onPress={() => handleColorChange(color)}
                                />
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setColorPickerVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    title: {
        flex: 1,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    colorIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    chevron: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.sm,
    },
    body: {
        padding: theme.spacing.md,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    colorButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.xs,
    },
    colorButtonIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    colorButtonText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.medium,
    },
    deleteButton: {
        flex: 1,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.error + '10',
        borderWidth: 1,
        borderColor: theme.colors.error + '30',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.error,
        fontWeight: theme.fontWeight.medium,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorPickerContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        width: '85%',
        maxHeight: '60%',
        ...theme.shadows.lg,
    },
    colorPickerTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: theme.colors.primary,
        borderWidth: 3,
    },
    noColorOption: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    noColorText: {
        fontSize: 18,
        color: theme.colors.textSecondary,
    },
    cancelButton: {
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        fontWeight: theme.fontWeight.medium,
    },
});
