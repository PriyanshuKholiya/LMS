import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { Login } from '../pages/Login';
import { Unauthorized } from '../pages/Unauthorized';
import { AdminDashboard } from '../pages/dashboards/AdminDashboard';
import { FacultyDashboard } from '../pages/dashboards/FacultyDashboard';
import { StudentDashboard } from '../pages/dashboards/StudentDashboard';

// Course Management Imports
import { CourseList } from '../pages/courses/CourseList';
import { CourseDetail } from '../pages/courses/CourseDetail';
import { CourseForm } from '../pages/courses/CourseForm';

// Assignment Imports
import { AssignmentList } from '../pages/assignments/AssignmentList';
import { AssignmentDetail } from '../pages/assignments/AssignmentDetail';
import { AssignmentForm } from '../pages/assignments/AssignmentForm';

// Quiz Imports
import { QuizList } from '../pages/quizzes/QuizList';
import { QuizAttemptPage } from '../pages/quizzes/QuizAttemptPage';
import { QuizForm } from '../pages/quizzes/QuizForm';

// Attendance Imports
import { FacultyAttendance } from '../pages/attendance/FacultyAttendance';
import { StudentAttendance } from '../pages/attendance/StudentAttendance';

// Analytics Imports
import { AdminAnalytics } from '../pages/analytics/AdminAnalytics';
import { FacultyAnalytics } from '../pages/analytics/FacultyAnalytics';
import { StudentAnalytics } from '../pages/analytics/StudentAnalytics';

// Redirection helper for root path `/`
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin" replace />;
    case 'FACULTY': return <Navigate to="/faculty" replace />;
    case 'STUDENT': return <Navigate to="/student" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<RootRedirect />} />

      {/* ADMIN Route Tree */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<CourseList />} />
          <Route path="/admin/courses/new" element={<CourseForm />} />
          <Route path="/admin/courses/:id/edit" element={<CourseForm />} />
          <Route path="/admin/courses/:id" element={<CourseDetail />} />
          <Route path="/admin/courses/:courseId/assignments" element={<AssignmentList />} />
          <Route path="/admin/courses/:courseId/assignments/new" element={<AssignmentForm />} />
          <Route path="/admin/courses/:courseId/assignments/:id" element={<AssignmentDetail />} />
          <Route path="/admin/courses/:courseId/quizzes" element={<QuizList />} />
          <Route path="/admin/courses/:courseId/quizzes/new" element={<QuizForm />} />
          <Route path="/admin/courses/:courseId/attendance" element={<FacultyAttendance />} />
          <Route path="/admin/users" element={<div className="glass-panel" style={{ padding: '32px' }}><h3>User Management (Admin Screen Stub)</h3></div>} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>
      </Route>

      {/* FACULTY Route Tree */}
      <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/courses" element={<CourseList />} />
          <Route path="/faculty/courses/new" element={<CourseForm />} />
          <Route path="/faculty/courses/:id/edit" element={<CourseForm />} />
          <Route path="/faculty/courses/:id" element={<CourseDetail />} />
          <Route path="/faculty/courses/:courseId/assignments" element={<AssignmentList />} />
          <Route path="/faculty/courses/:courseId/assignments/new" element={<AssignmentForm />} />
          <Route path="/faculty/courses/:courseId/assignments/:id" element={<AssignmentDetail />} />
          <Route path="/faculty/courses/:courseId/quizzes" element={<QuizList />} />
          <Route path="/faculty/courses/:courseId/quizzes/new" element={<QuizForm />} />
          <Route path="/faculty/grading" element={<div className="glass-panel" style={{ padding: '32px' }}><h3>Grading & Submissions Queue (Faculty Screen Stub)</h3></div>} />
          <Route path="/faculty/attendance" element={<FacultyAttendance />} />
          <Route path="/faculty/courses/:courseId/attendance" element={<FacultyAttendance />} />
          <Route path="/faculty/analytics" element={<FacultyAnalytics />} />
          <Route path="/faculty/courses/:courseId/analytics" element={<FacultyAnalytics />} />
        </Route>
      </Route>

      {/* STUDENT Route Tree */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<CourseList catalogOnly />} />
          <Route path="/student/my-enrollments" element={<CourseList enrolledOnly />} />
          <Route path="/student/courses/:id" element={<CourseDetail />} />
          <Route path="/student/courses/:courseId/assignments" element={<AssignmentList />} />
          <Route path="/student/courses/:courseId/assignments/:id" element={<AssignmentDetail />} />
          <Route path="/student/courses/:courseId/quizzes" element={<QuizList />} />
          <Route path="/student/courses/:courseId/quizzes/:id/attempt" element={<QuizAttemptPage />} />
          <Route path="/student/courses/:courseId/attendance" element={<StudentAttendance />} />
          <Route path="/student/analytics" element={<StudentAnalytics />} />
          <Route path="/student/courses/:courseId/analytics" element={<StudentAnalytics />} />
          <Route path="/student/ai-tutor" element={<div className="glass-panel" style={{ padding: '32px' }}><h3>AI Tutor Chatbot (Student Screen Stub)</h3></div>} />
        </Route>
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
