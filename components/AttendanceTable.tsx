"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface TeacherRow {
    teacherId: string;
    name: string;
    email: string;
    subjectCount: number;
    status: string;
}

interface AttendanceTableProps {
    teachers: TeacherRow[];
    dateStr: string;
    onUpdate?: (teacherId: string, status: string) => void;
}

const STATUS_OPTIONS = [
    {
        value: "Present",
        activeBg: "#1A6B4A",
        bg: "rgba(26,107,74,0.10)",
        border: "#1A6B4A",
        text: "#0F4D35",
    },
    {
        value: "Absent",
        activeBg: "#ef4444",
        bg: "rgba(239,68,68,0.10)",
        border: "#ef4444",
        text: "#991b1b",
    },
    {
        value: "Leave",
        activeBg: "#F5A623",
        bg: "rgba(245,166,35,0.14)",
        border: "#F5A623",
        text: "#92580D",
    },
] as const;

const AVATAR_COLORS = [
    "linear-gradient(135deg,#1A6B4A,#0F4D35)",
    "linear-gradient(135deg,#FBBF5A,#F5A623)",
    "linear-gradient(135deg,#6366f1,#4338ca)",
    "linear-gradient(135deg,#ec4899,#db2777)",
    "linear-gradient(135deg,#0ea5e9,#0284c7)",
];

export function AttendanceTable({
    teachers,
    dateStr,
    onUpdate,
}: AttendanceTableProps) {
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [localStatus, setLocalStatus] = useState<Record<string, string>>(() =>
        Object.fromEntries(teachers.map((t) => [t.teacherId, t.status]))
    );

    async function mark(teacherId: string, status: string) {
        setSaving((prev: Record<string, boolean>) => ({ ...prev, [teacherId]: true }));
        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teacherId, date: dateStr, status }),
            });
            if (res.ok) {
                setLocalStatus((prev: Record<string, string>) => ({ ...prev, [teacherId]: status }));
                onUpdate?.(teacherId, status);
            }
        } finally {
            setSaving((prev: Record<string, boolean>) => ({ ...prev, [teacherId]: false }));
        }
    }

    return (
        <div className="space-y-3">
            {teachers.map((teacher, idx) => {
                const currentStatus = localStatus[teacher.teacherId] ?? teacher.status;
                const isSaving = saving[teacher.teacherId];

                return (
                    <div
                        key={teacher.teacherId}
                        className="glass-card-sm p-5 animate-fade-up"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div
                                className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                                style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                            >
                                {getInitials(teacher.name)}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{teacher.name}</p>
                                <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                    {teacher.email}
                                </p>
                            </div>
                            {isSaving && (
                                <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                            )}
                            {!isSaving && currentStatus !== "Not Marked" && (
                                <span
                                    className={
                                        currentStatus === "Present"
                                            ? "badge-present"
                                            : currentStatus === "Absent"
                                                ? "badge-absent"
                                                : "badge-leave"
                                    }
                                >
                                    {currentStatus}
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {STATUS_OPTIONS.map((opt) => {
                                const isActive = currentStatus === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => mark(teacher.teacherId, opt.value)}
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                                        style={{
                                            background: isActive ? opt.activeBg : opt.bg,
                                            border: `1.5px solid ${isActive ? opt.activeBg : opt.border
                                                }`,
                                            color: isActive ? "#fff" : opt.text,
                                            transform: isActive ? "scale(1.02)" : "scale(1)",
                                        }}
                                    >
                                        {isActive && <Check className="w-3 h-3" />}
                                        {opt.value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
