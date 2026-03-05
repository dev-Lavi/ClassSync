import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/teachers — list all teachers with subject count
export async function GET() {
    try {
        const teachers = await prisma.teacher.findMany({
            orderBy: { createdAt: "asc" },
            include: {
                _count: { select: { subjects: true, schedules: true } },
                subjects: { select: { id: true, name: true } },
            },
        });
        return NextResponse.json({ data: teachers }, { status: 200 });
    } catch (error) {
        console.error("[GET /api/teachers]", error);
        return NextResponse.json(
            { error: "Failed to fetch teachers" },
            { status: 500 }
        );
    }
}

// POST /api/teachers — create teacher
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email } = body;

        if (!name?.trim() || !email?.trim()) {
            return NextResponse.json(
                { error: "Name and email are required" },
                { status: 400 }
            );
        }

        const existing = await prisma.teacher.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: "A teacher with this email already exists" },
                { status: 409 }
            );
        }

        const teacher = await prisma.teacher.create({
            data: { name: name.trim(), email: email.trim().toLowerCase() },
        });

        return NextResponse.json({ data: teacher }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/teachers]", error);
        return NextResponse.json(
            { error: "Failed to create teacher" },
            { status: 500 }
        );
    }
}
