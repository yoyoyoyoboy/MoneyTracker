# Taskspace

An Angular frontend for listing tasks and creating tasks with a title and description.

## Run

```sh
npm install
npm start
```

Start the Spring Boot backend on port 8080, then open http://localhost:4200.
API requests go directly to `http://localhost:8080/api/tasks`.
The backend must allow cross-origin requests from `http://localhost:4200`.

## API

- `GET /api/tasks/`: loads the task list on startup.
- `POST /api/tasks`: creates a task with only these request fields:

```json
{
  "title": "My task",
  "description": "Task details"
}
```

The backend returns tasks with `id`, `title`, `description`, and `completed`.
The frontend displays titles and descriptions, supports local search, and shows
loading and error states. The form clears after successful creation and keeps
its values if the request fails.

## Reactive state

The component exposes an RxJS `vm$` stream consumed by a single `async` pipe.
Load, create, search, and reset events update state through `scan`; `exhaustMap`
ignores duplicate requests while one is pending. Request errors are handled
inside each operation so retries remain available. The async pipe manages
subscription cleanup; application code does not manually subscribe.

## Build

```sh
npm run build
```

Production output is in `dist/taskspace/browser`. API requests also use
`http://localhost:8080` in production builds.
