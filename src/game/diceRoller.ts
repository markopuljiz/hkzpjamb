import { state } from './state';
import { loadDiceState, saveDiceState } from './storage';
import { openNajavaModal, updateNajavaIndicator } from './najava';
import { renderSubmitPreviews, setSubmitPreviewActive } from './submitPreview';

declare global {
  interface Window {
    resetRollState?: () => void;
  }
}

export function initDiceRoller() {
  const rollBtn = document.getElementById('roll-dice-btn') as HTMLButtonElement | null;
  const rollStatusEl = document.getElementById('roll-status');
  const najavaBtn = document.getElementById('najava-btn') as HTMLButtonElement | null;
  const dieLabels = document.querySelectorAll('[data-die]');

  if (!rollBtn || dieLabels.length === 0) return;
  state.najavaButton = najavaBtn;

  const updateRollStatus = () => {
    if (rollStatusEl) rollStatusEl.innerText = `${3 - state.rollsLeft}/3`;
    rollBtn.disabled = state.rollsLeft <= 0;
    rollBtn.classList.toggle('opacity-50', state.rollsLeft <= 0);
    rollBtn.classList.toggle('cursor-not-allowed', state.rollsLeft <= 0);
    const canNajava = state.rollsLeft === 2 && !state.isRolling && !state.najavaActive;

    if (state.najavaButton) {
      const lockedByNajava = state.najavaActive;
      state.najavaButton.disabled = lockedByNajava || !canNajava;
      state.najavaButton.classList.toggle('opacity-50', !canNajava && !lockedByNajava);
      state.najavaButton.classList.toggle('cursor-not-allowed', lockedByNajava || !canNajava);
    }
  };

  const setDieFace = (dieIndex: number, value: number) => {
    const label = document.querySelector(`[data-die="${dieIndex}"]`);
    if (!label) return;
    const faceEl = label.querySelector('[data-die-face]');
    if (!faceEl) return;
    const diceIcons = [
      'fa-dice-one',
      'fa-dice-two',
      'fa-dice-three',
      'fa-dice-four',
      'fa-dice-five',
      'fa-dice-six'
    ];

    faceEl.classList.remove(...diceIcons);
    faceEl.classList.remove('fa-dice');
    faceEl.classList.remove('text-4xl');
    faceEl.classList.remove('dice-empty');

    faceEl.classList.add('fas');
    faceEl.classList.add(diceIcons[value - 1]);
    faceEl.classList.add('text-5xl');
  };

  const setDieEmpty = (dieIndex: number) => {
    const label = document.querySelector(`[data-die="${dieIndex}"]`);
    if (!label) return;
    const faceEl = label.querySelector('[data-die-face]');
    if (!faceEl) return;
    faceEl.classList.remove(
      'fa-dice-one',
      'fa-dice-two',
      'fa-dice-three',
      'fa-dice-four',
      'fa-dice-five',
      'fa-dice-six',
      'text-5xl'
    );

    faceEl.classList.add('fas', 'fa-dice', 'text-4xl', 'dice-empty');
    faceEl.classList.remove('dice-rolling');
  };

  const restored = loadDiceState();
  if (restored) {
    state.rollsLeft = restored.rollsLeft;
    state.diceValues = restored.diceValues;

    dieLabels.forEach((label) => {
      const dieIndex = parseInt((label as HTMLElement).dataset.die || '', 10);
      const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      if (checkbox && !Number.isNaN(dieIndex) && dieIndex >= 0 && dieIndex < 5) {
        checkbox.checked = !!restored.locked[dieIndex];
      }
    });
  }

  const rollDice = () => {
    if (state.rollsLeft <= 0 || state.isRolling) return;
    state.isRolling = true;
    updateRollStatus();

    const rollingIntervals: Array<{ dieIndex: number; intervalId: number; faceEl: Element | null }> = [];
    const unlockedLabels: Array<{ dieIndex: number; faceEl: Element | null }> = [];

    dieLabels.forEach((label) => {
      const dieIndex = parseInt((label as HTMLElement).dataset.die || '', 10);
      const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      const isLocked = checkbox?.checked;
      const faceEl = label.querySelector('[data-die-face]');
      if (isLocked) return;

      unlockedLabels.push({ dieIndex, faceEl });
      if (faceEl) faceEl.classList.add('dice-rolling');

      const intervalId = window.setInterval(() => {
        const value = Math.floor(Math.random() * 6) + 1;
        setDieFace(dieIndex, value);
      }, 90);

      rollingIntervals.push({ dieIndex, intervalId, faceEl });
    });

    const stopNext = (idx: number) => {
      const target = unlockedLabels[idx];
      if (!target) {
        state.rollsLeft -= 1;
        state.isRolling = false;
        updateRollStatus();

        setSubmitPreviewActive(state.rollsLeft < 3);

        saveDiceState();
        if (state.submitPreviewActive) renderSubmitPreviews();
        return;
      }

      const { dieIndex, faceEl } = target;
      const interval = rollingIntervals.find((entry) => entry.dieIndex === dieIndex);
      if (interval) window.clearInterval(interval.intervalId);

      const finalValue = Math.floor(Math.random() * 6) + 1;
      state.diceValues[dieIndex] = finalValue;
      setDieFace(dieIndex, finalValue);

      if (faceEl) faceEl.classList.remove('dice-rolling');
      saveDiceState();

      window.setTimeout(() => stopNext(idx + 1), 160);
    };

    window.setTimeout(() => stopNext(0), 600);
  };

  window.resetRollState = () => {
    state.rollsLeft = 3;
    state.diceValues = [null, null, null, null, null];

    dieLabels.forEach((label) => {
      const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = false;
    });

    state.diceValues.forEach((value, index) => {
      if (value === null) setDieEmpty(index);
    });

    updateRollStatus();
    state.najavaActive = false;
    state.najavaRowId = null;
    setSubmitPreviewActive(false);
    updateNajavaIndicator();
    saveDiceState();
  };

  dieLabels.forEach((label) => {
    const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        saveDiceState();
      });
    }
  });

  if (najavaBtn) {
    najavaBtn.addEventListener('click', openNajavaModal);
  }

  state.diceValues.forEach((value, index) => {
    if (value === null) setDieEmpty(index);
    else setDieFace(index, value);
  });

  setSubmitPreviewActive(state.rollsLeft < 3);
  updateRollStatus();
  saveDiceState();
  rollBtn.addEventListener('click', rollDice);
}
