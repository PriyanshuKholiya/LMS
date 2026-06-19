import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courses';
import { attendanceService, type MockAttendanceRecord } from '../../services/attendance';
import { type MockCourse } from '../../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileSpreadsheet,
  TrendingUp
} from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<MockCourse | null>(null);
  const [records, setRecords] = useState<MockAttendanceRecord[]>([]);
  const [stats, setStats] = useState<{
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    totalCount: number;
    attendanceRate: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!courseId || !user) return;
    
    try {
      const c = await courseService.getCourse(courseId);
      setCourse(c);

      const summary = await attendanceService.getStudentAttendanceSummary(courseId, user.id);
      setRecords(summary.records);
      setStats({
        presentCount: summary.presentCount,
        absentCount: summary.absentCount,
        excusedCount: summary.excusedCount,
        totalCount: summary.totalCount,
        attendanceRate: summary.attendanceRate
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId, user]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading Attendance Records...</h2>
      </div>
    );
  }

  if (!course || !stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Course not found</h2>
        <Link to="/student/my-enrollments" style={{ color: 'var(--primary)' }}>
          Back to My Learning
        </Link>
      </div>
    );
  }

  // Determine progress bar and text color based on rate threshold
  const rateColor = stats.attendanceRate >= 85 
    ? '#10b981' // Green
    : stats.attendanceRate >= 75 
      ? '#f59e0b' // Orange/Yellow
      : '#ef4444'; // Red

  const getStatusText = () => {
    if (stats.attendanceRate >= 85) return 'Excellent standing. Keep up the consistent attendance!';
    if (stats.attendanceRate >= 75) return 'Satisfactory. You are meeting the minimum platform requirements.';
    return 'Warning: Your attendance has fallen below the 75% critical threshold.';
  };

  return (
    <div style={styles.container}>
      {/* Back button */}
      <div style={styles.backContainer}>
        <Link to={`/student/courses/${course.id}`} style={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Course Home</span>
        </Link>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.courseSubtitle}>{course.title}</span>
          <h1 style={styles.title}>My Attendance History</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track your class presence, view attendance rates, and examine calendar logs.
          </p>
        </div>
      </div>

      {stats.totalCount === 0 ? (
        <div className="glass-panel" style={styles.empty}>
          <FileSpreadsheet size={48} color="var(--text-muted)" />
          <h3>No Records Logged</h3>
          <p style={{ color: 'var(--text-muted)' }}>There are no attendance sessions logged for you in this course yet.</p>
        </div>
      ) : (
        <div style={styles.dashboardGrid}>
          {/* Left Side: Stats and Gauge */}
          <div style={styles.leftCol}>
            <div className="glass-panel" style={styles.gaugeCard}>
              <h3 style={styles.cardTitle}>
                <TrendingUp size={16} color="var(--primary)" />
                <span>Attendance Rate</span>
              </h3>
              
              <div style={styles.gaugeContainer}>
                {/* Circular indicator container */}
                <div style={{ ...styles.gaugeRing, borderColor: rateColor }}>
                  <span style={{ ...styles.gaugeValue, color: rateColor }}>{stats.attendanceRate}%</span>
                  <span style={styles.gaugeLabel}>Attended</span>
                </div>
              </div>

              <div style={styles.statusDescription}>
                <span style={{ color: rateColor, fontWeight: 700 }}>Status Summary:</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {getStatusText()}
                </p>
              </div>
            </div>

            <div style={styles.statsCards}>
              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <CheckCircle size={20} color="#10b981" />
                </div>
                <div>
                  <span style={styles.statLabel}>Present</span>
                  <div style={{ ...styles.statNumber, color: '#10b981' }}>{stats.presentCount}</div>
                </div>
              </div>

              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <XCircle size={20} color="#ef4444" />
                </div>
                <div>
                  <span style={styles.statLabel}>Absent</span>
                  <div style={{ ...styles.statNumber, color: '#ef4444' }}>{stats.absentCount}</div>
                </div>
              </div>

              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <AlertCircle size={20} color="#f59e0b" />
                </div>
                <div>
                  <span style={styles.statLabel}>Excused</span>
                  <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{stats.excusedCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Timeline Logs */}
          <div style={styles.rightCol}>
            <div className="glass-panel" style={styles.timelineCard}>
              <h3 style={styles.cardTitle}>
                <Calendar size={16} color="var(--primary)" />
                <span>Chronological Logs</span>
              </h3>

              <div style={styles.timelineList}>
                {records.map(record => {
                  const dateObj = new Date(record.record_date + 'T00:00:00');
                  const dayOfWeek = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                  const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                  // Color config for pills
                  let pillBorder = 'var(--border)';
                  let pillBg = 'transparent';
                  let pillText = 'var(--text-muted)';
                  let IconComponent = AlertCircle;

                  if (record.status === 'PRESENT') {
                    pillBorder = '#10b981';
                    pillBg = 'rgba(16, 185, 129, 0.08)';
                    pillText = '#10b981';
                    IconComponent = CheckCircle;
                  } else if (record.status === 'ABSENT') {
                    pillBorder = '#ef4444';
                    pillBg = 'rgba(239, 68, 68, 0.08)';
                    pillText = '#ef4444';
                    IconComponent = XCircle;
                  } else if (record.status === 'EXCUSED') {
                    pillBorder = '#f59e0b';
                    pillBg = 'rgba(245, 158, 11, 0.08)';
                    pillText = '#f59e0b';
                    IconComponent = AlertCircle;
                  }

                  return (
                    <div key={record.id} style={styles.timelineItem}>
                      <div style={styles.timelineDotLine}>
                        <div style={{ ...styles.timelineDot, backgroundColor: pillBorder }} />
                        <div style={styles.timelineLine} />
                      </div>
                      
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineHeader}>
                          <span style={styles.timelineDate}>{dateStr}</span>
                          <span style={styles.timelineDay}>{dayOfWeek}</span>
                        </div>

                        <span 
                          style={{
                            ...styles.statusBadge,
                            borderColor: pillBorder,
                            backgroundColor: pillBg,
                            color: pillText
                          }}
                        >
                          <IconComponent size={12} />
                          <span>{record.status}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
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
  courseSubtitle: {
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
  empty: {
    padding: '60px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '24px',
    alignItems: 'start'
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  gaugeCard: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  cardTitle: {
    width: '100%',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  gaugeContainer: {
    margin: '16px 0',
    display: 'flex',
    justifyContent: 'center'
  },
  gaugeRing: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    borderWidth: '8px',
    borderStyle: 'solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2)'
  },
  gaugeValue: {
    fontSize: '2.5rem',
    fontWeight: 800
  },
  gaugeLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.5px'
  },
  statusDescription: {
    textAlign: 'center',
    borderTop: '1px solid var(--border)',
    paddingTop: '16px',
    width: '100%',
    marginTop: '10px'
  },
  statsCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  statCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  statIconWrapper: {
    alignSelf: 'flex-start',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid var(--border)'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  statNumber: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginTop: '2px'
  },
  timelineCard: {
    padding: '28px'
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '16px',
    paddingLeft: '10px'
  },
  timelineItem: {
    display: 'flex',
    position: 'relative',
    paddingBottom: '24px'
  },
  timelineDotLine: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '16px',
    marginRight: '16px'
  },
  timelineDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    zIndex: 1,
    marginTop: '6px',
    boxShadow: '0 0 0 4px rgba(0, 0, 0, 0.3)'
  },
  timelineLine: {
    width: '2px',
    position: 'absolute',
    top: '12px',
    bottom: '-12px',
    backgroundColor: 'var(--border)',
    left: '7px'
  },
  timelineContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '-4px'
  },
  timelineHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  timelineDate: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#ffffff'
  },
  timelineDay: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 700,
    border: '1px solid'
  }
};
// Add a rule to remove line at the very end
styles.timelineList = {
  ...styles.timelineList
};
