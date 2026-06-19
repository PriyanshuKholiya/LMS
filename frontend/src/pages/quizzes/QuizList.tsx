import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quizService, type MockQuiz, type MockQuizAttempt } from '../../services/quizzes';
import { courseService } from '../../services/courses';
import { type MockCourse } from '../../services/api';
import { ClipboardCheck, ArrowLeft, Plus, Clock, Award, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';

export const QuizList: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<MockCourse | null>(null);
  const [quizzes, setQuizzes] = useState<MockQuiz[]>([]);
  
  // Student attempts history (keyed by quizId)
  const [studentAttempts, setStudentAttempts] = useState<Record<string, MockQuizAttempt[]>>({});
  
  // Faculty attempts history (keyed by quizId)
  const [facultyAttempts, setFacultyAttempts] = useState<Record<string, MockQuizAttempt[]>>({});
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

  const loadData = async () => {
    if (courseId && user) {
      const c = await courseService.getCourse(courseId);
      setCourse(c);
      
      const list = await quizService.getQuizzes(courseId);
      setQuizzes(list);
      
      if (user.role === 'STUDENT') {
        const attemptsMap: Record<string, MockQuizAttempt[]> = {};
        for (const q of list) {
          const attempts = await quizService.getAttemptsForStudent(user.id, q.id);
          attemptsMap[q.id] = attempts;
        }
        setStudentAttempts(attemptsMap);
      } else {
        const attemptsMap: Record<string, MockQuizAttempt[]> = {};
        for (const q of list) {
          const attempts = await quizService.getAttemptsForQuiz(q.id);
          attemptsMap[q.id] = attempts;
        }
        setFacultyAttempts(attemptsMap);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId, user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this quiz?')) {
      await quizService.deleteQuiz(id);
      loadData();
    }
  };

  const handleStartAttempt = async (quizId: string) => {
    if (!user) return;
    // Create actual attempt entry and navigate
    const attempt = await quizService.createQuizAttempt(quizId, user.id, user.name);
    const prefix = user.role.toLowerCase();
    navigate(`/${prefix}/courses/${courseId}/quizzes/${quizId}/attempt?attempt_id=${attempt.id}`);
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
          <h1 style={styles.title}>Timed Quizzes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Complete class examinations and review academic score results.</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'FACULTY') && (
          <Link to={`/${prefix}/courses/${courseId}/quizzes/new`} className="btn btn-primary">
            <Plus size={18} />
            <span>Create Quiz</span>
          </Link>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div className="glass-panel" style={styles.empty}>
          <ClipboardCheck size={48} color="var(--text-muted)" />
          <h3>No Quizzes Published</h3>
          <p style={{ color: 'var(--text-muted)' }}>There are no timed examinations listed for this course yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {quizzes.map((quiz) => {
            const sAtts = studentAttempts[quiz.id] || [];
            const fAtts = facultyAttempts[quiz.id] || [];
            const isExpanded = expandedQuizId === quiz.id;

            return (
              <div key={quiz.id} className="glass-panel" style={styles.itemContainer}>
                <div style={styles.itemHeader}>
                  <div style={styles.itemHeaderLeft}>
                    <div style={styles.iconWrapper}>
                      <ClipboardCheck size={22} color="var(--primary)" />
                    </div>
                    <div>
                      <h3 style={styles.itemTitle}>{quiz.title}</h3>
                      <div style={styles.meta}>
                        <span style={styles.metaItem}>
                          <Clock size={14} />
                          <span>Duration: {quiz.duration_minutes} mins</span>
                        </span>
                        <span style={styles.metaItem}>
                          <Award size={14} />
                          <span>Passing score: {quiz.passing_score} pts</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.itemHeaderRight}>
                    {user?.role === 'STUDENT' ? (
                      <button 
                        onClick={() => handleStartAttempt(quiz.id)} 
                        className="btn btn-primary"
                        style={{ fontSize: '0.85rem' }}
                      >
                        {sAtts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setExpandedQuizId(isExpanded ? null : quiz.id)}
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        >
                          <Eye size={16} />
                          <span>{isExpanded ? 'Hide Attempts' : `Attempts (${fAtts.length})`}</span>
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, quiz.id)}
                          className="btn btn-secondary"
                          style={{ padding: '8px', color: 'var(--error)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student View: List personal attempts */}
                {user?.role === 'STUDENT' && sAtts.length > 0 && (
                  <div style={styles.attemptsSection}>
                    <h4 style={styles.sectionTitle}>My Past Attempts</h4>
                    <div style={styles.attemptsGrid}>
                      {sAtts.map((att) => (
                        <div key={att.id} style={styles.attemptCard}>
                          <div style={styles.attemptCardHeader}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(att.completed_at).toLocaleDateString()}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {att.passed ? (
                                <span style={{ ...styles.badge, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                                  <CheckCircle size={12} />
                                  <span>Passed</span>
                                </span>
                              ) : (
                                <span style={{ ...styles.badge, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                                  <XCircle size={12} />
                                  <span>Failed</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={styles.attemptScore}>{att.score_obtained} pts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Faculty View: Expand attempt list */}
                {user?.role !== 'STUDENT' && isExpanded && (
                  <div style={styles.attemptsSection}>
                    <h4 style={styles.sectionTitle}>Student Attempts History</h4>
                    {fAtts.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px 0' }}>
                        No students have attempted this quiz yet.
                      </p>
                    ) : (
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.tableRow}>
                            <th style={styles.th}>Student Name</th>
                            <th style={styles.th}>Score Obtained</th>
                            <th style={styles.th}>Result Status</th>
                            <th style={styles.th}>Date Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fAtts.map((att) => (
                            <tr key={att.id} style={styles.tr}>
                              <td style={styles.td}>{att.student_name}</td>
                              <td style={{ ...styles.td, fontWeight: 700 }}>{att.score_obtained} pts</td>
                              <td style={styles.td}>
                                {att.passed ? (
                                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                    <CheckCircle size={14} /> Passed
                                  </span>
                                ) : (
                                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                    <XCircle size={14} /> Failed
                                  </span>
                                )}
                              </td>
                              <td style={styles.td}>{new Date(att.completed_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
    gap: '20px'
  },
  itemContainer: {
    padding: '24px'
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px'
  },
  itemHeaderLeft: {
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
  itemHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  attemptsSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border)'
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '14px'
  },
  attemptsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '12px'
  },
  attemptCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  attemptCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  attemptScore: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '0.7rem',
    fontWeight: 600
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    textAlign: 'left'
  },
  tableRow: {
    borderBottom: '1px solid var(--border)'
  },
  th: {
    padding: '10px 12px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 600
  },
  tr: {
    borderBottom: '1px solid var(--border)'
  },
  td: {
    padding: '12px',
    fontSize: '0.9rem',
    color: '#e2e8f0'
  }
};
