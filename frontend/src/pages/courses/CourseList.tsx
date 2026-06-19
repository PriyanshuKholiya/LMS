import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courses';
import { type MockCourse } from '../../services/api';
import { BookOpen, Search, Plus, Trash2, Edit3, Compass } from 'lucide-react';

interface CourseListProps {
  catalogOnly?: boolean;
  enrolledOnly?: boolean;
}

export const CourseList: React.FC<CourseListProps> = ({ catalogOnly = false, enrolledOnly = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<MockCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCourses = async () => {
    const list = await courseService.getCourses();
    setCourses(list);
  };

  useEffect(() => {
    loadCourses();
  }, [catalogOnly, enrolledOnly]);

  const handleEnroll = async (courseId: string) => {
    await courseService.enrollInCourse(courseId);
    loadCourses();
  };

  const handleDelete = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this course?')) {
      await courseService.deleteCourse(courseId);
      loadCourses();
    }
  };

  const getPageTitle = () => {
    if (catalogOnly) return 'Course Catalog';
    if (enrolledOnly) return 'My Enrolled Courses';
    return 'Manage Courses';
  };

  const getFilteredCourses = () => {
    let result = [...courses];

    // Filter based on route parameters
    if (catalogOnly) {
      result = result.filter(c => c.status === 'PUBLISHED' && !c.enrolled);
    } else if (enrolledOnly) {
      result = result.filter(c => c.enrolled);
    } else if (user?.role === 'FACULTY') {
      // Show all, but faculty primarily manage their own
      result = result.filter(c => c.instructor_id === user.id);
    }

    // Filter based on search query
    if (searchQuery.trim() !== '') {
      result = result.filter(
        c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  };

  const filtered = getFilteredCourses();

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{getPageTitle()}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {catalogOnly ? 'Browse available curricula and enroll.' : 'Manage course modules and lessons.'}
          </p>
        </div>

        {/* Show create button to Faculty and Admins when on management pages */}
        {!catalogOnly && !enrolledOnly && (user?.role === 'ADMIN' || user?.role === 'FACULTY') && (
          <Link to={user.role === 'ADMIN' ? '/admin/courses/new' : '/faculty/courses/new'} className="btn btn-primary">
            <Plus size={18} />
            <span>Create Course</span>
          </Link>
        )}
      </div>

      <div style={styles.searchBarContainer}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="var(--text-muted)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel" style={styles.empty}>
          <Compass size={48} color="var(--text-muted)" />
          <h3>No Courses Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search query or check back later.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((course) => (
            <div 
              key={course.id} 
              className="glass-panel hover-scale" 
              style={styles.card}
              onClick={() => {
                const prefix = user?.role.toLowerCase();
                navigate(`/${prefix}/courses/${course.id}`);
              }}
            >
              <div style={styles.cardHeader}>
                <BookOpen size={20} color="var(--primary)" />
                {user?.role !== 'STUDENT' && (
                  <span style={{ 
                    ...styles.statusBadge, 
                    background: course.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: course.status === 'PUBLISHED' ? '#10b981' : '#f59e0b'
                  }}>
                    {course.status}
                  </span>
                )}
              </div>

              <h3 style={styles.courseTitle}>{course.title}</h3>
              <p style={styles.description}>{course.description}</p>
              
              <div style={styles.instructorInfo}>
                By {course.instructor_name}
              </div>

              {/* Display progress for enrolled courses */}
              {course.enrolled && user?.role === 'STUDENT' && (
                <div style={styles.progressContainer}>
                  <div style={styles.progressHeader}>
                    <span>Course Progress</span>
                    <span>{course.progress_percentage}%</span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${course.progress_percentage}%` }}></div>
                  </div>
                </div>
              )}

              <div style={styles.actions}>
                {catalogOnly && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnroll(course.id);
                    }} 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                  >
                    Enroll Now
                  </button>
                )}

                {enrolledOnly && (
                  <button className="btn btn-secondary" style={{ width: '100%' }}>
                    Resume Lessons
                  </button>
                )}

                {!catalogOnly && !enrolledOnly && (user?.role === 'ADMIN' || user?.role === 'FACULTY') && (
                  <div style={styles.managementActions}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const prefix = user.role.toLowerCase();
                        navigate(`/${prefix}/courses/${course.id}/edit`);
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '8px' }}
                    >
                      <Edit3 size={16} />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, course.id)}
                      className="btn btn-secondary"
                      style={{ padding: '8px', color: 'var(--error)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700
  },
  searchBarContainer: {
    marginBottom: '32px'
  },
  searchWrapper: {
    position: 'relative',
    maxWidth: '400px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)'
  },
  searchInput: {
    paddingLeft: '38px'
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    cursor: 'pointer'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '12px'
  },
  courseTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  description: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    flex: 1
  },
  instructorInfo: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)'
  },
  progressTrack: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    borderRadius: '3px'
  },
  actions: {
    marginTop: '8px'
  },
  managementActions: {
    display: 'flex',
    gap: '10px'
  }
};
