"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import "react-day-picker/dist/style.css";

interface ScheduleCalendarProps {
    /** Dates that have at least one scheduled class (green dot) */
    scheduledDates?: Date[];
    /** Dates that have at least one cancelled class (orange dot) */
    cancelledDates?: Date[];
    /** Default selected date */
    defaultDate?: Date;
    /** Mode: navigate to day route, or call onSelect callback */
    mode?: "navigate" | "callback";
    onSelect?: (date: Date) => void;
}

export function ScheduleCalendar({
    scheduledDates = [],
    cancelledDates = [],
    defaultDate,
    mode = "navigate",
    onSelect,
}: ScheduleCalendarProps) {
    const router = useRouter();
    const [selected, setSelected] = useState<Date | undefined>(defaultDate);

    function isSameDay(a: Date, b: Date) {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }

    function handleSelect(day: Date | undefined) {
        if (!day) return;
        setSelected(day);
        if (mode === "navigate") {
            router.push(`/schedules/day/${format(day, "yyyy-MM-dd")}`);
        } else {
            onSelect?.(day);
        }
    }

    return (
        <div className="glass-card p-6 inline-block">
            <DayPicker
                mode="single"
                selected={selected}
                onSelect={handleSelect}
                showOutsideDays
                modifiers={{
                    scheduled: scheduledDates,
                    cancelled: cancelledDates,
                }}
                modifiersStyles={{
                    scheduled: {
                        fontWeight: 600,
                        position: "relative",
                    },
                    cancelled: {
                        fontWeight: 600,
                    },
                }}
                components={{
                    DayContent: ({ date, activeModifiers }: { date: Date; activeModifiers: Record<string, boolean> }) => {
                        const hasScheduled = scheduledDates.some((d) =>
                            isSameDay(d, date)
                        );
                        const hasCancelled = cancelledDates.some((d) =>
                            isSameDay(d, date)
                        );
                        return (
                            <div className="relative flex flex-col items-center">
                                <span>{date.getDate()}</span>
                                {(hasScheduled || hasCancelled) && (
                                    <span className="flex gap-0.5 mt-0.5">
                                        {hasScheduled && (
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ background: "#1A6B4A" }}
                                            />
                                        )}
                                        {hasCancelled && (
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ background: "#F5A623" }}
                                            />
                                        )}
                                    </span>
                                )}
                            </div>
                        );
                    },
                }}
            />

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 pt-4 border-t border-black/5 justify-center">
                <div className="flex items-center gap-1.5">
                    <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: "#1A6B4A" }}
                    />
                    <span className="text-xs" style={{ color: "#7A7A6E" }}>
                        Scheduled
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: "#F5A623" }}
                    />
                    <span className="text-xs" style={{ color: "#7A7A6E" }}>
                        Has Cancellations
                    </span>
                </div>
            </div>
        </div>
    );
}
