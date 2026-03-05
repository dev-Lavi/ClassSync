import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkTeacherAndGetStatus } from "@/lib/scheduleLogic";
import {
    parseISO,
    isValid,
    startOfWeek,
    endOfWeek,
    addDays,
    format,
    parseISO as parse,
    startOfMonth,
    endOfMonth,
} from "date-fns";

const DAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

/**
 * GET /api/schedules/[view]
 *
 * Query params:
 *  - view=day   &date=YYYY-MM-DD
 *  - view=week  &start=YYYY-MM-DD (Monday of the week)
 *  - view=month &month=YYYY-MM
 *
 * Each schedule entry is annotated with a dynamicStatus computed by checking
 * the teacher's attendance record for the relevant date.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { view: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const view = searchParams.get("view") ?? params.view;

        // ── DAY VIEW ─────────────────────────────────────────────────────────────
        if (view === "day") {
            const dateStr = searchParams.get("date");
            if (!dateStr) {
                return NextResponse.json(
                    { error: "date query param required for day view (YYYY-MM-DD)" },
                    { status: 400 }
                );
            }
            const date = parseISO(dateStr);
            if (!isValid(date)) {
                return NextResponse.json({ error: "Invalid date" }, { status: 400 });
            }

            const dayOfWeek = format(date, "EEEE");

            const schedules = await prisma.classSchedule.findMany({
                where: { dayOfWeek },
                orderBy: { startTime: "asc" },
                include: {
                    teacher: { select: { id: true, name: true, email: true } },
                    subject: { select: { id: true, name: true } },
                    classSection: { select: { id: true, name: true } },
                },
            });

            const annotated = await Promise.all(
                schedules.map(async (s) => ({
                    ...s,
                    dynamicStatus: await checkTeacherAndGetStatus(s.teacherId, date),
                    date: dateStr,
                    dayLabel: dayOfWeek,
                }))
            );

            return NextResponse.json(
                { data: annotated, view: "day", date: dateStr },
                { status: 200 }
            );
        }

        // ── WEEK VIEW ─────────────────────────────────────────────────────────────
        if (view === "week") {
            const startStr = searchParams.get("start");
            if (!startStr) {
                return NextResponse.json(
                    { error: "start query param required for week view (YYYY-MM-DD)" },
                    { status: 400 }
                );
            }
            const weekStart = parseISO(startStr);
            if (!isValid(weekStart)) {
                return NextResponse.json(
                    { error: "Invalid start date" },
                    { status: 400 }
                );
            }

            // Build day → date map for Mon–Fri of that week
            const dayDateMap: Record<string, Date> = {};
            for (let i = 0; i < 5; i++) {
                const d = addDays(weekStart, i);
                dayDateMap[format(d, "EEEE")] = d;
            }

            const schedules = await prisma.classSchedule.findMany({
                where: {
                    dayOfWeek: { in: Object.keys(dayDateMap) },
                },
                orderBy: [{ startTime: "asc" }],
                include: {
                    teacher: { select: { id: true, name: true, email: true } },
                    subject: { select: { id: true, name: true } },
                    classSection: { select: { id: true, name: true } },
                },
            });

            const annotated = await Promise.all(
                schedules.map(async (s) => {
                    const date = dayDateMap[s.dayOfWeek];
                    return {
                        ...s,
                        dynamicStatus: date
                            ? await checkTeacherAndGetStatus(s.teacherId, date)
                            : s.status,
                        date: date ? format(date, "yyyy-MM-dd") : null,
                    };
                })
            );

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

            return NextResponse.json(
                {
                    data: grouped,
                    flatData: annotated,
                    view: "week",
                    weekStart: startStr,
                    weekEnd: format(addDays(weekStart, 6), "yyyy-MM-dd"),
                },
                { status: 200 }
            );
        }

        // ── MONTH VIEW ─────────────────────────────────────────────────────────────
        if (view === "month") {
            const monthStr = searchParams.get("month"); // YYYY-MM
            if (!monthStr) {
                return NextResponse.json(
                    { error: "month query param required (YYYY-MM)" },
                    { status: 400 }
                );
            }

            const monthDate = parse(`${monthStr}-01`);
            if (!isValid(monthDate)) {
                return NextResponse.json({ error: "Invalid month" }, { status: 400 });
            }

            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);

            // Get all schedules (all days of week)
            const allSchedules = await prisma.classSchedule.findMany({
                orderBy: [
                    { dayOfWeek: "asc" },
                    { startTime: "asc" },
                ],
                include: {
                    teacher: { select: { id: true, name: true, email: true } },
                    subject: { select: { id: true, name: true } },
                    classSection: { select: { id: true, name: true } },
                },
            });

            // Build all dates in the month with their day of week
            const monthDates: Array<{ date: Date; dayOfWeek: string }> = [];
            let cursor = monthStart;
            while (cursor <= monthEnd) {
                monthDates.push({ date: cursor, dayOfWeek: format(cursor, "EEEE") });
                cursor = addDays(cursor, 1);
            }

            // For each day in month, annotate matching schedules
            const monthData = await Promise.all(
                monthDates
                    .filter((d) => !["Saturday", "Sunday"].includes(d.dayOfWeek))
                    .map(async ({ date, dayOfWeek }) => {
                        const daySchedules = allSchedules.filter(
                            (s) => s.dayOfWeek === dayOfWeek
                        );
                        const annotated = await Promise.all(
                            daySchedules.map(async (s) => ({
                                ...s,
                                dynamicStatus: await checkTeacherAndGetStatus(s.teacherId, date),
                                date: format(date, "yyyy-MM-dd"),
                            }))
                        );
                        return {
                            date: format(date, "yyyy-MM-dd"),
                            dayOfWeek,
                            label: format(date, "EEE, MMM d"),
                            schedules: annotated,
                            totalClasses: annotated.length,
                            cancelledCount: annotated.filter((s) => s.dynamicStatus === "Cancelled").length,
                        };
                    })
            );

            return NextResponse.json(
                { data: monthData, view: "month", month: monthStr },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { error: "Invalid view. Use: day | week | month" },
            { status: 400 }
        );
    } catch (error) {
        console.error(`[GET /api/schedules/${params.view}]`, error);
        return NextResponse.json(
            { error: "Failed to fetch schedule view" },
            { status: 500 }
        );
    }
}
