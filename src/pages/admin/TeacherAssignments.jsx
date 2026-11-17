import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Users,
  BookOpen,
  GraduationCap,
  CalendarDays,
  MoreVertical,
  Pencil,
  Power,
  Eye,
  X,
  Loader2,
  RefreshCw,
  UserCheck,
  Filter,
  ChevronDown,
  Mail,
  Hash,
  School,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  teacher: "",
  subject: "",
  class: "",
  academicSession: "",
};

function getArray(response) {
  const body = response?.data;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.teachers)) return body.teachers;
  if (Array.isArray(body?.subjects)) return body.subjects;
  if (Array.isArray(body?.classes)) return body.classes;
  if (Array.isArray(body?.academicSessions)) return body.academicSessions;

  return [];
}

function getId(value) {
  if (!value) return "";
  return typeof value === "object" ? value._id || value.id || "" : value;
}

function getName(person) {
  if (!person) return "Unknown";
  if (typeof person === "string") return person;

  return [person.firstName, person.middleName, person.lastName]
    .filter(Boolean)
    .join(" ");
}

function getClassName(item) {
  if (!item) return "—";
  if (typeof item === "string") return item;

  return item.name || `${item.level || ""} ${item.arm || ""}`.trim() || "—";
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Modal({ title, subtitle, onClose, children, size = "max-w-xl" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5">
      <div
        className={`max-h-[92vh] w-full ${size} overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, required = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        assignmentResponse,
        teacherResponse,
        subjectResponse,
        classResponse,
        sessionResponse,
      ] = await Promise.all([
        api.get("/teacher-assignments"),
        api.get("/teacher-assignments/teachers"),
        api.get("/subjects"),
        api.get("/classes"),
        api.get("/academic-sessions"),
      ]);

      setAssignments(getArray(assignmentResponse));
      setTeachers(getArray(teacherResponse));
      setSubjects(getArray(subjectResponse));
      setClasses(getArray(classResponse));
      setSessions(getArray(sessionResponse));
    } catch (error) {
      console.error("Teacher assignment loading error:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to load teacher assignment information.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAssignments = useMemo(
    () => assignments.filter((item) => item.status === "active"),
    [assignments],
  );

  const assignedTeacherCount = useMemo(() => {
    const ids = new Set(
      activeAssignments.map((item) => getId(item.teacher)).filter(Boolean),
    );

    return ids.size;
  }, [activeAssignments]);

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const teacherName = getName(item.teacher).toLowerCase();
      const staffId = (item.teacher?.staffId || "").toLowerCase();
      const subjectName = (item.subject?.name || "").toLowerCase();
      const subjectCode = (item.subject?.code || "").toLowerCase();
      const className = getClassName(item.class).toLowerCase();
      const sessionName = (item.academicSession?.name || "").toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        [
          teacherName,
          staffId,
          subjectName,
          subjectCode,
          className,
          sessionName,
        ].some((value) => value.includes(normalizedSearch));

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchesTeacher =
        teacherFilter === "all" || getId(item.teacher) === teacherFilter;

      const matchesSubject =
        subjectFilter === "all" || getId(item.subject) === subjectFilter;

      const matchesClass =
        classFilter === "all" || getId(item.class) === classFilter;

      const matchesSession =
        sessionFilter === "all" ||
        getId(item.academicSession) === sessionFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTeacher &&
        matchesSubject &&
        matchesClass &&
        matchesSession
      );
    });
  }, [
    assignments,
    search,
    statusFilter,
    teacherFilter,
    subjectFilter,
    classFilter,
    sessionFilter,
  ]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTeacherFilter("all");
    setSubjectFilter("all");
    setClassFilter("all");
    setSessionFilter("all");
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);

    setForm({
      teacher: getId(assignment.teacher),
      subject: getId(assignment.subject),
      class: getId(assignment.class),
      academicSession: getId(assignment.academicSession),
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingAssignment(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.teacher ||
      !form.subject ||
      !form.class ||
      !form.academicSession
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    setSaving(true);

    try {
      if (editingAssignment) {
        await api.patch(`/teacher-assignments/${editingAssignment._id}`, {
          teacher: form.teacher,
        });

        toast.success("Teacher assignment updated successfully.");
      } else {
        await api.post("/teacher-assignments", form);

        toast.success("Teacher assigned successfully.");
      }

      setShowForm(false);
      setEditingAssignment(null);
      setForm(initialForm);
      await loadData();
    } catch (error) {
      console.error("Teacher assignment save error:", error);
      toast.error(
        error.response?.data?.message || "Unable to save teacher assignment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (assignment) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate the assignment for ${getName(
        assignment.teacher,
      )} teaching ${assignment.subject?.name || "this subject"}?`,
    );

    if (!confirmed) return;

    try {
      await api.patch(`/teacher-assignments/${assignment._id}/deactivate`);

      toast.success("Assignment deactivated successfully.");
      await loadData();
    } catch (error) {
      console.error("Assignment deactivation error:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to deactivate this assignment.",
      );
    }
  };

  const handleViewAssignment = async (assignment) => {
    try {
      const response = await api.get(`/teacher-assignments/${assignment._id}`);

      setViewingAssignment(response.data?.data || assignment);
    } catch (error) {
      console.error("Assignment details error:", error);
      toast.error(
        error.response?.data?.message || "Unable to load assignment details.",
      );
    }
  };

  const selectedSubject = subjects.find(
    (subject) => subject._id === form.subject,
  );

  const eligibleClasses = selectedSubject
    ? classes.filter((item) => selectedSubject.levels?.includes(item.level))
    : classes;

  const activeTeachers = teachers.filter(
    (teacher) => teacher.status !== "inactive",
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>People Management</span>
            <span>/</span>
            <span className="text-slate-700">Teacher Assignments</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Teacher Assignments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Assign teachers to subjects and classes for each academic session.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Assign Teacher
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Assignments"
          value={assignments.length}
          icon={BookOpen}
          description="All recorded assignments"
        />

        <StatCard
          title="Active Assignments"
          value={activeAssignments.length}
          icon={UserCheck}
          description="Currently active teaching assignments"
        />

        <StatCard
          title="Inactive Assignments"
          value={assignments.length - activeAssignments.length}
          icon={Power}
          description="Deactivated assignments"
        />

        <StatCard
          title="Assigned Teachers"
          value={assignedTeacherCount}
          icon={Users}
          description="Unique teachers with active assignments"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">
            Search and filter assignments
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teacher, staff ID, subject..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <select
            value={teacherFilter}
            onChange={(event) => setTeacherFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">All teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {getName(teacher)}
              </option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">All classes</option>
            {classes.map((item) => (
              <option key={item._id} value={item._id}>
                {getClassName(item)}
              </option>
            ))}
          </select>

          <select
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">All sessions</option>
            {sessions.map((session) => (
              <option key={session._id} value={session._id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputClass} max-w-[180px]`}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Assignments table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">
              Teaching Assignments
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredAssignments.length} assignment
              {filteredAssignments.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">
              Loading teacher assignments...
            </p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-full bg-slate-100 p-4">
              <GraduationCap size={27} className="text-slate-400" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
              No assignments found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {assignments.length === 0
                ? "You haven't assigned any teachers yet. Create your first teaching assignment."
                : "Try changing your search or filters to find an assignment."}
            </p>

            {assignments.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Assign a Teacher
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Teacher</th>
                    <th className="px-5 py-3.5">Subject</th>
                    <th className="px-5 py-3.5">Class</th>
                    <th className="px-5 py-3.5">Academic Session</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Assigned Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((assignment) => (
                    <tr
                      key={assignment._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                            {getName(assignment.teacher)
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase() || "T"}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {getName(assignment.teacher)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {assignment.teacher?.staffId || "No staff ID"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {assignment.subject?.name || "—"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {assignment.subject?.code || ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
                          {getClassName(assignment.class)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {assignment.academicSession?.name || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={assignment.status} />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(assignment.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="View details"
                            onClick={() => handleViewAssignment(assignment)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={17} />
                          </button>

                          {assignment.status === "active" && (
                            <>
                              <button
                                type="button"
                                title="Change assigned teacher"
                                onClick={() => openEditModal(assignment)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                type="button"
                                title="Deactivate assignment"
                                onClick={() => handleDeactivate(assignment)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Power size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              Showing {filteredAssignments.length} of {assignments.length}{" "}
              assignments
            </div>
          </>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <Modal
          title={
            editingAssignment ? "Change Assigned Teacher" : "Assign a Teacher"
          }
          subtitle={
            editingAssignment
              ? "Select a replacement teacher for this assignment."
              : "Assign a teacher to a subject and class for an academic session."
          }
          onClose={closeForm}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Teacher" required>
              <select
                value={form.teacher}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    teacher: event.target.value,
                  }))
                }
                className={inputClass}
                required
              >
                <option value="">Select a teacher</option>
                {activeTeachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {getName(teacher)} — {teacher.staffId || "No staff ID"}
                  </option>
                ))}
              </select>

              {teachers.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No active teacher accounts were returned. Create teacher
                  accounts before making assignments.
                </p>
              )}
            </FormField>

            {!editingAssignment && (
              <>
                <FormField label="Subject" required>
                  <select
                    value={form.subject}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        subject: event.target.value,
                        class: "",
                      }))
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects
                      .filter((subject) => subject.status === "active")
                      .map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                  </select>
                </FormField>

                <FormField label="Class" required>
                  <select
                    value={form.class}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        class: event.target.value,
                      }))
                    }
                    className={inputClass}
                    required
                    disabled={!form.subject}
                  >
                    <option value="">
                      {form.subject
                        ? "Select a class"
                        : "Select a subject first"}
                    </option>

                    {eligibleClasses
                      .filter((item) => item.status === "active")
                      .map((item) => (
                        <option key={item._id} value={item._id}>
                          {getClassName(item)} ({item.level})
                        </option>
                      ))}
                  </select>

                  {selectedSubject && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Only classes supported by this subject are shown.
                    </p>
                  )}
                </FormField>

                <FormField label="Academic Session" required>
                  <select
                    value={form.academicSession}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        academicSession: event.target.value,
                      }))
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Select an academic session</option>
                    {sessions
                      .filter((session) => session.status !== "completed")
                      .map((session) => (
                        <option key={session._id} value={session._id}>
                          {session.name} ({session.status})
                        </option>
                      ))}
                  </select>
                </FormField>
              </>
            )}

            {editingAssignment && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assignment details
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Subject</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {editingAssignment.subject?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Class</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {getClassName(editingAssignment.class)}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Academic session</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {editingAssignment.academicSession?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || activeTeachers.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingAssignment ? "Save Changes" : "Assign Teacher"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assignment details modal */}
      {viewingAssignment && (
        <Modal
          title="Assignment Details"
          subtitle="Full information about this teaching assignment."
          onClose={() => setViewingAssignment(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-700">
                <GraduationCap size={25} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900">
                  {getName(viewingAssignment.teacher)}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {viewingAssignment.teacher?.staffId || "No staff ID"}
                </p>
              </div>

              <StatusBadge status={viewingAssignment.status} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem
                icon={BookOpen}
                label="Subject"
                value={viewingAssignment.subject?.name}
                extra={viewingAssignment.subject?.code}
              />

              <DetailItem
                icon={School}
                label="Class"
                value={getClassName(viewingAssignment.class)}
                extra={viewingAssignment.class?.level}
              />

              <DetailItem
                icon={CalendarDays}
                label="Academic Session"
                value={viewingAssignment.academicSession?.name}
                extra={viewingAssignment.academicSession?.status}
              />

              <DetailItem
                icon={Mail}
                label="Teacher Email"
                value={viewingAssignment.teacher?.email || "Not provided"}
              />

              <DetailItem
                icon={Hash}
                label="Staff ID"
                value={viewingAssignment.teacher?.staffId || "Not provided"}
              />

              <DetailItem
                icon={CalendarDays}
                label="Date Assigned"
                value={formatDate(viewingAssignment.createdAt)}
              />
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setViewingAssignment(null)}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, extra }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
      {extra && (
        <p className="mt-1 text-xs capitalize text-slate-500">{extra}</p>
      )}
    </div>
  );
}
