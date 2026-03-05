import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { BookOpen, Users, CalendarCheck, LayoutDashboard, GraduationCap, CalendarPlus } from "lucide-react";

export const metadata: Metadata = {
    title: "Class Schedule System",
    description:
        "A complete Class Schedule Management System — manage teachers, attendance, and schedules with a beautiful UI.",
    keywords: ["class schedule", "teacher attendance", "school management"],
};

const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teachers", label: "Teachers", icon: Users },
    { href: "/subjects", label: "Subjects", icon: GraduationCap },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/schedules", label: "Schedules", icon: BookOpen },
];

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                {/* Grain texture overlay */}
                <div className="grain-overlay" aria-hidden="true" />

                {/* ── Navbar ─────────────────────────────────────────────────────── */}
                <header className="navbar-glass sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #1A6B4A 0%, #0F4D35 100%)",
                                }}
                            >
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <span
                                className="font-display text-lg"
                                style={{ color: "#1A1A1A" }}
                            >
                                ClassSync
                            </span>
                        </Link>

                        {/* Nav links */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:bg-black/5"
                                    style={{ color: "#1A1A1A" }}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </Link>
                            ))}
                        </nav>

                        {/* Quick-add CTAs */}
                        <div className="hidden md:flex items-center gap-2">
                            <Link href="/schedules/add" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-black/5" style={{ border: "1.5px solid rgba(0,0,0,0.12)", color: "#1A1A1A" }}>
                                <CalendarPlus className="w-4 h-4" />
                                Add Schedule
                            </Link>
                            <Link href="/teachers/add" className="btn-pill-green">
                                + Add Teacher
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── Page Content ───────────────────────────────────────────────── */}
                <main className="relative min-h-screen">
                    {/* Background blobs */}
                    <div className="bg-blob-amber" aria-hidden="true" />
                    <div className="bg-blob-green" aria-hidden="true" />

                    <div className="relative z-10">{children}</div>
                </main>

                {/* ── Mobile bottom nav ──────────────────────────────────────────── */}
                <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 navbar-glass border-t border-white/40">
                    <div className="flex items-center justify-around h-16 px-4">
                        {navLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex flex-col items-center gap-1 text-xs font-medium"
                                style={{ color: "#7A7A6E" }}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </Link>
                        ))}
                    </div>
                </nav>
            </body>
        </html>
    );
}
