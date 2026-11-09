import { Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
import { Expense, ExpenseService } from './expense.service';
import { IconComponent } from './icon.component';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, IconComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly theme = inject(ThemeService);
  private readonly api = inject(ExpenseService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private loadSubscription?: Subscription;
  readonly selectedMonth = signal(this.currentMonth());
  readonly expenseDialog = viewChild<ElementRef<HTMLDialogElement>>('expenseDialog');
  readonly deleteDialog = viewChild<ElementRef<HTMLDialogElement>>('deleteDialog');
  readonly expenses = signal<Expense[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly deleteError = signal('');
  readonly notice = signal('');
  readonly query = signal('');
  readonly currencyFilter = signal('all');
  readonly summaryCurrency = signal('INR');
  readonly sort = signal('newest');
  readonly pendingDelete = signal<Expense | null>(null);
  readonly currencies = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'AED'];
  readonly availableCurrencies = computed(() => [...new Set([...this.currencies, ...this.expenses().map(e => e.currency)])].sort());
  readonly currencyExpenses = computed(() => this.expenses().filter(e => e.currency === this.summaryCurrency()));
  readonly total = computed(() => this.currencyExpenses().reduce((sum, e) => sum + e.amount, 0));
  readonly average = computed(() => this.currencyExpenses().length ? this.total() / this.currencyExpenses().length : 0);
  readonly topExpenses = computed(() => [...this.currencyExpenses()].sort((a, b) => b.amount - a.amount).slice(0, 4));
  readonly filteredExpenses = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.expenses().filter(e =>
      (this.currencyFilter() === 'all' || e.currency === this.currencyFilter()) &&
      `${e.title} ${e.description ?? ''} ${e.currency}`.toLowerCase().includes(query)
    ).sort((a, b) => this.sort() === 'title' ? a.title.localeCompare(b.title) : this.sort() === 'oldest' ? a.id - b.id : b.id - a.id);
  });
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
    description: ['', Validators.maxLength(500)],
    amount: [null as number | null, [Validators.required, Validators.min(1), Validators.max(2147483647), Validators.pattern(/^\d+$/)]],
    currency: ['INR', Validators.required]
  });

  constructor() { this.loadExpenses(); }

  private currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  changeMonth(month: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month.startsWith('0000') || month === this.selectedMonth()) return;
    this.selectedMonth.set(month);
    this.loadExpenses();
  }

  loadExpenses() {
    this.loadSubscription?.unsubscribe();
    const [year, month] = this.selectedMonth().split('-').map(Number);
    // Local calendar boundaries, serialized as UTC instants. The upper bound is exclusive.
    const from = new Date(0);
    from.setFullYear(year, month - 1, 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);
    this.loading.set(true);
    this.loaded.set(false);
    this.expenses.set([]);
    this.error.set('');
    this.loadSubscription = this.api.getAll(from.toISOString(), to.toISOString()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: expenses => { this.expenses.set(expenses); this.loaded.set(true); },
      error: () => this.error.set('We couldn’t load your expenses. Check that the backend is running and try again.')
    });
  }

  openCreate() {
    this.form.reset({ title: '', description: '', amount: null, currency: this.summaryCurrency() });
    this.formError.set('');
    this.expenseDialog()?.nativeElement.showModal();
  }

  closeCreate() { if (!this.saving()) this.expenseDialog()?.nativeElement.close(); }

  createExpense() {
    if (this.saving()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const values = this.form.getRawValue();
    this.saving.set(true);
    this.formError.set('');
    this.api.create({ ...values, title: values.title.trim(), description: values.description.trim(), amount: values.amount! })
      .pipe(finalize(() => this.saving.set(false))).subscribe({
        next: expense => {
          this.summaryCurrency.set(expense.currency);
          this.expenseDialog()?.nativeElement.close();
          this.notice.set('Expense added successfully.');
          this.loadExpenses();
        },
        error: () => this.formError.set('Your expense couldn’t be saved. Please check your connection and try again.')
      });
  }

  confirmDelete(expense: Expense) {
    this.pendingDelete.set(expense);
    this.deleteError.set('');
    this.deleteDialog()?.nativeElement.showModal();
  }

  closeDelete() { if (!this.deleting()) this.deleteDialog()?.nativeElement.close(); }

  deleteExpense() {
    const expense = this.pendingDelete();
    if (!expense || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set('');
    this.api.delete(expense.id).pipe(finalize(() => this.deleting.set(false))).subscribe({
      next: () => {
        this.expenses.update(expenses => expenses.filter(e => e.id !== expense.id));
        this.deleteDialog()?.nativeElement.close();
        this.notice.set('Expense deleted.');
      },
      error: (error: HttpErrorResponse) => this.deleteError.set(
        error.status === 404 || error.status === 405
          ? 'Deletion isn’t available on the backend yet. The expense has been kept.'
          : 'Your expense couldn’t be deleted. Please try again.'
      )
    });
  }

  clearFilters() { this.query.set(''); this.currencyFilter.set('all'); }
  initials(title: string) { return title.trim().slice(0, 1).toUpperCase(); }
}
