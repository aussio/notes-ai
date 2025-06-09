import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSmartSaveOptions {
  initialValue: string;
  onSave: (value: string) => Promise<void> | void;
  autoSaveDelayMs?: number;
  saveOnEveryKeystroke?: boolean;
  shouldSave?: (newValue: string, originalValue: string) => boolean;
}

interface UseSmartSaveReturn {
  value: string;
  setValue: (value: string) => void;
  save: () => Promise<void>;
  isDirty: boolean;
  isSaving: boolean;
}

export function useSmartSave({
  initialValue,
  onSave,
  autoSaveDelayMs = 2500, // 2.5 seconds
  saveOnEveryKeystroke = false,
  shouldSave = (newValue, originalValue) =>
    newValue.trim() !== originalValue.trim(),
}: UseSmartSaveOptions): UseSmartSaveReturn {
  const [value, setValue] = useState(initialValue);
  const [lastSavedValue, setLastSavedValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualSaveRef = useRef(false);

  // Update local state when initial value changes (e.g., switching notes)
  useEffect(() => {
    setValue(initialValue);
    setLastSavedValue(initialValue);
  }, [initialValue]);

  // Clear auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const save = useCallback(async () => {
    if (!shouldSave(value, lastSavedValue) || isSaving) {
      return;
    }

    setIsSaving(true);
    isManualSaveRef.current = true;

    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    try {
      await onSave(value);
      setLastSavedValue(value);
    } catch (error) {
      console.error('Save failed:', error);
      // Could emit an error event or show notification here
    } finally {
      setIsSaving(false);
      isManualSaveRef.current = false;
    }
  }, [value, lastSavedValue, shouldSave, onSave, isSaving]);

  // Auto-save logic
  useEffect(() => {
    // Don't auto-save if currently saving manually or no changes
    if (isManualSaveRef.current || !shouldSave(value, lastSavedValue)) {
      return;
    }

    if (saveOnEveryKeystroke) {
      // Save immediately on every change
      save();
    } else {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new auto-save timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        save();
      }, autoSaveDelayMs);

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }
  }, [
    value,
    lastSavedValue,
    shouldSave,
    save,
    autoSaveDelayMs,
    saveOnEveryKeystroke,
  ]);

  const handleSetValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return {
    value,
    setValue: handleSetValue,
    save,
    isDirty: shouldSave(value, lastSavedValue),
    isSaving,
  };
}
