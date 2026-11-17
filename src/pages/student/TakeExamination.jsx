import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Save,
  Send,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getQuestionAnswer(question) {
  if (question.questionType === "objective") {
    return question.selectedOptionId || "";
  }

  return question.responseText || "";
}

export default function TakeExamination() {
  const { examinationId } = useParams();
  const navigate = useNavigate();

  const [examination, setExamination] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [active, setActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [savingQuestions, setSavingQuestions] = useState({});
  const [online, setOnline] = useState(navigator.onLine);

  const timerRef = useRef(null);
  const saveTimersRef = useRef({});
  const pendingSavesRef = useRef({});
  const latestAnswersRef = useRef({});
  const submittingRef = useRef(false);
  const expiredRef = useRef(false);

  const questions = attempt?.questions || [];
  const current = questions[currentQuestion];

  const answeredCount = questions.filter((question) => {
    const answer = answers[question.id];

    if (question.questionType === "objective") {
      return Boolean(answer);
    }

    return typeof answer === "string" && answer.trim().length > 0;
  }).length;

  const unansweredCount = Math.max(0, questions.length - answeredCount);

  // Load examination details before the student starts.
  const loadExamination = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/student-portal/examinations/${examinationId}`,
      );

      const exam = response.data?.examination;

      if (!exam) {
        throw new Error("Examination details could not be loaded.");
      }

      setExamination(exam);

      // If an attempt already exists, the student can resume it.
      if (exam.attempt?.status === "submitted") {
        setSubmitted(true);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      setExamination(null);
    } finally {
      setLoading(false);
    }
  }, [examinationId]);

  useEffect(() => {
    loadExamination();
  }, [loadExamination]);

  // Monitor internet connectivity.
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Start or recover the student's attempt.
  const startExamination = async () => {
    if (starting || !examination) return;

    try {
      setStarting(true);

      const response = await api.post(
        `/exam-attempts/examinations/${examinationId}/start`,
      );

      const recoveredAttempt = response.data?.attempt;

      if (!recoveredAttempt) {
        throw new Error("The examination attempt could not be started.");
      }

      if (recoveredAttempt.status !== "in_progress") {
        setSubmitted(true);
        setActive(false);
        setAttempt(recoveredAttempt);
        toast.success("This examination has already been submitted.");
        return;
      }

      setAttempt(recoveredAttempt);

      const initialAnswers = {};

      (recoveredAttempt.questions || []).forEach((question) => {
        initialAnswers[question.id] = getQuestionAnswer(question);
      });

      setAnswers(initialAnswers);
      latestAnswersRef.current = initialAnswers;

      setRemainingSeconds(Number(recoveredAttempt.remainingSeconds || 0));

      setCurrentQuestion(0);
      setActive(true);

      toast.success(
        response.data?.resumed
          ? "Your examination has been recovered."
          : "Examination started successfully.",
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setStarting(false);
    }
  };

  // Save one answer to the backend.
  const saveAnswer = useCallback(
    async (question, answer) => {
      if (!attempt?._id && !attempt?.id) return;

      const attemptId = attempt._id || attempt.id;

      const payload = {
        questionId: question.id,
      };

      if (question.questionType === "objective") {
        payload.selectedOptionId = answer || null;
      } else {
        payload.responseText = answer || "";
      }

      setSavingQuestions((currentState) => ({
        ...currentState,
        [question.id]: true,
      }));

      const request = api
        .patch(`/exam-attempts/${attemptId}/answers`, payload)
        .catch((error) => {
          toast.error(`Could not save an answer: ${getErrorMessage(error)}`);
          throw error;
        })
        .finally(() => {
          setSavingQuestions((currentState) => ({
            ...currentState,
            [question.id]: false,
          }));

          delete pendingSavesRef.current[question.id];
        });

      pendingSavesRef.current[question.id] = request;

      return request;
    },
    [attempt],
  );

  // Update an answer locally and autosave it after a short delay.
  const updateAnswer = (question, answer) => {
    if (!active || submitting) return;

    const updatedAnswers = {
      ...latestAnswersRef.current,
      [question.id]: answer,
    };

    latestAnswersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);

    if (saveTimersRef.current[question.id]) {
      clearTimeout(saveTimersRef.current[question.id]);
    }

    saveTimersRef.current[question.id] = setTimeout(() => {
      delete saveTimersRef.current[question.id];

      saveAnswer(question, answer).catch(() => {
        // The error is displayed by saveAnswer.
      });
    }, 600);
  };

  // Countdown uses the remaining time supplied by the backend.
  useEffect(() => {
    if (!active || submitted) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [active, submitted]);

  // Submit automatically when the countdown reaches zero.
  useEffect(() => {
    if (
      active &&
      remainingSeconds <= 0 &&
      !submittingRef.current &&
      !expiredRef.current
    ) {
      expiredRef.current = true;
      handleSubmit(true);
    }
    // handleSubmit is intentionally invoked when the timer reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, remainingSeconds]);

  // Clear pending autosave timers and wait for pending saves.
  const flushPendingSaves = async () => {
    const questionsToSave = [];

    Object.keys(saveTimersRef.current).forEach((questionId) => {
      clearTimeout(saveTimersRef.current[questionId]);
      delete saveTimersRef.current[questionId];

      const question = questions.find((item) => item.id === questionId);

      if (question) {
        questionsToSave.push(
          saveAnswer(question, latestAnswersRef.current[questionId] ?? ""),
        );
      }
    });

    const existingRequests = Object.values(pendingSavesRef.current);

    await Promise.all([...questionsToSave, ...existingRequests]);
  };

  // Submit the examination.
  async function handleSubmit(automatic = false) {
    if (submittingRef.current || submitted) return;

    if (!automatic) {
      const confirmed = window.confirm(
        unansweredCount > 0
          ? `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
          : "Are you sure you want to submit your examination?",
      );

      if (!confirmed) return;
    }

    const attemptId = attempt?._id || attempt?.id;

    if (!attemptId) {
      toast.error("Examination attempt not found.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await flushPendingSaves();

      const response = await api.post(`/exam-attempts/${attemptId}/submit`);

      setSubmitted(true);
      setActive(false);

      toast.success(
        response.data?.message ||
          "Your examination has been submitted successfully.",
      );
    } catch (error) {
      submittingRef.current = false;
      setSubmitting(false);

      toast.error(
        `Submission failed: ${getErrorMessage(error)}. Please try again.`,
      );
    } finally {
      if (submittingRef.current) {
        setSubmitting(false);
      }
    }
  }

  // Clean up pending timers when leaving the page.
  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current).forEach(clearTimeout);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const goToQuestion = (index) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentQuestion(index);
  };

  const isAnswered = (question) => {
    const answer = answers[question.id];

    if (question.questionType === "objective") {
      return Boolean(answer);
    }

    return typeof answer === "string" && answer.trim().length > 0;
  };

  const getTimerColor = () => {
    if (remainingSeconds <= 300) return "text-red-600";
    if (remainingSeconds <= 900) return "text-amber-600";
    return "text-slate-900";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-3 text-sm text-slate-500">Loading examination...</p>
        </div>
      </div>
    );
  }

  if (!examination) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <AlertCircle size={36} className="mx-auto text-red-500" />
        <h2 className="mt-3 font-bold text-slate-900">
          Examination unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          We could not load this examination. It may no longer be available.
        </p>
        <button
          onClick={() => navigate("/student/examinations")}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to examinations
        </button>
      </div>
    );
  }

  // Submitted state.
  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={42} />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Examination submitted
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Your answers have been submitted successfully. Your result will become
          available when the school releases it.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
          <p className="text-xs text-slate-500">Examination</p>
          <p className="mt-1 font-semibold text-slate-800">
            {examination.title}
          </p>
        </div>

        <button
          onClick={() => navigate("/student/examinations")}
          className="mt-7 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Return to examinations
        </button>
      </div>
    );
  }

  // Instructions and start screen.
  if (!active) {
    const attemptStatus = examination.attempt?.status;

    const canStart =
      examination.status === "available" ||
      examination.status === "in_progress" ||
      attemptStatus === "in_progress";

    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <button
          onClick={() => navigate("/student/examinations")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to examinations
        </button>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                <BookOpen size={26} />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Examination
                </span>

                <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                  {examination.title}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  {examination.subject?.name || "Subject"} ·{" "}
                  {examination.class?.name || "Class"}
                </p>
              </div>
            </div>

            {examination.description && (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                {examination.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4 sm:p-8">
            {[
              {
                label: "Questions",
                value: examination.totalQuestions,
              },
              {
                label: "Total marks",
                value: examination.totalMarks,
              },
              {
                label: "Duration",
                value: `${examination.durationMinutes} minutes`,
              },
              {
                label: "Pass marks",
                value: examination.passMarks,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {item.value ?? "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-2">
              <ShieldCheck size={19} className="text-blue-600" />
              <h2 className="font-semibold text-slate-900">
                Examination instructions
              </h2>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              {examination.instructions ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {examination.instructions}
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Read each question carefully and answer all questions to the
                  best of your ability.
                </p>
              )}
            </div>

            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
                Your answers are automatically saved as you work.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
                You can recover an active examination if you refresh the page.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
                Your examination will be submitted when the timer expires.
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
                Do not close the examination until you have submitted it.
              </li>
            </ul>

            {!canStart && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                This examination is not currently available to start.
              </div>
            )}

            <button
              type="button"
              onClick={startExamination}
              disabled={!canStart || starting}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {starting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Starting examination...
                </>
              ) : attemptStatus === "in_progress" ? (
                "Continue examination"
              ) : (
                "Start examination"
              )}
              {!starting && <ArrowRight size={17} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active examination screen.
  if (!current) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-amber-500" />
        <h2 className="mt-3 font-bold text-slate-900">
          No questions available
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          The examination attempt did not return any questions. Please contact
          your examination officer.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      {/* Examination header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Examination in progress
          </p>
          <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            {examination.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {examination.subject?.name || "Subject"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            {online ? (
              <Wifi size={15} className="text-emerald-600" />
            ) : (
              <WifiOff size={15} className="text-red-600" />
            )}
            {online ? "Online" : "Offline"}
          </div>

          <div
            className={`flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 font-bold tabular-nums ${getTimerColor()}`}
          >
            <Clock3 size={19} />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
        </div>
      </div>

      {!online && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <WifiOff size={18} className="mt-0.5 shrink-0" />
          <p>
            Your internet connection is unavailable. New answers may not be
            saved until you reconnect. Please reconnect as soon as possible.
          </p>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        {/* Question panel */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-xs text-slate-500">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <h2 className="mt-1 font-semibold text-slate-900">
                {current.questionType === "objective"
                  ? "Objective question"
                  : "Theory question"}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {current.marks} mark(s)
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <p className="whitespace-pre-wrap text-base font-medium leading-8 text-slate-800">
              {current.questionText}
            </p>

            {current.questionType === "objective" ? (
              <div className="mt-7 space-y-3">
                {(current.options || []).map((option, index) => {
                  const selected = answers[current.id] === option.optionId;

                  return (
                    <label
                      key={option.optionId}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        selected
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${current.id}`}
                        checked={selected}
                        onChange={() => updateAnswer(current, option.optionId)}
                        className="mt-1 h-4 w-4 accent-blue-600"
                      />

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span className="flex-1 text-sm leading-6 text-slate-700">
                        {option.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-7">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Your answer
                </label>

                <textarea
                  rows={9}
                  value={answers[current.id] || ""}
                  onChange={(event) =>
                    updateAnswer(current, event.target.value)
                  }
                  placeholder="Type your answer here..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Your written answer will be saved automatically.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={currentQuestion === 0}
                onClick={() => goToQuestion(currentQuestion - 1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToQuestion(currentQuestion + 1)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Next question
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send size={16} />
                  Submit examination
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Question navigation */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                Question navigator
              </h3>
              <BookOpen size={18} className="text-slate-400" />
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((question, index) => {
                const answered = isAnswered(question);
                const selected = currentQuestion === index;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => goToQuestion(index)}
                    className={`flex h-10 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : answered
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                    }`}
                    aria-label={`Go to question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>Answered</span>
                <span className="font-semibold text-emerald-700">
                  {answeredCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Unanswered</span>
                <span className="font-semibold text-amber-700">
                  {unansweredCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total questions</span>
                <span className="font-semibold text-slate-800">
                  {questions.length}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-blue-600" />
                Current question
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-emerald-100" />
                Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border border-slate-300 bg-white" />
                Not answered
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Save size={17} className="text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Answer saving
              </h3>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Answers are automatically saved as you work.
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs">
              {Object.values(savingQuestions).some(Boolean) ? (
                <>
                  <LoaderCircle
                    size={14}
                    className="animate-spin text-blue-600"
                  />
                  <span className="text-blue-600">Saving answers...</span>
                </>
              ) : online ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">No pending saves</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-amber-600" />
                  <span className="text-amber-700">Waiting for connection</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={17} />
                Submit examination
              </>
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}
