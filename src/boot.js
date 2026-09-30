window.speedDialBoot = { themeKey: 'speedDial.theme' };

try {
  const theme = localStorage.getItem(window.speedDialBoot.themeKey);
  if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
} catch {
  // Storage can be blocked by browser policy; the saved theme still applies once settings load.
}
