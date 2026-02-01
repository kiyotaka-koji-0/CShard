import ExcelJS from 'exceljs';
import { readAsStringAsync, documentDirectory, EncodingType, writeAsStringAsync, cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import { SpreadsheetData, Entry, CellData, CellStyle } from '../types';

// Raw row data for configuration screen
interface RawRowData {
    rowIndex: number;
    cells: string[];
}

export class ExcelService {
    /**
     * Read raw rows from Excel file (for configuration screen)
     */
    static async readRawRows(fileUri: string): Promise<RawRowData[]> {
        try {
            const workbook = await ExcelService.loadWorkbook(fileUri);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error('No worksheet found in file');
            }

            const rows: RawRowData[] = [];
            const columnCount = worksheet.columnCount || 0;

            worksheet.eachRow((row, rowIndex) => {
                const cells: string[] = [];
                for (let col = 1; col <= columnCount; col++) {
                    const cell = row.getCell(col);
                    cells.push(ExcelService.extractCellValue(cell)?.toString() || '');
                }
                rows.push({ rowIndex, cells });
            });

            console.log('Read raw rows:', rows.length);
            return rows;
        } catch (error) {
            console.error('Error reading raw rows:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to read Excel file: ${message}`);
        }
    }


    /**
     * Read Excel file with user-selected header row
     */
    static async readExcelFileWithHeaderRow(fileUri: string, headerRowIndex: number): Promise<SpreadsheetData> {
        try {
            const workbook = await ExcelService.loadWorkbook(fileUri);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error('No worksheet found in file');
            }

            const columnCount = worksheet.columnCount || 0;

            // Extract pre-header rows (title, etc.)
            const preHeaderRows: any[] = [];
            for (let rowIdx = 1; rowIdx < headerRowIndex; rowIdx++) {
                const row = worksheet.getRow(rowIdx);
                const cells: any[] = [];

                for (let col = 1; col <= columnCount; col++) {
                    const cell = row.getCell(col);
                    const value = ExcelService.extractCellValue(cell)?.toString() || '';
                    const style = ExcelService.extractCellStyle(cell);

                    // Check for merged cells
                    let colspan = 1;
                    if (cell.isMerged && cell.master === cell) {
                        // This is the master cell of a merge
                        const merges = worksheet.model?.merges || [];
                        for (const merge of merges) {
                            // merge format: "A1:G1"
                            const match = merge.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
                            if (match) {
                                const startCol = ExcelService.columnLetterToNumber(match[1]);
                                const startRow = parseInt(match[2]);
                                const endCol = ExcelService.columnLetterToNumber(match[3]);
                                if (startRow === rowIdx && startCol === col) {
                                    colspan = endCol - startCol + 1;
                                    break;
                                }
                            }
                        }
                    }

                    cells.push({ value, style, colspan });
                }

                preHeaderRows.push({
                    rowIndex: rowIdx,
                    cells,
                    rowHeight: row.height,
                });
            }

            // Extract headers from selected row
            const headerRow = worksheet.getRow(headerRowIndex);
            const headers: string[] = [];
            for (let col = 1; col <= columnCount; col++) {
                const cell = headerRow.getCell(col);
                const value = cell.value?.toString() || `Column ${col}`;
                headers.push(value);
            }

            // Extract header styles
            const headerRowStyle = ExcelService.extractCellStyle(headerRow.getCell(1));

            // Extract data rows (all rows after header row)
            const entries: Entry[] = [];
            const columnStyles: { [key: string]: CellStyle } = {};

            worksheet.eachRow((row, rowIndex) => {
                if (rowIndex <= headerRowIndex) return; // Skip header row and rows before it

                const entry: Entry = {
                    id: `row-${rowIndex}`,
                    cells: {},
                    rowIndex,
                };

                for (let col = 1; col <= columnCount; col++) {
                    const cell = row.getCell(col);
                    const header = headers[col - 1];
                    if (!header) continue;

                    const cellData: CellData = {
                        value: ExcelService.extractCellValue(cell),
                        style: ExcelService.extractCellStyle(cell),
                        formula: cell.formula?.toString(),
                        originalColumnIndex: col - 1,
                    };

                    entry.cells[header] = cellData;

                    // Store column style (for new entries)
                    if (!columnStyles[header] && cellData.style) {
                        columnStyles[header] = cellData.style;
                    }
                }

                entries.push(entry);
            });

            return {
                headers,
                entries,
                columnStyles,
                headerRowStyle,
                sheetName: worksheet.name,
                headerRowIndex,
                preHeaderRows,
            };
        } catch (error) {
            console.error('Error reading Excel file:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to read Excel file: ${message}`);
        }
    }

    /**
     * Load workbook from file URI
     */
    private static async loadWorkbook(fileUri: string): Promise<ExcelJS.Workbook> {
        // Copy file to cache if it's a content:// URI
        let localUri = fileUri;
        if (fileUri.startsWith('content://')) {
            const fileName = `temp_${Date.now()}.xlsx`;
            localUri = `${cacheDirectory}${fileName}`;
            await copyAsync({ from: fileUri, to: localUri });
        }

        // Read file as base64
        const base64 = await readAsStringAsync(localUri, {
            encoding: EncodingType.Base64,
        });

        // Convert base64 to ArrayBuffer
        const buffer = ExcelService.base64ToArrayBuffer(base64);

        // Load workbook
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        return workbook;
    }

    /**
     * Read and parse Excel/CSV file with full formatting preservation (default: row 1 as header)
     */
    /**
     * Read and parse Excel/CSV file with full formatting preservation
     */
    static async readExcelFile(fileUri: string): Promise<SpreadsheetData> {
        try {
            // Copy file to cache if it's a content:// URI
            let localUri = fileUri;
            if (fileUri.startsWith('content://')) {
                const fileName = `temp_${Date.now()}.xlsx`;
                localUri = `${cacheDirectory}${fileName}`;
                await copyAsync({ from: fileUri, to: localUri });
            }

            // Read file as base64
            const base64 = await readAsStringAsync(localUri, {
                encoding: EncodingType.Base64,
            });

            // Convert base64 to ArrayBuffer
            const buffer = this.base64ToArrayBuffer(base64);

            // Load workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            // Get first worksheet
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error('No worksheet found in file');
            }

            // Get column count from worksheet
            const columnCount = worksheet.columnCount || 0;
            console.log('Worksheet column count:', columnCount);

            // Extract headers from first row
            const headerRow = worksheet.getRow(1);
            const headers: string[] = [];

            // Use column count to iterate all columns
            for (let col = 1; col <= columnCount; col++) {
                const cell = headerRow.getCell(col);
                const value = cell.value?.toString() || `Column ${col}`;
                headers.push(value);
            }

            console.log('Extracted headers:', headers);

            // Extract header styles
            const headerRowStyle = this.extractCellStyle(headerRow.getCell(1));

            // Extract data rows
            const entries: Entry[] = [];
            const columnStyles: { [key: string]: CellStyle } = {};

            worksheet.eachRow((row, rowIndex) => {
                if (rowIndex === 1) return; // Skip header row

                const entry: Entry = {
                    id: `row-${rowIndex}`,
                    cells: {},
                    rowIndex,
                };

                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber - 1];
                    if (!header) return;

                    const cellData: CellData = {
                        value: this.extractCellValue(cell),
                        style: this.extractCellStyle(cell),
                        formula: cell.formula?.toString(),
                        originalColumnIndex: colNumber - 1,
                    };

                    entry.cells[header] = cellData;

                    // Store column style (for new entries)
                    if (!columnStyles[header] && cellData.style) {
                        columnStyles[header] = cellData.style;
                    }
                });

                entries.push(entry);
            });

            return {
                headers,
                entries,
                columnStyles,
                headerRowStyle,
                sheetName: worksheet.name,
            };
        } catch (error) {
            console.error('Error reading Excel file:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to read Excel file: ${message}`);
        }
    }

    /**
     * Write Excel file by modifying the original - preserves all formatting
     */
    static async writeExcelFile(
        data: SpreadsheetData,
        originalFileUri: string,
        outputFileName: string
    ): Promise<string> {
        try {
            // Load the original workbook to preserve all formatting
            const workbook = await ExcelService.loadWorkbook(originalFileUri);
            const worksheet = workbook.worksheets[0];

            if (!worksheet) {
                throw new Error('No worksheet found in file');
            }

            // Get the header row index from data (default to row after pre-headers)
            const headerRowIndex = data.headerRowIndex || 1;

            // Create a map of entry data by original row index
            const entryByRowIndex = new Map<number, Entry>();
            for (const entry of data.entries) {
                entryByRowIndex.set(entry.rowIndex, entry);
            }

            // Track which rows exist in the new data
            const existingRowIndices = new Set(data.entries.map(e => e.rowIndex));

            // Update existing cells with new values (preserving original formatting)
            worksheet.eachRow((row, rowIndex) => {
                // Skip pre-header rows and header row
                if (rowIndex <= headerRowIndex) return;

                const entry = entryByRowIndex.get(rowIndex);
                if (entry) {
                    // Update cell values while keeping formatting
                    data.headers.forEach((header, colIdx) => {
                        const cellData = entry.cells[header];
                        if (cellData !== undefined) {
                            const cell = row.getCell(colIdx + 1);

                            // Only update the value, keep the original style
                            cell.value = cellData.value;

                            // If user explicitly changed the background color, apply it
                            if (cellData.style?.backgroundColor) {
                                if (!cell.fill || cell.fill.type !== 'pattern') {
                                    cell.fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: ExcelService.hexToArgb(cellData.style.backgroundColor) },
                                    };
                                } else {
                                    (cell.fill as any).fgColor = { argb: ExcelService.hexToArgb(cellData.style.backgroundColor) };
                                }
                            }
                        }
                    });
                }
            });

            // Handle new entries (rows that didn't exist in original)
            const maxOriginalRow = worksheet.rowCount;
            let newRowIndex = maxOriginalRow + 1;

            for (const entry of data.entries) {
                if (entry.rowIndex > maxOriginalRow || entry.id.startsWith('new-')) {
                    // This is a new entry, add it at the end
                    const rowValues: any[] = [];
                    data.headers.forEach((header) => {
                        const cellData = entry.cells[header];
                        rowValues.push(cellData?.value || '');
                    });

                    const newRow = worksheet.addRow(rowValues);

                    // Try to copy style from the last data row
                    const lastDataRow = worksheet.getRow(headerRowIndex + 1);
                    if (lastDataRow) {
                        newRow.eachCell((cell, colNumber) => {
                            const sourceCell = lastDataRow.getCell(colNumber);
                            if (sourceCell.style) {
                                cell.style = { ...sourceCell.style };
                            }

                            // Apply any user-set background color
                            const header = data.headers[colNumber - 1];
                            const cellData = entry.cells[header];
                            if (cellData?.style?.backgroundColor) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: ExcelService.hexToArgb(cellData.style.backgroundColor) },
                                };
                            }
                        });
                    }

                    newRowIndex++;
                }
            }

            // Handle deleted rows - we need to mark them or actually remove them
            // For now, we'll leave deleted rows as is (user can manually delete)
            // This is safer as it prevents accidental data loss

            // Write to buffer and save to document directory
            const buffer = await workbook.xlsx.writeBuffer();
            const base64 = ExcelService.arrayBufferToBase64(buffer as ArrayBuffer);

            const outputUri = `${documentDirectory}${outputFileName}`;
            await writeAsStringAsync(outputUri, base64, {
                encoding: EncodingType.Base64,
            });

            return outputUri;
        } catch (error) {
            console.error('Error writing Excel file:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to write Excel file: ${message}`);
        }
    }

    /**
     * Extract cell value handling different types
     */
    private static extractCellValue(cell: ExcelJS.Cell): any {
        if (cell.value === null || cell.value === undefined) return '';

        // Handle date values
        if (cell.value instanceof Date) {
            return cell.value.toISOString();
        }

        // Handle rich text
        if (typeof cell.value === 'object' && 'richText' in cell.value) {
            return (cell.value.richText as any[]).map((rt: any) => rt.text).join('');
        }

        // Handle formula result
        if (typeof cell.value === 'object' && 'result' in cell.value) {
            return (cell.value as any).result;
        }

        return cell.value.toString();
    }

    /**
     * Extract formatting from Excel cell
     */
    private static extractCellStyle(cell: ExcelJS.Cell): CellStyle {
        const style: CellStyle = {};

        if (cell.font) {
            style.fontName = cell.font.name;
            style.fontSize = cell.font.size;

            // Only set boolean properties if they are explicitly true
            if (cell.font.bold === true) style.bold = true;
            if (cell.font.italic === true) style.italic = true;
            if (cell.font.underline) style.underline = true;

            if (cell.font.color && 'argb' in cell.font.color && cell.font.color.argb) {
                style.color = this.argbToHex(cell.font.color.argb);
            }
        }

        if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
            if ('argb' in cell.fill.fgColor && cell.fill.fgColor.argb) {
                style.backgroundColor = this.argbToHex(cell.fill.fgColor.argb);
            }
        }

        if (cell.alignment) {
            style.horizontalAlignment = cell.alignment.horizontal as any;
            style.verticalAlignment = cell.alignment.vertical as any;
        }

        if (cell.numFmt) {
            style.numberFormat = cell.numFmt;
        }

        return style;
    }

    /**
     * Apply style to Excel cell
     */
    private static applyCellStyle(cell: ExcelJS.Cell, style: CellStyle): void {
        // Build font object only with defined properties
        const fontProps: any = {};
        if (style.fontName !== undefined) fontProps.name = style.fontName;
        if (style.fontSize !== undefined) fontProps.size = style.fontSize;
        if (style.bold === true) fontProps.bold = true;
        if (style.italic === true) fontProps.italic = true;
        if (style.underline === true) fontProps.underline = true;
        if (style.color) fontProps.color = { argb: this.hexToArgb(style.color) };

        // Only apply font if we have properties
        if (Object.keys(fontProps).length > 0) {
            cell.font = fontProps;
        }

        if (style.backgroundColor) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: this.hexToArgb(style.backgroundColor) },
            };
        }

        if (style.horizontalAlignment || style.verticalAlignment) {
            const alignmentProps: any = {};
            if (style.horizontalAlignment) alignmentProps.horizontal = style.horizontalAlignment;
            if (style.verticalAlignment) alignmentProps.vertical = style.verticalAlignment;
            cell.alignment = alignmentProps;
        }

        if (style.numberFormat) {
            cell.numFmt = style.numberFormat;
        }
    }

    /**
     * Convert ARGB to hex color
     */
    private static argbToHex(argb: string): string {
        if (!argb) return '#000000';
        return '#' + argb.slice(2);
    }

    /**
     * Convert hex to ARGB
     */
    private static hexToArgb(hex: string): string {
        const cleanHex = hex.replace('#', '');
        return 'FF' + cleanHex;
    }

    /**
     * Convert base64 to ArrayBuffer
     */
    private static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Convert ArrayBuffer to base64
     */
    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert column letter (A, B, ..., AA, AB) to column number (1, 2, ...)
     */
    private static columnLetterToNumber(letter: string): number {
        let result = 0;
        for (let i = 0; i < letter.length; i++) {
            result = result * 26 + letter.charCodeAt(i) - 64;
        }
        return result;
    }

    /**
     * Convert column number (1, 2, ...) to column letter (A, B, ..., AA, AB)
     */
    private static numberToColumnLetter(num: number): string {
        let result = '';
        while (num > 0) {
            const remainder = (num - 1) % 26;
            result = String.fromCharCode(65 + remainder) + result;
            num = Math.floor((num - 1) / 26);
        }
        return result;
    }
}
