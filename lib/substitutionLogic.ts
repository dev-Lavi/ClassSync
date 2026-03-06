import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export interface SubstitutionResult {
    scheduleId: string;
    subjectName: string;
    startTime: string;
    endTime: string;
    classSection: string;
    status: "Assigned" | "NeedsManual";
    substituteTeacherId?: string;
    substituteTeacherName?: string;
    assignmentId: string;
}

/**
 * Auto-assign substitute teachers when a teacher takes Absent/Leave.
 *
 * Algorithm:
 *  1. Find all ClassSchedules for the absent teacher on that dayOfWeek
 *  2. Collect all absent/leave teacher IDs for the date (to exclude them)
 *  3. Pre-load all existing substitute assignments for this date
 *  4. For each schedule, search for a capable, conflict-free replacement:
 *     - Must teach the same subject (via Subject relation)
 *     - Must not be absent/leave
 *     - Must not have an existing class at the same time on the same day
 *     - Must not already be substituting at the same time today
 *  5. Upsert SubstituteAssignment records (idempotent — re-running is safe)
 */
export async function autoAssignSubstitutes(
    absentTeacherId: string,
    date: Date
): Promise<SubstitutionResult[]> {
    const dayOfWeek = format(date, "EEEE");
    const dateOnly = new Date(format(date, "yyyy-MM-dd") + "T00:00:00.000Z");

    // Step 1: Find all schedules for the absent teacher this day
    const schedules = await prisma.classSchedule.findMany({
        where: { teacherId: absentTeacherId, dayOfWeek },
        include: {
            subject: { select: { name: true } },
            classSection: { select: { name: true } },
        },
    });

    if (schedules.length === 0) return [];

    // Step 2: Determine which teachers are unavailable today
    const absentToday = await prisma.teacherAttendance.findMany({
        where: { date: dateOnly, status: { in: ["Absent", "Leave"] } },
        select: { teacherId: true },
    });
    const excludedIds = new Set([
        absentTeacherId,
        ...absentToday.map((r) => r.teacherId),
    ]);

    // Step 3: Load existing substitute assignments for today to detect sub-conflicts
    const existingSubAssignments = await prisma.substituteAssignment.findMany({
        where: {
            date: dateOnly,
            substituteTeacherId: { not: null },
            status: "Assigned",
        },
        include: {
            schedule: { select: { startTime: true, endTime: true } },
        },
    });

    // Map: substituteTeacherId → list of occupied time slots today
    const subConflicts = new Map<string, { startTime: string; endTime: string }[]>();
    for (const sa of existingSubAssignments) {
        if (!sa.substituteTeacherId) continue;
        const slots = subConflicts.get(sa.substituteTeacherId) ?? [];
        slots.push({ startTime: sa.schedule.startTime, endTime: sa.schedule.endTime });
        subConflicts.set(sa.substituteTeacherId, slots);
    }

    const results: SubstitutionResult[] = [];

    // Step 4: For each affected schedule, find a substitute
    for (const schedule of schedules) {
        const subjectName = schedule.subject.name;

        // Find teachers who teach the same subject (excluding unavailable ones)
        const candidates = await prisma.teacher.findMany({
            where: {
                id: { notIn: [...excludedIds] },
                subjects: { some: { name: subjectName } },
            },
            include: {
                schedules: {
                    where: { dayOfWeek },
                    select: { startTime: true, endTime: true },
                },
            },
        });

        let chosenTeacher: (typeof candidates)[0] | null = null;

        for (const candidate of candidates) {
            // Regular schedule conflict?
            const hasScheduleConflict = candidate.schedules.some(
                (s) => s.startTime < schedule.endTime && s.endTime > schedule.startTime
            );
            if (hasScheduleConflict) continue;

            // Substitute assignment conflict for today?
            const subSlots = subConflicts.get(candidate.id) ?? [];
            const hasSubConflict = subSlots.some(
                (s) => s.startTime < schedule.endTime && s.endTime > schedule.startTime
            );
            if (hasSubConflict) continue;

            chosenTeacher = candidate;
            break;
        }

        const assignedStatus: "Assigned" | "NeedsManual" = chosenTeacher
            ? "Assigned"
            : "NeedsManual";

        // Step 5: Upsert the assignment (safe to call multiple times)
        const assignment = await prisma.substituteAssignment.upsert({
            where: { scheduleId_date: { scheduleId: schedule.id, date: dateOnly } },
            update: {
                substituteTeacherId: chosenTeacher?.id ?? null,
                status: assignedStatus,
                originalTeacherId: absentTeacherId,
                note: chosenTeacher
                    ? null
                    : "No available teacher with this subject expertise.",
            },
            create: {
                date: dateOnly,
                scheduleId: schedule.id,
                originalTeacherId: absentTeacherId,
                substituteTeacherId: chosenTeacher?.id ?? null,
                status: assignedStatus,
                note: chosenTeacher
                    ? null
                    : "No available teacher with this subject expertise.",
            },
        });

        // Track this assignment so later iterations don't double-book
        if (chosenTeacher) {
            const slots = subConflicts.get(chosenTeacher.id) ?? [];
            slots.push({ startTime: schedule.startTime, endTime: schedule.endTime });
            subConflicts.set(chosenTeacher.id, slots);
        }

        results.push({
            scheduleId: schedule.id,
            subjectName,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            classSection: schedule.classSection.name,
            status: assignedStatus,
            substituteTeacherId: chosenTeacher?.id,
            substituteTeacherName: chosenTeacher?.name,
            assignmentId: assignment.id,
        });
    }

    return results;
}

/**
 * Remove all substitute assignments for a teacher on a given date.
 * Called when a teacher is changed back to Present.
 */
export async function clearSubstitutions(
    teacherId: string,
    date: Date
): Promise<void> {
    const dateOnly = new Date(format(date, "yyyy-MM-dd") + "T00:00:00.000Z");
    await prisma.substituteAssignment.deleteMany({
        where: { originalTeacherId: teacherId, date: dateOnly },
    });
}
