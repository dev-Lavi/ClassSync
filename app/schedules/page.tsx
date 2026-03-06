"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, addDays, startOfWeek } from "date-fns";
import {
    BookOpen,
    Clock,
    ChevronLeft,
    ChevronRight,
    Calendar,
    List,
} from "lucide-react";
import { formatTime, getSubjectColor } from "@/lib/utils";

interface ScheduleEntry {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    dynamicStatus: string;
    date?: string;
    subject: { id: string; name: string };
    classSection: { id: string; name: string };
    teacher: { id: string; name: string };
    substituteTeacherName?: string;
    substituteTeacherId?: string;
    substituteAssignmentId?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type ViewMode = "week" | "day" | "list";

export default function SchedulesPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const [weekStart, setWeekStart] = useState<Date>(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [selectedDay, setSelectedDay] = useState<Date>(new Date());
    const [weekData, setWeekData] = useState<
        Record<
            string,
            { date: string; label: string; schedules: ScheduleEntry[] }
        >
    >({});
    const [dayData, setDayData] = useState<ScheduleEntry[]>([]);
    const [allSchedules, setAllSchedules] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Load week view
    useEffect(() => {
        if (viewMode !== "week") return;
        setLoading(true);
        const startStr = format(weekStart, "yyyy-MM-dd");
        fetch(`/api/schedules/week?view=week&start=${startStr}`)
            .then((r) => r.json())
            .then((d) => setWeekData(d.data ?? {}))
            .finally(() => setLoading(false));
    }, [weekStart, viewMode]);

    // Load day view
    useEffect(() => {
        if (viewMode !== "day") return;
        setLoading(true);
        const dateStr = format(selectedDay, "yyyy-MM-dd");
        fetch(`/api/schedules/day?view=day&date=${dateStr}`)
            .then((r) => r.json())
            .then((d) => setDayData(d.data ?? []))
            .finally(() => setLoading(false));
    }, [selectedDay, viewMode]);

    // Load all schedules for list view
    useEffect(() => {
        if (viewMode !== "list") return;
        setLoading(true);
        fetch("/api/schedules")
            .then((r) => r.json())
            .then((d) => setAllSchedules(d.data ?? []))
            .finally(() => setLoading(false));
    }, [viewMode]);

    function prevWeek() {
        setWeekStart((d) => addDays(d, -7));
    }
    function nextWeek() {
        setWeekStart((d) => addDays(d, 7));
    }

    const ScheduleBlock = ({ s, idx }: { s: ScheduleEntry; idx: number }) => {
        const colors = getSubjectColor(idx);
        const status = s.dynamicStatus;

        const styleMap: Record<string, { bg: string; border: string; textColor: string; iconColor: string; badge: string; badgeLabel: string; dim: boolean }> = {
            Cancelled: { bg: "rgba(239,68,68,0.07)", border: "#ef4444", textColor: "#991b1b", iconColor: "#ef4444", badge: "badge-cancelled", badgeLabel: "Cancelled", dim: true },
            Substituted: { bg: "rgba(6,182,212,0.09)", border: "rgba(6,182,212,0.4)", textColor: "#0e7490", iconColor: "#06b6d4", badge: "badge-substituted", badgeLabel: "Substituted", dim: false },
            NeedsManual: { bg: "rgba(245,166,35,0.09)", border: "rgba(245,166,35,0.4)", textColor: "#92580D", iconColor: "#F5A623", badge: "badge-needs-manual", badgeLabel: "⚠ Assign", dim: false },
            Scheduled: { bg: colors.bg, border: colors.border, textColor: colors.text, iconColor: colors.text, badge: "badge-scheduled", badgeLabel: "On", dim: false },
        };

        const style = styleMap[status] ?? styleMap.Scheduled;

        return (
            <div
                className={`schedule-block flex items-start gap-3 ${style.dim ? "schedule-block-cancelled" : ""}`}
                style={{ background: style.bg, border: `1.5px solid ${style.border}` }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: style.bg }}
                >
                    <Clock className="w-4 h-4" style={{ color: style.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-sm font-semibold leading-tight ${style.dim ? "line-through" : ""}`}
                        style={{ color: style.textColor }}
                    >
                        {s.subject.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: style.textColor, opacity: 0.8 }}>
                        {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#7A7A6E" }}>
                        {s.classSection.name} ·{" "}
                        {status === "Substituted" && s.substituteTeacherName ? (
                            <span className="font-semibold" style={{ color: "#0e7490" }}>
                                🔄 {s.substituteTeacherName}
                            </span>
                        ) : (
                            <span style={{ textDecoration: style.dim ? "line-through" : "none" }}>
                                {s.teacher.name}
                            </span>
                        )}
                    </p>
                </div>
                <span className={style.badge}>{style.badgeLabel}</span>
            </div>
        );
    };

    const EmptyDay = () => (
        <div className="text-center py-6 text-xs" style={{ color: "#7A7A6E" }}>
            No classes
        </div>
    );

    const LoadingSkeleton = () => (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-20 rounded-xl animate-pulse bg-black/8"
                    style={{ opacity: 1 - i * 0.2 }}
                />
            ))}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 pb-24 md:pb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 animate-fade-up">
                <div>
                    <p className="text-sm font-medium" style={{ color: "#7A7A6E" }}>
                        Timetable
                    </p>
                    <h1 className="font-display text-4xl mt-0.5">Schedules</h1>
                </div>

                {/* View toggle */}
                <div
                    className="flex items-center gap-1 p-1 rounded-2xl"
                    style={{ background: "rgba(0,0,0,0.06)" }}
                >
                    {(
                        [
                            { key: "week", label: "Week", icon: Calendar },
                            { key: "day", label: "Day", icon: Clock },
                            { key: "list", label: "List", icon: List },
                        ] as const
                    ).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setViewMode(key)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{
                                background: viewMode === key ? "#1A3C34" : "transparent",
                                color: viewMode === key ? "#fff" : "#7A7A6E",
                            }}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── WEEK VIEW ──────────────────────────────────────────────────────── */}
            {viewMode === "week" && (
                <div className="animate-fade-up animate-delay-80">
                    <div className="glass-card p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={prevWeek}
                                className="btn-pill-ghost px-4 py-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="text-center">
                                <p className="font-display text-lg">
                                    {format(weekStart, "MMM d")} –{" "}
                                    {format(addDays(weekStart, 4), "MMM d, yyyy")}
                                </p>
                                <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                    Week View
                                </p>
                            </div>
                            <button
                                onClick={nextWeek}
                                className="btn-pill-ghost px-4 py-2"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {DAYS.map((d) => (
                                <div key={d}>
                                    <div className="h-8 bg-black/8 rounded-xl mb-3 animate-pulse" />
                                    <LoadingSkeleton />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {DAYS.map((day) => {
                                const dayInfo = weekData[day];
                                const schedules = dayInfo?.schedules ?? [];
                                return (
                                    <div key={day}>
                                        <div
                                            className="glass-card-sm px-3 py-2 mb-3 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-xs font-semibold">{day.slice(0, 3)}</p>
                                                <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                                    {dayInfo?.label?.split(",")[1]?.trim() ?? ""}
                                                </p>
                                            </div>
                                            <span
                                                className="text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center"
                                                style={{ background: "rgba(26,107,74,0.12)", color: "#0F4D35" }}
                                            >
                                                {schedules.length}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {schedules.length === 0 ? (
                                                <EmptyDay />
                                            ) : (
                                                schedules.map((s, i) => (
                                                    <ScheduleBlock key={s.id} s={s} idx={i} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── DAY VIEW ───────────────────────────────────────────────────────── */}
            {viewMode === "day" && (
                <div className="animate-fade-up animate-delay-80">
                    <div className="glass-card p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setSelectedDay((d) => addDays(d, -1))}
                                className="btn-pill-ghost px-4 py-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="text-center">
                                <p className="font-display text-xl">
                                    {format(selectedDay, "EEEE")}
                                </p>
                                <p className="text-sm" style={{ color: "#7A7A6E" }}>
                                    {format(selectedDay, "MMMM d, yyyy")}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDay((d) => addDays(d, 1))}
                                className="btn-pill-ghost px-4 py-2"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingSkeleton />
                    ) : dayData.length === 0 ? (
                        <div className="glass-card p-16 text-center">
                            <BookOpen
                                className="w-12 h-12 mx-auto mb-4"
                                style={{ color: "#7A7A6E" }}
                            />
                            <h2 className="font-display text-2xl mb-2">No classes today</h2>
                            <p className="text-sm" style={{ color: "#7A7A6E" }}>
                                {format(selectedDay, "EEEE")} has no scheduled classes.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dayData.map((s, i) => (
                                <ScheduleBlock key={s.id} s={s} idx={i} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
            {viewMode === "list" && (
                <div className="animate-fade-up animate-delay-80">
                    {loading ? (
                        <LoadingSkeleton />
                    ) : allSchedules.length === 0 ? (
                        <div className="glass-card p-16 text-center">
                            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "#7A7A6E" }} />
                            <h2 className="font-display text-2xl mb-2">No schedules created</h2>
                        </div>
                    ) : (
                        <div className="glass-card overflow-hidden">
                            <div className="divide-y divide-black/5">
                                {DAYS.flatMap((day) =>
                                    allSchedules
                                        .filter((s) => s.dayOfWeek === day)
                                        .map((s, i) => (
                                            <div
                                                key={s.id}
                                                className="flex items-center gap-4 p-4 hover:bg-black/[0.02] transition-colors"
                                            >
                                                <div
                                                    className="w-20 flex-shrink-0 text-xs font-semibold"
                                                    style={{ color: "#7A7A6E" }}
                                                >
                                                    {s.dayOfWeek.slice(0, 3)}
                                                    <br />
                                                    <span style={{ color: "#1A1A1A" }}>
                                                        {formatTime(s.startTime)}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm">{s.subject.name}</p>
                                                    <p
                                                        className="text-xs"
                                                        style={{ color: "#7A7A6E" }}
                                                    >
                                                        {s.classSection.name} · {s.teacher.name}
                                                    </p>
                                                </div>
                                                <span
                                                    className="text-xs px-3 py-1 rounded-full"
                                                    style={{
                                                        background: "rgba(0,0,0,0.06)",
                                                        color: "#7A7A6E",
                                                    }}
                                                >
                                                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                                                </span>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick link to day-wise route */}
            <div className="mt-8 glass-card-sm p-4 flex items-center justify-between animate-fade-up">
                <div>
                    <p className="text-sm font-medium">Day-specific View</p>
                    <p className="text-xs" style={{ color: "#7A7A6E" }}>
                        Access today&apos;s attendance-aware schedule
                    </p>
                </div>
                <Link
                    href={`/schedules/day/${format(new Date(), "yyyy-MM-dd")}`}
                    className="btn-pill-green"
                >
                    Today <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
