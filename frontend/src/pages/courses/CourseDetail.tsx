import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courses';
import { type MockCourse } from '../../services/api';
import { BookOpen, ArrowLeft, Plus, Video, FileText, ChevronDown } from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<MockCourse | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{ id: string; title: string; content_markdown: string; video_url?: string } | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Form states for creating modules / lessons (Faculty & Admin only)
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const [showLessonForm, setShowLessonForm] = useState<string | null>(null); // holds moduleId
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');

  const loadCourse = async () => {
    if (id) {
      const data = await courseService.getCourse(id);
      setCourse(data);

      const completed = localStorage.getItem(`aegis_completed_lessons_${id}`);
      if (completed) {
        setCompletedLessonIds(JSON.parse(completed));
      } else {
        setCompletedLessonIds([]);
      }

      // Select first lesson by default if available
      if (data && data.modules.length > 0 && data.modules[0].lessons.length > 0) {
        setSelectedLesson(data.modules[0].lessons[0]);
        setActiveModuleId(data.modules[0].id);
      }
    }
  };

  const handleMarkCompleted = async (lessonId: string) => {
    if (!course || !id) return;
    
    let updatedCompleted = [...completedLessonIds];
    if (!updatedCompleted.includes(lessonId)) {
      updatedCompleted.push(lessonId);
    } else {
      updatedCompleted = updatedCompleted.filter(lid => lid !== lessonId);
    }
    
    setCompletedLessonIds(updatedCompleted);
    localStorage.setItem(`aegis_completed_lessons_${id}`, JSON.stringify(updatedCompleted));
    
    // Calculate new progress percentage
    const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    const progress_percentage = totalLessons > 0 ? Math.round((updatedCompleted.length / totalLessons) * 100) : 0;
    
    await courseService.updateCourse(id, { progress_percentage });
    
    // Refresh course state
    const updatedCourse = await courseService.getCourse(id);
    if (updatedCourse) setCourse(updatedCourse);
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newModuleTitle.trim()) return;
    await courseService.addModule(id, newModuleTitle);
    setNewModuleTitle('');
    setShowModuleForm(false);
    loadCourse();
  };

  const handleAddLesson = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    if (!id || !newLessonTitle.trim()) return;
    await courseService.addLesson(id, moduleId, {
      title: newLessonTitle,
      content_markdown: newLessonContent
    });
    setNewLessonTitle('');
    setNewLessonContent('');
    setShowLessonForm(null);
    loadCourse();
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

  const goBackPath = user?.role === 'STUDENT' ? '/student/my-enrollments' : `/${user?.role.toLowerCase()}/courses`;

  return (
    <div>
      <div style={styles.backContainer}>
        <Link to={goBackPath} style={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Courses</span>
        </Link>
      </div>

      <div style={styles.courseHeader}>
        <h1 style={styles.title}>{course.title}</h1>
        <p style={styles.instructor}>Led by {course.instructor_name}</p>
        <p style={styles.description}>{course.description}</p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to={`/${user?.role.toLowerCase()}/courses/${course.id}/assignments`} className="btn btn-secondary">
            View Assignments
          </Link>
          <Link to={`/${user?.role.toLowerCase()}/courses/${course.id}/quizzes`} className="btn btn-secondary">
            View Quizzes
          </Link>
          {user?.role === 'STUDENT' ? (
            <>
              <Link to={`/student/courses/${course.id}/attendance`} className="btn btn-secondary">
                View Attendance
              </Link>
              <Link to={`/student/courses/${course.id}/analytics`} className="btn btn-secondary">
                View Progress
              </Link>
            </>
          ) : (
            <>
              <Link to={`/${user?.role.toLowerCase()}/courses/${course.id}/attendance`} className="btn btn-secondary">
                Record Attendance
              </Link>
              <Link to={`/${user?.role.toLowerCase()}/courses/${course.id}/analytics`} className="btn btn-secondary">
                Course Analytics
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left column: Module Syllabus accordion */}
        <div style={styles.sidebarCol}>
          <div className="glass-panel" style={styles.syllabusCard}>
            <div style={styles.syllabusHeader}>
              <h3 style={{ fontWeight: 600 }}>Syllabus / Modules</h3>
              {(user?.role === 'ADMIN' || user?.role === 'FACULTY') && (
                <button 
                  onClick={() => setShowModuleForm(!showModuleForm)} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  <Plus size={20} color="var(--primary)" />
                </button>
              )}
            </div>

            {showModuleForm && (
              <form onSubmit={handleAddModule} style={styles.inlineForm}>
                <input
                  type="text"
                  placeholder="Module Title"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  required
                />
                <div style={styles.formButtons}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Save</button>
                  <button type="button" onClick={() => setShowModuleForm(false)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                </div>
              </form>
            )}

            <div style={styles.moduleList}>
              {course.modules.map((mod) => (
                <div key={mod.id} style={styles.moduleItem}>
                  <div 
                    style={{
                      ...styles.moduleTitleRow,
                      background: activeModuleId === mod.id ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                    }}
                    onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                  >
                    <span style={{ fontWeight: 600 }}>{mod.title}</span>
                    <ChevronDown 
                      size={18} 
                      style={{ 
                        transform: activeModuleId === mod.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s' 
                      }} 
                    />
                  </div>

                  {activeModuleId === mod.id && (
                    <div style={styles.lessonList}>
                      {mod.lessons.map((les) => (
                        <div 
                          key={les.id} 
                          onClick={() => setSelectedLesson(les)}
                          style={{
                            ...styles.lessonItem,
                            color: selectedLesson?.id === les.id ? 'var(--primary)' : 'var(--text-muted)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          className="transition-all"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={16} />
                            <span>{les.title}</span>
                          </div>
                          {completedLessonIds.includes(les.id) && (
                            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>✓</span>
                          )}
                        </div>
                      ))}

                      {/* Add lesson button to modules (Faculty & Admin) */}
                      {(user?.role === 'ADMIN' || user?.role === 'FACULTY') && (
                        <div>
                          {showLessonForm === mod.id ? (
                            <form onSubmit={(e) => handleAddLesson(e, mod.id)} style={{ ...styles.inlineForm, marginTop: '10px' }}>
                              <input
                                type="text"
                                placeholder="Lesson Title"
                                value={newLessonTitle}
                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                style={{ marginBottom: '8px' }}
                                required
                              />
                              <textarea
                                placeholder="Lesson content (Markdown)..."
                                value={newLessonContent}
                                onChange={(e) => setNewLessonContent(e.target.value)}
                                style={{ height: '80px', marginBottom: '8px' }}
                              />
                              <div style={styles.formButtons}>
                                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Save</button>
                                <button type="button" onClick={() => setShowLessonForm(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <button 
                              onClick={() => setShowLessonForm(mod.id)} 
                              style={styles.addLessonBtn}
                            >
                              <Plus size={14} />
                              <span>Add Lesson</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Lesson content reader */}
        <div style={styles.mainCol}>
          {selectedLesson ? (
            <div className="glass-panel" style={styles.contentCard}>
              <h2 style={styles.contentTitle}>{selectedLesson.title}</h2>
              
              {selectedLesson.video_url && (
                <div style={styles.videoLinkContainer}>
                  <Video size={18} color="var(--primary)" />
                  <a href={selectedLesson.video_url} target="_blank" rel="noopener noreferrer" style={styles.videoLink}>
                    View Video Resource Lecture
                  </a>
                </div>
              )}

              <div style={styles.divider}></div>
              
              <div style={styles.markdownBody}>
                {selectedLesson.content_markdown || 'No content provided for this lesson.'}
              </div>

              {user?.role === 'STUDENT' && (
                <>
                  <div style={styles.divider}></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleMarkCompleted(selectedLesson.id)}
                      className={completedLessonIds.includes(selectedLesson.id) ? "btn btn-secondary" : "btn btn-primary"}
                      style={{ gap: '8px', padding: '10px 20px' }}
                    >
                      <span>{completedLessonIds.includes(selectedLesson.id) ? "✓ Lesson Completed (Click to Undo)" : "Mark Lesson as Completed"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={styles.noLessonCard}>
              <BookOpen size={48} color="var(--text-muted)" />
              <h3>Select a Lesson</h3>
              <p style={{ color: 'var(--text-muted)' }}>Choose a module and lesson from the sidebar syllabus to begin studying.</p>
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
  courseHeader: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  instructor: {
    fontSize: '0.95rem',
    color: 'var(--primary)',
    fontWeight: 600,
    marginTop: '4px'
  },
  description: {
    fontSize: '1rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginTop: '12px',
    maxWidth: '800px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '24px',
    alignItems: 'start'
  },
  sidebarCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  syllabusCard: {
    padding: '24px'
  },
  syllabusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--border)'
  },
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  moduleItem: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  moduleTitleRow: {
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  lessonList: {
    padding: '8px 16px 16px 16px',
    background: 'rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderTop: '1px solid var(--border)'
  },
  lessonItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '6px 4px'
  },
  inlineForm: {
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  formButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px'
  },
  addLessonBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '6px 4px',
    fontWeight: 500
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  contentCard: {
    padding: '40px'
  },
  contentTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  videoLinkContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--primary-light)',
    padding: '8px 16px',
    borderRadius: '8px',
    marginTop: '16px'
  },
  videoLink: {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 600
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '24px 0'
  },
  markdownBody: {
    fontSize: '1.05rem',
    lineHeight: 1.7,
    color: '#e2e8f0'
  },
  noLessonCard: {
    padding: '80px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px'
  }
};
