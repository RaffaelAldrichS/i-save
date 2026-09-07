import { describe, it, expect } from 'vitest';
import { getActiveSectionId } from '../Navbar';

describe('Navbar getActiveSectionId helper', () => {
  it('returns null when document is undefined or elements absent', () => {
    const activeId = getActiveSectionId(['nonexistent']);
    expect(activeId).toBeNull();
  });
});
