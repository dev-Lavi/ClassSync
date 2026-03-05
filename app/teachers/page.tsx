"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, BookOpen, Trash2, ChevronRight } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Teacher {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    _count: { subjects: number; schedules: number };
    subjects: { id: string; name: string }[];
}

const AVATAR_COLORS = [
    { bg: "linear-gradient(135deg,#1A6B4A,#0F4D35)", text: "#fff" },
    { bg: "linear-gradient(135deg,#FBBF5A,#F5A623)", text: "#fff" },
    { bg: "linear-gradient(135deg,#6366f1,#4338ca)", text: "#fff" },
    { bg: "linear-gradient(135deg,#ec4899,#db2777)", text: "#fff" },
    { bg: "linear-gradient(135deg,#0ea5e9,#0284c7)", text: "#fff" },
];

function getAvatarColor(index: number) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function loadTeachers() {
        try {
            const res = await fetch("/api/teachers");
            if (res.ok) {
                const d = await res.json();
                setTeachers(d.data ?? []);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTeachers();
    }, []);

    async function handleDelete(id: string, name: string) {
        if (
            !confirm(
                `Delete ${name}? This will also remove their subjects and schedules.`
            )
        )
            return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
            if (res.ok) {
                setTeachers((prev) => prev.filter((t) => t.id !== id));
            }
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10">
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-8 animate-fade-up">
                <div>
                    <p className="text-sm font-medium" style={{ color: "#7A7A6E" }}>
                        Faculty Directory
                    </p>
                    <h1 className="font-display text-4xl mt-0.5">Teachers</h1>
                </div>
                <Link href="/teachers/add" className="btn-pill-green">
                    <Plus className="w-4 h-4" />
                    Add Teacher
                </Link>
            </div>

            {/* ── Stats Row ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass-card-sm p-4 animate-fade-up animate-delay-80">
                    <p className="text-xs font-medium mb-1" style={{ color: "#7A7A6E" }}>
                        Total
                    </p>
                    <p className="font-display text-3xl">{loading ? "—" : teachers.length}</p>
                </div>
                <div className="glass-card-sm p-4 animate-fade-up animate-delay-160">
                    <p className="text-xs font-medium mb-1" style={{ color: "#7A7A6E" }}>
                        Subjects
                    </p>
                    <p className="font-display text-3xl">
                        {loading ? "—" : teachers.reduce((a, t) => a + t._count.subjects, 0)}
                    </p>
                </div>
                <div className="glass-card-sm p-4 animate-fade-up animate-delay-240">
                    <p className="text-xs font-medium mb-1" style={{ color: "#7A7A6E" }}>
                        Classes
                    </p>
                    <p className="font-display text-3xl">
                        {loading ? "—" : teachers.reduce((a, t) => a + t._count.schedules, 0)}
                    </p>
                </div>
            </div>

            {/* ── Teacher Cards ─────────────────────────────────────────────────── */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="glass-card p-5 h-24 animate-pulse"
                            style={{ opacity: 1 - i * 0.12 }}
                        />
                    ))}
                </div>
            ) : teachers.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "#7A7A6E" }} />
                    <h2 className="font-display text-2xl mb-2">No teachers yet</h2>
                    <p className="text-sm mb-6" style={{ color: "#7A7A6E" }}>
                        Get started by adding your first teacher.
                    </p>
                    <Link href="/teachers/add" className="btn-pill-green">
                        Add First Teacher
                    </Link>
                </div>
            ) : (
                <div className="glass-card overflow-hidden animate-fade-up animate-delay-160">
                    <div className="divide-y divide-black/5">
                        {teachers.map((teacher, idx) => {
                            const colors = getAvatarColor(idx);
                            return (
                                <div
                                    key={teacher.id}
                                    className="flex items-center gap-4 p-5 hover:bg-black/[0.02] transition-colors"
                                >
                                    {/* Avatar */}
                                    <div
                                        className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-bold"
                                        style={colors}
                                    >
                                        {getInitials(teacher.name)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">
                                            {teacher.name}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: "#7A7A6E" }}>
                                            {teacher.email}
                                        </p>
                                        {teacher.subjects.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {teacher.subjects.slice(0, 3).map((s) => (
                                                    <span
                                                        key={s.id}
                                                        className="text-xs px-2 py-0.5 rounded-full"
                                                        style={{
                                                            background: "rgba(26,107,74,0.10)",
                                                            color: "#0F4D35",
                                                        }}
                                                    >
                                                        {s.name}
                                                    </span>
                                                ))}
                                                {teacher.subjects.length > 3 && (
                                                    <span
                                                        className="text-xs px-2 py-0.5 rounded-full"
                                                        style={{
                                                            background: "rgba(0,0,0,0.06)",
                                                            color: "#7A7A6E",
                                                        }}
                                                    >
                                                        +{teacher.subjects.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                                        <div className="text-center">
                                            <p className="font-display text-lg">{teacher._count.subjects}</p>
                                            <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                                Subjects
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-display text-lg">
                                                {teacher._count.schedules}
                                            </p>
                                            <p className="text-xs" style={{ color: "#7A7A6E" }}>
                                                Classes
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleDelete(teacher.id, teacher.name)}
                                            disabled={deletingId === teacher.id}
                                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-red-50"
                                            title="Delete teacher"
                                        >
                                            {deletingId === teacher.id ? (
                                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            )}
                                        </button>
                                        <ChevronRight
                                            className="w-4 h-4"
                                            style={{ color: "#7A7A6E" }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Floating Add Button (mobile) */}
            <Link
                href="/teachers/add"
                className="fixed bottom-20 right-6 md:hidden w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
                style={{ background: "#1A3C34" }}
            >
                <Plus className="w-6 h-6 text-white" />
            </Link>
        </div>
    );
}
