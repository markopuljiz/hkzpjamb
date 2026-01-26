import { state } from './state';

let darkModeToggleButton: HTMLButtonElement | null = null;
let darkModeToggleIcon: HTMLElement | null = null;

export function initDarkModeToggle() {
  darkModeToggleButton = document.getElementById('dark-mode-toggle') as HTMLButtonElement | null;
  darkModeToggleIcon = document.getElementById('dark-mode-toggle-icon');
  if (!darkModeToggleButton) return;

  darkModeToggleButton.addEventListener('click', () => {
    setDarkModeActive(!state.darkModeActive);
  });

  setDarkModeActive(state.darkModeActive);
}

export function setDarkModeActive(isActive: boolean) {
  state.darkModeActive = isActive;
  document.body.classList.toggle('dark-mode', isActive);

  if (darkModeToggleButton) {
    darkModeToggleButton.classList.toggle('text-emerald-200', isActive);
    darkModeToggleButton.classList.toggle('text-slate-300', !isActive);
    darkModeToggleButton.setAttribute('aria-pressed', String(isActive));
    darkModeToggleButton.title = `Dark mode: ${isActive ? 'on' : 'off'}`;
  }

  if (darkModeToggleIcon) {
    darkModeToggleIcon.classList.toggle('fa-moon', !isActive);
    darkModeToggleIcon.classList.toggle('fa-sun', isActive);
  }
}
