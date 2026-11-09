import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const storageKey = 'moneytrack-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly media = this.window?.matchMedia?.('(prefers-color-scheme: dark)');
  private preference = this.readPreference();
  private readonly activeTheme = signal<Theme>(this.preference ?? (this.media?.matches ? 'dark' : 'light'));
  readonly theme = this.activeTheme.asReadonly();

  constructor() {
    this.applyTheme();
    const onSystemChange = () => {
      if (!this.preference) {
        this.activeTheme.set(this.media?.matches ? 'dark' : 'light');
        this.applyTheme();
      }
    };
    this.media?.addEventListener('change', onSystemChange);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', onSystemChange));
  }

  toggle() {
    this.preference = this.theme() === 'dark' ? 'light' : 'dark';
    this.activeTheme.set(this.preference);
    this.applyTheme();
    try { this.window?.localStorage.setItem(storageKey, this.preference); } catch { /* Storage can be unavailable in private browsing. */ }
  }

  private readPreference(): Theme | null {
    try {
      const saved = this.window?.localStorage.getItem(storageKey);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch { return null; }
  }

  private applyTheme() {
    const theme = this.theme();
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme;
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101b17' : '#176d55');
  }
}
