import { Workbook } from 'exceljs';
import { Buffer } from 'buffer';

// Parse CSV content into 2D array
export const parseCSV = (csvContent) => {
  const lines = csvContent.trim().split('\n');
  return lines.map(line => {
    const matches = line.match(/("([^"]*)"|[^,]+)/g) || [];
    return matches.map(cell => cell.replace(/^"|"$/g, '').trim());
  });
};

// Parse XLSX using ExcelJS with base64 and extract colors
export const parseXLSX = async (base64Content) => {
  try {
    const workbook = new Workbook();
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64');
    
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    
    const data = [];
    const rowColors = {};
    
    // Excel indexed colors - OLD Excel color palette (pre-2007)
    // These are the actual colors Excel uses for indices
    const excelIndexedColors = [
      null,
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
      '#9999FF', '#993366', '#FFFFCC', '#CCFFFF', '#660066', '#FF8080', '#0066CC', '#CCCCFF',
      '#000080', '#FF00FF', '#FFFF00', '#00FFFF', '#800080', '#800000', '#008080', '#0000FF',
      '#00CCFF', '#CCFFFF', '#CCFFCC', '#FFFF99', '#99CCFF', '#FF99CC', '#CC99FF', '#FFCC99',
      '#3366FF', '#33CCCC', '#99CC00', '#FFCC00', '#FF9900', '#FF6600', '#666699', '#969696',
      '#003366', '#339966', '#003300', '#333300', '#993300', '#993366', '#333399', '#333333'
    ];
    
    if (worksheet) {
      // Get max column count first
      let maxCols = 0;
      worksheet.eachRow((row) => {
        if (row.cellCount > maxCols) maxCols = row.cellCount;
      });
      
      // Now build the data with consistent column count
      worksheet.eachRow((row, rowNumber) => {
        const rowData = [];
        
        // Extract row color from first cell with content
        let colorExtracted = false;
        for (let i = 1; i <= maxCols && !colorExtracted; i++) {
          const cell = row.getCell(i);
          if (cell.fill && cell.fill.fgColor) {
            const fgColor = cell.fill.fgColor;
            
            // Priority 1: Direct ARGB color
            if (fgColor.argb && fgColor.argb !== 'FFFFFFFF' && fgColor.argb !== 'FF000000') {
              rowColors[rowNumber - 1] = '#' + fgColor.argb.substring(2);
              colorExtracted = true;
            } 
            // Priority 2: Indexed color from Excel's palette
            else if (fgColor.indexed !== undefined && excelIndexedColors[fgColor.indexed]) {
              rowColors[rowNumber - 1] = excelIndexedColors[fgColor.indexed];
              colorExtracted = true;
            }
            // Priority 3: Theme color (not implemented yet, would need theme parsing)
          }
        }
        
        for (let i = 1; i <= maxCols; i++) {
          const cell = row.getCell(i);
          let value = cell.value;
          
          // Handle rich text objects
          if (value && typeof value === 'object') {
            if (value.richText) {
              value = value.richText.map(t => t.text).join('');
            } else if (value.text) {
              value = value.text;
            } else if (value.formula) {
              value = cell.result || '';
            } else {
              value = String(value);
            }
          }
          
          rowData.push(value !== null && value !== undefined ? String(value) : '');
        }
        data.push(rowData);
      });
    }
    
    // Remove empty columns
    return {
      data: removeEmptyColumns(data),
      rowColors,
      workbook, // Return the original workbook object for cloning
    };
  } catch (error) {
    console.error('XLSX parsing error with ExcelJS:', error);
    throw error;
  }
};

// Remove columns that are completely empty
const removeEmptyColumns = (data) => {
  if (!data || data.length === 0) return data;
  
  const numCols = data[0].length;
  const emptyColumns = [];
  
  // Check each column
  for (let col = 0; col < numCols; col++) {
    let isEmpty = true;
    for (let row = 0; row < data.length; row++) {
      if (data[row][col] && String(data[row][col]).trim() !== '') {
        isEmpty = false;
        break;
      }
    }
    if (isEmpty) {
      emptyColumns.push(col);
    }
  }
  
  // If no empty columns, return original
  if (emptyColumns.length === 0) return data;
  
  // Filter out empty columns
  return data.map(row => 
    row.filter((_, colIndex) => !emptyColumns.includes(colIndex))
  );
};

export const parseSpreadsheet = async (fileContent, fileName, isBase64 = false) => {
  try {
    let data = [];
    let rowColors = {};
    let originalWorkbook = null;
    
    if (fileName.endsWith('.csv')) {
      data = parseCSV(fileContent);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const result = await parseXLSX(fileContent);
      data = result.data;
      rowColors = result.rowColors;
      originalWorkbook = result.workbook;
    } else {
      data = parseCSV(fileContent);
    }

    const styles = {};
    return {
      fileName,
      sheetName: 'Sheet1',
      data: data && data.length > 0 ? data : [['No data found']],
      rowColors,
      styles,
      originalWorkbook,
    };
  } catch (error) {
    console.error('Error parsing spreadsheet:', error);
    throw error;
  }
};

// Export by cloning original workbook and updating values only
export const exportSpreadsheet = async (data, fileName, rowColors = {}, titleText = null, originalWorkbook = null) => {
  try {
    const FileSystem = await import('expo-file-system/legacy');
    
    // If we have the original workbook, clone and update it
    if (originalWorkbook) {
      // Create a new workbook by re-loading from the original
      const workbook = new Workbook();
      const buffer = await originalWorkbook.xlsx.writeBuffer();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      
      // Find where actual data starts and the title row
      let titleRowNum = null;
      let headerRowNum = null;
      let dataStartRow = null;
      
      worksheet.eachRow((row, rowNum) => {
        // Check if this row is a merged title row
        const firstCell = row.getCell(1);
        const cellAddress = `A${rowNum}`;
        
        // Check if A column of this row is part of a merge
        let isMergedTitle = false;
        Object.keys(worksheet._merges || {}).forEach(mergeKey => {
          const merge = worksheet._merges[mergeKey];
          if (merge && merge.model && merge.model.top === rowNum && merge.model.left === 1) {
            // This is the start of a horizontal merge - likely a title
            isMergedTitle = true;
            titleRowNum = rowNum;
          }
        });
        
        if (isMergedTitle && titleText) {
          // Update title
          firstCell.value = titleText;
        }
        
        // Detect header row (first non-merged row with multiple different values)
        if (!isMergedTitle && !headerRowNum) {
          const values = [];
          for (let col = 1; col <= 10; col++) {
            const val = row.getCell(col).value;
            if (val) values.push(String(val));
          }
          // Header likely has multiple distinct column names
          const uniqueValues = new Set(values);
          if (uniqueValues.size >= 3 && values.length >= 3) {
            headerRowNum = rowNum;
            dataStartRow = rowNum + 1;
          }
        }
      });
      
      // If no header detected, assume data starts at row 1 or after title
      if (!dataStartRow) {
        dataStartRow = titleRowNum ? titleRowNum + 1 : 1;
      }
      
      // Now update the data rows (header + data)
      // data[0] is header, data[1+] is data rows
      data.forEach((row, rowIndex) => {
        const excelRowNum = (headerRowNum || dataStartRow) + rowIndex;
        const excelRow = worksheet.getRow(excelRowNum);
        
        row.forEach((cellValue, colIndex) => {
          const cell = excelRow.getCell(colIndex + 1);
          
          // Save original formatting before updating value
          const originalFill = JSON.parse(JSON.stringify(cell.fill || {}));
          const originalFont = JSON.parse(JSON.stringify(cell.font || {}));
          const originalAlignment = JSON.parse(JSON.stringify(cell.alignment || {}));
          const originalBorder = JSON.parse(JSON.stringify(cell.border || {}));
          
          // Update value
          cell.value = cellValue;
          
          // Explicitly restore formatting (ExcelJS sometimes clears it)
          if (Object.keys(originalFill).length > 0) cell.fill = originalFill;
          if (Object.keys(originalFont).length > 0) cell.font = originalFont;
          if (Object.keys(originalAlignment).length > 0) cell.alignment = originalAlignment;
          if (Object.keys(originalBorder).length > 0) cell.border = originalBorder;
        });
      });
      
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFileName = fileName.split('.')[0];
      const outputFileName = `${baseFileName}_edited_${timestamp}.xlsx`;
      
      const documentDir = `${FileSystem.documentDirectory}CShard_Exports/`;
      
      try {
        await FileSystem.makeDirectoryAsync(documentDir, { intermediates: true });
      } catch (e) {
        // Directory might already exist
      }

      const filePath = `${documentDir}${outputFileName}`;
      
      // Write to file
      const buffer2 = await workbook.xlsx.writeBuffer();
      const base64 = buffer2.toString('base64');
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        fileName: outputFileName,
        filePath,
      };
    }
    
    // Fallback: create new workbook with styling (original behavior)
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    
    let startRow = 1;
    
    // Add title row if exists - merged and centered
    if (titleText) {
      const titleRow = worksheet.getRow(1);
      titleRow.getCell(1).value = titleText;
      
      // Merge cells across all columns
      worksheet.mergeCells(1, 1, 1, data[0].length);
      
      // Style the title: bold, centered, larger font
      titleRow.getCell(1).font = {
        bold: true,
        size: 14,
        color: { argb: 'FF000000' }, // Black text
      };
      titleRow.getCell(1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      titleRow.getCell(1).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      titleRow.height = 25;
      
      startRow = 2;
    }
    
    // Add data to worksheet starting from appropriate row
    data.forEach((row, rowIndex) => {
      const excelRow = worksheet.getRow(startRow + rowIndex);
      excelRow.values = row;
      
      // Apply color if exists
      const colorKey = rowIndex;
      const color = rowColors[colorKey];
      
      let argb = 'FFFFFFFF'; // Default white
      if (color && color.startsWith('#')) {
        argb = 'FF' + color.substring(1).toUpperCase();
      }
      
      excelRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        // Background color
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb },
        };
        
        // Text color - black for better readability
        cell.font = {
          color: { argb: 'FF000000' },
          size: 11,
          bold: rowIndex === 0, // Bold for header
        };
        
        // Alignment
        cell.alignment = {
          horizontal: rowIndex === 0 ? 'center' : 'left',
          vertical: 'middle',
          wrapText: false,
        };
        
        // Borders - thin black lines
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      });
    });
    
    // Auto-size columns based on content with minimal padding
    worksheet.columns.forEach((column, idx) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      // Set width with minimal padding (just enough to fit content)
      column.width = Math.max(maxLength + 1, 8);
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const baseFileName = fileName.split('.')[0];
    const outputFileName = `${baseFileName}_edited_${timestamp}.xlsx`;
    
    const documentDir = `${FileSystem.documentDirectory}CShard_Exports/`;
    
    try {
      await FileSystem.makeDirectoryAsync(documentDir, { intermediates: true });
    } catch (e) {
      // Directory might already exist
    }

    const filePath = `${documentDir}${outputFileName}`;
    
    // Write to file
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = buffer.toString('base64');
    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      fileName: outputFileName,
      filePath,
    };
  } catch (error) {
    console.error('Error exporting spreadsheet:', error);
    throw error;
  }
};
