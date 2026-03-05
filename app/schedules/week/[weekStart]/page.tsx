"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, addWeeks } from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen } from "lucide-react";
import { formatTime, getSubjectColor } from "@/lib/utils";

interface DayData {
    date: string;
    dayOfWeek: string;
    label: string;
    schedules: ScheduleEntry[];
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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function WeekSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const weekStartParam = params.weekStart as string;

    const [weekData, setWeekData] = useState<Record<string, DayData>>({});
    const [loading, setLoading] = useState(true);

    let parsedWeekStart: Date;
    try {
        parsedWeekStart = parseISO(weekStartParam);
    } catch {
        parsedWeekStart = new Date();
    }

    useEffect(() => {
        setLoading(true);
        fetch(`/api/schedules/week?view=week&start=${weekStartParam}`)
            .then((r) => r.json())
            .then((d) => setWeekData(d.data ?? {}))
            .finally(() => setLoading(false));
    }, [weekStartParam]);

    function navigate(delta: number) {
        const newStart = addWeeks(parsedWeekStart, delta);
        router.push(`/schedules/week/${format(newStart, "yyyy-MM-dd")}`);
    }

    const totalClasses = Object.values(weekData).reduce(
        (a, d) => a + d.schedules.length,
        0
    );
    const cancelledClasses = Object.values(weekData)
        .flatMap((d) => d.schedules)
        .filter((s) => s.dynamicStatus === "Cancelled").length;

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 pb-24 md:pb-10">
            <Link
                href="/schedules"
                className="inline-flex items-center gap-2 text-sm font-medium mb-6"
                style={{ color: "#7A7A6E" }}
            >
                <ArrowLeft className="w-4 h-4" />
                All Schedules
            </Link>

            {/* Header */}
            <div className="glass-card p-4 mb-6 animate-fade-up">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <p className="font-display text-2xl">
                            {format(parsedWeekStart, "MMM d")} –{" "}
                            {format(
                                new Date(parsedWeekStart.getTime() + 4 * 86400000),
                                "MMM d, yyyy"
                            )}
                        </p>
                        <p className="text-sm" style={{ color: "#7A7A6E" }}>
                            Week View
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {!loading && (
                    <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-black/5">
                        <div className="text-center">
                            <p className="font-display text-2xl">{totalClasses}</p>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                Total Classes
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="font-display text-2xl text-red-500">
                                {cancelledClasses}
                            </p>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>Cancelled</p>
                        </div>
                        <div className="text-center">
                            <p className="font-display text-2xl" style={{ color: "#1A6B4A" }}>
                                {totalClasses - cancelledClasses}
                            </p>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>Scheduled</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Week grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {DAYS.map((d) => (
                        <div key={d}>
                            <div className="h-12 bg-black/8 rounded-xl mb-3 animate-pulse" />
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-20 bg-black/8 rounded-xl mb-2 animate-pulse"
                                    style={{ opacity: 1 - i * 0.2 }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-up animate-delay-80">
                    {DAYS.map((day) => {
                        const dayInfo = weekData[day];
                        const schedules = dayInfo?.schedules ?? [];

                        return (
                            <div key={day}>
                                {/* Day header */}
                                <div
                                    className="glass-card-sm px-3 py-2.5 mb-3"
                                    style={{
                                        background: schedules.some(
                                            (s) => s.dynamicStatus === "Cancelled"
                                        )
                                            ? "rgba(239,68,68,0.07)"
                                            : undefined,
                                    }}
                                >
                                    <p className="text-xs font-bold">{day}</p>
                                    <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                        {dayInfo?.label?.split(",")[1]?.trim() ?? "No classes"}
                                    </p>
                                </div>

                                {schedules.length === 0 ? (
                                    <div
                                        className="text-center py-8 text-xs rounded-xl"
                                        style={{
                                            color: "#7A7A6E",
                                            background: "rgba(0,0,0,0.03)",
                                            border: "1px dashed rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        No classes
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {schedules.map((s, i) => {
                                            const colors = getSubjectColor(i);
                                            const isCancelled = s.dynamicStatus === "Cancelled";
                                            return (
                                                <div
                                                    key={s.id}
                                                    className={`rounded-xl p-3 transition-all ${isCancelled ? "opacity-60" : ""
                                                        }`}
                                                    style={{
                                                        background: isCancelled
                                                            ? "rgba(239,68,68,0.07)"
                                                            : colors.bg,
                                                        border: `1.5px solid ${isCancelled ? "#ef4444" : colors.border
                                                            }`,
                                                    }}
                                                >
                                                    <p
                                                        className={`text-xs font-semibold leading-tight ${isCancelled ? "line-through" : ""
                                                            }`}
                                                        style={{
                                                            color: isCancelled ? "#991b1b" : colors.text,
                                                        }}
                                                    >
                                                        {s.subject.name}
                                                    </p>
                                                    <p
                                                        className="text-xs mt-0.5"
                                                        style={{ color: "#7A7A6E" }}
                                                    >
                                                        {formatTime(s.startTime)}
                                                    </p>
                                                    <p
                                                        className="text-xs truncate"
                                                        style={{ color: "#7A7A6E" }}
                                                    >
                                                        {s.classSection.name}
                                                    </p>
                                                    {isCancelled && (
                                                        <span className="badge-cancelled mt-1 inline-block">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Day detail link */}
                                {dayInfo && (
                                    <Link
                                        href={`/schedules/day/${dayInfo.date}`}
                                        className="flex items-center justify-center gap-1 mt-2 text-xs font-medium py-1.5 rounded-xl transition-colors hover:bg-black/5"
                                        style={{ color: "#7A7A6E" }}
                                    >
                                        Day view
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
