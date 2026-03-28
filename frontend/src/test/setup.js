import "@testing-library/jest-dom/vitest";

class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe(target) {
    this.callback?.([{ isIntersecting: true, target }]);
  }

  unobserve() {}

  disconnect() {}
}

if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = MockIntersectionObserver;
}
