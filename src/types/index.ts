// Core type definitions for CShard

export interface CellStyle {
  // Font styling
  fontName?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string; // hex color

  // Cell background
  backgroundColor?: string; // hex color

  // Borders
  borderTop?: BorderStyle;
  borderRight?: BorderStyle;
  borderBottom?: BorderStyle;
  borderLeft?: BorderStyle;

  // Alignment
  horizontalAlignment?: 'left' | 'center' | 'right';
  verticalAlignment?: 'top' | 'middle' | 'bottom';

  // Number format
  numberFormat?: string;
}

export interface BorderStyle {
  style?: 'thin' | 'medium' | 'thick' | 'double';
  color?: string;
}

export interface CellData {
  value: any;
  style?: CellStyle;
  formula?: string;
  originalColumnIndex: number;
}

export interface Entry {
  id: string; // unique identifier
  cells: { [header: string]: CellData };
  rowIndex: number; // original row in Excel
}

export interface FileConfig {
  id: string;
  fileName: string;
  fileTitle: string; // user-defined title
  selectedHeaders: string[]; // headers to show in cards
  differentiationColumn: string; // which header to show on card title
  fileUri: string; // local file URI
  lastModified: number;
  entryCount: number;
  headerRowIndex?: number; // which row contains the headers
}

export interface SpreadsheetData {
  headers: string[]; // all column headers
  entries: Entry[];
  columnStyles: { [columnName: string]: CellStyle }; // default styles per column
  headerRowStyle?: CellStyle;
  sheetName?: string;
  headerRowIndex?: number; // which row is the header
  preHeaderRows?: PreHeaderRow[]; // rows before the header (like title)
}

// For preserving pre-header rows (title, etc.)
export interface PreHeaderRow {
  rowIndex: number;
  cells: PreHeaderCell[];
  rowHeight?: number;
}

export interface PreHeaderCell {
  value: string;
  style?: CellStyle;
  colspan?: number; // merge across columns
}

export interface FileHistoryItem {
  config: FileConfig;
  previewData?: {
    firstEntryDiff: string; // e.g., "John Doe"
    entryCount: number;
  };
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Configuration: {
    fileUri: string;
    fileName: string;
    existingConfig?: FileConfig;
  };
  Editor: {
    config: FileConfig;
  };
};
