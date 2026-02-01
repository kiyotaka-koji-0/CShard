import AsyncStorage from '@react-native-async-storage/async-storage';
import { FileConfig, FileHistoryItem } from '../types';

const STORAGE_KEYS = {
    FILE_HISTORY: '@cshard:file_history',
    FILE_CONFIGS: '@cshard:file_configs',
};

export class StorageService {
    /**
     * Save file configuration
     */
    static async saveFileConfig(config: FileConfig): Promise<void> {
        try {
            const configs = await this.getAllConfigs();
            configs[config.id] = config;
            await AsyncStorage.setItem(STORAGE_KEYS.FILE_CONFIGS, JSON.stringify(configs));
        } catch (error) {
            console.error('Error saving file config:', error);
            throw error;
        }
    }

    /**
     * Get file configuration by ID
     */
    static async getFileConfig(id: string): Promise<FileConfig | null> {
        try {
            const configs = await this.getAllConfigs();
            return configs[id] || null;
        } catch (error) {
            console.error('Error getting file config:', error);
            return null;
        }
    }

    /**
     * Get all configurations
     */
    static async getAllConfigs(): Promise<{ [id: string]: FileConfig }> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.FILE_CONFIGS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting all configs:', error);
            return {};
        }
    }

    /**
     * Delete file configuration
     */
    static async deleteFileConfig(id: string): Promise<void> {
        try {
            const configs = await this.getAllConfigs();
            delete configs[id];
            await AsyncStorage.setItem(STORAGE_KEYS.FILE_CONFIGS, JSON.stringify(configs));
        } catch (error) {
            console.error('Error deleting file config:', error);
            throw error;
        }
    }

    /**
     * Add file to history
     */
    static async addToHistory(item: FileHistoryItem): Promise<void> {
        try {
            const history = await this.getHistory();

            // Remove existing entry if present
            const filtered = history.filter(h => h.config.id !== item.config.id);

            // Add to beginning
            filtered.unshift(item);

            // Keep only last 20 items
            const trimmed = filtered.slice(0, 20);

            await AsyncStorage.setItem(STORAGE_KEYS.FILE_HISTORY, JSON.stringify(trimmed));
        } catch (error) {
            console.error('Error adding to history:', error);
            throw error;
        }
    }

    /**
     * Get file history
     */
    static async getHistory(): Promise<FileHistoryItem[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.FILE_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    /**
     * Remove from history
     */
    static async removeFromHistory(configId: string): Promise<void> {
        try {
            const history = await this.getHistory();
            const filtered = history.filter(h => h.config.id !== configId);
            await AsyncStorage.setItem(STORAGE_KEYS.FILE_HISTORY, JSON.stringify(filtered));

            // Also delete config
            await this.deleteFileConfig(configId);
        } catch (error) {
            console.error('Error removing from history:', error);
            throw error;
        }
    }

    /**
     * Clear all data (for debugging)
     */
    static async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.FILE_HISTORY,
                STORAGE_KEYS.FILE_CONFIGS,
            ]);
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    }
}
