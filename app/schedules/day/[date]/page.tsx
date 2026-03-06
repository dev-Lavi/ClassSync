"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, addDays } from "date-fns";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    ArrowLeft,
    RefreshCw,
} from "lucide-react";
import { formatTime, getSubjectColor } from "@/lib/utils";

interface ScheduleEntry {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    dynamicStatus: string;
    subject: { name: string };
    classSection: { name: string };
    teacher: { name: string };
    substituteTeacherName?: string;
    substituteTeacherId?: string;
    substituteAssignmentId?: string;
}

const STATUS_STYLE: Record<
    string,
    { badge: string; label: string; dim: boolean; accent: string }
> = {
    Scheduled: { badge: "badge-scheduled", label: "On", dim: false, accent: "" },
    Substituted: { badge: "badge-substituted", label: "Substituted", dim: false, accent: "#0e7490" },
    NeedsManual: { badge: "badge-needs-manual", label: "⚠ Assign", dim: false, accent: "#92580D" },
    Cancelled: { badge: "badge-cancelled", label: "Cancelled", dim: true, accent: "#991b1b" },
};

export default function DaySchedulePage() {
    const params = useParams();
    const router = useRouter();
    const dateParam = params.date as string;

    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    let parsedDate: Date;
    try {
        parsedDate = parseISO(dateParam);
    } catch {
        parsedDate = new Date();
    }

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/schedules/day?view=day&date=${dateParam}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.error) setError(d.error);
                else setSchedules(d.data ?? []);
            })
            .catch(() => setError("Failed to load schedule"))
            .finally(() => setLoading(false));
    }, [dateParam]);

    function navigate(delta: number) {
        router.push(`/schedules/day/${format(addDays(parsedDate, delta), "yyyy-MM-dd")}`);
    }

    const cancelledCount = schedules.filter((s) => s.dynamicStatus === "Cancelled").length;
    const substitutedCount = schedules.filter((s) => s.dynamicStatus === "Substituted").length;
    const needsManualCount = schedules.filter((s) => s.dynamicStatus === "NeedsManual").length;
    const scheduledCount = schedules.filter((s) => s.dynamicStatus === "Scheduled").length;

    return (
        <div className="max-w-2xl mx-auto px-6 py-10 pb-24 md:pb-10">
            {/* Back */}
            <Link
                href="/schedules"
                className="inline-flex items-center gap-2 text-sm font-medium mb-6"
                style={{ color: "#7A7A6E" }}
            >
                <ArrowLeft className="w-4 h-4" />
                All Schedules
            </Link>

            {/* Date navigation */}
            <div className="glass-card p-4 mb-6 animate-fade-up">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <p className="font-display text-2xl">{format(parsedDate, "EEEE")}</p>
                        <p className="text-sm" style={{ color: "#7A7A6E" }}>
                            {format(parsedDate, "MMMM d, yyyy")}
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
                    <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-black/5">
                        <div className="text-center">
                            <p className="font-display text-2xl" style={{ color: "#1A6B4A" }}>{scheduledCount}</p>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>On</p>
                        </div>
                        {substitutedCount > 0 && (
                            <>
                                <div className="w-px h-8 bg-black/10" />
                                <div className="text-center">
                                    <p className="font-display text-2xl" style={{ color: "#0e7490" }}>{substitutedCount}</p>
                                    <p className="text-xs" style={{ color: "#7A7A6E" }}>Substituted</p>
                                </div>
                            </>
                        )}
                        {(cancelledCount > 0 || needsManualCount > 0) && (
                            <>
                                <div className="w-px h-8 bg-black/10" />
                                <div className="text-center">
                                    <p className="font-display text-2xl text-red-500">{cancelledCount + needsManualCount}</p>
                                    <p className="text-xs" style={{ color: "#7A7A6E" }}>Needs Action</p>
                                </div>
                            </>
                        )}
                        <div className="w-px h-8 bg-black/10" />
                        <div className="text-center">
                            <p className="font-display text-2xl">{schedules.length}</p>
                            <p className="text-xs" style={{ color: "#7A7A6E" }}>Total</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="glass-card-sm h-24 animate-pulse"
                            style={{ opacity: 1 - i * 0.15 }}
                        />
                    ))}
                </div>
            ) : error ? (
                <div className="glass-card p-8 text-center" style={{ color: "#991b1b" }}>
                    {error}
                </div>
            ) : schedules.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "#7A7A6E" }} />
                    <h2 className="font-display text-2xl mb-2">No classes</h2>
                    <p className="text-sm" style={{ color: "#7A7A6E" }}>
                        {format(parsedDate, "EEEE")} has no scheduled classes.
                    </p>
                </div>
            ) : (
                <div className="space-y-3 animate-fade-up animate-delay-80">
                    {schedules.map((s, idx) => {
                        const colors = getSubjectColor(idx);
                        const st = STATUS_STYLE[s.dynamicStatus] ?? STATUS_STYLE.Scheduled;
                        const isSubstituted = s.dynamicStatus === "Substituted";
                        const isCancelled = s.dynamicStatus === "Cancelled";
                        const isNeedsManual = s.dynamicStatus === "NeedsManual";

                        const cardBg =
                            isSubstituted ? "rgba(6,182,212,0.07)" :
                                isCancelled ? "rgba(239,68,68,0.06)" :
                                    isNeedsManual ? "rgba(245,166,35,0.07)" :
                                        colors.bg;

                        const cardBorder =
                            isSubstituted ? "rgba(6,182,212,0.35)" :
                                isCancelled ? "#ef4444" :
                                    isNeedsManual ? "rgba(245,166,35,0.4)" :
                                        colors.border;

                        const subjectColor =
                            isSubstituted ? "#0e7490" :
                                isCancelled ? "#991b1b" :
                                    isNeedsManual ? "#92580D" :
                                        colors.text;

                        return (
                            <div
                                key={s.id}
                                className={`glass-card-sm p-5 flex gap-4 items-start schedule-block ${st.dim ? "schedule-block-cancelled" : ""}`}
                                style={{
                                    border: `1.5px solid ${cardBorder}`,
                                    background: cardBg,
                                    animationDelay: `${idx * 60}ms`,
                                }}
                            >
                                {/* Time column */}
                                <div className="flex-shrink-0 text-center w-16">
                                    <p className="text-xs font-bold" style={{ color: subjectColor }}>
                                        {formatTime(s.startTime)}
                                    </p>
                                    <div className="w-px h-4 bg-black/10 mx-auto my-1" />
                                    <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                        {formatTime(s.endTime)}
                                    </p>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`font-semibold text-sm ${st.dim ? "line-through" : ""}`}
                                        style={{ color: subjectColor }}
                                    >
                                        {s.subject.name}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: "#7A7A6E" }}>
                                        {s.classSection.name}
                                    </p>

                                    {/* Teacher info with substitution */}
                                    {isSubstituted && s.substituteTeacherName ? (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-xs line-through" style={{ color: "#9ca3af" }}>
                                                {s.teacher.name}
                                            </span>
                                            <RefreshCw className="w-3 h-3" style={{ color: "#06b6d4" }} />
                                            <span className="text-xs font-semibold" style={{ color: "#0e7490" }}>
                                                {s.substituteTeacherName}
                                            </span>
                                        </div>
                                    ) : (
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{
                                                color: isCancelled ? "#9ca3af" : "#7A7A6E",
                                                textDecoration: st.dim ? "line-through" : "none",
                                            }}
                                        >
                                            {s.teacher.name}
                                        </p>
                                    )}

                                    {/* NeedsManual action hint */}
                                    {isNeedsManual && (
                                        <Link
                                            href="/substitutions"
                                            className="inline-flex items-center gap-1 text-xs font-semibold mt-1"
                                            style={{ color: "#92580D" }}
                                        >
                                            Assign substitute →
                                        </Link>
                                    )}
                                </div>

                                {/* Status badge */}
                                <span className={st.badge}>{st.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary notes */}
            {!loading && needsManualCount > 0 && (
                <div
                    className="mt-6 p-4 rounded-2xl text-sm animate-fade-up flex items-center justify-between"
                    style={{
                        background: "rgba(245,166,35,0.08)",
                        border: "1.5px solid rgba(245,166,35,0.35)",
                        color: "#92580D",
                    }}
                >
                    <span>
                        ⚠️ {needsManualCount} class{needsManualCount > 1 ? "es need" : " needs"} manual substitute assignment.
                    </span>
                    <Link href="/substitutions" className="font-semibold underline text-xs ml-4">
                        Manage →
                    </Link>
                </div>
            )}

            {!loading && substitutedCount > 0 && (
                <div
                    className="mt-4 p-4 rounded-2xl text-sm animate-fade-up"
                    style={{
                        background: "rgba(6,182,212,0.07)",
                        border: "1.5px solid rgba(6,182,212,0.25)",
                        color: "#0e7490",
                    }}
                >
                    ✅ {substitutedCount} class{substitutedCount > 1 ? "es were" : " was"} auto-assigned a substitute teacher.
                </div>
            )}
        </div>
    );
}
