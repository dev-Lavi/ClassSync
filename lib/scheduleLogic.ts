import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export type DynamicStatus =
    | "Scheduled"
    | "Cancelled"
    | "Substituted"
    | "NeedsManual";

export interface AnnotatedSchedule {
    dynamicStatus: DynamicStatus;
    substituteTeacherName?: string;
    substituteTeacherId?: string;
    substituteAssignmentId?: string;
}

/**
 * Bulk-annotates schedules with dynamic status for a given date.
 *
 * Uses exactly 2 DB queries regardless of schedule count:
 *  1. Fetch all teacher attendance records for the date
 *  2. Fetch all substitute assignments for the schedule IDs + date
 *
 * Status hierarchy:
 *  Teacher Present / no record → "Scheduled"
 *  Teacher Absent/Leave + sub assigned → "Substituted"
 *  Teacher Absent/Leave + no available sub → "NeedsManual"
 *  Teacher Absent/Leave + no assignment record → "Cancelled"
 */
export async function annotateSchedulesWithStatus<
    T extends { id: string; teacherId: string }
>(
    schedules: T[],
    date: Date
): Promise<(T & AnnotatedSchedule)[]> {
    if (schedules.length === 0) return [];

    const dateOnly = new Date(format(date, "yyyy-MM-dd") + "T00:00:00.000Z");
    const scheduleIds = schedules.map((s) => s.id);
    const teacherIds = [...new Set(schedules.map((s) => s.teacherId))];

    // Query 1: attendance for all teachers on this date
    const attendanceRecords = await prisma.teacherAttendance.findMany({
        where: { teacherId: { in: teacherIds }, date: dateOnly },
        select: { teacherId: true, status: true },
    });
    const attendanceMap = new Map(
        attendanceRecords.map((r) => [r.teacherId, r.status])
    );

    // Query 2: substitution assignments for all schedules on this date
    const subAssignments = await prisma.substituteAssignment.findMany({
        where: { scheduleId: { in: scheduleIds }, date: dateOnly },
        include: {
            substituteTeacher: { select: { id: true, name: true } },
        },
    });
    const subMap = new Map(subAssignments.map((sa) => [sa.scheduleId, sa]));

    return schedules.map((schedule) => {
        const attendanceStatus = attendanceMap.get(schedule.teacherId);
        const isAbsent =
            attendanceStatus === "Absent" || attendanceStatus === "Leave";

        if (!isAbsent) {
            return { ...schedule, dynamicStatus: "Scheduled" as DynamicStatus };
        }

        const sub = subMap.get(schedule.id);

        if (sub?.status === "Assigned" && sub.substituteTeacher) {
            return {
                ...schedule,
                dynamicStatus: "Substituted" as DynamicStatus,
                substituteTeacherName: sub.substituteTeacher.name,
                substituteTeacherId: sub.substituteTeacher.id,
                substituteAssignmentId: sub.id,
            };
        }

        if (sub?.status === "NeedsManual") {
            return {
                ...schedule,
                dynamicStatus: "NeedsManual" as DynamicStatus,
                substituteAssignmentId: sub.id,
            };
        }

        return { ...schedule, dynamicStatus: "Cancelled" as DynamicStatus };
    });
}
