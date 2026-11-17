import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  BookOpen,
  FileQuestion,
  CheckCircle2,
  Clock,
  Archive,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Loader2,
  Filter,
  Eye,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const CLASS_LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

const INITIAL_FORM = {
  subject: "",
  classLevel: "",
  topic: "",
  subtopic: "",
  questionText: "",
  questionType: "objective",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
  markingGuide: "",
  explanation: "",
  marks: 1,
  difficulty: "medium",
  status: "draft",
};

const getQuestionType = (question) =>
  question?.questionType || question?.type || "objective";

const getSubjectName = (question) =>
  question?.subject?.name || question?.subject?.title || "Unknown subject";

const getId = (value) =>
  typeof value === "object" && value !== null
    ? value._id || value.id || ""
    : value || "";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

const getInitialForm = (question) => {
  if (!question) return { ...INITIAL_FORM };

  return {
    subject: getId(question.subject),
    classLevel: question.classLevel || "",
    topic: question.topic || "",
    subtopic: question.subtopic || "",
    questionText: question.questionText || "",
    questionType: getQuestionType(question),
    options:
      question.options?.length > 0
        ? question.options.map((option) => ({
            text: option.text || "",
            isCorrect: Boolean(option.isCorrect),
          }))
        : INITIAL_FORM.options.map((option) => ({ ...option })),
    markingGuide: question.markingGuide || "",
    explanation: question.explanation || "",
    marks: question.marks || 1,
    difficulty: question.difficulty || "medium",
    status: question.status || "draft",
  };
};

export default function TeacherQuestionBank() {
  const { user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    subject: "",
    classLevel: "",
    questionType: "",
    difficulty: "",
    status: "",
  });

  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });

  const fetchSubjects = useCallback(async () => {
    try {
      setSubjectsLoading(true);
      const response = await api.get("/subjects");

      setSubjects(response.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load subjects."));
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await api.get("/questions/statistics");

      setStatistics(
        response.data?.statistics || response.data?.data || response.data || {},
      );
    } catch (error) {
      console.error("Question statistics error:", error);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pagination.limit,
      };

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response = await api.get("/questions", { params });

      const result = response.data || {};

      setQuestions(result.questions || result.data?.questions || []);

      if (result.pagination) {
        setPagination((previous) => ({
          ...previous,
          ...result.pagination,
        }));
      } else if (result.data?.pagination) {
        setPagination((previous) => ({
          ...previous,
          ...result.data.pagination,
        }));
      } else {
        const list = result.questions || result.data?.questions || [];

        setPagination((previous) => ({
          ...previous,
          total: list.length,
          pages: 1,
        }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load questions."));
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pagination.limit]);

  useEffect(() => {
    fetchSubjects();
    fetchStatistics();
  }, [fetchSubjects, fetchStatistics]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setForm({ ...INITIAL_FORM });
    setShowModal(true);
  };

  const openEditModal = (question) => {
    setEditingQuestion(question);
    setForm(getInitialForm(question));
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingQuestion(null);
    setForm({ ...INITIAL_FORM });
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const changeQuestionType = (type) => {
    setForm((previous) => ({
      ...previous,
      questionType: type,
      options:
        type === "objective"
          ? [
              { text: "", isCorrect: true },
              { text: "", isCorrect: false },
            ]
          : [],
      markingGuide: type === "objective" ? "" : previous.markingGuide,
    }));
  };

  const addOption = () => {
    if (form.options.length >= 6) {
      toast.error("A question can have a maximum of 6 options.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      options: [...previous.options, { text: "", isCorrect: false }],
    }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) {
      toast.error("An objective question needs at least 2 options.");
      return;
    }

    setForm((previous) => {
      const options = previous.options.filter(
        (_, optionIndex) => optionIndex !== index,
      );

      if (!options.some((option) => option.isCorrect)) {
        options[0].isCorrect = true;
      }

      return { ...previous, options };
    });
  };

  const updateOptionText = (index, text) => {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text } : option,
      ),
    }));
  };

  const setCorrectOption = (index) => {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      })),
    }));
  };

  const validateForm = () => {
    if (!form.subject) {
      toast.error("Please select a subject.");
      return false;
    }

    if (!form.classLevel) {
      toast.error("Please select a class level.");
      return false;
    }

    if (!form.topic.trim()) {
      toast.error("Please enter the question topic.");
      return false;
    }

    if (!form.questionText.trim()) {
      toast.error("Please enter the question.");
      return false;
    }

    if (!Number.isFinite(Number(form.marks)) || Number(form.marks) <= 0) {
      toast.error("Marks must be greater than zero.");
      return false;
    }

    if (form.questionType === "objective") {
      if (form.options.length < 2 || form.options.length > 6) {
        toast.error("Objective questions need 2 to 6 options.");
        return false;
      }

      if (form.options.some((option) => !option.text.trim())) {
        toast.error("Please complete all answer options.");
        return false;
      }

      if (form.options.filter((option) => option.isCorrect).length !== 1) {
        toast.error("Select exactly one correct answer.");
        return false;
      }
    }

    if (
      form.questionType === "theory" &&
      form.status === "active" &&
      !form.markingGuide.trim()
    ) {
      toast.error("An active theory question needs a marking guide.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      subject: form.subject,
      classLevel: form.classLevel,
      topic: form.topic.trim(),
      subtopic: form.subtopic.trim(),
      questionText: form.questionText.trim(),
      questionType: form.questionType,
      marks: Number(form.marks),
      difficulty: form.difficulty,
      status: form.status,
      explanation: form.explanation.trim(),
      ...(form.questionType === "objective"
        ? {
            options: form.options.map((option) => ({
              text: option.text.trim(),
              isCorrect: option.isCorrect,
            })),
          }
        : {
            markingGuide: form.markingGuide.trim(),
          }),
    };

    try {
      setSubmitting(true);

      if (editingQuestion) {
        await api.patch(`/questions/${editingQuestion._id}`, payload);
        toast.success("Question updated successfully.");
      } else {
        await api.post("/questions", payload);
        toast.success("Question created successfully.");
      }

      closeModal();
      await Promise.all([fetchQuestions(), fetchStatistics()]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save question."));
    } finally {
      setSubmitting(false);
    }
  };

  const archiveQuestion = async (question) => {
    const confirmed = window.confirm(
      "Are you sure you want to archive this question? It will no longer be available for new examinations.",
    );

    if (!confirmed) return;

    try {
      await api.patch(`/questions/${question._id}/archive`);

      toast.success("Question archived successfully.");

      await Promise.all([fetchQuestions(), fetchStatistics()]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to archive question."));
    }
  };

  const applySearch = (event) => {
    event.preventDefault();

    setPage(1);
    setFilters((previous) => ({
      ...previous,
      search: searchInput.trim(),
    }));
  };

  const updateFilter = (field, value) => {
    setPage(1);
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setPage(1);
    setFilters({
      search: "",
      subject: "",
      classLevel: "",
      questionType: "",
      difficulty: "",
      status: "",
    });
  };

  const totalPages = Math.max(1, pagination.pages || 1);

  const currentUserId = getId(user);

  const isQuestionOwner = (question) => {
    const creatorId = getId(question.createdBy);

    return (
      currentUserId && creatorId && String(currentUserId) === String(creatorId)
    );
  };

  const statCards = useMemo(
    () => [
      {
        label: "Total Questions",
        value: statistics.total ?? statistics.totalQuestions ?? 0,
        icon: FileQuestion,
        color: "bg-blue-50 text-blue-600",
      },
      {
        label: "Active Questions",
        value: statistics.active ?? statistics.activeQuestions ?? 0,
        icon: CheckCircle2,
        color: "bg-green-50 text-green-600",
      },
      {
        label: "Objective",
        value: statistics.objective ?? statistics.objectiveQuestions ?? 0,
        icon: BookOpen,
        color: "bg-purple-50 text-purple-600",
      },
      {
        label: "Theory",
        value: statistics.theory ?? statistics.theoryQuestions ?? 0,
        icon: Clock,
        color: "bg-orange-50 text-orange-600",
      },
    ],
    [statistics],
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, organize and manage your examination questions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Question
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    {stat.value}
                  </h2>
                </div>

                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Find Questions</h2>
        </div>

        <form onSubmit={applySearch}>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search question text or topic..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={filters.subject}
            onChange={(event) => updateFilter("subject", event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={filters.classLevel}
            onChange={(event) => updateFilter("classLevel", event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All classes</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            value={filters.questionType}
            onChange={(event) =>
              updateFilter("questionType", event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All question types</option>
            <option value="objective">Objective</option>
            <option value="theory">Theory</option>
          </select>

          <select
            value={filters.difficulty}
            onChange={(event) => updateFilter("difficulty", event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Question list */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Your Questions</h2>
            <p className="mt-1 text-xs text-gray-500">
              {pagination.total || questions.length} questions found
            </p>
          </div>

          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : questions.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <FileQuestion size={26} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              No questions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a question or adjust your filters to see results.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create question
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {questions.map((question) => (
              <div
                key={question._id}
                className="flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">
                      {getQuestionType(question)}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        question.status === "active"
                          ? "bg-green-50 text-green-700"
                          : question.status === "archived"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {question.status || "draft"}
                    </span>

                    <span className="text-xs capitalize text-gray-500">
                      {question.difficulty || "medium"} difficulty
                    </span>
                  </div>

                  <h3 className="line-clamp-2 font-medium leading-6 text-gray-900">
                    {question.questionText}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>{getSubjectName(question)}</span>
                    <span>{question.classLevel}</span>
                    <span>{question.topic}</span>
                    <span>{question.marks} mark(s)</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setViewingQuestion(question)}
                    title="View question"
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
                  >
                    <Eye size={17} />
                  </button>

                  {isQuestionOwner(question) && (
                    <>
                      <button
                        onClick={() => openEditModal(question)}
                        title="Edit question"
                        className="rounded-lg border border-gray-200 p-2 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Pencil size={17} />
                      </button>

                      {question.status !== "archived" && (
                        <button
                          onClick={() => archiveQuestion(question)}
                          title="Archive question"
                          className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Archive size={17} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && questions.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Showing {questions.length} of{" "}
              {pagination.total || questions.length} questions
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600">
                {page} / {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((previous) => Math.min(totalPages, previous + 1))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingQuestion ? "Edit Question" : "Create Question"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Add a question to your subject question bank.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
            >
              {/* Subject and class */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Subject *
                  </label>
                  <select
                    required
                    value={form.subject}
                    onChange={(event) =>
                      updateForm("subject", event.target.value)
                    }
                    disabled={subjectsLoading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">
                      {subjectsLoading
                        ? "Loading subjects..."
                        : "Select subject"}
                    </option>
                    {subjects
                      .filter((subject) => subject.status !== "inactive")
                      .map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Class level *
                  </label>
                  <select
                    required
                    value={form.classLevel}
                    onChange={(event) =>
                      updateForm("classLevel", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Select class</option>
                    {CLASS_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Topic *
                  </label>
                  <input
                    required
                    value={form.topic}
                    onChange={(event) =>
                      updateForm("topic", event.target.value)
                    }
                    placeholder="e.g. Algebra"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Subtopic
                  </label>
                  <input
                    value={form.subtopic}
                    onChange={(event) =>
                      updateForm("subtopic", event.target.value)
                    }
                    placeholder="e.g. Linear equations"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Question type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Question type *
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {["objective", "theory"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => changeQuestionType(type)}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium capitalize transition ${
                        form.questionType === type
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question text */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Question *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.questionText}
                  onChange={(event) =>
                    updateForm("questionText", event.target.value)
                  }
                  placeholder="Enter the full question..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Objective options */}
              {form.questionType === "objective" && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Answer options
                      </h3>
                      <p className="text-xs text-gray-500">
                        Select the radio button beside the correct answer.
                      </p>
                    </div>

                    <span className="text-xs text-gray-500">
                      {form.options.length}/6 options
                    </span>
                  </div>

                  <div className="space-y-3">
                    {form.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={option.isCorrect}
                          onChange={() => setCorrectOption(index)}
                          className="h-4 w-4 accent-indigo-600"
                          title="Mark as correct answer"
                        />

                        <span className="w-6 text-sm font-semibold text-gray-500">
                          {String.fromCharCode(65 + index)}.
                        </span>

                        <input
                          value={option.text}
                          onChange={(event) =>
                            updateOptionText(index, event.target.value)
                          }
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />

                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          disabled={form.options.length <= 2}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                          title="Remove option"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addOption}
                    disabled={form.options.length >= 6}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                  >
                    <Plus size={16} />
                    Add option
                  </button>
                </div>
              )}

              {/* Theory marking guide */}
              {form.questionType === "theory" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Marking guide
                    {form.status === "active" && " *"}
                  </label>
                  <textarea
                    rows={4}
                    value={form.markingGuide}
                    onChange={(event) =>
                      updateForm("markingGuide", event.target.value)
                    }
                    placeholder="Explain the expected answer and how marks should be awarded..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The marking guide is for teachers and will not be shown to
                    students during examinations.
                  </p>
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Explanation (optional)
                </label>
                <textarea
                  rows={2}
                  value={form.explanation}
                  onChange={(event) =>
                    updateForm("explanation", event.target.value)
                  }
                  placeholder="Add an explanation for this question..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Marks, difficulty and status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Marks *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.marks}
                    onChange={(event) =>
                      updateForm("marks", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Difficulty
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(event) =>
                      updateForm("difficulty", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm("status", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>

              {form.status === "draft" && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>
                    Draft questions are saved but cannot be selected for
                    examinations until activated.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting && <Loader2 size={17} className="animate-spin" />}
                  {editingQuestion ? "Save Changes" : "Create Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question preview */}
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="font-bold text-gray-900">Question Details</h2>
              <button
                onClick={() => setViewingQuestion(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium capitalize text-indigo-700">
                  {getQuestionType(viewingQuestion)}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 capitalize text-gray-600">
                  {viewingQuestion.status}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 capitalize text-gray-600">
                  {viewingQuestion.difficulty}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {getSubjectName(viewingQuestion)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {viewingQuestion.classLevel}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Topic</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {viewingQuestion.topic}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Marks</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {viewingQuestion.marks}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-500">
                  QUESTION
                </h3>
                <p className="whitespace-pre-wrap text-gray-900">
                  {viewingQuestion.questionText}
                </p>
              </div>

              {getQuestionType(viewingQuestion) === "objective" && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-500">
                    ANSWER OPTIONS
                  </h3>
                  <div className="space-y-2">
                    {viewingQuestion.options?.map((option, index) => (
                      <div
                        key={option._id || index}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                          option.isCorrect
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-gray-200 text-gray-700"
                        }`}
                      >
                        <span className="font-semibold">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="flex-1">{option.text}</span>
                        {option.isCorrect && <CheckCircle2 size={17} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getQuestionType(viewingQuestion) === "theory" && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-500">
                    MARKING GUIDE
                  </h3>
                  <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                    {viewingQuestion.markingGuide ||
                      "No marking guide provided."}
                  </p>
                </div>
              )}

              {viewingQuestion.explanation && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-500">
                    EXPLANATION
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {viewingQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
