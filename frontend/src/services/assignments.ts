export interface MockAssignment {
  id: string;
  course_id: string;
  title: string;
  instructions: string;
  due_date: string;
  max_points: number;
}

export interface MockSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  file_url: string;
  feedback_markdown: string | null;
  points_awarded: number | null;
  submitted_at: string;
}

const defaultAssignments: MockAssignment[] = [
  {
    id: 'assignment-dl-1',
    course_id: 'course-dl-101',
    title: 'Assignment 1: Neural Networks from Scratch',
    instructions: 'Implement a simple 2-layer perceptron in raw Python/NumPy. Do not use PyTorch. Write backpropagation equations and train on MNIST.',
    due_date: '2026-06-25T23:59:59Z',
    max_points: 100
  },
  {
    id: 'assignment-dl-2',
    course_id: 'course-dl-101',
    title: 'Assignment 2: CNN Architectures',
    instructions: 'Build a Convolutional Neural Network (CNN) in PyTorch to classify the CIFAR-10 dataset. Try adding dropout and batch normalization.',
    due_date: '2026-07-02T23:59:59Z',
    max_points: 100
  },
  {
    id: 'assignment-db-1',
    course_id: 'course-db-202',
    title: 'Assignment 1: Database Normalization',
    instructions: 'Normalize the given flat database schema into 1NF, 2NF, and 3NF. Draw dependencies and submit SQL DDL tables.',
    due_date: '2026-06-28T23:59:59Z',
    max_points: 50
  }
];

const defaultSubmissions: MockSubmission[] = [
  {
    id: 'submission-dl-1-alex',
    assignment_id: 'assignment-dl-1',
    student_id: 'student-id-123',
    student_name: 'Alex Mercer',
    file_url: 'https://github.com/alexmercer/dl-scratch/blob/main/nn.py',
    feedback_markdown: 'Excellent implementation of backprop matrix multiplication! Clean notebook formatting.',
    points_awarded: 98,
    submitted_at: '2026-06-18T14:32:00Z'
  }
];

// Initialize localStorage
if (!localStorage.getItem('aegis_mock_assignments')) {
  localStorage.setItem('aegis_mock_assignments', JSON.stringify(defaultAssignments));
}
if (!localStorage.getItem('aegis_mock_submissions')) {
  localStorage.setItem('aegis_mock_submissions', JSON.stringify(defaultSubmissions));
}

const getAssignmentsState = (): MockAssignment[] => {
  return JSON.parse(localStorage.getItem('aegis_mock_assignments') || '[]');
};

const saveAssignmentsState = (state: MockAssignment[]) => {
  localStorage.setItem('aegis_mock_assignments', JSON.stringify(state));
};

const getSubmissionsState = (): MockSubmission[] => {
  return JSON.parse(localStorage.getItem('aegis_mock_submissions') || '[]');
};

const saveSubmissionsState = (state: MockSubmission[]) => {
  localStorage.setItem('aegis_mock_submissions', JSON.stringify(state));
};

export const assignmentService = {
  async getAssignments(courseId: string): Promise<MockAssignment[]> {
    const list = getAssignmentsState();
    return list.filter(a => a.course_id === courseId);
  },

  async getAssignment(id: string): Promise<MockAssignment | null> {
    const list = getAssignmentsState();
    return list.find(a => a.id === id) || null;
  },

  async createAssignment(assignmentData: Partial<MockAssignment> & { title: string; course_id: string; due_date: string }): Promise<MockAssignment> {
    const list = getAssignmentsState();
    const newAssignment: MockAssignment = {
      id: `assignment-${Math.random().toString(36).substring(2, 9)}`,
      course_id: assignmentData.course_id,
      title: assignmentData.title,
      instructions: assignmentData.instructions || '',
      due_date: assignmentData.due_date,
      max_points: assignmentData.max_points || 100
    };
    list.push(newAssignment);
    saveAssignmentsState(list);
    return newAssignment;
  },

  async updateAssignment(id: string, updateData: Partial<MockAssignment>): Promise<MockAssignment> {
    const list = getAssignmentsState();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Assignment not found');
    const updated = { ...list[idx], ...updateData };
    list[idx] = updated;
    saveAssignmentsState(list);
    return updated;
  },

  async deleteAssignment(id: string): Promise<boolean> {
    const list = getAssignmentsState();
    const filtered = list.filter(a => a.id !== id);
    saveAssignmentsState(filtered);
    return true;
  },

  async getSubmissions(assignmentId: string): Promise<MockSubmission[]> {
    const list = getSubmissionsState();
    return list.filter(s => s.assignment_id === assignmentId);
  },

  async getSubmissionForStudent(assignmentId: string, studentId: string): Promise<MockSubmission | null> {
    const list = getSubmissionsState();
    return list.find(s => s.assignment_id === assignmentId && s.student_id === studentId) || null;
  },

  async submitAssignment(assignmentId: string, studentId: string, studentName: string, fileUrl: string): Promise<MockSubmission> {
    const list = getSubmissionsState();
    const idx = list.findIndex(s => s.assignment_id === assignmentId && s.student_id === studentId);
    
    if (idx !== -1) {
      // Update existing submission file URL
      list[idx].file_url = fileUrl;
      list[idx].submitted_at = new Date().toISOString();
      saveSubmissionsState(list);
      return list[idx];
    } else {
      // Create new submission
      const newSubmission: MockSubmission = {
        id: `submission-${Math.random().toString(36).substring(2, 9)}`,
        assignment_id: assignmentId,
        student_id: studentId,
        student_name: studentName,
        file_url: fileUrl,
        feedback_markdown: null,
        points_awarded: null,
        submitted_at: new Date().toISOString()
      };
      list.push(newSubmission);
      saveSubmissionsState(list);
      return newSubmission;
    }
  },

  async gradeSubmission(submissionId: string, points: number, feedback: string): Promise<MockSubmission> {
    const list = getSubmissionsState();
    const idx = list.findIndex(s => s.id === submissionId);
    if (idx === -1) throw new Error('Submission not found');
    
    list[idx].points_awarded = points;
    list[idx].feedback_markdown = feedback;
    saveSubmissionsState(list);
    return list[idx];
  }
};
