import { describe, it, expect } from 'vitest';
import { createToastState } from '../Toast';

describe('Toast notification state manager', () => {
  it('adds and removes toast messages correctly', () => {
    const manager = createToastState();
    expect(manager.getToasts().length).toBe(0);

    const id = manager.show('Success message', 'success');
    expect(manager.getToasts().length).toBe(1);
    expect(manager.getToasts()[0]).toEqual({
      id,
      message: 'Success message',
      type: 'success',
    });

    manager.dismiss(id);
    expect(manager.getToasts().length).toBe(0);
  });
});
