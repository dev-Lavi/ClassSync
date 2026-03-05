import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

/**
 * Checks teacher attendance for a given date and returns the appropriate
 * schedule status.
 *
 * Logic:
 *  - If the teacher has an attendance record with status "Absent" or "Leave",
 *    returns "Cancelled".
 *  - If the teacher has status "Present" OR no record at all (assumed present),
 *    returns "Scheduled".
 *
 * This function is used dynamically at query time in GET /api/schedules/[view]
 * so the database schedule records themselves are NOT mutated — the status is
 * computed on-the-fly for each API response.
 */
export async function checkTeacherAndGetStatus(
    teacherId: string,
    date: Date
): Promise<"Scheduled" | "Cancelled"> {
    // Normalize to midnight UTC for Date-only comparison
    const dateOnly = new Date(format(date, "yyyy-MM-dd") + "T00:00:00.000Z");

    const attendance = await prisma.teacherAttendance.findUnique({
        where: {
            teacherId_date: {
                teacherId,
                date: dateOnly,
            },
        },
        select: { status: true },
    });

    if (!attendance) {
        // No record → teacher is assumed present → schedule proceeds
        return "Scheduled";
    }

    if (attendance.status === "Absent" || attendance.status === "Leave") {
        return "Cancelled";
    }

    return "Scheduled";
}

/**
 * Annotates an array of schedule entries with dynamic status based on
 * teacher attendance for the given date.
 */
export async function annotateSchedulesWithStatus<
    T extends { teacherId: string }
>(schedules: T[], date: Date): Promise<(T & { dynamicStatus: string })[]> {
    const annotated = await Promise.all(
        schedules.map(async (schedule) => {
            const dynamicStatus = await checkTeacherAndGetStatus(
                schedule.teacherId,
                date
            );
            return { ...schedule, dynamicStatus };
        })
    );
    return annotated;
}
