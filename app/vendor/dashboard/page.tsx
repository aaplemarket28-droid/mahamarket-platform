"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

function getSafeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function VendorDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeSection, setActiveSection] = useState<"shops" | "crm">("shops");

  const [categories, setCategories] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [myLeads, setMyLeads] = useState<any[]>([]);

  // नवीन दुकान नोंदणी स्टेट्स
  const [businessNameMr, setBusinessNameMr] = useState("");
  const [businessNameEn, setBusinessNameEn] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [district, setDistrict] = useState("बुलढाणा");
  const [taluka, setTaluka] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [openingHours, setOpeningHours] = useState("सकाळी ०९:०० ते रात्री ०९:००");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [descriptionMr, setDescriptionMr] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // विद्यमान दुकान Edit स्टेट्स
  const [editingStore, setEditingStore] = useState<any>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    initVendorData();
  }, []);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  const uploadMedia = async (file: File) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) throw new Error("Supabase configuration missing");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `vendor-shops/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage
      .from("marketplace-media")
      .upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage
      .from("marketplace-media")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const initVendorData = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    let currentUser = sessionData?.session?.user || null;
    if (!currentUser) {
      const { data: userData } = await supabase.auth.getUser();
      currentUser = userData?.user || null;
    }

    if (!currentUser) {
      router.replace("/vendor-login");
      return;
    }

    setUser(currentUser);

    const [catRes, bizRes] = await Promise.all([
      supabase.from("categories").select("*").eq("is_active", true),
      supabase
        .from("businesses")
        .select("*, categories(name_mr, icon)")
        .eq("vendor_id", currentUser.id)
        .order("created_at", { ascending: false }),
    ]);

    if (catRes.data) {
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !categoryId) setCategoryId(catRes.data[0].id);
    }

    const userBizList = bizRes.data || [];
    setBusinesses(userBizList);

    // या दुकानदाराच्या दुकानांसाठी आलेले CRM Leads शोधणे
    if (userBizList.length > 0) {
      const bizNames = userBizList.map((b: any) => b.business_name_mr).filter(Boolean);
      const { data: leadsData } = await supabase
        .from("crm_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (leadsData) {
        const matched = leadsData.filter((l: any) =>
          bizNames.some(
            (name: string) =>
              name &&
              l.business_name &&
              l.business_name.toLowerCase().includes(name.toLowerCase())
          )
        );
        setMyLeads(matched);
      }
    }

    setLoading(false);
  };

  const handleRegisterStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase || !user) return;
    setSaving(true);

    try {
      let imageUrl = null;
      if (photoFile) {
        imageUrl = await uploadMedia(photoFile);
      }

      const { error } = await supabase.from("businesses").insert({
        vendor_id: user.id,
        category_id: categoryId || null,
        business_name_mr: businessNameMr,
        business_name_en: businessNameEn || null,
        district,
        taluka: taluka || null,
        city,
        pincode: pincode || null,
        map_url: mapUrl || null,
        opening_hours: openingHours || "सकाळी ०९:०० ते रात्री ०९:००",
        is_open: true,
        address,
        phone,
        whatsapp: whatsapp || phone,
        description_mr: descriptionMr || null,
        cover_image_url: imageUrl,
        status: "pending",
      });

      if (error) {
        alert("दुकान नोंदणी त्रुटी: " + error.message);
      } else {
        setBusinessNameMr("");
        setBusinessNameEn("");
        setTaluka("");
        setCity("");
        setPincode("");
        setMapUrl("");
        setAddress("");
        setPhone("");
        setWhatsapp("");
        setDescriptionMr("");
        setPhotoFile(null);
        await initVendorData();
        showToast("तुमचे दुकान नोंदवले गेले आहे! Admin मंजुरीनंतर ते लाईव्ह होईल.");
      }
    } catch (err: any) {
      alert("फोटो अपलोड त्रुटी: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOpenStatus = async (biz: any) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const nextState = biz.is_open === false ? true : false;
    await supabase.from("businesses").update({ is_open: nextState }).eq("id", biz.id);
    await initVendorData();
    showToast(nextState ? "दुकान 'सुरू (OPEN)' केले आहे." : "दुकान 'बंद (CLOSED)' केले आहे.");
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase || !editingStore) return;
    setSaving(true);

    try {
      let finalPhoto = editingStore.cover_image_url;
      if (editPhotoFile) {
        finalPhoto = await uploadMedia(editPhotoFile);
      }

      await supabase
        .from("businesses")
        .update({
          business_name_mr: editingStore.business_name_mr,
          business_name_en: editingStore.business_name_en || "",
          district: editingStore.district,
          taluka: editingStore.taluka || "",
          city: editingStore.city,
          pincode: editingStore.pincode || "",
          map_url: editingStore.map_url || "",
          opening_hours: editingStore.opening_hours || "सकाळी ०९:०० ते रात्री ०९:००",
          address: editingStore.address,
          phone: editingStore.phone,
          whatsapp: editingStore.whatsapp || editingStore.phone,
          description_mr: editingStore.description_mr || "",
          cover_image_url: finalPhoto,
        })
        .eq("id", editingStore.id);

      setEditingStore(null);
      setEditPhotoFile(null);
      await initVendorData();
      showToast("दुकानाची माहिती आणि Location अद्ययावत झाली!");
    } catch (err: any) {
      alert("अपडेट करताना त्रुटी: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSafeSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/vendor-login");
  };

  if (!mounted || loading) {
    return (
      <div
        suppressHydrationWarning
        className="flex min-h-screen items-center justify-center bg-neutral-950 text-white font-bold"
      >
        Vendor पोर्टल उघडत आहे...
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-neutral-100 text-neutral-900">
      {notice && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-2xl">
          ✓ {notice}
        </div>
      )}

      <header className="bg-neutral-950 px-5 py-4 text-white flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800">
        <div>
          <span className="rounded bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-black uppercase">
            Vendor Partner Portal
          </span>
          <h1 className="text-xl font-black mt-1">MahaMarket व्यवसाय भागीदार डॅशबोर्ड</h1>
          <p className="text-[11px] text-neutral-400">{user?.email}</p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setActiveSection("shops")}
            className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeSection === "shops" ? "bg-amber-400 text-black" : "text-neutral-300 hover:text-white"
            }`}
          >
            🏪 माझी दुकाने ({businesses.length})
          </button>
          <button
            onClick={() => setActiveSection("crm")}
            className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeSection === "crm" ? "bg-amber-400 text-black" : "text-neutral-300 hover:text-white"
            }`}
          >
            📊 ग्राहक CRM / Views ({myLeads.length})
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-700"
        >
          लॉगआउट
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 space-y-8">
        {activeSection === "shops" ? (
          <>
            {/* नवीन दुकान नोंदणी फॉर्म (सविस्तर Location व Map सह) */}
            <form
              onSubmit={handleRegisterStore}
              className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-4"
            >
              <h2 className="text-xl font-black text-neutral-950">
                + नवीन दुकान / व्यवसाय नोंदवा
              </h2>

              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700">दुकानाचे नाव (मराठी) *</label>
                  <input
                    type="text"
                    required
                    value={businessNameMr}
                    onChange={(e) => setBusinessNameMr(e.target.value)}
                    placeholder="उदा. श्री गणेश ट्रेडर्स"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">Shop Name (English)</label>
                  <input
                    type="text"
                    value={businessNameEn}
                    onChange={(e) => setBusinessNameEn(e.target.value)}
                    placeholder="Shri Ganesh Traders"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">श्रेणी निवडा *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name_mr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700">जिल्हा *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">तालुका</label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    placeholder="उदा. मेहकर"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">शहर / गाव *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="उदा. मेहकर / लोणार"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700">पिनकोड</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="443301"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">मोबाईल नंबर *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9607636444"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">WhatsApp नंबर</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="न दिल्यास मोबाईल नंबर वापरला जाईल"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700">वेळ (Business Hours)</label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="सकाळी ०९:०० ते रात्री ०९:००"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">Google Maps लिंक</label>
                  <input
                    type="text"
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">दुकानाचा फोटो</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="mt-1 w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700">पूर्ण पत्ता *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="मुख्य चौक, लँडमार्क, रस्ता..."
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700">
                  व्यवसाय व उपलब्ध सेवांची माहिती
                </label>
                <textarea
                  rows={2}
                  value={descriptionMr}
                  onChange={(e) => setDescriptionMr(e.target.value)}
                  placeholder="ग्राहकांसाठी विशेष माहिती किंवा सेवा..."
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-amber-400 px-6 py-3 text-xs font-black text-black hover:bg-amber-500 disabled:opacity-50"
              >
                {saving ? "नोंदणी होत आहे..." : "+ दुकान नोंदणी पाठवा"}
              </button>
            </form>

            {/* नोंदवलेली दुकाने यादी */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-neutral-950">
                तुमची नोंदवलेली दुकाने ({businesses.length})
              </h2>

              {businesses.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-neutral-500 border border-neutral-200">
                  तुम्ही अजून कोणतेही दुकान नोंदवलेले नाही.
                </div>
              ) : (
                businesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200 flex flex-wrap items-start justify-between gap-4"
                  >
                    <div className="flex gap-4 items-start">
                      {biz.cover_image_url && (
                        <img
                          src={biz.cover_image_url}
                          alt={biz.business_name_mr}
                          className="h-20 w-24 rounded-xl object-cover border border-neutral-200 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-neutral-900 px-3 py-0.5 text-xs font-bold text-amber-400 uppercase">
                            {biz.status}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                              biz.is_open !== false
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {biz.is_open !== false ? "● सुरू (OPEN)" : "○ बंद (CLOSED)"}
                          </span>
                          {biz.is_verified && (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1.5 text-lg font-black text-neutral-950">
                          {biz.business_name_mr}
                        </h3>
                        <p className="text-xs text-neutral-600 mt-0.5">
                          📍 {biz.city}
                          {biz.taluka ? `, ता. ${biz.taluka}` : ""}, {biz.district}
                          {biz.pincode ? ` - ${biz.pincode}` : ""} | {biz.address}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          🕒 वेळ: {biz.opening_hours || "सकाळी ०९:०० ते रात्री ०९:००"} | 📞 {biz.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggleOpenStatus(biz)}
                        className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-bold hover:bg-neutral-100"
                      >
                        {biz.is_open !== false ? "बंद (Close) करा" : "सुरू (Open) करा"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingStore(biz);
                          setEditPhotoFile(null);
                        }}
                        className="rounded-lg bg-neutral-950 px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-neutral-800"
                      >
                        ✎ Edit माहिती / Map
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Vendor CRM & Visitor Activity Section */
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
              <h2 className="text-xl font-black text-neutral-950">
                तुमच्या दुकानासाठी आलेल्या ग्राहक CRM / Views नोंदी
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                ग्राहकांनी तुमच्या दुकानावर Quick View, Call, WhatsApp किंवा Share केल्यावर येथे नोंद दिसते.
              </p>
            </div>

            {myLeads.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-neutral-500 border border-neutral-200">
                सध्या तुमच्या दुकानासाठी कोणतीही ग्राहक नोंद नाही.
              </div>
            ) : (
              myLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-2xl bg-white p-4 shadow-sm border border-neutral-200 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <span className="rounded bg-neutral-900 px-2.5 py-0.5 text-[10px] font-black text-amber-400 uppercase">
                      {lead.action_source || "visitor"}
                    </span>
                    <h3 className="mt-1 font-black text-neutral-950">{lead.business_name}</h3>
                    <p className="text-xs text-neutral-600">
                      📍 {lead.city || "-"}, {lead.district || "-"} | {lead.notes || ""}
                    </p>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {new Date(lead.created_at).toISOString().slice(0, 16).replace("T", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Edit Store Modal */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleUpdateStore}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-black text-neutral-950">दुकान माहिती व Location अपडेट</h2>
            <div>
              <label className="block text-xs font-bold text-neutral-700">दुकानाचे नाव *</label>
              <input
                type="text"
                required
                value={editingStore.business_name_mr}
                onChange={(e) =>
                  setEditingStore({ ...editingStore, business_name_mr: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700">जिल्हा *</label>
                <input
                  type="text"
                  required
                  value={editingStore.district}
                  onChange={(e) => setEditingStore({ ...editingStore, district: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700">तालुका</label>
                <input
                  type="text"
                  value={editingStore.taluka || ""}
                  onChange={(e) => setEditingStore({ ...editingStore, taluka: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700">शहर / गाव *</label>
                <input
                  type="text"
                  required
                  value={editingStore.city}
                  onChange={(e) => setEditingStore({ ...editingStore, city: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700">पिनकोड</label>
                <input
                  type="text"
                  value={editingStore.pincode || ""}
                  onChange={(e) => setEditingStore({ ...editingStore, pincode: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">वेळ (Business Hours)</label>
              <input
                type="text"
                value={editingStore.opening_hours || ""}
                onChange={(e) =>
                  setEditingStore({ ...editingStore, opening_hours: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">पूर्ण पत्ता *</label>
              <input
                type="text"
                required
                value={editingStore.address}
                onChange={(e) => setEditingStore({ ...editingStore, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">Google Maps लिंक</label>
              <input
                type="text"
                value={editingStore.map_url || ""}
                onChange={(e) => setEditingStore({ ...editingStore, map_url: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">नवीन फोटो</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-bold"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-neutral-950 px-5 py-2 text-sm font-bold text-amber-400"
              >
                {saving ? "सेव्ह करत आहे..." : "बदल सेव्ह करा"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}