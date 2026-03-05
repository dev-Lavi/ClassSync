import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/teachers/[id]
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const teacher = await prisma.teacher.findUnique({
            where: { id: params.id },
            include: {
                subjects: true,
                attendance: {
                    orderBy: { date: "desc" },
                    take: 14,
                },
                schedules: {
                    include: {
                        subject: true,
                        classSection: true,
                    },
                },
            },
        });

        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        return NextResponse.json({ data: teacher }, { status: 200 });
    } catch (error) {
        console.error(`[GET /api/teachers/${params.id}]`, error);
        return NextResponse.json(
            { error: "Failed to fetch teacher" },
            { status: 500 }
        );
    }
}

// PUT /api/teachers/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { name, email } = body;

        const existing = await prisma.teacher.findUnique({
            where: { id: params.id },
        });
        if (!existing) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        // Check email uniqueness if changing
        if (email && email !== existing.email) {
            const emailTaken = await prisma.teacher.findUnique({
                where: { email },
            });
            if (emailTaken) {
                return NextResponse.json(
                    { error: "Email already in use by another teacher" },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.teacher.update({
            where: { id: params.id },
            data: {
                ...(name && { name: name.trim() }),
                ...(email && { email: email.trim().toLowerCase() }),
            },
        });

        return NextResponse.json({ data: updated }, { status: 200 });
    } catch (error) {
        console.error(`[PUT /api/teachers/${params.id}]`, error);
        return NextResponse.json(
            { error: "Failed to update teacher" },
            { status: 500 }
        );
    }
}

// DELETE /api/teachers/[id]
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Cascade: delete related records first
        await prisma.classSchedule.deleteMany({
            where: { teacherId: params.id },
        });
        await prisma.teacherAttendance.deleteMany({
            where: { teacherId: params.id },
        });
        await prisma.subject.deleteMany({
            where: { teacherId: params.id },
        });
        await prisma.teacher.delete({ where: { id: params.id } });

        return NextResponse.json(
            { message: "Teacher deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error(`[DELETE /api/teachers/${params.id}]`, error);
        return NextResponse.json(
            { error: "Failed to delete teacher" },
            { status: 500 }
        );
    }
}
