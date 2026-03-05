import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addDays,
    parseISO,
    isValid,
} from "date-fns";

// ── Tailwind class merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ── Date Formatting ──────────────────────────────────────────────────────────
export function formatDate(date: Date | string, fmt = "PPP"): string {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "Invalid date";
    return format(d, fmt);
}

export function formatDateShort(date: Date | string): string {
    return formatDate(date, "MMM d, yyyy");
}

export function formatTime(time: string): string {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// ── Week Range ───────────────────────────────────────────────────────────────
export function getWeekRange(weekStart: string | Date): {
    start: Date;
    end: Date;
    days: { date: Date; dayOfWeek: string; label: string }[];
} {
    const start =
        typeof weekStart === "string"
            ? startOfWeek(parseISO(weekStart), { weekStartsOn: 1 })
            : startOfWeek(weekStart, { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });

    const days = Array.from({ length: 5 }, (_, i) => {
        const date = addDays(start, i);
        return {
            date,
            dayOfWeek: format(date, "EEEE"),
            label: format(date, "EEE, MMM d"),
        };
    });

    return { start, end, days };
}

// ── Month Range ──────────────────────────────────────────────────────────────
export function getMonthRange(monthStr: string): { start: Date; end: Date } {
    const date = parseISO(`${monthStr}-01`);
    return {
        start: startOfMonth(date),
        end: endOfMonth(date),
    };
}

// ── Day of Week → ISO date mapping for a given week ─────────────────────────
export function getDayOfWeekDate(
    weekStart: Date,
    dayOfWeek: string
): Date | null {
    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];
    const idx = days.indexOf(dayOfWeek);
    if (idx === -1) return null;
    return addDays(weekStart, idx);
}

// ── Current week Monday ──────────────────────────────────────────────────────
export function getCurrentWeekStart(): string {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(monday, "yyyy-MM-dd");
}

// ── Date to dayOfWeek string ─────────────────────────────────────────────────
export function dateToDayOfWeek(date: Date | string): string {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "EEEE");
}

// ── ISO date string ──────────────────────────────────────────────────────────
export function toISODateString(date: Date): string {
    return format(date, "yyyy-MM-dd");
}

// ── Subject/class color palette ──────────────────────────────────────────────
const SUBJECT_COLORS = [
    { bg: "rgba(245,166,35,0.15)", border: "#F5A623", text: "#92580D" },
    { bg: "rgba(26,107,74,0.12)", border: "#1A6B4A", text: "#0F4D35" },
    { bg: "rgba(99,102,241,0.12)", border: "#6366f1", text: "#3730a3" },
    { bg: "rgba(236,72,153,0.12)", border: "#ec4899", text: "#9d174d" },
    { bg: "rgba(14,165,233,0.12)", border: "#0ea5e9", text: "#0369a1" },
    { bg: "rgba(168,85,247,0.12)", border: "#a855f7", text: "#6b21a8" },
];

export function getSubjectColor(index: number) {
    return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

// ── Avatar initials ──────────────────────────────────────────────────────────
export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

// ── Status badge color ───────────────────────────────────────────────────────
export function getAttendanceColor(status: string) {
    switch (status) {
        case "Present":
            return {
                bg: "rgba(26,107,74,0.12)",
                border: "#1A6B4A",
                text: "#0F4D35",
                dot: "#1A6B4A",
            };
        case "Absent":
            return {
                bg: "rgba(239,68,68,0.12)",
                border: "#ef4444",
                text: "#991b1b",
                dot: "#ef4444",
            };
        case "Leave":
            return {
                bg: "rgba(245,166,35,0.15)",
                border: "#F5A623",
                text: "#92580D",
                dot: "#F5A623",
            };
        default:
            return {
                bg: "rgba(122,122,110,0.1)",
                border: "#7A7A6E",
                text: "#7A7A6E",
                dot: "#7A7A6E",
            };
    }
}

export function getScheduleStatusColor(status: string) {
    if (status === "Cancelled") {
        return {
            bg: "rgba(239,68,68,0.08)",
            border: "#ef4444",
            text: "#991b1b",
        };
    }
    return {
        bg: "rgba(26,107,74,0.10)",
        border: "#1A6B4A",
        text: "#0F4D35",
    };
}
