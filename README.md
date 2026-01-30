# CShard - Offline Spreadsheet Editor

A mobile-first spreadsheet editor built with React Native and Expo, designed for viewing and editing Excel/CSV files in a card-based interface optimized for small screens.

## 🎯 Features

### Core Functionality
- **📊 Import XLSX/CSV files** - Load spreadsheets from your device
- **🎴 Card-based view** - Each row is a collapsible card, perfect for mobile
- **✏️ Inline editing** - Edit cells directly in the card view
- **🎨 Color preservation** - Maintains original Excel colors on export
- **💾 Export to XLSX** - Save your edits back to Excel format
- **📝 Title row support** - Detect and edit merged title rows
- **🔄 Undo/Redo** - Full history of changes with undo/redo
- **📱 Offline-first** - Works completely offline, no internet needed

### Smart Features
- **Header row selection** - Choose which row becomes the header
- **Grouping column** - Pick which column to use for card grouping
- **Auto-color assignment** - New rows automatically cycle through the color palette
- **Color palette extraction** - Extracts colors from imported files
- **Color picker** - Assign colors to rows from the extracted palette
- **Collapsible cards** - Tap to expand/collapse individual entries
- **Recent files** - Quick access to recently opened files

## 🏗️ Architecture

```
CShard/
├── App.js                          # Main app entry point
├── src/
│   ├── components/
│   │   ├── CardView.js            # Card-based row display
│   │   └── SpreadsheetGrid.js     # (unused) Grid view component
│   ├── screens/
│   │   ├── HomeScreen.js          # File picker and recent files
│   │   ├── HeaderSelectScreen.js  # Choose header row
│   │   ├── CardGroupSelector.js   # Choose grouping column
│   │   └── SpreadsheetScreen.js   # (unused) Grid view screen
│   ├── utils/
│   │   ├── spreadsheetParser.js   # Parse/export XLSX/CSV
│   │   └── storageManager.js      # File history storage
│   └── hooks/
│       └── useUndo.js             # Undo/redo state management
```

## 📦 Dependencies

### Core
- `expo` - React Native framework
- `react-native` - Mobile UI framework
- `react-native-safe-area-context` - Safe area handling

### File Handling
- `expo-document-picker` - File selection
- `expo-file-system` - File I/O
- `expo-sharing` - Share/export files

### Spreadsheet Libraries
- `xlsx-populate` - Primary Excel manipulation (preserves colors perfectly)
- `exceljs` - Fallback Excel library (for parsing and legacy support)

## 🎨 Color Preservation

We use a **dual-library approach** for perfect color preservation:

1. **ExcelJS** for parsing and extracting colors on import
2. **xlsx-populate** for export (preserves indexed colors without conversion)

### Why xlsx-populate?
ExcelJS converts indexed colors to RGB during workbook manipulation, which loses the original theme colors. xlsx-populate works at a lower level and preserves the binary Excel format, keeping colors exactly as they were.

### Color System
- Colors are extracted as indexed values (e.g., index 10, 11, 12)
- Stored in `rowColors` state as hex values for display
- On export, xlsx-populate preserves the original indexed colors
- New rows auto-assign colors by cycling through the extracted palette

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Expo Go app on your mobile device
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd CShard

# Install dependencies
npm install

# Start the development server
npm start

# Or with cache clear
npm start -- --clear
```

### Running on Device

1. Install **Expo Go** from App Store or Google Play
2. Start the dev server: `npm start`
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## 📖 Usage

### Importing a File

1. Tap the **+** button on the home screen
2. Select an XLSX or CSV file
3. Choose which row should be the header
4. Select which column to group by (for card view)

### Editing Data

- Tap a card to expand it
- Tap any field to edit
- Changes are auto-saved to undo history
- Use ↶ and ↷ buttons for undo/redo

### Changing Colors

- Long-press a card to open the color picker
- Select from the extracted color palette
- Colors are applied to the entire row

### Adding Rows

- Tap **+ Add Entry** at the bottom
- New row is added with auto-assigned color
- Fill in the fields

### Exporting

1. Tap the **↓** (download) button
2. Choose where to save or share
3. File is exported with original formatting and colors preserved

## 🎯 Workflow We Built

### What We Did (Session Timeline)

1. **Initial Setup**
   - Created Expo app with React Native
   - Set up dark theme UI
   - Added file picker integration

2. **Spreadsheet Parsing**
   - Implemented XLSX parsing with ExcelJS
   - CSV parsing with custom parser
   - Title row detection (merged cells)
   - Header row selection screen
   - Color extraction from original files

3. **Card View UI**
   - Built collapsible card interface
   - Inline editing for each field
   - Color coding per row
   - Grouping column selector
   - "Expand All" / "Collapse All" functionality

4. **Export & Color Preservation**
   - Initial export with ExcelJS (colors converted)
   - Switched to xlsx-populate for perfect color preservation
   - Title row restoration in exported files
   - Verified indexed colors (10, 11, 12) preserved

5. **Undo/Redo System**
   - Custom hook for state history
   - Undo/redo buttons in header
   - History stored in memory

6. **Color Palette System**
   - Extract unique colors from imported file
   - Show in color picker modal
   - Auto-assign to new rows (cycling)
   - Store colors with row indices

7. **Bug Fixes**
   - Fixed expo-file-system v19 API changes
   - Removed base-64 dependency
   - Fixed dependency installation issues
   - Clean npm install for bundler errors

## 🐛 Known Issues & Limitations

### Current Limitations
- No column adding/removing (rows only)
- No formula support (values only)
- Grid view exists but unused (card view is default)
- Limited to single sheet (first sheet only)

### Fixed Issues
- ✅ Color preservation (solved with xlsx-populate)
- ✅ Title row detection
- ✅ Dependency conflicts
- ✅ File system API compatibility

## 🔧 Technical Details

### State Management
- React `useState` for component state
- Custom `useUndo` hook for history
- AsyncStorage for file history persistence

### File Format Support
- **XLSX** - Full support (recommended)
- **CSV** - Basic support (no colors)

### Color Format
- Stored as hex strings: `#FFE0B2`
- Excel uses indexed colors internally (preserved on export)
- In-app display uses hex for consistent rendering

### Performance
- Lazy rendering for large datasets
- Collapsed cards by default
- Minimal re-renders with proper React keys

## 🎨 UI/UX Decisions

### Why Card View?
Mobile screens are too small for spreadsheet grids. Cards provide:
- Better readability
- Easier editing (larger touch targets)
- Natural scrolling
- Focus on one record at a time

### Dark Theme
- Reduces eye strain
- Better battery life on OLED screens
- Modern aesthetic

### Collapsible Cards
- Default collapsed to see more entries
- Expand only what you need
- Reduces cognitive load

## 📝 Configuration

### App Config (`app.json`)
```json
{
  "expo": {
    "name": "CShard",
    "slug": "cshard",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark"
  }
}
```

## 🚢 Deployment

### Building for Production

```bash
# Build APK (Android)
expo build:android

# Build IPA (iOS)
expo build:ios

# Or use EAS Build
eas build --platform android
eas build --platform ios
```

## 🤝 Contributing

This is a personal project, but contributions are welcome!

## 📄 License

MIT

## 🙏 Credits

Built with:
- React Native & Expo
- xlsx-populate by DTjr
- ExcelJS by Alois Klink
- And a lot of debugging 😅

---

**Made for editing salary sheets and other spreadsheets on mobile devices.**
