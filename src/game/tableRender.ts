import { columns, rows, type TableConfig } from './config';

export function renderTableContainer(tableConfig: TableConfig) {
  const container = document.getElementById(`table-container-${tableConfig.id}`);
  const baseColor = tableConfig.color;

  let html = `
        <div class="flex-grow overflow-auto custom-scroll relative">
            <table class="w-full min-w-[350px] border-collapse text-center" id="table-${tableConfig.id}">
    `;

  html += `
        <thead class="${tableConfig.headerColor} text-white sticky-head shadow-sm">
            <tr>
                <th class="p-2 w-14 sticky-col ${tableConfig.headerColor} sticky-corner border-b border-white/20">
                  <span id="table-total-${tableConfig.id}" class="bg-${tableConfig.color}-600 text-white min-w-[2.5rem] h-7 px-2 rounded-full inline-flex items-center justify-center text-sm font-semibold">
                    0
                  </span>
                </th>
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-arrow-down text-base opacity-90"></i></th>
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-arrow-up text-base opacity-90"></i></th>
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-arrows-left-right text-base opacity-90"></i></th>
                <th class="p-2 w-1/4 border-l border-white/20">
                  <i class="fas fa-bullhorn text-base opacity-90"></i>
                  <span data-ann-label class="block text-[10px] font-semibold text-white/80"></span>
                </th>
            </tr>
        </thead>
        <tbody class="text-sm">
    `;

  rows.forEach((row) => {
    const isSum = row.isSum;
    const rowClass = isSum ? `bg-${baseColor}-50 font-bold` : 'hover:bg-slate-50 transition-colors';
    const labelBg = isSum ? `bg-${baseColor}-100` : 'bg-white';
    const labelId = `${tableConfig.id}_label_${row.id}`;
    const badgeId = `${tableConfig.id}_badge_${row.id}`;

    html += `<tr class="${rowClass}">`;

    html += `
            <td id="${labelId}" class="sticky-col ${labelBg} p-2 text-right border-b border-slate-200 text-slate-600 transition-colors duration-300">
                <div class="flex items-center justify-end gap-2">
                     <span id="${badgeId}" class="hidden bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 rounded-full border border-yellow-300 shadow-sm badge-pop">+0</span>
                    ${row.icon ? `<i class="${row.icon} opacity-50 text-[10px]"></i>` : ''}
                    <span>${row.label}</span>
                </div>
            </td>
        `;

    columns.forEach((_, cIndex) => {
      const cellId = `${tableConfig.id}_c${cIndex}_${row.id}`;
      const ghostId = `ghost_${tableConfig.id}_c${cIndex}_${row.id}`;

      html += `<td class="border-l border-b border-slate-200 p-0 relative h-10">`;
      if (isSum) {
        html += `<div id="${cellId}" class="flex flex-col items-center justify-center w-full h-full text-${baseColor}-700 transition-all duration-300 leading-none text-lg">0</div>`;
      } else {
        html += `<span id="${ghostId}" class="absolute top-0.5 right-1 text-[9px] text-slate-300 italic pointer-events-none z-0"></span>`;
        html += `<span id="preview_${tableConfig.id}_c${cIndex}_${row.id}" class="absolute inset-0 flex items-center justify-center text-lg leading-none font-medium italic text-slate-100 bg-emerald-300/90 opacity-0 transition-opacity pointer-events-none z-20"></span>`;

        const inputClasses = `w-full h-full text-center bg-transparent relative z-10 focus:bg-${baseColor}-100 focus:outline-none font-medium text-lg leading-none text-slate-800 cursor-pointer selection:bg-transparent`;

        html += `<input type="text" id="${cellId}" readonly
                class="${inputClasses}" 
                placeholder="-" 
                onclick="applyAutoScore('${tableConfig.id}', ${cIndex}, '${row.id}')">`;
      }
      html += `</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody>`;

  html += `
        <tfoot class="bg-slate-100 font-bold sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
            <tr class="border-t-2 border-slate-300">
                <td class="p-2 sticky-col bg-slate-200 text-right pr-2 text-[10px] uppercase text-slate-500">Total</td>
                <td class="p-2 border-l border-slate-300 text-${baseColor}-700" id="${tableConfig.id}_total_0">0</td>
                <td class="p-2 border-l border-slate-300 text-${baseColor}-700" id="${tableConfig.id}_total_1">0</td>
                <td class="p-2 border-l border-slate-300 text-${baseColor}-700" id="${tableConfig.id}_total_2">0</td>
                <td class="p-2 border-l border-slate-300 text-${baseColor}-700" id="${tableConfig.id}_total_3">0</td>
            </tr>
        </tfoot>
    `;
  html += `</table></div>`;

  if (!container) return;
  container.innerHTML = html;

  const bonusBadge = document.getElementById(`${tableConfig.id}-extra-badge`);
  if (!bonusBadge) {
    const badge = document.createElement('span');
    badge.id = `${tableConfig.id}-extra-badge`;
    badge.className =
      'hidden text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 absolute top-2 right-4';
    badge.innerHTML = 'Horiz. Bonus: +<span id="${tableConfig.id}-extra-val">0</span>';
    container.appendChild(badge);
  }
}
