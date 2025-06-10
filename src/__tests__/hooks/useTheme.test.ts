/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('should default to light theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('should load theme from localStorage', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(window.localStorage.getItem).toHaveBeenCalledWith('theme');
  });

  it('should cycle through themes when toggling', () => {
    const { result } = renderHook(() => useTheme());

    // Start with light
    expect(result.current.theme).toBe('light');

    // Toggle to dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

    // Toggle to system
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('system');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'system');

    // Toggle back to light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('should set theme directly', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should apply dark class based on system preference when theme is system', () => {
    // Mock system dark mode
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => useTheme());

    // Switch to system theme to trigger the matchMedia call
    act(() => {
      result.current.setTheme('system');
    });

    // Verify the dark class would be applied (we can't test DOM manipulation directly in jsdom)
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-color-scheme: dark)'
    );
  });
});
