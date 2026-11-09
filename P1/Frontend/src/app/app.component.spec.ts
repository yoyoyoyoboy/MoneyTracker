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

  function load() { http.expectOne(expenseUrl).flush(expenses); }

  it('loads all expenses and keeps totals separate by currency', () => {
    load();
    expect(app.total()).toBe(1200);
    expect(app.average()).toBe(600);
    expect(app.filteredExpenses()).toHaveLength(3);
    app.summaryCurrency.set('USD');
    expect(app.total()).toBe(30);
    expect(app.average()).toBe(30);
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
    http.expectOne(expenseUrl).error(new ProgressEvent('error'));
    expect(app.loaded()).toBe(false);
    expect(app.loading()).toBe(false);
    expect(app.error()).toContain('backend');
    app.loadExpenses();
    load();
    expect(app.error()).toBe('');
    expect(app.loaded()).toBe(true);
  });
});
