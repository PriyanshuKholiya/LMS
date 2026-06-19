// Shared mock database state to ensure frontend interactions (Create, Edit, Enroll) 
// have immediate, visual consequences in the interface without requiring a database setup.
export interface MockCourse {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  instructor_name: string;
  status: 'DRAFT' | 'PUBLISHED';
  enrolled: boolean;
  progress_percentage: number;
  modules: Array<{
    id: string;
    title: string;
    sort_order: number;
    lessons: Array<{
      id: string;
      title: string;
      content_markdown: string;
      video_url?: string;
      sort_order: number;
    }>;
  }>;
}

const defaultMockCourses: MockCourse[] = [
  {
    id: 'course-dl-101',
    title: 'Intro to Deep Learning',
    description: 'Learn the fundamentals of artificial neural networks, backpropagation, CNNs, and sequence processing using PyTorch.',
    instructor_id: 'faculty-id-999',
    instructor_name: 'Dr. Sarah Connor',
    status: 'PUBLISHED',
    enrolled: true,
    progress_percentage: 45,
    modules: [
      {
        id: 'module-1',
        title: 'Neural Networks foundations',
        sort_order: 1,
        lessons: [
          { id: 'lesson-1-1', title: 'Perceptrons and Linear Classifiers', content_markdown: 'A perceptron is a single-layer neural network used for binary classification. It computes a weighted sum of inputs and applies a step function.', sort_order: 1 },
          { id: 'lesson-1-2', title: 'Activation Functions: ReLU, Sigmoid, Tanh', content_markdown: 'Activation functions introduce non-linearities, allowing networks to learn complex decision boundaries.', sort_order: 2 }
        ]
      },
      {
        id: 'module-2',
        title: 'Gradient Descent & Backprop',
        sort_order: 2,
        lessons: [
          { id: 'lesson-2-1', title: 'Understanding Loss Functions', content_markdown: 'Loss functions measure the difference between prediction and actual targets. Mean Squared Error (MSE) and Cross-Entropy are standard examples.', sort_order: 1 },
          { id: 'lesson-2-2', title: 'The Chain Rule and Error Propagation', content_markdown: 'Backpropagation uses the calculus chain rule to calculate derivatives of loss with respect to weights, working backward from output layers.', sort_order: 2 }
        ]
      }
    ]
  },
  {
    id: 'course-db-202',
    title: 'Database Systems',
    description: 'Relational algebra, SQL, database normalization, indexing mechanisms, and transaction integrity levels.',
    instructor_id: 'faculty-id-other',
    instructor_name: 'Prof. Marcus Vance',
    status: 'PUBLISHED',
    enrolled: false,
    progress_percentage: 0,
    modules: [
      {
        id: 'module-db-1',
        title: 'Relational Algebra & Normalization',
        sort_order: 1,
        lessons: [
          { id: 'lesson-db-1-1', title: 'Entity-Relationship Diagrams', content_markdown: 'ERDs visualize schema relations before database creation.', sort_order: 1 },
          { id: 'lesson-db-1-2', title: 'First, Second, and Third Normal Forms', content_markdown: 'Normalization reduces redundancy and dependency by organizing fields into appropriate relations.', sort_order: 2 }
        ]
      }
    ]
  },
  {
    id: 'course-wd-303',
    title: 'Advanced Web Architecture',
    description: 'Learn modern monorepo pipelines, serverless deployment, caching strategies, and state synchronization models.',
    instructor_id: 'faculty-id-999',
    instructor_name: 'Demo Faculty',
    status: 'DRAFT',
    enrolled: false,
    progress_percentage: 0,
    modules: []
  }
];

// Load mock state from localStorage to preserve edits during route switching
if (!localStorage.getItem('aegis_mock_courses')) {
  localStorage.setItem('aegis_mock_courses', JSON.stringify(defaultMockCourses));
}

export const getMockCoursesState = (): MockCourse[] => {
  return JSON.parse(localStorage.getItem('aegis_mock_courses') || '[]');
};

export const saveMockCoursesState = (state: MockCourse[]) => {
  localStorage.setItem('aegis_mock_courses', JSON.stringify(state));
};
