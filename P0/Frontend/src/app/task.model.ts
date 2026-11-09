export interface CreateTaskRequest {
  title: string;
  description: string;
}

export interface Task extends CreateTaskRequest {
  id: number;
  completed: boolean;
}
