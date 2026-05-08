package com.example.demo.task;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAll() {
        return taskRepository.findAll();
    }

    public Task create(Task task) {
        task.setId(null);
        return taskRepository.save(task);
    }

    public Task update(Long id, Task task) {
        Task existing = getById(id);
        existing.setDescription(task.getDescription());
        existing.setDone(task.isDone());
        existing.setDueDate(task.getDueDate());
        return taskRepository.save(existing);
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
