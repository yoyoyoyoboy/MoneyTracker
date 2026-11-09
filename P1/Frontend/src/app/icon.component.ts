import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="paths[name()] || paths['wallet']" /></svg>`,
  styles: [`:host{display:inline-flex;width:20px;height:20px;flex-shrink:0}svg{width:100%;height:100%}`]
})
export class IconComponent {
  readonly name = input('wallet');
  readonly paths: Record<string, string> = {
    wallet: 'M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6 M20 12h-5v5h5 M16 14.5h.01',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    plus: 'M12 5v14 M5 12h14', search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    arrow: 'M7 17 17 7 M7 7h10v10', trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
    close: 'm6 6 12 12 M6 18 18 6', receipt: 'M5 3h14v18l-3-2-4 2-4-2-3 2z M9 7h6 M9 11h6 M9 15h3',
    refresh: 'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 3 M18 18A8 8 0 0 1 5 15',
    check: 'm5 12 4 4L19 6', leaf: 'M5 19c-5-10 4-16 15-15 1 11-6 17-13 12 M4 21 15 10',
    down: 'm6 9 6 6 6-6', alert: 'M12 8v5 M12 17h.01 M10 3 1 20h22L14 3z',
    chevron: 'm9 5 7 7-7 7', coins: 'M20 6c0 2-4 3-8 3S4 8 4 6s4-3 8-3 8 1 8 3z M4 6v6c0 2 4 3 8 3s8-1 8-3V6 M4 12v6c0 2 4 3 8 3s8-1 8-3v-6'
  };
}
