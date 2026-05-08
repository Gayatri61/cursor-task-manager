import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:8080/api/tasks";

const emptyForm = {
  description: "",
  dueDate: "",
  done: false
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = useMemo(() => editingTaskId !== null, [editingTaskId]);

  const loadTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error("Could not load tasks.");
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingTaskId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    const requestMethod = isEditing ? "PUT" : "POST";
    const requestUrl = isEditing ? `${API_BASE_URL}/${editingTaskId}` : API_BASE_URL;

    try {
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description: form.description.trim(),
          done: form.done,
          dueDate: form.dueDate || null
        })
      });

      if (!response.ok) {
        throw new Error(isEditing ? "Could not update task." : "Could not create task.");
      }

      await loadTasks();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setForm({
      description: task.description ?? "",
      dueDate: task.dueDate ?? "",
      done: task.done ?? false
    });
  };

  const handleDelete = async (taskId) => {
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/${taskId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Could not delete task.");
      }
      await loadTasks();
      if (editingTaskId === taskId) {
        resetForm();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDoneToggle = async (task) => {
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/${task.id}/done`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ done: !task.done })
      });
      if (!response.ok) {
        throw new Error("Could not update task status.");
      }
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h1>Task Management</h1>

      <form className="task-form" onSubmit={handleSubmit}>
        <label>
          Description
          <input
            type="text"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Enter task description"
          />
        </label>

        <label>
          Date
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.done}
            onChange={(event) => setForm({ ...form, done: event.target.checked })}
          />
          Done
        </label>

        <div className="form-actions">
          <button type="submit">{isEditing ? "Update Task" : "Add Task"}</button>
          {isEditing ? (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading tasks...</p> : null}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={task.done ? "done" : ""}>
            <div>
              <strong>{task.description}</strong>
              <p>Date: {task.dueDate || "Not set"}</p>
            </div>
            <div className="task-actions">
              <button type="button" onClick={() => handleDoneToggle(task)}>
                {task.done ? "Mark Undone" : "Mark Done"}
              </button>
              <button type="button" className="secondary" onClick={() => startEdit(task)}>
                Edit
              </button>
              <button type="button" className="danger" onClick={() => handleDelete(task.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
