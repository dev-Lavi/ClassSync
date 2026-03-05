import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/schedules — list all schedules
export async function GET() {
    try {
        const schedules = await prisma.classSchedule.findMany({
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
        return NextResponse.json({ data: schedules }, { status: 200 });
    } catch (error) {
        console.error("[GET /api/schedules]", error);
        return NextResponse.json(
            { error: "Failed to fetch schedules" },
            { status: 500 }
        );
    }
}

// POST /api/schedules — create schedule entry
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { dayOfWeek, startTime, endTime, classId, subjectId, teacherId } = body;

        const requiredFields = { dayOfWeek, startTime, endTime, classId, subjectId, teacherId };
        const missingFields = Object.entries(requiredFields)
            .filter(([, v]) => !v)
            .map(([k]) => k);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missingFields.join(", ")}` },
                { status: 400 }
            );
        }

        const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        if (!validDays.includes(dayOfWeek)) {
            return NextResponse.json(
                { error: `dayOfWeek must be one of: ${validDays.join(", ")}` },
                { status: 400 }
            );
        }

        // Validate references exist
        const [classSection, subject, teacher] = await Promise.all([
            prisma.classSection.findUnique({ where: { id: classId } }),
            prisma.subject.findUnique({ where: { id: subjectId } }),
            prisma.teacher.findUnique({ where: { id: teacherId } }),
        ]);

        if (!classSection) return NextResponse.json({ error: "ClassSection not found" }, { status: 404 });
        if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

        const schedule = await prisma.classSchedule.create({
            data: { dayOfWeek, startTime, endTime, classId, subjectId, teacherId, status: "Scheduled" },
            include: {
                teacher: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } },
                classSection: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ data: schedule }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/schedules]", error);
        return NextResponse.json(
            { error: "Failed to create schedule" },
            { status: 500 }
        );
    }
}
