"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Lang = "mr" | "hi" | "en";

const DEFAULT_DISTRICTS = [
  "बुलढाणा",
  "मेहकर",
  "लोणार",
  "पुणे",
  "छत्रपती संभाजीनगर",
  "नागपूर",
  "मुंबई",
  "नाशिक",
];

const DEFAULT_APPEARANCE = {
  fontFamily: "sans",
  accentColor: "amber",
  cardBorder: "rounded-2xl border border-neutral-200",
  headerStyle: "dark",
  showTrustBar: true,
};

const TEXTS = {
  mr: {
    brand: "MahaMarket",
    subBrand: ".in",
    locationLabel: "तुमचे शहर / जिल्हा",
    allMaharashtra: "संपूर्ण महाराष्ट्र",
    searchPlaceholder: "दुकान, ब्रँड, सेवा किंवा वस्तू शोधा...",
    searchBtn: "शोधा",
    savedStores: "आवडते",
    allCategories: "सर्व श्रेणी",
    sortLabel: "क्रमवारी:",
    sortFeatured: "खास निवडक प्रथम",
    sortNewest: "नवीन जोडलेले",
    sortAlpha: "नावानुसार (A-Z)",
    featuredHeading: "★ खास निवडक प्रीमियम दुकाने",
    featuredSub: "ग्राहकांच्या पसंतीस उतरलेले विश्वासार्ह व्यवसाय",
    allStoresHeading: "सर्व प्रमाणित स्थानिक दुकाने",
    verifiedBadge: "✓ प्रमाणित दुकान",
    openBadge: "● सुरू (OPEN)",
    closedBadge: "○ बंद (CLOSED)",
    viewDetails: "संपूर्ण माहिती पहा",
    callNow: "📞 कॉल करा",
    whatsappNow: "💬 WhatsApp",
    copyPhone: "📋 कॉपी",
    shareBtn: "↗ शेअर करा",
    mapBtn: "📍 नकाशा पहा",
    noResults: "तुमच्या शोधाशी जुळणारे दुकान सध्या उपलब्ध नाही.",
    resetFilter: "सर्व दुकाने पुन्हा पहा",
    trust1: "१००% प्रमाणित व्यवसाय",
    trust2: "दुकानदाराशी थेट संपर्क",
    trust3: "शून्य मध्यस्थ कमिशन",
    trust4: "संपूर्ण महाराष्ट्र कव्हरेज",
    contactHeading: "ग्राहक मदत आणि संपर्क केंद्र",
    footerTitle: "MahaMarket — महाराष्ट्राचे जागतिक दर्जाचे लोकल ई-कॉमर्स व्यासपीठ",
    footerNote:
      "मेहकर / लोणार, जि. बुलढाणा, महाराष्ट्र | संपूर्ण महाराष्ट्रातील स्थानिक व्यवसायांना डिजिटल व्यासपीठ.",
  },
  hi: {
    brand: "MahaMarket",
    subBrand: ".in",
    locationLabel: "आपका शहर / जिला",
    allMaharashtra: "पूरा महाराष्ट्र",
    searchPlaceholder: "दुकान, ब्रांड, सेवा या वस्तु खोजें...",
    searchBtn: "खोजें",
    savedStores: "पसंदीदा",
    allCategories: "सभी श्रेणियाँ",
    sortLabel: "क्रम:",
    sortFeatured: "प्रमुख दुकानें पहले",
    sortNewest: "नवीनतम",
    sortAlpha: "नाम के अनुसार (A-Z)",
    featuredHeading: "★ प्रमुख प्रीमियम दुकानें",
    featuredSub: "ग्राहकों के पसंदीदा विश्वसनीय व्यवसाय",
    allStoresHeading: "सभी प्रमाणित स्थानीय दुकानें",
    verifiedBadge: "✓ प्रमाणित दुकान",
    openBadge: "● खुला (OPEN)",
    closedBadge: "○ बंद (CLOSED)",
    viewDetails: "पूरी जानकारी देखें",
    callNow: "📞 कॉल करें",
    whatsappNow: "💬 WhatsApp",
    copyPhone: "📋 कॉपी",
    shareBtn: "↗ शेयर करें",
    mapBtn: "📍 मैप देखें",
    noResults: "आपकी खोज से मेल खाने वाली कोई दुकान उपलब्ध नहीं है।",
    resetFilter: "सभी दुकानें फिर से देखें",
    trust1: "१००% प्रमाणित व्यवसाय",
    trust2: "दुकानदार से सीधा संपर्क",
    trust3: "शून्य बिचौलिया कमीशन",
    trust4: "पूरे महाराष्ट्र में सेवा",
    contactHeading: "ग्राहक सहायता एवं संपर्क केंद्र",
    footerTitle: "MahaMarket — महाराष्ट्र का विश्वस्तरीय लोकल ई-कॉमर्स प्लेटफॉर्म",
    footerNote:
      "मेहकर / लोणार, जि. बुलढाणा, महाराष्ट्र | स्थानीय व्यवसायों को डिजिटल पहचान देने वाला मंच।",
  },
  en: {
    brand: "MahaMarket",
    subBrand: ".in",
    locationLabel: "Your City / District",
    allMaharashtra: "All Maharashtra",
    searchPlaceholder: "Search stores, brands, services, or products...",
    searchBtn: "Search",
    savedStores: "Saved",
    allCategories: "All Categories",
    sortLabel: "Sort by:",
    sortFeatured: "Featured First",
    sortNewest: "Newest Arrivals",
    sortAlpha: "Alphabetical (A-Z)",
    featuredHeading: "★ Top Featured Premium Stores",
    featuredSub: "Trusted businesses loved by customers",
    allStoresHeading: "All Verified Local Stores",
    verifiedBadge: "✓ Verified Store",
    openBadge: "● OPEN",
    closedBadge: "○ CLOSED",
    viewDetails: "Quick View",
    callNow: "📞 Call Now",
    whatsappNow: "💬 WhatsApp",
    copyPhone: "📋 Copy",
    shareBtn: "↗ Share",
    mapBtn: "📍 View Map",
    noResults: "No stores found matching your search criteria.",
    resetFilter: "Reset All Filters",
    trust1: "100% Verified Businesses",
    trust2: "Direct Owner Contact",
    trust3: "Zero Middleman Fees",
    trust4: "Across All Maharashtra",
    contactHeading: "Customer Support & Contact Desk",
    footerTitle: "MahaMarket — Maharashtra's World-Class Local E-Commerce Marketplace",
    footerNote:
      "Mehkar / Lonar, Dist. Buldhana, Maharashtra | Empowering local businesses across Maharashtra.",
  },
};

function getSafeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function GlobalEcommerceCustomerPage() {
  const [lang, setLang] = useState<Lang>("mr");
  const [categories, setCategories] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number | string>("");
  const [toastMsg, setToastMsg] = useState("");

  const [showPopup, setShowPopup] = useState(true);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<"featured" | "newest" | "alpha">("featured");

  const t = TEXTS[lang];

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    fetchMarketplaceData();
    try {
      const localSaved = localStorage.getItem("mahamarket_saved");
      if (localSaved) setSavedIds(JSON.parse(localSaved));

      const savedApp = localStorage.getItem("mahamarket_appearance");
      if (savedApp) {
        setAppearance({ ...DEFAULT_APPEARANCE, ...JSON.parse(savedApp) });
      }
    } catch {}
  }, []);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2800);
  };

  const trackVisitorInteraction = async (biz: any, actionSource: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    try {
      await supabase.from("crm_leads").insert({
        lead_type: "visitor_interaction",
        name: "Customer Visitor",
        phone: biz?.phone || "-",
        district: biz?.district || districtFilter || "Maharashtra",
        city: biz?.city || "-",
        business_name: biz?.business_name_mr || "Store",
        action_source: actionSource,
        notes: `Lang=${lang} | Search=${searchQuery || "-"}`,
        status: "new",
      });
    } catch {}
  };

  const openStoreQuickView = (biz: any) => {
    setSelectedStore(biz);
    trackVisitorInteraction(biz, "quick_view");
  };

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(phone).catch(() => {});
    }
    notify(`नंबर कॉपी झाला: ${phone}`);
  };

  const getWhatsAppInquiryUrl = (biz: any) => {
    const cleanNum = (biz.whatsapp || biz.phone || "").replace(/\D/g, "");
    const storeName = getBusinessName(biz);
    const msg = `नमस्कार, मी MahaMarket वरून *${storeName}* (${biz.city || ""}) बाबत चौकशीसाठी संपर्क करत आहे.`;
    return `https://wa.me/91${cleanNum}?text=${encodeURIComponent(msg)}`;
  };

  const toggleSaveStore = (id: string) => {
    const updated = savedIds.includes(id)
      ? savedIds.filter((item) => item !== id)
      : [...savedIds, id];
    setSavedIds(updated);
    try {
      localStorage.setItem("mahamarket_saved", JSON.stringify(updated));
    } catch {}
  };

  const handleShareStore = (biz: any) => {
    trackVisitorInteraction(biz, "share_click");
    const shareText = `*${biz.business_name_mr || biz.business_name_en || "Store"}*\n📍 ${
      biz.city || ""
    }, ${biz.district || ""}\n🏠 ${biz.address || ""}\n📞 संपर्क: ${biz.phone || ""}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: biz.business_name_mr || "MahaMarket", text: shareText }).catch(() => {});
    } else if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  };

  const getMapLink = (biz: any) => {
    if (biz?.map_url && biz.map_url.trim().startsWith("http")) return biz.map_url.trim();
    const q = encodeURIComponent(
      `${biz.business_name_mr || ""} ${biz.address || ""} ${biz.city || ""} ${biz.district || ""}`
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  };

  const fetchMarketplaceData = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      const [catRes, bizRes, adRes, locRes] = await Promise.all([
        supabase.from("categories").select("*").eq("is_active", true),
        supabase
          .from("businesses")
          .select("*, categories(name_mr, name_hi, name_en, icon)")
          .eq("status", "approved")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("advertisements")
          .select("*")
          .eq("is_active", true)
          .gte("end_date", today)
          .order("created_at", { ascending: false }),
        supabase.from("locations").select("*").eq("is_active", true),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (bizRes.data) setBusinesses(bizRes.data);
      if (adRes.data) setAds(adRes.data);
      if (locRes.data && locRes.data.length > 0) {
        const names = locRes.data.map((l: any) => l.name);
        setCustomLocations(names);
      }
    } catch (err) {
      console.error("Error loading marketplace data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (cat: any) => {
    if (!cat) return "";
    if (lang === "hi") return cat.name_hi || cat.name_mr;
    if (lang === "en") return cat.name_en || cat.name_mr;
    return cat.name_mr;
  };

  const getBusinessName = (biz: any) => {
    if (lang === "en" && biz.business_name_en) return biz.business_name_en;
    if (lang === "hi" && biz.business_name_hi) return biz.business_name_hi;
    return biz.business_name_mr || biz.business_name_en || "व्यवसाय";
  };

  const allDistrictChips = Array.from(new Set([...customLocations, ...DEFAULT_DISTRICTS]));

  const fontClass =
    appearance.fontFamily === "serif"
      ? "font-serif"
      : appearance.fontFamily === "mono"
      ? "font-mono"
      : "font-sans";

  const headerBgClass =
    appearance.headerStyle === "emerald"
      ? "bg-emerald-950 border-emerald-800"
      : appearance.headerStyle === "warm"
      ? "bg-stone-900 border-stone-700"
      : "bg-[#111111] border-neutral-800";

  const accentButtonClass =
    appearance.accentColor === "orange"
      ? "bg-orange-500 hover:bg-orange-600 text-white"
      : appearance.accentColor === "emerald"
      ? "bg-emerald-500 hover:bg-emerald-600 text-black"
      : "bg-amber-400 hover:bg-amber-500 text-black";

  const accentTextClass =
    appearance.accentColor === "orange"
      ? "text-orange-400"
      : appearance.accentColor === "emerald"
      ? "text-emerald-400"
      : "text-amber-400";

  const processedBusinesses = businesses
    .filter((biz) => {
      if (showSavedOnly && !savedIds.includes(biz.id)) return false;
      const matchesCategory = selectedCategory === "ALL" || biz.category_id === selectedCategory;
      const matchesDistrict =
        !districtFilter.trim() ||
        biz.district?.toLowerCase().includes(districtFilter.toLowerCase()) ||
        biz.city?.toLowerCase().includes(districtFilter.toLowerCase()) ||
        biz.taluka?.toLowerCase().includes(districtFilter.toLowerCase());
      const matchesSearch =
        !searchQuery.trim() ||
        biz.business_name_mr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.business_name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.description_mr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.address?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesDistrict && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "alpha") {
        return (a.business_name_mr || "").localeCompare(b.business_name_mr || "");
      }
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return Number(b.is_featured) - Number(a.is_featured);
    });

  const featuredBusinesses = processedBusinesses.filter((b) => b.is_featured);
  const scrollingAds = ads.filter((a) => a.ad_type === "scrolling");
  const bannerAds = ads.filter((a) => a.ad_type === "spot" || a.ad_type === "banner");
  const popupAd = ads.find((a) => a.ad_type === "popup");

  return (
    <div className={`min-h-screen bg-[#F6F5F2] text-[#111111] pb-20 md:pb-0 ${fontClass}`}>
      <style jsx global>{`
        @keyframes mahamarketTicker {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .mahamarket-ticker-track {
          display: flex;
          width: max-content;
          animation: mahamarketTicker 22s linear infinite;
        }
        .mahamarket-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {toastMsg && (
        <div className="fixed top-20 right-5 z-50 rounded-xl bg-neutral-950 text-amber-400 border border-amber-400/50 px-4 py-2.5 text-xs font-black shadow-2xl">
          ✓ {toastMsg}
        </div>
      )}

      {popupAd && showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white overflow-hidden shadow-2xl border-2 border-amber-500">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/85 text-white font-black hover:bg-orange-600 transition"
            >
              ✕
            </button>
            <a href={popupAd.target_url || "#"} target={popupAd.target_url ? "_blank" : "_self"}>
              {popupAd.image_url && (
                <img
                  src={popupAd.image_url}
                  alt={popupAd.title}
                  className="w-full max-h-96 object-contain bg-neutral-950"
                />
              )}
              <div className="p-5 text-center bg-white">
                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-[11px] font-black text-amber-900 uppercase tracking-wider">
                  Special Offer • Sponsored
                </span>
                <h3 className="mt-2 text-xl font-black text-neutral-900">{popupAd.title}</h3>
                {popupAd.scrolling_text && (
                  <p className="mt-1 text-sm text-neutral-600">{popupAd.scrolling_text}</p>
                )}
              </div>
            </a>
          </div>
        </div>
      )}

      {selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white overflow-hidden shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStore(null)}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/80 text-white font-black hover:bg-orange-600 transition"
            >
              ✕
            </button>

            <div className="h-64 w-full bg-neutral-900 relative">
              {selectedStore.cover_image_url ? (
                <img
                  src={selectedStore.cover_image_url}
                  alt={getBusinessName(selectedStore)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl">
                  {selectedStore.categories?.icon || "🏪"}
                </div>
              )}
              <div className="absolute bottom-3 left-4 flex flex-wrap gap-2">
                {selectedStore.is_featured && (
                  <span className="rounded-lg bg-amber-400 px-3 py-1 text-xs font-black text-black shadow">
                    ★ FEATURED STORE
                  </span>
                )}
                {selectedStore.is_verified && (
                  <span className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow">
                    {t.verifiedBadge}
                  </span>
                )}
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-black shadow ${
                    selectedStore.is_open !== false
                      ? "bg-white text-emerald-700"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {selectedStore.is_open !== false ? t.openBadge : t.closedBadge}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wide">
                  {selectedStore.categories?.icon} {getCategoryName(selectedStore.categories)}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">
                  {getBusinessName(selectedStore)}
                </h2>
                <p className="text-sm font-bold text-emerald-700 mt-1">
                  📍 {selectedStore.city}
                  {selectedStore.taluka ? `, ता. ${selectedStore.taluka}` : ""}, {selectedStore.district}
                  {selectedStore.pincode ? ` - ${selectedStore.pincode}` : ""}
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 p-4 space-y-2 text-sm">
                <p className="font-semibold text-neutral-800">
                  <strong className="text-neutral-950">🕒 वेळ:</strong>{" "}
                  {selectedStore.opening_hours || "सकाळी ०९:०० ते रात्री ०९:००"}
                </p>
                <p className="font-semibold text-neutral-800">
                  <strong className="text-neutral-950">पूर्ण पत्ता:</strong> {selectedStore.address}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-neutral-800">
                    <strong className="text-neutral-950">संपर्क क्रमांक:</strong> {selectedStore.phone}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(selectedStore.phone)}
                    className="rounded-lg bg-white border border-neutral-300 px-2.5 py-1 text-xs font-bold hover:bg-amber-50"
                  >
                    {t.copyPhone}
                  </button>
                </div>
                {selectedStore.description_mr && (
                  <p className="text-neutral-600 pt-2 border-t border-neutral-200 leading-relaxed">
                    {selectedStore.description_mr}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <a
                  href={`tel:${selectedStore.phone}`}
                  onClick={() => trackVisitorInteraction(selectedStore, "call_click")}
                  className="rounded-xl bg-neutral-950 py-3 text-center text-xs sm:text-sm font-black text-white hover:bg-neutral-800 transition"
                >
                  {t.callNow}
                </a>
                <a
                  href={getWhatsAppInquiryUrl(selectedStore)}
                  target="_blank"
                  onClick={() => trackVisitorInteraction(selectedStore, "whatsapp_click")}
                  className="rounded-xl bg-emerald-600 py-3 text-center text-xs sm:text-sm font-black text-white hover:bg-emerald-700 transition"
                >
                  {t.whatsappNow}
                </a>
                <a
                  href={getMapLink(selectedStore)}
                  target="_blank"
                  onClick={() => trackVisitorInteraction(selectedStore, "map_click")}
                  className="rounded-xl bg-orange-500 py-3 text-center text-xs sm:text-sm font-black text-white hover:bg-orange-600 transition"
                >
                  {t.mapBtn}
                </a>
                <button
                  onClick={() => handleShareStore(selectedStore)}
                  className={`rounded-xl py-3 text-center text-xs sm:text-sm font-black transition ${accentButtonClass}`}
                >
                  {t.shareBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-neutral-900 text-neutral-300 text-[11px] sm:text-xs py-1.5 px-4 border-b border-neutral-800">
        <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <a href="tel:9607636444" className="hover:text-amber-400 font-semibold">
              📞 हेल्पलाईन: 9607636444 / 9405478111
            </a>
            <a href="mailto:dcompany1410@gmail.com" className="hidden md:inline hover:text-amber-400">
              ✉️ dcompany1410@gmail.com
            </a>
          </div>
          <span className={`font-bold ${accentTextClass}`}>
            महाराष्ट्रातील स्थानिक बाजारपेठेचे अधिकृत डिजिटल व्यासपीठ
          </span>
        </div>
      </div>

      {scrollingAds.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-black py-2 text-xs sm:text-sm font-black overflow-hidden whitespace-nowrap border-b border-amber-600/30">
          <div className="mahamarket-ticker-track">
            {[0, 1].map((loopIndex) => (
              <div key={loopIndex} className="flex items-center shrink-0">
                {scrollingAds.map((ad) => (
                  <span key={`${loopIndex}-${ad.id}`} className="mx-8 inline-flex items-center gap-2">
                    <span>🔥 {ad.scrolling_text || ad.title}</span>
                    <span>★</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <header className={`text-white sticky top-0 z-40 shadow-xl border-b ${headerBgClass}`}>
        <div className="mx-auto max-w-[1440px] px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <a href="/" className="flex items-baseline">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {t.brand}
              </span>
              <span className={`text-base font-black ${accentTextClass}`}>{t.subBrand}</span>
            </a>

            <div className="hidden xl:flex items-center gap-2 rounded-xl bg-black/35 border border-white/10 px-3 py-1.5">
              <span className={`text-base ${accentTextClass}`}>📍</span>
              <div>
                <p className="text-[10px] text-neutral-300 leading-none">{t.locationLabel}</p>
                <p className="text-xs font-extrabold text-white mt-0.5">
                  {districtFilter || t.allMaharashtra}
                </p>
              </div>
            </div>
          </div>

          <div className="order-3 md:order-2 w-full md:flex-1 max-w-3xl flex rounded-xl overflow-hidden bg-white ring-2 ring-transparent focus-within:ring-amber-400 shadow-md">
            <input
              type="text"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              placeholder="📍 जिल्हा / तालुका / शहर"
              className="w-28 sm:w-44 bg-neutral-100 border-r border-neutral-300 px-3 py-3 text-xs sm:text-sm font-bold text-neutral-900 outline-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="flex-1 px-4 py-3 text-xs sm:text-sm font-medium text-neutral-950 outline-none"
            />
            <button
              type="button"
              className={`px-6 py-3 text-sm font-black transition ${accentButtonClass}`}
            >
              🔍 <span className="hidden sm:inline">{t.searchBtn}</span>
            </button>
          </div>

          <div className="order-2 md:order-3 flex items-center gap-2.5">
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black border transition ${
                showSavedOnly
                  ? "bg-orange-600 text-white border-orange-500"
                  : "bg-black/35 text-white border-white/20 hover:border-amber-400"
              }`}
            >
              <span>{showSavedOnly ? "♥" : "♡"}</span>
              <span className="hidden sm:inline">{t.savedStores}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${accentButtonClass}`}>
                {savedIds.length}
              </span>
            </button>

            <div className="flex rounded-xl bg-black/35 p-1 border border-white/15 text-xs font-bold">
              {(["mr", "hi", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-lg uppercase transition ${
                    lang === l ? `${accentButtonClass} font-black` : "text-neutral-300 hover:text-white"
                  }`}
                >
                  {l === "mr" ? "मराठी" : l === "hi" ? "हिंदी" : "EN"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-black/25 px-4 py-2.5 border-t border-white/10 overflow-x-auto">
          <div className="mx-auto max-w-[1440px] flex items-center gap-2 whitespace-nowrap">
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setShowSavedOnly(false);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-black transition ${
                selectedCategory === "ALL" && !showSavedOnly
                  ? accentButtonClass
                  : "text-neutral-200 hover:bg-white/10"
              }`}
            >
              ☰ {t.allCategories}
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowSavedOnly(false);
                }}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedCategory === cat.id && !showSavedOnly
                    ? `${accentButtonClass} font-black`
                    : "text-neutral-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat.icon} {getCategoryName(cat)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {appearance.showTrustBar && (
        <div className="bg-white border-b border-neutral-200 py-2.5 px-4">
          <div className="mx-auto max-w-[1440px] grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs font-extrabold text-neutral-800">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-emerald-600 text-base">🛡️</span> {t.trust1}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-amber-500 text-base">⚡</span> {t.trust2}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-orange-600 text-base">🤝</span> {t.trust3}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-neutral-900 text-base">🗺️</span> {t.trust4}
            </div>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="mx-auto max-w-[1440px] px-4 pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {categories.slice(0, 8).map((cat) => {
              const active = selectedCategory === cat.id && !showSavedOnly;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(active ? "ALL" : cat.id);
                    setShowSavedOnly(false);
                  }}
                  className={`rounded-xl p-3 text-center transition border ${
                    active
                      ? "bg-neutral-950 text-amber-400 border-amber-400 shadow-md"
                      : "bg-white text-neutral-800 border-neutral-200 hover:border-amber-400 hover:shadow-xs"
                  }`}
                >
                  <div className="text-2xl">{cat.icon || "🏪"}</div>
                  <div className="mt-1 text-xs font-black line-clamp-1">
                    {getCategoryName(cat)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1440px] px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-black text-neutral-600 shrink-0">📍 {t.locationLabel}:</span>
          <button
            onClick={() => setDistrictFilter("")}
            className={`rounded-full px-3.5 py-1 text-xs font-extrabold shrink-0 transition ${
              districtFilter === ""
                ? "bg-neutral-950 text-amber-400"
                : "bg-white text-neutral-700 border border-neutral-300 hover:border-amber-400"
            }`}
          >
            {t.allMaharashtra}
          </button>
          {allDistrictChips.map((dist) => (
            <button
              key={dist}
              onClick={() => setDistrictFilter(dist === districtFilter ? "" : dist)}
              className={`rounded-full px-3.5 py-1 text-xs font-bold shrink-0 transition ${
                districtFilter.toLowerCase() === dist.toLowerCase()
                  ? `${accentButtonClass} font-black`
                  : "bg-white text-neutral-700 border border-neutral-300 hover:border-amber-400"
              }`}
            >
              {dist}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 py-6 space-y-8">
        {bannerAds.length > 0 && (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bannerAds.map((ad) => (
              <a
                key={ad.id}
                href={ad.target_url || "#"}
                target={ad.target_url ? "_blank" : "_self"}
                className={`group relative overflow-hidden bg-white shadow-sm hover:shadow-xl transition flex flex-col ${appearance.cardBorder}`}
              >
                {ad.image_url ? (
                  <div className="relative h-56 w-full bg-neutral-950 overflow-hidden">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 right-3 rounded-md bg-black/80 px-2.5 py-0.5 text-[10px] font-black text-amber-400 uppercase">
                      Sponsored • {ad.target_district}
                    </span>
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-r from-neutral-900 via-neutral-800 to-orange-900 p-5 flex items-center">
                    <span className="rounded-md bg-amber-400 px-3 py-1 text-xs font-black text-black uppercase">
                      Sponsored • {ad.target_district}
                    </span>
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="text-lg font-black text-neutral-900 group-hover:text-orange-600 transition">
                      {ad.title}
                    </h3>
                    {ad.scrolling_text && (
                      <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{ad.scrolling_text}</p>
                    )}
                  </div>
                  <span className="mt-3 inline-block text-xs font-black text-orange-600 group-hover:underline">
                    ऑफर पहा →
                  </span>
                </div>
              </a>
            ))}
          </section>
        )}

        {featuredBusinesses.length > 0 && (
          <section
            className={`bg-white p-5 sm:p-7 shadow-sm border-2 border-amber-400/80 ${appearance.cardBorder}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-950">
                  {t.featuredHeading}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">{t.featuredSub}</p>
              </div>
              <span className={`rounded-full px-3.5 py-1 text-xs font-black ${accentButtonClass}`}>
                ★ Premium Selection
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className={`group border-2 border-amber-300 bg-amber-50/20 overflow-hidden hover:shadow-xl transition flex flex-col justify-between ${appearance.cardBorder}`}
                >
                  <div>
                    <div
                      onClick={() => openStoreQuickView(biz)}
                      className="relative h-44 w-full bg-neutral-200 overflow-hidden cursor-pointer"
                    >
                      {biz.cover_image_url ? (
                        <img
                          src={biz.cover_image_url}
                          alt={getBusinessName(biz)}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-black text-5xl">
                          {biz.categories?.icon || "🏪"}
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 rounded-md bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-black shadow">
                        ★ FEATURED
                      </span>
                      <span
                        className={`absolute bottom-2 right-2 rounded px-2 py-0.5 text-[10px] font-black shadow ${
                          biz.is_open !== false
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {biz.is_open !== false ? t.openBadge : t.closedBadge}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveStore(biz.id);
                        }}
                        className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 text-base shadow hover:scale-110 transition"
                      >
                        {savedIds.includes(biz.id) ? "❤️" : "🤍"}
                      </button>
                    </div>

                    <div className="p-4">
                      <span className="text-[11px] font-bold text-orange-600">
                        {biz.categories?.icon} {getCategoryName(biz.categories)}
                      </span>
                      <h3
                        onClick={() => openStoreQuickView(biz)}
                        className="mt-0.5 text-lg font-black text-neutral-950 line-clamp-1 cursor-pointer hover:text-orange-600"
                      >
                        {getBusinessName(biz)}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-emerald-700">
                        📍 {biz.city}
                        {biz.taluka ? `, ता. ${biz.taluka}` : ""}, {biz.district}
                      </p>
                      {biz.opening_hours && (
                        <p className="mt-0.5 text-[11px] text-neutral-500">🕒 {biz.opening_hours}</p>
                      )}
                      <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{biz.address}</p>
                    </div>
                  </div>

                  <div className="p-3.5 pt-0 space-y-2">
                    <button
                      onClick={() => openStoreQuickView(biz)}
                      className="w-full rounded-xl border border-neutral-300 bg-white py-1.5 text-xs font-extrabold text-neutral-800 hover:bg-neutral-100 transition"
                    >
                      {t.viewDetails}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${biz.phone}`}
                        onClick={() => trackVisitorInteraction(biz, "call_click")}
                        className="rounded-xl bg-neutral-950 py-2.5 text-center text-xs font-black text-white hover:bg-neutral-800"
                      >
                        {t.callNow}
                      </a>
                      <a
                        href={getWhatsAppInquiryUrl(biz)}
                        target="_blank"
                        onClick={() => trackVisitorInteraction(biz, "whatsapp_click")}
                        className="rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-black text-white hover:bg-emerald-700"
                      >
                        {t.whatsappNow}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          className={`bg-white p-5 sm:p-7 shadow-sm border border-neutral-200 ${appearance.cardBorder}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-neutral-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950">
              {showSavedOnly ? `❤️ ${t.savedStores}` : t.allStoresHeading} ({processedBusinesses.length})
            </h2>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-neutral-500">{t.sortLabel}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-extrabold text-neutral-900 outline-none focus:border-amber-500"
              >
                <option value="featured">{t.sortFeatured}</option>
                <option value="newest">{t.sortNewest}</option>
                <option value="alpha">{t.sortAlpha}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center font-bold text-neutral-500">
              दुकानांची माहिती लोड होत आहे...
            </div>
          ) : processedBusinesses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-neutral-500 font-medium mb-4">{t.noResults}</p>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setDistrictFilter("");
                  setSearchQuery("");
                  setShowSavedOnly(false);
                }}
                className={`rounded-xl px-6 py-2.5 text-xs font-black ${accentButtonClass}`}
              >
                {t.resetFilter}
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {processedBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className={`group bg-white overflow-hidden hover:shadow-xl transition flex flex-col justify-between ${appearance.cardBorder}`}
                >
                  <div>
                    <div
                      onClick={() => openStoreQuickView(biz)}
                      className="relative h-44 w-full bg-neutral-100 overflow-hidden cursor-pointer"
                    >
                      {biz.cover_image_url ? (
                        <img
                          src={biz.cover_image_url}
                          alt={getBusinessName(biz)}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-5xl">
                          {biz.categories?.icon || "🏪"}
                        </div>
                      )}

                      {biz.is_verified && (
                        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-black text-white shadow">
                          {t.verifiedBadge}
                        </span>
                      )}

                      <span
                        className={`absolute bottom-2.5 right-2.5 rounded-md px-2 py-0.5 text-[10px] font-black shadow ${
                          biz.is_open !== false
                            ? "bg-white/95 text-emerald-700"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {biz.is_open !== false ? t.openBadge : t.closedBadge}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveStore(biz.id);
                        }}
                        className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 text-base shadow hover:scale-110 transition"
                      >
                        {savedIds.includes(biz.id) ? "❤️" : "🤍"}
                      </button>
                    </div>

                    <div className="p-4">
                      <span className="inline-block rounded-md bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-700">
                        {biz.categories?.icon} {getCategoryName(biz.categories)}
                      </span>

                      <h3
                        onClick={() => openStoreQuickView(biz)}
                        className="mt-2 text-lg font-black text-neutral-950 line-clamp-1 cursor-pointer hover:text-orange-600"
                      >
                        {getBusinessName(biz)}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-emerald-700">
                        📍 {biz.city}
                        {biz.taluka ? `, ता. ${biz.taluka}` : ""}, {biz.district}
                      </p>

                      {biz.opening_hours && (
                        <p className="mt-0.5 text-[11px] text-neutral-500">🕒 {biz.opening_hours}</p>
                      )}

                      <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{biz.address}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openStoreQuickView(biz)}
                        className="flex-1 rounded-xl border border-neutral-300 bg-neutral-50 py-1.5 text-xs font-extrabold text-neutral-800 hover:bg-neutral-100"
                      >
                        {t.viewDetails}
                      </button>
                      <button
                        onClick={() => handleCopyPhone(biz.phone)}
                        className="rounded-xl border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs font-bold text-neutral-800 hover:bg-amber-100"
                        title="Copy Phone"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleShareStore(biz)}
                        className="rounded-xl border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs font-extrabold text-neutral-800 hover:bg-amber-100"
                        title="Share"
                      >
                        ↗
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${biz.phone}`}
                        onClick={() => trackVisitorInteraction(biz, "call_click")}
                        className="rounded-xl bg-neutral-950 py-2.5 text-center text-xs font-black text-white hover:bg-neutral-800 transition"
                      >
                        {t.callNow}
                      </a>
                      <a
                        href={getWhatsAppInquiryUrl(biz)}
                        target="_blank"
                        onClick={() => trackVisitorInteraction(biz, "whatsapp_click")}
                        className="rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-black text-white hover:bg-emerald-700 transition"
                      >
                        {t.whatsappNow}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Mobile App-Style Bottom Quick Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-neutral-950/95 text-white border-t border-neutral-800 px-2 py-2 flex items-center justify-around md:hidden">
        <button
          onClick={() => {
            setShowSavedOnly(false);
            setSelectedCategory("ALL");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex flex-col items-center text-[11px] font-bold text-amber-400"
        >
          <span>🏠</span>
          <span>मुख्य</span>
        </button>
        <button
          onClick={() => {
            setSortBy("featured");
            setShowSavedOnly(false);
          }}
          className="flex flex-col items-center text-[11px] font-bold text-neutral-200"
        >
          <span>★</span>
          <span>खास</span>
        </button>
        <button
          onClick={() => setShowSavedOnly(!showSavedOnly)}
          className="flex flex-col items-center text-[11px] font-bold text-neutral-200"
        >
          <span>♥ ({savedIds.length})</span>
          <span>आवडते</span>
        </button>
        <a
          href="https://wa.me/919607636444"
          target="_blank"
          className="flex flex-col items-center text-[11px] font-bold text-emerald-400"
        >
          <span>💬</span>
          <span>मदत</span>
        </a>
      </div>

      <footer className={`text-neutral-300 mt-16 border-t ${headerBgClass}`}>
        <div className="bg-black/25 py-3 text-center border-b border-white/10">
          <a href="#" className={`text-xs font-black hover:underline ${accentTextClass}`}>
            ▲ वरच्या बाजूला जा (Back to Top)
          </a>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 py-12 grid gap-8 md:grid-cols-3 border-b border-white/10">
          <div>
            <h3 className="text-2xl font-black text-white">
              MahaMarket<span className={accentTextClass}>.in</span>
            </h3>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">{t.footerNote}</p>
          </div>

          <div>
            <h4 className={`text-sm font-black uppercase tracking-wider mb-3 ${accentTextClass}`}>
              {t.contactHeading}
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-neutral-300">
              <li>
                📞 मोबाईल १:{" "}
                <a href="tel:9607636444" className="text-white hover:text-amber-400">
                  9607636444
                </a>
              </li>
              <li>
                📞 मोबाईल २:{" "}
                <a href="tel:9405478111" className="text-white hover:text-amber-400">
                  9405478111
                </a>
              </li>
              <li>
                ✉️ ईमेल:{" "}
                <a href="mailto:dcompany1410@gmail.com" className="text-white hover:text-amber-400">
                  dcompany1410@gmail.com
                </a>
              </li>
              <li>📍 पत्ता: मेहकर / लोणार, जि. बुलढाणा, महाराष्ट्र</li>
            </ul>
          </div>

          <div className="flex flex-col justify-center items-start md:items-end gap-3">
            <p className="text-xs font-bold text-neutral-400">तात्काळ मदतीसाठी थेट संपर्क साधा:</p>
            <div className="flex gap-3">
              <a
                href="tel:9607636444"
                className={`rounded-xl px-5 py-2.5 text-xs font-black transition ${accentButtonClass}`}
              >
                📞 कॉल करा
              </a>
              <a
                href="https://wa.me/919607636444"
                target="_blank"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="py-5 text-center text-[11px] text-neutral-500">
          © {currentYear} {t.footerTitle}
        </div>
      </footer>
    </div>
  );
}