import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:8080/api/tasks";

function normalizeCategoryInput(value) {
  return value.replace(/[^A-Za-z]/g, "").slice(0, 20);
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [modalDescription, setModalDescription] = useState("");
  const [modalCategory, setModalCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = editingTaskId !== null;

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

  const closeModal = () => {
    setModalOpen(false);
    setEditingTaskId(null);
    setModalDescription("");
    setModalCategory("");
  };

  const openAddModal = () => {
    setError("");
    setEditingTaskId(null);
    setModalDescription("");
    setModalCategory("");
    setModalOpen(true);
  };

  const startEdit = (task) => {
    setError("");
    setEditingTaskId(task.id);
    setModalDescription(task.description ?? "");
    setModalCategory(normalizeCategoryInput(task.category ?? ""));
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const handleModalSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!modalDescription.trim()) {
      setError("Description is required.");
      return;
    }

    const categoryValue = normalizeCategoryInput(modalCategory);
    if (!categoryValue) {
      setError("Category is required (one word, letters only, up to 20 characters).");
      return;
    }

    const requestMethod = isEditing ? "PUT" : "POST";
    const requestUrl = isEditing ? `${API_BASE_URL}/${editingTaskId}` : API_BASE_URL;

    const taskBeingEdited = isEditing ? tasks.find((t) => t.id === editingTaskId) : null;
    if (isEditing && !taskBeingEdited) {
      setError("Task no longer exists.");
      closeModal();
      await loadTasks();
      return;
    }

    const body = isEditing
      ? {
          description: modalDescription.trim(),
          category: modalCategory.trim(),
          done: taskBeingEdited.done,
          dueDate: taskBeingEdited.dueDate || null
        }
      : {
          description: modalDescription.trim(),
          category: modalCategory.trim(),
          done: false,
          dueDate: null
        };

    try {
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let message = isEditing ? "Could not update task." : "Could not create task.";
        try {
          const errBody = await response.json();
          if (errBody?.error) {
            message = errBody.error;
          }
        } catch {
          /* use default message */
        }
        throw new Error(message);
      }

      await loadTasks();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
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
        closeModal();
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
      <header className="page-header">
        <h1>Task Management</h1>
        <button type="button" onClick={openAddModal}>
          Add task
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading tasks...</p> : null}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={task.done ? "done" : ""}>
            <div>
              <strong>{task.description}</strong>
              <p className="task-meta">
                Category: {task.category?.trim() ? task.category : "—"}
              </p>
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

      {modalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="task-modal-title">{isEditing ? "Edit task" : "New task"}</h2>
            <form className="modal-form" onSubmit={handleModalSubmit}>
              <label>
                Category
                <input
                  type="text"
                  value={modalCategory}
                  onChange={(event) => setModalCategory(normalizeCategoryInput(event.target.value))}
                  placeholder="e.g. Work"
                  maxLength={20}
                  autoComplete="off"
                  autoFocus
                />
              </label>
              <label>
                Description
                <textarea
                  value={modalDescription}
                  onChange={(event) => setModalDescription(event.target.value)}
                  placeholder="Describe the task..."
                  rows={4}
                />
              </label>
              <div className="form-actions">
                <button type="submit">Save</button>
                <button type="button" className="secondary" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
