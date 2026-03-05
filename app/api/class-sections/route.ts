import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const sections = await prisma.classSection.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { schedules: true } } },
        });
        return NextResponse.json({ data: sections });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to fetch class sections";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name } = await req.json();
        if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const section = await prisma.classSection.create({ data: { name: name.trim() } });
        return NextResponse.json({ data: section }, { status: 201 });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to create class section";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
