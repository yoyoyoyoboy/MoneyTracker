import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { catchError, exhaustMap, map, merge, Observable, of, scan, shareReplay, startWith, Subject, tap } from 'rxjs';
import { CreateTaskRequest, Task } from './task.model';
import { TaskService } from './task.service';

interface TaskState {
  tasks: Task[];
  search: string;
  announcement: string;
  loading: boolean;
  saving: boolean;
  loadError: string;
  createError: string;
}

type TaskEvent =
  | { type: 'loading' }
  | { type: 'loaded'; tasks: Task[] }
  | { type: 'loadFailed' }
  | { type: 'saving' }
  | { type: 'created'; task: Task }
  | { type: 'createFailed' }
  | { type: 'searchChanged'; search: string }
  | { type: 'formReset' };

const initialState: TaskState = {
  tasks: [], search: '', announcement: '', loading: false, saving: false,
  loadError: '', createError: '',
};

function reduceState(state: TaskState, event: TaskEvent): TaskState {
  switch (event.type) {
    case 'loading':
      return { ...state, loading: true, loadError: '' };
    case 'loaded':
      return { ...state, tasks: event.tasks, loading: false };
    case 'loadFailed':
      return { ...state, loading: false, loadError: 'Could not load tasks. Please try again.' };
    case 'saving':
      return { ...state, saving: true, createError: '' };
    case 'created':
      return {
        ...state, tasks: [event.task, ...state.tasks], saving: false, search: '',
        announcement: `Added “${event.task.title}”.`,
      };
    case 'createFailed':
      return {
        ...state, saving: false,
        createError: 'Could not create the task. Your details have been kept. Please try again.',
      };
    case 'searchChanged':
      return { ...state, search: event.search };
    case 'formReset':
      return { ...state, createError: '' };
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly taskService = inject(TaskService);
  private readonly reload$ = new Subject<void>();
  private readonly create$ = new Subject<{ request: CreateTaskRequest; form: NgForm }>();
  private readonly uiEvents$ = new Subject<TaskEvent>();

  private readonly loadEvents$ = this.reload$.pipe(
    startWith(undefined),
    exhaustMap((): Observable<TaskEvent> => this.taskService.getAllTasks().pipe(
      map((tasks): TaskEvent => ({ type: 'loaded', tasks })),
      catchError(() => of<TaskEvent>({ type: 'loadFailed' })),
      startWith<TaskEvent>({ type: 'loading' }),
    )),
  );

  private readonly createEvents$ = this.create$.pipe(
    exhaustMap(({ request, form }): Observable<TaskEvent> => this.taskService.createTask(request).pipe(
      tap(() => this.clearDraft(form)),
      map((task): TaskEvent => ({ type: 'created', task })),
      catchError(() => of<TaskEvent>({ type: 'createFailed' })),
      startWith<TaskEvent>({ type: 'saving' }),
    )),
  );

  readonly vm$ = merge(this.loadEvents$, this.createEvents$, this.uiEvents$).pipe(
    scan(reduceState, initialState),
    map(state => {
      const query = state.search.trim().toLowerCase();
      return {
        ...state,
        visibleTasks: state.tasks.filter(task =>
          `${task.title} ${task.description ?? ''}`.toLowerCase().includes(query)),
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly today = new Date();
  draft: CreateTaskRequest = { title: '', description: '' };

  loadTasks(): void {
    this.reload$.next();
  }

  setSearch(search: string): void {
    this.uiEvents$.next({ type: 'searchChanged', search });
  }

  addTask(form: NgForm): void {
    if (form.invalid || !this.draft.title.trim()) {
      form.control.markAllAsTouched();
      return;
    }
    this.create$.next({
      request: { title: this.draft.title.trim(), description: this.draft.description.trim() },
      form,
    });
  }

  resetForm(form: NgForm): void {
    this.clearDraft(form);
    this.uiEvents$.next({ type: 'formReset' });
  }

  private clearDraft(form: NgForm): void {
    this.draft = { title: '', description: '' };
    form.resetForm(this.draft);
  }
}
