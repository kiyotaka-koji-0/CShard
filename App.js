import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { encode as btoa } from 'base-64';
import { saveToHistory, getHistory } from './src/utils/storageManager';
import { parseSpreadsheet, exportSpreadsheetWithColors } from './src/utils/spreadsheetParser';
import { useUndo } from './src/hooks/useUndo';
import { CardView } from './src/components/CardView';
import { HeaderSelectScreen } from './src/screens/HeaderSelectScreen';
import { CardGroupSelector } from './src/screens/CardGroupSelector';

export default function App() {
  const [screen, setScreen] = useState('home'); // home, headerSelect, groupSelect, or spreadsheet
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [tempData, setTempData] = useState(null); // For header selection
  const [titleRow, setTitleRow] = useState(null); // Store title/merged row
  const [fileName, setFileName] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [rowColors, setRowColors] = useState({});
  const [groupingColumn, setGroupingColumn] = useState(0);
  const [originalWorkbook, setOriginalWorkbook] = useState(null); // Store original workbook
  const { push, undo, redo, getCurrentData, canUndo, canRedo } = useUndo(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await getHistory();
      setRecentFiles(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const asset = result.assets[0];
      const fileUri = asset.uri;
      const fname = asset.name;

      const file = new File(fileUri);
      const content = await file.text();
      
      let binary = '';
      for (let i = 0; i < content.length; i++) {
        binary += String.fromCharCode(content.charCodeAt(i) & 0xff);
      }
      const base64Content = btoa(binary);
      
      const parsed = await parseSpreadsheet(base64Content, fname, true);
      setTempData(parsed.data);
      setRowColors(parsed.rowColors || {});
      setOriginalWorkbook(parsed.originalWorkbook); // Store original workbook
      setFileName(fname);
      await saveToHistory(fname, fileUri);
      setScreen('headerSelect');
    } catch (error) {
      Alert.alert('Error', 'Failed to load spreadsheet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderSelect = (headerRowIndex) => {
    if (!tempData) return;
    
    // Reorder data so selected row becomes header
    const headerRow = tempData[headerRowIndex];
    const dataRows = [
      ...tempData.slice(0, headerRowIndex),
      ...tempData.slice(headerRowIndex + 1),
    ];
    
    // Identify and preserve title rows (rows with repeated values)
    let extractedTitleRow = null;
    
    // Filter out "title" rows where most cells contain the same repeated value
    const cleanedRows = dataRows.filter(row => {
      // Skip empty rows
      if (row.every(cell => !cell || String(cell).trim() === '')) {
        return false;
      }
      
      // Check if this is a title row (same value repeated across many cells)
      const nonEmptyCells = row.filter(cell => cell && String(cell).trim() !== '');
      if (nonEmptyCells.length === 0) return false;
      
      // Count how many cells have the same value as the first non-empty cell
      const firstValue = nonEmptyCells[0];
      const sameValueCount = nonEmptyCells.filter(cell => cell === firstValue).length;
      
      // If more than 50% of cells have the same value, it's likely a title row
      if (sameValueCount / nonEmptyCells.length > 0.5 && nonEmptyCells.length > 3) {
        if (!extractedTitleRow) {
          extractedTitleRow = firstValue; // Store the title
        }
        return false;
      }
      
      return true;
    });
    
    setTitleRow(extractedTitleRow);
    const newData = [headerRow, ...cleanedRows];
    setTempData(newData);
    setScreen('groupSelect');
  };

  const handleGroupSelect = (columnIndex) => {
    setGroupingColumn(columnIndex);
    setSpreadsheetData(tempData);
    push(tempData);
    setScreen('spreadsheet');
  };

  const handleDataChange = (newData) => {
    setSpreadsheetData(newData);
    push(newData);
  };

  const handleAddRow = () => {
    const newRow = Array(spreadsheetData[0]?.length || 1).fill('');
    const newData = [...spreadsheetData, newRow];
    
    // Auto-assign color from existing palette (cycle through colors)
    const existingColors = Object.values(rowColors).filter(c => c && c !== '#1e1e1e');
    if (existingColors.length > 0) {
      const newRowIndex = newData.length - 1;
      // Use modulo to cycle through the palette
      const colorIndex = (newRowIndex - 1) % existingColors.length;
      setRowColors({
        ...rowColors,
        [newRowIndex]: existingColors[colorIndex],
      });
    }
    
    setSpreadsheetData(newData);
    push(newData);
  };

  const handleAddColumn = () => {
    const newData = spreadsheetData.map(row => [...row, '']);
    setSpreadsheetData(newData);
    push(newData);
  };

  const handleExport = async () => {
    try {
      const Sharing = await import('expo-sharing');
      
      const result = await exportSpreadsheetWithColors(
        spreadsheetData, 
        fileName, 
        rowColors,
        titleRow, // Pass title to be merged and centered
        originalWorkbook // Pass original workbook for cloning
      );
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Open share dialog to let user choose where to save
        await Sharing.shareAsync(result.filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Save Spreadsheet',
        });
        Alert.alert('Success', 'File ready to export!');
      } else {
        Alert.alert('Success', `File saved to:\n${result.filePath}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export: ' + error.message);
    }
  };

  if (screen === 'headerSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderSelectScreen
          data={tempData || []}
          onSelect={handleHeaderSelect}
          onCancel={() => setScreen('home')}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'groupSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <CardGroupSelector
          headers={tempData ? tempData[0] : []}
          onSelect={handleGroupSelect}
          onCancel={() => setScreen('headerSelect')}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>CShard</Text>
          <Text style={styles.subtitle}>Offline Spreadsheet Editor</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2196f3" style={{ flex: 1 }} />
        ) : recentFiles.length > 0 ? (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Recent Files</Text>
            {recentFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                style={styles.fileCard}
                onPress={() => handlePickFile()}
              >
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileDate}>
                  {new Date(file.timestamp).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent files</Text>
          </View>
        )}

        <TouchableOpacity style={styles.fab} onPress={handlePickFile}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Spreadsheet screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.spreadsheetHeader}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        {titleRow ? (
          <TextInput
            style={styles.titleInput}
            value={titleRow}
            onChangeText={setTitleRow}
            placeholder="Document Title"
            placeholderTextColor="#666"
          />
        ) : (
          <Text style={styles.spreadsheetTitle}>{fileName}</Text>
        )}
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

      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ flex: 1 }} />
      ) : spreadsheetData && spreadsheetData.length > 0 ? (
        <CardView
          data={spreadsheetData}
          onDataChange={handleDataChange}
          rowColors={rowColors}
          onRowColorsChange={setRowColors}
          groupingColumn={groupingColumn}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data loaded</Text>
        </View>
      )}

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.button} onPress={handleAddRow}>
          <Text style={styles.buttonText}>+ Add Entry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  fileCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  fileName: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  fileDate: {
    fontSize: 12,
    color: '#888',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  spreadsheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#2196f3',
    fontSize: 16,
  },
  spreadsheetTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 8,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.3,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
