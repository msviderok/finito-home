import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

Element.prototype.scrollIntoView = () => {};

Element.prototype.getBoundingClientRect = () => ({
  width: 120,
  height: 28,
  top: 0,
  left: 0,
  bottom: 28,
  right: 120,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});

Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};
