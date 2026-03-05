"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen, Trash2, ChevronRight, GraduationCap } from "lucide-react";
import { getSubjectColor, getInitials } from "@/lib/utils";
import Link from "next/link";

interface Teacher {
    id: string;
    name: string;
    email: string;
}

interface Subject {
    id: string;
    name: string;
    teacher: { id: string; name: string; email: string };
    _count?: { schedules: number };
}

const AVATAR_COLORS = [
    "linear-gradient(135deg,#1A6B4A,#0F4D35)",
    "linear-gradient(135deg,#FBBF5A,#F5A623)",
    "linear-gradient(135deg,#6366f1,#4338ca)",
    "linear-gradient(135deg,#ec4899,#db2777)",
    "linear-gradient(135deg,#0ea5e9,#0284c7)",
];

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", teacherId: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        const [sRes, tRes] = await Promise.all([
            fetch("/api/subjects"),
            fetch("/api/teachers"),
        ]);
        const [sData, tData] = await Promise.all([sRes.json(), tRes.json()]);
        setSubjects(sData.data ?? []);
        setTeachers(tData.data ?? []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const res = await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to create subject"); return; }
            setSuccess(`Subject "${form.name}" added!`);
            setForm({ name: "", teacherId: "" });
            setShowForm(false);
            load();
            setTimeout(() => setSuccess(null), 3000);
        } catch { setError("Network error"); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete subject "${name}"? This also removes it from schedules.`)) return;
        setDeleting(id);
        try {
            await fetch(`/api/subjects/${id}`, { method: "DELETE" });
            setSubjects((prev) => prev.filter((s) => s.id !== id));
        } catch { /* ignore */ }
        finally { setDeleting(null); }
    }

    // Group subjects by teacher
    const byTeacher: Record<string, { teacher: Teacher; subjects: Subject[] }> = {};
    subjects.forEach((s) => {
        if (!byTeacher[s.teacher.id]) byTeacher[s.teacher.id] = { teacher: s.teacher, subjects: [] };
        byTeacher[s.teacher.id].subjects.push(s);
    });

    return (
        <div className="max-w-4xl mx-auto px-6 py-10 pb-24 md:pb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 animate-fade-up">
                <div>
                    <p className="text-sm mb-1" style={{ color: "#7A7A6E" }}>Curriculum</p>
                    <h1 className="font-display text-4xl">Subjects</h1>
                </div>
                <button
                    onClick={() => { setShowForm((v) => !v); setError(null); }}
                    className="btn-pill-green flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Subject
                </button>
            </div>

            {/* Success banner */}
            {success && (
                <div
                    className="p-4 rounded-xl mb-6 text-sm font-medium animate-fade-up"
                    style={{ background: "rgba(26,107,74,0.12)", border: "1px solid rgba(26,107,74,0.3)", color: "#0F4D35" }}
                >
                    ✅ {success}
                </div>
            )}

            {/* Add subject form */}
            {showForm && (
                <div className="glass-card p-6 mb-8 animate-fade-up">
                    <h2 className="font-display text-xl mb-4">New Subject</h2>
                    {error && (
                        <div className="p-3 rounded-xl mb-4 text-sm" style={{ background: "rgba(239,68,68,0.10)", color: "#991b1b" }}>
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label htmlFor="sub-name" className="block text-sm font-medium mb-2">Subject Name</label>
                            <input
                                id="sub-name"
                                type="text"
                                required
                                placeholder="e.g. Biology, Art, Geography"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="input-floating"
                            />
                        </div>
                        <div>
                            <label htmlFor="sub-teacher" className="block text-sm font-medium mb-2">Assign Teacher</label>
                            <select
                                id="sub-teacher"
                                required
                                value={form.teacherId}
                                onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                                className="input-floating"
                                style={{ appearance: "auto" }}
                            >
                                <option value="">— Select a teacher —</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="btn-pill-green">
                                {saving ? "Saving…" : "Create Subject"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setError(null); }}
                                className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors hover:bg-black/5"
                                style={{ border: "1.5px solid rgba(0,0,0,0.12)" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stats row */}
            {!loading && (
                <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-up">
                    {[
                        { label: "Total Subjects", value: subjects.length, icon: BookOpen },
                        { label: "Teachers with Subjects", value: Object.keys(byTeacher).length, icon: GraduationCap },
                        { label: "Avg per Teacher", value: subjects.length ? (subjects.length / Math.max(Object.keys(byTeacher).length, 1)).toFixed(1) : 0, icon: ChevronRight },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="glass-card-sm p-5">
                            <p className="font-display text-3xl">{value}</p>
                            <p className="text-xs mt-1" style={{ color: "#7A7A6E" }}>{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="glass-card p-6 animate-pulse">
                            <div className="h-5 bg-black/8 rounded-lg w-48 mb-4" />
                            <div className="space-y-3">
                                {[1, 2].map((j) => <div key={j} className="h-14 bg-black/5 rounded-xl" />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Subjects grouped by teacher */}
            {!loading && subjects.length === 0 && (
                <div className="glass-card p-16 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-display text-xl mb-2">No subjects yet</p>
                    <p className="text-sm mb-6" style={{ color: "#7A7A6E" }}>
                        Add your first subject and assign it to a teacher.
                    </p>
                    <button onClick={() => setShowForm(true)} className="btn-pill-green">
                        <Plus className="w-4 h-4" /> Add First Subject
                    </button>
                </div>
            )}

            {!loading && Object.values(byTeacher).map(({ teacher, subjects: tSubjects }, groupIdx) => (
                <div key={teacher.id} className="glass-card p-6 mb-4 animate-fade-up" style={{ animationDelay: `${groupIdx * 60}ms` }}>
                    {/* Teacher header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black/5">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: AVATAR_COLORS[groupIdx % AVATAR_COLORS.length] }}
                        >
                            {getInitials(teacher.name)}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{teacher.name}</p>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>{teacher.email}</p>
                        </div>
                        <span
                            className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ background: "rgba(26,107,74,0.1)", color: "#1A6B4A" }}
                        >
                            {tSubjects.length} subject{tSubjects.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Subject chips */}
                    <div className="space-y-2">
                        {tSubjects.map((subject, idx) => {
                            const colors = getSubjectColor(idx);
                            return (
                                <div
                                    key={subject.id}
                                    className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                                    style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
                                >
                                    <span className="font-semibold text-sm flex-1" style={{ color: colors.text }}>
                                        {subject.name}
                                    </span>
                                    {subject._count?.schedules !== undefined && (
                                        <span className="text-xs" style={{ color: "#7A7A6E" }}>
                                            {subject._count.schedules} class{subject._count.schedules !== 1 ? "es" : ""}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDelete(subject.id, subject.name)}
                                        disabled={deleting === subject.id}
                                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-red-50"
                                        title="Delete subject"
                                    >
                                        {deleting === subject.id
                                            ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                            : <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        }
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Link to add more teachers */}
            {!loading && teachers.length === 0 && (
                <div className="text-center mt-8">
                    <p className="text-sm mb-3" style={{ color: "#7A7A6E" }}>You need teachers before you can add subjects.</p>
                    <Link href="/teachers/add" className="btn-pill-green inline-flex">Add a Teacher first</Link>
                </div>
            )}
        </div>
    );
}
