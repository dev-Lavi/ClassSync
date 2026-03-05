import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Remove subject from all schedules first, then delete
        await prisma.classSchedule.deleteMany({ where: { subjectId: params.id } });
        await prisma.subject.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Delete failed";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
