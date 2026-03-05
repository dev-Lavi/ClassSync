"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, CheckCircle2 } from "lucide-react";

export default function AddTeacherPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/teachers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Failed to add teacher");
                return;
            }

            setSuccess(true);
            setTimeout(() => router.push("/teachers"), 1500);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-lg mx-auto px-6 py-10">
            {/* Back */}
            <Link
                href="/teachers"
                className="inline-flex items-center gap-2 text-sm font-medium mb-8 animate-fade-up"
                style={{ color: "#7A7A6E" }}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Teachers
            </Link>

            {/* Card */}
            <div className="glass-card p-8 animate-fade-up animate-delay-80">
                {/* Icon */}
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: "linear-gradient(135deg,#1A6B4A,#0F4D35)" }}
                >
                    <UserPlus className="w-7 h-7 text-white" />
                </div>

                <h1 className="font-display text-3xl mb-1">Add Teacher</h1>
                <p className="text-sm mb-8" style={{ color: "#7A7A6E" }}>
                    Fill in the teacher&apos;s details below.
                </p>

                {/* Success state */}
                {success && (
                    <div
                        className="flex items-center gap-3 p-4 rounded-xl mb-6"
                        style={{
                            background: "rgba(26,107,74,0.12)",
                            border: "1px solid rgba(26,107,74,0.3)",
                        }}
                    >
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#1A6B4A" }} />
                        <p className="text-sm font-medium" style={{ color: "#0F4D35" }}>
                            Teacher added successfully! Redirecting…
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div
                        className="p-4 rounded-xl mb-6 text-sm"
                        style={{
                            background: "rgba(239,68,68,0.10)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            color: "#991b1b",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#1A1A1A" }}
                        >
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            placeholder="e.g. Dr. Jane Smith"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="input-floating"
                            disabled={loading || success}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#1A1A1A" }}
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="e.g. jane.smith@school.edu"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            className="input-floating"
                            disabled={loading || success}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || success}
                        className="btn-pill-green w-full justify-center py-3 mt-2"
                        style={{ borderRadius: "12px" }}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Saving…
                            </span>
                        ) : (
                            "Add Teacher"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
