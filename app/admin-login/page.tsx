"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const SUPER_ADMIN_EMAIL = "aaplemarket28@gmail.com";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== SUPER_ADMIN_EMAIL) {
      setErrorMsg("प्रवेश नाकारला! हा ईमेल Super Admin साठी अधिकृत नाही.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setErrorMsg("लॉगिन अयशस्वी: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push("/admin/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800 text-white">
        <div className="text-center mb-6">
          <span className="inline-block rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-400 uppercase tracking-widest">
            Restricted Area
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-white">
            MahaMarket Admin Panel
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            फक्त अधिकृत नियंत्रकांसाठी (Super Admin)
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-950/80 border border-red-700 p-3 text-sm text-red-200 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300">Admin ईमेल</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
              placeholder="aaplemarket28@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300">पासवर्ड</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
          >
            {loading ? "तपासणी सुरू आहे..." : "Admin डॅशबोर्ड उघडा →"}
          </button>
        </form>
      </div>
    </div>
  );
}