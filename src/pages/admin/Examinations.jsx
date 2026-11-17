import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  CalendarDays,
  FileText,
  BookOpen,
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings2,
  ListChecks,
  AlertCircle,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  title: "",
  description: "",
  instructions: "",
  academicSessionId: "",
  termId: "",
  classId: "",
  subjectId: "",
  questionIds: [],
  passMarks: "",
  durationMinutes: 60,
  startAt: "",
  endAt: "",
  shuffleQuestions: true,
  shuffleOptions: true,
  allowBackNavigation: true,
};

const statuses = ["draft", "published", "closed", "cancelled"];

const emptyQuestionPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function getArray(response, key) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function getId(value) {
  if (!value) return "";
  return typeof value === "object" ? value._id || value.id || "" : value;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toLocalDateTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function statusStyle(status) {
  const styles = {
    draft: "bg-slate-100 text-slate-700",
    published: "bg-emerald-100 text-emerald-700",
    closed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return styles[status] || "bg-slate-100 text-slate-700";
}

function getQuestionTypeLabel(question) {
  return question.questionType === "objective" ? "Objective" : "Theory";
}

export default function Examinations() {
  const [examinations, setExaminations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Current question page and cached selected questions.
  const [questions, setQuestions] = useState([]);
  const [questionCache, setQuestionCache] = useState({});
  const [questionPagination, setQuestionPagination] = useState(
    emptyQuestionPagination,
  );
  const [questionPage, setQuestionPage] = useState(1);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionTypeFilter, setQuestionTypeFilter] = useState("all");
  const [questionDifficultyFilter, setQuestionDifficultyFilter] =
    useState("all");

  const questionRequestRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [referencesLoading, setReferencesLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedExamination, setSelectedExamination] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [menu, setMenu] = useState(null);

  const loadExaminations = useCallback(async (page = 1) => {
    setLoading(true);

    try {
      const response = await api.get("/examinations", {
        params: {
          page,
          limit: 100,
        },
      });

      const data = response.data || {};
      const list = Array.isArray(data.examinations) ? data.examinations : [];

      setExaminations(list);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 100,
          total: list.length,
          totalPages: 1,
        },
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReferences = useCallback(async () => {
    setReferencesLoading(true);

    try {
      const [sessionResponse, termResponse, classResponse, subjectResponse] =
        await Promise.all([
          api.get("/academic-sessions", { params: { limit: 100 } }),
          api.get("/terms", { params: { limit: 100 } }),
          api.get("/classes", { params: { limit: 100 } }),
          api.get("/subjects", { params: { status: "active", limit: 100 } }),
        ]);

      setSessions(getArray(sessionResponse, "academicSessions"));
      setTerms(getArray(termResponse, "terms"));
      setClasses(getArray(classResponse, "classes"));
      setSubjects(
        getArray(subjectResponse, "subjects").filter(
          (subject) => subject.status === "active",
        ),
      );
    } catch (error) {
      toast.error(
        `Could not load examination options: ${getErrorMessage(error)}`,
      );
    } finally {
      setReferencesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExaminations();
    loadReferences();
  }, [loadExaminations, loadReferences]);

  const filteredExaminations = useMemo(() => {
    const term = search.trim().toLowerCase();

    return examinations.filter((exam) => {
      const title = (exam.title || "").toLowerCase();
      const subjectName = (
        typeof exam.subject === "object" ? exam.subject?.name : ""
      )?.toLowerCase();
      const className = (
        typeof exam.schoolClass === "object" ? exam.schoolClass?.name : ""
      )?.toLowerCase();

      const matchesSearch =
        !term ||
        title.includes(term) ||
        subjectName?.includes(term) ||
        className?.includes(term);

      const matchesStatus =
        statusFilter === "all" || exam.status === statusFilter;

      const matchesSession =
        sessionFilter === "all" ||
        getId(exam.academicSession) === sessionFilter;

      const matchesClass =
        classFilter === "all" || getId(exam.schoolClass) === classFilter;

      return matchesSearch && matchesStatus && matchesSession && matchesClass;
    });
  }, [examinations, search, statusFilter, sessionFilter, classFilter]);

  const statistics = useMemo(() => {
    const counts = {
      total: pagination.total || examinations.length,
      draft: 0,
      published: 0,
      closed: 0,
      cancelled: 0,
    };

    examinations.forEach((exam) => {
      if (counts[exam.status] !== undefined) {
        counts[exam.status] += 1;
      }
    });

    return counts;
  }, [examinations, pagination.total]);

  const availableTerms = terms.filter(
    (term) => getId(term.academicSession) === form.academicSessionId,
  );

  const selectedClass = classes.find((item) => item._id === form.classId);

  const availableSubjects = subjects.filter(
    (subject) =>
      !selectedClass ||
      !Array.isArray(subject.levels) ||
      subject.levels.includes(selectedClass.level),
  );

  // Questions on the currently displayed server page.
  const availableQuestions = questions;

  // All selected questions are resolved from the cache, not just the current page.
  const selectedQuestions = form.questionIds
    .map((id) => questionCache[id])
    .filter(Boolean);

  const totalMarks = selectedQuestions.reduce(
    (sum, question) => sum + Number(question.marks || 0),
    0,
  );

  const objectiveCount = selectedQuestions.filter(
    (question) => question.questionType === "objective",
  ).length;

  const theoryCount = selectedQuestions.filter(
    (question) => question.questionType === "theory",
  ).length;

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  // Fetch only the requested page of questions for the selected subject/class.
  const loadQuestions = useCallback(
    async (page = 1) => {
      if (!form.classId || !form.subjectId || !selectedClass?.level) {
        questionRequestRef.current += 1;
        setQuestions([]);
        setQuestionPagination(emptyQuestionPagination);
        setQuestionsLoading(false);
        return;
      }

      const requestId = ++questionRequestRef.current;
      setQuestionsLoading(true);

      try {
        const params = {
          status: "active",
          subject: form.subjectId,
          classLevel: selectedClass.level,
          page,
          limit: 20,
        };

        if (questionSearch.trim()) {
          params.search = questionSearch.trim();
        }

        if (questionTypeFilter !== "all") {
          params.questionType = questionTypeFilter;
        }

        if (questionDifficultyFilter !== "all") {
          params.difficulty = questionDifficultyFilter;
        }

        const response = await api.get("/questions", { params });

        // Ignore stale responses if another filter/page request has started.
        if (requestId !== questionRequestRef.current) return;

        const data = response.data || {};
        const questionList = Array.isArray(data.questions)
          ? data.questions
          : [];

        setQuestions(questionList);
        setQuestionPagination(
          data.pagination || {
            page,
            limit: 20,
            total: questionList.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );

        // Cache every question returned so selected questions remain available
        // after the user moves to another page.
        setQuestionCache((current) => {
          const updated = { ...current };

          questionList.forEach((question) => {
            updated[question._id] = question;
          });

          return updated;
        });

        setQuestionPage(page);
      } catch (error) {
        if (requestId === questionRequestRef.current) {
          toast.error(`Could not load questions: ${getErrorMessage(error)}`);
        }
      } finally {
        if (requestId === questionRequestRef.current) {
          setQuestionsLoading(false);
        }
      }
    },
    [
      form.classId,
      form.subjectId,
      selectedClass?.level,
      questionSearch,
      questionTypeFilter,
      questionDifficultyFilter,
    ],
  );

  // Load questions whenever the selected class, subject, page or filters change.
  useEffect(() => {
    if (!modalOpen) return;

    if (!form.classId || !form.subjectId) {
      setQuestions([]);
      setQuestionPagination(emptyQuestionPagination);
      setQuestionsLoading(false);
      return;
    }

    const timeout = setTimeout(
      () => loadQuestions(questionPage),
      questionSearch.trim() ? 350 : 0,
    );

    return () => clearTimeout(timeout);
  }, [
    modalOpen,
    form.classId,
    form.subjectId,
    questionPage,
    questionSearch,
    questionTypeFilter,
    questionDifficultyFilter,
    loadQuestions,
  ]);

  const resetQuestionSelector = () => {
    questionRequestRef.current += 1;
    setQuestions([]);
    setQuestionCache({});
    setQuestionPagination(emptyQuestionPagination);
    setQuestionPage(1);
    setQuestionSearch("");
    setQuestionTypeFilter("all");
    setQuestionDifficultyFilter("all");
    setQuestionsLoading(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...initialForm });
    resetQuestionSelector();
    setModalOpen(true);
  };

  const openEditModal = async (exam) => {
    setSaving(false);
    setEditingId(exam._id);
    setModalOpen(false);
    resetQuestionSelector();

    try {
      const response = await api.get(`/examinations/${exam._id}`);
      const fullExam = response.data?.examination;

      if (!fullExam) {
        throw new Error("Could not load examination details.");
      }

      // Seed the cache using the examination's saved question snapshots.
      // This ensures selected question totals are available even when those
      // questions are not on the currently loaded question-bank page.
      const snapshotCache = {};
      const selectedQuestionIds = [];

      (fullExam.questions || []).forEach((question) => {
        const questionId = getId(question.originalQuestion);

        if (!questionId) return;

        selectedQuestionIds.push(questionId);

        snapshotCache[questionId] = {
          _id: questionId,
          questionText: question.questionText || "",
          questionType: question.questionType,
          marks: Number(question.marks || 0),
          topic: question.topic || "",
          difficulty: question.difficulty || "",
          status: "active",
          subject: getId(fullExam.subject),
          classLevel: fullExam.schoolClass?.level || "",
        };
      });

      setQuestionCache(snapshotCache);

      setForm({
        title: fullExam.title || "",
        description: fullExam.description || "",
        instructions: fullExam.instructions || "",
        academicSessionId: getId(fullExam.academicSession),
        termId: getId(fullExam.term),
        classId: getId(fullExam.schoolClass),
        subjectId: getId(fullExam.subject),
        questionIds: selectedQuestionIds,
        passMarks: String(fullExam.passMarks ?? ""),
        durationMinutes: fullExam.durationMinutes ?? 60,
        startAt: toLocalDateTime(fullExam.startAt),
        endAt: toLocalDateTime(fullExam.endAt),
        shuffleQuestions: fullExam.shuffleQuestions !== false,
        shuffleOptions: fullExam.shuffleOptions !== false,
        allowBackNavigation: fullExam.allowBackNavigation !== false,
      });

      setQuestionPage(1);
      setQuestionSearch("");
      setQuestionTypeFilter("all");
      setQuestionDifficultyFilter("all");
      setModalOpen(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setModalOpen(false);
      setEditingId(null);
    }
  };

  const toggleQuestion = (questionId) => {
    const question = questions.find((item) => item._id === questionId);

    if (question) {
      setQuestionCache((current) => ({
        ...current,
        [questionId]: question,
      }));
    }

    setForm((current) => ({
      ...current,
      questionIds: current.questionIds.includes(questionId)
        ? current.questionIds.filter((id) => id !== questionId)
        : [...current.questionIds, questionId],
    }));
  };

  const removeSelectedQuestion = (questionId) => {
    setForm((current) => ({
      ...current,
      questionIds: current.questionIds.filter((id) => id !== questionId),
    }));
  };

  const handleSessionChange = (sessionId) => {
    setForm((current) => ({
      ...current,
      academicSessionId: sessionId,
      termId: "",
    }));
  };

  const handleClassChange = (classId) => {
    setForm((current) => ({
      ...current,
      classId,
      subjectId: "",
      questionIds: [],
    }));

    resetQuestionSelector();
  };

  const handleSubjectChange = (subjectId) => {
    setForm((current) => ({
      ...current,
      subjectId,
      questionIds: [],
    }));

    resetQuestionSelector();
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Enter an examination title.");
      return;
    }

    if (
      !form.academicSessionId ||
      !form.termId ||
      !form.classId ||
      !form.subjectId
    ) {
      toast.error("Complete all academic and class selections.");
      return;
    }

    if (!form.questionIds.length) {
      toast.error("Select at least one question.");
      return;
    }

    if (selectedQuestions.length !== form.questionIds.length) {
      toast.error(
        "Some selected questions could not be loaded. Reload questions before saving.",
      );
      return;
    }

    if (!form.startAt || !form.endAt) {
      toast.error("Set the examination start and end dates.");
      return;
    }

    if (
      !Number.isFinite(Number(form.passMarks)) ||
      Number(form.passMarks) < 0
    ) {
      toast.error("Enter a valid pass mark.");
      return;
    }

    if (Number(form.passMarks) > totalMarks) {
      toast.error("Pass marks cannot exceed the total examination marks.");
      return;
    }

    if (
      !Number.isInteger(Number(form.durationMinutes)) ||
      Number(form.durationMinutes) < 1 ||
      Number(form.durationMinutes) > 600
    ) {
      toast.error("Duration must be between 1 and 600 minutes.");
      return;
    }

    const startDate = new Date(form.startAt);
    const endDate = new Date(form.endAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      toast.error("The examination end time must be after its start time.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim(),
      academicSessionId: form.academicSessionId,
      termId: form.termId,
      classId: form.classId,
      subjectId: form.subjectId,
      questionIds: form.questionIds,
      passMarks: Number(form.passMarks),
      durationMinutes: Number(form.durationMinutes),
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      shuffleQuestions: form.shuffleQuestions,
      shuffleOptions: form.shuffleOptions,
      allowBackNavigation: form.allowBackNavigation,
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.patch(`/examinations/${editingId}`, payload);
        toast.success("Examination updated successfully.");
      } else {
        await api.post("/examinations", payload);
        toast.success("Examination created successfully.");
      }

      setModalOpen(false);
      setForm({ ...initialForm });
      setEditingId(null);
      resetQuestionSelector();
      await loadExaminations();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (exam, action) => {
    const messages = {
      publish:
        "Publish this examination? Students will be able to access it during its scheduled window.",
      close:
        "Close this examination? Students will no longer be able to start it.",
      cancel:
        "Cancel this examination? This action cannot be undone from this page.",
    };

    if (!window.confirm(messages[action])) return;

    setActionLoading(`${exam._id}-${action}`);

    try {
      await api.patch(`/examinations/${exam._id}/${action}`);
      toast.success(
        action === "publish"
          ? "Examination published."
          : action === "close"
            ? "Examination closed."
            : "Examination cancelled.",
      );
      setMenu(null);
      await loadExaminations(pagination.page || 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading("");
    }
  };

  const openDetails = async (exam) => {
    try {
      const response = await api.get(`/examinations/${exam._id}`);
      setSelectedExamination(response.data?.examination || exam);
      setDetailsOpen(true);
      setMenu(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const closeModal = () => {
    if (saving) return;

    questionRequestRef.current += 1;
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...initialForm });
    resetQuestionSelector();
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Examination Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, schedule, and manage school examinations.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={referencesLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={18} />
          Create Examination
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {[
          {
            label: "Total examinations",
            value: statistics.total,
            icon: FileText,
            color: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "Draft",
            value: statistics.draft,
            icon: Pencil,
            color: "bg-slate-100 text-slate-600",
          },
          {
            label: "Published",
            value: statistics.published,
            icon: Send,
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Closed",
            value: statistics.closed,
            icon: CheckCircle2,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Cancelled",
            value: statistics.cancelled,
            icon: XCircle,
            color: "bg-red-50 text-red-600",
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-2.5 ${stat.color}`}>
                  <Icon size={19} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search examination..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="all">All academic sessions</option>
            {sessions.map((session) => (
              <option key={session._id} value={session._id}>
                {session.name}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="all">All classes</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass._id} value={schoolClass._id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Examination table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Examination directory
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredExaminations.length} examination(s) displayed
            </p>
          </div>

          <button
            onClick={() => loadExaminations(pagination.page || 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <RefreshCw size={18} className="animate-spin" />
              Loading examinations...
            </div>
          </div>
        ) : filteredExaminations.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <FileText size={28} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">
              No examinations found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Create an examination or adjust your search and filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Examination</th>
                    <th className="px-5 py-3 font-semibold">Class / Subject</th>
                    <th className="px-5 py-3 font-semibold">Questions</th>
                    <th className="px-5 py-3 font-semibold">Schedule</th>
                    <th className="px-5 py-3 font-semibold">Duration</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredExaminations.map((exam) => (
                    <tr key={exam._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {exam.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {exam.academicSession?.name || "Academic session"}
                          {" · "}
                          {exam.term?.name || "Term"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {exam.schoolClass?.name || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {exam.subject?.name || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {exam.totalQuestions || exam.questions?.length || 0}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {exam.totalMarks || 0} marks
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-slate-700">
                          {formatDate(exam.startAt)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Until {formatDate(exam.endAt)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {exam.durationMinutes} mins
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(
                            exam.status,
                          )}`}
                        >
                          {exam.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(event) => {
                            const rect =
                              event.currentTarget.getBoundingClientRect();

                            setMenu({
                              exam,
                              top: rect.bottom + 6,
                              left: Math.max(12, rect.right - 180),
                            });
                          }}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          aria-label="Examination actions"
                        >
                          <MoreHorizontal size={19} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing {filteredExaminations.length} of{" "}
                {pagination.total || examinations.length} examinations
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.hasPreviousPage}
                  onClick={() =>
                    loadExaminations(Math.max(1, pagination.page - 1))
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-600">
                  Page {pagination.page || 1} of {pagination.totalPages || 1}
                </span>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => loadExaminations((pagination.page || 1) + 1)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action dropdown */}
      {menu &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setMenu(null)}
            />
            <div
              className="fixed z-[100] w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
              style={{ top: menu.top, left: menu.left }}
            >
              <button
                onClick={() => openDetails(menu.exam)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Eye size={15} /> View details
              </button>

              {menu.exam.status === "draft" && (
                <>
                  <button
                    onClick={() => {
                      const exam = menu.exam;
                      setMenu(null);
                      openEditModal(exam);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={15} /> Edit examination
                  </button>
                  <button
                    disabled={actionLoading.startsWith(menu.exam._id)}
                    onClick={() => handleAction(menu.exam, "publish")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <Send size={15} /> Publish
                  </button>
                </>
              )}

              {menu.exam.status === "published" && (
                <>
                  <button
                    disabled={actionLoading.startsWith(menu.exam._id)}
                    onClick={() => handleAction(menu.exam, "close")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} /> Close examination
                  </button>
                  <button
                    disabled={actionLoading.startsWith(menu.exam._id)}
                    onClick={() => handleAction(menu.exam, "cancel")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle size={15} /> Cancel examination
                  </button>
                </>
              )}
            </div>
          </>,
          document.body,
        )}

      {/* Create / Edit modal */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6">
            <div className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? "Edit examination" : "Create examination"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Configure the exam, select questions, and set the schedule.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="max-h-[75vh] space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
                  {/* Basic information */}
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-indigo-600" />
                      <h3 className="font-semibold text-slate-800">
                        Examination information
                      </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Examination title *
                        </label>
                        <input
                          required
                          value={form.title}
                          onChange={(e) => updateForm("title", e.target.value)}
                          placeholder="e.g. First Term Mathematics Examination"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={form.description}
                          onChange={(e) =>
                            updateForm("description", e.target.value)
                          }
                          placeholder="Brief description of this examination"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Student instructions
                        </label>
                        <textarea
                          rows={3}
                          value={form.instructions}
                          onChange={(e) =>
                            updateForm("instructions", e.target.value)
                          }
                          placeholder="Instructions students should read before starting..."
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* Academic setup */}
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <BookOpen size={18} className="text-indigo-600" />
                      <h3 className="font-semibold text-slate-800">
                        Academic details
                      </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Academic session *
                        </label>
                        <select
                          required
                          value={form.academicSessionId}
                          onChange={(e) => handleSessionChange(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                        >
                          <option value="">Select session</option>
                          {sessions.map((session) => (
                            <option key={session._id} value={session._id}>
                              {session.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Term *
                        </label>
                        <select
                          required
                          value={form.termId}
                          onChange={(e) => updateForm("termId", e.target.value)}
                          disabled={!form.academicSessionId}
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-50"
                        >
                          <option value="">Select term</option>
                          {availableTerms.map((term) => (
                            <option key={term._id} value={term._id}>
                              {term.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Class *
                        </label>
                        <select
                          required
                          value={form.classId}
                          onChange={(e) => handleClassChange(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                        >
                          <option value="">Select class</option>
                          {classes
                            .filter((item) => item.status === "active")
                            .map((item) => (
                              <option key={item._id} value={item._id}>
                                {item.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Subject *
                        </label>
                        <select
                          required
                          value={form.subjectId}
                          onChange={(e) => handleSubjectChange(e.target.value)}
                          disabled={!form.classId}
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-50"
                        >
                          <option value="">Select subject</option>
                          {availableSubjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>
                              {subject.name} ({subject.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* Questions */}
                  <section>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <ListChecks size={18} className="text-indigo-600" />
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            Select examination questions *
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Active questions matching the selected class and
                            subject.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => loadQuestions(questionPage)}
                        disabled={
                          questionsLoading || !form.classId || !form.subjectId
                        }
                        className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={13}
                          className={questionsLoading ? "animate-spin" : ""}
                        />
                        Reload questions
                      </button>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        ["Selected", form.questionIds.length],
                        ["Total marks", totalMarks],
                        ["Objective", objectiveCount],
                        ["Theory", theoryCount],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-lg font-bold text-slate-900">
                            {value}
                          </p>
                          <p className="text-xs text-slate-500">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Selected question list remains available across pages. */}
                    {selectedQuestions.length > 0 && (
                      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-indigo-900">
                            Selected questions ({form.questionIds.length})
                          </p>
                          <p className="text-xs text-indigo-700">
                            {totalMarks} total marks
                          </p>
                        </div>

                        <div className="max-h-36 space-y-1.5 overflow-y-auto">
                          {selectedQuestions.map((question, index) => (
                            <div
                              key={question._id}
                              className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-slate-700">
                                  {index + 1}.{" "}
                                  {question.questionText ||
                                    "Saved examination question"}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-500">
                                  {getQuestionTypeLabel(question)} ·{" "}
                                  {question.marks} mark(s)
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  removeSelectedQuestion(question._id)
                                }
                                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Remove selected question"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!form.classId || !form.subjectId ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                        Select a class and subject to view matching questions.
                      </div>
                    ) : (
                      <>
                        {/* Question search and filters */}
                        <div className="mb-3 grid gap-2 sm:grid-cols-3">
                          <div className="relative sm:col-span-1">
                            <Search
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              value={questionSearch}
                              onChange={(event) => {
                                setQuestionSearch(event.target.value);
                                setQuestionPage(1);
                              }}
                              placeholder="Search questions..."
                              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>

                          <select
                            value={questionTypeFilter}
                            onChange={(event) => {
                              setQuestionTypeFilter(event.target.value);
                              setQuestionPage(1);
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500"
                          >
                            <option value="all">All question types</option>
                            <option value="objective">Objective</option>
                            <option value="theory">Theory</option>
                          </select>

                          <select
                            value={questionDifficultyFilter}
                            onChange={(event) => {
                              setQuestionDifficultyFilter(event.target.value);
                              setQuestionPage(1);
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500"
                          >
                            <option value="all">All difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>

                        {questionsLoading ? (
                          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
                            <RefreshCw size={17} className="animate-spin" />
                            Loading questions...
                          </div>
                        ) : availableQuestions.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                            <AlertCircle
                              className="mx-auto text-slate-400"
                              size={24}
                            />
                            <p className="mt-2 text-sm font-medium text-slate-700">
                              No matching active questions found
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Try changing your search or filters, or add and
                              activate questions for this subject and class
                              level.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                            {availableQuestions.map((question, index) => {
                              const checked = form.questionIds.includes(
                                question._id,
                              );

                              const questionNumber =
                                (questionPagination.page - 1) *
                                  questionPagination.limit +
                                index +
                                1;

                              return (
                                <label
                                  key={question._id}
                                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                    checked
                                      ? "border-indigo-300 bg-indigo-50/60"
                                      : "border-transparent bg-slate-50 hover:border-slate-200"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      toggleQuestion(question._id)
                                    }
                                    className="mt-1 h-4 w-4 accent-indigo-600"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-500">
                                        Question {questionNumber}
                                      </span>
                                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                                        {getQuestionTypeLabel(question)}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        {question.marks} mark(s)
                                      </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-sm text-slate-800">
                                      {question.questionText}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {question.topic || "General"} ·{" "}
                                      {question.difficulty || "—"}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Question pagination */}
                        <div className="mt-3 flex flex-col gap-3 rounded-xl bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-slate-500">
                            Showing {availableQuestions.length} of{" "}
                            {questionPagination.total} matching questions
                            {" · "}
                            Page {questionPagination.page} of{" "}
                            {questionPagination.totalPages || 1}
                          </p>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                questionsLoading ||
                                !questionPagination.hasPreviousPage
                              }
                              onClick={() =>
                                loadQuestions(
                                  Math.max(1, questionPagination.page - 1),
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ChevronLeft size={14} />
                              Previous
                            </button>

                            <button
                              type="button"
                              disabled={
                                questionsLoading ||
                                !questionPagination.hasNextPage
                              }
                              onClick={() =>
                                loadQuestions(questionPagination.page + 1)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Next
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* Schedule and marks */}
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays size={18} className="text-indigo-600" />
                      <h3 className="font-semibold text-slate-800">
                        Schedule and grading
                      </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Start date and time *
                        </label>
                        <input
                          required
                          type="datetime-local"
                          value={form.startAt}
                          onChange={(e) =>
                            updateForm("startAt", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          End date and time *
                        </label>
                        <input
                          required
                          type="datetime-local"
                          value={form.endAt}
                          onChange={(e) => updateForm("endAt", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Duration (minutes) *
                        </label>
                        <input
                          required
                          type="number"
                          min="1"
                          max="600"
                          value={form.durationMinutes}
                          onChange={(e) =>
                            updateForm("durationMinutes", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Pass marks *
                        </label>
                        <input
                          required
                          type="number"
                          min="0"
                          max={totalMarks}
                          value={form.passMarks}
                          onChange={(e) =>
                            updateForm("passMarks", e.target.value)
                          }
                          placeholder="e.g. 40"
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Maximum available marks: {totalMarks}
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* Settings */}
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <Settings2 size={18} className="text-indigo-600" />
                      <h3 className="font-semibold text-slate-800">
                        Examination settings
                      </h3>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          key: "shuffleQuestions",
                          label: "Shuffle questions",
                          description: "Present questions in a random order.",
                        },
                        {
                          key: "shuffleOptions",
                          label: "Shuffle options",
                          description: "Randomize objective answer options.",
                        },
                        {
                          key: "allowBackNavigation",
                          label: "Allow back navigation",
                          description:
                            "Allow students to revisit previous questions.",
                        },
                      ].map((setting) => (
                        <label
                          key={setting.key}
                          className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={form[setting.key]}
                            onChange={(e) =>
                              updateForm(setting.key, e.target.checked)
                            }
                            className="mt-1 h-4 w-4 accent-indigo-600"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">
                              {setting.label}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              {setting.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>

                  {/* Summary */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-indigo-900">
                          Examination summary
                        </p>
                        <p className="mt-1 text-xs leading-5 text-indigo-800">
                          {form.questionIds.length} questions · {totalMarks}{" "}
                          total marks · {form.durationMinutes || 0} minutes ·
                          Pass mark: {form.passMarks || 0}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-indigo-700">
                          The examination will be saved as a draft. You can
                          publish it after reviewing the details.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || questionsLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving && <RefreshCw size={16} className="animate-spin" />}
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save changes"
                        : "Create examination"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Details modal */}
      {detailsOpen &&
        selectedExamination &&
        createPortal(
          <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm">
            <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(
                      selectedExamination.status,
                    )}`}
                  >
                    {selectedExamination.status}
                  </span>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">
                    {selectedExamination.title}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5 sm:p-6">
                {selectedExamination.description && (
                  <p className="text-sm leading-6 text-slate-600">
                    {selectedExamination.description}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [
                      "Academic session",
                      selectedExamination.academicSession?.name,
                    ],
                    ["Term", selectedExamination.term?.name],
                    ["Class", selectedExamination.schoolClass?.name],
                    ["Subject", selectedExamination.subject?.name],
                    ["Questions", selectedExamination.totalQuestions],
                    ["Total marks", selectedExamination.totalMarks],
                    ["Pass marks", selectedExamination.passMarks],
                    [
                      "Duration",
                      `${selectedExamination.durationMinutes} minutes`,
                    ],
                    ["Starts", formatDate(selectedExamination.startAt)],
                    ["Ends", formatDate(selectedExamination.endAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {value ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedExamination.instructions && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">
                      Student instructions
                    </h3>
                    <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {selectedExamination.instructions}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">
                    Examination questions
                  </h3>
                  <div className="space-y-2">
                    {(selectedExamination.questions || []).map(
                      (question, index) => (
                        <div
                          key={
                            question._id || question.originalQuestion || index
                          }
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-500">
                              Question {index + 1}
                            </span>
                            <span className="text-xs text-slate-500">
                              {question.questionType} · {question.marks} marks
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-800">
                            {question.questionText}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">
                    Examination settings
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      [
                        "Shuffle questions",
                        selectedExamination.shuffleQuestions,
                      ],
                      ["Shuffle options", selectedExamination.shuffleOptions],
                      [
                        "Allow back navigation",
                        selectedExamination.allowBackNavigation,
                      ],
                    ].map(([label, enabled]) => (
                      <span
                        key={label}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          enabled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {label}: {enabled ? "Yes" : "No"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4">
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
