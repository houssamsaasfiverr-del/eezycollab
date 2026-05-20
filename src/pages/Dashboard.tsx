import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  Sparkles,
  Target,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { CampaignEmailLog, fetchCampaignInbox } from "../services/brevoEmail";
import CampaignFilters, {
  CampaignFilterState,
} from "../components/CampaignFilters";
import {
  autoRecommendCreators,
  fetchCreatorProfiles,
  profileMeta,
  type CreatorProfile,
  type SocialPlatform,
} from "../services/creatorDataService";

interface UserData {
  email?: string;
  displayName?: string;
  plan: "free" | "pro";
  credits: number;
  maxCredits: number;
  dailyCreditsUsed?: number;
  dailyLimit?: number;
  createdAt?: string;
}

interface ProjectItem {
  id: string;
  name: string;
  firstPrompt?: string;
  files: Array<{ name: string; content?: string }>;
  createdAt: string;
  lastModified: string;
}

interface InfluencerGroup {
  id: string;
  name: string;
  influencerIds: string[];
  createdAt: string;
}

type DashboardSection = "campaigns" | "lists" | "inbox" | "analytics";
type CampaignSubdivision = "influencers" | "recent" | "platforms";

type DashboardProps = {
  showCampaignMetrics?: boolean;
  titleOverride?: string;
  subtitleOverride?: string;
};

export default function Dashboard({
  showCampaignMetrics = true,
  titleOverride,
  subtitleOverride,
}: DashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("campaigns");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [inboxRows, setInboxRows] = useState<CampaignEmailLog[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const [campaignFilters, setCampaignFilters] = useState<CampaignFilterState>({
    platform: "All",
    minFollowers: 0,
    maxFollowers: 1000000,
    keywords: "",
    dateRange: "all",
  });

  const [campaignSubdivision, setCampaignSubdivision] =
    useState<CampaignSubdivision>("recent");
  const [campaignNavOpen, setCampaignNavOpen] = useState(true);

  const [directoryPlatform, setDirectoryPlatform] =
    useState<SocialPlatform>("YouTube");
  const [directoryKeyword, setDirectoryKeyword] = useState("");
  const [directoryBioKeywords, setDirectoryBioKeywords] = useState("");
  const [directoryDescription, setDirectoryDescription] = useState("");
  const [directoryProductUrl, setDirectoryProductUrl] = useState("");
  const [directoryRegion, setDirectoryRegion] = useState("");
  const [directoryCountry, setDirectoryCountry] = useState("");
  const [directoryLanguage, setDirectoryLanguage] = useState("");
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<CreatorProfile | null>(null);
  const [influencerGroups, setInfluencerGroups] = useState<InfluencerGroup[]>(
    [],
  );
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupModalProfile, setGroupModalProfile] =
    useState<CreatorProfile | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<InfluencerGroup | null>(
    null,
  );
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupError, setGroupError] = useState("");
  const [directoryMinFollowers, setDirectoryMinFollowers] = useState(0);
  const [directoryMaxFollowers, setDirectoryMaxFollowers] = useState(1000000);
  const [directorySort, setDirectorySort] = useState<
    "highest" | "lowest" | "name"
  >("highest");
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState("");
  const [directoryResults, setDirectoryResults] = useState<CreatorProfile[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [savedInfluencers, setSavedInfluencers] = useState<CreatorProfile[]>(
    [],
  );
  const [savedInfluencersLoading, setSavedInfluencersLoading] = useState(false);
  const [savedInfluencersHydrated, setSavedInfluencersHydrated] =
    useState(false);
  const [pendingGroupIds, setPendingGroupIds] = useState<string[]>([]);

  // Load saved influencers from Supabase
  const loadSavedInfluencers = async () => {
    if (!user) return;

    setSavedInfluencersLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_influencers")
        .select("*")
        .eq("user_id", user.uid)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const profiles: CreatorProfile[] = data.map((row) => ({
          id: row.influencer_id,
          platform: row.platform as SocialPlatform,
          handle: row.handle,
          displayName: row.display_name,
          bio: row.bio || undefined,
          avatarUrl: row.avatar_url || undefined,
          profileUrl: row.profile_url || undefined,
          followers: row.followers || undefined,
          views: row.views || undefined,
          engagementRate: row.engagement_rate
            ? Number(row.engagement_rate)
            : undefined,
        }));
        setSavedInfluencers(profiles);
      }
    } catch (error) {
      console.error("Failed to load saved influencers:", error);
    } finally {
      setSavedInfluencersLoading(false);
      setSavedInfluencersHydrated(true);
    }
  };

  useEffect(() => {
    if (!user) return;
    void loadSavedInfluencers();
  }, [user]);

  const groupsStorageKey = user
    ? `savedInfluencerGroups:${user.uid}`
    : "savedInfluencerGroups:guest";

  const persistGroups = (nextGroups: InfluencerGroup[]) => {
    setInfluencerGroups(nextGroups);
    if (user) {
      localStorage.setItem(groupsStorageKey, JSON.stringify(nextGroups));
    }
  };

  useEffect(() => {
    if (!user) {
      setInfluencerGroups([]);
      return;
    }
    const raw = localStorage.getItem(groupsStorageKey);
    if (!raw) {
      setInfluencerGroups([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as InfluencerGroup[];
      setInfluencerGroups(parsed);
    } catch (error) {
      console.warn("Failed to parse influencer groups", error);
      setInfluencerGroups([]);
    }
  }, [groupsStorageKey, user]);

  useEffect(() => {
    if (!user) return;
    if (!savedInfluencersHydrated) return;
    if (influencerGroups.length === 0) return;
    const savedIds = new Set(savedInfluencers.map((p) => p.id));
    pendingGroupIds.forEach((id) => savedIds.add(id));
    const nextGroups = influencerGroups.map((group) => ({
      ...group,
      influencerIds: group.influencerIds.filter((id) => savedIds.has(id)),
    }));
    const changed = nextGroups.some(
      (group, index) =>
        group.influencerIds.length !==
        influencerGroups[index].influencerIds.length,
    );
    if (changed) {
      persistGroups(nextGroups);
    }
  }, [
    influencerGroups,
    pendingGroupIds,
    savedInfluencers,
    savedInfluencersHydrated,
    user,
  ]);

  useEffect(() => {
    if (pendingGroupIds.length === 0) return;
    const savedIds = new Set(savedInfluencers.map((p) => p.id));
    setPendingGroupIds((prev) => prev.filter((id) => !savedIds.has(id)));
  }, [pendingGroupIds.length, savedInfluencers]);

  const saveInfluencer = async (profile: CreatorProfile) => {
    if (!user) return false;

    // Check if already saved
    if (savedInfluencers.some((p) => p.id === profile.id)) {
      return true;
    }

    const safeHandle =
      profile.handle?.trim() || profile.displayName?.trim() || profile.id;
    const safeDisplayName =
      profile.displayName?.trim() || profile.handle?.trim() || "Creator";
    const maxInt = 2147483647;
    const normalizeInt = (value?: number) => {
      if (value === undefined || value === null) return null;
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric <= 0) return null;
      return Math.min(Math.floor(numeric), maxInt);
    };
    const safeFollowers = normalizeInt(profile.followers);
    const safeViews = normalizeInt(profile.views);

    try {
      const { error } = await supabase.from("saved_influencers").upsert(
        {
          user_id: user.uid,
          influencer_id: profile.id,
          platform: profile.platform,
          handle: safeHandle,
          display_name: safeDisplayName,
          bio: profile.bio || null,
          avatar_url: profile.avatarUrl || null,
          profile_url: profile.profileUrl || null,
          followers: safeFollowers,
          views: safeViews,
          engagement_rate: profile.engagementRate || null,
        },
        {
          onConflict: "user_id,influencer_id",
          ignoreDuplicates: true,
        },
      );

      if (error) throw error;

      // Add to local state
      setSavedInfluencers((prev) => [profile, ...prev]);
      return true;
    } catch (error) {
      console.error("Failed to save influencer:", error);
      return false;
    }
  };

  const unsaveInfluencer = async (profileId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("saved_influencers")
        .delete()
        .eq("user_id", user.uid)
        .eq("influencer_id", profileId);
      if (error) throw error;

      // Remove from local state
      setSavedInfluencers((prev) => prev.filter((p) => p.id !== profileId));
      if (influencerGroups.length > 0) {
        const nextGroups = influencerGroups.map((group) => ({
          ...group,
          influencerIds: group.influencerIds.filter((id) => id !== profileId),
        }));
        persistGroups(nextGroups);
      }
    } catch (error) {
      console.error("Failed to unsave influencer:", error);
    }
  };

  const openGroupModal = (profile: CreatorProfile | null) => {
    setGroupModalProfile(profile);
    setGroupModalOpen(true);
    setSelectedInfluencer(null);
    setGroupNameInput("");
    setGroupError("");
  };

  const closeGroupModal = () => {
    setGroupModalOpen(false);
    setGroupModalProfile(null);
    setGroupNameInput("");
    setGroupError("");
  };

  const closeGroupDetails = () => {
    setSelectedGroup(null);
  };

  const createGroup = async () => {
    const name = groupNameInput.trim();
    if (!name) {
      setGroupError("Enter a group name.");
      return;
    }
    const exists = influencerGroups.some(
      (group) => group.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      setGroupError("Group name already exists.");
      return;
    }
    const newGroup: InfluencerGroup = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      influencerIds: [],
      createdAt: new Date().toISOString(),
    };
    if (groupModalProfile) {
      setPendingGroupIds((prev) =>
        prev.includes(groupModalProfile.id)
          ? prev
          : [...prev, groupModalProfile.id],
      );
      const saved = await saveInfluencer(groupModalProfile);
      if (!saved) {
        setGroupError("Could not save influencer. Try again.");
        return;
      }
      const nextGroups = [
        { ...newGroup, influencerIds: [groupModalProfile.id] },
        ...influencerGroups,
      ];
      persistGroups(nextGroups);
      closeGroupModal();
    } else {
      const nextGroups = [newGroup, ...influencerGroups];
      persistGroups(nextGroups);
      closeGroupModal();
    }
  };

  const saveInfluencerToGroup = async (groupId: string) => {
    if (!groupModalProfile) return;
    setPendingGroupIds((prev) =>
      prev.includes(groupModalProfile.id)
        ? prev
        : [...prev, groupModalProfile.id],
    );
    const saved = await saveInfluencer(groupModalProfile);
    if (!saved) {
      setGroupError("Could not save influencer. Try again.");
      return;
    }
    const nextGroups = influencerGroups.map((group) => {
      if (group.id !== groupId) return group;
      if (group.influencerIds.includes(groupModalProfile.id)) return group;
      return {
        ...group,
        influencerIds: [groupModalProfile.id, ...group.influencerIds],
      };
    });
    persistGroups(nextGroups);
    closeGroupModal();
  };

  const removeInfluencerFromGroup = (groupId: string, profileId: string) => {
    const nextGroups = influencerGroups.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        influencerIds: group.influencerIds.filter((id) => id !== profileId),
      };
    });
    persistGroups(nextGroups);
  };

  const isInfluencerSaved = (profileId: string) => {
    return savedInfluencers.some((p) => p.id === profileId);
  };

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard/campaigns/")) return;
    const sectionFromQuery = searchParams.get("section");
    if (
      sectionFromQuery === "campaigns" ||
      sectionFromQuery === "lists" ||
      sectionFromQuery === "inbox" ||
      sectionFromQuery === "analytics"
    ) {
      setActiveSection(sectionFromQuery);
    }
  }, [location.pathname, searchParams]);

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard/campaigns/")) return;
    if (searchParams.get("section") === activeSection) return;
    setSearchParams({ section: activeSection });
  }, [activeSection, location.pathname, searchParams, setSearchParams]);

  useEffect(() => {
    const match = location.pathname.match(
      /\/dashboard\/campaigns\/(influencers|recent|platforms)/,
    );
    if (!match) return;
    const view = match[1] as CampaignSubdivision;
    setActiveSection("campaigns");
    setCampaignSubdivision(view);
  }, [location.pathname]);

  useEffect(() => {
    if (activeSection === "campaigns") {
      setCampaignNavOpen(true);
    }
  }, [activeSection]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const hydrate = async () => {
      try {
        const { data } = await supabase
          .from("user_credits")
          .select("*")
          .eq("user_id", user.uid)
          .maybeSingle();

        const { data: projectsData } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.uid)
          .order("last_modified", { ascending: false });

        const fallbackUserData: UserData = {
          email: user.email || "",
          displayName: user.displayName || "Creator team",
          plan: "free",
          credits: 0,
          maxCredits: 0,
          dailyCreditsUsed: 0,
          dailyLimit: 5,
          createdAt: undefined,
        };

        if (data) {
          setUserData({
            email: data.email || user.email || "",
            displayName:
              data.display_name || user.displayName || "Creator team",
            plan: data.plan || "free",
            credits: data.credits_remaining || data.credits || 0,
            maxCredits: data.max_credits || data.total_credits || 0,
            dailyCreditsUsed: data.daily_credits_used || 0,
            dailyLimit: data.daily_limit || 5,
            createdAt: data.created_at,
          });
        } else {
          setUserData(fallbackUserData);
        }

        const parsedProjects: ProjectItem[] = (projectsData || []).map(
          (row) => ({
            id: row.id,
            name: row.name || "Untitled Project",
            firstPrompt: row.first_prompt || "",
            files: Array.isArray(row.files) ? row.files : [],
            createdAt: row.created_at || new Date().toISOString(),
            lastModified:
              row.last_modified || row.created_at || new Date().toISOString(),
          }),
        );

        setProjects(parsedProjects);
      } catch (error) {
        console.error("Failed to hydrate dashboard:", error);
        setUserData({
          email: user.email || "",
          displayName: user.displayName || "Creator team",
          plan: "free",
          credits: 0,
          maxCredits: 0,
          dailyCreditsUsed: 0,
          dailyLimit: 5,
          createdAt: undefined,
        });
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    void hydrate();

    const channel = supabase
      .channel(`dashboard-user-${user.uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${user.uid}`,
        },
        () => {
          void hydrate();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `user_id=eq.${user.uid}`,
        },
        () => {
          void hydrate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [navigate, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const goToDashboardOverview = () => {
    setActiveSection("campaigns");
    setCampaignSubdivision("recent");
    setCampaignNavOpen(true);
    navigate("/dashboard?section=campaigns", { replace: true });
  };

  const refreshInbox = async () => {
    if (!user) return;

    setInboxLoading(true);
    setInboxError("");
    try {
      const rows = await fetchCampaignInbox(user.uid);
      setInboxRows(rows);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load inbox";
      setInboxError(message);
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    if (!user || activeSection !== "inbox") return;
    void refreshInbox();
  }, [activeSection, user]);

  const resolvedUserData: UserData = userData ?? {
    email: user?.email || "",
    displayName: user?.displayName || "Creator team",
    plan: "free",
    credits: 0,
    maxCredits: 0,
    dailyCreditsUsed: 0,
    dailyLimit: 5,
    createdAt: undefined,
  };

  const isPro = resolvedUserData.plan === "pro";
  const dailyRemaining = Math.max(
    0,
    (resolvedUserData.dailyLimit || 5) -
      (resolvedUserData.dailyCreditsUsed || 0),
  );
  const creditsPercent =
    resolvedUserData.maxCredits > 0
      ? Math.min(
          100,
          (resolvedUserData.credits / resolvedUserData.maxCredits) * 100,
        )
      : 0;

  const metricCards = [
    {
      title: "Available Credits",
      value: String(resolvedUserData.credits),
      note: "Live from billing data",
      icon: Wallet,
    },
    {
      title: "Monthly Capacity",
      value: String(resolvedUserData.maxCredits),
      note: "Configured in your active plan",
      icon: BarChart3,
    },
    {
      title: "Daily Prompts Left",
      value: isPro ? "Unlimited" : String(dailyRemaining),
      note: isPro
        ? "No daily cap on Pro"
        : `${resolvedUserData.dailyCreditsUsed || 0}/${resolvedUserData.dailyLimit || 5} used`,
      icon: MessageSquare,
    },
    {
      title: "Current Plan",
      value: isPro ? "Pro" : "Free",
      note: isPro ? "Priority features enabled" : "Free access enabled",
      icon: Crown,
    },
  ];

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    const getDraft = (project: ProjectItem): any | null => {
      const draftFile = project.files.find(
        (file) => file.name === "campaign-draft.json",
      );
      if (!draftFile?.content) return null;
      try {
        return JSON.parse(String(draftFile.content));
      } catch {
        return null;
      }
    };

    // Filter by keywords
    if (campaignFilters.keywords?.trim()) {
      const keywords = campaignFilters.keywords.toLowerCase();
      filtered = filtered.filter((p) => {
        if (p.name.toLowerCase().includes(keywords)) return true;
        if (p.firstPrompt?.toLowerCase().includes(keywords)) return true;

        const draft = getDraft(p);
        if (!draft) return false;

        const haystack = [
          draft.productDescription,
          draft.productUrl,
          draft.hashtags,
          draft.language,
          draft.platform,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        return haystack.includes(keywords);
      });
    }

    // Filter by date range
    if (campaignFilters.dateRange && campaignFilters.dateRange !== "all") {
      const now = new Date();
      const ranges: Record<string, number> = {
        week: 7,
        month: 30,
        year: 365,
      };
      const days = ranges[campaignFilters.dateRange] || 0;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((p) => new Date(p.createdAt) >= cutoff);
    }

    // Filter by platform (check draft content)
    if (campaignFilters.platform && campaignFilters.platform !== "All") {
      filtered = filtered.filter((p) => {
        const draft = getDraft(p);
        return draft?.platform === campaignFilters.platform;
      });
    }

    // Filter by follower range from draft (Builder uses followerRange as max target)
    const minFollowers = Number(campaignFilters.minFollowers ?? 0);
    const maxFollowers = Number(campaignFilters.maxFollowers ?? 1000000);
    const followerFilterActive = minFollowers > 0 || maxFollowers < 1000000;

    if (followerFilterActive) {
      filtered = filtered.filter((p) => {
        const draft = getDraft(p);
        const rangeMax = Number(draft?.followerRange);
        if (!Number.isFinite(rangeMax)) return false;
        return rangeMax >= minFollowers && rangeMax <= maxFollowers;
      });
    }

    return filtered;
  }, [projects, campaignFilters]);

  const recentProjects = useMemo(
    () => filteredProjects.slice(0, 5),
    [filteredProjects],
  );

  const filteredDirectoryResults = useMemo(() => {
    const keyword = directoryKeyword.trim().toLowerCase();
    const bioKeyword = directoryBioKeywords.trim().toLowerCase();
    const minFollowers = Number(directoryMinFollowers || 0);
    const maxFollowers = Number(directoryMaxFollowers || 1000000);

    let rows = [...directoryResults];

    if (keyword) {
      rows = rows.filter((profile) => {
        const haystack =
          `${profile.displayName} ${profile.handle}`.toLowerCase();
        return haystack.includes(keyword);
      });
    }

    if (bioKeyword) {
      rows = rows.filter((profile) =>
        String(profile.bio || "")
          .toLowerCase()
          .includes(bioKeyword),
      );
    }

    const followerFilterActive = minFollowers > 0 || maxFollowers < 1000000;
    if (followerFilterActive) {
      rows = rows.filter((profile) => {
        const followers = Number(profile.followers || 0);
        return followers >= minFollowers && followers <= maxFollowers;
      });
    }

    if (directorySort === "name") {
      rows.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else {
      rows.sort((a, b) => {
        const af = Number(a.followers || 0);
        const bf = Number(b.followers || 0);
        return directorySort === "highest" ? bf - af : af - bf;
      });
    }

    return rows;
  }, [
    directoryResults,
    directoryKeyword,
    directoryBioKeywords,
    directoryMinFollowers,
    directoryMaxFollowers,
    directorySort,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDirectoryResults.length / itemsPerPage);
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDirectoryResults.slice(startIndex, endIndex);
  }, [filteredDirectoryResults, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    directoryKeyword,
    directoryBioKeywords,
    directoryMinFollowers,
    directoryMaxFollowers,
    directorySort,
    directoryResults,
  ]);

  const runDirectorySearch = async () => {
    setDirectoryError("");
    setDirectoryLoading(true);
    setCurrentPage(1); // Reset to page 1 on new search

    try {
      const keyword = directoryKeyword.trim();
      const bioKeyword = directoryBioKeywords.trim();
      const regionCode = directoryRegion.trim();
      const countryCode = directoryCountry.trim();
      const relevanceLanguage = directoryLanguage.trim();
      const description = [
        directoryDescription.trim(),
        directoryProductUrl.trim(),
      ]
        .filter(Boolean)
        .join("\n");
      const combinedQuery = [keyword, bioKeyword, directoryDescription.trim()]
        .filter(Boolean)
        .join(" ");
      const shouldDirectFetch =
        keyword.startsWith("@") ||
        keyword.startsWith("http") ||
        keyword.includes("instagram.com") ||
        keyword.includes("tiktok.com") ||
        keyword.includes("youtube.com");
      const shouldYoutubeKeywordSearch =
        directoryPlatform === "YouTube" && combinedQuery.length > 0;

      const youtubeOptions = {
        regionCode: regionCode || undefined,
        countryCode: countryCode || undefined,
        relevanceLanguage: relevanceLanguage || undefined,
        requireNonTitleMatch: true,
      };

      let results: CreatorProfile[] = [];

      if (shouldYoutubeKeywordSearch) {
        results = await fetchCreatorProfiles(
          "YouTube",
          combinedQuery,
          youtubeOptions,
        );
      } else if (shouldDirectFetch) {
        results = await fetchCreatorProfiles(
          directoryPlatform,
          keyword,
          directoryPlatform === "YouTube" ? youtubeOptions : undefined,
        );
      }

      if (results.length === 0) {
        const aiDescription = description || keyword || "Influencer campaign";
        const aiHashtags = keyword || directoryBioKeywords || "";
        results = await autoRecommendCreators(
          directoryPlatform,
          aiDescription,
          aiHashtags,
        );
      }

      setDirectoryResults(results);
      if (results.length === 0) {
        setDirectoryError(
          "No influencers found. Add keywords/description, or configure the required API keys.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Influencer lookup failed";
      setDirectoryError(message);
      setDirectoryResults([]);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const savedHandles = useMemo(() => {
    const handles = new Set<string>();

    for (const project of projects) {
      const draftFile = project.files.find(
        (file) => file.name === "campaign-draft.json",
      );
      if (!draftFile?.content) continue;

      try {
        const parsed = JSON.parse(String(draftFile.content)) as {
          influencerInput?: string;
        };
        const raw = parsed.influencerInput || "";
        raw
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((handle) => handles.add(handle));
      } catch {
        // Skip malformed draft content and continue collecting usable handles.
      }
    }

    return Array.from(handles);
  }, [projects]);

  const savedInfluencerMap = useMemo(() => {
    return new Map(savedInfluencers.map((profile) => [profile.id, profile]));
  }, [savedInfluencers]);

  const groupedInfluencers = useMemo(() => {
    return influencerGroups.map((group) => ({
      ...group,
      influencers: group.influencerIds
        .map((id) => savedInfluencerMap.get(id))
        .filter((profile): profile is CreatorProfile => Boolean(profile)),
    }));
  }, [influencerGroups, savedInfluencerMap]);

  const projectsThisMonth = useMemo(() => {
    const now = new Date();
    return projects.filter((project) => {
      const created = new Date(project.createdAt);
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    }).length;
  }, [projects]);

  const avgFilesPerProject = useMemo(() => {
    if (projects.length === 0) return 0;
    const total = projects.reduce(
      (sum, project) => sum + project.files.length,
      0,
    );
    return Number((total / projects.length).toFixed(1));
  }, [projects]);

  const navItems: Array<{
    id: DashboardSection;
    label: string;
    icon: ComponentType<{ size?: string | number }>;
  }> = [
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "lists", label: "Saved Lists", icon: Users },
    { id: "inbox", label: "Inbox", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const sectionMeta: Record<
    DashboardSection,
    { title: string; subtitle: string }
  > = {
    campaigns: {
      title: "Campaign Dashboard",
      subtitle: `Welcome back, ${resolvedUserData.displayName}.`,
    },
    lists: {
      title: "Saved Influencer Lists",
      subtitle: "Collected from all your campaign drafts.",
    },
    inbox: {
      title: "Inbox",
      subtitle: "Track campaign outreach and reply progress.",
    },
    analytics: {
      title: "Analytics",
      subtitle: "Live campaign insights from your project history.",
    },
  };

  const campaignTitleMap: Record<CampaignSubdivision, string> = {
    influencers: "Influencer Directory",
    recent: "Recent Campaigns",
    platforms: "Platforms",
  };

  const isCampaignRoute = location.pathname.startsWith("/dashboard/campaigns/");
  const effectiveTitle =
    titleOverride ??
    (isCampaignRoute
      ? campaignTitleMap[campaignSubdivision]
      : sectionMeta[activeSection].title);
  const effectiveSubtitle =
    subtitleOverride ??
    (isCampaignRoute
      ? "Explore campaign insights and actions."
      : sectionMeta[activeSection].subtitle);

  // Check if we're on a dedicated page (campaign routes)
  if (loading) {
    return (
      <div className="ec-dash-loading">
        <Sparkles className="spin" size={22} />
        <span>Loading workspace...</span>
        <style>{`
          .ec-dash-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: #fdf8f1;
            color: #4b3a2f;
            font-family: "Manrope", "Segoe UI", sans-serif;
          }
          .spin { animation: spin 0.9s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const renderSection = () => {
    if (activeSection === "campaigns") {
      return (
        <>
          {showCampaignMetrics && (
            <section className="ec-metrics-grid">
              {metricCards.map((card) => (
                <article key={card.title} className="ec-metric-card">
                  <div>
                    <p>{card.title}</p>
                    <strong>{card.value}</strong>
                    <small>{card.note}</small>
                  </div>
                  <card.icon size={17} />
                </article>
              ))}
            </section>
          )}

          {campaignSubdivision === "influencers" && (
            <section className="ec-directory">
              <aside className="ec-dir-filters">
                <div className="ec-dir-head">
                  <h2>Influencer Directory</h2>
                  <p>
                    Search and filter creators by platform, keywords, and
                    follower range.
                  </p>
                </div>

                <label>
                  Platform
                  <select
                    value={directoryPlatform}
                    onChange={(e) =>
                      setDirectoryPlatform(e.target.value as SocialPlatform)
                    }
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </label>

                <label>
                  Search by keyword / handle / URL
                  <input
                    value={directoryKeyword}
                    onChange={(e) => setDirectoryKeyword(e.target.value)}
                    placeholder="e.g. @creator, youtube.com, fintech"
                  />
                </label>

                <label>
                  Product / campaign description
                  <textarea
                    value={directoryDescription}
                    onChange={(e) => setDirectoryDescription(e.target.value)}
                    placeholder="Describe your product and ideal influencer"
                  />
                </label>

                <label>
                  Product URL
                  <input
                    value={directoryProductUrl}
                    onChange={(e) => setDirectoryProductUrl(e.target.value)}
                    placeholder="https://yourbrand.com"
                  />
                </label>

                <label>
                  Bio keywords
                  <input
                    value={directoryBioKeywords}
                    onChange={(e) => setDirectoryBioKeywords(e.target.value)}
                    placeholder="Enter keywords in bio"
                  />
                </label>

                <div className="ec-dir-row">
                  <label>
                    Region (YouTube)
                    <select
                      value={directoryRegion}
                      onChange={(e) => setDirectoryRegion(e.target.value)}
                    >
                      <option value="">Any</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="IN">India</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="BR">Brazil</option>
                      <option value="JP">Japan</option>
                      <option value="AE">United Arab Emirates</option>
                    </select>
                  </label>

                  <label>
                    Country (YouTube)
                    <select
                      value={directoryCountry}
                      onChange={(e) => setDirectoryCountry(e.target.value)}
                    >
                      <option value="">Any</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="IN">India</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="BR">Brazil</option>
                      <option value="JP">Japan</option>
                      <option value="AE">United Arab Emirates</option>
                    </select>
                  </label>
                </div>

                <label>
                  Language (YouTube)
                  <select
                    value={directoryLanguage}
                    onChange={(e) => setDirectoryLanguage(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="pt">Portuguese</option>
                    <option value="hi">Hindi</option>
                    <option value="ta">Tamil</option>
                    <option value="ar">Arabic</option>
                    <option value="ja">Japanese</option>
                  </select>
                </label>

                <div className="ec-dir-row">
                  <label>
                    Min followers
                    <input
                      type="number"
                      min={0}
                      value={directoryMinFollowers}
                      onChange={(e) =>
                        setDirectoryMinFollowers(Number(e.target.value) || 0)
                      }
                    />
                  </label>
                  <label>
                    Max followers
                    <input
                      type="number"
                      min={0}
                      value={directoryMaxFollowers}
                      onChange={(e) =>
                        setDirectoryMaxFollowers(Number(e.target.value) || 0)
                      }
                    />
                  </label>
                </div>

                <label>
                  Sort by
                  <select
                    value={directorySort}
                    onChange={(e) => setDirectorySort(e.target.value as any)}
                  >
                    <option value="highest">Highest reach</option>
                    <option value="lowest">Lowest reach</option>
                    <option value="name">Name</option>
                  </select>
                </label>

                <div className="ec-dir-actions">
                  <button
                    className="ghost"
                    onClick={() => {
                      setDirectoryKeyword("");
                      setDirectoryBioKeywords("");
                      setDirectoryDescription("");
                      setDirectoryProductUrl("");
                      setDirectoryRegion("");
                      setDirectoryCountry("");
                      setDirectoryLanguage("");
                      setDirectoryMinFollowers(0);
                      setDirectoryMaxFollowers(1000000);
                      setDirectorySort("highest");
                      setDirectoryResults([]);
                      setDirectoryError("");
                    }}
                  >
                    Reset
                  </button>
                  <button
                    className="primary"
                    onClick={() => void runDirectorySearch()}
                    disabled={directoryLoading}
                  >
                    {directoryLoading ? "Searching..." : "Search"}
                  </button>
                </div>

                {directoryError && (
                  <div className="ec-inline-error">{directoryError}</div>
                )}
              </aside>

              <div className="ec-dir-results">
                <div className="ec-dir-results-head">
                  <h3>Influencers</h3>
                  <div className="ec-results-info">
                    <span className="ec-muted">
                      {filteredDirectoryResults.length} results
                    </span>
                    {totalPages > 1 && (
                      <span className="ec-muted">
                        Page {currentPage} of {totalPages}
                      </span>
                    )}
                  </div>
                </div>

                {filteredDirectoryResults.length === 0 && !directoryLoading ? (
                  <div className="ec-empty-state">
                    <Users size={26} />
                    <h3>No influencers yet</h3>
                    <p>Use the filters on the left and run search.</p>
                  </div>
                ) : (
                  <>
                    <div className="ec-dir-grid">
                      {paginatedResults.map((profile) => {
                        const isSaved = isInfluencerSaved(profile.id);
                        return (
                          <article
                            key={profile.id}
                            className="ec-dir-card"
                            onClick={() => setSelectedInfluencer(profile)}
                          >
                            <div className="head">
                              <div>
                                <h4>{profile.displayName}</h4>
                                <p>{profile.handle}</p>
                                {profile.email ? (
                                  <p className="ec-card-email">
                                    <Mail size={12} />
                                    {profile.email}
                                  </p>
                                ) : profile.profileUrl ? (
                                  <p className="ec-card-email">
                                    <Mail size={12} />
                                    No public email found. Open the channel and
                                    check About/Contact info.
                                  </p>
                                ) : null}
                              </div>
                              {profile.avatarUrl && (
                                <img
                                  src={profile.avatarUrl}
                                  alt={profile.displayName}
                                />
                              )}
                            </div>
                            <small className="meta">
                              {profileMeta(profile)}
                            </small>
                            <span className="ec-card-hint">
                              Click to view details
                            </span>
                            <div className="actions">
                              <button
                                className={`save-btn ${isSaved ? "saved" : ""}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openGroupModal(profile);
                                }}
                                title={
                                  isSaved ? "Add to group" : "Save to group"
                                }
                              >
                                {isSaved ? (
                                  <BookmarkCheck size={14} />
                                ) : (
                                  <Bookmark size={14} />
                                )}
                                {isSaved ? "Saved" : "Save"}
                              </button>
                              {profile.profileUrl && (
                                <a
                                  href={profile.profileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  Open channel
                                </a>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="ec-pagination">
                        <button
                          className="ec-page-btn"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft size={16} />
                          Previous
                        </button>

                        <div className="ec-page-numbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              // Show first page, last page, current page, and pages around current
                              return (
                                page === 1 ||
                                page === totalPages ||
                                Math.abs(page - currentPage) <= 1
                              );
                            })
                            .map((page, index, array) => {
                              // Add ellipsis if there's a gap
                              const prevPage = array[index - 1];
                              const showEllipsis =
                                prevPage && page - prevPage > 1;

                              return (
                                <div
                                  key={page}
                                  style={{ display: "flex", gap: "4px" }}
                                >
                                  {showEllipsis && (
                                    <span className="ec-page-ellipsis">
                                      ...
                                    </span>
                                  )}
                                  <button
                                    className={`ec-page-num ${page === currentPage ? "active" : ""}`}
                                    onClick={() => setCurrentPage(page)}
                                  >
                                    {page}
                                  </button>
                                </div>
                              );
                            })}
                        </div>

                        <button
                          className="ec-page-btn"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1),
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {campaignSubdivision === "platforms" && (
            <section className="ec-platforms">
              {(["YouTube", "Instagram", "Facebook", "TikTok"] as const).map(
                (platform) => {
                  const platformInfo = {
                    YouTube: {
                      icon: "🎥",
                      color: "#FF0000",
                      gradient: "linear-gradient(135deg, #FF0000, #CC0000)",
                      description:
                        "Discover video creators and long-form content influencers",
                      stats: "2B+ users worldwide",
                    },
                    Instagram: {
                      icon: "📸",
                      color: "#E4405F",
                      gradient:
                        "linear-gradient(135deg, #833AB4, #E4405F, #FCAF45)",
                      description:
                        "Connect with visual storytellers and lifestyle influencers",
                      stats: "2B+ active users",
                    },
                    Facebook: {
                      icon: "👥",
                      color: "#1877F2",
                      gradient: "linear-gradient(135deg, #1877F2, #0C63D4)",
                      description:
                        "Reach community builders and diverse audiences",
                      stats: "3B+ monthly users",
                    },
                    TikTok: {
                      icon: "🎵",
                      color: "#000000",
                      gradient: "linear-gradient(135deg, #00F2EA, #FF0050)",
                      description:
                        "Engage with short-form video creators and viral trends",
                      stats: "1B+ active users",
                    },
                  };

                  const info = platformInfo[platform];

                  return (
                    <article key={platform} className="ec-platform-card">
                      <div className="ec-platform-header">
                        <div
                          className="ec-platform-icon"
                          style={{ background: info.gradient }}
                        >
                          <span>{info.icon}</span>
                        </div>
                        <div className="ec-platform-title">
                          <h3>{platform}</h3>
                          <span className="ec-platform-stats">
                            {info.stats}
                          </span>
                        </div>
                      </div>
                      <p className="ec-platform-description">
                        {info.description}
                      </p>
                      <div className="ec-platform-actions">
                        <button
                          className="ghost"
                          onClick={() => {
                            setDirectoryPlatform(platform as SocialPlatform);
                            setCampaignSubdivision("influencers");
                            void runDirectorySearch();
                          }}
                        >
                          <Users size={16} />
                          Explore influencers
                        </button>
                        <button
                          className="primary"
                          onClick={() => {
                            setCampaignFilters((prev) => ({
                              ...prev,
                              platform: platform as any,
                            }));
                            setCampaignSubdivision("recent");
                          }}
                        >
                          <Target size={16} />
                          Explore campaigns
                        </button>
                      </div>
                    </article>
                  );
                },
              )}
            </section>
          )}

          {campaignSubdivision === "recent" && (
            <section className="ec-layout-grid">
              <article className="ec-panel ec-projects-panel">
                <div className="ec-panel-head">
                  <h2>Recent Campaigns</h2>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <CampaignFilters onFilterChange={setCampaignFilters} />
                    <button onClick={() => navigate("/builder")}>
                      New project
                    </button>
                  </div>
                </div>

                {recentProjects.length === 0 ? (
                  <div className="ec-empty-state">
                    <Target size={26} />
                    <h3>No campaigns match</h3>
                    <p>
                      Adjust filters or create a new campaign to get started.
                    </p>
                  </div>
                ) : (
                  <div className="ec-list-rows">
                    {recentProjects.map((project) => {
                      let platformLabel = "—";
                      let followerRangeLabel = "";
                      try {
                        const draftFile = project.files.find(
                          (file) => file.name === "campaign-draft.json",
                        );
                        const draft = draftFile?.content
                          ? JSON.parse(String(draftFile.content))
                          : null;
                        platformLabel = String(draft?.platform || "—");
                        const followerRange = Number(draft?.followerRange);
                        if (
                          Number.isFinite(followerRange) &&
                          followerRange > 0
                        ) {
                          followerRangeLabel = ` · up to ${Math.round(followerRange).toLocaleString()} followers`;
                        }
                      } catch {
                        // ignore draft parse errors
                      }

                      return (
                        <button
                          key={project.id}
                          className="ec-list-row ec-campaign-row"
                          onClick={() =>
                            navigate(`/builder?project=${project.id}`)
                          }
                        >
                          <div className="ec-campaign-row-main">
                            <span>{project.name}</span>
                            <small>
                              {platformLabel}
                              {followerRangeLabel}
                            </small>
                          </div>
                          <small>
                            {new Date(project.lastModified).toLocaleDateString(
                              "en-US",
                            )}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="ec-panel ec-activity-panel">
                <div className="ec-panel-head">
                  <h2>Recent Activity</h2>
                  <button onClick={() => setActiveSection("inbox")}>
                    Open inbox
                  </button>
                </div>

                {inboxRows.length === 0 ? (
                  <div className="ec-empty-state">
                    <MessageSquare size={26} />
                    <h3>No outreach yet</h3>
                    <p>Send bulk emails from Builder to populate activity.</p>
                  </div>
                ) : (
                  <div className="ec-inbox-list">
                    {inboxRows.slice(0, 6).map((row) => (
                      <article key={row.id} className="ec-inbox-row">
                        <div>
                          <strong>
                            {row.recipient_name || row.recipient_email}
                          </strong>
                          <p>{row.subject || "No subject"}</p>
                          <small>
                            {new Date(row.created_at).toLocaleString("en-US")}
                          </small>
                        </div>
                        <span className={`ec-status-chip ${row.status}`}>
                          {row.status}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </section>
          )}
        </>
      );
    }

    if (activeSection === "lists") {
      return (
        <>
          <section className="ec-panel ec-list-panel">
            <div className="ec-panel-head">
              <h2>Saved Influencers</h2>
              <div className="ec-panel-actions">
                <button onClick={() => openGroupModal(null)}>
                  Create group
                </button>
                <button
                  onClick={() => {
                    setActiveSection("campaigns");
                    setCampaignSubdivision("influencers");
                    navigate("/dashboard/campaigns/influencers");
                  }}
                >
                  Discover more
                </button>
              </div>
            </div>

            {savedInfluencersLoading ? (
              <div className="ec-empty-state">
                <Loader2 size={24} className="spin" />
                <h3>Loading saved influencers...</h3>
              </div>
            ) : savedInfluencers.length === 0 ? (
              <div className="ec-empty-state">
                <Users size={26} />
                <h3>No saved influencers yet</h3>
                <p>
                  Browse the Influencer Directory and click "Save" to add
                  creators to your list.
                </p>
              </div>
            ) : (
              <div className="ec-saved-influencers-grid">
                {savedInfluencers.map((profile) => (
                  <article key={profile.id} className="ec-saved-card">
                    <div className="head">
                      <div>
                        <h4>{profile.displayName}</h4>
                        <p>{profile.handle}</p>
                      </div>
                      {profile.avatarUrl && (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.displayName}
                        />
                      )}
                    </div>
                    <small className="meta">{profileMeta(profile)}</small>
                    {profile.bio && <p className="bio">{profile.bio}</p>}
                    <div className="actions">
                      <button
                        className="group-btn"
                        onClick={() => openGroupModal(profile)}
                      >
                        Add to group
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => void unsaveInfluencer(profile.id)}
                      >
                        Remove
                      </button>
                      {profile.profileUrl && (
                        <a
                          href={profile.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="ec-panel ec-list-panel">
            <div className="ec-panel-head">
              <h2>Groups</h2>
              <button onClick={() => openGroupModal(null)}>New group</button>
            </div>

            {groupedInfluencers.length === 0 ? (
              <div className="ec-empty-state">
                <Users size={26} />
                <h3>No groups yet</h3>
                <p>Create a group and start organizing saved influencers.</p>
              </div>
            ) : (
              <div className="ec-groups-grid">
                {groupedInfluencers.map((group) => (
                  <article
                    key={group.id}
                    className="ec-group-card"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="ec-group-head">
                      <div>
                        <h3>{group.name}</h3>
                        <span>{group.influencers.length} influencers</span>
                      </div>
                    </div>
                    {group.influencers.length === 0 ? (
                      <p className="ec-group-empty">
                        No influencers in this group yet.
                      </p>
                    ) : (
                      <p className="ec-group-empty">
                        Click to view this group.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {savedHandles.length > 0 && (
            <section className="ec-panel ec-list-panel">
              <div className="ec-panel-head">
                <h2>Campaign Handles</h2>
                <button onClick={() => navigate("/builder")}>
                  Add from campaign
                </button>
              </div>
              <div className="ec-handle-grid">
                {savedHandles.map((handle) => (
                  <div key={handle} className="ec-handle-chip">
                    {handle}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      );
    }

    if (activeSection === "inbox") {
      return (
        <section className="ec-panel ec-inbox-panel">
          <div className="ec-panel-head">
            <h2>Campaign Inbox</h2>
            <div className="ec-panel-actions">
              <button onClick={() => void refreshInbox()}>
                {inboxLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button onClick={() => navigate("/builder")}>
                Open outreach setup
              </button>
            </div>
          </div>

          {inboxError && <div className="ec-inline-error">{inboxError}</div>}

          {inboxLoading && (
            <div className="ec-empty-state">
              <Loader2 size={24} className="spin" />
              <h3>Syncing inbox events</h3>
              <p>Checking Brevo delivery and reply activity...</p>
            </div>
          )}

          {!inboxLoading && inboxRows.length === 0 && (
            <div className="ec-empty-state">
              <MessageSquare size={26} />
              <h3>No email activity yet</h3>
              <p>
                Send bulk emails from Builder and your inbox timeline appears
                here.
              </p>
            </div>
          )}

          {!inboxLoading && inboxRows.length > 0 && (
            <div className="ec-inbox-list">
              {inboxRows.slice(0, 40).map((row) => (
                <article key={row.id} className="ec-inbox-row">
                  <div>
                    <strong>{row.recipient_name || row.recipient_email}</strong>
                    <p>{row.subject || "No subject"}</p>
                    <small>
                      {new Date(row.created_at).toLocaleString("en-US")}
                    </small>
                  </div>
                  <span className={`ec-status-chip ${row.status}`}>
                    {row.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }

    return (
      <section className="ec-layout-grid ec-layout-grid-analytics">
        <article className="ec-panel">
          <div className="ec-panel-head">
            <h2>Campaign Health</h2>
          </div>
          <div className="ec-kpi-grid">
            <div>
              <span>Total Projects</span>
              <strong>{projects.length}</strong>
            </div>
            <div>
              <span>Created This Month</span>
              <strong>{projectsThisMonth}</strong>
            </div>
            <div>
              <span>Avg Files/Project</span>
              <strong>{avgFilesPerProject}</strong>
            </div>
          </div>
        </article>
        <article className="ec-panel">
          <div className="ec-panel-head">
            <h2>Latest Projects</h2>
          </div>
          {recentProjects.length === 0 ? (
            <div className="ec-empty-state">
              <BarChart3 size={26} />
              <h3>No analytics yet</h3>
              <p>Create your first campaign to start seeing usage trends.</p>
            </div>
          ) : (
            <div className="ec-list-rows">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  className="ec-list-row"
                  onClick={() => navigate(`/builder?project=${project.id}`)}
                >
                  <span>{project.name}</span>
                  <small>
                    {new Date(project.lastModified).toLocaleDateString("en-US")}
                  </small>
                </button>
              ))}
            </div>
          )}
        </article>
      </section>
    );
  };

  return (
    <div className="ec-dash">
      <aside className="ec-sidebar">
        <button className="ec-brand" onClick={goToDashboardOverview}>
          <Sparkles size={18} />
          <span>CollabFree</span>
        </button>

        <nav className="ec-navlist">
          {navItems.map((item) => {
            if (item.id !== "campaigns") {
              return (
                <button
                  key={item.id}
                  className={`ec-nav-item ${activeSection === item.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveSection(item.id);
                    navigate(`/dashboard?section=${item.id}`);
                  }}
                >
                  <span className="ec-nav-label">
                    <item.icon size={16} /> {item.label}
                  </span>
                </button>
              );
            }

            return (
              <div key={item.id} className="ec-nav-group">
                <button
                  className={`ec-nav-item ${activeSection === item.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveSection("campaigns");
                    setCampaignNavOpen((prev) =>
                      activeSection === "campaigns" ? !prev : true,
                    );
                    navigate(`/dashboard/campaigns/${campaignSubdivision}`);
                  }}
                >
                  <span className="ec-nav-label">
                    <item.icon size={16} /> {item.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`ec-nav-chevron ${campaignNavOpen ? "open" : ""}`}
                  />
                </button>

                {campaignNavOpen && (
                  <div className="ec-subnav">
                    <button
                      className={
                        campaignSubdivision === "influencers" ? "active" : ""
                      }
                      onClick={() => {
                        setActiveSection("campaigns");
                        setCampaignSubdivision("influencers");
                        navigate("/dashboard/campaigns/influencers");
                      }}
                    >
                      Show Influencer
                    </button>
                    <button
                      className={
                        campaignSubdivision === "recent" ? "active" : ""
                      }
                      onClick={() => {
                        setActiveSection("campaigns");
                        setCampaignSubdivision("recent");
                        navigate("/dashboard/campaigns/recent");
                      }}
                    >
                      Recent Campaigns
                    </button>
                    <button
                      className={
                        campaignSubdivision === "platforms" ? "active" : ""
                      }
                      onClick={() => {
                        setActiveSection("campaigns");
                        setCampaignSubdivision("platforms");
                        navigate("/dashboard/campaigns/platforms");
                      }}
                    >
                      Platforms
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <button
          className="ec-profile-card"
          onClick={() => navigate("/profile")}
        >
          <div className="ec-profile-avatar">
            <User size={18} />
          </div>
          <div className="ec-profile-info">
            <strong>{resolvedUserData.displayName}</strong>
            <span>{isPro ? "Pro" : "Free"} Plan</span>
          </div>
        </button>

        <div className="ec-usage">
          <p>Subscription Usage</p>
          <strong>
            {resolvedUserData.credits} / {resolvedUserData.maxCredits} credits
          </strong>
          <div className="bar">
            <span style={{ width: `${creditsPercent}%` }} />
          </div>
          {!isPro && <small>{dailyRemaining} prompts remaining today</small>}
        </div>

        <button className="ec-logout" onClick={handleLogout}>
          <LogOut size={15} /> Sign out
        </button>
      </aside>

      <div className="ec-main">
        <header className="ec-topbar">
          <div className="ec-topbar-title-section">
            {isCampaignRoute && (
              <button className="ec-back-btn" onClick={goToDashboardOverview}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1>{effectiveTitle}</h1>
              <p>{effectiveSubtitle}</p>
            </div>
          </div>
          <div className="ec-topbar-actions">
            <button
              className="ec-icon-btn"
              onClick={() => setNotificationOpen((prev) => !prev)}
            >
              <Bell size={16} />
            </button>
            <button className="ec-primary" onClick={() => navigate("/builder")}>
              <Plus size={15} /> New Campaign
            </button>
          </div>
          {notificationOpen && (
            <div className="ec-notice-popover">
              <strong>Notifications</strong>
              <p>
                Your workspace is synced. New campaign updates will appear here.
              </p>
            </div>
          )}
        </header>

        {renderSection()}
      </div>

      {selectedInfluencer && (
        <div
          className="ec-influencer-modal-overlay"
          onClick={() => setSelectedInfluencer(null)}
        >
          <div
            className="ec-influencer-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div className="modal-title">
                {selectedInfluencer.avatarUrl && (
                  <img
                    src={selectedInfluencer.avatarUrl}
                    alt={selectedInfluencer.displayName}
                  />
                )}
                <div>
                  <h3>{selectedInfluencer.displayName}</h3>
                  <p>{selectedInfluencer.handle}</p>
                  {selectedInfluencer.email ? (
                    <p className="modal-email">{selectedInfluencer.email}</p>
                  ) : selectedInfluencer.profileUrl ? (
                    <p className="modal-email">
                      No public email found. Open the channel and check
                      About/Contact info.
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedInfluencer(null)}
              >
                Close
              </button>
            </div>

            <div className="modal-meta">{profileMeta(selectedInfluencer)}</div>

            <div className="modal-details">
              <div>
                <strong>Platform</strong>
                <span>{selectedInfluencer.platform}</span>
              </div>
              {selectedInfluencer.email ? (
                <div>
                  <strong>Email</strong>
                  <span>{selectedInfluencer.email}</span>
                </div>
              ) : selectedInfluencer.profileUrl ? (
                <div>
                  <strong>Email</strong>
                  <span>
                    No public email found. Open the channel and check
                    About/Contact info.
                  </span>
                </div>
              ) : null}
              {selectedInfluencer.followers !== undefined && (
                <div>
                  <strong>Followers</strong>
                  <span>
                    {selectedInfluencer.followers.toLocaleString("en-US")}
                  </span>
                </div>
              )}
              {selectedInfluencer.views !== undefined && (
                <div>
                  <strong>Views</strong>
                  <span>
                    {selectedInfluencer.views.toLocaleString("en-US")}
                  </span>
                </div>
              )}
              {selectedInfluencer.engagementRate !== undefined && (
                <div>
                  <strong>Engagement</strong>
                  <span>{selectedInfluencer.engagementRate}%</span>
                </div>
              )}
              {selectedInfluencer.profileUrl && (
                <div>
                  <strong>Profile</strong>
                  <span>{selectedInfluencer.profileUrl}</span>
                </div>
              )}
            </div>

            {selectedInfluencer.bio && (
              <div className="modal-bio">
                <strong>About</strong>
                <p>{selectedInfluencer.bio}</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                className={`save-btn ${
                  isInfluencerSaved(selectedInfluencer.id) ? "saved" : ""
                }`}
                onClick={() => openGroupModal(selectedInfluencer)}
              >
                {isInfluencerSaved(selectedInfluencer.id) ? "Saved" : "Save"}
              </button>
              {selectedInfluencer.profileUrl && (
                <a
                  className="modal-open"
                  href={selectedInfluencer.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open channel
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {groupModalOpen && (
        <div className="ec-group-modal-overlay" onClick={closeGroupModal}>
          <div
            className="ec-group-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h3>
                  {groupModalProfile
                    ? "Save influencer to group"
                    : "Create a new group"}
                </h3>
                {groupModalProfile && (
                  <p>
                    {groupModalProfile.displayName} {groupModalProfile.handle}
                  </p>
                )}
              </div>
              <button className="modal-close" onClick={closeGroupModal}>
                Close
              </button>
            </div>

            {influencerGroups.length > 0 ? (
              <div className="ec-group-list">
                {influencerGroups.map((group) => (
                  <div key={group.id} className="ec-group-row">
                    <div>
                      <strong>{group.name}</strong>
                      <span>{group.influencerIds.length} influencers</span>
                    </div>
                    {groupModalProfile ? (
                      <button
                        onClick={() => void saveInfluencerToGroup(group.id)}
                      >
                        Save here
                      </button>
                    ) : (
                      <span className="ec-group-hint">
                        Select an influencer
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ec-empty-state">
                <Users size={26} />
                <h3>No groups yet</h3>
                <p>Create a group to organize saved influencers.</p>
              </div>
            )}

            <div className="ec-group-create">
              <label>
                Group name
                <input
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  placeholder="e.g. Food creators"
                />
              </label>
              <button onClick={() => void createGroup()}>
                {groupModalProfile ? "Create & Save" : "Create group"}
              </button>
            </div>

            {groupError && <div className="ec-inline-error">{groupError}</div>}
          </div>
        </div>
      )}

      {selectedGroup && (
        <div className="ec-group-modal-overlay" onClick={closeGroupDetails}>
          <div
            className="ec-group-details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h3>{selectedGroup.name}</h3>
                <p>{selectedGroup.influencerIds.length} influencers</p>
              </div>
              <button
                className="modal-close modal-close-absolute"
                onClick={closeGroupDetails}
              >
                Close
              </button>
            </div>

            {selectedGroup.influencerIds.length === 0 ? (
              <div className="ec-empty-state">
                <Users size={26} />
                <h3>No influencers in this group</h3>
                <p>Add influencers from the Saved list.</p>
              </div>
            ) : (
              <div className="ec-group-detail-list">
                {selectedGroup.influencerIds.map((profileId) => {
                  const profile = savedInfluencerMap.get(profileId);
                  if (!profile) return null;
                  return (
                    <div key={profile.id} className="ec-group-detail-row">
                      <div>
                        <strong>{profile.displayName}</strong>
                        <span>{profile.handle}</span>
                      </div>
                      <div className="ec-group-detail-actions">
                        <button
                          onClick={() =>
                            removeInfluencerFromGroup(
                              selectedGroup.id,
                              profile.id,
                            )
                          }
                        >
                          Remove
                        </button>
                        {profile.profileUrl && (
                          <a
                            href={profile.profileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .ec-dash {
          min-height: 100vh;
          background: linear-gradient(140deg, #fffaf4, #fff5eb 40%, #fff);
          color: #211a15;
          display: grid;
          grid-template-columns: 280px 1fr;
          font-family: "Manrope", "Segoe UI", sans-serif;
        }

        .ec-dash-dedicated {
          grid-template-columns: 1fr;
        }

        .ec-sidebar {
          border-right: 1px solid #f0ddca;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: rgba(255, 252, 248, 0.88);
          backdrop-filter: blur(8px);
        }

        .ec-brand {
          border: 0;
          background: transparent;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 19px;
          color: #19130f;
          cursor: pointer;
          width: fit-content;
        }

        .ec-brand svg { color: #ef6d25; }

        .ec-influencer-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 16, 12, 0.5);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 24px;
        }

        .ec-influencer-modal {
          width: min(680px, 92vw);
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 30px 80px rgba(35, 24, 16, 0.35);
          padding: 24px;
          display: grid;
          gap: 16px;
          max-height: 85vh;
          overflow: auto;
          border: 1px solid #f2ddc8;
        }

        .ec-influencer-modal .modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .ec-influencer-modal .modal-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ec-influencer-modal .modal-title img {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          object-fit: cover;
        }

        .ec-influencer-modal .modal-title h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #1f1712;
        }

        .ec-influencer-modal .modal-title p {
          margin: 4px 0 0;
          font-weight: 600;
          color: #7b6656;
        }

        .ec-influencer-modal .modal-title .modal-email {
          margin: 6px 0 0;
          font-weight: 700;
          color: #2f7a48;
          font-size: 13px;
        }

        .ec-influencer-modal .modal-close {
          border: 1px solid #f2d9c0;
          background: #fff7ef;
          color: #8a5a35;
          border-radius: 999px;
          padding: 8px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .ec-influencer-modal .modal-meta {
          font-weight: 700;
          color: #6f5b4c;
        }

        .ec-influencer-modal .modal-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          background: #fffaf4;
          border: 1px solid #f2ddc8;
          border-radius: 16px;
          padding: 16px;
        }

        .ec-influencer-modal .modal-details div {
          display: grid;
          gap: 4px;
        }

        .ec-influencer-modal .modal-details strong {
          font-size: 12px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #9c7a5f;
        }

        .ec-influencer-modal .modal-details span {
          font-weight: 700;
          color: #2b221c;
          word-break: break-word;
        }

        .ec-influencer-modal .modal-bio {
          border: 1px dashed #f2ddc8;
          border-radius: 14px;
          padding: 12px 14px;
          background: #fffdf9;
        }

        .ec-influencer-modal .modal-bio strong {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #9c7a5f;
          margin-bottom: 6px;
        }

        .ec-influencer-modal .modal-bio p {
          margin: 0;
          color: #4b3a2f;
          line-height: 1.5;
        }

        .ec-influencer-modal .modal-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: flex-end;
        }

        .ec-influencer-modal .modal-open {
          border: 1px solid #f2d9c0;
          background: #fff;
          color: #ef6d25;
          border-radius: 999px;
          padding: 8px 16px;
          font-weight: 700;
          text-decoration: none;
        }

        .ec-group-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 16, 12, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 24px;
        }

        .ec-group-modal {
          width: min(520px, 92vw);
          background: #fff;
          border-radius: 18px;
          padding: 20px;
          display: grid;
          gap: 16px;
          box-shadow: 0 24px 70px rgba(35, 24, 16, 0.3);
          border: 1px solid #f2ddc8;
        }

        .ec-group-modal h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #1f1712;
        }

        .ec-group-modal p {
          margin: 6px 0 0;
          color: #7b6656;
          font-weight: 600;
        }

        .ec-group-list {
          display: grid;
          gap: 10px;
        }

        .ec-group-row {
          border: 1px solid #f2ddc8;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #fffaf4;
        }

        .ec-group-row strong {
          display: block;
          font-size: 14px;
          color: #2b221c;
        }

        .ec-group-row span {
          font-size: 12px;
          color: #7b6656;
          font-weight: 700;
        }

        .ec-group-row button {
          border: 0;
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          color: #fff;
          border-radius: 999px;
          padding: 8px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .ec-group-row .ec-group-hint {
          font-size: 12px;
          font-weight: 700;
          color: #9c7a5f;
        }

        .ec-group-create {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ec-group-create label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          color: #7b6656;
          flex: 1 1 220px;
        }

        .ec-group-create input {
          border: 1px solid #efddca;
          border-radius: 10px;
          padding: 10px;
          font-size: 13px;
          font-weight: 600;
        }

        .ec-group-create button {
          border: 0;
          border-radius: 10px;
          padding: 10px 16px;
          background: #1f1712;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        .ec-panel-actions {
          display: flex;
          gap: 10px;
        }

        .ec-panel-actions button {
          border: 1px solid #f2d9c0;
          background: #fff;
          border-radius: 999px;
          padding: 8px 14px;
          font-weight: 800;
          cursor: pointer;
          color: #7b5c40;
        }

        .ec-saved-card .actions .group-btn {
          border: 1px solid #f2d9c0;
          background: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-weight: 800;
          color: #7b5c40;
          cursor: pointer;
        }

        .ec-groups-grid {
          display: grid;
          gap: 16px;
        }

        .ec-group-card {
          border: 1px solid #efddca;
          border-radius: 16px;
          padding: 16px;
          background: #fffefb;
          display: grid;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .ec-group-card:hover {
          transform: translateY(-2px);
          border-color: #f2d3b6;
          box-shadow: 0 12px 28px rgba(197, 149, 106, 0.16);
        }

        .ec-group-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ec-group-head h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          color: #2b221c;
        }

        .ec-group-head span {
          font-size: 12px;
          font-weight: 700;
          color: #7b6656;
        }

        .ec-group-empty {
          margin: 0;
          color: #7b6656;
          font-weight: 600;
        }

        .ec-group-influencers {
          display: grid;
          gap: 10px;
        }

        .ec-group-influencers .ec-group-row {
          background: #fff;
        }

        .ec-group-influencers .ec-group-row a {
          border: 1px solid #f2d9c0;
          background: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-weight: 800;
          color: #dc5b21;
          text-decoration: none;
          font-size: 12px;
        }

        .ec-group-details {
          width: min(600px, 92vw);
          background: #fff;
          border-radius: 18px;
          padding: 20px;
          display: grid;
          gap: 16px;
          box-shadow: 0 24px 70px rgba(35, 24, 16, 0.3);
          border: 1px solid #f2ddc8;
          max-height: 80vh;
          overflow: auto;
          position: relative;
        }

        .ec-group-details .modal-close-absolute {
          position: absolute;
          top: 16px;
          right: 16px;
        }

        .ec-group-detail-list {
          display: grid;
          gap: 10px;
        }

        .ec-group-detail-row {
          border: 1px solid #f2ddc8;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #fffaf4;
        }

        .ec-group-detail-row strong {
          display: block;
          font-size: 14px;
          color: #2b221c;
        }

        .ec-group-detail-row span {
          font-size: 12px;
          color: #7b6656;
          font-weight: 700;
        }

        .ec-group-detail-actions {
          display: flex;
          gap: 8px;
        }

        .ec-group-detail-actions button,
        .ec-group-detail-actions a {
          border: 1px solid #f2d9c0;
          background: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-weight: 800;
          color: #dc5b21;
          text-decoration: none;
          font-size: 12px;
          cursor: pointer;
        }

        .ec-navlist {
          display: grid;
          gap: 8px;
        }

        .ec-nav-item {
          border: 1px solid transparent;
          border-radius: 11px;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          color: #655343;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
          justify-content: flex-start;
        }

        .ec-nav-item.active,
        .ec-nav-item:hover {
          border-color: #f2d9c0;
          background: #fff;
          color: #2b221c;
        }

        .ec-nav-group {
          display: grid;
          gap: 6px;
        }

        .ec-nav-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .ec-nav-chevron {
          margin-left: auto;
          transition: transform 0.2s ease;
        }

        .ec-nav-chevron.open {
          transform: rotate(180deg);
        }

        .ec-subnav {
          margin-left: 8px;
          padding-left: 8px;
          border-left: 1px dashed #f0ddca;
          display: grid;
          gap: 6px;
        }

        .ec-subnav button {
          border: 1px solid transparent;
          background: transparent;
          border-radius: 9px;
          padding: 8px 10px;
          font-size: 13px;
          font-weight: 700;
          color: #6f5b4c;
          cursor: pointer;
          text-align: left;
        }

        .ec-subnav button.active,
        .ec-subnav button:hover {
          border-color: #f2d9c0;
          background: #fff;
          color: #2b221c;
        }

        .ec-profile-card {
          border: 1px solid #f2ddc8;
          background: #fff;
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: auto;
        }

        .ec-profile-card:hover {
          border-color: #e8d0b8;
          background: #fffbf7;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(197, 149, 106, 0.15);
        }

        .ec-profile-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .ec-profile-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .ec-profile-info strong {
          font-size: 14px;
          font-weight: 800;
          color: #2b221d;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ec-profile-info span {
          font-size: 12px;
          font-weight: 700;
          color: #f47d21;
        }

        .ec-usage {
          background: #fff;
          border: 1px solid #f2ddc8;
          border-radius: 14px;
          padding: 14px;
          display: grid;
          gap: 8px;
        }

        .ec-usage p {
          font-size: 12px;
          color: #786353;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ec-usage strong { font-size: 17px; }

        .ec-usage .bar {
          width: 100%;
          height: 7px;
          background: #f7eade;
          border-radius: 999px;
          overflow: hidden;
        }

        .ec-usage .bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #f68a2d, #df5026);
        }

        .ec-usage small {
          color: #836d5f;
          font-size: 12px;
          font-weight: 700;
        }

        .ec-upgrade {
          border: 0;
          border-radius: 10px;
          padding: 10px;
          background: #f57a23;
          color: #fff;
          font-weight: 800;
          display: inline-flex;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        .ec-logout {
          border: 1px solid #f2daca;
          border-radius: 11px;
          background: #fff;
          color: #6d584b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .ec-main {
          padding: 28px;
          display: grid;
          gap: 18px;
        }

        .ec-topbar {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 1px solid #f2dfce;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 22px rgba(197, 149, 106, 0.12);
        }

        .ec-topbar-title-section {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
        }

        .ec-back-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid #f2deca;
          background: #fffbf7;
          color: #6d584b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .ec-back-btn:hover {
          background: #fff;
          border-color: #e8d0b8;
          color: #4f3f32;
          transform: translateX(-2px);
        }

        .ec-topbar h1 {
          font-size: clamp(24px, 3vw, 34px);
          margin-bottom: 3px;
          letter-spacing: -0.02em;
        }

        .ec-topbar p { color: #7b6556; }

        .ec-topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ec-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid #f2deca;
          background: #fff;
          color: #715a4b;
          cursor: pointer;
        }

        .ec-primary {
          border: 0;
          border-radius: 12px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #f47d20, #df4f24);
          color: #fff;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .ec-notice-popover {
          position: absolute;
          right: 18px;
          top: calc(100% + 8px);
          border: 1px solid #f0dcc8;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
          width: 280px;
          box-shadow: 0 16px 24px rgba(173, 128, 90, 0.18);
          z-index: 20;
        }

        .ec-notice-popover strong {
          display: block;
          color: #2f241c;
          margin-bottom: 4px;
        }

        .ec-notice-popover p {
          color: #7a6555;
          font-size: 13px;
          line-height: 1.4;
        }

        .ec-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .ec-metric-card {
          background: #fff;
          border: 1px solid #f2ddca;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          color: #e86c24;
        }

        .ec-metric-card p {
          color: #816a59;
          font-size: 13px;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .ec-metric-card strong {
          color: #2f241c;
          font-size: 28px;
          letter-spacing: -0.02em;
          display: block;
        }

        .ec-metric-card small {
          color: #846f60;
          font-size: 12px;
          font-weight: 700;
        }

        .ec-layout-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 12px;
        }


        .ec-directory {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 12px;
        }

        .ec-dir-filters {
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          display: grid;
          gap: 12px;
          align-content: start;
        }

        .ec-dir-head h2 {
          margin: 0;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .ec-dir-head p {
          margin: 6px 0 0;
          color: #735f51;
          font-weight: 600;
          font-size: 13px;
          line-height: 1.5;
        }

        .ec-dir-filters label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          color: #4f3f32;
        }

        .ec-dir-filters input,
        .ec-dir-filters textarea,
        .ec-dir-filters select {
          width: 100%;
          border: 1px solid #e6d7c8;
          border-radius: 10px;
          padding: 9px 10px;
          font-size: 13px;
          font-family: inherit;
          color: #2b221d;
          background: #fffefb;
        }

        .ec-dir-filters textarea {
          min-height: 92px;
          resize: vertical;
        }

        .ec-dir-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .ec-dir-actions {
          display: flex;
          gap: 8px;
        }

        .ec-dir-actions button {
          flex: 1;
          border-radius: 12px;
          padding: 10px;
          font-weight: 900;
          cursor: pointer;
          border: 0;
        }

        .ec-dir-actions .ghost {
          background: #fff;
          border: 1px solid #efddca;
          color: #634f41;
        }

        .ec-dir-actions .primary {
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          color: #fff;
        }

        .ec-dir-results {
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          min-height: 420px;
        }

        .ec-dir-results-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .ec-dir-results-head h3 {
          margin: 0;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .ec-results-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ec-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f2e0d0;
        }

        .ec-page-btn {
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #634f41;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .ec-page-btn:hover:not(:disabled) {
          background: #fffbf7;
          border-color: #e8d0b8;
          color: #4f3f32;
        }

        .ec-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ec-page-numbers {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ec-page-num {
          min-width: 36px;
          height: 36px;
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #634f41;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .ec-page-num:hover {
          background: #fffbf7;
          border-color: #e8d0b8;
        }

        .ec-page-num.active {
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          border-color: #f47d21;
          color: #fff;
        }

        .ec-page-ellipsis {
          padding: 0 8px;
          color: #816c5c;
          font-weight: 700;
        }

        .ec-dir-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .ec-dir-card {
          border: 1px solid #efddca;
          border-radius: 16px;
          padding: 12px;
          background: #fffefb;
          display: grid;
          gap: 8px;
          cursor: pointer;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .ec-dir-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(197, 149, 106, 0.18);
          border-color: #f2d3b6;
        }

        .ec-dir-card:active {
          transform: translateY(0);
        }

        .ec-dir-card .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .ec-dir-card h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          color: #2b221d;
        }

        .ec-dir-card .head p {
          margin: 2px 0 0;
          color: #816c5c;
          font-weight: 700;
          font-size: 13px;
        }

        .ec-dir-card img {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid #efddca;
          background: #fff;
        }

        .ec-dir-card .meta {
          color: #6f594a;
          font-weight: 700;
          font-size: 12px;
        }

        .ec-card-hint {
          font-size: 11px;
          font-weight: 800;
          color: #d4692c;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .ec-dir-card:hover .ec-card-hint {
          opacity: 1;
        }

        .ec-dir-card .bio {
          margin: 0;
          color: #735f51;
          font-size: 13px;
          line-height: 1.55;
          font-weight: 600;
        }

        .ec-dir-card .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .ec-dir-card .actions button,
        .ec-dir-card .actions a {
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-weight: 900;
          color: #dc5b21;
          text-decoration: none;
          font-size: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .ec-dir-card .actions button:hover,
        .ec-dir-card .actions a:hover {
          background: #fffbf7;
          border-color: #e8d0b8;
        }

        .ec-dir-card .actions .save-btn {
          color: #6f594a;
        }

        .ec-dir-card .actions .save-btn.saved {
          background: linear-gradient(135deg, #fff8ef, #fff2e4);
          border-color: #f2deca;
          color: #f47d21;
        }

        .ec-dir-card .actions .save-btn.saved:hover {
          background: linear-gradient(135deg, #fff5eb, #ffeed9);
        }
          border-radius: 999px;
          padding: 6px 10px;
          font-weight: 900;
          color: #dc5b21;
          text-decoration: none;
          font-size: 12px;
        }

        .ec-platforms {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          max-width: 1200px;
        }

        .ec-platform-card {
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          display: grid;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(197, 149, 106, 0.08);
          position: relative;
          overflow: hidden;
        }

        .ec-platform-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f47d21, #dc4f24);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .ec-platform-card:hover {
          border-color: #e8d0b8;
          box-shadow: 0 12px 32px rgba(197, 149, 106, 0.2);
          transform: translateY(-4px);
        }

        .ec-platform-card:hover::before {
          opacity: 1;
        }

        .ec-platform-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ec-platform-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .ec-platform-title {
          flex: 1;
        }

        .ec-platform-title h3 {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 900;
          color: #2b221d;
          letter-spacing: -0.03em;
        }

        .ec-platform-stats {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #8a7566;
          background: #f7f3ee;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .ec-platform-description {
          margin: 0;
          color: #735f51;
          font-weight: 600;
          font-size: 14px;
          line-height: 1.6;
          min-height: 44px;
        }

        .ec-platform-actions {
          display: grid;
          gap: 10px;
          margin-top: 4px;
        }

        .ec-platform-actions button {
          width: 100%;
          border-radius: 12px;
          padding: 13px 16px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          border: 0;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .ec-platform-actions .ghost {
          background: #fffbf7;
          border: 1px solid #efddca;
          color: #634f41;
        }

        .ec-platform-actions .ghost:hover {
          background: #fff;
          border-color: #e8d0b8;
          color: #4f3f32;
        }

        .ec-platform-actions .primary {
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          color: #fff;
          box-shadow: 0 4px 12px rgba(244, 125, 33, 0.25);
        }

        .ec-platform-actions .primary:hover {
          background: linear-gradient(135deg, #f68a2d, #e35828);
          box-shadow: 0 6px 16px rgba(244, 125, 33, 0.35);
          transform: translateY(-1px);
        }

        .ec-layout-grid-analytics {
          grid-template-columns: 1fr 1fr;
        }

        .ec-panel {
          background: #fff;
          border: 1px solid #f2dec9;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 22px rgba(204, 162, 124, 0.12);
        }

        .ec-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .ec-panel-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .ec-panel-head h2 {
          font-size: 20px;
        }

        .ec-panel-head button {
          border: 1px solid #f2dbc1;
          border-radius: 10px;
          background: #fff7ef;
          color: #cf6022;
          padding: 8px 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .ec-inline-error {
          margin-bottom: 10px;
          border: 1px solid #efc9c9;
          background: #fff3f3;
          color: #a54343;
          border-radius: 10px;
          padding: 9px 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .ec-empty-state {
          min-height: 220px;
          border: 1px dashed #eed9c4;
          border-radius: 12px;
          display: grid;
          place-content: center;
          text-align: center;
          gap: 8px;
          color: #7e6959;
          padding: 16px;
        }

        .ec-empty-state h3 {
          color: #32271f;
          font-size: 20px;
        }

        .ec-handle-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ec-handle-chip {
          border: 1px solid #efddca;
          background: #fff8ef;
          color: #6f594a;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 999px;
        }

        .ec-saved-influencers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
        }

        .ec-saved-card {
          border: 1px solid #efddca;
          border-radius: 16px;
          padding: 14px;
          background: #fffefb;
          display: grid;
          gap: 10px;
          transition: all 0.2s ease;
        }

        .ec-saved-card:hover {
          border-color: #e8d0b8;
          box-shadow: 0 4px 12px rgba(197, 149, 106, 0.12);
        }

        .ec-saved-card .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .ec-saved-card h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          color: #2b221d;
        }

        .ec-saved-card .head p {
          margin: 2px 0 0;
          color: #816c5c;
          font-weight: 700;
          font-size: 13px;
        }

        .ec-saved-card img {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid #efddca;
          background: #fff;
        }

        .ec-saved-card .meta {
          color: #6f594a;
          font-weight: 700;
          font-size: 12px;
        }

        .ec-saved-card .bio {
          margin: 0;
          color: #735f51;
          font-size: 13px;
          line-height: 1.6;
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ec-saved-card .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .ec-saved-card .actions button,
        .ec-saved-card .actions a {
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-weight: 900;
          text-decoration: none;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ec-saved-card .actions .remove-btn {
          color: #c74a3a;
        }

        .ec-saved-card .actions .remove-btn:hover {
          background: #fff3f3;
          border-color: #efc9c9;
        }

        .ec-saved-card .actions a {
          color: #dc5b21;
        }

        .ec-saved-card .actions a:hover {
          background: #fffbf7;
          border-color: #e8d0b8;
        }

        .ec-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .ec-kpi-grid div {
          border: 1px solid #efdbc7;
          border-radius: 12px;
          padding: 12px;
          background: #fffdf9;
        }

        .ec-kpi-grid span {
          font-size: 12px;
          color: #816c5c;
          display: block;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .ec-kpi-grid strong {
          font-size: 28px;
          color: #2b2119;
          letter-spacing: -0.02em;
        }

        .ec-list-rows {
          display: grid;
          gap: 8px;
        }

        .ec-inbox-list {
          display: grid;
          gap: 8px;
        }

        .ec-inbox-row {
          border: 1px solid #efddca;
          border-radius: 12px;
          background: #fff;
          padding: 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .ec-inbox-row strong {
          font-size: 14px;
          color: #32271f;
        }

        .ec-inbox-row p {
          color: #735f51;
          font-size: 13px;
          margin: 2px 0;
        }

        .ec-inbox-row small {
          color: #8a7464;
          font-size: 11px;
          font-weight: 600;
        }

        .ec-status-chip {
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          border: 1px solid #ead8c6;
          color: #715d4f;
          background: #fff;
          white-space: nowrap;
        }

        .ec-status-chip.sent,
        .ec-status-chip.delivered,
        .ec-status-chip.opened,
        .ec-status-chip.clicked {
          border-color: #bfe7ce;
          color: #1f7a40;
          background: #ecfaf1;
        }

        .ec-status-chip.replied {
          border-color: #bcd9ff;
          color: #1f5fa8;
          background: #edf4ff;
        }

        .ec-status-chip.failed,
        .ec-status-chip.bounced,
        .ec-status-chip.deferred {
          border-color: #f2c7c7;
          color: #a53e3e;
          background: #fff3f3;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .ec-list-row {
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 12px;
          padding: 11px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-weight: 700;
          color: #3b2d24;
        }

        .ec-campaign-row {
          text-align: left;
        }

        .ec-campaign-row-main {
          display: grid;
          gap: 2px;
        }

        .ec-campaign-row-main span {
          font-weight: 800;
        }

        .ec-campaign-row-main small {
          color: #897263;
          font-weight: 600;
          font-size: 12px;
        }

        .ec-list-row small {
          color: #897263;
          font-weight: 600;
        }

        @media (max-width: 1120px) {
          .ec-dash {
            grid-template-columns: 1fr;
          }

          .ec-sidebar {
            border-right: 0;
            border-bottom: 1px solid #f0ddca;
          }

          .ec-navlist {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ec-metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ec-layout-grid {
            grid-template-columns: 1fr;
          }

          .ec-directory {
            grid-template-columns: 1fr;
          }

          .ec-platforms {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ec-kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .ec-main {
            padding: 14px;
          }

          .ec-topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .ec-metrics-grid,
          .ec-navlist {
            grid-template-columns: 1fr;
          }

          .ec-dir-grid {
            grid-template-columns: 1fr;
          }

          .ec-platforms {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
