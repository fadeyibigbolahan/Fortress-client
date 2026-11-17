import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginPage from "../pages/auth/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";

// ========================================
// ADMIN PAGES
// ========================================

import AdminDashboard from "../pages/admin/AdminDashboard";
import AcademicSessions from "../pages/admin/AcademicSessions";
import Terms from "../pages/admin/Terms";
import Classes from "../pages/admin/Classes";
import Subjects from "../pages/admin/Subjects";
import Students from "../pages/admin/Students";
import Enrollments from "../pages/admin/Enrollments";
import AdminTeacherAssignments from "../pages/admin/TeacherAssignments";
import TeacherManagement from "../pages/admin/TeacherManagement";
import QuestionBank from "../pages/admin/QuestionBank";
import Examinations from "../pages/admin/Examinations";
import Results from "../pages/admin/Results";

// ========================================
// TEACHER PAGES
// ========================================

import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import TeacherGradingQueue from "../pages/teacher/TeacherGradingQueue";
import TeacherGradeAttempt from "../pages/teacher/TeacherGradeAttempt";
import TeacherQuestionBank from "../pages/teacher/TeacherQuestionBank";
import TeacherAssignments from "../pages/teacher/TeacherAssignments";
import TeacherResults from "../pages/teacher/TeacherResults";

// ========================================
// STUDENT PAGES
// ========================================

import StudentDashboard from "../pages/student/StudentDashboard";
import StudentExaminations from "../pages/student/StudentExaminations";
import TakeExamination from "../pages/student/TakeExamination";
import ExaminationHistory from "../pages/student/ExaminationHistory";
import StudentResults from "../pages/student/StudentResults";

// ========================================
// ROLE DASHBOARD REDIRECTS
// ========================================

const dashboardPaths = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  exam_officer: "/exam-officer/dashboard",
  student: "/student/dashboard",
};

// ========================================
// HOME REDIRECT
// ========================================

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={dashboardPaths[user.role] || "/login"} replace />;
}

// ========================================
// MODULE PLACEHOLDER
// ========================================

function ModulePlaceholder({ title }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

      <p className="mt-3 text-sm text-slate-500">
        This module will be implemented in the next development stage.
      </p>
    </div>
  );
}

// ========================================
// APPLICATION ROUTER
// ========================================

export default function AppRouter() {
  return (
    <Routes>
      {/* ================================== */}
      {/* PUBLIC ROUTES */}
      {/* ================================== */}

      <Route path="/login" element={<LoginPage />} />

      {/* ================================== */}
      {/* ADMINISTRATOR ROUTES */}
      {/* ================================== */}

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="sessions" element={<AcademicSessions />} />

          <Route path="terms" element={<Terms />} />

          <Route path="classes" element={<Classes />} />

          <Route path="subjects" element={<Subjects />} />

          <Route path="students" element={<Students />} />

          <Route path="enrollments" element={<Enrollments />} />

          <Route path="teachers" element={<TeacherManagement />} />

          <Route
            path="teacher-assignments"
            element={<AdminTeacherAssignments />}
          />

          <Route path="questions" element={<QuestionBank />} />

          <Route path="examinations" element={<Examinations />} />

          <Route path="results" element={<Results />} />

          <Route
            path="reports"
            element={<ModulePlaceholder title="Reports & Analytics" />}
          />

          <Route
            path="settings"
            element={<ModulePlaceholder title="Settings" />}
          />
        </Route>
      </Route>

      {/* ================================== */}
      {/* TEACHER ROUTES */}
      {/* ================================== */}

      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route path="/teacher" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />

          {/* Teacher Dashboard */}
          <Route path="dashboard" element={<TeacherDashboard />} />

          {/* Teaching Assignments */}
          <Route path="assignments" element={<TeacherAssignments />} />

          {/* Teacher Question Bank */}
          <Route path="questions" element={<TeacherQuestionBank />} />

          {/* Theory Grading Workspace */}
          <Route path="grading" element={<TeacherGradingQueue />} />

          <Route path="grading/:attemptId" element={<TeacherGradeAttempt />} />

          <Route path="results" element={<TeacherResults />} />

          {/* Teacher Profile */}
          <Route
            path="profile"
            element={<ModulePlaceholder title="My Profile" />}
          />
        </Route>
      </Route>

      {/* ================================== */}
      {/* STUDENT ROUTES */}
      {/* ================================== */}

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/student" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />

          {/* Student Dashboard */}
          <Route path="dashboard" element={<StudentDashboard />} />

          {/* Available Examinations */}
          <Route path="examinations" element={<StudentExaminations />} />

          {/* Examination Taking */}
          <Route
            path="examinations/:examinationId/take"
            element={<TakeExamination />}
          />

          {/* Examination History */}
          <Route path="history" element={<ExaminationHistory />} />

          {/* Released Results */}
          <Route path="results" element={<StudentResults />} />

          {/* Student Profile */}
          <Route
            path="profile"
            element={<ModulePlaceholder title="My Profile" />}
          />
        </Route>
      </Route>

      {/* ================================== */}
      {/* DEFAULT REDIRECTS */}
      {/* ================================== */}

      <Route path="/" element={<HomeRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
