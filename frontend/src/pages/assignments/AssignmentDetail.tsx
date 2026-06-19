import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentService, type MockAssignment, type MockSubmission } from '../../services/assignments';
import { ArrowLeft, Clock, Award, CheckCircle, FileCode, Check, Send } from 'lucide-react';

export const AssignmentDetail: React.FC = () => {
  const { courseId, id } = useParams<{ courseId: string; id: string }>();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<MockAssignment | null>(null);
  
  // Student specific states
  const [submission, setSubmission] = useState<MockSubmission | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Faculty specific states
  const [submissionsList, setSubmissionsList] = useState<MockSubmission[]>([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [gradePoints, setGradePoints] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeSuccess, setGradeSuccess] = useState(false);

  const loadData = async () => {
    if (id) {
      const ass = await assignmentService.getAssignment(id);
      setAssignment(ass);
      
      if (ass && user) {
        if (user.role === 'STUDENT') {
          const sub = await assignmentService.getSubmissionForStudent(id, user.id);
          setSubmission(sub);
          if (sub) {
            setFileUrl(sub.file_url);
          }
        } else {
          const list = await assignmentService.getSubmissions(id);
          setSubmissionsList(list);
        }
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !fileUrl.trim()) return;

    await assignmentService.submitAssignment(id, user.id, user.name, fileUrl);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
    loadData();
  };

  const handleSelectSubmission = (sub: MockSubmission) => {
    setActiveSubmissionId(sub.id);
    setGradePoints(sub.points_awarded || 0);
    setGradeFeedback(sub.feedback_markdown || '');
  };

  const handleFacultyGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionId || !assignment) return;

    // Validation
    if (gradePoints < 0 || gradePoints > assignment.max_points) {
      alert(`Score must be between 0 and ${assignment.max_points}`);
      return;
    }

    await assignmentService.gradeSubmission(activeSubmissionId, gradePoints, gradeFeedback);
    setGradeSuccess(true);
    setTimeout(() => setGradeSuccess(false), 3000);
    setActiveSubmissionId(null);
    loadData();
  };

  if (!assignment) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Assignment not found</h2>
        <Link to={`/${user?.role.toLowerCase()}/courses/${courseId}/assignments`} style={{ color: 'var(--primary)' }}>
          Back to List
        </Link>
      </div>
    );
  }

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
        <h1 style={styles.title}>{assignment.title}</h1>
        <div style={styles.meta}>
          <span style={styles.metaItem}>
            <Clock size={16} />
            <span>Due Date: {new Date(assignment.due_date).toLocaleString()}</span>
          </span>
          <span style={styles.metaItem}>
            <Award size={16} />
            <span>Maximum Points: {assignment.max_points}</span>
          </span>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left column: Instructions */}
        <div style={styles.mainCol}>
          <div className="glass-panel" style={styles.card}>
            <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Instructions</h3>
            <p style={styles.instructions}>{assignment.instructions}</p>
          </div>
        </div>

        {/* Right column: Student submission or Faculty list */}
        <div style={styles.sidebarCol}>
          {user?.role === 'STUDENT' ? (
            /* Student View */
            <div className="glass-panel" style={styles.card}>
              <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>My Submission</h3>
              
              {submission?.points_awarded !== null && submission?.points_awarded !== undefined ? (
                /* Graded Submission state */
                <div style={styles.gradedCard}>
                  <div style={styles.scoreRow}>
                    <span style={{ fontWeight: 600 }}>Score Awarded:</span>
                    <span style={styles.scoreValue}>{submission.points_awarded} / {assignment.max_points}</span>
                  </div>
                  <div style={styles.feedbackContainer}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>INSTRUCTOR FEEDBACK:</span>
                    <p style={styles.feedbackText}>{submission.feedback_markdown || 'No comments left.'}</p>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleStudentSubmit} style={styles.submitForm}>
                <div style={styles.field}>
                  <label htmlFor="file-url" style={styles.label}>Submission File Link (Github/Drive)</label>
                  <input
                    id="file-url"
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://github.com/... or cloud link"
                    required
                    disabled={submission?.points_awarded !== null && submission?.points_awarded !== undefined}
                  />
                </div>

                {submission?.points_awarded === null || submission?.points_awarded === undefined ? (
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    {submitSuccess ? <Check size={18} /> : <Send size={16} />}
                    <span>{submitSuccess ? 'Submitted Successfully!' : submission ? 'Re-Submit Work' : 'Submit Assignment'}</span>
                  </button>
                ) : (
                  <div style={styles.lockedBadge}>
                    <CheckCircle size={16} />
                    <span>Submission Graded & Locked</span>
                  </div>
                )}
              </form>

              {submission && (
                <div style={styles.submissionMeta}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCode size={16} color="var(--primary)" />
                    <a href={submission.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                      View Submitted File
                    </a>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Uploaded: {new Date(submission.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Faculty View: Submissions Queue */
            <div className="glass-panel" style={styles.card}>
              <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Student Submissions</h3>
              
              {submissionsList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                  No submissions uploaded by students yet.
                </p>
              ) : (
                <div style={styles.submissionQueue}>
                  {submissionsList.map((sub) => (
                    <div 
                      key={sub.id} 
                      style={{
                        ...styles.subItem,
                        borderColor: activeSubmissionId === sub.id ? 'var(--primary)' : 'var(--border)'
                      }}
                      onClick={() => handleSelectSubmission(sub)}
                      className="transition-all"
                    >
                      <div style={styles.subItemHeader}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.student_name}</span>
                        {sub.points_awarded !== null ? (
                          <span style={styles.gradedBadge}>{sub.points_awarded} pts</span>
                        ) : (
                          <span style={styles.pendingBadge}>Ungraded</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Submitted: {new Date(sub.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Faculty Inline Grading Form */}
              {activeSubmissionId && (
                <form onSubmit={handleFacultyGradeSubmit} style={styles.gradeForm}>
                  <div style={styles.divider}></div>
                  <h4 style={{ fontWeight: 600, marginBottom: '14px' }}>Grading Assessment</h4>
                  
                  <div style={styles.field}>
                    <label htmlFor="grade-score" style={styles.label}>Points Awarded (Max {assignment.max_points})</label>
                    <input
                      id="grade-score"
                      type="number"
                      value={gradePoints}
                      onChange={(e) => setGradePoints(Number(e.target.value))}
                      min={0}
                      max={assignment.max_points}
                      required
                    />
                  </div>

                  <div style={styles.field}>
                    <label htmlFor="grade-feedback" style={styles.label}>Feedback / Comments</label>
                    <textarea
                      id="grade-feedback"
                      placeholder="Add feedback for the student..."
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      style={styles.textarea}
                    />
                  </div>

                  <div style={styles.gradeActions}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {gradeSuccess ? <Check size={18} /> : 'Save Grade'}
                    </button>
                    <button type="button" onClick={() => setActiveSubmissionId(null)} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
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
  meta: {
    display: 'flex',
    gap: '24px',
    marginTop: '10px',
    color: 'var(--text-muted)',
    fontSize: '0.9rem'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '3fr 2fr',
    gap: '24px',
    alignItems: 'start'
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  card: {
    padding: '32px'
  },
  instructions: {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: '#cbd5e1',
    whiteSpace: 'pre-wrap'
  },
  sidebarCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  submitForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '10px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase'
  },
  submissionMeta: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  lockedBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'rgba(16, 185, 129, 0.08)',
    color: '#10b981',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    border: '1px solid rgba(16, 185, 129, 0.2)'
  },
  gradedCard: {
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    marginBottom: '10px'
  },
  scoreValue: {
    fontWeight: 700,
    color: 'var(--primary)',
    fontSize: '1.05rem'
  },
  feedbackContainer: {
    borderTop: '1px solid var(--border)',
    paddingTop: '10px'
  },
  feedbackText: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    marginTop: '4px',
    lineHeight: 1.4,
    fontStyle: 'italic'
  },
  submissionQueue: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  subItem: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.01)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  subItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  gradedBadge: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#10b981',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '20px'
  },
  pendingBadge: {
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '20px'
  },
  gradeForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '20px'
  },
  textarea: {
    height: '100px',
    resize: 'vertical'
  },
  gradeActions: {
    display: 'flex',
    gap: '10px'
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '10px 0'
  }
};
