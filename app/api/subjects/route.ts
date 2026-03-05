import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/subjects — list all subjects with teacher info
export async function GET() {
    try {
        const subjects = await prisma.subject.findMany({
            orderBy: { createdAt: "asc" },
            include: {
                teacher: { select: { id: true, name: true, email: true } },
                _count: { select: { schedules: true } },
            },
        });
        return NextResponse.json({ data: subjects }, { status: 200 });
    } catch (error) {
        console.error("[GET /api/subjects]", error);
        return NextResponse.json(
            { error: "Failed to fetch subjects" },
            { status: 500 }
        );
    }
}

// POST /api/subjects — create subject and assign to teacher
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, teacherId } = body;

        if (!name?.trim() || !teacherId) {
            return NextResponse.json(
                { error: "name and teacherId are required" },
                { status: 400 }
            );
        }

        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        const subject = await prisma.subject.create({
            data: { name: name.trim(), teacherId },
            include: {
                teacher: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ data: subject }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/subjects]", error);
        return NextResponse.json(
            { error: "Failed to create subject" },
            { status: 500 }
        );
    }
}
