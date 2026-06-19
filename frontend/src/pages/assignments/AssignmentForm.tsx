import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentService } from '../../services/assignments';
import { ArrowLeft, Save } from 'lucide-react';

export const AssignmentForm: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxPoints, setMaxPoints] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId || !dueDate) return;

    setLoading(true);
    try {
      // Convert datetime-local picker string to ISO String format for storage
      const isoDueDate = new Date(dueDate).toISOString();
      await assignmentService.createAssignment({
        course_id: courseId,
        title,
        instructions,
        due_date: isoDueDate,
        max_points: maxPoints
      });
      const prefix = user?.role.toLowerCase();
      navigate(`/${prefix}/courses/${courseId}/assignments`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prefix = user?.role.toLowerCase();

  return (
    <div>
      <div style={styles.backContainer}>
        <Link to={`/${prefix}/courses/${courseId}/assignments`} style={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Assignments</span>
        </Link>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Publish Assignment</h1>
        <p style={{ color: 'var(--text-muted)' }}>Publish a new coursework task and set grading metrics.</p>
      </div>

      <div className="glass-panel" style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="assign-title" style={styles.label}>Assignment Title</label>
            <input
              id="assign-title"
              type="text"
              placeholder="e.g. Assignment 2: Backpropagation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="assign-instructions" style={styles.label}>Instructions</label>
            <textarea
              id="assign-instructions"
              placeholder="Add step-by-step instructions or homework problems..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              style={styles.textarea}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label htmlFor="assign-date" style={styles.label}>Due Date & Time</label>
              <input
                id="assign-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                style={{ cursor: 'pointer' }}
              />
            </div>

            <div style={{ ...styles.field, width: '150px' }}>
              <label htmlFor="assign-points" style={styles.label}>Max Points</label>
              <input
                id="assign-points"
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
              <Save size={18} />
              <span>{loading ? 'Saving...' : 'Publish Assignment'}</span>
            </button>
            
            <Link to={`/${prefix}/courses/${courseId}/assignments`} className="btn btn-secondary" style={styles.cancelBtn}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backContainer: {
    marginBottom: '20px'
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  card: {
    padding: '40px',
    maxWidth: '640px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  textarea: {
    height: '140px',
    resize: 'vertical'
  },
  row: {
    display: 'flex',
    gap: '20px'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px'
  },
  submitBtn: {
    padding: '12px 24px'
  },
  cancelBtn: {
    padding: '12px 24px',
    textDecoration: 'none'
  }
};
