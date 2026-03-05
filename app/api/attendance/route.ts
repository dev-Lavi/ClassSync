import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, parseISO, isValid } from "date-fns";

// POST /api/attendance — mark attendance
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { teacherId, date, status } = body;

        if (!teacherId || !date || !status) {
            return NextResponse.json(
                { error: "teacherId, date, and status are required" },
                { status: 400 }
            );
        }

        const validStatuses = ["Present", "Absent", "Leave"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `status must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const parsedDate = parseISO(date);
        if (!isValid(parsedDate)) {
            return NextResponse.json(
                { error: "Invalid date format. Use YYYY-MM-DD" },
                { status: 400 }
            );
        }

        // Normalize to midnight UTC
        const dateOnly = new Date(format(parsedDate, "yyyy-MM-dd") + "T00:00:00.000Z");

        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        const record = await prisma.teacherAttendance.upsert({
            where: { teacherId_date: { teacherId, date: dateOnly } },
            update: { status },
            create: { teacherId, date: dateOnly, status },
            include: { teacher: { select: { name: true, email: true } } },
        });

        return NextResponse.json({ data: record }, { status: 200 });
    } catch (error) {
        console.error("[POST /api/attendance]", error);
        return NextResponse.json(
            { error: "Failed to mark attendance" },
            { status: 500 }
        );
    }
}

// GET /api/attendance?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date");

        if (!dateStr) {
            return NextResponse.json(
                { error: "date query parameter is required (format: YYYY-MM-DD)" },
                { status: 400 }
            );
        }

        const parsedDate = parseISO(dateStr);
        if (!isValid(parsedDate)) {
            return NextResponse.json(
                { error: "Invalid date format. Use YYYY-MM-DD" },
                { status: 400 }
            );
        }

        const dateOnly = new Date(format(parsedDate, "yyyy-MM-dd") + "T00:00:00.000Z");

        // Fetch all teachers and their attendance for the date
        const teachers = await prisma.teacher.findMany({
            orderBy: { name: "asc" },
            include: {
                attendance: {
                    where: { date: dateOnly },
                    select: { id: true, status: true, date: true },
                },
                _count: { select: { subjects: true } },
            },
        });

        const result = teachers.map((t) => ({
            teacherId: t.id,
            name: t.name,
            email: t.email,
            subjectCount: t._count.subjects,
            attendance: t.attendance[0] ?? null,
            status: t.attendance[0]?.status ?? "Not Marked",
        }));

        return NextResponse.json({ data: result, date: dateStr }, { status: 200 });
    } catch (error) {
        console.error("[GET /api/attendance]", error);
        return NextResponse.json(
            { error: "Failed to fetch attendance" },
            { status: 500 }
        );
    }
}
