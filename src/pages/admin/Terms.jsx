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
  BookOpen,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  name: "First Term",
  termNumber: "1",
  academicSession: "",
  startDate: "",
  endDate: "",
};

const termNames = [
  { value: "1", label: "First Term" },
  { value: "2", label: "Second Term" },
  { value: "3", label: "Third Term" },
];

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

const getSessionId = (session) => {
  if (!session) return "";
  return typeof session === "object" ? session._id : session;
};

const getSessionName = (session, sessions = []) => {
  if (!session) return "—";

  if (typeof session === "object") {
    return session.name || "Unknown session";
  }

  return (
    sessions.find((item) => item._id === session)?.name || "Unknown session"
  );
};

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

function TermModal({ open, onClose, onSave, term, sessions, saving }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    if (term) {
      setForm({
        name: term.name || "First Term",
        termNumber: String(term.termNumber || 1),
        academicSession: getSessionId(term.academicSession),
        startDate: term.startDate
          ? new Date(term.startDate).toISOString().slice(0, 10)
          : "",
        endDate: term.endDate
          ? new Date(term.endDate).toISOString().slice(0, 10)
          : "",
      });
    } else {
      setForm({
        ...initialForm,
        academicSession: sessions.find((item) => item.isCurrent)?._id || "",
      });
    }

    setErrors({});
  }, [open, term, sessions]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "termNumber") {
        updated.name =
          termNames.find((item) => item.value === value)?.label || "";
      }

      return updated;
    });

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.academicSession) {
      nextErrors.academicSession = "Select an academic session.";
    }

    if (!form.name) {
      nextErrors.name = "Select a term.";
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
      name: form.name,
      termNumber: Number(form.termNumber),
      academicSession: form.academicSession,
      startDate: form.startDate,
      endDate: form.endDate,
    });
  };

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

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
              {term ? "Edit Academic Term" : "Create Academic Term"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {term
                ? "Update the details of this academic term."
                : "Add a term to an existing academic session."}
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
              Academic Session
            </label>

            <select
              name="academicSession"
              value={form.academicSession}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="">Select academic session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.name}
                  {session.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>

            {errors.academicSession && (
              <p className="mt-1 text-xs text-red-600">
                {errors.academicSession}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Term</label>

            <select
              name="termNumber"
              value={form.termNumber}
              onChange={handleChange}
              className={fieldClass}
            >
              {termNames.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
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
            <strong>Note:</strong> The selected term must fall within the
            academic session's start and end dates. Only one term can be current
            at a time.
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
              disabled={saving || sessions.length === 0}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : term ? "Save Changes" : "Create Term"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Terms() {
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [termsResponse, sessionsResponse] = await Promise.all([
        api.get("/terms"),
        api.get("/academic-sessions"),
      ]);

      setTerms(termsResponse.data.data || []);
      setSessions(sessionsResponse.data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(
    () => ({
      total: terms.length,
      active: terms.filter((item) => item.status === "active").length,
      upcoming: terms.filter((item) => item.status === "upcoming").length,
      completed: terms.filter((item) => item.status === "completed").length,
    }),
    [terms],
  );

  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      const sessionName = getSessionName(term.academicSession, sessions);
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        term.name?.toLowerCase().includes(searchText) ||
        sessionName.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" || term.status === statusFilter;

      const matchesSession =
        sessionFilter === "all" ||
        getSessionId(term.academicSession) === sessionFilter;

      return matchesSearch && matchesStatus && matchesSession;
    });
  }, [terms, sessions, search, statusFilter, sessionFilter]);

  const openCreateModal = () => {
    if (sessions.length === 0) {
      toast.error("Create an academic session before adding a term.");
      return;
    }

    setSelectedTerm(null);
    setModalOpen(true);
  };

  const openEditModal = (term) => {
    if (term.status === "completed") {
      toast.error("Completed terms cannot be edited.");
      return;
    }

    setSelectedTerm(term);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);

      if (selectedTerm) {
        await api.patch(`/terms/${selectedTerm._id}`, formData);
        toast.success("Academic term updated successfully.");
      } else {
        await api.post("/terms", formData);
        toast.success("Academic term created successfully.");
      }

      setModalOpen(false);
      setSelectedTerm(null);
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (term) => {
    const confirmed = window.confirm(
      `Activate "${term.name}"?\n\nThis will make it the current academic term.`,
    );

    if (!confirmed) return;

    try {
      setActionId(term._id);

      await api.patch(`/terms/${term._id}/activate`);

      toast.success("Academic term activated successfully.");
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const handleComplete = async (term) => {
    const confirmed = window.confirm(
      `Complete "${term.name}"?\n\nMake sure all academic activities for this term have been concluded.`,
    );

    if (!confirmed) return;

    try {
      setActionId(term._id);

      await api.patch(`/terms/${term._id}/complete`);

      toast.success("Academic term completed successfully.");
      await fetchData();
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
            <span className="text-slate-800">Terms</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Term Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Organise First, Second and Third Terms across academic sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Create Term
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Terms"
          value={stats.total}
          description="All academic terms"
          icon={BookOpen}
          iconClass="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          title="Active Terms"
          value={stats.active}
          description="Currently running"
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Upcoming Terms"
          value={stats.upcoming}
          description="Yet to be activated"
          icon={Clock3}
          iconClass="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Completed Terms"
          value={stats.completed}
          description="Concluded academic terms"
          icon={CircleCheck}
          iconClass="bg-slate-100 text-slate-600"
        />
      </div>

      {/* Terms table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-900">All Academic Terms</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage terms within each academic session.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search term or academic session..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500"
              />
            </div>

            <select
              value={sessionFilter}
              onChange={(event) => setSessionFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="all">All sessions</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.name}
                </option>
              ))}
            </select>

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
              onClick={fetchData}
              disabled={loading}
              title="Refresh terms"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw size={25} className="animate-spin text-indigo-600" />
            <p className="text-sm">Loading academic terms...</p>
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <BookOpen size={28} />
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
              {terms.length === 0
                ? "No academic terms yet"
                : "No matching terms"}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {terms.length === 0
                ? "Create the academic terms for your school. Each term must belong to an academic session."
                : "Try changing your search term or filters."}
            </p>

            {terms.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                disabled={sessions.length === 0}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={17} />
                Create First Term
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Term</th>
                    <th className="px-6 py-4">Academic Session</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">End Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Current</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTerms.map((term) => (
                    <tr
                      key={term._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                            <BookOpen size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {term.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Term {term.termNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm font-medium text-slate-700">
                        {getSessionName(term.academicSession, sessions)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(term.startDate)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(term.endDate)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                            statusStyles[term.status] ||
                            "bg-slate-100 text-slate-600 ring-slate-500/20"
                          }`}
                        >
                          {term.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {term.isCurrent ? (
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
                          {term.status !== "completed" && (
                            <button
                              type="button"
                              onClick={() => openEditModal(term)}
                              title="Edit term"
                              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Pencil size={16} />
                            </button>
                          )}

                          {term.status === "upcoming" && (
                            <button
                              type="button"
                              onClick={() => handleActivate(term)}
                              disabled={actionId === term._id}
                              title="Activate term"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <Play size={14} />
                              {actionId === term._id
                                ? "Processing..."
                                : "Activate"}
                            </button>
                          )}

                          {term.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleComplete(term)}
                              disabled={actionId === term._id}
                              title="Complete term"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                            >
                              <Check size={14} />
                              {actionId === term._id
                                ? "Processing..."
                                : "Complete"}
                            </button>
                          )}

                          {term.status === "completed" && (
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
                Showing {filteredTerms.length} of {terms.length} terms
              </span>
              <span>Academic term records</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertCircle size={19} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Important: Term activation
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            A term can only be activated under the appropriate active academic
            session and within its configured date range. Your backend validates
            these conditions before activation.
          </p>
        </div>
      </div>

      <TermModal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setSelectedTerm(null);
          }
        }}
        onSave={handleSave}
        term={selectedTerm}
        sessions={sessions}
        saving={saving}
      />
    </div>
  );
}
