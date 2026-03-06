"use client";

import { useState } from "react";
import { UserCheck, UserX, Coffee, RefreshCw, ChevronRight } from "lucide-react";

interface Teacher {
    teacherId: string;
    name: string;
    email: string;
    subjectCount: number;
    status: string;
}

interface SubResult {
    subjectName: string;
    startTime: string;
    endTime: string;
    classSection: string;
    status: "Assigned" | "NeedsManual";
    substituteTeacherName?: string;
}

interface SubstitutionBanner {
    teacherId: string;
    teacherName: string;
    results: SubResult[];
    summary: { total: number; assigned: number; needsManual: number };
}

interface AttendanceTableProps {
    teachers: Teacher[];
    dateStr: string;
    onUpdate?: (teacherId: string, status: string) => void;
}

const STATUS_OPTIONS = [
    {
        value: "Present",
        icon: UserCheck,
        activeBg: "#1A6B4A",
        inactiveBg: "rgba(26,107,74,0.08)",
        border: "#1A6B4A",
        text: "#0F4D35",
        label: "Present",
    },
    {
        value: "Absent",
        icon: UserX,
        activeBg: "#ef4444",
        inactiveBg: "rgba(239,68,68,0.08)",
        border: "#ef4444",
        text: "#991b1b",
        label: "Absent",
    },
    {
        value: "Leave",
        icon: Coffee,
        activeBg: "#F5A623",
        inactiveBg: "rgba(245,166,35,0.10)",
        border: "#F5A623",
        text: "#92580D",
        label: "Leave",
    },
] as const;

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

const AVATAR_COLORS = [
    "linear-gradient(135deg,#1A6B4A,#0F4D35)",
    "linear-gradient(135deg,#FBBF5A,#E8950F)",
    "linear-gradient(135deg,#6366f1,#4338ca)",
    "linear-gradient(135deg,#ec4899,#db2777)",
    "linear-gradient(135deg,#0ea5e9,#0284c7)",
];

export function AttendanceTable({ teachers, dateStr, onUpdate }: AttendanceTableProps) {
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [localStatus, setLocalStatus] = useState<Record<string, string>>(() =>
        Object.fromEntries(teachers.map((t) => [t.teacherId, t.status]))
    );
    const [subBanners, setSubBanners] = useState<Record<string, SubstitutionBanner>>({});

    async function mark(teacher: Teacher, status: string) {
        if (localStatus[teacher.teacherId] === status) return;
        setSaving((prev: Record<string, boolean>) => ({ ...prev, [teacher.teacherId]: true }));

        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teacherId: teacher.teacherId, date: dateStr, status }),
            });

            if (res.ok) {
                const data = await res.json();
                setLocalStatus((prev: Record<string, string>) => ({ ...prev, [teacher.teacherId]: status }));
                onUpdate?.(teacher.teacherId, status);

                // Show substitution banner if there are results
                if (data.substitutions?.length > 0 || (status === "Present" && subBanners[teacher.teacherId])) {
                    if (status === "Present") {
                        // Clear banner when back to present
                        setSubBanners((prev) => {
                            const updated = { ...prev };
                            delete updated[teacher.teacherId];
                            return updated;
                        });
                    } else {
                        setSubBanners((prev) => ({
                            ...prev,
                            [teacher.teacherId]: {
                                teacherId: teacher.teacherId,
                                teacherName: teacher.name,
                                results: data.substitutions,
                                summary: data.autoAssignSummary,
                            },
                        }));
                    }
                }
            }
        } finally {
            setSaving((prev: Record<string, boolean>) => ({ ...prev, [teacher.teacherId]: false }));
        }
    }

    if (teachers.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <p className="font-display text-xl mb-2">No teachers found</p>
                <p className="text-sm" style={{ color: "#7A7A6E" }}>
                    Add teachers to start tracking attendance.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {teachers.map((teacher, idx) => {
                const current = localStatus[teacher.teacherId] ?? "Not Marked";
                const isSaving = saving[teacher.teacherId];
                const banner = subBanners[teacher.teacherId];

                return (
                    <div key={teacher.teacherId}>
                        <div className="glass-card-sm p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Avatar + info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                        style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                                    >
                                        {getInitials(teacher.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">{teacher.name}</p>
                                        <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                            {teacher.subjectCount} subject{teacher.subjectCount !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {isSaving && (
                                        <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#7A7A6E" }} />
                                    )}
                                    {STATUS_OPTIONS.map(({ value, icon: Icon, activeBg, inactiveBg, border, text, label }) => {
                                        const isActive = current === value;
                                        return (
                                            <button
                                                key={value}
                                                onClick={() => mark(teacher, value)}
                                                disabled={isSaving}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                                                style={{
                                                    background: isActive ? activeBg : inactiveBg,
                                                    border: `1.5px solid ${isActive ? border : "transparent"}`,
                                                    color: isActive ? "#fff" : text,
                                                    transform: isActive ? "scale(1.04)" : "scale(1)",
                                                }}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Substitution banner */}
                        {banner && (
                            <div
                                className="mx-2 p-4 rounded-b-2xl border-t-0 animate-fade-up"
                                style={{
                                    background: banner.summary.needsManual > 0
                                        ? "rgba(245,166,35,0.08)"
                                        : "rgba(6,182,212,0.08)",
                                    border: `1.5px solid ${banner.summary.needsManual > 0 ? "rgba(245,166,35,0.35)" : "rgba(6,182,212,0.3)"}`,
                                    borderTop: "none",
                                }}
                            >
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#7A7A6E" }}>
                                    🔄 Auto-substitution for <span className="font-bold" style={{ color: "#1A1A1A" }}>{banner.teacherName}</span>
                                    <span className="ml-auto">
                                        {banner.summary.assigned}/{banner.summary.total} classes covered
                                    </span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {banner.results.map((r, i) => (
                                        r.status === "Assigned" ? (
                                            <span key={i} className="sub-chip-assigned">
                                                ✅ {r.subjectName} ({r.startTime}) → <strong>{r.substituteTeacherName}</strong>
                                            </span>
                                        ) : (
                                            <span key={i} className="sub-chip-manual">
                                                ⚠️ {r.subjectName} ({r.startTime}) — needs manual
                                            </span>
                                        )
                                    ))}
                                </div>
                                {banner.summary.needsManual > 0 && (
                                    <a
                                        href="/substitutions"
                                        className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
                                        style={{ color: "#92580D" }}
                                    >
                                        Assign manually <ChevronRight className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
