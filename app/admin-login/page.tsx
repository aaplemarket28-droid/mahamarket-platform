"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const SUPER_ADMIN_EMAIL = "aaplemarket28@gmail.com";

function getSafeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const router = useRouter();

  useEffect(() => {
    const checkExistingAdmin = async () => {
      const supabase = getSafeSupabaseClient();
      if (!supabase) {
        setCheckingSession(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getUser();
        const currentEmail = data?.user?.email?.trim().toLowerCase();
        if (currentEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
          router.replace("/admin/dashboard");
          return;
        }
      } catch {}
      setCheckingSession(false);
    };
    checkExistingAdmin();
  }, [router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setLoading(true);

    const supabase = getSafeSupabaseClient();
    if (!supabase) {
      setErrorMsg("Supabase ENV (.env.local) कॉन्फिगरेशन सापडले नाही.");
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      setErrorMsg(`फक्त अधिकृत Super Admin (${SUPER_ADMIN_EMAIL}) खात्यावरूनच लॉगिन करता येईल.`);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMsg("लॉगिन अयशस्वी: " + error.message);
        setLoading(false);
        return;
      }

      if (data?.user?.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        setStatusMsg("लॉगिन यशस्वी! Admin डॅशबोर्ड उघडत आहे...");
        router.replace("/admin/dashboard");
        setTimeout(() => {
          if (typeof window !== "undefined" && window.location.pathname !== "/admin/dashboard") {
            window.location.href = "/admin/dashboard";
          }
        }, 500);
      } else {
        await supabase.auth.signOut();
        setErrorMsg("या खात्याला Admin परवानगी नाही.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg("अनपेक्षित त्रुटी: " + (err?.message || "लॉगिन झाले नाही."));
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white font-bold">
        Admin सत्र तपासत आहे...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 text-neutral-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border-2 border-amber-400">
        <div className="text-center mb-6">
          <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-black uppercase">
            Restricted Command Access
          </span>
          <h1 className="mt-2 text-2xl font-black text-neutral-950">
            MahaMarket Admin Login
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            फक्त अधिकृत नियंत्रकांसाठी स्वतंत्र पोर्टल
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-300 p-3 text-xs font-bold text-red-700">
            ⚠️ {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-800">
            ✓ {statusMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-neutral-700 mb-1">
              Admin ईमेल *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-amber-500"
              placeholder="aaplemarket28@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-neutral-700 mb-1">
              पासवर्ड *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-amber-500"
              placeholder="तुमचा पासवर्ड टाका"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-black text-amber-400 hover:bg-neutral-800 transition disabled:opacity-50"
          >
            {loading ? "लॉगिन होत आहे..." : "Admin डॅशबोर्डवर जा →"}
          </button>
        </form>
      </div>
    </div>
  );
}