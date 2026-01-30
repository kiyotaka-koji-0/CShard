import React, { useState, useCallback } from 'react';
import { View, ScrollView, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';

export const SpreadsheetGrid = ({
  data,
  onDataChange,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
  onCellColorChange,
}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [cellColors, setCellColors] = useState({});

  const handleCellPress = useCallback((rowIndex, colIndex) => {
    setSelectedCell({ rowIndex, colIndex });
    setEditValue(data[rowIndex]?.[colIndex] || '');
  }, [data]);

  const handleCellChange = useCallback(
    (rowIndex, colIndex, value) => {
      const newData = data.map((row, rIdx) =>
        rIdx === rowIndex
          ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell))
          : row
      );
      onDataChange(newData);
    },
    [data, onDataChange]
  );

  const handleAddRow = () => {
    const newRow = Array(data[0]?.length || 1).fill('');
    onAddRow([...data, newRow]);
  };

  const handleAddColumn = () => {
    const newData = data.map(row => [...row, '']);
    onAddColumn(newData);
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data loaded. Import a spreadsheet to begin.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal={true} style={styles.horizontalScroll}>
        <ScrollView style={styles.verticalScroll}>
          {data.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((cell, colIndex) => (
                <TextInput
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    selectedCell?.rowIndex === rowIndex &&
                    selectedCell?.colIndex === colIndex
                      ? styles.selectedCell
                      : {},
                    cellColors[`${rowIndex}-${colIndex}`] || {},
                  ]}
                  value={cell || ''}
                  onChangeText={(text) =>
                    handleCellChange(rowIndex, colIndex, text)
                  }
                  onFocus={() => handleCellPress(rowIndex, colIndex)}
                  placeholder={`${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`}
                  placeholderTextColor="#ccc"
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.button} onPress={handleAddRow}>
          <Text style={styles.buttonText}>+ Row</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleAddColumn}>
          <Text style={styles.buttonText}>+ Column</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onDeleteRow(data.filter((_, idx) => idx !== selectedCell?.rowIndex))}
        >
          <Text style={styles.buttonText}>Delete Row</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  horizontalScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cell: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    minWidth: 100,
    minHeight: 50,
    fontSize: 14,
  },
  selectedCell: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1976d2',
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
