"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 18; h++) {
    ["00", "30"].forEach((m) => {
        const label = `${String(h).padStart(2, "0")}:${m}`;
        TIME_OPTIONS.push(label);
    });
}

interface Teacher { id: string; name: string }
interface Subject { id: string; name: string; teacher: { id: string; name: string } }
interface ClassSection { id: string; name: string }

export default function AddSchedulePage() {
    const router = useRouter();

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<ClassSection[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        classId: "",
        subjectId: "",
        teacherId: "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch("/api/teachers").then((r) => r.json()),
            fetch("/api/subjects").then((r) => r.json()),
            fetch("/api/class-sections").then((r) => r.json()),
        ]).then(([t, s, c]) => {
            setTeachers(t.data ?? []);
            setSubjects(s.data ?? []);
            setClasses(c.data ?? []);
            setLoading(false);
        });
    }, []);

    // Auto-fill teacher when subject is selected
    function handleSubjectChange(subjectId: string) {
        const subject = subjects.find((s) => s.id === subjectId);
        setForm((f) => ({
            ...f,
            subjectId,
            teacherId: subject?.teacher?.id ?? f.teacherId,
        }));
    }

    // Filter end times to only be after start time
    const endTimeOptions = form.startTime
        ? TIME_OPTIONS.filter((t) => t > form.startTime)
        : TIME_OPTIONS;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (form.endTime <= form.startTime) {
            setError("End time must be after start time.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/schedules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to create schedule"); return; }
            setSuccess(true);
            setTimeout(() => router.push("/schedules"), 1800);
        } catch { setError("Network error. Please try again."); }
        finally { setSaving(false); }
    }

    const selectedSubject = subjects.find((s) => s.id === form.subjectId);

    return (
        <div className="max-w-2xl mx-auto px-6 py-10 pb-24 md:pb-10">
            <Link href="/schedules" className="inline-flex items-center gap-2 text-sm font-medium mb-8" style={{ color: "#7A7A6E" }}>
                <ArrowLeft className="w-4 h-4" /> Back to Schedules
            </Link>

            <div className="glass-card p-8 animate-fade-up">
                {/* Icon + title */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg,#F5A623,#E8950F)" }}>
                    <Calendar className="w-7 h-7 text-white" />
                </div>
                <h1 className="font-display text-3xl mb-1">Add Schedule Entry</h1>
                <p className="text-sm mb-8" style={{ color: "#7A7A6E" }}>
                    Schedule a class for a specific day and time slot.
                </p>

                {/* Success state */}
                {success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: "rgba(26,107,74,0.12)", border: "1px solid rgba(26,107,74,0.3)" }}>
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#1A6B4A" }} />
                        <p className="text-sm font-medium" style={{ color: "#0F4D35" }}>
                            Schedule created! Redirecting to timetable…
                        </p>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="p-4 rounded-xl mb-6 text-sm" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#991b1b" }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-black/8 rounded-xl animate-pulse" />)}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Day of Week */}
                        <div>
                            <label htmlFor="sched-day" className="block text-sm font-semibold mb-2">Day of Week</label>
                            <div className="grid grid-cols-5 gap-2">
                                {DAYS.map((day) => (
                                    <button
                                        type="button"
                                        key={day}
                                        onClick={() => setForm((f) => ({ ...f, dayOfWeek: day }))}
                                        className="py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                                        style={{
                                            background: form.dayOfWeek === day ? "#1A6B4A" : "rgba(0,0,0,0.04)",
                                            color: form.dayOfWeek === day ? "#fff" : "#3A3A3A",
                                            border: `1.5px solid ${form.dayOfWeek === day ? "#1A6B4A" : "rgba(0,0,0,0.08)"}`,
                                            transform: form.dayOfWeek === day ? "scale(1.04)" : "scale(1)",
                                        }}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                            {!form.dayOfWeek && <p className="text-xs mt-1.5" style={{ color: "#7A7A6E" }}>Select a day above</p>}
                        </div>

                        {/* Time slots */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="sched-start" className="block text-sm font-semibold mb-2">Start Time</label>
                                <select
                                    id="sched-start"
                                    required
                                    value={form.startTime}
                                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value, endTime: "" }))}
                                    className="input-floating"
                                    style={{ appearance: "auto" }}
                                >
                                    <option value="">— Start —</option>
                                    {TIME_OPTIONS.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="sched-end" className="block text-sm font-semibold mb-2">End Time</label>
                                <select
                                    id="sched-end"
                                    required
                                    value={form.endTime}
                                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                                    className="input-floating"
                                    style={{ appearance: "auto" }}
                                    disabled={!form.startTime}
                                >
                                    <option value="">— End —</option>
                                    {endTimeOptions.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Class Section */}
                        <div>
                            <label htmlFor="sched-class" className="block text-sm font-semibold mb-2">Class Section</label>
                            <select
                                id="sched-class"
                                required
                                value={form.classId}
                                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                                className="input-floating"
                                style={{ appearance: "auto" }}
                            >
                                <option value="">— Select class section —</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subject — auto fills teacher */}
                        <div>
                            <label htmlFor="sched-subject" className="block text-sm font-semibold mb-2">Subject</label>
                            <select
                                id="sched-subject"
                                required
                                value={form.subjectId}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                className="input-floating"
                                style={{ appearance: "auto" }}
                            >
                                <option value="">— Select subject —</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.teacher.name})</option>
                                ))}
                            </select>
                            {selectedSubject && (
                                <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "#1A6B4A" }}>
                                    <span
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ background: "#1A6B4A", fontSize: "8px" }}
                                    >
                                        {selectedSubject.teacher.name.slice(0, 1)}
                                    </span>
                                    Teacher auto-assigned: <strong>{selectedSubject.teacher.name}</strong>
                                </p>
                            )}
                        </div>

                        {/* Teacher (pre-filled from subject, but can override) */}
                        <div>
                            <label htmlFor="sched-teacher" className="block text-sm font-semibold mb-1">
                                Teacher
                                <span className="ml-2 text-xs font-normal" style={{ color: "#7A7A6E" }}>(auto-filled from subject)</span>
                            </label>
                            <select
                                id="sched-teacher"
                                required
                                value={form.teacherId}
                                onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                                className="input-floating"
                                style={{ appearance: "auto" }}
                            >
                                <option value="">— Select teacher —</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Preview card */}
                        {form.dayOfWeek && form.startTime && form.endTime && form.subjectId && (
                            <div
                                className="p-4 rounded-xl animate-fade-up"
                                style={{ background: "rgba(245,166,35,0.10)", border: "1.5px solid rgba(245,166,35,0.35)" }}
                            >
                                <p className="text-xs font-semibold mb-1" style={{ color: "#92580D" }}>Preview</p>
                                <p className="font-display text-lg" style={{ color: "#1A1A1A" }}>
                                    {selectedSubject?.name} — {form.dayOfWeek}s
                                </p>
                                <p className="text-sm" style={{ color: "#7A7A6E" }}>
                                    {form.startTime} – {form.endTime} &nbsp;·&nbsp; {classes.find(c => c.id === form.classId)?.name ?? "—"} &nbsp;·&nbsp; {teachers.find(t => t.id === form.teacherId)?.name ?? "—"}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving || success || !form.dayOfWeek}
                            className="btn-pill-green w-full justify-center py-3 mt-2"
                            style={{ borderRadius: "12px" }}
                        >
                            {saving ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Creating…
                                </span>
                            ) : "Create Schedule Entry"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
