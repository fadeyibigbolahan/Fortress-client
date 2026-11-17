import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStudentName = (student) => {
  if (!student) return "Unknown student";

  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
};

export default function TeacherGradingWorkspace() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [formValues, setFormValues] = useState({});

  const fetchAttempt = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await api.get(`/results/teacher/attempts/${attemptId}`);

      const data = response.data.data;

      setAttempt(data);

      const initialValues = {};

      (data.questions || [])
        .filter((question) => question.questionType === "theory")
        .forEach((question) => {
          initialValues[question.id] = {
            awardedMarks:
              question.awardedMarks === null ||
              question.awardedMarks === undefined
                ? ""
                : String(question.awardedMarks),
            feedback: question.teacherFeedback || "",
          };
        });

      setFormValues(initialValues);
    } catch (error) {
      console.error("Grading workspace error:", error);

      const message =
        error.response?.data?.message ||
        "Unable to load this examination attempt.";

      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  const theoryQuestions = useMemo(
    () =>
      (attempt?.questions || []).filter(
        (question) => question.questionType === "theory",
      ),
    [attempt],
  );

  const activeQuestion = theoryQuestions[activeQuestionIndex];

  const gradedCount = theoryQuestions.filter(
    (question) => question.gradingStatus === "graded",
  ).length;

  const pendingCount = theoryQuestions.length - gradedCount;

  const progress =
    theoryQuestions.length > 0
      ? (gradedCount / theoryQuestions.length) * 100
      : 100;

  const updateForm = (questionId, field, value) => {
    setFormValues((previous) => ({
      ...previous,
      [questionId]: {
        ...previous[questionId],
        [field]: value,
      },
    }));
  };

  const saveGrade = async (question) => {
    const values = formValues[question.id] || {};

    if (values.awardedMarks === "" || values.awardedMarks === undefined) {
      toast.error("Enter the marks awarded before saving.");
      return;
    }

    const awardedMarks = Number(values.awardedMarks);

    if (!Number.isFinite(awardedMarks)) {
      toast.error("Enter a valid mark.");
      return;
    }

    if (awardedMarks < 0 || awardedMarks > question.marks) {
      toast.error(`Marks must be between 0 and ${question.marks}.`);
      return;
    }

    if ((values.feedback || "").length > 2000) {
      toast.error("Feedback cannot exceed 2,000 characters.");
      return;
    }

    try {
      setSaving((previous) => ({
        ...previous,
        [question.id]: true,
      }));

      const response = await api.patch(
        `/results/teacher/attempts/${attemptId}/questions/${question.id}/grade`,
        {
          awardedMarks,
          feedback: values.feedback || "",
        },
      );

      const result = response.data.data;

      setAttempt((previous) => ({
        ...previous,
        gradingStatus: result.attemptGradingStatus,
        questions: previous.questions.map((item) =>
          item.id === question.id
            ? {
                ...item,
                awardedMarks: result.question.awardedMarks,
                gradingStatus: result.question.gradingStatus,
                teacherFeedback: values.feedback || "",
              }
            : item,
        ),
      }));

      toast.success(
        response.data.message || "Theory answer graded successfully.",
      );
    } catch (error) {
      console.error("Save grading error:", error);

      toast.error(
        error.response?.data?.message || "Unable to save this grading.",
      );
    } finally {
      setSaving((previous) => ({
        ...previous,
        [question.id]: false,
      }));
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < theoryQuestions.length) {
      setActiveQuestionIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto mb-3 h-9 w-9 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">
            Loading examination responses...
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !attempt) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>

        <h2 className="text-lg font-bold text-slate-900">
          Unable to open grading workspace
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {loadError || "The examination attempt could not be found."}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate("/teacher/grading")}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Back to queue
          </button>

          <button
            onClick={fetchAttempt}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const isResultLocked = ["approved", "released"].includes(
    attempt.gradingStatus,
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => navigate("/teacher/grading")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to grading queue
          </button>

          <p className="mb-1 text-sm font-medium text-blue-600">
            TEACHER WORKSPACE
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            Grading Workspace
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review and grade the student's theory responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              isResultLocked
                ? "bg-green-50 text-green-700"
                : attempt.gradingStatus === "graded"
                  ? "bg-green-50 text-green-700"
                  : "bg-orange-50 text-orange-700"
            }`}
          >
            {isResultLocked
              ? "Result approved / released"
              : attempt.gradingStatus === "graded"
                ? "Grading completed"
                : "Grading in progress"}
          </span>
        </div>
      </div>

      {/* Student and examination details */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfoCard
          icon={UserRound}
          label="Student"
          value={getStudentName(attempt.student)}
          description={
            attempt.student?.admissionNumber || "Admission number unavailable"
          }
        />

        <InfoCard
          icon={GraduationCap}
          label="Class"
          value={
            attempt.schoolClass?.name ||
            [attempt.schoolClass?.level, attempt.schoolClass?.arm]
              .filter(Boolean)
              .join(" ") ||
            "Class unavailable"
          }
          description="Examination class"
        />

        <InfoCard
          icon={FileText}
          label="Examination"
          value={attempt.examination?.title || "Examination"}
          description={`Submitted ${formatDate(attempt.submittedAt)}`}
        />
      </section>

      {/* Grading progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Grading Progress</h2>
            <p className="mt-1 text-sm text-slate-500">
              Track the theory responses you have marked.
            </p>
          </div>

          <div className="flex gap-5">
            <ProgressStat
              label="Graded"
              value={gradedCount}
              color="text-green-600"
            />
            <ProgressStat
              label="Remaining"
              value={pendingCount}
              color="text-orange-600"
            />
            <ProgressStat
              label="Total"
              value={theoryQuestions.length}
              color="text-slate-900"
            />
          </div>
        </div>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>{Math.round(progress)}% completed</span>
          <span>
            {gradedCount} of {theoryQuestions.length} theory questions
          </span>
        </div>
      </section>

      {isResultLocked && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              This result is locked.
            </p>
            <p className="mt-1 text-sm text-green-700">
              An administrator or examination officer has approved or released
              this result. Grading changes are no longer permitted.
            </p>
          </div>
        </div>
      )}

      {/* No theory questions */}
      {theoryQuestions.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-500" />
          <h2 className="font-bold text-slate-900">
            No theory responses to grade
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            This examination does not contain any theory questions.
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Question navigator */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Questions</h2>
              <span className="text-xs text-slate-400">
                {theoryQuestions.length} total
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-4">
              {theoryQuestions.map((question, index) => {
                const isActive = index === activeQuestionIndex;
                const isGraded = question.gradingStatus === "graded";

                return (
                  <button
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    className={`relative flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white"
                        : isGraded
                          ? "border-green-200 bg-green-50 text-green-700 hover:border-green-400"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                    }`}
                    title={`Question ${index + 1}`}
                  >
                    {index + 1}
                    {isGraded && (
                      <CheckCircle2
                        size={12}
                        className={`absolute -right-1 -top-1 rounded-full ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-white text-green-600"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
              <Legend color="bg-green-500" label="Graded" />
              <Legend color="bg-blue-600" label="Current question" />
              <Legend color="bg-slate-300" label="Awaiting grading" />
            </div>
          </aside>

          {/* Active question */}
          {activeQuestion && (
            <section className="min-w-0 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Theory response
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      Question {activeQuestionIndex + 1}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                      Maximum: {activeQuestion.marks} marks
                    </span>

                    <span
                      className={`rounded-full px-3 py-2 text-xs font-semibold ${
                        activeQuestion.gradingStatus === "graded"
                          ? "bg-green-50 text-green-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {activeQuestion.gradingStatus === "graded"
                        ? "Graded"
                        : "Awaiting grading"}
                    </span>
                  </div>
                </div>

                <div className="space-y-6 p-5">
                  {/* Question text */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-500">
                      QUESTION
                    </h3>
                    <div className="rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-800">
                      {activeQuestion.questionText ||
                        "Question text unavailable."}
                    </div>
                  </div>

                  {/* Student answer */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-500">
                        STUDENT'S RESPONSE
                      </h3>
                      <span className="text-xs text-slate-400">
                        Submitted answer
                      </span>
                    </div>

                    <div className="min-h-36 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-800">
                      {activeQuestion.responseText?.trim() ||
                        "The student did not provide an answer."}
                    </div>
                  </div>

                  {/* Marking guide */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <BookOpen size={16} />
                      MARKING GUIDE
                    </h3>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5 text-sm leading-7 text-slate-700">
                      {activeQuestion.markingGuide?.trim() ||
                        "No marking guide was provided for this question."}
                    </div>
                  </div>

                  {/* Marking form */}
                  <div className="rounded-xl border border-slate-200 p-5">
                    <div className="mb-5">
                      <h3 className="font-bold text-slate-900">Award Marks</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Assess the student's answer using the marking guide.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Marks Awarded
                        </label>

                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={activeQuestion.marks}
                            step="any"
                            disabled={isResultLocked}
                            value={
                              formValues[activeQuestion.id]?.awardedMarks ?? ""
                            }
                            onChange={(e) =>
                              updateForm(
                                activeQuestion.id,
                                "awardedMarks",
                                e.target.value,
                              )
                            }
                            placeholder="Enter marks"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-24 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            / {activeQuestion.marks} marks
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          Enter a value between 0 and {activeQuestion.marks}.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Grading Status
                        </label>

                        <div className="flex h-[46px] items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm text-slate-600">
                          {activeQuestion.gradingStatus === "graded" ? (
                            <>
                              <CheckCircle2
                                size={17}
                                className="text-green-600"
                              />
                              Previously graded
                            </>
                          ) : (
                            <>
                              <Clock3 size={17} className="text-orange-500" />
                              Awaiting grading
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Teacher Feedback
                      </label>

                      <textarea
                        rows={4}
                        maxLength={2000}
                        disabled={isResultLocked}
                        value={formValues[activeQuestion.id]?.feedback ?? ""}
                        onChange={(e) =>
                          updateForm(
                            activeQuestion.id,
                            "feedback",
                            e.target.value,
                          )
                        }
                        placeholder="Add comments or feedback for this student's response..."
                        className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      />

                      <p className="mt-1 text-right text-xs text-slate-400">
                        {(formValues[activeQuestion.id]?.feedback || "").length}{" "}
                        / 2,000 characters
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                      <button
                        onClick={() => goToQuestion(activeQuestionIndex - 1)}
                        disabled={activeQuestionIndex === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={17} />
                        Previous
                      </button>

                      {!isResultLocked && (
                        <button
                          onClick={() => saveGrade(activeQuestion)}
                          disabled={!!saving[activeQuestion.id]}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving[activeQuestion.id] ? (
                            <LoaderCircle size={17} className="animate-spin" />
                          ) : (
                            <Save size={17} />
                          )}

                          {saving[activeQuestion.id]
                            ? "Saving..."
                            : "Save Grading"}
                        </button>
                      )}

                      <button
                        onClick={() => goToQuestion(activeQuestionIndex + 1)}
                        disabled={
                          activeQuestionIndex === theoryQuestions.length - 1
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Completion notice */}
      {theoryQuestions.length > 0 && pendingCount === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
          <div>
            <h3 className="font-bold text-green-800">
              All theory responses have been graded!
            </h3>
            <p className="mt-1 text-sm leading-6 text-green-700">
              This examination attempt has completed grading. Its result is now
              available for administrator or examination officer review. It has
              not been released to the student.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => navigate("/teacher/grading")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Return to grading queue
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-1 break-words font-semibold text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressStat({ label, value, color }) {
  return (
    <div className="text-right">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}
