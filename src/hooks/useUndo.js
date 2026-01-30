import { useState } from 'react';

export const useUndo = (initialData) => {
  const [history, setHistory] = useState([initialData]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const push = (newData) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newData);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const getCurrentData = () => history[currentIndex];

  return {
    push,
    undo,
    redo,
    getCurrentData,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
};
