"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarCheck, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface TeacherAttendance {
    teacherId: string;
    name: string;
    email: string;
    subjectCount: number;
    status: string;
    attendance: { id: string; status: string } | null;
}

const STATUS_OPTIONS = [
    {
        value: "Present",
        label: "Present",
        bg: "rgba(26,107,74,0.12)",
        border: "#1A6B4A",
        text: "#0F4D35",
        activeBg: "#1A6B4A",
    },
    {
        value: "Absent",
        label: "Absent",
        bg: "rgba(239,68,68,0.10)",
        border: "#ef4444",
        text: "#991b1b",
        activeBg: "#ef4444",
    },
    {
        value: "Leave",
        label: "Leave",
        bg: "rgba(245,166,35,0.14)",
        border: "#F5A623",
        text: "#92580D",
        activeBg: "#F5A623",
    },
];

const AVATAR_COLORS = [
    "linear-gradient(135deg,#1A6B4A,#0F4D35)",
    "linear-gradient(135deg,#FBBF5A,#F5A623)",
    "linear-gradient(135deg,#6366f1,#4338ca)",
    "linear-gradient(135deg,#ec4899,#db2777)",
    "linear-gradient(135deg,#0ea5e9,#0284c7)",
];

export default function AttendancePage() {
    const todayDate = new Date();
    const [selectedDate, setSelectedDate] = useState<Date>(todayDate);
    const [teachers, setTeachers] = useState<TeacherAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    async function loadAttendance(date: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/attendance?date=${date}`);
            if (res.ok) {
                const d = await res.json();
                setTeachers(d.data ?? []);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAttendance(dateStr);
    }, [dateStr]);

    async function markAttendance(teacherId: string, status: string) {
        setSaving((prev) => ({ ...prev, [teacherId]: true }));
        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teacherId, date: dateStr, status }),
            });
            if (res.ok) {
                setTeachers((prev) =>
                    prev.map((t) =>
                        t.teacherId === teacherId ? { ...t, status } : t
                    )
                );
            }
        } finally {
            setSaving((prev) => ({ ...prev, [teacherId]: false }));
        }
    }

    function changeDate(delta: number) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        setSelectedDate(d);
    }

    const presentCount = teachers.filter((t) => t.status === "Present").length;
    const absentCount = teachers.filter((t) => t.status === "Absent").length;
    const leaveCount = teachers.filter((t) => t.status === "Leave").length;
    const unmarkedCount = teachers.filter((t) => t.status === "Not Marked").length;

    return (
        <div className="max-w-3xl mx-auto px-6 py-10 pb-24 md:pb-10">
            {/* Header */}
            <div className="mb-6 animate-fade-up">
                <p className="text-sm font-medium" style={{ color: "#7A7A6E" }}>
                    Daily Tracking
                </p>
                <h1 className="font-display text-4xl mt-0.5">Attendance</h1>
            </div>

            {/* Date Selector */}
            <div className="glass-card p-4 mb-6 animate-fade-up animate-delay-80">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => changeDate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                        <p className="font-display text-xl">
                            {format(selectedDate, "EEEE")}
                        </p>
                        <p className="text-sm" style={{ color: "#7A7A6E" }}>
                            {format(selectedDate, "MMMM d, yyyy")}
                        </p>
                    </div>

                    <button
                        onClick={() => changeDate(1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Quick stats */}
                {!loading && (
                    <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-black/5">
                        <div className="text-center">
                            <span className="font-display text-lg" style={{ color: "#1A6B4A" }}>
                                {presentCount}
                            </span>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>Present</p>
                        </div>
                        <div className="text-center">
                            <span className="font-display text-lg text-red-500">{absentCount}</span>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>Absent</p>
                        </div>
                        <div className="text-center">
                            <span className="font-display text-lg" style={{ color: "#F5A623" }}>
                                {leaveCount}
                            </span>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>Leave</p>
                        </div>
                        <div className="text-center">
                            <span className="font-display text-lg" style={{ color: "#7A7A6E" }}>
                                {unmarkedCount}
                            </span>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>Unmarked</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Teacher attendance cards */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="glass-card-sm p-5 h-24 animate-pulse"
                            style={{ opacity: 1 - i * 0.12 }}
                        />
                    ))}
                </div>
            ) : teachers.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <CalendarCheck
                        className="w-12 h-12 mx-auto mb-4"
                        style={{ color: "#7A7A6E" }}
                    />
                    <h2 className="font-display text-2xl mb-2">No teachers found</h2>
                    <p className="text-sm" style={{ color: "#7A7A6E" }}>
                        Add teachers first before marking attendance.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {teachers.map((teacher, idx) => {
                        const isSaving = saving[teacher.teacherId];
                        const currentStatus = teacher.status;

                        return (
                            <div
                                key={teacher.teacherId}
                                className={`glass-card-sm p-5 animate-fade-up transition-all`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div
                                        className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                                        style={{
                                            background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                                        }}
                                    >
                                        {getInitials(teacher.name)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{teacher.name}</p>
                                        <p className="text-xs truncate" style={{ color: "#7A7A6E" }}>
                                            {teacher.subjectCount} subject
                                            {teacher.subjectCount !== 1 ? "s" : ""}
                                        </p>
                                    </div>

                                    {/* Loading */}
                                    {isSaving && (
                                        <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                    )}
                                </div>

                                {/* Status buttons */}
                                <div className="flex gap-2 mt-4">
                                    {STATUS_OPTIONS.map((opt) => {
                                        const isActive = currentStatus === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() =>
                                                    markAttendance(teacher.teacherId, opt.value)
                                                }
                                                disabled={isSaving}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                                                style={{
                                                    background: isActive ? opt.activeBg : opt.bg,
                                                    border: `1.5px solid ${isActive ? opt.activeBg : opt.border}`,
                                                    color: isActive ? "#fff" : opt.text,
                                                    transform: isActive ? "scale(1.02)" : "scale(1)",
                                                }}
                                            >
                                                {isActive && <Check className="w-3 h-3" />}
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
