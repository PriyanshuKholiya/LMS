import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courses';
import { ArrowLeft, Save } from 'lucide-react';

export const CourseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      courseService.getCourse(id).then(course => {
        if (course) {
          setTitle(course.title);
          setDescription(course.description);
          setStatus(course.status);
        }
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (isEdit && id) {
        await courseService.updateCourse(id, { title, description, status });
      } else {
        await courseService.createCourse({
          title,
          description,
          status,
          instructor_id: user?.id || 'faculty-id-999',
          instructor_name: user?.name || 'Demo Faculty'
        });
      }
      const prefix = user?.role.toLowerCase();
      navigate(`/${prefix}/courses`);
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
        <Link to={`/${prefix}/courses`} style={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </Link>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>{isEdit ? 'Edit Course Details' : 'Create New Course'}</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {isEdit ? 'Modify curriculum details and syllabus.' : 'Add a new course shell to the database catalogue.'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <div className="glass-panel" style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label htmlFor="course-title" style={styles.label}>Course Title</label>
              <input
                id="course-title"
                type="text"
                placeholder="e.g. Intro to Machine Learning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="course-desc" style={styles.label}>Description</label>
              <textarea
                id="course-desc"
                placeholder="Provide a comprehensive course description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="course-status" style={styles.label}>Publishing Status</label>
              <select
                id="course-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                style={styles.select}
              >
                <option value="DRAFT">DRAFT (Hidden from Catalog)</option>
                <option value="PUBLISHED">PUBLISHED (Visible in Catalog)</option>
              </select>
            </div>

            <div style={styles.actions}>
              <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
                <Save size={18} />
                <span>Save Course</span>
              </button>
              
              <Link to={`/${prefix}/courses`} className="btn btn-secondary" style={styles.cancelBtn}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
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
    height: '120px',
    resize: 'vertical'
  },
  select: {
    cursor: 'pointer'
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
