import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
}

type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  // Status indicators
  const [apiStatus, setApiStatus] = useState<ConnectionStatus>('checking');
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll server status and load todos on mount
  useEffect(() => {
    checkConnections();
    fetchTodos();

    // Check status every 10 seconds
    const interval = setInterval(() => {
      checkConnections();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const checkConnections = async () => {
    // 1. Check API Health
    try {
      const apiRes = await fetch(`${API_BASE_URL}/api/v1/health`);
      if (apiRes.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('disconnected');
      }
    } catch {
      setApiStatus('disconnected');
    }

    // 2. Check Database connection
    try {
      const dbRes = await fetch(`${API_BASE_URL}/api/v1/db-test`);
      if (dbRes.ok) {
        const data = await dbRes.json();
        if (data.database === 'connected') {
          setDbStatus('connected');
        } else {
          setDbStatus('disconnected');
        }
      } else {
        setDbStatus('disconnected');
      }
    } catch {
      setDbStatus('disconnected');
    }
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/todos`);
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
        setErrorMessage(null);
      } else {
        setErrorMessage('Failed to fetch TODOs from the API.');
      }
    } catch (err) {
      setErrorMessage('Could not connect to the API backend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          completed: false,
        }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setTodos([newTodo, ...todos]);
        setTitle('');
        setDescription('');
      } else {
        alert('Failed to add TODO.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating TODO. Please check connection.');
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !todo.completed,
        }),
      });

      if (res.ok) {
        const updatedTodo = await res.json();
        setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this TODO?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/todos/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter implementation
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div className="todo-container">
      <div className="content-wrapper">
        <header className="app-header">
          <h1 className="app-title">Task Space</h1>
          <p className="app-subtitle">A modern, secure full-stack TODO planner</p>
        </header>

        {/* Connectivity Status Panel */}
        <section className="status-panel">
          <div className="status-badge">
            API Gateway: 
            <span className={`status-indicator status-${apiStatus}`} />
            {apiStatus === 'connected' ? 'Online' : apiStatus === 'disconnected' ? 'Offline' : 'Checking...'}
          </div>
          <div className="status-badge">
            Database Cluster: 
            <span className={`status-indicator status-${dbStatus}`} />
            {dbStatus === 'connected' ? 'Connected' : dbStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
          </div>
        </section>

        {/* Add Todo Form */}
        <form onSubmit={handleAddTodo} className="todo-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="todo-input"
              maxLength={255}
              required
            />
          </div>
          <div className="input-group">
            <textarea
              placeholder="Add details/description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="todo-input todo-textarea"
              maxLength={1000}
            />
          </div>
          <button type="submit" className="todo-submit-btn wide">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Task
          </button>
        </form>

        {/* Filters */}
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({todos.length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({todos.filter(t => !t.completed).length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({todos.filter(t => t.completed).length})
          </button>
        </div>

        {/* Error Messaging */}
        {errorMessage && (
          <div style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: 20, fontSize: '0.9rem' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Todo List */}
        {loading ? (
          <div className="loading-spinner" />
        ) : filteredTodos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛸</div>
            <p>No tasks found in this orbit.</p>
          </div>
        ) : (
          <div className="todo-list">
            {filteredTodos.map((todo) => (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo)}
                  />
                  <span className="checkmark" />
                </label>
                <div className="todo-info">
                  <div className="todo-item-title">{todo.title}</div>
                  {todo.description && <div className="todo-item-desc">{todo.description}</div>}
                </div>
                <div className="todo-actions">
                  <button
                    type="button"
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="action-btn delete"
                    title="Delete task"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
