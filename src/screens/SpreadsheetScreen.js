import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { parseSpreadsheet, exportSpreadsheet } from '../utils/spreadsheetParser';
import { useUndo } from '../hooks/useUndo';
import { SpreadsheetGrid } from '../components/SpreadsheetGrid';

export const SpreadsheetScreen = ({ route, navigation }) => {
  const { fileUri, fileName } = route.params;
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [styles, setStyles] = useState({});
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { push, undo, redo, getCurrentData, canUndo, canRedo } = useUndo(null);

  useEffect(() => {
    loadSpreadsheet();
  }, []);

  const loadSpreadsheet = async () => {
    try {
      setLoading(true);
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const parsed = await parseSpreadsheet(fileContent, fileName);
      setSpreadsheetData(parsed.data);
      setStyles(parsed.styles);
      push(parsed.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load spreadsheet: ' + error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = (newData) => {
    setSpreadsheetData(newData);
    push(newData);
  };

  const handleExport = async () => {
    try {
      const result = await exportSpreadsheet(spreadsheetData, fileName, styles);
      setSnackbarMessage(`Exported: ${result.fileName}`);
      Alert.alert('Success', `File saved to: ${result.fileName}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to export file: ' + error.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1976d2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{fileName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={undo}
            disabled={!canUndo}
            style={[styles.headerButton, !canUndo && styles.disabledButton]}
          >
            <Text style={styles.headerButtonText}>↶</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={redo}
            disabled={!canRedo}
            style={[styles.headerButton, !canRedo && styles.disabledButton]}
          >
            <Text style={styles.headerButtonText}>↷</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>↓</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SpreadsheetGrid
        data={spreadsheetData || []}
        onDataChange={handleDataChange}
        onAddRow={handleDataChange}
        onDeleteRow={handleDataChange}
        onAddColumn={handleDataChange}
        onDeleteColumn={handleDataChange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 18,
    color: '#1976d2',
  },
  disabledButton: {
    opacity: 0.3,
  },
});
