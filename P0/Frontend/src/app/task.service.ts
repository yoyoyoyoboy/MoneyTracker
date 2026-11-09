import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTaskRequest, Task } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8080/api/tasks';

  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.url}`);
  }

  createTask(request: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.url, {
      title: request.title,
      description: request.description,
    });
  }
}
