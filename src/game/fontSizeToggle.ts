import { state } from './state';

const sizeOrder: Array<'small' | 'normal' | 'large'> = ['small', 'normal', 'large'];
const sizeLabels: Record<'small' | 'normal' | 'large', string> = {
  small: 'Aa-',
  normal: 'Aa',
  large: 'Aa+'
};

let fontSizeToggleButton: HTMLButtonElement | null = null;
let fontSizeToggleLabel: HTMLElement | null = null;

export function initFontSizeToggle() {
  fontSizeToggleButton = document.getElementById('font-size-toggle') as HTMLButtonElement | null;
  fontSizeToggleLabel = document.getElementById('font-size-toggle-label');
  if (!fontSizeToggleButton) return;

  fontSizeToggleButton.addEventListener('click', () => {
    const currentIndex = sizeOrder.indexOf(state.fontSizeMode);
    const nextIndex = (currentIndex + 1) % sizeOrder.length;
    setFontSizeMode(sizeOrder[nextIndex]);
  });

  setFontSizeMode(state.fontSizeMode);
}

export function setFontSizeMode(mode: 'small' | 'normal' | 'large') {
  state.fontSizeMode = mode;
  const root = document.documentElement;
  root.classList.toggle('font-size-small', mode === 'small');
  root.classList.toggle('font-size-normal', mode === 'normal');
  root.classList.toggle('font-size-large', mode === 'large');

  if (fontSizeToggleLabel) {
    fontSizeToggleLabel.textContent = sizeLabels[mode];
  }

  if (fontSizeToggleButton) {
    fontSizeToggleButton.setAttribute('aria-pressed', String(mode !== 'normal'));
    fontSizeToggleButton.title = `Font size: ${mode}`;
  }
}
