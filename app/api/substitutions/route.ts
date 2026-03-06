import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseISO, isValid, format } from "date-fns";

// GET /api/substitutions?date=YYYY-MM-DD (optional)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date");
        const where: Record<string, unknown> = {};

        if (dateStr) {
            const parsed = parseISO(dateStr);
            if (!isValid(parsed)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
            where.date = new Date(format(parsed, "yyyy-MM-dd") + "T00:00:00.000Z");
        }

        const assignments = await prisma.substituteAssignment.findMany({
            where,
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            include: {
                schedule: {
                    include: {
                        subject: { select: { name: true } },
                        classSection: { select: { name: true } },
                    },
                },
                originalTeacher: { select: { id: true, name: true, email: true } },
                substituteTeacher: { select: { id: true, name: true, email: true } },
            },
        });

        return NextResponse.json({ data: assignments });
    } catch (error) {
        console.error("[GET /api/substitutions]", error);
        return NextResponse.json({ error: "Failed to fetch substitutions" }, { status: 500 });
    }
}
