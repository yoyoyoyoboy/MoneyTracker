@RestController

public class taskscontroller {

    @GetMapping("/api/health")
    public String health() {
        return "Task Tracker API is running!";
    }
}