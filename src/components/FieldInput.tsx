import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CellStyle } from '../types';
import { theme } from '../styles/theme';

interface Props {
    label: string;
    value: any;
    style?: CellStyle;
    onChange: (value: string) => void;
}

export default function FieldInput({ label, value, style: cellStyle, onChange }: Props) {
    // Determine text color based on cell style
    const textColor = cellStyle?.color || theme.colors.text;
    const backgroundColor = cellStyle?.backgroundColor;

    // Format display value
    const displayValue = value?.toString() || '';

    // Build input styles safely - avoid passing booleans through style system
    const inputStyles: any[] = [styles.input];
    if (backgroundColor) {
        inputStyles.push({ backgroundColor: backgroundColor + '20' });
    }
    if (cellStyle?.bold === true) {
        inputStyles.push({ fontWeight: 'bold' as const });
    }
    if (cellStyle?.italic === true) {
        inputStyles.push({ fontStyle: 'italic' as const });
    }

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>{label}</Text>
                {backgroundColor && (
                    <View style={[styles.styleIndicator, { backgroundColor }]} />
                )}
            </View>
            <TextInput
                style={inputStyles}
                value={displayValue}
                onChangeText={onChange}
                placeholder={`Enter ${label}`}
                placeholderTextColor={theme.colors.textLight}
                multiline
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    label: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textSecondary,
    },
    styleIndicator: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        minHeight: 40,
    },
});
