import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courses';
import { analyticsService, type CourseAnalyticsResponse } from '../../services/analytics';
import { type MockCourse } from '../../services/api';
import { 
  ArrowLeft, 
  Users, 
  BarChart3, 
  Award, 
  BookOpen, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const FacultyAnalytics: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  // Courses and selections
  const [courses, setCourses] = useState<MockCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<MockCourse | null>(null);

  // Stats State
  const [stats, setStats] = useState<CourseAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    if (!user) return;
    const all = await courseService.getCourses();
    
    // Filter courses taught by this faculty member
    const filtered = user.role === 'ADMIN' 
      ? all 
      : all.filter(c => c.instructor_id === user.id);
      
    setCourses(filtered);

    if (courseId) {
      setSelectedCourseId(courseId);
    } else if (filtered.length > 0) {
      setSelectedCourseId(filtered[0].id);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [courseId, user]);

  // Load analytics when course changes
  useEffect(() => {
    if (selectedCourseId) {
      setLoading(true);
      Promise.all([
        courseService.getCourse(selectedCourseId),
        analyticsService.getCourseAnalytics(selectedCourseId)
      ])
        .then(([c, s]) => {
          setSelectedCourse(c);
          setStats(s);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setSelectedCourse(null);
      setStats(null);
    }
  }, [selectedCourseId]);

  const prefix = user?.role.toLowerCase();
  const isContextual = !!courseId;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading Course Analytics...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back button (Only if contextual) */}
      {isContextual && selectedCourse && (
        <div style={styles.backContainer}>
          <Link to={`/${prefix}/courses/${selectedCourse.id}`} style={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to Course Home</span>
          </Link>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.subtitle}>Curriculum Metrics Dashboard</span>
          <h1 style={styles.title}>
            {selectedCourse ? `${selectedCourse.title} Analytics` : 'Course Metrics'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Examine class performance averages, grading trends, and curriculum engagement stats.
          </p>
        </div>
      </div>

      {/* Course dropdown selector (Global route only) */}
      {!isContextual && courses.length > 0 && (
        <div className="glass-panel" style={styles.selectCard}>
          <div style={styles.field}>
            <label htmlFor="course-select" style={styles.label}>Toggle Selected Course</label>
            <select
              id="course-select"
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

      {!selectedCourseId || !stats ? (
        <div className="glass-panel" style={styles.empty}>
          <AlertCircle size={48} color="var(--text-muted)" />
          <h3>No Course Selected</h3>
          <p style={{ color: 'var(--text-muted)' }}>Select an active course from the menu to inspect aggregated engagement.</p>
        </div>
      ) : (
        <div>
          {/* Metrics Tiles Grid */}
          <div style={styles.statsGrid}>
            <div className="glass-panel" style={styles.statCard}>
              <div style={styles.statIconWrapper}>
                <Users size={20} color="var(--primary)" />
              </div>
              <div>
                <span style={styles.statLabel}>Class Size</span>
                <div style={styles.statValue}>{stats.total_enrolled} Enrolled</div>
              </div>
            </div>

            <div className="glass-panel" style={styles.statCard}>
              <div style={styles.statIconWrapper}>
                <BookOpen size={20} color="#10b981" />
              </div>
              <div>
                <span style={styles.statLabel}>Avg Progress</span>
                <div style={styles.statValue}>{stats.average_progress}% Completed</div>
              </div>
            </div>

            <div className="glass-panel" style={styles.statCard}>
              <div style={styles.statIconWrapper}>
                <FileSpreadsheet size={20} color="#f59e0b" />
              </div>
              <div>
                <span style={styles.statLabel}>Attendance Rate</span>
                <div style={{ ...styles.statValue, color: stats.attendance_rate < 75 ? '#ef4444' : '#f59e0b' }}>
                  {stats.attendance_rate}% Logged
                </div>
              </div>
            </div>

            <div className="glass-panel" style={styles.statCard}>
              <div style={styles.statIconWrapper}>
                <Award size={20} color="#ef4444" />
              </div>
              <div>
                <span style={styles.statLabel}>Average Grade</span>
                <div style={styles.statValue}>
                  {Math.round((stats.average_quiz_score + stats.average_assignment_score) / 2)}% Pass
                </div>
              </div>
            </div>
          </div>

          {/* Visual Performance Charts */}
          <div style={styles.contentGrid}>
            {/* Left Col: Aggregated Component Averages */}
            <div className="glass-panel" style={styles.chartCard}>
              <h3 style={styles.cardTitle}>
                <BarChart3 size={18} color="var(--primary)" />
                <span>Class Average Breakdown</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Performance ratings normalized to 100% across assignments, exams, and attendance.
              </p>

              <div style={styles.chartBarList}>
                {/* 1. Quiz Average */}
                <div style={styles.chartBarRow}>
                  <div style={styles.chartBarHeader}>
                    <span style={styles.chartBarLabel}>Examination Quizzes</span>
                    <span style={styles.chartBarVal}>{stats.average_quiz_score}% Average</span>
                  </div>
                  <div style={styles.chartBarBg}>
                    <div style={{ ...styles.chartBarFill, width: `${stats.average_quiz_score}%`, backgroundColor: '#10b981' }} />
                  </div>
                </div>

                {/* 2. Assignment Average */}
                <div style={styles.chartBarRow}>
                  <div style={styles.chartBarHeader}>
                    <span style={styles.chartBarLabel}>Course Assignments</span>
                    <span style={styles.chartBarVal}>{stats.average_assignment_score}% Average</span>
                  </div>
                  <div style={styles.chartBarBg}>
                    <div style={{ ...styles.chartBarFill, width: `${stats.average_assignment_score}%`, backgroundColor: 'var(--primary)' }} />
                  </div>
                </div>

                {/* 3. Attendance Average */}
                <div style={styles.chartBarRow}>
                  <div style={styles.chartBarHeader}>
                    <span style={styles.chartBarLabel}>Class Presence/Attendance</span>
                    <span style={styles.chartBarVal}>{stats.attendance_rate}% Rate</span>
                  </div>
                  <div style={styles.chartBarBg}>
                    <div style={{ ...styles.chartBarFill, width: `${stats.attendance_rate}%`, backgroundColor: '#f59e0b' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Index Alert and Action triggers */}
            <div className="glass-panel" style={styles.chartCard}>
              <h3 style={styles.cardTitle}>
                <AlertCircle size={18} color="var(--primary)" />
                <span>Curriculum Insights</span>
              </h3>

              <div style={styles.insightsList}>
                <div style={styles.insightBox}>
                  <h5 style={{ fontWeight: 600, color: '#f1f5f9' }}>Participation Alert</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {stats.attendance_rate < 80 
                      ? 'Roster attendance has slipped below target. We recommend sending bulk announcements.' 
                      : 'Attendance rate is strong and consistent with target outcomes.'}
                  </p>
                </div>

                <div style={styles.insightBox}>
                  <h5 style={{ fontWeight: 600, color: '#f1f5f9' }}>Exam Outcomes</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Quiz evaluations indicate an average score of {stats.average_quiz_score}%. Ensure lesson syllabus details are clear for complex topics.
                  </p>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <Link 
                    to={`/${prefix}/courses/${selectedCourseId}`} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', display: 'block', textAlign: 'center', padding: '10px' }}
                  >
                    Go to Course Syllabus Editor
                  </Link>
                </div>
              </div>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '28px'
  },
  statCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  statIconWrapper: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  statValue: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#ffffff',
    marginTop: '2px'
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px'
  },
  chartCard: {
    padding: '28px'
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  chartBarList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  chartBarRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  chartBarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chartBarLabel: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#e2e8f0'
  },
  chartBarVal: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)'
  },
  chartBarBg: {
    height: '10px',
    borderRadius: '5px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    overflow: 'hidden'
  },
  chartBarFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.4s ease'
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px'
  },
  insightBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '16px'
  }
};
