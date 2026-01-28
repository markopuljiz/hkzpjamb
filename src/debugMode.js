export function initDebugMode({ updateState }) {
  const DEBUG_MODE_CLASS = 'debug-mode';

  function getScoreCellParts(cellId) {
    const match = /^(t[12])_c(\d+)_(.+)$/.exec(cellId);
    if (!match) return null;
    return {
      tableId: match[1],
      colIndex: Number(match[2]),
      rowId: match[3]
    };
  }

  function commitDebugCellValue(inputEl) {
    const parts = getScoreCellParts(inputEl.id);
    if (!parts) return;

    const raw = String(inputEl.value ?? '').trim();
    if (raw === '') {
      updateState(parts.tableId, parts.colIndex, parts.rowId, null);
      return;
    }

    if (!/^-?\d+$/.test(raw)) return;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return;

    updateState(parts.tableId, parts.colIndex, parts.rowId, n);
  }

  function setDebugScoreCellEditingEnabled(enabled) {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]')).filter((el) =>
      /^(t[12])_c\d+_/.test(el.id)
    );

    inputs.forEach((inputEl) => {
      if (enabled) {
        if (inputEl.dataset.debugOrigReadonly === undefined) {
          inputEl.dataset.debugOrigReadonly = inputEl.hasAttribute('readonly') ? '1' : '0';
        }

        if (inputEl.dataset.debugOrigOnclick === undefined) {
          inputEl.dataset.debugOrigOnclick = inputEl.getAttribute('onclick') ?? '';
        }

        inputEl.removeAttribute('readonly');
        inputEl.removeAttribute('onclick');

        if (inputEl.dataset.debugListeners !== '1') {
          inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitDebugCellValue(inputEl);
              inputEl.blur();
            }
          });

          inputEl.addEventListener('blur', () => {
            commitDebugCellValue(inputEl);
          });

          inputEl.addEventListener('change', () => {
            commitDebugCellValue(inputEl);
          });

          inputEl.dataset.debugListeners = '1';
        }

        inputEl.inputMode = 'numeric';
      } else {
        if (inputEl.dataset.debugOrigReadonly === '1') {
          inputEl.setAttribute('readonly', '');
        } else {
          inputEl.removeAttribute('readonly');
        }

        const origOnclick = inputEl.dataset.debugOrigOnclick ?? '';
        if (origOnclick) {
          inputEl.setAttribute('onclick', origOnclick);
        } else {
          inputEl.removeAttribute('onclick');
        }
      }
    });
  }

  function setDebugMode(enabled) {
    document.body.classList.toggle(DEBUG_MODE_CLASS, enabled);
    setDebugScoreCellEditingEnabled(enabled);
  }

  function toggleDebugMode() {
    const enabled = document.body.classList.contains(DEBUG_MODE_CLASS);
    setDebugMode(!enabled);
  }

  let debugTriggerClicks = 0;
  let debugTriggerTimerId = null;

  const debugTriggerEl = document.getElementById('debug-trigger');
  if (!debugTriggerEl) return;

  debugTriggerEl.addEventListener('click', () => {
    debugTriggerClicks += 1;

    if (debugTriggerTimerId !== null) {
      window.clearTimeout(debugTriggerTimerId);
    }

    debugTriggerTimerId = window.setTimeout(() => {
      debugTriggerClicks = 0;
      debugTriggerTimerId = null;
    }, 900);

    if (debugTriggerClicks >= 5) {
      debugTriggerClicks = 0;
      if (debugTriggerTimerId !== null) {
        window.clearTimeout(debugTriggerTimerId);
        debugTriggerTimerId = null;
      }
      toggleDebugMode();
    }
  });
}
