export interface MockOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
}

export interface MockQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  type: 'MCQ' | 'TEXT';
  points: number;
  options: MockOption[];
}

export interface MockQuiz {
  id: string;
  course_id: string;
  title: string;
  duration_minutes: number;
  passing_score: number;
  questions: MockQuestion[];
}

export interface MockQuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  student_name: string;
  score_obtained: number;
  passed: boolean;
  completed_at: string;
}

const defaultQuizzes: MockQuiz[] = [
  {
    id: 'quiz-dl-1',
    course_id: 'course-dl-101',
    title: 'Quiz 1: Deep Learning Foundations',
    duration_minutes: 15,
    passing_score: 15,
    questions: [
      {
        id: 'q-dl-1-1',
        quiz_id: 'quiz-dl-1',
        question_text: 'Which activation function outputs values in the range [-1, 1]?',
        type: 'MCQ',
        points: 10,
        options: [
          { id: 'opt-dl-1-1a', question_id: 'q-dl-1-1', option_text: 'ReLU', is_correct: false },
          { id: 'opt-dl-1-1b', question_id: 'q-dl-1-1', option_text: 'Sigmoid', is_correct: false },
          { id: 'opt-dl-1-1c', question_id: 'q-dl-1-1', option_text: 'Tanh', is_correct: true },
          { id: 'opt-dl-1-1d', question_id: 'q-dl-1-1', option_text: 'Linear', is_correct: false }
        ]
      },
      {
        id: 'q-dl-1-2',
        quiz_id: 'quiz-dl-1',
        question_text: 'What algorithm is primarily used to compute gradients in a neural network?',
        type: 'MCQ',
        points: 10,
        options: [
          { id: 'opt-dl-1-2a', question_id: 'q-dl-1-2', option_text: 'Forward Propagation', is_correct: false },
          { id: 'opt-dl-1-2b', question_id: 'q-dl-1-2', option_text: 'Backpropagation', is_correct: true },
          { id: 'opt-dl-1-2c', question_id: 'q-dl-1-2', option_text: 'Principal Component Analysis', is_correct: false },
          { id: 'opt-dl-1-2d', question_id: 'q-dl-1-2', option_text: 'K-Means Clustering', is_correct: false }
        ]
      }
    ]
  },
  {
    id: 'quiz-db-1',
    course_id: 'course-db-202',
    title: 'Quiz 1: Relational Model Principles',
    duration_minutes: 10,
    passing_score: 10,
    questions: [
      {
        id: 'q-db-1-1',
        quiz_id: 'quiz-db-1',
        question_text: 'Which normal form requires the database to have no multi-valued attributes and be in 1NF?',
        type: 'MCQ',
        points: 10,
        options: [
          { id: 'opt-db-1-1a', question_id: 'q-db-1-1', option_text: '2NF', is_correct: true },
          { id: 'opt-db-1-1b', question_id: 'q-db-1-1', option_text: '3NF', is_correct: false },
          { id: 'opt-db-1-1c', question_id: 'q-db-1-1', option_text: 'BCNF', is_correct: false }
        ]
      }
    ]
  }
];

const defaultAttempts: MockQuizAttempt[] = [
  {
    id: 'attempt-dl-1-alex',
    quiz_id: 'quiz-dl-1',
    student_id: 'student-id-123',
    student_name: 'Alex Mercer',
    score_obtained: 20,
    passed: true,
    completed_at: '2026-06-18T16:45:00Z'
  }
];

// Initialize localStorage
if (!localStorage.getItem('aegis_mock_quizzes')) {
  localStorage.setItem('aegis_mock_quizzes', JSON.stringify(defaultQuizzes));
}
if (!localStorage.getItem('aegis_mock_quiz_attempts')) {
  localStorage.setItem('aegis_mock_quiz_attempts', JSON.stringify(defaultAttempts));
}

const getQuizzesState = (): MockQuiz[] => {
  return JSON.parse(localStorage.getItem('aegis_mock_quizzes') || '[]');
};

const saveQuizzesState = (state: MockQuiz[]) => {
  localStorage.setItem('aegis_mock_quizzes', JSON.stringify(state));
};

const getAttemptsState = (): MockQuizAttempt[] => {
  return JSON.parse(localStorage.getItem('aegis_mock_quiz_attempts') || '[]');
};

const saveAttemptsState = (state: MockQuizAttempt[]) => {
  localStorage.setItem('aegis_mock_quiz_attempts', JSON.stringify(state));
};

export const quizService = {
  async getQuizzes(courseId: string): Promise<MockQuiz[]> {
    const list = getQuizzesState();
    return list.filter(q => q.course_id === courseId);
  },

  async getQuiz(id: string): Promise<MockQuiz | null> {
    const list = getQuizzesState();
    return list.find(q => q.id === id) || null;
  },

  async createQuiz(quizData: {
    course_id: string;
    title: string;
    duration_minutes: number;
    passing_score: number;
    questions: {
      question_text: string;
      points: number;
      options: { option_text: string; is_correct: boolean }[];
    }[];
  }): Promise<MockQuiz> {
    const list = getQuizzesState();
    const quizId = `quiz-${Math.random().toString(36).substring(2, 9)}`;

    const questions: MockQuestion[] = quizData.questions.map((q, qIdx) => {
      const questionId = `q-${quizId}-${qIdx}`;
      return {
        id: questionId,
        quiz_id: quizId,
        question_text: q.question_text,
        type: 'MCQ',
        points: q.points,
        options: q.options.map((o, oIdx) => ({
          id: `opt-${questionId}-${oIdx}`,
          question_id: questionId,
          option_text: o.option_text,
          is_correct: o.is_correct
        }))
      };
    });

    const newQuiz: MockQuiz = {
      id: quizId,
      course_id: quizData.course_id,
      title: quizData.title,
      duration_minutes: quizData.duration_minutes,
      passing_score: quizData.passing_score,
      questions
    };

    list.push(newQuiz);
    saveQuizzesState(list);
    return newQuiz;
  },

  async deleteQuiz(id: string): Promise<boolean> {
    const list = getQuizzesState();
    const filtered = list.filter(q => q.id !== id);
    saveQuizzesState(filtered);
    return true;
  },

  async createQuizAttempt(quizId: string, studentId: string, studentName: string): Promise<MockQuizAttempt> {
    const attempts = getAttemptsState();
    const newAttempt: MockQuizAttempt = {
      id: `attempt-${Math.random().toString(36).substring(2, 9)}`,
      quiz_id: quizId,
      student_id: studentId,
      student_name: studentName,
      score_obtained: 0,
      passed: false,
      completed_at: '' // indicates in-progress
    };
    attempts.push(newAttempt);
    saveAttemptsState(attempts);
    return newAttempt;
  },

  async submitQuizAnswers(
    attemptId: string, 
    answers: { question_id: string; selected_option_id: string }[]
  ): Promise<MockQuizAttempt> {
    const attempts = getAttemptsState();
    const attemptIdx = attempts.findIndex(a => a.id === attemptId);
    if (attemptIdx === -1) throw new Error('Attempt not found');
    
    const quiz = await this.getQuiz(attempts[attemptIdx].quiz_id);
    if (!quiz) throw new Error('Quiz not found');

    let totalScore = 0;
    const answersMap = new Map(answers.map(a => [a.question_id, a.selected_option_id]));

    for (const question of quiz.questions) {
      const selectedOptId = answersMap.get(question.id);
      if (selectedOptId) {
        const correctOpt = question.options.find(o => o.is_correct);
        if (correctOpt && correctOpt.id === selectedOptId) {
          totalScore += question.points;
        }
      }
    }

    attempts[attemptIdx].score_obtained = totalScore;
    attempts[attemptIdx].passed = totalScore >= quiz.passing_score;
    attempts[attemptIdx].completed_at = new Date().toISOString();

    saveAttemptsState(attempts);
    return attempts[attemptIdx];
  },

  async getAttemptsForStudent(studentId: string, quizId: string): Promise<MockQuizAttempt[]> {
    const attempts = getAttemptsState();
    return attempts.filter(a => a.student_id === studentId && a.quiz_id === quizId && a.completed_at !== '');
  },

  async getAttemptsForQuiz(quizId: string): Promise<MockQuizAttempt[]> {
    const attempts = getAttemptsState();
    return attempts.filter(a => a.quiz_id === quizId && a.completed_at !== '');
  }
};
