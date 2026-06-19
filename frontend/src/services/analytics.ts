import { courseService } from './courses';
import { quizService } from './quizzes';
import { assignmentService } from './assignments';
import { attendanceService } from './attendance';

export interface AdminOverviewResponse {
  total_students: number;
  total_faculty: number;
  total_courses: number;
  total_enrollments: number;
  average_course_progress: number;
}

export interface CourseAnalyticsResponse {
  total_enrolled: number;
  average_progress: number;
  average_quiz_score: number;
  average_assignment_score: number;
  attendance_rate: number;
}

export interface StudentQuizGrade {
  quiz_id: string;
  quiz_title: string;
  score_obtained: number;
  total_points: number;
  passed: boolean;
  completed_at: string;
}

export interface StudentAssignmentGrade {
  assignment_id: string;
  assignment_title: string;
  points_awarded: number | null;
  max_points: number;
  submitted_at: string | null;
  feedback_markdown: string | null;
}

export interface StudentCourseAnalyticsResponse {
  progress: number;
  attendance_rate: number;
  quiz_grades: StudentQuizGrade[];
  assignment_grades: StudentAssignmentGrade[];
}

export const analyticsService = {
  // Retrieve platform-wide metrics (Admin only)
  async getAdminOverview(): Promise<AdminOverviewResponse> {
    const courses = await courseService.getCourses();
    const enrolledCourses = courses.filter(c => c.enrolled);
    
    // Calculate average progress across enrolled courses
    const progressSum = enrolledCourses.reduce((sum, c) => sum + c.progress_percentage, 0);
    const avgProgress = enrolledCourses.length > 0 ? Math.round(progressSum / enrolledCourses.length) : 0;

    return {
      total_students: 148,
      total_faculty: 12,
      total_courses: courses.length,
      total_enrollments: enrolledCourses.length + 84, // mock base + active enrollments
      average_course_progress: avgProgress || 55 // fallback if no active enrollments
    };
  },

  // Retrieve course aggregated metrics (Faculty / Admin only)
  async getCourseAnalytics(courseId: string): Promise<CourseAnalyticsResponse> {
    const course = await courseService.getCourse(courseId);
    if (!course) throw new Error('Course not found');

    // Load attendance logs to calculate rate
    const logs = await attendanceService.getCourseLogs(courseId);
    let attendanceRate = 85; // baseline fallback
    if (logs.length > 0) {
      const presentOrExcused = logs.filter(l => l.status === 'PRESENT' || l.status === 'EXCUSED').length;
      attendanceRate = Math.round((presentOrExcused / logs.length) * 100);
    }

    // Load quizzes & attempts to compute average quiz score
    const quizzes = await quizService.getQuizzes(courseId);
    let quizScoreSum = 0;
    let quizAttemptsCount = 0;
    for (const q of quizzes) {
      const attempts = await quizService.getAttemptsForQuiz(q.id);
      if (attempts.length > 0) {
        const avg = attempts.reduce((sum, a) => sum + a.score_obtained, 0) / attempts.length;
        quizScoreSum += avg;
        quizAttemptsCount++;
      }
    }
    const averageQuizScore = quizAttemptsCount > 0 ? Math.round(quizScoreSum / quizAttemptsCount) : 80;

    // Load assignments & submissions to compute average assignment score
    const assignments = await assignmentService.getAssignments(courseId);
    let assignmentScoreSum = 0;
    let assignmentSubmissionsCount = 0;
    for (const a of assignments) {
      const subs = await assignmentService.getSubmissions(a.id);
      const graded = subs.filter(s => s.points_awarded !== null);
      if (graded.length > 0) {
        // Normalize to percentage
        const avg = graded.reduce((sum, s) => sum + (s.points_awarded! / a.max_points), 0) / graded.length;
        assignmentScoreSum += avg * 100;
        assignmentSubmissionsCount++;
      }
    }
    const averageAssignmentScore = assignmentSubmissionsCount > 0 
      ? Math.round(assignmentScoreSum / assignmentSubmissionsCount) 
      : 75;

    // Course defaults based on mock data
    let totalEnrolled = course.enrolled ? 24 : 18;
    if (courseId === 'course-dl-101') totalEnrolled = 42;
    if (courseId === 'course-db-202') totalEnrolled = 36;

    return {
      total_enrolled: totalEnrolled,
      average_progress: course.enrolled ? course.progress_percentage : 0,
      average_quiz_score: averageQuizScore,
      average_assignment_score: averageAssignmentScore,
      attendance_rate: attendanceRate
    };
  },

  // Retrieve student's personal progress and grade overview for a course (Student only)
  async getStudentCourseAnalytics(courseId: string, studentId: string): Promise<StudentCourseAnalyticsResponse> {
    const course = await courseService.getCourse(courseId);
    if (!course) throw new Error('Course not found');

    // 1. Get attendance rate
    const attSummary = await attendanceService.getStudentAttendanceSummary(courseId, studentId);
    
    // 2. Get quiz attempts
    const quizzes = await quizService.getQuizzes(courseId);
    const quizGrades: StudentQuizGrade[] = [];
    for (const q of quizzes) {
      const attempts = await quizService.getAttemptsForStudent(studentId, q.id);
      if (attempts.length > 0) {
        // Find best attempt
        const best = attempts.reduce((max, curr) => curr.score_obtained > max.score_obtained ? curr : max, attempts[0]);
        const totalPoints = q.questions.reduce((sum, quest) => sum + quest.points, 0);
        quizGrades.push({
          quiz_id: q.id,
          quiz_title: q.title,
          score_obtained: best.score_obtained,
          total_points: totalPoints || 10,
          passed: best.passed,
          completed_at: best.completed_at
        });
      }
    }

    // 3. Get assignment submissions
    const assignments = await assignmentService.getAssignments(courseId);
    const assignmentGrades: StudentAssignmentGrade[] = [];
    for (const a of assignments) {
      const sub = await assignmentService.getSubmissionForStudent(a.id, studentId);
      assignmentGrades.push({
        assignment_id: a.id,
        assignment_title: a.title,
        points_awarded: sub ? sub.points_awarded : null,
        max_points: a.max_points,
        submitted_at: sub ? sub.submitted_at : null,
        feedback_markdown: sub ? sub.feedback_markdown : null
      });
    }

    return {
      progress: course.enrolled ? course.progress_percentage : 0,
      attendance_rate: attSummary.attendanceRate,
      quiz_grades: quizGrades,
      assignment_grades: assignmentGrades
    };
  }
};
