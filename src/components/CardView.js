import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';

const PRESET_COLORS = [
  { name: 'Default', color: '#1e1e1e' },
  { name: 'Blue', color: '#1e3a5f' },
  { name: 'Purple', color: '#3d2b56' },
  { name: 'Green', color: '#1e4d2b' },
  { name: 'Orange', color: '#4d3319' },
  { name: 'Red', color: '#4d1e1e' },
  { name: 'Teal', color: '#1e4d4d' },
  { name: 'Pink', color: '#4d1e3d' },
];

export const CardView = ({ data, onDataChange, rowColors, onRowColorsChange, groupingColumn = 0 }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [localRowColors, setLocalRowColors] = useState(rowColors || {});
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [colorPickerRow, setColorPickerRow] = useState(null);
  
  // Extract unique colors from rowColors to build the palette
  const uniqueColors = React.useMemo(() => {
    const colors = Object.values(rowColors || {});
    const unique = [...new Set(colors)].filter(c => c && c !== '#1e1e1e');
    
    // Build palette from extracted colors + defaults
    const palette = [
      { name: 'Default', color: '#1e1e1e' },
      ...unique.map((color, idx) => ({
        name: `Color ${idx + 1}`,
        color,
      })),
      { name: 'Blue', color: '#1e3a5f' },
      { name: 'Purple', color: '#3d2b56' },
      { name: 'Green', color: '#1e4d2b' },
      { name: 'Orange', color: '#4d3319' },
      { name: 'Red', color: '#4d1e1e' },
      { name: 'Teal', color: '#1e4d4d' },
      { name: 'Pink', color: '#4d1e3d' },
    ];
    
    return palette;
  }, [rowColors]);
  
  // Initialize all cards as collapsed
  const [collapsedCards, setCollapsedCards] = useState(() => {
    const initial = {};
    if (data && data.length > 1) {
      for (let i = 0; i < data.length - 1; i++) {
        initial[i] = true; // All collapsed initially
      }
    }
    return initial;
  });
  
  if (!data || data.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const headers = data[0];
  const rows = data.slice(1);

  const handleCellChange = useCallback((rowIndex, colIndex, value) => {
    const newData = [...data];
    newData[rowIndex + 1][colIndex] = value;
    onDataChange(newData);
  }, [data, onDataChange]);

  const openColorPicker = (rowIndex) => {
    setColorPickerRow(rowIndex);
    setColorPickerVisible(true);
  };

  const selectColor = (color) => {
    if (colorPickerRow !== null) {
      const newColors = { ...localRowColors, [colorPickerRow]: color };
      setLocalRowColors(newColors);
      if (onRowColorsChange) onRowColorsChange(newColors);
    }
    setColorPickerVisible(false);
    setColorPickerRow(null);
  };

  const toggleCollapse = (rowIndex) => {
    setCollapsedCards(prev => ({ ...prev, [rowIndex]: !prev[rowIndex] }));
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {rows.map((row, rowIndex) => {
          const isCollapsed = collapsedCards[rowIndex];
          const cardColor = localRowColors[rowIndex] || '#1e1e1e';
          const cardTitle = row[groupingColumn] || `Entry ${rowIndex + 1}`;
          
          return (
            <View
              key={`card-${rowIndex}`}
              style={[
                styles.card,
                { backgroundColor: cardColor },
                selectedRow === rowIndex && styles.selectedCard,
              ]}
            >
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  style={styles.collapseButton}
                  onPress={() => toggleCollapse(rowIndex)}
                >
                  <Text style={styles.collapseIcon}>
                    {isCollapsed ? '▶' : '▼'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.cardNumber} numberOfLines={1}>
                  {cardTitle}
                </Text>
                
                <TouchableOpacity
                  style={styles.colorButton}
                  onPress={() => openColorPicker(rowIndex)}
                >
                  <Text style={styles.colorButtonText}>🎨</Text>
                </TouchableOpacity>
              </View>
              
              {!isCollapsed && (
                <View style={styles.fieldsContainer}>
                  {headers.map((header, colIndex) => (
                    <View key={`field-${rowIndex}-${colIndex}`} style={styles.field}>
                      <Text style={styles.label}>{header || `Column ${colIndex + 1}`}</Text>
                      <TextInput
                        style={styles.input}
                        value={String(row[colIndex] || '')}
                        onChangeText={(text) => handleCellChange(rowIndex, colIndex, text)}
                        onFocus={() => setSelectedRow(rowIndex)}
                        placeholder={`Enter ${header || 'value'}`}
                        placeholderTextColor="#666"
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

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
            <Text style={styles.colorPickerTitle}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {uniqueColors.map((item) => (
                <TouchableOpacity
                  key={item.color}
                  style={[styles.colorOption, { backgroundColor: item.color }]}
                  onPress={() => selectColor(item.color)}
                >
                  <Text style={styles.colorName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  card: {
    margin: 12,
    padding: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  collapseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  collapseIcon: {
    fontSize: 14,
    color: '#aaa',
  },
  cardNumber: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonText: {
    fontSize: 20,
  },
  fieldsContainer: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#121212',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: '47%',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  colorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
