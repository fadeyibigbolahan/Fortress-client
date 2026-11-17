import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CircleCheck,
  Pencil,
  X,
  RefreshCw,
  Play,
  Check,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  name: "",
  startDate: "",
  endDate: "",
};

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  upcoming: "bg-blue-50 text-blue-700 ring-blue-600/20",
  completed: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

function StatCard({ title, value, description, icon: Icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function SessionModal({ open, onClose, onSave, session, saving }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    if (session) {
      setForm({
        name: session.name || "",
        startDate: session.startDate
          ? new Date(session.startDate).toISOString().slice(0, 10)
          : "",
        endDate: session.endDate
          ? new Date(session.endDate).toISOString().slice(0, 10)
          : "",
      });
    } else {
      setForm(initialForm);
    }

    setErrors({});
  }, [open, session]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Session name is required.";
    }

    if (!form.startDate) {
      nextErrors.startDate = "Start date is required.";
    }

    if (!form.endDate) {
      nextErrors.endDate = "End date is required.";
    }

    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) <= new Date(form.startDate)
    ) {
      nextErrors.endDate = "End date must be after the start date.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    });
  };

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {session ? "Edit Academic Session" : "Create Academic Session"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {session
                ? "Update the details of this academic session."
                : "Set up a new academic session for your school."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Session Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. 2026/2027"
              className={fieldClass}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className={fieldClass}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                min={form.startDate || undefined}
                className={fieldClass}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
            <strong>Note:</strong> A new session will be created as upcoming.
            You can activate it when its academic calendar begins.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : session
                  ? "Save Changes"
                  : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AcademicSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      const response = await api.get("/academic-sessions");

      setSessions(response.data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const stats = useMemo(() => {
    return {
      total: sessions.length,
      active: sessions.filter((item) => item.status === "active").length,
      upcoming: sessions.filter((item) => item.status === "upcoming").length,
      completed: sessions.filter((item) => item.status === "completed").length,
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch = session.name
        ?.toLowerCase()
        .includes(search.toLowerCase().trim());

      const matchesStatus =
        statusFilter === "all" || session.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, statusFilter]);

  const openCreateModal = () => {
    setSelectedSession(null);
    setModalOpen(true);
  };

  const openEditModal = (session) => {
    if (session.status === "completed") {
      toast.error("Completed sessions cannot be edited.");
      return;
    }

    setSelectedSession(session);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);

      if (selectedSession) {
        await api.patch(`/academic-sessions/${selectedSession._id}`, formData);
        toast.success("Academic session updated successfully.");
      } else {
        await api.post("/academic-sessions", formData);
        toast.success("Academic session created successfully.");
      }

      setModalOpen(false);
      setSelectedSession(null);
      await fetchSessions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (session) => {
    const confirmed = window.confirm(
      `Activate "${session.name}"?\n\nThis will make it the current academic session.`,
    );

    if (!confirmed) return;

    try {
      setActionId(session._id);

      await api.patch(`/academic-sessions/${session._id}/activate`);

      toast.success("Academic session activated successfully.");
      await fetchSessions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const handleComplete = async (session) => {
    const confirmed = window.confirm(
      `Complete "${session.name}"?\n\nThis action may affect enrollment and academic operations.`,
    );

    if (!confirmed) return;

    try {
      setActionId(session._id);

      await api.patch(`/academic-sessions/${session._id}/complete`);

      toast.success("Academic session completed successfully.");
      await fetchSessions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <GraduationCap size={16} />
            <span>Academics</span>
            <span>/</span>
            <span className="text-slate-800">Academic Sessions</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Academic Sessions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage your school's academic calendar.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Create Session
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sessions"
          value={stats.total}
          description="All academic sessions"
          icon={CalendarDays}
          iconClass="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          title="Active Session"
          value={stats.active}
          description="Currently running"
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Upcoming Sessions"
          value={stats.upcoming}
          description="Yet to be activated"
          icon={Clock3}
          iconClass="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Completed Sessions"
          value={stats.completed}
          description="Previous academic sessions"
          icon={CircleCheck}
          iconClass="bg-slate-100 text-slate-600"
        />
      </div>

      {/* Sessions table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">All Sessions</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage academic sessions.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search sessions..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="button"
              onClick={fetchSessions}
              disabled={loading}
              title="Refresh sessions"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw size={25} className="animate-spin text-indigo-600" />
            <p className="text-sm">Loading academic sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <CalendarDays size={28} />
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
              {sessions.length === 0
                ? "No academic sessions yet"
                : "No matching sessions"}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {sessions.length === 0
                ? "Create your first academic session to begin setting up the school's academic calendar."
                : "Try changing your search term or status filter."}
            </p>

            {sessions.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={17} />
                Create First Session
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Session</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">End Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Current</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((session) => (
                    <tr
                      key={session._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                            <CalendarDays size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {session.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Academic session
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(session.startDate)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(session.endDate)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                            statusStyles[session.status] ||
                            "bg-slate-100 text-slate-600 ring-slate-500/20"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {session.isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Current
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {session.status !== "completed" && (
                            <button
                              type="button"
                              onClick={() => openEditModal(session)}
                              title="Edit session"
                              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Pencil size={16} />
                            </button>
                          )}

                          {session.status === "upcoming" && (
                            <button
                              type="button"
                              onClick={() => handleActivate(session)}
                              disabled={actionId === session._id}
                              title="Activate session"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <Play size={14} />
                              {actionId === session._id
                                ? "Processing..."
                                : "Activate"}
                            </button>
                          )}

                          {session.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleComplete(session)}
                              disabled={actionId === session._id}
                              title="Complete session"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                            >
                              <Check size={14} />
                              {actionId === session._id
                                ? "Processing..."
                                : "Complete"}
                            </button>
                          )}

                          {session.status === "completed" && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <CheckCircle2 size={15} />
                              Finished
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredSessions.length} of {sessions.length} sessions
              </span>
              <span>Academic session records</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertCircle size={19} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Important: Session activation
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Activating a session makes it the school's current academic session.
            Make sure its dates are correct before activation. The backend will
            validate whether it can be activated.
          </p>
        </div>
      </div>

      <SessionModal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setSelectedSession(null);
          }
        }}
        onSave={handleSave}
        session={selectedSession}
        saving={saving}
      />
    </div>
  );
}
