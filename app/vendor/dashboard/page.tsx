"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function VendorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [myBusinesses, setMyBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // फॉर्म स्टेट्स
  const [businessNameMr, setBusinessNameMr] = useState("");
  const [businessNameEn, setBusinessNameEn] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [district, setDistrict] = useState("बुलढाणा");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [descriptionMr, setDescriptionMr] = useState("");
  const [shopPhoto, setShopPhoto] = useState<File | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/vendor-login");
      return;
    }

    setUser(user);

    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true);
    if (catData) {
      setCategories(catData);
      if (catData.length > 0) setCategoryId(catData[0].id);
    }

    await loadMyBusinesses(user.id);
    setLoading(false);
  };

  const loadMyBusinesses = async (vendorId: string) => {
    const { data } = await supabase
      .from("businesses")
      .select("*, categories(name_mr)")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });
    if (data) setMyBusinesses(data);
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setMsg("");

    let uploadedPhotoUrl = null;

    if (shopPhoto) {
      const fileExt = shopPhoto.name.split(".").pop();
      const fileName = `shops/${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("marketplace-media")
        .upload(fileName, shopPhoto);

      if (uploadError) {
        setMsg("फोटो अपलोड त्रुटी: " + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("marketplace-media")
        .getPublicUrl(fileName);

      uploadedPhotoUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("businesses").insert({
      vendor_id: user.id,
      category_id: categoryId,
      business_name_mr: businessNameMr,
      business_name_en: businessNameEn,
      district,
      city,
      address,
      phone,
      whatsapp: whatsapp || phone,
      description_mr: descriptionMr,
      cover_image_url: uploadedPhotoUrl,
      status: "pending",
    });

    if (error) {
      setMsg("त्रुटी: " + error.message);
    } else {
      setMsg("तुमचा व्यवसाय Admin च्या मंजुरीसाठी (Pending) पाठवला गेला आहे! मंजुरी मिळाल्यावर तो वेबसाइटवर लाईव्ह दिसेल.");
      setBusinessNameMr("");
      setBusinessNameEn("");
      setCity("");
      setAddress("");
      setPhone("");
      setWhatsapp("");
      setDescriptionMr("");
      setShopPhoto(null);
      await loadMyBusinesses(user.id);
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/vendor-login");
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-bold">डॅशबोर्ड लोड होत आहे...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between shadow">
        <div>
          <h1 className="text-xl font-extrabold">MahaMarket — व्यावसायिक डॅशबोर्ड</h1>
          <p className="text-xs text-emerald-200">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
        >
          लॉगआउट
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow border border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">नवीन व्यवसाय नोंदणी करा</h2>
          <p className="text-xs text-slate-500 mb-5">
            नोंदणी केल्यानंतर Admin तपासणी करतील आणि मंजुरी दिल्यावर तुमचे दुकान लाईव्ह दिसेल.
          </p>

          {msg && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-sm font-semibold text-emerald-900">
              {msg}
            </div>
          )}

          <form onSubmit={handleAddBusiness} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">दुकानाचे / व्यवसायाचे नाव (मराठीत) *</label>
              <input
                type="text"
                required
                value={businessNameMr}
                onChange={(e) => setBusinessNameMr(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                placeholder="उदा. श्री गणेश इलेक्ट्रिकल्स"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">व्यवसायाचे नाव (English मध्ये)</label>
              <input
                type="text"
                value={businessNameEn}
                onChange={(e) => setBusinessNameEn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                placeholder="Ex. Shree Ganesh Electricals"
              />
            </div>

            {/* दुकानाचा फोटो / बॅनर अपलोड */}
            <div className="rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 p-3.5">
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                📸 दुकानाचा फोटो किंवा लोगो निवडा
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setShopPhoto(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-emerald-900"
              />
              {shopPhoto && (
                <p className="mt-1 text-xs font-bold text-emerald-700">✓ निवडलेला फोटो: {shopPhoto.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700">व्यवसाय श्रेणी *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name_mr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">जिल्हा *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  placeholder="उदा. बुलढाणा / पुणे"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700">शहर / गाव *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  placeholder="उदा. मेहकर / लोणार"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">संपर्क मोबाईल नंबर *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">पूर्ण पत्ता *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                placeholder="दुकानाचा पूर्ण पत्ता, मुख्य रस्ता, जवळची खूण"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">व्यवसायाची थोडक्यात माहिती</label>
              <textarea
                rows={3}
                value={descriptionMr}
                onChange={(e) => setDescriptionMr(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                placeholder="तुमच्याकडे कोणत्या वस्तू किंवा सेवा मिळतात ते लिहा..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-800 py-3 text-sm font-bold text-white hover:bg-emerald-900 transition disabled:opacity-50"
            >
              {submitting ? "माहिती व फोटो पाठवत आहे..." : "मंजुरीसाठी व्यवसाय पाठवा →"}
            </button>
          </form>
        </section>

        {/* नोंदवलेले व्यवसाय */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900">माझे नोंदवलेले व्यवसाय ({myBusinesses.length})</h2>
          {myBusinesses.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center border border-slate-200 text-slate-500">
              तुम्ही अजून कोणताही व्यवसाय नोंदवलेला नाही. डाव्या बाजूचा फॉर्म भरून सुरुवात करा.
            </div>
          ) : (
            myBusinesses.map((biz) => (
              <div key={biz.id} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex gap-4 items-start">
                {biz.cover_image_url && (
                  <img
                    src={biz.cover_image_url}
                    alt={biz.business_name_mr}
                    className="h-20 w-24 rounded-xl object-cover border border-slate-200"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-700">{biz.categories?.name_mr}</span>
                      <h3 className="text-lg font-extrabold text-slate-900">{biz.business_name_mr}</h3>
                      <p className="text-xs text-slate-500">📍 {biz.city}, {biz.district} | 📞 {biz.phone}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                        biz.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : biz.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {biz.status === "approved" ? "✓ लाईव्ह" : biz.status === "rejected" ? "✗ नामंजूर" : "⏳ Pending"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{biz.address}</p>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}