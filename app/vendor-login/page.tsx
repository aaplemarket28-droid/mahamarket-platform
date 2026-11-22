"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

function getSafeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function VendorLoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const supabase = getSafeSupabaseClient();
    if (!supabase) {
      setErrorMsg("Supabase सेटिंग उपलब्ध नाही.");
      setLoading(false);
      return;
    }

    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("नोंदणी यशस्वी! आता लॉगिन करा किंवा ईमेल तपासा.");
        setIsRegister(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg("चुकीचा ईमेल किंवा पासवर्ड: " + error.message);
      } else {
        router.replace("/vendor/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-7 shadow-2xl space-y-5">
        <div>
          <span className="rounded bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-black uppercase">
            Vendor Partner Portal
          </span>
          <h1 className="mt-2 text-2xl font-black">
            {isRegister ? "नवीन दुकानदार नोंदणी" : "दुकानदार लॉगिन"}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            MahaMarket व्यवसाय डॅशबोर्डमध्ये प्रवेश करा
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-950 border border-red-700 p-3 text-xs text-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl bg-emerald-950 border border-emerald-700 p-3 text-xs text-emerald-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-300">ईमेल पत्ता *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
              className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300">पासवर्ड *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="किमान ६ अक्षरे"
              className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-400 py-3 text-sm font-black text-black hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? "कृपया थांबा..." : isRegister ? "खाते तयार करा" : "लॉगिन करा →"}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="font-bold text-amber-400 hover:underline"
          >
            {isRegister ? "आधीच खाते आहे? लॉगिन करा" : "नवीन दुकानदार? नोंदणी करा"}
          </button>
          <a href="/" className="hover:text-white">
            ← मुख्य पान
          </a>
        </div>
      </div>
    </div>
  );
}