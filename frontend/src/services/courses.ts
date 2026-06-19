import { getMockCoursesState, saveMockCoursesState, type MockCourse } from './api';

export const courseService = {
  async getCourses(): Promise<MockCourse[]> {
    return getMockCoursesState();
  },

  async getCourse(id: string): Promise<MockCourse | null> {
    const courses = getMockCoursesState();
    return courses.find(c => c.id === id) || null;
  },

  async createCourse(courseData: Partial<MockCourse> & { title: string }): Promise<MockCourse> {
    const courses = getMockCoursesState();
    const newCourse: MockCourse = {
      id: `course-${Math.random().toString(36).substring(2, 9)}`,
      title: courseData.title,
      description: courseData.description || '',
      instructor_id: courseData.instructor_id || 'faculty-id-999',
      instructor_name: courseData.instructor_name || 'Demo Faculty',
      status: courseData.status || 'DRAFT',
      enrolled: false,
      progress_percentage: 0,
      modules: []
    };
    courses.push(newCourse);
    saveMockCoursesState(courses);
    return newCourse;
  },

  async updateCourse(id: string, updateData: Partial<MockCourse>): Promise<MockCourse> {
    const courses = getMockCoursesState();
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Course not found');
    
    const updated = { ...courses[index], ...updateData };
    courses[index] = updated;
    saveMockCoursesState(courses);
    return updated;
  },

  async deleteCourse(id: string): Promise<boolean> {
    const courses = getMockCoursesState();
    const filtered = courses.filter(c => c.id !== id);
    saveMockCoursesState(filtered);
    return true;
  },

  async enrollInCourse(id: string): Promise<MockCourse> {
    const courses = getMockCoursesState();
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Course not found');

    courses[index].enrolled = true;
    courses[index].progress_percentage = 0;
    saveMockCoursesState(courses);
    return courses[index];
  },

  // Sub-resource modifiers
  async addModule(courseId: string, title: string): Promise<MockCourse> {
    const courses = getMockCoursesState();
    const index = courses.findIndex(c => c.id === courseId);
    if (index === -1) throw new Error('Course not found');

    const course = courses[index];
    const newModule = {
      id: `module-${Math.random().toString(36).substring(2, 9)}`,
      title,
      sort_order: course.modules.length + 1,
      lessons: []
    };
    course.modules.push(newModule);
    saveMockCoursesState(courses);
    return course;
  },

  async addLesson(
    courseId: string, 
    moduleId: string, 
    lessonData: { title: string; content_markdown: string }
  ): Promise<MockCourse> {
    const courses = getMockCoursesState();
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) throw new Error('Course not found');

    const course = courses[courseIndex];
    const moduleIndex = course.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) throw new Error('Module not found');

    const newLesson = {
      id: `lesson-${Math.random().toString(36).substring(2, 9)}`,
      title: lessonData.title,
      content_markdown: lessonData.content_markdown,
      sort_order: course.modules[moduleIndex].lessons.length + 1
    };

    course.modules[moduleIndex].lessons.push(newLesson);
    saveMockCoursesState(courses);
    return course;
  }
};
