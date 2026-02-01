import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { FileHistoryItem } from '../types';
import { theme } from '../styles/theme';

interface Props {
    item: FileHistoryItem;
    onPress: () => void;
    onDelete: () => void;
}

export default function FileHistoryItemComponent({ item, onPress, onDelete }: Props) {
    const { config, previewData } = item;

    // Format last modified date
    const lastModifiedDate = new Date(config.lastModified);
    const formattedDate = lastModifiedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.mainContent} onPress={onPress} activeOpacity={0.7}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>📊</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {config.fileTitle}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {config.fileName}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                            {config.entryCount} {config.entryCount === 1 ? 'entry' : 'entries'}
                        </Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.sm,
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
        padding: theme.spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    icon: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textLight,
    },
    metaDot: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textLight,
        marginHorizontal: 4,
    },
    deleteButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.error + '10',
    },
    deleteIcon: {
        fontSize: 20,
    },
});
