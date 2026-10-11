import { initApp } from './bootstrap.js';

window.addEventListener('DOMContentLoaded', () => {
  const app = initApp();
  window.AudioTechRuntime = app;
  console.info('[AudioTechApp] initialized');
});
