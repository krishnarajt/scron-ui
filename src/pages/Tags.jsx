import { useState, useEffect, useCallback } from 'react';
import { tags as tagsApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Tag, Plus, Pencil, Trash2, Loader2, X, Check, Hash } from 'lucide-react';

// Default color palette for tags
const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#78716c',
];

export default function Tags() {
  const [tagList, setTagList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchTags = useCallback(async () => {
    try {
      const data = await tagsApi.list();
      setTagList(data.tags || []);
    } catch (err) {
      console.error('Failed to load tags', err);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await tagsApi.create(newName.trim(), newColor);
      toast.success('Tag created');
      setNewName('');
      setNewColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
      setShowCreate(false);
      fetchTags();
    } catch (err) {
      toast.error(err.message || 'Failed to create tag');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (tagId) => {
    if (!editName.trim()) return;
    try {
      await tagsApi.update(tagId, { name: editName.trim(), color: editColor });
      toast.success('Tag updated');
      setEditingId(null);
      fetchTags();
    } catch (err) {
      toast.error(err.message || 'Failed to update tag');
    }
  };

  const handleDelete = async (tagId) => {
    setDeletingId(tagId);
    try {
      await tagsApi.delete(tagId);
      toast.success('Tag deleted');
      fetchTags();
    } catch (err) {
      toast.error(err.message || 'Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="gradient-text">Tags</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--txt-muted)' }}>
            Organise jobs with color-coded labels
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span>New Tag</span>
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form
              onSubmit={handleCreate}
              className="rounded-2xl p-5 space-y-4"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tag name"
                  className="input-field flex-1"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Create</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="p-2.5 rounded-xl transition-all duration-200"
                  style={{ color: 'var(--txt-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <X size={16} />
                </button>
              </div>
              {/* Color picker */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium uppercase tracking-wider mr-1"
                      style={{ color: 'var(--txt-dim)' }}>Color</span>
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center"
                    style={{
                      background: c,
                      boxShadow: newColor === c ? `0 0 0 2px var(--surface-1), 0 0 0 4px ${c}` : 'none',
                      transform: newColor === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    {newColor === c && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag list */}
      {tagList.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-2xl"
             style={{ borderColor: 'var(--border)' }}>
          <Tag size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--txt-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--txt-dim)' }}>No tags yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--txt-dim)' }}>
            Create tags to organise your jobs.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tagList.map((tag, i) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              {editingId === tag.id ? (
                /* Edit mode */
                <>
                  <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: editColor }} />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field flex-1 !py-1.5"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') setEditingId(null); }}
                  />
                  {/* Inline color picker */}
                  <div className="flex items-center gap-1">
                    {COLOR_PALETTE.slice(0, 7).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className="w-4 h-4 rounded-full transition-transform duration-200"
                        style={{
                          background: c,
                          transform: editColor === c ? 'scale(1.3)' : 'scale(1)',
                          boxShadow: editColor === c ? `0 0 0 2px var(--surface-1), 0 0 0 3px ${c}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleUpdate(tag.id)}
                    className="p-2 rounded-lg transition-all duration-200"
                    style={{ color: 'var(--accent)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-glow)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Save"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 rounded-lg transition-all duration-200"
                    style={{ color: 'var(--txt-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                /* View mode */
                <>
                  <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{tag.name}</h3>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--txt-dim)' }}>
                      {tag.job_count || 0} job{(tag.job_count || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(tag)}
                      className="p-2 rounded-lg transition-all duration-200"
                      style={{ color: 'var(--txt-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--txt)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-muted)'; }}
                      title="Edit tag"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      disabled={deletingId === tag.id}
                      className="p-2 rounded-lg transition-all duration-200"
                      style={{ color: 'var(--txt-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      title="Delete tag"
                    >
                      {deletingId === tag.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
