import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { Expense } from './expense.service';
import { environment } from '../environments/environment';

describe('Expense tracker', () => {
  let app: AppComponent;
  let http: HttpTestingController;
  const expenseUrl = `${environment.apiUrl}/expenseTracker`;
  const expenses: Expense[] = [
    { id: 1, title: 'Groceries', description: 'Weekly shop', currency: 'INR', amount: 1000 },
    { id: 2, title: 'Coffee', description: 'Morning cup', currency: 'INR', amount: 200 },
    { id: 3, title: 'Train', description: 'Commute', currency: 'USD', amount: 30 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    // jsdom does not implement the browser's native dialog methods.
    fixture.nativeElement.querySelectorAll('dialog').forEach((dialog: HTMLDialogElement) => {
      dialog.close = vi.fn();
      dialog.showModal = vi.fn();
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function pendingLoad() {
    return http.expectOne(request => request.url === expenseUrl && request.method === 'GET');
  }
  function load() { pendingLoad().flush(expenses); }

  it('loads monthly expenses and keeps totals separate by currency', () => {
    load();
    expect(app.total()).toBe(1200);
    expect(app.average()).toBe(600);
    expect(app.filteredExpenses()).toHaveLength(3);
    app.summaryCurrency.set('USD');
    expect(app.total()).toBe(30);
    expect(app.average()).toBe(30);
  });

  it('requests the current local calendar month as ISO instants by default', () => {
    const now = new Date();
    const request = pendingLoad();
    expect(request.request.params.get('from')).toBe(new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
    expect(request.request.params.get('to')).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString());
    request.flush(expenses);
  });

  it('reloads leap-year February and December with exclusive next-month boundaries', () => {
    load();
    for (const [month, from, to] of [
      ['2024-02', new Date(2024, 1, 1), new Date(2024, 2, 1)],
      ['2025-12', new Date(2025, 11, 1), new Date(2026, 0, 1)]
    ] as const) {
      app.changeMonth(month);
      expect(app.expenses()).toEqual([]);
      expect(app.loaded()).toBe(false);
      const request = pendingLoad();
      expect(request.request.params.get('from')).toBe(from.toISOString());
      expect(request.request.params.get('to')).toBe(to.toISOString());
      request.flush([expenses[0]]);
      expect(app.total()).toBe(1000);
    }
  });

  it('cancels an older month request when the selection changes quickly', () => {
    const previous = pendingLoad();
    app.changeMonth('2024-02');
    expect(previous.cancelled).toBe(true);
    pendingLoad().flush([expenses[1]]);
    expect(app.total()).toBe(200);
    expect(app.loading()).toBe(false);
  });

  it('ignores cleared or invalid months and unchanged selections', () => {
    load();
    for (const month of ['', '2024-13', '0000-01', app.selectedMonth()]) app.changeMonth(month);
    http.expectNone(request => request.method === 'GET');
  });

  it('reloads the selected historical month after creation without inserting the new expense', () => {
    load();
    app.changeMonth('2024-02');
    pendingLoad().flush([]);
    app.form.setValue({ title: 'Lunch', description: '', currency: 'INR', amount: 250 });
    app.createExpense();
    http.expectOne(expenseUrl).flush({ id: 4, title: 'Lunch', description: '', currency: 'INR', amount: 250 });
    const request = pendingLoad();
    expect(request.request.params.get('from')).toBe(new Date(2024, 1, 1).toISOString());
    request.flush([]);
    expect(app.expenses()).toEqual([]);
    expect(app.total()).toBe(0);
  });

  it('searches title and description, combines currency filters, and sorts by ID', () => {
    load();
    expect(app.filteredExpenses().map(e => e.id)).toEqual([3, 2, 1]);
    app.query.set('weekly');
    expect(app.filteredExpenses().map(e => e.id)).toEqual([1]);
    app.currencyFilter.set('USD');
    expect(app.filteredExpenses()).toEqual([]);
    app.clearFilters();
    app.sort.set('title');
    expect(app.filteredExpenses().map(e => e.title)).toEqual(['Coffee', 'Groceries', 'Train']);
  });

  it('rejects fractional, empty, whitespace-only, and out-of-range input', () => {
    load();
    app.form.setValue({ title: '  ', description: '', currency: 'INR', amount: 10 });
    expect(app.form.invalid).toBe(true);
    app.form.controls.title.setValue('Lunch');
    for (const amount of [null, 0, -1, 1.5, 2147483648]) {
      app.form.controls.amount.setValue(amount);
      expect(app.form.invalid).toBe(true);
    }
    app.createExpense();
    http.expectNone(request => request.method === 'POST');
    app.form.controls.amount.setValue(250);
    expect(app.form.valid).toBe(true);
  });

  it('creates an expense using the backend contract and updates totals', () => {
    load();
    app.form.setValue({ title: ' Lunch ', description: ' Meal ', currency: 'INR', amount: 250 });
    app.createExpense();
    app.createExpense(); // Ignore duplicate submissions while saving.
    const request = http.expectOne(expenseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'Lunch', description: 'Meal', currency: 'INR', amount: 250 });
    request.flush({ ...request.request.body, id: 4 });
    const reload = pendingLoad();
    expect(reload.request.params.has('from')).toBe(true);
    expect(reload.request.params.has('to')).toBe(true);
    reload.flush([...expenses, { ...request.request.body, id: 4 }]);
    expect(app.expenses()).toHaveLength(4);
    expect(app.total()).toBe(1450);
    expect(app.saving()).toBe(false);
  });

  it('keeps an expense when the backend does not support deletion', () => {
    load();
    app.pendingDelete.set(expenses[0]);
    app.deleteExpense();
    const request = http.expectOne(`${expenseUrl}/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({}, { status: 405, statusText: 'Method Not Allowed' });
    expect(app.expenses()).toHaveLength(3);
    expect(app.deleteError()).toContain('kept');
    expect(app.deleting()).toBe(false);
  });

  it('removes an expense only after successful deletion', () => {
    load();
    app.pendingDelete.set(expenses[0]);
    app.deleteExpense();
    expect(app.expenses()).toHaveLength(3);
    http.expectOne(`${expenseUrl}/1`).flush(null);
    expect(app.expenses().map(e => e.id)).toEqual([2, 3]);
    expect(app.total()).toBe(200);
  });

  it('shows a recoverable load error instead of a successful empty list', () => {
    pendingLoad().error(new ProgressEvent('error'));
    expect(app.loaded()).toBe(false);
    expect(app.loading()).toBe(false);
    expect(app.error()).toContain('backend');
    app.loadExpenses();
    load();
    expect(app.error()).toBe('');
    expect(app.loaded()).toBe(true);
  });
});
