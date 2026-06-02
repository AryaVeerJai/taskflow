import React, { useEffect, useState, useCallback } from 'react';
import { tasksAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const statusBadge = (s) => {
  const map = { 'todo': 'badge-blue', 'in-progress': 'badge-yellow', 'done': 'badge-green' };
  const icons = { 'todo': '🎯', 'in-progress': '⚡', 'done': '✅' };
  return <span className={`badge ${map[s]}`}>{icons[s]} {s}</span>;
};

const priorityBadge = (p) => {
  const map = { low: 'badge-green', medium: 'badge-yellow', high: 'badge-red' };
  return <span className={`badge ${map[p]}`}>{p}</span>;
};

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    tags: task?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title || form.title.length < 3) e.title = 'Title must be at least 3 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || undefined,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save task';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fe = {};
        err.response.data.errors.forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="label">Title *</label>
              <input className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="What needs to be done?"
                value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              {errors.title && <span className="error-msg">{errors.title}</span>}
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" placeholder="Add details..." rows={3}
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Tags (comma separated)</label>
              <input className="input" placeholder="frontend, urgent, review"
                value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" /> Saving...</> : (task ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onArchive, onStatusChange }) {
  const [deleting, setDeleting] = useState(false);
  const isOverdue = task.isOverdue || (task.dueDate && task.status !== 'done' && new Date() > new Date(task.dueDate));

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setDeleting(true);
    try { await onDelete(task._id); }
    finally { setDeleting(false); }
  };

  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column', gap: '12px',
      borderLeft: `3px solid ${task.priority === 'high' ? 'var(--red)' : task.priority === 'medium' ? 'var(--yellow)' : 'var(--green)'}`,
      opacity: deleting ? 0.5 : 1, transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <h4 style={{
          fontSize: '15px', fontWeight: 600, flex: 1,
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          color: task.status === 'done' ? 'var(--text2)' : 'var(--text)',
        }}>{task.title}</h4>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(task)} title="Edit">✏️</button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={handleDelete} title="Delete" disabled={deleting}>🗑️</button>
        </div>
      </div>

      {task.description && (
        <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>{task.description}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {statusBadge(task.status)}
        {priorityBadge(task.priority)}
        {isOverdue && <span className="badge badge-red">⚠️ overdue</span>}
        {task.tags?.map(tag => (
          <span key={tag} className="badge badge-gray"># {tag}</span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          {task.dueDate && `📅 ${new Date(task.dueDate).toLocaleDateString()}`}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {task.status !== 'done' && (
            <button className="btn btn-sm" style={{ background: 'var(--green-bg)', color: 'var(--green)', fontSize: '12px', padding: '4px 10px' }}
              onClick={() => onStatusChange(task._id, 'done')}>
              ✓ Done
            </button>
          )}
          {task.status === 'todo' && (
            <button className="btn btn-sm" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', fontSize: '12px', padding: '4px 10px' }}
              onClick={() => onStatusChange(task._id, 'in-progress')}>
              ▶ Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1, limit: 12 });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      params.page = filters.page;
      params.limit = filters.limit;
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.data);
      setMeta(data.meta);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleCreate = async (payload) => {
    const { data } = await tasksAPI.create(payload);
    toast.success('Task created!');
    loadTasks();
    return data;
  };

  const handleUpdate = async (payload) => {
    await tasksAPI.update(modal._id, payload);
    toast.success('Task updated!');
    loadTasks();
  };

  const handleDelete = async (id) => {
    await tasksAPI.delete(id);
    toast.success('Task deleted');
    loadTasks();
  };

  const handleStatusChange = async (id, status) => {
    await tasksAPI.update(id, { status });
    toast.success(`Moved to ${status}`);
    loadTasks();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>My Tasks</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
            {meta ? `${meta.total} total task${meta.total !== 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '16px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <input className="input" placeholder="🔍 Search tasks..." style={{ flex: 1, minWidth: '200px' }}
          value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
        <select className="select" style={{ width: 'auto' }} value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={filters.priority}
          onChange={e => setFilters(p => ({ ...p, priority: e.target.value, page: 1 }))}>
          <option value="">All priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters(p => ({ ...p, status: '', priority: '', search: '', page: 1 }))}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Tasks grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ height: '160px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No tasks found</div>
          <div className="empty-state-desc">Create your first task or adjust your filters.</div>
          <button className="btn btn-primary" onClick={() => setModal('create')}>+ Create Task</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {tasks.map(task => (
            <TaskCard key={task._id} task={task}
              onEdit={setModal}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onArchive={() => {}} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" disabled={!meta.hasPrevPage}
            onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
            Page {meta.page} of {meta.totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={!meta.hasNextPage}
            onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={modal === 'create' ? handleCreate : handleUpdate}
        />
      )}
    </div>
  );
}
