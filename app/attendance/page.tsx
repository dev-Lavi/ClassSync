"use client";

import { useEffect, useState, useCallback } from "react";
import { format, addDays } from "date-fns";
import { CalendarCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { AttendanceTable } from "@/components/AttendanceTable";

interface TeacherRow {
    teacherId: string;
    name: string;
    email: string;
    subjectCount: number;
    status: string;
    attendance: { id: string; status: string } | null;
}

export default function AttendancePage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [teachers, setTeachers] = useState<TeacherRow[]>([]);
    const [loading, setLoading] = useState(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const loadAttendance = useCallback(async (date: string) => {
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
    }, []);

    useEffect(() => {
        loadAttendance(dateStr);
    }, [dateStr, loadAttendance]);

    function changeDate(delta: number) {
        setSelectedDate((d) => addDays(d, delta));
    }

    const presentCount = teachers.filter((t) => t.status === "Present").length;
    const absentCount = teachers.filter((t) => t.status === "Absent").length;
    const leaveCount = teachers.filter((t) => t.status === "Leave").length;
    const unmarkedCount = teachers.filter((t) => t.status === "Not Marked").length;

    return (
        <div className="max-w-3xl mx-auto px-6 py-10 pb-24 md:pb-10">
            {/* Header */}
            <div className="mb-6 animate-fade-up flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium" style={{ color: "#7A7A6E" }}>Daily Tracking</p>
                    <h1 className="font-display text-4xl mt-0.5">Attendance</h1>
                </div>
                <button
                    onClick={() => loadAttendance(dateStr)}
                    className="btn-pill-ghost mt-2 flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
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
                        <p className="font-display text-xl">{format(selectedDate, "EEEE")}</p>
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
                        {[
                            { count: presentCount, label: "Present", color: "#1A6B4A" },
                            { count: absentCount, label: "Absent", color: "#ef4444" },
                            { count: leaveCount, label: "Leave", color: "#F5A623" },
                            { count: unmarkedCount, label: "Unmarked", color: "#7A7A6E" },
                        ].map(({ count, label, color }) => (
                            <div key={label} className="text-center">
                                <span className="font-display text-lg" style={{ color }}>{count}</span>
                                <p className="text-xs" style={{ color: "#7A7A6E" }}>{label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Substitution hint banner */}
            {!loading && (absentCount + leaveCount) > 0 && (
                <div
                    className="mb-4 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-up"
                    style={{
                        background: "rgba(6,182,212,0.08)",
                        border: "1.5px solid rgba(6,182,212,0.25)",
                        color: "#0e7490",
                    }}
                >
                    <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                    Auto-substitution runs when you mark a teacher Absent or Leave.
                    Results appear below each teacher row.
                </div>
            )}

            {/* Teacher list */}
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
                    <CalendarCheck className="w-12 h-12 mx-auto mb-4" style={{ color: "#7A7A6E" }} />
                    <h2 className="font-display text-2xl mb-2">No teachers found</h2>
                    <p className="text-sm" style={{ color: "#7A7A6E" }}>
                        Add teachers first before marking attendance.
                    </p>
                </div>
            ) : (
                <AttendanceTable
                    teachers={teachers}
                    dateStr={dateStr}
                    onUpdate={(teacherId, status) => {
                        setTeachers((prev) =>
                            prev.map((t) => (t.teacherId === teacherId ? { ...t, status } : t))
                        );
                    }}
                />
            )}
        </div>
    );
}
