import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export const HeaderSelectScreen = ({ data, onSelect, onCancel }) => {
  const [selectedRow, setSelectedRow] = useState(0);

  // Filter out empty rows and find likely header candidates
  const validRows = data.filter((row, index) => {
    const hasContent = row.some(cell => cell && String(cell).trim() !== '');
    return hasContent;
  });

  const handleConfirm = () => {
    // Find the original index of the selected row
    const selectedRowData = validRows[selectedRow];
    const originalIndex = data.findIndex(row => 
      row.length === selectedRowData.length && 
      row.every((cell, i) => cell === selectedRowData[i])
    );
    onSelect(originalIndex >= 0 ? originalIndex : selectedRow);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Header Row</Text>
        <Text style={styles.subtitle}>Choose which row contains field names</Text>
      </View>

      <ScrollView style={styles.previewContainer}>
        {validRows.slice(0, 10).map((row, index) => (
          <TouchableOpacity
            key={`row-${index}`}
            style={[
              styles.rowCard,
              selectedRow === index && styles.selectedRowCard,
            ]}
            onPress={() => setSelectedRow(index)}
          >
            <View style={styles.rowNumber}>
              <Text style={styles.rowNumberText}>Row {index + 1}</Text>
            </View>
            <View style={styles.rowPreview}>
              {row.slice(0, 3).map((cell, cellIndex) => (
                <Text key={cellIndex} style={styles.cellText} numberOfLines={1}>
                  {String(cell || '').substring(0, 20)}
                  {String(cell || '').length > 20 ? '...' : ''}
                </Text>
              ))}
              {row.length > 3 && (
                <Text style={styles.moreText}>+{row.length - 3} more</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  previewContainer: {
    flex: 1,
    padding: 12,
  },
  rowCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedRowCard: {
    borderColor: '#2196f3',
    backgroundColor: '#1a2332',
  },
  rowNumber: {
    marginBottom: 8,
  },
  rowNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196f3',
  },
  rowPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cellText: {
    fontSize: 13,
    color: '#ddd',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  moreText: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2196f3',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
