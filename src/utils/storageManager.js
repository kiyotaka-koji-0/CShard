import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'CSHARP_FILE_HISTORY';

export const saveToHistory = async (fileName, fileUri) => {
  try {
    const history = await getHistory();
    const newEntry = {
      fileName,
      fileUri,
      lastEdited: new Date().toISOString(),
    };
    const updatedHistory = [newEntry, ...history.filter(h => h.fileName !== fileName)].slice(0, 10);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
};

export const getHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};

export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};
