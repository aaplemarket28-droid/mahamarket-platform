"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const SUPER_ADMIN_EMAIL = "aaplemarket28@gmail.com";

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"businesses" | "ads">("businesses");

  // व्यवसाय स्टेट्स
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [editingBiz, setEditingBiz] = useState<any>(null);

  // जाहिराती स्टेट्स
  const [ads, setAds] = useState<any[]>([]);
  const [adTitle, setAdTitle] = useState("");
  const [adType, setAdType] = useState("spot");
  const [scrollingText, setScrollingText] = useState("");
  const [adFile, setAdFile] = useState<File | null>(null);
  const [uploadingAd, setUploadingAd] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [targetDistrict, setTargetDistrict] = useState("ALL");
  const [endDate, setEndDate] = useState("2026-12-31");

  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    verifyAdminAndLoad();
  }, []);

  const verifyAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      await supabase.auth.signOut();
      router.push("/admin-login");
      return;
    }

    setAdminUser(user);
    await Promise.all([fetchAllBusinesses(), fetchAllAds()]);
    setLoading(false);
  };

  const fetchAllBusinesses = async () => {
    const { data } = await supabase
      .from("businesses")
      .select("*, categories(name_mr), profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    if (data) setBusinesses(data);
  };

  const fetchAllAds = async () => {
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAds(data);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from("businesses").update({ status: newStatus }).eq("id", id);
    await fetchAllBusinesses();
  };

  const toggleFlag = async (id: string, field: "is_verified" | "is_featured", currentVal: boolean) => {
    await supabase.from("businesses").update({ [field]: !currentVal }).eq("id", id);
    await fetchAllBusinesses();
  };

  const deleteBusiness = async (id: string, name: string) => {
    if (!window.confirm(`तुम्हाला "${name}" हा व्यवसाय कायमचा डिलीट करायचा आहे का?`)) return;
    await supabase.from("businesses").delete().eq("id", id);
    await fetchAllBusinesses();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBiz) return;
    await supabase
      .from("businesses")
      .update({
        business_name_mr: editingBiz.business_name_mr,
        district: editingBiz.district,
        city: editingBiz.city,
        address: editingBiz.address,
        phone: editingBiz.phone,
        description_mr: editingBiz.description_mr,
      })
      .eq("id", editingBiz.id);
    setEditingBiz(null);
    await fetchAllBusinesses();
  };

  // फोटोसह नवीन जाहिरात जोडणे
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingAd(true);
    let uploadedImageUrl = null;

    if (adFile) {
      const fileExt = adFile.name.split(".").pop();
      const fileName = `ads/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("marketplace-media")
        .upload(fileName, adFile);

      if (uploadError) {
        alert("फोटो अपलोड त्रुटी: " + uploadError.message);
        setUploadingAd(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("marketplace-media")
        .getPublicUrl(fileName);

      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("advertisements").insert({
      title: adTitle,
      ad_type: adType,
      scrolling_text: scrollingText || null,
      image_url: uploadedImageUrl,
      target_url: targetUrl || null,
      target_district: targetDistrict || "ALL",
      start_date: today,
      end_date: endDate,
      is_active: true,
    });

    if (!error) {
      setAdTitle("");
      setScrollingText("");
      setAdFile(null);
      setTargetUrl("");
      await fetchAllAds();
    } else {
      alert("जाहिरात जोडताना त्रुटी: " + error.message);
    }
    setUploadingAd(false);
  };

  const toggleAdStatus = async (id: string, current: boolean) => {
    await supabase.from("advertisements").update({ is_active: !current }).eq("id", id);
    await fetchAllAds();
  };

  const deleteAd = async (id: string) => {
    if (!window.confirm("ही जाहिरात कायमची डिलीट करायची का?")) return;
    await supabase.from("advertisements").delete().eq("id", id);
    await fetchAllAds();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin-login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-bold">
        Admin कंट्रोल पॅनेल उघडत आहे...
      </div>
    );
  }

  const filteredList = businesses.filter((b) => (filter === "all" ? true : b.status === filter));
  const pendingCount = businesses.filter((b) => b.status === "pending").length;
  const approvedCount = businesses.filter((b) => b.status === "approved").length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase">
            Super Admin
          </span>
          <h1 className="text-xl font-extrabold mt-1">MahaMarket कंट्रोल डॅशबोर्ड</h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("businesses")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "businesses" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            🏪 व्यवसाय नियंत्रण ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "ads" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            📢 जाहिरात मॅनेजर ({ads.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-800"
          >
            वेबसाइट पहा ↗
          </a>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold hover:bg-red-700"
          >
            लॉगआउट
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === "businesses" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-500">एकूण व्यवसाय</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{businesses.length}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-5 shadow-sm border border-amber-200">
                <p className="text-xs font-bold text-amber-800">मंजुरी बाकी (Pending)</p>
                <p className="mt-2 text-3xl font-black text-amber-900">{pendingCount}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-5 shadow-sm border border-emerald-200">
                <p className="text-xs font-bold text-emerald-800">लाईव्ह व्यवसाय (Approved)</p>
                <p className="mt-2 text-3xl font-black text-emerald-900">{approvedCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-5 shadow-sm text-white">
                <p className="text-xs font-bold text-slate-400">सक्रिय जाहिराती</p>
                <p className="mt-2 text-3xl font-black text-amber-400">
                  {ads.filter((a) => a.is_active).length}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: "all", label: "सर्व व्यवसाय" },
                { key: "pending", label: `मंजुरी बाकी (${pendingCount})` },
                { key: "approved", label: "लाईव्ह (Approved)" },
                { key: "rejected", label: "नामंजूर (Rejected)" },
                { key: "suspended", label: "बंद केलेले (Suspended)" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    filter === tab.key
                      ? "bg-slate-900 text-white shadow"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredList.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-500 border border-slate-200">
                  या विभागात सध्या कोणताही व्यवसाय नाही.
                </div>
              ) : (
                filteredList.map((biz) => (
                  <div key={biz.id} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
                            {biz.categories?.name_mr || "श्रेणी नाही"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-0.5 text-xs font-extrabold uppercase ${
                              biz.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : biz.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {biz.status}
                          </span>
                          {biz.is_verified && (
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                              ✓ Verified
                            </span>
                          )}
                          {biz.is_featured && (
                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                              ★ Featured
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 text-xl font-extrabold text-slate-900">{biz.business_name_mr}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          📍 <strong>{biz.city}, {biz.district}</strong> — {biz.address}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          📞 संपर्क: {biz.phone} | मालक: {biz.profiles?.full_name || "Vendor"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {biz.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(biz.id, "approved")}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            ✓ Approve (लाईव्ह करा)
                          </button>
                        )}
                        {biz.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(biz.id, "rejected")}
                            className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
                          >
                            ✗ Reject
                          </button>
                        )}
                        {biz.status === "approved" && (
                          <button
                            onClick={() => updateStatus(biz.id, "suspended")}
                            className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                          >
                            ⏸ Suspend
                          </button>
                        )}
                        <button
                          onClick={() => toggleFlag(biz.id, "is_verified", biz.is_verified)}
                          className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100"
                        >
                          {biz.is_verified ? "Verified काढा" : "✓ Verified द्या"}
                        </button>
                        <button
                          onClick={() => toggleFlag(biz.id, "is_featured", biz.is_featured)}
                          className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100"
                        >
                          {biz.is_featured ? "Featured काढा" : "★ Featured करा"}
                        </button>
                        <button
                          onClick={() => setEditingBiz(biz)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => deleteBusiness(biz.id, biz.business_name_mr)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <form onSubmit={handleCreateAd} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">नवीन जाहिरात लावा (फोटो / मजकूर)</h2>

              <div>
                <label className="block text-xs font-bold text-slate-700">जाहिरातीचे शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="उदा. सहेली पार्लर खास ऑफर"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">जाहिरातीचा प्रकार *</label>
                  <select
                    value={adType}
                    onChange={(e) => setAdType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="spot">Spot Ad (मुख्य पानावरील खास जाहिरात)</option>
                    <option value="banner">Banner Ad (मोठे फोटो बॅनर)</option>
                    <option value="popup">Popup Ad (वेबसाइट उघडताच दिसणारी)</option>
                    <option value="scrolling">Scrolling Ad (वरची चालणारी पट्टी)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">जिल्हा लक्ष्य (ALL = सर्व)</label>
                  <input
                    type="text"
                    value={targetDistrict}
                    onChange={(e) => setTargetDistrict(e.target.value)}
                    placeholder="ALL किंवा बुलढाणा / मेहकर"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* जाहिरात फोटो / बॅनर अपलोड */}
              <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/50 p-4">
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  🖼️ जाहिरातीचा फोटो / बॅनर निवडा (Spot, Banner, Popup साठी)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAdFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-slate-800"
                />
                {adFile && (
                  <p className="mt-1 text-xs font-bold text-emerald-700">✓ निवडलेली फाईल: {adFile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">जाहिरातीचा मजकूर / ऑफर माहिती</label>
                <input
                  type="text"
                  value={scrollingText}
                  onChange={(e) => setScrollingText(e.target.value)}
                  placeholder="उदा. सर्व सेवांवर २०% सूट! संपर्क: 9607636444"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">WhatsApp / वेबसाइट लिंक</label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://wa.me/919607636444"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">अंतिम तारीख *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingAd}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {uploadingAd ? "फोटो अपलोड होत आहे..." : "+ जाहिरात लाईव्ह करा"}
              </button>
            </form>

            {/* चालू असलेल्या जाहिराती */}
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">सध्याच्या जाहिराती ({ads.length})</h2>
              {ads.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-slate-500 border border-slate-200">
                  अजून कोणतीही जाहिरात तयार केलेली नाही.
                </div>
              ) : (
                ads.map((ad) => (
                  <div key={ad.id} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      {ad.image_url && (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="h-16 w-20 rounded-lg object-cover border border-slate-200"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                            {ad.ad_type}
                          </span>
                          <span className="text-xs font-bold text-slate-500">जिल्हा: {ad.target_district}</span>
                        </div>
                        <h3 className="mt-1 font-extrabold text-slate-900">{ad.title}</h3>
                        {ad.scrolling_text && <p className="text-sm text-slate-600 mt-1">{ad.scrolling_text}</p>}
                        <p className="text-xs text-slate-400 mt-1">मुदत: {ad.end_date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          ad.is_active ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ad.is_active ? "● चालू" : "○ बंद"}
                      </button>
                      <button
                        onClick={() => deleteAd(ad.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {editingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSaveEdit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900">व्यवसाय माहिती सुधारणा (Admin Edit)</h2>
            <div>
              <label className="block text-xs font-bold text-slate-700">व्यवसायाचे नाव</label>
              <input
                type="text"
                required
                value={editingBiz.business_name_mr}
                onChange={(e) => setEditingBiz({ ...editingBiz, business_name_mr: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">जिल्हा</label>
                <input
                  type="text"
                  required
                  value={editingBiz.district}
                  onChange={(e) => setEditingBiz({ ...editingBiz, district: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">शहर</label>
                <input
                  type="text"
                  required
                  value={editingBiz.city}
                  onChange={(e) => setEditingBiz({ ...editingBiz, city: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">मोबाईल नंबर</label>
              <input
                type="text"
                required
                value={editingBiz.phone}
                onChange={(e) => setEditingBiz({ ...editingBiz, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">पत्ता</label>
              <input
                type="text"
                required
                value={editingBiz.address}
                onChange={(e) => setEditingBiz({ ...editingBiz, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBiz(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white"
              >
                बदल सेव्ह करा
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}