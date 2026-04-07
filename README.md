# CShard

A mobile app built with React Native (Expo) for importing, editing, and exporting Excel/CSV spreadsheets on the go.

## Features

- **Import spreadsheets** — Pick `.xlsx`, `.xls`, or `.csv` files from your device
- **Flexible configuration** — Choose which row is the header and which column is the card title
- **Card-based editor** — Browse and edit entries one card at a time
- **Add / delete entries** — Insert new rows or remove existing ones
- **Export** — Save changes back to an `.xlsx` file and share it directly from the app
- **File history** — Previously opened files are remembered for quick access

## Tech Stack

| Layer | Library |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 / React Native 0.81 |
| Language | TypeScript |
| Navigation | React Navigation (Native Stack) |
| Excel I/O | [ExcelJS](https://github.com/exceljs/exceljs) |
| Local storage | AsyncStorage |
| File access | expo-document-picker, expo-file-system |
| Sharing | expo-sharing |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- iOS Simulator / Android Emulator **or** the [Expo Go](https://expo.dev/go) app on a physical device

### Install

```bash
npm install
```

### Run

```bash
# Start the dev server
npm start

# Open on Android emulator
npm run android

# Open on iOS simulator
npm run ios

# Open in web browser
npm run web
```

## Project Structure

```
CShard/
├── App.tsx                  # Entry point
├── src/
│   ├── components/          # Reusable UI components (EntryCard, FileHistoryItem, …)
│   ├── navigation/          # AppNavigator (stack navigator)
│   ├── screens/
│   │   ├── HomeScreen.tsx         # File list & import
│   │   ├── ConfigurationScreen.tsx # Header-row & title-column picker
│   │   └── EditorScreen.tsx       # Entry editor & export
│   ├── services/
│   │   ├── ExcelService.ts        # Read / write Excel files
│   │   └── StorageService.ts      # Persist file configs & history
│   ├── styles/              # Shared theme (colors, spacing, typography)
│   └── types/               # TypeScript type definitions
├── assets/                  # App icons & splash screen
├── app.json                 # Expo configuration
└── package.json
```

## Usage

1. Tap **Add Spreadsheet** on the home screen and pick a file.
2. On the configuration screen, select the **header row** and the **card title column**, then give the file a name.
3. In the editor, scroll through entries, tap a card to edit fields, use the **＋** button to add a new row, or swipe to delete.
4. Tap **Export** in the top-right corner to save your changes and share the updated file.

## License

This project is private. All rights reserved.
