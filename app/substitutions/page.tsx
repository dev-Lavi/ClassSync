"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { RefreshCw, UserCheck, AlertTriangle, Clock, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

interface SubAssignment {
    id: string;
    date: string;
    status: string;
    note: string | null;
    schedule: {
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        subject: { name: string };
        classSection: { name: string };
    };
    originalTeacher: { id: string; name: string; email: string };
    substituteTeacher: { id: string; name: string; email: string } | null;
}

interface Teacher {
    id: string;
    name: string;
}

const STATUS_CONFIG = {
    Assigned: { label: "✅ Assigned", bg: "rgba(6,182,212,0.10)", border: "rgba(6,182,212,0.35)", text: "#0e7490", badge: "badge-substituted" },
    NeedsManual: { label: "⚠️ Needs Manual", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.4)", text: "#92580D", badge: "badge-needs-manual" },
    Pending: { label: "🔄 Pending", bg: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.1)", text: "#7A7A6E", badge: "" },
};

export default function SubstitutionsPage() {
    const [assignments, setAssignments] = useState<SubAssignment[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [manualAssign, setManualAssign] = useState<{ id: string; teacherId: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        const [aRes, tRes] = await Promise.all([
            fetch("/api/substitutions"),
            fetch("/api/teachers"),
        ]);
        const [aData, tData] = await Promise.all([aRes.json(), tRes.json()]);
        setAssignments(aData.data ?? []);
        setTeachers(tData.data ?? []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function handleManualAssign(assignmentId: string) {
        if (!manualAssign || manualAssign.id !== assignmentId || !manualAssign.teacherId) return;
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch(`/api/substitutions/${assignmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ substituteTeacherId: manualAssign.teacherId, status: "Assigned" }),
            });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error ?? "Failed to assign"); return; }
            setManualAssign(null);
            load();
        } catch { setSaveError("Network error"); }
        finally { setSaving(false); }
    }

    const needsManual = assignments.filter((a) => a.status === "NeedsManual");
    const assigned = assignments.filter((a) => a.status === "Assigned");

    const grouped: Record<string, SubAssignment[]> = {};
    assignments.forEach((a) => {
        const key = format(parseISO(a.date), "yyyy-MM-dd");
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(a);
    });

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 animate-fade-up">
                <div>
                    <p className="text-sm mb-1" style={{ color: "#7A7A6E" }}>Auto-Substitution</p>
                    <h1 className="font-display text-4xl">Substitutions</h1>
                </div>
                <button onClick={load} className="btn-pill-ghost flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Stats */}
            {!loading && (
                <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-up">
                    <div className="glass-card-sm p-5">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)" }}>
                                <UserCheck className="w-4 h-4" style={{ color: "#0e7490" }} />
                            </div>
                            <span className="font-display text-3xl">{assigned.length}</span>
                        </div>
                        <p className="text-xs" style={{ color: "#7A7A6E" }}>Auto-Assigned</p>
                    </div>
                    <div className="glass-card-sm p-5" style={{ background: needsManual.length > 0 ? "rgba(245,166,35,0.06)" : undefined }}>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,166,35,0.14)" }}>
                                <AlertTriangle className="w-4 h-4" style={{ color: "#F5A623" }} />
                            </div>
                            <span className="font-display text-3xl" style={{ color: needsManual.length > 0 ? "#92580D" : undefined }}>
                                {needsManual.length}
                            </span>
                        </div>
                        <p className="text-xs" style={{ color: "#7A7A6E" }}>Needs Manual Assignment</p>
                    </div>
                    <div className="glass-card-sm p-5">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}>
                                <BookOpen className="w-4 h-4" style={{ color: "#7A7A6E" }} />
                            </div>
                            <span className="font-display text-3xl">{assignments.length}</span>
                        </div>
                        <p className="text-xs" style={{ color: "#7A7A6E" }}>Total Records</p>
                    </div>
                </div>
            )}

            {/* Needs Manual — priority section */}
            {!loading && needsManual.length > 0 && (
                <div className="mb-8 animate-fade-up">
                    <h2 className="font-display text-xl mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" style={{ color: "#F5A623" }} />
                        Needs Manual Assignment
                    </h2>
                    <div className="space-y-3">
                        {needsManual.map((a) => (
                            <div
                                key={a.id}
                                className="glass-card-sm p-5"
                                style={{ background: "rgba(245,166,35,0.06)", border: "1.5px solid rgba(245,166,35,0.3)" }}
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="badge-needs-manual">{a.schedule.subject.name}</span>
                                            <span className="text-xs font-medium" style={{ color: "#7A7A6E" }}>
                                                {a.schedule.dayOfWeek} · {a.schedule.startTime}–{a.schedule.endTime}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold">{a.schedule.classSection.name}</p>
                                        <p className="text-xs mt-0.5" style={{ color: "#7A7A6E" }}>
                                            Original: <span className="font-medium" style={{ color: "#1A1A1A" }}>{a.originalTeacher.name}</span>
                                            {" "}· {format(parseISO(a.date), "MMM d, yyyy")}
                                        </p>
                                        {a.note && <p className="text-xs mt-1 italic" style={{ color: "#92580D" }}>{a.note}</p>}
                                    </div>

                                    {/* Manual assign control */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {manualAssign?.id === a.id ? (
                                            <>
                                                <select
                                                    className="input-floating text-sm py-2"
                                                    style={{ width: "200px", appearance: "auto" }}
                                                    value={manualAssign.teacherId}
                                                    onChange={(e) => setManualAssign({ id: a.id, teacherId: e.target.value })}
                                                >
                                                    <option value="">Select teacher</option>
                                                    {teachers
                                                        .filter((t) => t.id !== a.originalTeacher.id)
                                                        .map((t) => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                </select>
                                                <button
                                                    onClick={() => handleManualAssign(a.id)}
                                                    disabled={saving || !manualAssign.teacherId}
                                                    className="btn-pill-green text-sm py-2 px-4"
                                                    style={{ borderRadius: "10px", minWidth: "80px" }}
                                                >
                                                    {saving ? "…" : "Assign"}
                                                </button>
                                                <button
                                                    onClick={() => setManualAssign(null)}
                                                    className="text-sm px-3 py-2 rounded-xl hover:bg-black/5"
                                                    style={{ color: "#7A7A6E" }}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setManualAssign({ id: a.id, teacherId: "" })}
                                                className="btn-pill-ghost text-sm py-2"
                                            >
                                                Assign Teacher
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {saveError && manualAssign?.id === a.id && (
                                    <p className="text-xs mt-2" style={{ color: "#991b1b" }}>{saveError}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All records grouped by date */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-card p-6 animate-pulse">
                            <div className="h-4 bg-black/8 rounded w-32 mb-4" />
                            {[1, 2].map((j) => <div key={j} className="h-16 bg-black/5 rounded-xl mb-2" />)}
                        </div>
                    ))}
                </div>
            ) : assignments.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-display text-xl mb-2">No substitutions yet</p>
                    <p className="text-sm mb-6" style={{ color: "#7A7A6E" }}>
                        Substitutions are created automatically when a teacher is marked Absent or Leave.
                    </p>
                    <Link href="/attendance" className="btn-pill-green inline-flex">
                        Go to Attendance →
                    </Link>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-up animate-delay-80">
                    {Object.entries(grouped)
                        .sort(([a], [b]) => (a > b ? -1 : 1))
                        .map(([dateKey, dayAssignments]) => (
                            <div key={dateKey}>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#7A7A6E" }}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(parseISO(dateKey), "EEEE, MMMM d, yyyy")}
                                    <span className="ml-auto text-xs">{dayAssignments.length} class{dayAssignments.length !== 1 ? "es" : ""}</span>
                                </h3>
                                <div className="space-y-2">
                                    {dayAssignments.map((a) => {
                                        const cfg = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.Pending;
                                        return (
                                            <div
                                                key={a.id}
                                                className="glass-card-sm p-4 flex items-center gap-4"
                                                style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="font-semibold text-sm">{a.schedule.subject.name}</span>
                                                        <span className="text-xs" style={{ color: "#7A7A6E" }}>
                                                            {a.schedule.startTime}–{a.schedule.endTime} · {a.schedule.classSection.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                                        <span style={{ color: "#ef4444" }}>🎯 {a.originalTeacher.name}</span>
                                                        {a.substituteTeacher && (
                                                            <> → <span style={{ color: "#0e7490" }}>🔄 {a.substituteTeacher.name}</span></>
                                                        )}
                                                    </p>
                                                </div>
                                                <span className={cfg.badge || "badge-cancelled"}>{cfg.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
