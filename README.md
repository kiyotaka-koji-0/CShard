# CShard - Mobile Spreadsheet Editor

A robust, offline-first mobile app for editing CSV and XLSX spreadsheets with beautiful UI, styling, and full row/column management.

## Features

- **Import CSV/XLSX** from device storage
- **Edit cells, rows, columns** with intuitive touch interface
- **Add/delete rows and columns** easily
- **Cell, row, and column coloring** (styling persists in exported files)
- **Search and filter** across spreadsheet data
- **Undo/Redo** support
- **Export as new file** (never overwrites original)
- **Recent files history** (local storage, no cloud)
- **100% Offline** - no network required
- **Cross-platform** - Android & iOS via Expo

## Tech Stack

- **React Native** (with Expo)
- **React Native Paper** - Material Design UI components
- **SheetJS (xlsx)** - Spreadsheet parsing and styling
- **expo-file-system** - File handling
- **AsyncStorage** - Local history/cache

## Project Structure

```
CShard/
├── App.js                 # Main app entry
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── SpreadsheetScreen.js
│   │   └── SettingsScreen.js
│   ├── components/
│   │   ├── SpreadsheetGrid.js
│   │   ├── CellEditor.js
│   │   ├── RowColumnMenu.js
│   │   └── StylePanel.js
│   ├── utils/
│   │   ├── fileHandler.js
│   │   ├── spreadsheetParser.js
│   │   ├── styleManager.js
│   │   └── storageManager.js
│   └── hooks/
│       ├── useSpreadsheet.js
│       ├── useFileHistory.js
│       └── useUndo.js
├── package.json
└── README.md
```

## Setup & Running

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo Go app on your mobile device

### Installation

```bash
cd CShard
npm install
```

### Running

```bash
npx expo start
```

Then scan the QR code with **Expo Go** on your Android or iOS device.

### Building

For standalone APK/IPA:
```bash
eas build --platform android
eas build --platform ios
```

## Usage

1. **Open App** - See home screen with recent files
2. **Import** - Tap "Import File" to pick a CSV/XLSX
3. **Edit** - Tap cells to edit, use toolbar for styling/add rows/columns
4. **Export** - Tap "Export" to save edited sheet as new file
5. **History** - Access recent files from home screen

## Styling Support

- **Cell colors** - Background and text colors
- **Row/Column highlighting** - Visual organization
- **Borders and formatting** - Basic cell styling
- **Styling persists** in exported XLSX files (CSV limited)

## Roadmap

- [ ] Formulas & calculations
- [ ] Multiple sheets
- [ ] Conditional formatting
- [ ] Cloud sync (optional)
- [ ] Collaborative editing
- [ ] Advanced filtering

## License

MIT

## Support

For issues or feature requests, open an issue on GitHub.
