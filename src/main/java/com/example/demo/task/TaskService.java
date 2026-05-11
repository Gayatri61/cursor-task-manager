package com.example.demo.task;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class TaskService {

    private static final Pattern CATEGORY_WORD = Pattern.compile("^[A-Za-z]{1,20}$");

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAll() {
        return taskRepository.findAll();
    }

    public Task create(Task task) {
        task.setId(null);
        requireCategory(task.getCategory());
        task.setCategory(task.getCategory().trim());
        return taskRepository.save(task);
    }

    public Task update(Long id, Task task) {
        Task existing = getById(id);
        requireCategory(task.getCategory());
        existing.setDescription(task.getDescription());
        existing.setCategory(task.getCategory().trim());
        existing.setDone(task.isDone());
        existing.setDueDate(task.getDueDate());
        return taskRepository.save(existing);
    }

    private void requireCategory(String category) {
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("Category is required.");
        }
        String trimmed = category.trim();
        if (!CATEGORY_WORD.matcher(trimmed).matches()) {
            throw new IllegalArgumentException(
                    "Category must be a single word (letters A-Z or a-z only), at most 20 characters.");
        }
    }

    public Task patchDone(Long id, boolean done) {
        Task existing = getById(id);
        existing.setDone(done);
        return taskRepository.save(existing);
    }

    public void delete(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new TaskNotFoundException(id);
        }
        taskRepository.deleteById(id);
    }

    private Task getById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
    }
}
