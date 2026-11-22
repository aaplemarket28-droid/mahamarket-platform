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

const DEFAULT_APPEARANCE = {
  fontFamily: "sans",
  accentColor: "amber",
  cardBorder: "rounded-2xl border border-neutral-200",
  headerStyle: "dark",
  showTrustBar: true,
};

const DEFAULT_SECURITY = {
  deleteProtectionLock: true,
  strictAdminOnly: true,
  maintenanceMode: false,
};

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "businesses" | "ads" | "crm" | "vendors" | "locations" | "design" | "security"
  >("businesses");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  // व्यवसाय स्टेट्स (सविस्तर Location व Map सह)
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [editingBiz, setEditingBiz] = useState<any>(null);
  const [editBizPhoto, setEditBizPhoto] = useState<File | null>(null);

  const [newBizNameMr, setNewBizNameMr] = useState("");
  const [newBizNameEn, setNewBizNameEn] = useState("");
  const [newBizCatId, setNewBizCatId] = useState("");
  const [newBizDistrict, setNewBizDistrict] = useState("बुलढाणा");
  const [newBizTaluka, setNewBizTaluka] = useState("");
  const [newBizCity, setNewBizCity] = useState("");
  const [newBizPincode, setNewBizPincode] = useState("");
  const [newBizMapUrl, setNewBizMapUrl] = useState("");
  const [newBizAddress, setNewBizAddress] = useState("");
  const [newBizPhone, setNewBizPhone] = useState("");
  const [newBizWhatsapp, setNewBizWhatsapp] = useState("");
  const [newBizDesc, setNewBizDesc] = useState("");
  const [newBizPhoto, setNewBizPhoto] = useState<File | null>(null);
  const [addingBiz, setAddingBiz] = useState(false);

  // जाहिरात स्टेट्स
  const [ads, setAds] = useState<any[]>([]);
  const [adTitle, setAdTitle] = useState("");
  const [adType, setAdType] = useState("spot");
  const [scrollingText, setScrollingText] = useState("");
  const [adFile, setAdFile] = useState<File | null>(null);
  const [adDocFile, setAdDocFile] = useState<File | null>(null);
  const [uploadingAd, setUploadingAd] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [targetDistrict, setTargetDistrict] = useState("ALL");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [editingAd, setEditingAd] = useState<any>(null);
  const [editAdFile, setEditAdFile] = useState<File | null>(null);

  // CRM व Visitor Leads स्टेट्स
  const [leads, setLeads] = useState<any[]>([]);
  const [leadFilter, setLeadFilter] = useState<string>("all");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadDistrict, setLeadDistrict] = useState("");
  const [leadCity, setLeadCity] = useState("");
  const [leadBusiness, setLeadBusiness] = useState("");
  const [leadNotes, setLeadNotes] = useState("");

  // दुकानदार खाती स्टेट्स
  const [vendorProfiles, setVendorProfiles] = useState<any[]>([]);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [resetTargetEmail, setResetTargetEmail] = useState("");

  // जिल्हे व शहरे स्टेट्स
  const [locations, setLocations] = useState<any[]>([]);
  const [newCity, setNewCity] = useState("");
  const [newDistrict, setNewDistrict] = useState("");

  // डिझाइन स्टेट्स
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);

  // सुरक्षा व पासवर्ड स्टेट्स
  const [securityConfig, setSecurityConfig] = useState(DEFAULT_SECURITY);
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    try {
      const savedApp = window.localStorage.getItem("mahamarket_appearance");
      if (savedApp) setAppearance({ ...DEFAULT_APPEARANCE, ...JSON.parse(savedApp) });

      const savedSec = window.localStorage.getItem("mahamarket_security");
      if (savedSec) setSecurityConfig({ ...DEFAULT_SECURITY, ...JSON.parse(savedSec) });
    } catch {}

    verifyAdminAndLoad();
  }, []);

  const showToast = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 3500);
  };

  const recordAuditLog = async (actionType: string, targetInfo: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    try {
      await supabase.from("security_audit_logs").insert({
        actor_email: adminUser?.email || SUPER_ADMIN_EMAIL,
        action_type: actionType,
        target_info: targetInfo,
      });
      await fetchAuditLogs();
    } catch {}
  };

  const uploadToMarketplaceMedia = async (file: File, folder: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) throw new Error("Supabase configuration missing");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${folder}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage
      .from("marketplace-media")
      .upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage
      .from("marketplace-media")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const verifyAdminAndLoad = async () => {
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

    const emailLower = currentUser?.email?.trim().toLowerCase();
    if (!currentUser || emailLower !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      router.replace("/admin-login");
      return;
    }

    setAdminUser(currentUser);
    setResetTargetEmail(currentUser.email || SUPER_ADMIN_EMAIL);

    await Promise.all([
      fetchAllBusinesses(),
      fetchCategories(),
      fetchAllAds(),
      fetchLeads(),
      fetchLocations(),
      fetchVendorProfiles(),
      fetchAuditLogs(),
    ]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.from("categories").select("*").eq("is_active", true);
    if (data) {
      setCategories(data);
      if (data.length > 0 && !newBizCatId) setNewBizCatId(data[0].id);
    }
  };

  const fetchAllBusinesses = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("businesses")
      .select("*, categories(name_mr), profiles(full_name, phone, email)")
      .order("created_at", { ascending: false });
    if (data) setBusinesses(data);
  };

  const fetchAllAds = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAds(data);
  };

  const fetchLeads = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLeads(data);
  };

  const fetchVendorProfiles = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setVendorProfiles(data);
  };

  const fetchLocations = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLocations(data);
  };

  const fetchAuditLogs = async () => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("security_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    if (data) setAuditLogs(data);
  };

  // व्यवसाय क्रिया
  const handleAdminCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase || !adminUser) return;
    setAddingBiz(true);

    try {
      let photoUrl = null;
      if (newBizPhoto) {
        photoUrl = await uploadToMarketplaceMedia(newBizPhoto, "shops");
      }

      const { error } = await supabase.from("businesses").insert({
        vendor_id: adminUser.id,
        category_id: newBizCatId || null,
        business_name_mr: newBizNameMr,
        business_name_en: newBizNameEn,
        district: newBizDistrict,
        taluka: newBizTaluka || null,
        city: newBizCity,
        pincode: newBizPincode || null,
        map_url: newBizMapUrl || null,
        address: newBizAddress,
        phone: newBizPhone,
        whatsapp: newBizWhatsapp || newBizPhone,
        description_mr: newBizDesc,
        cover_image_url: photoUrl,
        status: "approved",
        is_verified: true,
      });

      if (error) {
        alert("व्यवसाय जोडताना त्रुटी: " + error.message);
      } else {
        setNewBizNameMr("");
        setNewBizNameEn("");
        setNewBizTaluka("");
        setNewBizCity("");
        setNewBizPincode("");
        setNewBizMapUrl("");
        setNewBizAddress("");
        setNewBizPhone("");
        setNewBizWhatsapp("");
        setNewBizDesc("");
        setNewBizPhoto(null);
        await fetchAllBusinesses();
        await recordAuditLog("ADD_BUSINESS", newBizNameMr);
        showToast("नवीन व्यवसाय आणि Location यशस्वीरीत्या लाईव्ह झाले!");
      }
    } catch (err: any) {
      alert("फोटो अपलोड त्रुटी: " + err.message);
    } finally {
      setAddingBiz(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string, name?: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    await supabase.from("businesses").update({ status: newStatus }).eq("id", id);
    await fetchAllBusinesses();
    await recordAuditLog("STATUS_CHANGE", `${name || id} -> ${newStatus}`);
    showToast(`व्यवसायाची स्थिती '${newStatus}' झाली.`);
  };

  const toggleFlag = async (
    id: string,
    field: "is_verified" | "is_featured",
    currentVal: boolean
  ) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    await supabase
      .from("businesses")
      .update({ [field]: !currentVal })
      .eq("id", id);
    await fetchAllBusinesses();
    await recordAuditLog("FLAG_TOGGLE", `${field} -> ${!currentVal}`);
    showToast("बॅज बदल सेव्ह झाला.");
  };

  const deleteBusiness = async (id: string, name: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    if (securityConfig.deleteProtectionLock) {
      const typed = window.prompt(
        `सुरक्षा लॉक चालू आहे! "${name}" डिलीट करण्यासाठी DELETE असे टाईप करा:`
      );
      if (typed !== "DELETE") {
        alert("सुरक्षा पडताळणी पूर्ण न झाल्यामुळे डिलीट रद्द केले.");
        return;
      }
    } else if (!window.confirm(`"${name}" हा व्यवसाय कायमचा डिलीट करायचा आहे का?`)) {
      return;
    }

    await supabase.from("businesses").delete().eq("id", id);
    await fetchAllBusinesses();
    await recordAuditLog("DELETE_BUSINESS", name);
    showToast("व्यवसाय डिलीट केला गेला.");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase || !editingBiz) return;

    try {
      let updatedPhoto = editingBiz.cover_image_url;
      if (editBizPhoto) {
        updatedPhoto = await uploadToMarketplaceMedia(editBizPhoto, "shops");
      }

      await supabase
        .from("businesses")
        .update({
          business_name_mr: editingBiz.business_name_mr,
          business_name_en: editingBiz.business_name_en || "",
          district: editingBiz.district,
          taluka: editingBiz.taluka || "",
          city: editingBiz.city,
          pincode: editingBiz.pincode || "",
          map_url: editingBiz.map_url || "",
          address: editingBiz.address,
          phone: editingBiz.phone,
          whatsapp: editingBiz.whatsapp || editingBiz.phone,
          description_mr: editingBiz.description_mr || "",
          cover_image_url: updatedPhoto,
        })
        .eq("id", editingBiz.id);

      setEditingBiz(null);
      setEditBizPhoto(null);
      await fetchAllBusinesses();
      await recordAuditLog("EDIT_BUSINESS", editingBiz.business_name_mr);
      showToast("व्यवसायाची माहिती व Location अद्ययावत झाले.");
    } catch (err: any) {
      alert("अपडेट करताना त्रुटी: " + err.message);
    }
  };

  // CRM Lead क्रिया
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from("crm_leads").insert({
      lead_type: "manual_crm",
      name: leadName || "ग्राहक / चौकशी",
      phone: leadPhone || "-",
      district: leadDistrict || "-",
      city: leadCity || "-",
      business_name: leadBusiness || "-",
      action_source: "admin_crm",
      notes: leadNotes || "",
      status: "new",
    });
    if (!error) {
      setLeadName("");
      setLeadPhone("");
      setLeadDistrict("");
      setLeadCity("");
      setLeadBusiness("");
      setLeadNotes("");
      await fetchLeads();
      showToast("नवीन CRM नोंद सेव्ह झाली.");
    } else {
      alert("CRM नोंद करताना त्रुटी: " + error.message);
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    await supabase.from("crm_leads").update({ status }).eq("id", id);
    await fetchLeads();
    showToast("CRM स्थिती अपडेट झाली.");
  };

  const deleteLead = async (id: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    await supabase.from("crm_leads").delete().eq("id", id);
    await fetchLeads();
    showToast("CRM नोंद काढून टाकली.");
  };

  // जाहिरात क्रिया
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    setUploadingAd(true);

    try {
      let uploadedImageUrl = null;
      let uploadedDocUrl = null;

      if (adFile) uploadedImageUrl = await uploadToMarketplaceMedia(adFile, "ads");
      if (adDocFile) uploadedDocUrl = await uploadToMarketplaceMedia(adDocFile, "ad-files");

      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("advertisements").insert({
        title: adTitle,
        ad_type: adType,
        scrolling_text: scrollingText || null,
        image_url: uploadedImageUrl,
        attachment_url: uploadedDocUrl,
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
        setAdDocFile(null);
        setTargetUrl("");
        await fetchAllAds();
        await recordAuditLog("CREATE_AD", adTitle);
        showToast("जाहिरात यशस्वीरीत्या लाईव्ह झाली!");
      } else {
        alert("जाहिरात जोडताना त्रुटी: " + error.message);
      }
    } catch (err: any) {
      alert("फाईल अपलोड त्रुटी: " + err.message);
    } finally {
      setUploadingAd(false);
    }
  };

  const handleSaveAdEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase || !editingAd) return;

    try {
      let newImgUrl = editingAd.image_url;
      if (editAdFile) newImgUrl = await uploadToMarketplaceMedia(editAdFile, "ads");

      await supabase
        .from("advertisements")
        .update({
          title: editingAd.title,
          ad_type: editingAd.ad_type,
          scrolling_text: editingAd.scrolling_text || "",
          target_url: editingAd.target_url || "",
          target_district: editingAd.target_district || "ALL",
          end_date: editingAd.end_date,
          image_url: newImgUrl,
        })
        .eq("id", editingAd.id);

      setEditingAd(null);
      setEditAdFile(null);
      await fetchAllAds();
      await recordAuditLog("EDIT_AD", editingAd.title);
      showToast("जाहिरात यशस्वीरीत्या एडिट झाली!");
    } catch (err: any) {
      alert("जाहिरात एडिट करताना त्रुटी: " + err.message);
    }
  };

  const toggleAdStatus = async (id: string, current: boolean) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    await supabase.from("advertisements").update({ is_active: !current }).eq("id", id);
    await fetchAllAds();
    showToast("जाहिरातीची स्थिती बदलली.");
  };

  const deleteAd = async (id: string, title: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    if (!window.confirm(`"${title}" ही जाहिरात कायमची डिलीट करायची का?`)) return;
    await supabase.from("advertisements").delete().eq("id", id);
    await fetchAllAds();
    await recordAuditLog("DELETE_AD", title);
    showToast("जाहिरात डिलीट केली गेली.");
  };

  // दुकानदार खाती क्रिया
  const handleSaveVendorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase || !editingVendor) return;

    await supabase
      .from("profiles")
      .update({
        full_name: editingVendor.full_name || "",
        phone: editingVendor.phone || "",
        role: editingVendor.role || "vendor",
      })
      .eq("id", editingVendor.id);

    setEditingVendor(null);
    await fetchVendorProfiles();
    await recordAuditLog("EDIT_VENDOR_ACCOUNT", editingVendor.email || editingVendor.id);
    showToast("दुकानदार खाते माहिती अपडेट झाली.");
  };

  const handleDeleteVendorProfile = async (vendor: any) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    if (
      !window.confirm(
        `"${vendor.full_name || vendor.email || vendor.id}" हे दुकानदार खाते काढून टाकायचे का?`
      )
    )
      return;

    await supabase.from("profiles").delete().eq("id", vendor.id);
    await fetchVendorProfiles();
    await recordAuditLog("DELETE_VENDOR_ACCOUNT", vendor.email || vendor.id);
    showToast("दुकानदार प्रोफाइल हटवले गेले.");
  };

  // पासवर्ड बदल व Reset
  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;

    if (newAdminPassword.length < 6) {
      alert("नवीन पासवर्ड किमान ६ अक्षरांचा असावा.");
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      alert("नवीन पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत.");
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newAdminPassword });
    setUpdatingPassword(false);

    if (error) {
      alert("पासवर्ड बदलताना त्रुटी: " + error.message);
    } else {
      setNewAdminPassword("");
      setConfirmAdminPassword("");
      await recordAuditLog("PASSWORD_CHANGED", adminUser?.email || SUPER_ADMIN_EMAIL);
      showToast("Admin पासवर्ड यशस्वीरीत्या बदलला गेला!");
    }
  };

  const handleSendPasswordResetEmail = async (emailToReset: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    const clean = emailToReset.trim();
    if (!clean) {
      alert("कृपया वैध ईमेल पत्ता टाका.");
      return;
    }

    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/admin-login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: redirectUrl,
    });

    if (error) {
      alert("Reset ईमेल पाठवताना त्रुटी: " + error.message);
    } else {
      await recordAuditLog("PASSWORD_RESET_SENT", clean);
      showToast(`'${clean}' या ईमेलवर पासवर्ड Reset लिंक पाठवली आहे.`);
    }
  };

  // जिल्हे व शहरे
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSafeSupabaseClient();
    if (!supabase || !newCity.trim() || !newDistrict.trim()) return;
    const { error } = await supabase.from("locations").insert({
      name: newCity.trim(),
      district: newDistrict.trim(),
      is_active: true,
    });
    if (!error) {
      setNewCity("");
      setNewDistrict("");
      await fetchLocations();
      await recordAuditLog("ADD_LOCATION", `${newCity} (${newDistrict})`);
      showToast("नवीन शहर/जिल्हा जोडला गेला.");
    } else {
      alert("जिल्हा जोडताना त्रुटी: " + error.message);
    }
  };

  const deleteLocation = async (id: string) => {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return;
    await supabase.from("locations").delete().eq("id", id);
    await fetchLocations();
    showToast("ठिकाण काढून टाकले.");
  };

  const saveAppearanceSettings = () => {
    try {
      window.localStorage.setItem("mahamarket_appearance", JSON.stringify(appearance));
      showToast("Font, रंग, थीम आणि Border सेटिंग्ज मुख्य पानावर सेव्ह झाल्या!");
    } catch {
      alert("सेटिंग्ज सेव्ह करताना अडचण आली.");
    }
  };

  const saveSecuritySettings = async () => {
    try {
      window.localStorage.setItem("mahamarket_security", JSON.stringify(securityConfig));
      await recordAuditLog(
        "SECURITY_POLICY_UPDATE",
        `DeleteLock=${securityConfig.deleteProtectionLock}`
      );
      showToast("सुरक्षा धोरणे (Security Controls) अद्ययावत झाली.");
    } catch {
      alert("सुरक्षा सेटिंग्ज सेव्ह करताना अडचण आली.");
    }
  };

  const handleLogout = async () => {
    const supabase = getSafeSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/admin-login");
  };

  if (!mounted || loading) {
    return (
      <div
        suppressHydrationWarning
        className="flex min-h-screen items-center justify-center bg-neutral-950 text-white font-bold"
      >
        Admin कंट्रोल पॅनेल उघडत आहे...
      </div>
    );
  }

  const filteredList = businesses.filter((b) =>
    filter === "all" ? true : b.status === filter
  );
  const filteredLeads = leads.filter((l) =>
    leadFilter === "all" ? true : l.status === leadFilter
  );
  const pendingCount = businesses.filter((b) => b.status === "pending").length;
  const approvedCount = businesses.filter((b) => b.status === "approved").length;

  return (
    <div suppressHydrationWarning className="min-h-screen bg-neutral-100 text-neutral-900">
      {notice && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-2xl">
          ✓ {notice}
        </div>
      )}

      {/* Top Admin Header */}
      <header className="bg-neutral-950 px-5 py-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl border-b border-neutral-800">
        <div>
          <span className="rounded bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-black uppercase">
            Enterprise Admin & CRM Command
          </span>
          <h1 className="text-xl font-black mt-1">MahaMarket संपूर्ण नियंत्रण केंद्र</h1>
          <p className="text-[11px] text-neutral-400">{adminUser?.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setActiveTab("businesses")}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === "businesses"
                ? "bg-amber-400 text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            🏪 व्यवसाय ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === "ads" ? "bg-amber-400 text-black" : "text-neutral-300 hover:text-white"
            }`}
          >
            📢 जाहिराती ({ads.length})
          </button>
          <button
            onClick={() => setActiveTab("crm")}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === "crm" ? "bg-amber-400 text-black" : "text-neutral-300 hover:text-white"
            }`}
          >
            📊 CRM व Visitors ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === "vendors"
                ? "bg-amber-400 text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            👤 दुकानदार ({vendorProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab("locations")}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === "locations"
                ? "bg-amber-400 text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            📍 जिल्हे ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab("design")}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === "design"
                ? "bg-amber-400 text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            🎨 Font, रंग व Border
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === "security"
                ? "bg-amber-400 text-black"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            🛡️ सुरक्षा व पासवर्ड
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            className="rounded-xl border border-neutral-700 px-3.5 py-2 text-xs font-bold hover:bg-neutral-800"
          >
            ग्राहक पान पहा ↗
          </a>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-700"
          >
            लॉगआउट
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7">
        {/* TAB 1: व्यवसाय नियंत्रण (सविस्तर Location व Map सह) */}
        {activeTab === "businesses" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200">
                <p className="text-xs font-bold text-neutral-500">एकूण व्यवसाय</p>
                <p className="mt-2 text-3xl font-black">{businesses.length}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-5 shadow-sm border border-amber-200">
                <p className="text-xs font-bold text-amber-800">मंजुरी बाकी</p>
                <p className="mt-2 text-3xl font-black text-amber-900">{pendingCount}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-5 shadow-sm border border-emerald-200">
                <p className="text-xs font-bold text-emerald-800">लाईव्ह व्यवसाय</p>
                <p className="mt-2 text-3xl font-black text-emerald-900">{approvedCount}</p>
              </div>
              <div className="rounded-2xl bg-neutral-900 p-5 shadow-sm text-white">
                <p className="text-xs font-bold text-neutral-400">CRM / Visitor नोंदी</p>
                <p className="mt-2 text-3xl font-black text-amber-400">{leads.length}</p>
              </div>
            </div>

            <form
              onSubmit={handleAdminCreateBusiness}
              className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-4"
            >
              <h2 className="text-lg font-black text-neutral-950">
                + नवीन व्यवसाय व सविस्तर Location जोडा (Admin Add Store)
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  type="text"
                  required
                  value={newBizNameMr}
                  onChange={(e) => setNewBizNameMr(e.target.value)}
                  placeholder="दुकानाचे नाव (मराठी) *"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newBizNameEn}
                  onChange={(e) => setNewBizNameEn(e.target.value)}
                  placeholder="Shop Name (English)"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <select
                  value={newBizCatId}
                  onChange={(e) => setNewBizCatId(e.target.value)}
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name_mr}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={newBizDistrict}
                  onChange={(e) => setNewBizDistrict(e.target.value)}
                  placeholder="जिल्हा *"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newBizTaluka}
                  onChange={(e) => setNewBizTaluka(e.target.value)}
                  placeholder="तालुका (उदा. मेहकर)"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  required
                  value={newBizCity}
                  onChange={(e) => setNewBizCity(e.target.value)}
                  placeholder="शहर / गाव *"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newBizPincode}
                  onChange={(e) => setNewBizPincode(e.target.value)}
                  placeholder="पिनकोड (उदा. 443301)"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="tel"
                  required
                  value={newBizPhone}
                  onChange={(e) => setNewBizPhone(e.target.value)}
                  placeholder="मोबाईल नंबर *"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  required
                  value={newBizAddress}
                  onChange={(e) => setNewBizAddress(e.target.value)}
                  placeholder="पूर्ण पत्ता / लँडमार्क *"
                  className="sm:col-span-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newBizMapUrl}
                  onChange={(e) => setNewBizMapUrl(e.target.value)}
                  placeholder="Google Maps लिंक (पर्यायी)"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewBizPhoto(e.target.files?.[0] || null)}
                    className="w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={newBizDesc}
                  onChange={(e) => setNewBizDesc(e.target.value)}
                  placeholder="व्यवसायाची थोडक्यात माहिती / ऑफर्स..."
                  className="flex-1 min-w-[240px] rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={addingBiz}
                  className="rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-black text-black hover:bg-amber-500 disabled:opacity-50"
                >
                  {addingBiz ? "जोडत आहे..." : "+ व्यवसाय लाईव्ह करा"}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "सर्व व्यवसाय" },
                { key: "pending", label: `मंजुरी बाकी (${pendingCount})` },
                { key: "approved", label: "लाईव्ह (Approved)" },
                { key: "rejected", label: "नामंजूर (Rejected)" },
                { key: "suspended", label: "बंद (Suspended)" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                    filter === tab.key
                      ? "bg-neutral-950 text-amber-400 shadow"
                      : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredList.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center text-neutral-500 border border-neutral-200">
                  या विभागात सध्या कोणताही व्यवसाय नाही.
                </div>
              ) : (
                filteredList.map((biz) => (
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
                          <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-xs font-bold text-neutral-700">
                            {biz.categories?.name_mr || "श्रेणी"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-0.5 text-xs font-extrabold uppercase ${
                              biz.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : biz.status === "pending"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {biz.status}
                          </span>
                          {biz.is_verified && (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                              ✓ Verified
                            </span>
                          )}
                          {biz.is_featured && (
                            <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-black">
                              ★ Featured
                            </span>
                          )}
                        </div>

                        <h3 className="mt-1.5 text-xl font-black text-neutral-950">
                          {biz.business_name_mr}
                        </h3>
                        <p className="text-sm text-neutral-600 mt-0.5">
                          📍{" "}
                          <strong>
                            {biz.city}
                            {biz.taluka ? `, ता. ${biz.taluka}` : ""}, {biz.district}
                            {biz.pincode ? ` - ${biz.pincode}` : ""}
                          </strong>{" "}
                          — {biz.address}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          📞 {biz.phone} | मालक: {biz.profiles?.full_name || "Admin / Vendor"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {biz.status !== "approved" && (
                        <button
                          onClick={() => updateStatus(biz.id, "approved", biz.business_name_mr)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {biz.status !== "rejected" && (
                        <button
                          onClick={() => updateStatus(biz.id, "rejected", biz.business_name_mr)}
                          className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black hover:bg-amber-600"
                        >
                          ✗ Reject
                        </button>
                      )}
                      {biz.status === "approved" && (
                        <button
                          onClick={() => updateStatus(biz.id, "suspended", biz.business_name_mr)}
                          className="rounded-lg bg-neutral-700 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-800"
                        >
                          ⏸ Suspend
                        </button>
                      )}
                      <button
                        onClick={() => toggleFlag(biz.id, "is_verified", biz.is_verified)}
                        className="rounded-lg border border-emerald-400 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                      >
                        {biz.is_verified ? "Verified काढा" : "✓ Verified"}
                      </button>
                      <button
                        onClick={() => toggleFlag(biz.id, "is_featured", biz.is_featured)}
                        className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100"
                      >
                        {biz.is_featured ? "Featured काढा" : "★ Featured"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingBiz(biz);
                          setEditBizPhoto(null);
                        }}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100"
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
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: जाहिरात मॅनेजर */}
        {activeTab === "ads" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <form
              onSubmit={handleCreateAd}
              className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-4"
            >
              <h2 className="text-xl font-black text-neutral-950">
                नवीन जाहिरात लावा (फोटो / फाईल / मजकूर)
              </h2>

              <div>
                <label className="block text-xs font-bold text-neutral-700">जाहिरातीचे शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="उदा. दिवाळी / लग्नसराई खास ऑफर"
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700">जाहिरातीचा प्रकार *</label>
                  <select
                    value={adType}
                    onChange={(e) => setAdType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="spot">Spot Ad (मुख्य पानावरील खास)</option>
                    <option value="banner">Banner Ad (मोठे फोटो बॅनर)</option>
                    <option value="popup">Popup Ad (पॉप-अप जाहिरात)</option>
                    <option value="scrolling">Scrolling Ad (फिरती पट्टी)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700">जिल्हा लक्ष्य (ALL = सर्व)</label>
                  <input
                    type="text"
                    value={targetDistrict}
                    onChange={(e) => setTargetDistrict(e.target.value)}
                    placeholder="ALL किंवा बुलढाणा / मेहकर"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/50 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-neutral-800 mb-1">
                    🖼️ जाहिरातीचा फोटो / बॅनर निवडा
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAdFile(e.target.files?.[0] || null)}
                    className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                  />
                  {adFile && (
                    <p className="mt-1 text-xs font-bold text-emerald-700">✓ फोटो: {adFile.name}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-amber-200">
                  <label className="block text-xs font-extrabold text-neutral-800 mb-1">
                    📎 किंवा अतिरिक्त फाईल जोडा (PDF / Image / Doc)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setAdDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-orange-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                  />
                  {adDocFile && (
                    <p className="mt-1 text-xs font-bold text-emerald-700">✓ फाईल: {adDocFile.name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700">जाहिरातीचा मजकूर / ऑफर माहिती</label>
                <input
                  type="text"
                  value={scrollingText}
                  onChange={(e) => setScrollingText(e.target.value)}
                  placeholder="उदा. सर्व सेवांवर २०% सूट! संपर्क: 9607636444"
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700">WhatsApp / वेबसाइट लिंक</label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://wa.me/919607636444"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">अंतिम तारीख *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingAd}
                className="w-full rounded-xl bg-amber-400 py-3 text-sm font-black text-black hover:bg-amber-500 disabled:opacity-50"
              >
                {uploadingAd ? "फाईल अपलोड होत आहे..." : "+ जाहिरात लाईव्ह करा"}
              </button>
            </form>

            <div className="space-y-4">
              <h2 className="text-xl font-black text-neutral-950">सध्याच्या जाहिराती ({ads.length})</h2>
              {ads.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-neutral-500 border border-neutral-200">
                  अजून कोणतीही जाहिरात तयार केलेली नाही.
                </div>
              ) : (
                ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200 flex items-start justify-between gap-4"
                  >
                    <div className="flex gap-3">
                      {ad.image_url && (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="h-16 w-20 rounded-lg object-cover border border-neutral-200 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-neutral-950 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                            {ad.ad_type}
                          </span>
                          <span className="text-xs font-bold text-neutral-500">
                            जिल्हा: {ad.target_district}
                          </span>
                        </div>
                        <h3 className="mt-1 font-black text-neutral-950">{ad.title}</h3>
                        {ad.scrolling_text && (
                          <p className="text-sm text-neutral-600 mt-0.5">{ad.scrolling_text}</p>
                        )}
                        <p className="text-xs text-neutral-400 mt-1">मुदत: {ad.end_date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          ad.is_active
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        {ad.is_active ? "● चालू" : "○ बंद"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingAd(ad);
                          setEditAdFile(null);
                        }}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => deleteAd(ad.id, ad.title)}
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

        {/* TAB 3: Admin CRM व Visitor Activity */}
        {activeTab === "crm" && (
          <div className="space-y-6">
            <form
              onSubmit={handleAddLead}
              className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-4"
            >
              <h2 className="text-xl font-black text-neutral-950">
                + नवीन CRM Lead / चौकशी जोडा
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="नाव"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="मोबाईल"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={leadDistrict}
                  onChange={(e) => setLeadDistrict(e.target.value)}
                  placeholder="जिल्हा"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={leadCity}
                  onChange={(e) => setLeadCity(e.target.value)}
                  placeholder="शहर / गाव"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={leadBusiness}
                  onChange={(e) => setLeadBusiness(e.target.value)}
                  placeholder="संबंधित दुकान / विषय"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="फॉलोअप / टीप..."
                  className="flex-1 min-w-[240px] rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-black text-black hover:bg-amber-500"
                >
                  + CRM मध्ये जोडा
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: `सर्व नोंदी (${leads.length})` },
                { key: "new", label: "नवीन (New)" },
                { key: "contacted", label: "संपर्क साधला" },
                { key: "converted", label: "यशस्वी (Converted)" },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setLeadFilter(st.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold ${
                    leadFilter === st.key
                      ? "bg-neutral-950 text-amber-400"
                      : "bg-white text-neutral-700 border border-neutral-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredLeads.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-neutral-500 border border-neutral-200">
                  सध्या कोणतीही CRM / Visitor नोंद नाही. ग्राहकांनी Call, WhatsApp किंवा Quick View केल्यावर येथे नोंदी दिसतील.
                </div>
              ) : (
                filteredLeads.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-neutral-900 px-2.5 py-0.5 text-[10px] font-black text-amber-400 uppercase">
                          {item.action_source || item.lead_type}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 uppercase">
                          {item.status}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(item.created_at).toISOString().slice(0, 16).replace("T", " ")}
                        </span>
                      </div>
                      <h3 className="mt-1 font-black text-neutral-950">
                        {item.business_name || item.name || "Visitor"}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        📍 लोकेशन: {item.city || "-"}, {item.district || "-"} | 📞 {item.phone || "-"}
                      </p>
                      {item.notes && <p className="text-xs text-neutral-500 mt-1">{item.notes}</p>}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateLeadStatus(item.id, "contacted")}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold"
                      >
                        Contacted
                      </button>
                      <button
                        onClick={() => updateLeadStatus(item.id, "converted")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Converted
                      </button>
                      <button
                        onClick={() => deleteLead(item.id)}
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

        {/* TAB 4: दुकानदार खाती व्यवस्थापन */}
        {activeTab === "vendors" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
              <h2 className="text-xl font-black text-neutral-950">
                दुकानदार खाती नियंत्रण (Vendor Account Management)
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                येथून दुकानदारांची माहिती एडिट करा, पासवर्ड Reset लिंक पाठवा किंवा खाते हटवा.
              </p>
            </div>

            {vendorProfiles.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-neutral-500 border border-neutral-200">
                सध्या कोणतेही दुकानदार प्रोफाइल नोंदवलेले नाही.
              </div>
            ) : (
              vendorProfiles.map((vendor) => (
                <div
                  key={vendor.id}
                  className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-neutral-900 px-2.5 py-0.5 text-[10px] font-black text-amber-400 uppercase">
                        {vendor.role || "vendor"}
                      </span>
                      <span className="text-xs text-neutral-400">ID: {vendor.id.slice(0, 8)}...</span>
                    </div>
                    <h3 className="mt-1 text-lg font-black text-neutral-950">
                      {vendor.full_name || "नाव उपलब्ध नाही"}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      📞 मोबाईल: {vendor.phone || "-"} | ✉️ ईमेल: {vendor.email || "-"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditingVendor(vendor)}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100"
                    >
                      ✎ Edit खाते
                    </button>
                    {vendor.email && (
                      <button
                        onClick={() => handleSendPasswordResetEmail(vendor.email)}
                        className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-black text-black hover:bg-amber-500"
                      >
                        🔑 Reset Password लिंक
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteVendorProfile(vendor)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                    >
                      🗑 Delete खाते
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: जिल्हे व शहरे */}
        {activeTab === "locations" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <form
              onSubmit={handleAddLocation}
              className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-4"
            >
              <h2 className="text-xl font-black text-neutral-950">+ नवीन जिल्हा / शहर जोडा</h2>
              <div>
                <label className="block text-xs font-bold text-neutral-700">शहर / गाव / तालुका नाव *</label>
                <input
                  type="text"
                  required
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="उदा. मेहकर / खामगाव / बारामती"
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700">जिल्ह्याचे नाव *</label>
                <input
                  type="text"
                  required
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  placeholder="उदा. बुलढाणा / पुणे"
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-amber-400 py-3 text-sm font-black text-black hover:bg-amber-500"
              >
                + ठिकाण सेव्ह करा
              </button>
            </form>

            <div className="space-y-3">
              <h2 className="text-xl font-black text-neutral-950">नोंदवलेली ठिकाणे ({locations.length})</h2>
              {locations.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-neutral-500 border border-neutral-200">
                  अजून कोणतेही अतिरिक्त ठिकाण जोडलेले नाही.
                </div>
              ) : (
                locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="rounded-2xl bg-white p-4 shadow-sm border border-neutral-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-black text-neutral-950">{loc.name}</p>
                      <p className="text-xs text-neutral-500">जिल्हा: {loc.district}</p>
                    </div>
                    <button
                      onClick={() => deleteLocation(loc.id)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: Font, रंग, थीम आणि Border */}
        {activeTab === "design" && (
          <div className="max-w-3xl rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-6">
            <div>
              <h2 className="text-xl font-black text-neutral-950">
                🎨 Font, रंगसंगती, थीम आणि Border सेटिंग्ज
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                येथून केलेले बदल सेव्ह केल्यावर ग्राहकांच्या मुख्य पानाचा लूक लगेच बदलेल.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-extrabold text-neutral-800 mb-1.5">
                  Font शैली (Typography)
                </label>
                <select
                  value={appearance.fontFamily}
                  onChange={(e) => setAppearance({ ...appearance, fontFamily: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm font-bold"
                >
                  <option value="sans">Modern Sans (स्वच्छ आधुनिक)</option>
                  <option value="serif">Classic Editorial Serif (प्रीमियम)</option>
                  <option value="mono">Technical Mono (स्पष्ट अंक व कोड)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-neutral-800 mb-1.5">
                  मुख्य Accent रंग (Zero Blue)
                </label>
                <select
                  value={appearance.accentColor}
                  onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm font-bold"
                >
                  <option value="amber">Warm Amber Gold (सोनरी)</option>
                  <option value="orange">Vibrant Coral Orange (केशरी)</option>
                  <option value="emerald">Rich Emerald Green (हिरवा)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-neutral-800 mb-1.5">
                  Card Border व कोपरे (Border Style)
                </label>
                <select
                  value={appearance.cardBorder}
                  onChange={(e) => setAppearance({ ...appearance, cardBorder: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm font-bold"
                >
                  <option value="rounded-2xl border border-neutral-200">Soft Rounded Border</option>
                  <option value="rounded-none border-2 border-neutral-900">
                    Sharp Bold Border (ठळक चौकोनी)
                  </option>
                  <option value="rounded-3xl border-2 border-amber-400">
                    Gold Frame Border (सोनरी बॉर्डर)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-neutral-800 mb-1.5">
                  Header थीम (Top Bar Theme)
                </label>
                <select
                  value={appearance.headerStyle}
                  onChange={(e) => setAppearance({ ...appearance, headerStyle: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm font-bold"
                >
                  <option value="dark">Charcoal Obsidian Dark</option>
                  <option value="emerald">Deep Forest Emerald</option>
                  <option value="warm">Warm Espresso Brown</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="trustBarToggle"
                type="checkbox"
                checked={appearance.showTrustBar}
                onChange={(e) => setAppearance({ ...appearance, showTrustBar: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="trustBarToggle" className="text-xs font-bold text-neutral-700">
                मुख्य पानावर Trust Value Strip दाखवा
              </label>
            </div>

            <button
              type="button"
              onClick={saveAppearanceSettings}
              className="rounded-xl bg-neutral-950 px-6 py-3 text-xs font-black text-amber-400 hover:bg-neutral-800"
            >
              ✓ सर्व डिझाइन बदल सेव्ह करा
            </button>
          </div>
        )}

        {/* TAB 7: सुरक्षा, पासवर्ड बदल व Reset, आणि Audit Logs */}
        {activeTab === "security" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <form
                onSubmit={handleChangeOwnPassword}
                className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-4"
              >
                <h2 className="text-xl font-black text-neutral-950">
                  🔐 Admin पासवर्ड बदला (Change Password)
                </h2>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">नवीन पासवर्ड *</label>
                  <input
                    type="password"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="किमान ६ अक्षरे"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700">
                    नवीन पासवर्ड पुन्हा टाका *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="पासवर्ड कन्फर्म करा"
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full rounded-xl bg-neutral-950 py-3 text-xs font-black text-amber-400 hover:bg-neutral-800 disabled:opacity-50"
                >
                  {updatingPassword ? "पासवर्ड बदलत आहे..." : "✓ नवीन पासवर्ड सेव्ह करा"}
                </button>
              </form>

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-3">
                <h2 className="text-lg font-black text-neutral-950">
                  ✉️ Password Reset लिंक पाठवा (Admin / Vendor)
                </h2>
                <input
                  type="email"
                  value={resetTargetEmail}
                  onChange={(e) => setResetTargetEmail(e.target.value)}
                  placeholder="ईमेल पत्ता टाका"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleSendPasswordResetEmail(resetTargetEmail)}
                  className="w-full rounded-xl bg-amber-400 py-2.5 text-xs font-black text-black hover:bg-amber-500"
                >
                  Reset ईमेल पाठवा
                </button>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-3">
                <h2 className="text-lg font-black text-neutral-950">🛡️ सुरक्षा धोरणे (Security Lock)</h2>
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={securityConfig.deleteProtectionLock}
                    onChange={(e) =>
                      setSecurityConfig({
                        ...securityConfig,
                        deleteProtectionLock: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  डिलीट करताना 'DELETE' कन्फर्मेशन लॉक अनिवार्य ठेवा
                </label>
                <button
                  type="button"
                  onClick={saveSecuritySettings}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-700"
                >
                  सुरक्षा सेटिंग्ज सेव्ह करा
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200 space-y-4">
              <h2 className="text-xl font-black text-neutral-950">
                📋 Security Audit Logs (अलीकडील कृती)
              </h2>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  कोणतीही सुरक्षा नोंद अजून तयार झालेली नाही.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-black text-amber-400">
                          {log.action_type}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(log.created_at).toISOString().slice(0, 16).replace("T", " ")}
                        </span>
                      </div>
                      <p className="mt-1 font-bold text-neutral-800">{log.target_info}</p>
                      <p className="text-[11px] text-neutral-500">By: {log.actor_email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit Business Modal (Location व Map सह) */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-black text-neutral-950">
              व्यवसाय व Location सुधारणा (Admin Edit)
            </h2>
            <div>
              <label className="block text-xs font-bold text-neutral-700">
                व्यवसायाचे नाव (मराठी)
              </label>
              <input
                type="text"
                required
                value={editingBiz.business_name_mr}
                onChange={(e) =>
                  setEditingBiz({ ...editingBiz, business_name_mr: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700">जिल्हा</label>
                <input
                  type="text"
                  required
                  value={editingBiz.district}
                  onChange={(e) => setEditingBiz({ ...editingBiz, district: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700">तालुका</label>
                <input
                  type="text"
                  value={editingBiz.taluka || ""}
                  onChange={(e) => setEditingBiz({ ...editingBiz, taluka: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700">शहर / गाव</label>
                <input
                  type="text"
                  required
                  value={editingBiz.city}
                  onChange={(e) => setEditingBiz({ ...editingBiz, city: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700">पिनकोड</label>
                <input
                  type="text"
                  value={editingBiz.pincode || ""}
                  onChange={(e) => setEditingBiz({ ...editingBiz, pincode: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">मोबाईल नंबर</label>
              <input
                type="text"
                required
                value={editingBiz.phone}
                onChange={(e) => setEditingBiz({ ...editingBiz, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">पूर्ण पत्ता</label>
              <input
                type="text"
                required
                value={editingBiz.address}
                onChange={(e) => setEditingBiz({ ...editingBiz, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">Google Maps लिंक</label>
              <input
                type="text"
                value={editingBiz.map_url || ""}
                onChange={(e) => setEditingBiz({ ...editingBiz, map_url: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">
                नवीन फोटो बदलायचा असल्यास निवडा
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditBizPhoto(e.target.files?.[0] || null)}
                className="mt-1 w-full text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBiz(null)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-bold"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="rounded-xl bg-neutral-950 px-5 py-2 text-sm font-bold text-amber-400"
              >
                बदल सेव्ह करा
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Ad Modal */}
      {editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <form
            onSubmit={handleSaveAdEdit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-black text-neutral-950">जाहिरात एडिट करा</h2>
            <div>
              <label className="block text-xs font-bold text-neutral-700">शीर्षक *</label>
              <input
                type="text"
                required
                value={editingAd.title}
                onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700">प्रकार</label>
                <select
                  value={editingAd.ad_type}
                  onChange={(e) => setEditingAd({ ...editingAd, ad_type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="spot">Spot Ad</option>
                  <option value="banner">Banner Ad</option>
                  <option value="popup">Popup Ad</option>
                  <option value="scrolling">Scrolling Ad</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700">अंतिम तारीख</label>
                <input
                  type="date"
                  required
                  value={editingAd.end_date}
                  onChange={(e) => setEditingAd({ ...editingAd, end_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">मजकूर</label>
              <input
                type="text"
                value={editingAd.scrolling_text || ""}
                onChange={(e) =>
                  setEditingAd({ ...editingAd, scrolling_text: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">
                नवीन फोटो बदलायचा असल्यास निवडा
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditAdFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAd(null)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-bold"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="rounded-xl bg-neutral-950 px-5 py-2 text-sm font-bold text-amber-400"
              >
                जाहिरात सेव्ह करा
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Vendor Profile Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <form
            onSubmit={handleSaveVendorProfile}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
          >
            <h2 className="text-xl font-black text-neutral-950">दुकानदार खाते संपादन</h2>
            <div>
              <label className="block text-xs font-bold text-neutral-700">पूर्ण नाव</label>
              <input
                type="text"
                value={editingVendor.full_name || ""}
                onChange={(e) =>
                  setEditingVendor({ ...editingVendor, full_name: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">मोबाईल नंबर</label>
              <input
                type="text"
                value={editingVendor.phone || ""}
                onChange={(e) => setEditingVendor({ ...editingVendor, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700">Role</label>
              <select
                value={editingVendor.role || "vendor"}
                onChange={(e) => setEditingVendor({ ...editingVendor, role: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="vendor">vendor</option>
                <option value="customer">customer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingVendor(null)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-bold"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="rounded-xl bg-neutral-950 px-5 py-2 text-sm font-bold text-amber-400"
              >
                सेव्ह करा
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}