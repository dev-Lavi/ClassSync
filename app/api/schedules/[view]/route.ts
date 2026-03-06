import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { annotateSchedulesWithStatus } from "@/lib/scheduleLogic";
import {
    parseISO,
    isValid,
    addDays,
    format,
    parseISO as parse,
    startOfMonth,
    endOfMonth,
} from "date-fns";

const DAY_ORDER = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const SCHEDULE_INCLUDE = {
    teacher: { select: { id: true, name: true, email: true } },
    subject: { select: { id: true, name: true } },
    classSection: { select: { id: true, name: true } },
} as const;

export async function GET(
    req: NextRequest,
    { params }: { params: { view: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const view = searchParams.get("view") ?? params.view;

        // ── DAY VIEW ──────────────────────────────────────────────────────────────
        if (view === "day") {
            const dateStr = searchParams.get("date");
            if (!dateStr) {
                return NextResponse.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
            }
            const date = parseISO(dateStr);
            if (!isValid(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

            const dayOfWeek = format(date, "EEEE");
            const schedules = await prisma.classSchedule.findMany({
                where: { dayOfWeek },
                orderBy: { startTime: "asc" },
                include: SCHEDULE_INCLUDE,
            });

            // Bulk annotate — one query for attendance + one for substitutions
            const annotated = (await annotateSchedulesWithStatus(schedules, date))
                .map((s) => ({ ...s, date: dateStr, dayLabel: dayOfWeek }));

            return NextResponse.json({ data: annotated, view: "day", date: dateStr });
        }

        // ── WEEK VIEW ─────────────────────────────────────────────────────────────
        if (view === "week") {
            const startStr = searchParams.get("start");
            if (!startStr) {
                return NextResponse.json({ error: "start required (YYYY-MM-DD)" }, { status: 400 });
            }
            const weekStart = parseISO(startStr);
            if (!isValid(weekStart)) return NextResponse.json({ error: "Invalid start date" }, { status: 400 });

            // Build day → date map for Mon–Fri
            const dayDateMap: Record<string, Date> = {};
            for (let i = 0; i < 5; i++) {
                const d = addDays(weekStart, i);
                dayDateMap[format(d, "EEEE")] = d;
            }

            const schedules = await prisma.classSchedule.findMany({
                where: { dayOfWeek: { in: Object.keys(dayDateMap) } },
                orderBy: { startTime: "asc" },
                include: SCHEDULE_INCLUDE,
            });

            // Annotate per day using the bulk helper
            const annotated: (typeof schedules[0] & {
                dynamicStatus: string;
                substituteTeacherName?: string;
                substituteTeacherId?: string;
                substituteAssignmentId?: string;
                date: string | null;
            })[] = [];

            for (const [day, date] of Object.entries(dayDateMap)) {
                const dayScheds = schedules.filter((s) => s.dayOfWeek === day);
                const dayAnnotated = await annotateSchedulesWithStatus(dayScheds, date);
                dayAnnotated.forEach((s) =>
                    annotated.push({ ...s, date: format(date, "yyyy-MM-dd") })
                );
            }

            // Group by day
            const grouped = DAY_ORDER.filter((d) => dayDateMap[d]).reduce(
                (acc, day) => {
                    acc[day] = {
                        date: format(dayDateMap[day], "yyyy-MM-dd"),
                        label: format(dayDateMap[day], "EEE, MMM d"),
                        schedules: annotated.filter((s) => s.dayOfWeek === day),
                    };
                    return acc;
                },
                {} as Record<string, { date: string; label: string; schedules: typeof annotated }>
            );

            return NextResponse.json({
                data: grouped,
                flatData: annotated,
                view: "week",
                weekStart: startStr,
                weekEnd: format(addDays(weekStart, 6), "yyyy-MM-dd"),
            });
        }

        // ── MONTH VIEW ────────────────────────────────────────────────────────────
        if (view === "month") {
            const monthStr = searchParams.get("month");
            if (!monthStr) {
                return NextResponse.json({ error: "month required (YYYY-MM)" }, { status: 400 });
            }
            const monthDate = parse(`${monthStr}-01`);
            if (!isValid(monthDate)) return NextResponse.json({ error: "Invalid month" }, { status: 400 });

            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);

            const allSchedules = await prisma.classSchedule.findMany({
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
                include: SCHEDULE_INCLUDE,
            });

            const monthDates: Array<{ date: Date; dayOfWeek: string }> = [];
            let cursor = monthStart;
            while (cursor <= monthEnd) {
                monthDates.push({ date: cursor, dayOfWeek: format(cursor, "EEEE") });
                cursor = addDays(cursor, 1);
            }

            const monthData = await Promise.all(
                monthDates
                    .filter((d) => !["Saturday", "Sunday"].includes(d.dayOfWeek))
                    .map(async ({ date, dayOfWeek }) => {
                        const daySchedules = allSchedules.filter((s) => s.dayOfWeek === dayOfWeek);
                        const annotated = (await annotateSchedulesWithStatus(daySchedules, date))
                            .map((s) => ({ ...s, date: format(date, "yyyy-MM-dd") }));
                        return {
                            date: format(date, "yyyy-MM-dd"),
                            dayOfWeek,
                            label: format(date, "EEE, MMM d"),
                            schedules: annotated,
                            totalClasses: annotated.length,
                            cancelledCount: annotated.filter(
                                (s) => s.dynamicStatus === "Cancelled" || s.dynamicStatus === "NeedsManual"
                            ).length,
                            substitutedCount: annotated.filter((s) => s.dynamicStatus === "Substituted").length,
                        };
                    })
            );

            return NextResponse.json({ data: monthData, view: "month", month: monthStr });
        }

        return NextResponse.json({ error: "Invalid view. Use: day | week | month" }, { status: 400 });
    } catch (error) {
        console.error(`[GET /api/schedules/${params.view}]`, error);
        return NextResponse.json({ error: "Failed to fetch schedule view" }, { status: 500 });
    }
}
