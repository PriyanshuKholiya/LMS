import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quizService, type MockQuiz, type MockQuizAttempt } from '../../services/quizzes';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const QuizAttemptPage: React.FC = () => {
  const { courseId, id } = useParams<{ courseId: string; id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt_id');

  const [quiz, setQuiz] = useState<MockQuiz | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({}); // keyed by questionId, value is optionId
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Results states
  const [attemptResult, setAttemptResult] = useState<MockQuizAttempt | null>(null);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<number | null>(null);

  const loadQuiz = async () => {
    if (id) {
      const q = await quizService.getQuiz(id);
      setQuiz(q);
      if (q) {
        setSecondsLeft(q.duration_minutes * 60);
      }
    }
  };

  useEffect(() => {
    loadQuiz();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Countdown timer hook
  useEffect(() => {
    if (secondsLeft !== null && secondsLeft > 0 && !showResults) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timerRef.current!);
            // Auto-submit when timer hits zero
            handleForceSubmit();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft, showResults]);

  const handleOptionChange = (questionId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleForceSubmit = async () => {
    if (!attemptId) return;
    
    // Format selected answers
    const answersPayload = Object.entries(selectedOptions).map(([qId, optId]) => ({
      question_id: qId,
      selected_option_id: optId
    }));

    try {
      const result = await quizService.submitQuizAnswers(attemptId, answersPayload);
      setAttemptResult(result);
      setShowResults(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to submit your answers?')) {
      handleForceSubmit();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!quiz || !attemptId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Invalid attempt session</h2>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">Go Back</button>
      </div>
    );
  }

  const prefix = user?.role.toLowerCase();

  return (
    <div style={styles.container}>
      {/* 1. Results Presentation Page */}
      {showResults && attemptResult ? (
        <div className="glass-panel" style={styles.resultsCard}>
          {attemptResult.passed ? (
            <div style={styles.resultHeader}>
              <CheckCircle size={60} color="#10b981" />
              <h2 style={{ color: '#10b981', fontWeight: 700 }}>Congratulations! You Passed</h2>
            </div>
          ) : (
            <div style={styles.resultHeader}>
              <XCircle size={60} color="#ef4444" />
              <h2 style={{ color: '#ef4444', fontWeight: 700 }}>Passed score not met</h2>
            </div>
          )}

          <div style={styles.resultsGrid}>
            <div style={styles.resultStat}>
              <span style={styles.statLabel}>Score Obtained</span>
              <span style={styles.statValue}>{attemptResult.score_obtained} pts</span>
            </div>
            
            <div style={styles.resultStat}>
              <span style={styles.statLabel}>Passing Threshold</span>
              <span style={styles.statValue}>{quiz.passing_score} pts</span>
            </div>
          </div>

          <button 
            onClick={() => navigate(`/${prefix}/courses/${courseId}/quizzes`)} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            Return to Quizzes Catalog
          </button>
        </div>
      ) : (
        /* 2. Active Test-taking Sheet */
        <form onSubmit={handleSubmit} style={styles.formContainer}>
          <div style={styles.formHeader}>
            <div>
              <span style={styles.subLabel}>{quiz.title}</span>
              <h2 style={styles.title}>Examination Sheet</h2>
            </div>

            {secondsLeft !== null && (
              <div 
                style={{
                  ...styles.timerBox,
                  borderColor: secondsLeft < 60 ? '#ef4444' : 'var(--primary)',
                  background: secondsLeft < 60 ? 'rgba(239, 68, 68, 0.08)' : 'var(--primary-light)'
                }}
              >
                <Clock size={18} color={secondsLeft < 60 ? '#ef4444' : 'var(--primary)'} />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>
                  {formatTime(secondsLeft)}
                </span>
              </div>
            )}
          </div>

          {secondsLeft !== null && secondsLeft < 60 && (
            <div style={styles.warningAlert}>
              <AlertCircle size={18} />
              <span>Warning: Under 1 minute remaining. Work will auto-submit when the timer expires.</span>
            </div>
          )}

          {/* Quick Jump Pagination Header */}
          <div style={styles.paginationDots}>
            {quiz.questions.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentQuestionIndex(idx)}
                style={{
                  ...styles.pageDot,
                  background: currentQuestionIndex === idx 
                    ? 'var(--primary)' 
                    : selectedOptions[quiz.questions[idx].id] 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : 'rgba(255, 255, 255, 0.03)',
                  color: currentQuestionIndex === idx ? '#000000' : 'var(--text-muted)',
                  border: currentQuestionIndex === idx ? 'none' : '1px solid var(--border)'
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div style={styles.questionList}>
            {(() => {
              const question = quiz.questions[currentQuestionIndex];
              return (
                <div className="glass-panel" style={styles.questionCard}>
                  <div style={styles.questionTitleRow}>
                    <span style={styles.questionIndex}>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                    <span style={styles.questionPoints}>{question.points} pts</span>
                  </div>
                  <p style={styles.questionText}>{question.question_text}</p>
                  
                  <div style={styles.optionsList}>
                    {question.options.map((opt) => (
                      <label 
                        key={opt.id} 
                        style={{
                          ...styles.optionLabel,
                          borderColor: selectedOptions[question.id] === opt.id ? 'var(--primary)' : 'var(--border)',
                          background: selectedOptions[question.id] === opt.id ? 'var(--primary-light)' : 'transparent'
                        }}
                        className="transition-all"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={opt.id}
                          checked={selectedOptions[question.id] === opt.id}
                          onChange={() => handleOptionChange(question.id, opt.id)}
                          style={styles.radioInput}
                        />
                        <span>{opt.option_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Navigation Buttons Row */}
          <div style={styles.navigationRow}>
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="btn btn-secondary"
              style={{ ...styles.navBtn, opacity: currentQuestionIndex === 0 ? 0.5 : 1 }}
            >
              Previous Question
            </button>

            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                className="btn btn-primary"
                style={styles.navBtn}
              >
                Next Question
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={styles.navBtn}>
                Finalize & Submit Answers
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '16px 0'
  },
  resultsCard: {
    padding: '40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '30px'
  },
  resultHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    width: '100%',
    margin: '10px 0'
  },
  resultStat: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  statValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  subLabel: {
    fontSize: '0.85rem',
    color: 'var(--primary)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  timerBox: {
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  warningAlert: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.9rem',
    fontWeight: 600
  },
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  questionCard: {
    padding: '32px'
  },
  questionTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px'
  },
  questionIndex: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--primary)',
    textTransform: 'uppercase'
  },
  questionPoints: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '4px 8px',
    borderRadius: '6px'
  },
  questionText: {
    fontSize: '1.1rem',
    fontWeight: 500,
    color: '#f8fafc',
    marginBottom: '20px'
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  optionLabel: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '14px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.95rem'
  },
  radioInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  submitRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  paginationDots: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  },
  pageDot: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    border: 'none',
    outline: 'none'
  },
  navigationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px'
  },
  navBtn: {
    padding: '10px 24px',
    fontSize: '0.9rem',
    fontWeight: 600
  }
};
