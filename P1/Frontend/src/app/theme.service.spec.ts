import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('Theme preference', () => {
  let media: MediaQueryList;
  let systemChange: () => void;

  beforeEach(() => {
    localStorage.removeItem('moneytrack-theme');
    media = {
      matches: true,
      addEventListener: vi.fn((_event: string, listener: () => void) => { systemChange = listener; }),
      removeEventListener: vi.fn()
    } as unknown as MediaQueryList;
    vi.stubGlobal('matchMedia', vi.fn(() => media));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.removeItem('moneytrack-theme');
    delete document.documentElement.dataset['theme'];
    document.documentElement.style.colorScheme = '';
  });

  it('follows system changes until the user chooses a theme', () => {
    const theme = TestBed.inject(ThemeService);
    expect(theme.theme()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    Object.defineProperty(media, 'matches', { value: false, configurable: true });
    systemChange();
    expect(theme.theme()).toBe('light');
    theme.toggle();
    systemChange();
    expect(theme.theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('moneytrack-theme')).toBe('dark');
    TestBed.resetTestingModule();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', systemChange);
  });

  it('restores a saved choice instead of the system preference', () => {
    localStorage.setItem('moneytrack-theme', 'light');
    const theme = TestBed.inject(ThemeService);
    expect(theme.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    systemChange();
    expect(theme.theme()).toBe('light');
  });

  it('keeps switching themes when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Unavailable'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Unavailable'); });
    const theme = TestBed.inject(ThemeService);
    expect(() => theme.toggle()).not.toThrow();
    expect(theme.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });
});
