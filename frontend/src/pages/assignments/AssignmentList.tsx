import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentService, type MockAssignment } from '../../services/assignments';
import { courseService } from '../../services/courses';
import { type MockCourse } from '../../services/api';
import { Clipboard, ArrowLeft, Plus, Clock, Award, Trash2 } from 'lucide-react';

export const AssignmentList: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<MockCourse | null>(null);
  const [assignments, setAssignments] = useState<MockAssignment[]>([]);

  const loadData = async () => {
    if (courseId) {
      const c = await courseService.getCourse(courseId);
      setCourse(c);
      const list = await assignmentService.getAssignments(courseId);
      setAssignments(list);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assignment?')) {
      await assignmentService.deleteAssignment(id);
      loadData();
    }
  };

  if (!course) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Course not found</h2>
        <Link to={`/${user?.role.toLowerCase()}/courses`} style={{ color: 'var(--primary)' }}>
          Back to List
        </Link>
      </div>
    );
  }

  const prefix = user?.role.toLowerCase();

  return (
    <div>
      <div style={styles.backContainer}>
        <Link to={`/${prefix}/courses/${course.id}`} style={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Course Home</span>
        </Link>
      </div>

      <div style={styles.header}>
        <div>
          <span style={styles.courseSubtitle}>{course.title}</span>
          <h1 style={styles.title}>Assignments</h1>
          <p style={{ color: 'var(--text-muted)' }}>Review assigned tasks, deadlines, and grade results.</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'FACULTY') && (
          <Link to={`/${prefix}/courses/${courseId}/assignments/new`} className="btn btn-primary">
            <Plus size={18} />
            <span>Create Assignment</span>
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="glass-panel" style={styles.empty}>
          <Clipboard size={48} color="var(--text-muted)" />
          <h3>No Assignments Published</h3>
          <p style={{ color: 'var(--text-muted)' }}>Great news! There are no assignments listed for this course yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {assignments.map((assignment) => (
            <div 
              key={assignment.id} 
              className="glass-panel hover-scale" 
              style={styles.item}
              onClick={() => navigate(`/${prefix}/courses/${courseId}/assignments/${assignment.id}`)}
            >
              <div style={styles.itemMain}>
                <div style={styles.iconWrapper}>
                  <Clipboard size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={styles.itemTitle}>{assignment.title}</h3>
                  <div style={styles.meta}>
                    <span style={styles.metaItem}>
                      <Clock size={14} />
                      <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                    </span>
                    <span style={styles.metaItem}>
                      <Award size={14} />
                      <span>{assignment.max_points} Points Max</span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.actions}>
                <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Open Details
                </button>
                {(user?.role === 'ADMIN' || user?.role === 'FACULTY') && (
                  <button 
                    onClick={(e) => handleDelete(e, assignment.id)}
                    className="btn btn-secondary"
                    style={{ padding: '8px', color: 'var(--error)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  courseSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--primary)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  item: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '16px'
  },
  itemMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px'
  },
  iconWrapper: {
    background: 'rgba(99, 102, 241, 0.12)',
    padding: '12px',
    borderRadius: '10px',
    display: 'flex'
  },
  itemTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#ffffff'
  },
  meta: {
    display: 'flex',
    gap: '16px',
    marginTop: '6px',
    color: 'var(--text-muted)',
    fontSize: '0.85rem'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }
};
