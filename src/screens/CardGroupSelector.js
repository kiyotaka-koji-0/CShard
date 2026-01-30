import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export const CardGroupSelector = ({ headers, onSelect, onCancel }) => {
  const [selectedColumn, setSelectedColumn] = useState(0);

  const handleConfirm = () => {
    onSelect(selectedColumn);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Card Grouping Column</Text>
        <Text style={styles.subtitle}>
          Choose which column to use for card titles (e.g., S.No, Name, ID)
        </Text>
      </View>

      <ScrollView style={styles.columnsContainer}>
        {headers.map((header, index) => (
          <TouchableOpacity
            key={`col-${index}`}
            style={[
              styles.columnCard,
              selectedColumn === index && styles.selectedColumnCard,
            ]}
            onPress={() => setSelectedColumn(index)}
          >
            <View style={styles.columnInfo}>
              <Text style={styles.columnLabel}>Column {index + 1}</Text>
              <Text style={styles.columnHeader}>{header || '(empty)'}</Text>
            </View>
            {selectedColumn === index && (
              <Text style={styles.checkmark}>✓</Text>
            )}
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
    lineHeight: 20,
  },
  columnsContainer: {
    flex: 1,
    padding: 12,
  },
  columnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedColumnCard: {
    borderColor: '#2196f3',
    backgroundColor: '#1a2332',
  },
  columnInfo: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
  },
  columnHeader: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 24,
    color: '#2196f3',
    marginLeft: 12,
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
