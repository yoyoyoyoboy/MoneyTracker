import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Expense {
  id: number;
  title: string;
  description: string;
  currency: string;
  amount: number;
}
export type NewExpense = Omit<Expense, 'id'>;

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly url = '/expenseTracker';

  getAll() { return this.http.get<Expense[]>(this.url); }
  create(expense: NewExpense) { return this.http.post<Expense>(this.url, expense); }
  delete(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
