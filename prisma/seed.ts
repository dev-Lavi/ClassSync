import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Clear existing data in correct dependency order
    await prisma.classSchedule.deleteMany();
    await prisma.teacherAttendance.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.classSection.deleteMany();
    await prisma.teacher.deleteMany();

    // ─── Teachers ───────────────────────────────────────────────
    const teachers = await Promise.all([
        prisma.teacher.create({
            data: { name: "Dr. Amelia Chen", email: "amelia.chen@school.edu" },
        }),
        prisma.teacher.create({
            data: { name: "Mr. James Hartwell", email: "james.hartwell@school.edu" },
        }),
        prisma.teacher.create({
            data: { name: "Ms. Priya Nair", email: "priya.nair@school.edu" },
        }),
        prisma.teacher.create({
            data: { name: "Prof. Samuel Owusu", email: "samuel.owusu@school.edu" },
        }),
        prisma.teacher.create({
            data: { name: "Ms. Elena Vasquez", email: "elena.vasquez@school.edu" },
        }),
    ]);

    const [amelia, james, priya, samuel, elena] = teachers;
    console.log(`✅ Created ${teachers.length} teachers`);

    // ─── Class Sections ─────────────────────────────────────────
    const sections = await Promise.all([
        prisma.classSection.create({ data: { name: "Class 9A" } }),
        prisma.classSection.create({ data: { name: "Class 10B" } }),
        prisma.classSection.create({ data: { name: "Class 11C" } }),
    ]);

    const [class9A, class10B, class11C] = sections;
    console.log(`✅ Created ${sections.length} class sections`);

    // ─── Subjects ───────────────────────────────────────────────
    const subjects = await Promise.all([
        prisma.subject.create({ data: { name: "Mathematics", teacherId: amelia.id } }),
        prisma.subject.create({ data: { name: "Physics", teacherId: amelia.id } }),
        prisma.subject.create({ data: { name: "English Literature", teacherId: james.id } }),
        prisma.subject.create({ data: { name: "History", teacherId: priya.id } }),
        prisma.subject.create({ data: { name: "Chemistry", teacherId: samuel.id } }),
        prisma.subject.create({ data: { name: "Computer Science", teacherId: elena.id } }),
    ]);

    const [math, physics, english, history, chemistry, cs] = subjects;
    console.log(`✅ Created ${subjects.length} subjects`);

    // ─── Schedules (Mon–Fri) ────────────────────────────────────
    const scheduleData = [
        // Monday
        { dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00", classId: class9A.id, subjectId: math.id, teacherId: amelia.id },
        { dayOfWeek: "Monday", startTime: "10:00", endTime: "11:00", classId: class10B.id, subjectId: physics.id, teacherId: amelia.id },
        { dayOfWeek: "Monday", startTime: "11:00", endTime: "12:00", classId: class11C.id, subjectId: english.id, teacherId: james.id },
        { dayOfWeek: "Monday", startTime: "13:00", endTime: "14:00", classId: class9A.id, subjectId: history.id, teacherId: priya.id },

        // Tuesday
        { dayOfWeek: "Tuesday", startTime: "09:00", endTime: "10:00", classId: class10B.id, subjectId: chemistry.id, teacherId: samuel.id },
        { dayOfWeek: "Tuesday", startTime: "10:00", endTime: "11:00", classId: class11C.id, subjectId: cs.id, teacherId: elena.id },
        { dayOfWeek: "Tuesday", startTime: "11:00", endTime: "12:00", classId: class9A.id, subjectId: english.id, teacherId: james.id },

        // Wednesday
        { dayOfWeek: "Wednesday", startTime: "09:00", endTime: "10:00", classId: class11C.id, subjectId: math.id, teacherId: amelia.id },
        { dayOfWeek: "Wednesday", startTime: "10:00", endTime: "11:00", classId: class9A.id, subjectId: chemistry.id, teacherId: samuel.id },
        { dayOfWeek: "Wednesday", startTime: "14:00", endTime: "15:00", classId: class10B.id, subjectId: cs.id, teacherId: elena.id },

        // Thursday
        { dayOfWeek: "Thursday", startTime: "09:00", endTime: "10:00", classId: class10B.id, subjectId: history.id, teacherId: priya.id },
        { dayOfWeek: "Thursday", startTime: "10:00", endTime: "11:00", classId: class11C.id, subjectId: physics.id, teacherId: amelia.id },
        { dayOfWeek: "Thursday", startTime: "13:00", endTime: "14:00", classId: class9A.id, subjectId: cs.id, teacherId: elena.id },

        // Friday
        { dayOfWeek: "Friday", startTime: "09:00", endTime: "10:00", classId: class9A.id, subjectId: physics.id, teacherId: amelia.id },
        { dayOfWeek: "Friday", startTime: "10:00", endTime: "11:00", classId: class10B.id, subjectId: english.id, teacherId: james.id },
        { dayOfWeek: "Friday", startTime: "11:00", endTime: "12:00", classId: class11C.id, subjectId: chemistry.id, teacherId: samuel.id },
    ];

    await prisma.classSchedule.createMany({ data: scheduleData });
    console.log(`✅ Created ${scheduleData.length} schedule entries`);

    // ─── Sample Attendance (current week: Mon 2026-03-02 to Fri 2026-03-06) ──
    const attendanceData = [
        // Monday 2026-03-02
        { teacherId: amelia.id, date: new Date("2026-03-02"), status: "Present" },
        { teacherId: james.id, date: new Date("2026-03-02"), status: "Present" },
        { teacherId: priya.id, date: new Date("2026-03-02"), status: "Absent" },
        { teacherId: samuel.id, date: new Date("2026-03-02"), status: "Present" },
        { teacherId: elena.id, date: new Date("2026-03-02"), status: "Leave" },

        // Tuesday 2026-03-03
        { teacherId: amelia.id, date: new Date("2026-03-03"), status: "Present" },
        { teacherId: james.id, date: new Date("2026-03-03"), status: "Leave" },
        { teacherId: priya.id, date: new Date("2026-03-03"), status: "Present" },
        { teacherId: samuel.id, date: new Date("2026-03-03"), status: "Present" },
        { teacherId: elena.id, date: new Date("2026-03-03"), status: "Present" },

        // Wednesday 2026-03-04
        { teacherId: amelia.id, date: new Date("2026-03-04"), status: "Present" },
        { teacherId: james.id, date: new Date("2026-03-04"), status: "Present" },
        { teacherId: priya.id, date: new Date("2026-03-04"), status: "Present" },
        { teacherId: samuel.id, date: new Date("2026-03-04"), status: "Absent" },
        { teacherId: elena.id, date: new Date("2026-03-04"), status: "Present" },

        // Thursday 2026-03-05
        { teacherId: amelia.id, date: new Date("2026-03-05"), status: "Present" },
        { teacherId: james.id, date: new Date("2026-03-05"), status: "Present" },
        { teacherId: priya.id, date: new Date("2026-03-05"), status: "Present" },
        { teacherId: samuel.id, date: new Date("2026-03-05"), status: "Present" },
        { teacherId: elena.id, date: new Date("2026-03-05"), status: "Present" },

        // Friday 2026-03-06
        { teacherId: amelia.id, date: new Date("2026-03-06"), status: "Present" },
        { teacherId: james.id, date: new Date("2026-03-06"), status: "Present" },
        { teacherId: priya.id, date: new Date("2026-03-06"), status: "Leave" },
        { teacherId: samuel.id, date: new Date("2026-03-06"), status: "Present" },
        { teacherId: elena.id, date: new Date("2026-03-06"), status: "Present" },
    ];

    await prisma.teacherAttendance.createMany({ data: attendanceData });
    console.log(`✅ Created ${attendanceData.length} attendance records`);

    console.log("🎉 Seeding complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
