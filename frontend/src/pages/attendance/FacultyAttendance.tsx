import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courses';
import { attendanceService, type AttendanceStatus } from '../../services/attendance';
import { type MockCourse } from '../../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  Save, 
  CheckSquare, 
  FileSpreadsheet,
  Clock
} from 'lucide-react';

export const FacultyAttendance: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  // Selected state
  const [courses, setCourses] = useState<MockCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<MockCourse | null>(null);

  // Date state
  const todayStr = new Date().toISOString().split('T')[0];
  const [recordDate, setRecordDate] = useState<string>(todayStr);

  // Student list & status map
  const [roster, setRoster] = useState<Array<{ id: string; name: string }>>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  
  // Recent log history
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load all courses for selection if global, or specific course
  const loadCourses = async () => {
    if (!user) return;
    const all = await courseService.getCourses();
    
    // Faculty sees only their courses; Admin sees all
    const filtered = user.role === 'ADMIN' 
      ? all 
      : all.filter(c => c.instructor_id === user.id);
      
    setCourses(filtered);

    if (courseId) {
      setSelectedCourseId(courseId);
    } else if (filtered.length > 0) {
      setSelectedCourseId(filtered[0].id);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [courseId, user]);

  // Handle selected course change
  useEffect(() => {
    if (selectedCourseId) {
      courseService.getCourse(selectedCourseId).then(setSelectedCourse);
      loadRosterAndAttendance(selectedCourseId, recordDate);
      loadHistory(selectedCourseId);
    } else {
      setSelectedCourse(null);
      setRoster([]);
      setHistoryDates([]);
    }
  }, [selectedCourseId]);

  // Load roster & attendance records when date changes
  const loadRosterAndAttendance = async (cId: string, dateStr: string) => {
    const students = await attendanceService.getRoster();
    setRoster(students);

    // Fetch existing attendance records for this date
    const records = await attendanceService.getAttendanceForCourse(cId, dateStr);
    
    const newStatusMap: Record<string, AttendanceStatus> = {};
    
    // Pre-populate with existing logs if found, otherwise default to 'PRESENT'
    students.forEach(student => {
      const existing = records.find(r => r.student_id === student.id);
      newStatusMap[student.id] = existing ? existing.status : 'PRESENT';
    });
    
    setStatusMap(newStatusMap);
  };

  // Load list of dates with recorded logs
  const loadHistory = async (cId: string) => {
    const allLogs = await attendanceService.getCourseLogs(cId);
    const uniqueDates = Array.from(new Set(allLogs.map(l => l.record_date)))
      .sort((a, b) => b.localeCompare(a)); // Newest dates first
    setHistoryDates(uniqueDates);
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRecordDate(val);
    if (selectedCourseId) {
      loadRosterAndAttendance(selectedCourseId, val);
    }
  };

  // Toggle individual status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatusMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Shortcut to mark everyone present
  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    roster.forEach(student => {
      updated[student.id] = 'PRESENT';
    });
    setStatusMap(updated);
  };

  // Save attendance sheet
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setLoading(true);
    setSaveSuccess(false);

    const payload = roster.map(student => ({
      student_id: student.id,
      student_name: student.name,
      status: statusMap[student.id] || 'PRESENT'
    }));

    try {
      await attendanceService.recordAttendanceBulk(selectedCourseId, recordDate, payload);
      setSaveSuccess(true);
      loadHistory(selectedCourseId);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Click history item to load that date
  const handleSelectHistoryDate = (dateStr: string) => {
    setRecordDate(dateStr);
    if (selectedCourseId) {
      loadRosterAndAttendance(selectedCourseId, dateStr);
    }
  };

  const prefix = user?.role.toLowerCase();
  const isContextual = !!courseId;

  return (
    <div style={styles.container}>
      {/* Back button (Only if inside course context) */}
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
          <span style={styles.subtitle}>Roster & Attendance Management</span>
          <h1 style={styles.title}>
            {selectedCourse ? `${selectedCourse.title} Attendance` : 'Class Attendance'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Log and review daily class presence records for enrolled students.
          </p>
        </div>
      </div>

      <div style={styles.layoutGrid}>
        {/* Main interactive panel */}
        <div style={styles.mainContent}>
          <div className="glass-panel" style={styles.card}>
            {/* Course Selector (if global view) */}
            {!isContextual && courses.length > 0 && (
              <div style={styles.fieldRow}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label htmlFor="course-selector" style={styles.label}>Select Course</label>
                  <select
                    id="course-selector"
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

            {!selectedCourseId ? (
              <div style={styles.empty}>
                <FileSpreadsheet size={48} color="var(--text-muted)" />
                <h3>No Courses Available</h3>
                <p style={{ color: 'var(--text-muted)' }}>You are not registered as an instructor for any active courses.</p>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                {/* Date & Quick Actions Row */}
                <div style={styles.toolbar}>
                  <div style={styles.datePickerWrapper}>
                    <Calendar size={18} color="var(--primary)" />
                    <input
                      type="date"
                      value={recordDate}
                      onChange={handleDateChange}
                      max={todayStr}
                      style={styles.dateInput}
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="btn btn-secondary"
                    style={styles.toolbarBtn}
                  >
                    <CheckSquare size={16} />
                    <span>Mark All Present</span>
                  </button>
                </div>

                {/* Roster Table */}
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Student Name</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map(student => {
                        const currentStatus = statusMap[student.id] || 'PRESENT';

                        return (
                          <tr key={student.id} style={styles.tableRow}>
                            <td style={styles.tdName}>{student.name}</td>
                            <td style={styles.tdActions}>
                              <div style={styles.pillsContainer}>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                  style={{
                                    ...styles.pillBtn,
                                    borderColor: currentStatus === 'PRESENT' ? '#10b981' : 'var(--border)',
                                    backgroundColor: currentStatus === 'PRESENT' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                                    color: currentStatus === 'PRESENT' ? '#10b981' : 'var(--text-muted)'
                                  }}
                                  className="transition-all"
                                >
                                  <Check size={14} />
                                  <span>Present</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                  style={{
                                    ...styles.pillBtn,
                                    borderColor: currentStatus === 'ABSENT' ? '#ef4444' : 'var(--border)',
                                    backgroundColor: currentStatus === 'ABSENT' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                                    color: currentStatus === 'ABSENT' ? '#ef4444' : 'var(--text-muted)'
                                  }}
                                  className="transition-all"
                                >
                                  <X size={14} />
                                  <span>Absent</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                                  style={{
                                    ...styles.pillBtn,
                                    borderColor: currentStatus === 'EXCUSED' ? '#f59e0b' : 'var(--border)',
                                    backgroundColor: currentStatus === 'EXCUSED' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                    color: currentStatus === 'EXCUSED' ? '#f59e0b' : 'var(--text-muted)'
                                  }}
                                  className="transition-all"
                                >
                                  <AlertCircle size={14} />
                                  <span>Excused</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Status messages & Save row */}
                <div style={styles.actionsRow}>
                  {saveSuccess && (
                    <div style={styles.successAlert}>
                      <Check size={18} />
                      <span>Roster updated successfully!</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '12px 32px', display: 'flex', gap: '8px', alignItems: 'center' }}
                    disabled={loading}
                  >
                    <Save size={18} />
                    <span>{loading ? 'Saving...' : 'Save Attendance Sheet'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar Log History */}
        {selectedCourseId && (
          <div style={styles.sidebarCol}>
            <div className="glass-panel" style={styles.historyCard}>
              <h3 style={styles.historyTitle}>
                <Clock size={16} color="var(--primary)" />
                <span>Attendance Sessions</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Select a previously logged date to view or edit its roster.
              </p>

              {historyDates.length === 0 ? (
                <div style={styles.emptyHistory}>
                  <span>No sessions logged yet.</span>
                </div>
              ) : (
                <div style={styles.historyList}>
                  {historyDates.map(dateStr => (
                    <button
                      key={dateStr}
                      onClick={() => handleSelectHistoryDate(dateStr)}
                      style={{
                        ...styles.historyItem,
                        backgroundColor: recordDate === dateStr ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        borderColor: recordDate === dateStr ? 'var(--primary)' : 'var(--border)',
                        color: recordDate === dateStr ? '#ffffff' : 'var(--text-muted)'
                      }}
                      className="transition-all"
                    >
                      <Calendar size={14} />
                      <span>{new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1100px',
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
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    alignItems: 'start'
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  card: {
    padding: '32px'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  fieldRow: {
    marginBottom: '20px'
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
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border)'
  },
  datePickerWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  },
  dateInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.95rem',
    cursor: 'pointer',
    outline: 'none'
  },
  toolbarBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem'
  },
  tableWrapper: {
    overflowX: 'auto',
    marginBottom: '24px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeaderRow: {
    borderBottom: '1px solid var(--border)'
  },
  th: {
    padding: '12px 16px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tableRow: {
    borderBottom: '1px solid var(--border)',
    height: '60px'
  },
  tdName: {
    padding: '12px 16px',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#ffffff'
  },
  tdActions: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60px'
  },
  pillsContainer: {
    display: 'flex',
    gap: '8px'
  },
  pillBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid'
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '16px'
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#10b981',
    fontSize: '0.9rem',
    fontWeight: 600
  },
  historyCard: {
    padding: '24px'
  },
  historyTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  historyItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textAlign: 'left'
  },
  emptyHistory: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    padding: '20px 0'
  }
};
