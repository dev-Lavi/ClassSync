"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users,
    BookOpen,
    CalendarCheck,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { formatTime } from "@/lib/utils";

interface Teacher {
    id: string;
    name: string;
    email: string;
    _count: { subjects: number; schedules: number };
}

interface ScheduleEntry {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    dynamicStatus: string;
    subject: { name: string };
    classSection: { name: string };
    teacher: { name: string };
}

interface AttendanceSummary {
    status: string;
    name: string;
}

export default function DashboardPage() {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const weekStart = format(
        new Date(today.setDate(today.getDate() - today.getDay() + 1)),
        "yyyy-MM-dd"
    );
    const currentToday = new Date(); // fresh reference after mutation above

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [todaySchedules, setTodaySchedules] = useState<ScheduleEntry[]>([]);
    const [attendance, setAttendance] = useState<AttendanceSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [teacherRes, scheduleRes, attendanceRes] = await Promise.all([
                    fetch("/api/teachers"),
                    fetch(`/api/schedules/day?view=day&date=${todayStr}`),
                    fetch(`/api/attendance?date=${todayStr}`),
                ]);

                if (teacherRes.ok) {
                    const d = await teacherRes.json();
                    setTeachers(d.data ?? []);
                }
                if (scheduleRes.ok) {
                    const d = await scheduleRes.json();
                    setTodaySchedules(d.data ?? []);
                }
                if (attendanceRes.ok) {
                    const d = await attendanceRes.json();
                    setAttendance(d.data ?? []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, [todayStr]);

    const presentCount = attendance.filter((a) => a.status === "Present").length;
    const absentCount = attendance.filter((a) => a.status === "Absent").length;
    const leaveCount = attendance.filter((a) => a.status === "Leave").length;
    const cancelledCount = todaySchedules.filter(
        (s) => s.dynamicStatus === "Cancelled"
    ).length;
    const scheduledCount = todaySchedules.filter(
        (s) => s.dynamicStatus === "Scheduled"
    ).length;

    const StatSkeleton = () => (
        <div className="glass-card p-6 animate-pulse">
            <div className="h-4 bg-black/10 rounded-full w-2/3 mb-3" />
            <div className="h-8 bg-black/10 rounded-full w-1/3" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 pb-24 md:pb-10">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="mb-8 animate-fade-up">
                <p className="text-sm font-medium" style={{ color: "#7A7A6E" }}>
                    {format(currentToday, "EEEE, MMMM do yyyy")}
                </p>
                <h1
                    className="font-display text-4xl md:text-5xl mt-1"
                    style={{ color: "#1A1A1A" }}
                >
                    Good Morning ✦
                </h1>
            </div>

            {/* ── Bento Grid ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Hero card — large left */}
                <div
                    className="glass-card p-8 md:col-span-1 md:row-span-2 flex flex-col justify-between animate-fade-up"
                    style={{ minHeight: 340 }}
                >
                    <div>
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                            style={{
                                background: "linear-gradient(135deg, #1A6B4A, #0F4D35)",
                            }}
                        >
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="font-display text-3xl leading-snug mb-3">
                            Class Schedule System
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: "#7A7A6E" }}>
                            Manage teachers, mark daily attendance, and view class schedules.
                            Absent teachers auto-cancel their classes.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-8">
                        <Link href="/schedules" className="btn-pill-green">
                            View Schedules
                        </Link>
                        <Link href="/attendance" className="btn-pill-ghost">
                            Mark Attendance
                        </Link>
                    </div>
                </div>

                {/* Today's Schedule — orange gradient */}
                <div className="gradient-card-orange p-6 flex flex-col justify-between animate-fade-up animate-delay-80">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/80">
                                Today&apos;s Classes
                            </p>
                            <p className="font-display text-4xl text-white mt-1">
                                {loading ? "—" : todaySchedules.length}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                        <div className="text-center">
                            <p className="font-display text-2xl text-white">
                                {loading ? "—" : scheduledCount}
                            </p>
                            <p className="text-xs text-white/70">Scheduled</p>
                        </div>
                        <div className="w-px h-8 bg-white/30" />
                        <div className="text-center">
                            <p className="font-display text-2xl text-white">
                                {loading ? "—" : cancelledCount}
                            </p>
                            <p className="text-xs text-white/70">Cancelled</p>
                        </div>
                    </div>
                    <Link
                        href={`/schedules/day/${todayStr}`}
                        className="mt-4 flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
                    >
                        View full day <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Active Teachers — green gradient */}
                <div className="gradient-card-green p-6 flex flex-col justify-between animate-fade-up animate-delay-160">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/70">
                                Active Teachers
                            </p>
                            <p className="font-display text-4xl text-white mt-1">
                                {loading ? "—" : teachers.length}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                        <div className="text-center">
                            <p className="font-display text-2xl text-white">
                                {loading ? "—" : presentCount}
                            </p>
                            <p className="text-xs text-white/60">Present</p>
                        </div>
                        <div className="w-px h-8 bg-white/20" />
                        <div className="text-center">
                            <p className="font-display text-2xl text-white">
                                {loading ? "—" : absentCount + leaveCount}
                            </p>
                            <p className="text-xs text-white/60">Absent/Leave</p>
                        </div>
                    </div>
                    <Link
                        href="/teachers"
                        className="mt-4 flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
                    >
                        Manage teachers <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Attendance Summary — glass card */}
                <div className="glass-card p-6 animate-fade-up animate-delay-240">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm" style={{ color: "#7A7A6E" }}>
                            Today&apos;s Attendance
                        </h3>
                        <CalendarCheck className="w-4 h-4" style={{ color: "#7A7A6E" }} />
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-8 bg-black/8 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : attendance.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-sm" style={{ color: "#7A7A6E" }}>
                                No attendance marked yet
                            </p>
                            <Link href="/attendance" className="btn-pill-green mt-3 text-xs px-4 py-2">
                                Mark Now
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {attendance.slice(0, 4).map((a) => (
                                <div
                                    key={a.name}
                                    className="flex items-center justify-between py-2 border-b border-black/5 last:border-0"
                                >
                                    <span className="text-sm font-medium truncate max-w-[120px]">
                                        {a.name}
                                    </span>
                                    <span
                                        className={
                                            a.status === "Present"
                                                ? "badge-present"
                                                : a.status === "Absent"
                                                    ? "badge-absent"
                                                    : "badge-leave"
                                        }
                                    >
                                        {a.status}
                                    </span>
                                </div>
                            ))}
                            {attendance.length > 4 && (
                                <Link
                                    href="/attendance"
                                    className="text-xs font-medium flex items-center gap-1 pt-1"
                                    style={{ color: "#1A6B4A" }}
                                >
                                    +{attendance.length - 4} more{" "}
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Stats — glass card */}
                <div className="glass-card p-6 animate-fade-up animate-delay-240">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm" style={{ color: "#7A7A6E" }}>
                            Quick Stats
                        </h3>
                        <TrendingUp className="w-4 h-4" style={{ color: "#7A7A6E" }} />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(26,107,74,0.12)" }}
                            >
                                <CheckCircle2 className="w-4 h-4" style={{ color: "#1A6B4A" }} />
                            </div>
                            <div>
                                <p className="font-display text-xl" style={{ color: "#1A1A1A" }}>
                                    {loading ? "—" : teachers.length}
                                </p>
                                <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                    Total Teachers
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(245,166,35,0.15)" }}
                            >
                                <BookOpen className="w-4 h-4" style={{ color: "#F5A623" }} />
                            </div>
                            <div>
                                <p className="font-display text-xl">
                                    {loading
                                        ? "—"
                                        : teachers.reduce((a, t) => a + t._count.subjects, 0)}
                                </p>
                                <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                    Total Subjects
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(239,68,68,0.10)" }}
                            >
                                <XCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                                <p className="font-display text-xl">{loading ? "—" : cancelledCount}</p>
                                <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                    Cancelled Today
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Today's Schedule Preview ──────────────────────────────────────── */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-2xl">Today&apos;s Schedule</h2>
                    <Link
                        href={`/schedules/day/${todayStr}`}
                        className="text-sm font-medium flex items-center gap-1"
                        style={{ color: "#1A6B4A" }}
                    >
                        Full view <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="glass-card-sm p-4 h-20 animate-pulse"
                                style={{ opacity: 1 - i * 0.15 }}
                            />
                        ))}
                    </div>
                ) : todaySchedules.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <BookOpen
                            className="w-12 h-12 mx-auto mb-4"
                            style={{ color: "#7A7A6E" }}
                        />
                        <p className="font-display text-xl mb-2">
                            No classes scheduled today
                        </p>
                        <p className="text-sm" style={{ color: "#7A7A6E" }}>
                            {format(currentToday, "EEEE")} appears to have no scheduled classes.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {todaySchedules.slice(0, 6).map((s, i) => (
                            <div
                                key={s.id}
                                className={`glass-card-sm p-4 flex items-center gap-4 animate-fade-up ${s.dynamicStatus === "Cancelled"
                                        ? "opacity-60"
                                        : ""
                                    }`}
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                                    style={{
                                        background:
                                            s.dynamicStatus === "Cancelled"
                                                ? "rgba(239,68,68,0.2)"
                                                : "linear-gradient(135deg,#1A6B4A,#0F4D35)",
                                        color: s.dynamicStatus === "Cancelled" ? "#991b1b" : undefined,
                                    }}
                                >
                                    {s.startTime}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-sm truncate ${s.dynamicStatus === "Cancelled" ? "line-through" : ""}`}>
                                        {s.subject.name}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: "#7A7A6E" }}>
                                        {s.classSection.name} · {s.teacher.name}
                                    </p>
                                </div>
                                <span
                                    className={
                                        s.dynamicStatus === "Cancelled"
                                            ? "badge-cancelled"
                                            : "badge-scheduled"
                                    }
                                >
                                    {s.dynamicStatus}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
