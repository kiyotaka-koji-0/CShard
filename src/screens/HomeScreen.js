import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { saveToHistory, getHistory } from '../utils/storageManager';

export const HomeScreen = ({ navigation }) => {
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = async () => {
    try {
      const history = await getHistory();
      setRecentFiles(history);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recent files');
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      });

      if (!result.canceled) {
        const file = result.assets[0];
        await saveToHistory(file.name, file.uri);
        navigation.navigate('Spreadsheet', { fileUri: file.uri, fileName: file.name });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CShard</Text>
        <Text style={styles.subtitle}>Offline Spreadsheet Editor</Text>
      </View>

      {recentFiles.length > 0 ? (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Recent Files</Text>
          {recentFiles.map((item, index) => (
            <TouchableOpacity
              key={`${item.fileName}-${index}`}
              style={styles.fileCard}
              onPress={() =>
                navigation.navigate('Spreadsheet', {
                  fileUri: item.fileUri,
                  fileName: item.fileName,
                })
              }
            >
              <Text style={styles.fileName}>{item.fileName}</Text>
              <Text style={styles.fileDate}>
                {new Date(item.lastEdited).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No recent files. Import a spreadsheet to get started!
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={pickFile}>
        <Text style={styles.fabText}>+ Import File</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  fileCard: {
    marginBottom: 12,
  },
  fileDate: {
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
