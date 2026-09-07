import { describe, it, expect } from 'vitest';
import { getNextTheme } from '../ThemeSwitcher';

describe('Theme Switcher Helper', () => {
  it('cycles theme correctly between dark, light, and system', () => {
    expect(getNextTheme('system')).toBe('dark');
    expect(getNextTheme('dark')).toBe('light');
    expect(getNextTheme('light')).toBe('system');
  });
});
