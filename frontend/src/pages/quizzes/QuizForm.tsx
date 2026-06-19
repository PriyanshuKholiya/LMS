import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quizService } from '../../services/quizzes';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';

interface FormOption {
  option_text: string;
  is_correct: boolean;
}

interface FormQuestion {
  question_text: string;
  points: number;
  options: FormOption[];
}

export const QuizForm: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [passingScore, setPassingScore] = useState<number>(60);
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      question_text: '',
      points: 10,
      options: [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question_text: '',
        points: 10,
        options: [
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (qIdx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== qIdx));
  };

  const handleQuestionTextChange = (qIdx: number, val: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].question_text = val;
      return copy;
    });
  };

  const handleQuestionPointsChange = (qIdx: number, val: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].points = val;
      return copy;
    });
  };

  const handleAddOption = (qIdx: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].options.push({ option_text: '', is_correct: false });
      return copy;
    });
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].options = copy[qIdx].options.filter((_, i) => i !== optIdx);
      return copy;
    });
  };

  const handleOptionTextChange = (qIdx: number, optIdx: number, val: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].options[optIdx].option_text = val;
      return copy;
    });
  };

  const handleOptionCorrectChange = (qIdx: number, optIdx: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      // Set all options of this question to false, except selected one (MCQ single answer)
      copy[qIdx].options.forEach((opt, idx) => {
        opt.is_correct = idx === optIdx;
      });
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId) return;

    // Validations: Ensure each question has a title and at least one option marked correct
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        alert(`Question ${i + 1} text cannot be empty.`);
        return;
      }
      const hasCorrect = q.options.some(opt => opt.is_correct);
      if (!hasCorrect) {
        alert(`Please mark at least one correct answer choice for Question ${i + 1}.`);
        return;
      }
      const hasEmptyOption = q.options.some(opt => !opt.option_text.trim());
      if (hasEmptyOption) {
        alert(`Answer choices in Question ${i + 1} cannot be left empty.`);
        return;
      }
    }

    setLoading(true);
    try {
      await quizService.createQuiz({
        course_id: courseId,
        title,
        duration_minutes: duration,
        passing_score: passingScore,
        questions
      });
      const prefix = user?.role.toLowerCase();
      navigate(`/${prefix}/courses/${courseId}/quizzes`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prefix = user?.role.toLowerCase();

  return (
    <div>
      <div style={styles.backContainer}>
        <Link to={`/${prefix}/courses/${courseId}/quizzes`} style={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Publish Quiz</h1>
        <p style={{ color: 'var(--text-muted)' }}>Construct a timed examination sheet with Multiple Choice Questions.</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.formContainer}>
        {/* Core Quiz Details Card */}
        <div className="glass-panel" style={styles.card}>
          <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>1. Exam Configurations</h3>
          
          <div style={styles.formSection}>
            <div style={styles.field}>
              <label htmlFor="quiz-title" style={styles.label}>Quiz Title</label>
              <input
                id="quiz-title"
                type="text"
                placeholder="e.g. Quiz 2: Gradient Descent Fundamentals"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label htmlFor="quiz-duration" style={styles.label}>Duration (Minutes)</label>
                <input
                  id="quiz-duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>

              <div style={{ ...styles.field, flex: 1 }}>
                <label htmlFor="quiz-passing" style={styles.label}>Passing Score (Points)</label>
                <input
                  id="quiz-passing"
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions Builder Section */}
        <div style={styles.questionsHeaderRow}>
          <h3 style={{ fontWeight: 700, color: '#ffffff' }}>2. Questions Builder</h3>
          <button 
            type="button" 
            onClick={handleAddQuestion} 
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Add Question</span>
          </button>
        </div>

        <div style={styles.questionList}>
          {questions.map((question, qIdx) => (
            <div key={qIdx} className="glass-panel" style={styles.questionCard}>
              <div style={styles.qCardHeader}>
                <h4 style={{ fontWeight: 600, color: 'var(--primary)' }}>Question #{qIdx + 1}</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>POINTS:</span>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => handleQuestionPointsChange(qIdx, Number(e.target.value))}
                      style={{ width: '70px', padding: '6px' }}
                      min={1}
                      required
                    />
                  </div>
                  {questions.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveQuestion(qIdx)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div style={styles.field}>
                <textarea
                  placeholder="Enter the question text..."
                  value={question.question_text}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  style={{ height: '70px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={styles.optionsHeader}>
                  <span style={styles.label}>Answer Choices</span>
                  <button 
                    type="button" 
                    onClick={() => handleAddOption(qIdx)} 
                    style={styles.addOptionBtn}
                  >
                    <Plus size={14} /> Add Choice
                  </button>
                </div>

                <div style={styles.optionsList}>
                  {question.options.map((opt, optIdx) => (
                    <div key={optIdx} style={styles.optionRow}>
                      <input
                        type="radio"
                        name={`q-${qIdx}-correct`}
                        checked={opt.is_correct}
                        onChange={() => handleOptionCorrectChange(qIdx, optIdx)}
                        style={{ cursor: 'pointer' }}
                        title="Mark as Correct Answer"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${optIdx + 1}`}
                        value={opt.option_text}
                        onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                        style={{ flex: 1, padding: '8px 12px' }}
                        required
                      />
                      {question.options.length > 2 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveOption(qIdx, optIdx)}
                          style={styles.removeOptBtn}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.actions}>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }} disabled={loading}>
            <Save size={18} />
            <span>{loading ? 'Saving...' : 'Publish Examination'}</span>
          </button>
          
          <Link to={`/${prefix}/courses/${courseId}/quizzes`} className="btn btn-secondary" style={{ padding: '12px 24px' }}>
            Cancel
          </Link>
        </div>
      </form>
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
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '720px'
  },
  card: {
    padding: '32px'
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
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
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  row: {
    display: 'flex',
    gap: '20px'
  },
  questionsHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px'
  },
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  questionCard: {
    padding: '24px 32px'
  },
  qCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--error)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex'
  },
  optionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  addOptionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 600
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  removeOptBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    paddingBottom: '40px'
  }
};
