import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courses';
import { analyticsService, type StudentCourseAnalyticsResponse } from '../../services/analytics';
import { type MockCourse } from '../../services/api';
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  Award, 
  CheckCircle, 
  XCircle, 
  FileText,
  AlertCircle
} from 'lucide-react';

export const StudentAnalytics: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  // Enrolled courses list
  const [courses, setCourses] = useState<MockCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<MockCourse | null>(null);

  // Student analytics details
  const [analytics, setAnalytics] = useState<StudentCourseAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    if (!user) return;
    const all = await courseService.getCourses();
    const enrolled = all.filter(c => c.enrolled);
    setCourses(enrolled);

    if (courseId) {
      setSelectedCourseId(courseId);
    } else if (enrolled.length > 0) {
      setSelectedCourseId(enrolled[0].id);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [courseId, user]);

  useEffect(() => {
    if (selectedCourseId && user) {
      setLoading(true);
      Promise.all([
        courseService.getCourse(selectedCourseId),
        analyticsService.getStudentCourseAnalytics(selectedCourseId, user.id)
      ])
        .then(([c, a]) => {
          setSelectedCourse(c);
          setAnalytics(a);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setSelectedCourse(null);
      setAnalytics(null);
    }
  }, [selectedCourseId, user]);

  const isContextual = !!courseId;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading Academic Progress...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back Button (Contextual only) */}
      {isContextual && selectedCourse && (
        <div style={styles.backContainer}>
          <Link to={`/student/courses/${selectedCourse.id}`} style={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to Course Home</span>
          </Link>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.subtitle}>Academic Progress Tracker</span>
          <h1 style={styles.title}>
            {selectedCourse ? `${selectedCourse.title} Progress` : 'My Academic Progress'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Examine your syllabus completion rates, active attendance records, and graded coursework.
          </p>
        </div>
      </div>

      {/* Dropdown (Global view only) */}
      {!isContextual && courses.length > 0 && (
        <div className="glass-panel" style={styles.selectCard}>
          <div style={styles.field}>
            <label htmlFor="student-course-select" style={styles.label}>Toggle Selected Course</label>
            <select
              id="student-course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={styles.select}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!selectedCourseId || !analytics ? (
        <div className="glass-panel" style={styles.empty}>
          <AlertCircle size={48} color="var(--text-muted)" />
          <h3>No Enrolled Courses</h3>
          <p style={{ color: 'var(--text-muted)' }}>You are not enrolled in any courses. Browse the course catalog to enroll.</p>
        </div>
      ) : (
        <div>
          {/* Summary Cards */}
          <div style={styles.summaryGrid}>
            <div className="glass-panel" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <BookOpen size={18} color="var(--primary)" />
                <span style={styles.cardTitle}>Syllabus Completion</span>
              </div>
              <div style={styles.metricVal}>{analytics.progress}%</div>
              <div style={styles.barBg}>
                <div style={{ ...styles.barFill, width: `${analytics.progress}%`, backgroundColor: 'var(--primary)' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modules completed</span>
            </div>

            <div className="glass-panel" style={styles.summaryCard}>
              <div style={styles.cardHeader}>
                <Calendar size={18} color="#f59e0b" />
                <span style={styles.cardTitle}>Attendance Status</span>
              </div>
              <div style={{ ...styles.metricVal, color: analytics.attendance_rate < 75 ? '#ef4444' : '#f59e0b' }}>
                {analytics.attendance_rate}%
              </div>
              <div style={styles.barBg}>
                <div 
                  style={{ 
                    ...styles.barFill, 
                    width: `${analytics.attendance_rate}%`, 
                    backgroundColor: analytics.attendance_rate < 75 ? '#ef4444' : '#f59e0b' 
                  }} 
                />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily presence rate</span>
            </div>
          </div>

          {/* Graded Components */}
          <div style={styles.sectionsGrid}>
            {/* Quizzes Record */}
            <div className="glass-panel" style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>
                <Award size={18} color="var(--primary)" />
                <span>Examination Quizzes</span>
              </h3>

              {analytics.quiz_grades.length === 0 ? (
                <p style={styles.emptyTableText}>No completed quizzes recorded.</p>
              ) : (
                <div style={styles.list}>
                  {analytics.quiz_grades.map(quiz => (
                    <div key={quiz.quiz_id} style={styles.recordItem}>
                      <div>
                        <h4 style={styles.recordTitle}>{quiz.quiz_title}</h4>
                        <span style={styles.recordSub}>
                          Completed on: {new Date(quiz.completed_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div style={styles.recordResults}>
                        <span style={styles.recordScore}>
                          {quiz.score_obtained} / {quiz.total_points} pts
                        </span>
                        {quiz.passed ? (
                          <span style={{ ...styles.badge, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                            <CheckCircle size={12} /> Passed
                          </span>
                        ) : (
                          <span style={{ ...styles.badge, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                            <XCircle size={12} /> Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignments Record */}
            <div className="glass-panel" style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>
                <FileText size={18} color="var(--primary)" />
                <span>Course Assignments</span>
              </h3>

              {analytics.assignment_grades.length === 0 ? (
                <p style={styles.emptyTableText}>No assignments published yet.</p>
              ) : (
                <div style={styles.list}>
                  {analytics.assignment_grades.map(ass => (
                    <div key={ass.assignment_id} style={styles.assignmentItem}>
                      <div style={styles.assignmentHeader}>
                        <div>
                          <h4 style={styles.recordTitle}>{ass.assignment_title}</h4>
                          <span style={styles.recordSub}>
                            {ass.submitted_at 
                              ? `Submitted: ${new Date(ass.submitted_at).toLocaleDateString()}` 
                              : 'Not Submitted'}
                          </span>
                        </div>

                        <div>
                          {ass.points_awarded !== null ? (
                            <span style={styles.gradedScore}>
                              {ass.points_awarded} / {ass.max_points} pts
                            </span>
                          ) : (
                            <span style={styles.ungradedScore}>Ungraded</span>
                          )}
                        </div>
                      </div>

                      {ass.feedback_markdown && (
                        <div style={styles.feedbackBox}>
                          <span style={styles.feedbackTitle}>Feedback:</span>
                          <p style={styles.feedbackText}>"{ass.feedback_markdown}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '16px 0'
  },
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
    marginBottom: '28px'
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--primary)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  selectCard: {
    padding: '20px',
    marginBottom: '24px'
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
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    color: '#ffffff',
    fontSize: '0.95rem'
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '28px'
  },
  summaryCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  cardTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  metricVal: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#ffffff'
  },
  barBg: {
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: '4px'
  },
  sectionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '24px',
    alignItems: 'start'
  },
  sectionCard: {
    padding: '28px'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px'
  },
  emptyTableText: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    textAlign: 'center',
    padding: '20px 0'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  recordItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border)',
    borderRadius: '8px'
  },
  recordTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f8fafc'
  },
  recordSub: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)'
  },
  recordResults: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px'
  },
  recordScore: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.7rem',
    fontWeight: 600
  },
  assignmentItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border)',
    borderRadius: '8px'
  },
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  gradedScore: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#10b981'
  },
  ungradedScore: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-muted)'
  },
  feedbackBox: {
    borderTop: '1px dashed var(--border)',
    paddingTop: '10px',
    marginTop: '4px'
  },
  feedbackTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--primary)',
    textTransform: 'uppercase'
  },
  feedbackText: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    fontStyle: 'italic',
    marginTop: '2px'
  }
};
