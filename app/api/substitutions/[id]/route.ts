import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/substitutions/[id] — manually assign or update a substitute
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { substituteTeacherId, status, note } = body;

        const existing = await prisma.substituteAssignment.findUnique({
            where: { id: params.id },
            include: {
                schedule: { select: { startTime: true, endTime: true, dayOfWeek: true } },
            },
        });
        if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

        if (substituteTeacherId) {
            const newTeacher = await prisma.teacher.findUnique({
                where: { id: substituteTeacherId },
                include: {
                    schedules: {
                        where: { dayOfWeek: existing.schedule.dayOfWeek },
                        select: { startTime: true, endTime: true },
                    },
                },
            });
            if (!newTeacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

            const hasConflict = newTeacher.schedules.some(
                (s) => s.startTime < existing.schedule.endTime && s.endTime > existing.schedule.startTime
            );
            if (hasConflict) {
                return NextResponse.json(
                    { error: `${newTeacher.name} already has a class at this time on ${existing.schedule.dayOfWeek}` },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.substituteAssignment.update({
            where: { id: params.id },
            data: {
                substituteTeacherId: substituteTeacherId ?? existing.substituteTeacherId,
                status: status ?? (substituteTeacherId ? "Assigned" : existing.status),
                note: note ?? existing.note,
            },
            include: {
                substituteTeacher: { select: { id: true, name: true } },
                originalTeacher: { select: { id: true, name: true } },
                schedule: {
                    include: {
                        subject: { select: { name: true } },
                        classSection: { select: { name: true } },
                    },
                },
            },
        });

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error("[PATCH /api/substitutions/[id]]", error);
        return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
    }
}
