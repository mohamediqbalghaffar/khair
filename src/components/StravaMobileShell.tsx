import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp, NavTab } from '../context/AppContext';
import { useFeedback } from './ui/FeedbackProvider';
import { computeVulnerabilityScore } from '../utils/vulnerabilityScore';
import { getExchangeRateForDate, calcItemAmountInUSD, calcItemAmountInIQD } from '../utils/exchangeRates';
import { useModalFocusTrap } from '../utils/useModalFocusTrap';
import {
  Activity,
  Award,
  Bell,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Crown,
  Flame,
  FolderKanban,
  Gift,
  Globe,
  Heart,
  HeartHandshake,
  History,
  Home,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  PackageSearch,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings,
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Square,
  ThumbsUp,
  TrendingUp,
  Trophy,
  Truck,
  UserCheck,
  Users,
  Wallet,
  X,
  Zap,
  Files
} from 'lucide-react';

export type StravaTab = 'home' | 'maps' | 'record' | 'groups' | 'you';

interface StravaMobileShellProps {
  renderClassicView: () => React.ReactNode;
  onExitStravaMode?: () => void;
  isDesktopPreview?: boolean;
}

interface FeedActivityItem {
  id: string;
  type: 'distribution' | 'donation' | 'project' | 'urgent_case';
  actorName: string;
  actorRole: string;
  actorBadge: string;
  governorate: string;
  date: string;
  title: string;
  description: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  tertiaryMetricLabel: string;
  tertiaryMetricValue: string;
  quaternaryMetricLabel: string;
  quaternaryMetricValue: string;
  routePoints: { x: number; y: number; elev: number; km: number }[];
  achievements: string[];
  initialKudos: number;
  entityTab: NavTab;
  beneficiaryId?: string;
}

const GOVERNORATE_COORDS: Record<string, { lat: number; lng: number; x: number; y: number; elevBase: number }> = {
  'هەولێر': { lat: 36.1901, lng: 44.0091, x: 48, y: 42, elevBase: 415 },
  'سلێمانی': { lat: 35.5650, lng: 45.4329, x: 76, y: 62, elevBase: 882 },
  'دهۆک': { lat: 36.8671, lng: 42.9884, x: 26, y: 20, elevBase: 565 },
  'هەڵەبجە': { lat: 35.1778, lng: 45.9861, x: 86, y: 74, elevBase: 720 },
  'کەرکووک': { lat: 35.4681, lng: 44.3922, x: 52, y: 72, elevBase: 350 },
  'گەرمیان': { lat: 34.6281, lng: 45.3222, x: 70, y: 86, elevBase: 260 },
  'زاخۆ': { lat: 37.1436, lng: 42.6819, x: 18, y: 12, elevBase: 440 },
};

function buildDeterministicRoute(seedStr: string, govName: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 100000;
  }
  const base = GOVERNORATE_COORDS[govName] || GOVERNORATE_COORDS['هەولێر'];
  const points: { x: number; y: number; elev: number; km: number }[] = [];
  const totalPoints = 14;
  let curX = 14;
  let curY = 76 - (hash % 24);
  let totalKm = 0;

  for (let i = 0; i < totalPoints; i++) {
    const progress = i / (totalPoints - 1);
    const wave = Math.sin(progress * Math.PI * 2 + (hash % 7)) * 14;
    const jitter = ((hash >> (i % 8)) & 7) - 3.5;
    curX = Math.max(8, Math.min(92, 12 + progress * 76 + jitter));
    curY = Math.max(14, Math.min(86, 52 - wave + jitter * 1.4));
    const elev = Math.round(base.elevBase + Math.sin(progress * Math.PI * 1.8 + (hash % 5)) * 120 + (i % 3) * 18);
    totalKm = Number((progress * (4.2 + (hash % 90) / 10)).toFixed(1));
    points.push({ x: curX, y: curY, elev, km: totalKm });
  }
  return points;
}

export const StravaMobileShell: React.FC<StravaMobileShellProps> = ({
  renderClassicView,
  onExitStravaMode,
  isDesktopPreview = false,
}) => {
  const {
    activeTab,
    setActiveTab,
    beneficiaries,
    donors,
    donations,
    projects,
    inventory,
    transactions,
    volunteers,
    notifications,
    markNotificationRead,
    currencyView,
    setCurrencyView,
    setIsSpotlightOpen,
    openBeneficiaryProfile,
    distributeAidFromInventory,
    addDonation,
    logVolunteerHours,
    addAnnouncement,
    currentUser,
  } = useApp();

  const { showToast } = useFeedback();

  // Primary Strava 5-tab state
  const [stravaTab, setStravaTab] = useState<StravaTab>('home');
  // When user taps one of the full system modules (e.g. Beneficiaries table, Inventory, Settings),
  // we render it seamlessly inside the Strava Mobile Chrome with a 1-tap "Back to Strava Feed" bar.
  const [isFullModuleOpen, setIsFullModuleOpen] = useState(false);

  // Feed filters & social interactions
  const [feedFilter, setFeedFilter] = useState<'all' | 'distribution' | 'donation' | 'project' | 'urgent_case'>('all');
  const [kudosMap, setKudosMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ngo_strava_kudos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [commentsMap, setCommentsMap] = useState<Record<string, { author: string; text: string; time: string }[]>>(() => {
    try {
      const saved = localStorage.getItem('ngo_strava_comments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [activeCommentCardId, setActiveCommentCardId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [scrubIndexMap, setScrubIndexMap] = useState<Record<string, number>>({});

  // Maps sub-tab state
  const [mapsSubTab, setMapsSubTab] = useState<'explore' | 'segments' | 'routes'>('explore');
  const [selectedSegmentGov, setSelectedSegmentGov] = useState<string | null>(null);
  const [showEmbeddedLeafletMap, setShowEmbeddedLeafletMap] = useState(false);

  // Groups sub-tab state
  const [groupsSubTab, setGroupsSubTab] = useState<'challenges' | 'clubs' | 'leaderboards'>('challenges');

  // You (Profile) sub-tab state
  const [youSubTab, setYouSubTab] = useState<'progress' | 'modules'>('progress');
  const [progressMetric, setProgressMetric] = useState<'donations' | 'beneficiaries' | 'hours'>('donations');

  // Record HUD state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedKm, setRecordedKm] = useState(0);
  const [recordedCheckpoints, setRecordedCheckpoints] = useState(0);
  const [missionType, setMissionType] = useState<'دابەشکردنی مەیدانی' | 'سەردانی ماڵان' | 'گواستنەوەی کۆگا'>('دابەشکردنی مەیدانی');
  const [selectedRouteTitle, setSelectedRouteTitle] = useState<string>('ڕێڕەوی مەیدانی هەولێر — ناوەند');
  const [hudWaypoints, setHudWaypoints] = useState<{ x: number; y: number; label: string }[]>([
    { x: 18, y: 72, label: 'بنکەی سەرەکی' },
    { x: 35, y: 54, label: 'خاڵی ١' },
  ]);

  // Quick Field Action Modal inside Record or Header (+)
  const [quickActionModal, setQuickActionModal] = useState<'none' | 'distribute' | 'donation' | 'notifications'>('none');
  const [quickDistItemId, setQuickDistItemId] = useState('');
  const [quickDistBenId, setQuickDistBenId] = useState('');
  const [quickDistQty, setQuickDistQty] = useState(1);
  const [quickDonDonorName, setQuickDonDonorName] = useState('');
  const [quickDonAmount, setQuickDonAmount] = useState('');

  const modalTrapRef = useModalFocusTrap(quickActionModal !== 'none' || selectedSegmentGov !== null, () => {
    setQuickActionModal('none');
    setSelectedSegmentGov(null);
  });

  // Persist kudos & comments
  useEffect(() => {
    try {
      localStorage.setItem('ngo_strava_kudos', JSON.stringify(kudosMap));
    } catch {
      // ignore storage quota errors
    }
  }, [kudosMap]);

  useEffect(() => {
    try {
      localStorage.setItem('ngo_strava_comments', JSON.stringify(commentsMap));
    } catch {
      // ignore
    }
  }, [commentsMap]);

  // Live stopwatch for Record HUD
  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      setRecordedKm(prev => Number((prev + 0.015).toFixed(2)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const rem = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const todayRate = useMemo(() => {
    try {
      return getExchangeRateForDate().rate || 1530;
    } catch {
      return 1530;
    }
  }, []);

  const formatMoney = (amountIQD: number, amountUSD?: number) => {
    if (currencyView === 'USD') {
      const usd = amountUSD !== undefined ? amountUSD : Math.round(amountIQD / todayRate);
      return `$${usd.toLocaleString()}`;
    }
    return `${Math.round(amountIQD).toLocaleString()} د.ع`;
  };

  // Build authentic Strava Activity Feed from live AppContext data
  const feedActivities = useMemo<FeedActivityItem[]>(() => {
    const items: FeedActivityItem[] = [];

    // 1. Aid Distributions & Urgent Beneficiary Dossiers
    beneficiaries.slice(0, 12).forEach((ben, idx) => {
      const vuln = computeVulnerabilityScore(ben);
      const latestAid = ben.aidHistory && ben.aidHistory.length > 0 ? ben.aidHistory[0] : null;
      const isUrgent = vuln.score >= 85 || ben.status === 'urgent';

      if (latestAid) {
        const aidVal =
          latestAid.type === 'monetary'
            ? latestAid.currency === 'USD'
              ? `$${(latestAid.amount || 0).toLocaleString()}`
              : `${(latestAid.amountIQD || latestAid.amount || 0).toLocaleString()} د.ع`
            : `${latestAid.quantity || 1} ${latestAid.unit || 'دانە'}`;

        items.push({
          id: `dist-${ben.id}-${latestAid.id}`,
          type: 'distribution',
          actorName: latestAid.distributedBy || 'تیمی مەیدانی بۆتان',
          actorRole: 'ئەفسەری مەیدانی • دابەشکردن',
          actorBadge: '🚚 مەیدانی',
          governorate: ben.governorate,
          date: latestAid.date || ben.registeredDate,
          title: `${latestAid.projectTitle || 'گەیاندنی هاوکاری مەیدانی'} — ${ben.fullName}`,
          description:
            latestAid.notes ||
            `دابەشکردنی هاوکاری بۆ خێزانی (${ben.fullName}) لە سنووری ${ben.governorate} (${ben.address}). خێزانەکە لە ${ben.familyMembers} ئەندام پێکهاتووە.`,
          primaryMetricLabel: 'بڕی هاوکاری',
          primaryMetricValue: aidVal,
          secondaryMetricLabel: 'ئەندامانی خێزان',
          secondaryMetricValue: `${ben.familyMembers} کەس`,
          tertiaryMetricLabel: 'خاڵی پێویستی',
          tertiaryMetricValue: `${vuln.score}/100`,
          quaternaryMetricLabel: 'پسوولە / کۆد',
          quaternaryMetricValue: latestAid.receiptNumber || `#B-${100 + idx}`,
          routePoints: buildDeterministicRoute(ben.id + latestAid.id, ben.governorate),
          achievements:
            vuln.score >= 85
              ? ['فریاکەوتنی بەپەلە', 'گەیاندنی خێرا (PR)']
              : ['پشتڕاستکراو لە مەیدان'],
          initialKudos: 12 + (idx * 7) % 29,
          entityTab: 'beneficiaries',
          beneficiaryId: ben.id,
        });
      } else if (isUrgent || idx < 5) {
        items.push({
          id: `urgent-${ben.id}`,
          type: 'urgent_case',
          actorName: 'لیژنەی پشکنینی مەیدانی',
          actorRole: `پشکنینی دۆسیە • ${ben.governorate}`,
          actorBadge: '🚨 فریاگوزاری',
          governorate: ben.governorate,
          date: ben.registeredDate,
          title: `تۆماری مەیدانی و هەڵسەنگاندن — ${ben.fullName}`,
          description:
            ben.notes ||
            `سەردانی مەیدانی بۆ دۆسیەی (${ben.fullName}) لە ${ben.address}. داهاتی مانگانە: ${ben.monthlyIncomeIQD.toLocaleString()} د.ع.`,
          primaryMetricLabel: 'پێوەر (Score)',
          primaryMetricValue: `${vuln.score}/100`,
          secondaryMetricLabel: 'ئەندامان',
          secondaryMetricValue: `${ben.familyMembers} کەس`,
          tertiaryMetricLabel: 'داهاتی مانگانە',
          tertiaryMetricValue: `${Math.round(ben.monthlyIncomeIQD / 1000)}k د.ع`,
          quaternaryMetricLabel: 'بارودۆخ',
          quaternaryMetricValue: vuln.label,
          routePoints: buildDeterministicRoute(ben.id, ben.governorate),
          achievements: vuln.score >= 90 ? ['پێشینەی پلە یەک (KOM)', 'دۆسیەی هەستیار'] : ['پشکنینی مەیدانی'],
          initialKudos: 8 + (idx * 5) % 19,
          entityTab: 'beneficiaries',
          beneficiaryId: ben.id,
        });
      }
    });

    // 2. Donations
    donations.slice(0, 8).forEach((don, idx) => {
      const iqdVal = calcItemAmountInIQD(don);
      const usdVal = calcItemAmountInUSD(don);
      const donorObj = donors.find(d => d.id === don.donorId);
      const gov = donorObj?.governorate || 'هەولێر';

      items.push({
        id: `don-${don.id}`,
        type: 'donation',
        actorName: don.donorName || 'بەخشەری خێرخواز',
        actorRole: `بەخشەری فەرمی • ${don.method}`,
        actorBadge: iqdVal >= 5000000 ? '💎 ئەڵماس' : '🥇 بەخشەر',
        governorate: gov,
        date: don.date,
        title: `${don.categoryLabel || 'بەخشینی مرۆیی'} — ${don.projectName || 'سندوقی گشتی هاوکاری'}`,
        description:
          don.notes ||
          `بەخشینی پەسەندکراو بە ژمارەی پسوولەی فەرمی ${don.receiptNumber} لە ڕێگەی (${don.method}).`,
        primaryMetricLabel: 'بڕی بەخشین',
        primaryMetricValue: formatMoney(iqdVal, usdVal),
        secondaryMetricLabel: 'ژمارەی پسوولە',
        secondaryMetricValue: don.receiptNumber,
        tertiaryMetricLabel: 'شێوازی پارەدان',
        tertiaryMetricValue: don.method,
        quaternaryMetricLabel: 'نرخی بۆرسە',
        quaternaryMetricValue: `${don.exchangeRateAtDate || todayRate}`,
        routePoints: buildDeterministicRoute(don.id, gov),
        achievements: iqdVal >= 2000000 ? ['بەرزترین بەخشینی هەفتە 🏆', 'پشتگیریکاری سەرەکی'] : ['پسوولەی فەرمی پەسەندکراو'],
        initialKudos: 18 + (idx * 9) % 42,
        entityTab: 'donors',
      });
    });

    // 3. Active Projects
    projects.slice(0, 5).forEach((proj, idx) => {
      const pct = Math.min(100, Math.round((proj.raisedBudgetUSD / Math.max(1, proj.targetBudgetUSD)) * 100));
      const gov = proj.governorates[0] || 'هەولێر';
      items.push({
        id: `proj-${proj.id}`,
        type: 'project',
        actorName: 'بەڕێوەبەرایەتی پڕۆژەکان • بۆتان',
        actorRole: `کەمپەینی مرۆیی • ${proj.category}`,
        actorBadge: '🏕️ پڕۆژە',
        governorate: gov,
        date: proj.startDate,
        title: proj.title,
        description: proj.description,
        primaryMetricLabel: 'ڕێژەی تەواوبوون',
        primaryMetricValue: `${pct}%`,
        secondaryMetricLabel: 'سوودمەندان',
        secondaryMetricValue: `${proj.beneficiariesCount.toLocaleString()}`,
        tertiaryMetricLabel: 'بودجەی کۆکراوە',
        tertiaryMetricValue: `$${proj.raisedBudgetUSD.toLocaleString()}`,
        quaternaryMetricLabel: 'خۆبەخشان',
        quaternaryMetricValue: `${proj.volunteersCount} کەس`,
        routePoints: buildDeterministicRoute(proj.id, gov),
        achievements: pct >= 75 ? ['نزیک لە ئامانجی کۆتایی 🔥', `${proj.governorates.length} پارێزگا`] : ['کەمپەینی چالاک'],
        initialKudos: 24 + (idx * 11) % 50,
        entityTab: 'projects',
      });
    });

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [beneficiaries, donations, donors, projects, currencyView, todayRate]);

  const filteredFeed = useMemo(() => {
    if (feedFilter === 'all') return feedActivities;
    return feedActivities.filter(item => item.type === feedFilter);
  }, [feedActivities, feedFilter]);

  // Governorate Segments Data (All 7 Kurdistan Governorates)
  const governorateSegments = useMemo(() => {
    const govNames = ['هەولێر', 'سلێمانی', 'دهۆک', 'هەڵەبجە', 'کەرکووک', 'گەرمیان', 'زاخۆ'];
    return govNames.map((gov, idx) => {
      const govBens = beneficiaries.filter(b => b.governorate === gov);
      const urgentCount = govBens.filter(b => computeVulnerabilityScore(b).score >= 85 || b.status === 'urgent').length;
      const aidedCount = govBens.filter(b => b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0)).length;
      const govVols = volunteers.filter(v => v.governorate === gov);
      const topVol = govVols.sort((a, b) => b.hoursLogged - a.hoursLogged)[0];
      const govDonors = donors.filter(d => d.governorate === gov);
      const topDonor = govDonors.sort((a, b) => b.totalDonationsIQD - a.totalDonationsIQD)[0];

      return {
        gov,
        segmentTitle: `سێگمێنتی مەیدانی ${gov} — زۆنی A${idx + 1}`,
        totalFamilies: govBens.length,
        urgentCount,
        aidedCount,
        volunteersCount: govVols.length,
        komLeader: topDonor?.fullName || topVol?.fullName || 'تیمی مەیدانی بۆتان',
        distanceKm: Number((12.4 + idx * 3.7).toFixed(1)),
        elevationGain: 180 + idx * 65,
        routePoints: buildDeterministicRoute(`seg-${gov}`, gov),
        coords: GOVERNORATE_COORDS[gov] || GOVERNORATE_COORDS['هەولێر'],
      };
    });
  }, [beneficiaries, volunteers, donors]);

  // Weekly Summary Metrics for Strava Home Snapshot
  const weeklySummary = useMemo(() => {
    const totalDonationsIQD = donations.reduce(
      (acc, d) => acc + calcItemAmountInIQD(d),
      0
    );
    const totalDonationsUSD = donations.reduce(
      (acc, d) => acc + calcItemAmountInUSD(d),
      0
    );
    const totalHours = volunteers.reduce((acc, v) => acc + (v.hoursLogged || 0), 0);
    const aidedFamilies = beneficiaries.filter(b => b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0)).length;

    return {
      totalDonationsIQD,
      totalDonationsUSD,
      totalHours,
      aidedFamilies,
      totalFamilies: beneficiaries.length,
    };
  }, [donations, volunteers, beneficiaries]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleKudos = (id: string) => {
    setKudosMap(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) {
        showToast('دەستخۆشی (Kudos) تۆمارکرا! 👍', 'success');
      }
      return next;
    });
  };

  const handleAddComment = (cardId: string) => {
    if (!commentInput.trim()) return;
    const newComment = {
      author: currentUser?.name || 'ئەندامی ستاف',
      text: commentInput.trim(),
      time: 'ئێستا',
    };
    setCommentsMap(prev => ({
      ...prev,
      [cardId]: [...(prev[cardId] || []), newComment],
    }));
    setCommentInput('');
    showToast('سەرنجەکەت بە سەرکەوتوویی بڵاوکرایەوە', 'success');
  };

  const handleFinishRecording = () => {
    if (elapsedSeconds < 2 && recordedCheckpoints === 0) {
      showToast('سەرەتا چالاکییەکە دەستپێبکە بۆ تۆمارکردنی مەیدانی', 'warning');
      return;
    }
    const hoursToAdd = Math.max(1, Math.round(elapsedSeconds / 1800) || 1);
    if (volunteers.length > 0) {
      logVolunteerHours(volunteers[0].id, hoursToAdd);
    }
    addAnnouncement(
      `${missionType} — ${selectedRouteTitle}`,
      `چالاکی مەیدانی بە دووری ${recordedKm.toFixed(2)} کم و کاتی ${formatDuration(elapsedSeconds)} بە سەرکەوتوویی تەواوکرا (${recordedCheckpoints} خاڵی سەردان).`,
      'مەیدانی'
    );
    setIsRecording(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setRecordedKm(0);
    setRecordedCheckpoints(0);
    setStravaTab('home');
    showToast('چالاکییە مەیدانییەکە لە فیدی ستراڤا پاشەکەوت و بڵاوکرایەوە! 🏆', 'success');
  };

  const handleQuickDistributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDistItemId || !quickDistBenId || quickDistQty <= 0) {
      showToast('تکایە کاڵا و سوودمەند و بڕەکە دیاری بکە', 'warning');
      return;
    }
    const ok = distributeAidFromInventory(quickDistItemId, quickDistBenId, quickDistQty, selectedRouteTitle);
    if (ok) {
      setRecordedCheckpoints(prev => prev + 1);
      setQuickActionModal('none');
      showToast('دابەشکردنی مەیدانی تۆمارکرا و لە کۆگا کەمکرایەوە! ✅', 'success');
    } else {
      showToast('بڕی کاڵا لە کۆگا بەش ناکات', 'error');
    }
  };

  const handleQuickDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(quickDonAmount);
    if (!quickDonDonorName.trim() || !numAmount || numAmount <= 0) {
      showToast('تکایە ناوی بەخشەر و بڕی بەخشین بنووسە', 'warning');
      return;
    }
    addDonation({
      donorId: donors[0]?.id || 'd-quick',
      donorName: quickDonDonorName.trim(),
      category: 'cash',
      categoryLabel: 'بەخشینی نەختینەیی مەیدانی',
      amount: numAmount,
      currency: currencyView,
      exchangeRateAtDate: todayRate,
      method: 'کاش',
      date: new Date().toISOString().slice(0, 10),
      projectName: selectedRouteTitle,
      notes: 'تۆمارکراو لە ڕێگەی مۆبایل (Strava Field HUD)',
    });
    setRecordedCheckpoints(prev => prev + 1);
    setQuickDonDonorName('');
    setQuickDonAmount('');
    setQuickActionModal('none');
    showToast('بەخشینەکە بە سەرکەوتوویی تۆمارکرا و پسوولە دروستکرا! 💎', 'success');
  };

  const SYSTEM_MODULES: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'beneficiaries', label: 'سوودمەندان', icon: Users, count: beneficiaries.length },
    { id: 'donors', label: 'بەخشەران', icon: HeartHandshake, count: donors.length },
    { id: 'inventory', label: 'کۆگا', icon: PackageSearch, count: inventory.length },
    { id: 'finance', label: 'دارایی', icon: Wallet, count: transactions.length },
    { id: 'projects', label: 'پڕۆژەکان', icon: FolderKanban, count: projects.length },
    { id: 'geo', label: 'نەخشەی GIS', icon: MapPin },
    { id: 'volunteers', label: 'خۆبەخشان', icon: UserCheck, count: volunteers.length },
    { id: 'documents', label: 'بەڵگەنامە', icon: Files },
    { id: 'audit', label: 'چاودێری', icon: History },
    { id: 'settings', label: 'ڕێکخستن', icon: Settings },
    { id: 'dashboard', label: 'داشبۆرد', icon: LayoutDashboard },
  ];

  const openSystemModule = (tab: NavTab) => {
    setActiveTab(tab);
    setIsFullModuleOpen(true);
  };

  // Render an interactive Mapbox-style SVG Route + Scrubbable Elevation Profile for any Feed Card
  const renderStravaRouteVisualizer = (item: FeedActivityItem) => {
    const pts = item.routePoints;
    const activeIdx = scrubIndexMap[item.id] ?? (pts.length - 1);
    const activePt = pts[Math.max(0, Math.min(pts.length - 1, activeIdx))] || pts[0];

    const polyPoints = pts.map(p => `${p.x},${p.y}`).join(' ');
    const elevMax = Math.max(...pts.map(p => p.elev), 500);
    const elevMin = Math.min(...pts.map(p => p.elev), 200);
    const elevRange = Math.max(50, elevMax - elevMin);

    const elevLinePts = pts
      .map((p, i) => {
        const x = (i / Math.max(1, pts.length - 1)) * 100;
        const y = 36 - ((p.elev - elevMin) / elevRange) * 28;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const elevAreaPts = `0,40 ${elevLinePts} 100,40`;

    return (
      <div className="border-y border-slate-100 bg-slate-900 text-white select-none overflow-hidden">
        {/* Mapbox-style Vector Route Canvas */}
        <div className="relative h-44 w-full bg-[#111827] overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
            aria-label={`نەخشەی چالاکی ${item.title}`}
          >
            <defs>
              <linearGradient id={`routeGrad-${item.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="50%" stopColor="#FC4C02" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <linearGradient id={`elevGrad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC4C02" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FC4C02" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Topographic contour lines */}
            <path d="M 0,20 Q 35,10 65,28 T 100,18" fill="none" stroke="#1E293B" strokeWidth="0.6" />
            <path d="M 0,45 Q 25,60 55,40 T 100,52" fill="none" stroke="#1E293B" strokeWidth="0.6" />
            <path d="M 0,75 Q 45,65 75,82 T 100,70" fill="none" stroke="#1E293B" strokeWidth="0.6" />
            <line x1="25" y1="0" x2="25" y2="100" stroke="#1E293B" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#1E293B" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="#1E293B" strokeWidth="0.3" strokeDasharray="1.5 1.5" />

            {/* Route Glow */}
            <polyline
              fill="none"
              stroke="#FC4C02"
              strokeOpacity="0.28"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polyPoints}
            />

            {/* Primary Strava Orange GPS Polyline */}
            <polyline
              fill="none"
              stroke={`url(#routeGrad-${item.id})`}
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polyPoints}
            />

            {/* Start Point (Green) */}
            {pts[0] && (
              <circle cx={pts[0].x} cy={pts[0].y} r="2.2" fill="#10B981" stroke="#0F172A" strokeWidth="0.8" />
            )}

            {/* End Point (Strava Flag Orange) */}
            {pts[pts.length - 1] && (
              <circle
                cx={pts[pts.length - 1].x}
                cy={pts[pts.length - 1].y}
                r="2.4"
                fill="#FC4C02"
                stroke="#FFFFFF"
                strokeWidth="0.9"
              />
            )}

            {/* Live Scrubbed Position Marker */}
            {activePt && (
              <>
                <circle cx={activePt.x} cy={activePt.y} r="4.2" fill="#FC4C02" fillOpacity="0.3" />
                <circle cx={activePt.x} cy={activePt.y} r="2.5" fill="#FFFFFF" stroke="#FC4C02" strokeWidth="1.2" />
              </>
            )}
          </svg>

          {/* Map Overlay Badges */}
          <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-[8px] text-[11px] font-bold text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-[#FC4C02]" />
            <span>{item.governorate}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-amber-400">{activePt.km} km</span>
          </div>

          <div className="absolute top-2.5 end-2.5 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-2 py-1 rounded-[8px] text-[10px] font-mono font-bold text-slate-300">
            بەرزی: {activePt.elev}m
          </div>

          {/* Achievement Ribbons on Map */}
          {item.achievements.length > 0 && (
            <div className="absolute bottom-2 start-2.5 flex flex-wrap items-center gap-1.5">
              {item.achievements.map((ach, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-amber-500/95 text-slate-950 text-[10px] font-black shadow-sm"
                >
                  <Trophy className="w-3 h-3" />
                  <span>{ach}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scrubbable Strava Elevation & Telemetry Strip */}
        <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/90">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
            <span>پڕۆفایلی بەرزی و مەودای مەیدانی (پەنجە بهێنە بەسەر هێڵکارییەکەدا)</span>
            <span className="font-mono text-[#FC4C02]">
              {activePt.km} km • {activePt.elev} m
            </span>
          </div>
          <div className="relative h-9 w-full">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
              <polygon points={elevAreaPts} fill={`url(#elevGrad-${item.id})`} />
              <polyline
                fill="none"
                stroke="#FC4C02"
                strokeWidth="1.5"
                points={elevLinePts}
              />
              {/* Vertical Scrub Crosshair */}
              <line
                x1={(activeIdx / Math.max(1, pts.length - 1)) * 100}
                y1="0"
                x2={(activeIdx / Math.max(1, pts.length - 1)) * 100}
                y2="40"
                stroke="#FFFFFF"
                strokeWidth="0.9"
                strokeDasharray="2 2"
              />
            </svg>
            {/* Interactive Range Input Overlay for smooth touch scrubbing */}
            <input
              type="range"
              min={0}
              max={pts.length - 1}
              value={activeIdx}
              aria-label="پشکنینی خاڵەکانی سەر ڕێڕەو"
              onChange={e =>
                setScrubIndexMap(prev => ({
                  ...prev,
                  [item.id]: Number(e.target.value),
                }))
              }
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#F4F4F6] text-slate-900 select-text overflow-hidden ${
        isDesktopPreview ? 'max-w-[460px] mx-auto border-x border-slate-300 shadow-2xl' : ''
      }`}
    >
      {/* 1. STRAVA TOP MOBILE BAR */}
      <header className="shrink-0 z-30 bg-white border-b border-slate-200 shadow-[0_1px_4px_rgba(15,23,42,0.04)] no-print">
        <div className="px-3.5 h-14 flex items-center justify-between gap-2">
          {/* Strava + Botan Athletic Identity */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                setIsFullModuleOpen(false);
                setStravaTab('home');
              }}
              className="flex items-center gap-2 text-start group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-[10px] bg-[#FC4C02] flex items-center justify-center text-white shadow-sm shrink-0">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-base tracking-tighter text-[#FC4C02]">
                    STRAVA
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-50 text-[#FC4C02] border border-orange-200/80">
                    بۆتان
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-600 truncate mt-0.5">
                  تۆڕی مەیدانی و خێرخوازی
                </span>
              </div>
            </button>
          </div>

          {/* Right Action Controls (Uniform 36px mobile touch targets) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Add (+) Button */}
            <button
              type="button"
              onClick={() => setQuickActionModal('distribute')}
              title="تۆماری خێرا"
              aria-label="تۆماری خێرا"
              className="w-9 h-9 rounded-[10px] bg-[#FC4C02] text-white flex items-center justify-center shadow-sm hover:bg-[#e04300] transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Spotlight Search */}
            <button
              type="button"
              onClick={() => setIsSpotlightOpen(true)}
              title="گەڕانی خێرا"
              aria-label="گەڕانی خێرا"
              className="w-9 h-9 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Currency Toggle (IQD / USD) */}
            <button
              type="button"
              onClick={() => setCurrencyView(currencyView === 'IQD' ? 'USD' : 'IQD')}
              title="گۆڕینی دراو"
              className="h-9 px-2.5 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-black flex items-center justify-center transition-colors"
            >
              {currencyView === 'IQD' ? 'د.ع' : 'USD'}
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setQuickActionModal('notifications')}
              title="ئاگادارکردنەوەکان"
              aria-label="ئاگادارکردنەوەکان"
              className="relative w-9 h-9 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FC4C02] text-white text-[10px] font-mono font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Switch to Classic UI button */}
            {onExitStravaMode && (
              <button
                type="button"
                onClick={onExitStravaMode}
                title="گەڕانەوە بۆ ڕووکاری کلاسیک"
                className="h-9 px-2.5 rounded-[10px] bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>کلاسیک</span>
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Module Quick-Jump Strip */}
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setIsFullModuleOpen(false)}
            className={`shrink-0 h-7 px-3 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all ${
              !isFullModuleOpen
                ? 'bg-[#FC4C02] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>فیدی ستراڤا</span>
          </button>

          {SYSTEM_MODULES.map(mod => {
            const Icon = mod.icon;
            const isCurrent = isFullModuleOpen && activeTab === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => openSystemModule(mod.id)}
                className={`shrink-0 h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{mod.label}</span>
                {mod.count !== undefined && (
                  <span className="font-mono text-[10px] opacity-75">({mod.count})</span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE BODY */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-6">
        {isFullModuleOpen ? (
          <div className="space-y-3">
            {/* Banner to return to Strava Native View */}
            <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FC4C02] animate-pulse" />
                <span className="text-xs font-black">
                  بەشی سیستەم: {SYSTEM_MODULES.find(m => m.id === activeTab)?.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFullModuleOpen(false)}
                className="px-3 py-1 rounded-[8px] bg-[#FC4C02] text-white text-xs font-black flex items-center gap-1 shadow-sm"
              >
                <span>گەڕانەوە بۆ ستراڤا</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-3 py-2">{renderClassicView()}</div>
          </div>
        ) : (
          <>
            {/* =========================================================
                TAB 1: HOME (ACTIVITY FEED & WEEKLY RELATIVE EFFORT)
               ========================================================= */}
            {stravaTab === 'home' && (
              <div className="space-y-3 pb-6">
                {/* Strava Weekly Impact & Relative Effort Snapshot */}
                <section className="bg-white border-b border-slate-200 p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FC4C02]" />
                      <h2 className="text-sm font-black text-slate-900">
                        پوختەی چالاکی هەفتانە (Relative Effort)
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStravaTab('you')}
                      className="text-xs font-black text-[#FC4C02] flex items-center gap-0.5"
                    >
                      <span>ئاماری تەواو</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 3 Big Strava Weekly Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-[11px] font-bold text-slate-500">کۆی بەخشین</p>
                      <p className="text-base font-mono font-black text-slate-900 mt-0.5 truncate">
                        {formatMoney(weeklySummary.totalDonationsIQD, weeklySummary.totalDonationsUSD)}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-600">+١٤٪ لەم هەفتەیە</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-[11px] font-bold text-slate-500">خێزانی هاوکاریکراو</p>
                      <p className="text-base font-mono font-black text-slate-900 mt-0.5">
                        {weeklySummary.aidedFamilies} <span className="text-xs text-slate-500">/ {weeklySummary.totalFamilies}</span>
                      </p>
                      <span className="text-[10px] font-bold text-[#FC4C02]">ئامانجی مانگانە</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-[11px] font-bold text-slate-500">کاتژمێری مەیدانی</p>
                      <p className="text-base font-mono font-black text-slate-900 mt-0.5">
                        {weeklySummary.totalHours} <span className="text-xs font-sans">کاتژمێر</span>
                      </p>
                      <span className="text-[10px] font-bold text-slate-600">{volunteers.length} خۆبەخش</span>
                    </div>
                  </div>

                  {/* 7-Day Activity Spark Bars + Quick Record CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
                    <div className="flex items-end gap-2 h-10">
                      {[
                        { d: 'ش', h: 55 },
                        { d: 'ی', h: 80 },
                        { d: 'د', h: 45 },
                        { d: 'س', h: 95 },
                        { d: 'چ', h: 70 },
                        { d: 'پ', h: 88 },
                        { d: 'هـ', h: 65 },
                      ].map((bar, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-3.5 h-7 bg-slate-100 rounded-t-[3px] flex items-end overflow-hidden">
                            <div
                              style={{ height: `${bar.h}%` }}
                              className={`w-full rounded-t-[3px] ${
                                i === 3 || i === 5 ? 'bg-[#FC4C02]' : 'bg-orange-300'
                              }`}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-500">{bar.d}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setStravaTab('record')}
                      className="h-9 px-3.5 rounded-[10px] bg-[#FC4C02] text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>تۆمارکردنی مەیدانی</span>
                    </button>
                  </div>
                </section>

                {/* Feed Category Filter Pills */}
                <div className="px-3.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'هەموو چالاکییەکان' },
                    { id: 'distribution', label: '🚚 دابەشکردنی مەیدانی' },
                    { id: 'donation', label: '💎 بەخشینەکان' },
                    { id: 'project', label: '🏕️ پڕۆژەکان' },
                    { id: 'urgent_case', label: '🚨 دۆسیەی بەپەلە' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFeedFilter(tab.id as typeof feedFilter)}
                      className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold transition-all ${
                        feedFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Activity Feed Cards List */}
                <div className="space-y-3">
                  {filteredFeed.map(item => {
                    const hasKudos = !!kudosMap[item.id];
                    const kudosCount = item.initialKudos + (hasKudos ? 1 : 0);
                    const cardComments = commentsMap[item.id] || [];
                    const isCommentsOpen = activeCommentCardId === item.id;

                    return (
                      <article
                        key={item.id}
                        className="bg-white border-y sm:border sm:rounded-2xl border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden"
                      >
                        {/* 1. Card Athlete / Humanitarian Header */}
                        <div className="p-3.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FC4C02] to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                              {item.actorName.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-xs font-black text-slate-900 truncate">
                                  {item.actorName}
                                </h3>
                                <span className="px-1.5 py-0.5 rounded bg-orange-50 text-[#FC4C02] border border-orange-200/70 text-[10px] font-black">
                                  {item.actorBadge}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                {item.actorRole} • <span className="font-mono">{item.date}</span> • {item.governorate}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (item.beneficiaryId) {
                                openBeneficiaryProfile(item.beneficiaryId);
                                setIsFullModuleOpen(true);
                              } else {
                                openSystemModule(item.entityTab);
                              }
                            }}
                            title="بینینی لە سیستەم"
                            className="h-8 px-2.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 shrink-0"
                          >
                            <span>دۆسیە</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 2. Activity Title & Narrative */}
                        <div className="px-3.5 pb-3 space-y-1">
                          <h4 className="text-sm font-black text-slate-900 leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs font-bold text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* 3. Strava 4-Column Telemetry Split Grid */}
                        <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-100 grid grid-cols-4 gap-2 divide-x divide-x-reverse divide-slate-200/80">
                          <div className="ps-1">
                            <p className="text-[10px] font-bold text-slate-500 truncate">
                              {item.primaryMetricLabel}
                            </p>
                            <p className="text-sm font-mono font-black text-slate-900 mt-0.5 truncate">
                              {item.primaryMetricValue}
                            </p>
                          </div>
                          <div className="ps-2.5">
                            <p className="text-[10px] font-bold text-slate-500 truncate">
                              {item.secondaryMetricLabel}
                            </p>
                            <p className="text-sm font-mono font-black text-slate-900 mt-0.5 truncate">
                              {item.secondaryMetricValue}
                            </p>
                          </div>
                          <div className="ps-2.5">
                            <p className="text-[10px] font-bold text-slate-500 truncate">
                              {item.tertiaryMetricLabel}
                            </p>
                            <p className="text-sm font-mono font-black text-[#FC4C02] mt-0.5 truncate">
                              {item.tertiaryMetricValue}
                            </p>
                          </div>
                          <div className="ps-2.5">
                            <p className="text-[10px] font-bold text-slate-500 truncate">
                              {item.quaternaryMetricLabel}
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-800 mt-1 truncate">
                              {item.quaternaryMetricValue}
                            </p>
                          </div>
                        </div>

                        {/* 4. Interactive Mapbox Polyline & Scrubbable Elevation Chart */}
                        {renderStravaRouteVisualizer(item)}

                        {/* 5. Social Kudos & Comments Footer */}
                        <div className="px-3.5 py-2.5 flex items-center justify-between bg-white">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5 space-x-reverse">
                              <span className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white text-[#FC4C02] text-[10px] font-black flex items-center justify-center">
                                م
                              </span>
                              <span className="w-6 h-6 rounded-full bg-cyan-100 border-2 border-white text-cyan-800 text-[10px] font-black flex items-center justify-center">
                                س
                              </span>
                              <span className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white text-emerald-800 text-[10px] font-black flex items-center justify-center">
                                هـ
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-600">
                              <strong className="font-mono text-slate-900">{kudosCount}</strong> دەستخۆشی (Kudos)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Kudos Button */}
                            <button
                              type="button"
                              onClick={() => toggleKudos(item.id)}
                              aria-pressed={hasKudos}
                              className={`h-9 px-3 rounded-[10px] text-xs font-black flex items-center gap-1.5 transition-all ${
                                hasKudos
                                  ? 'bg-[#FC4C02] text-white shadow-sm scale-[1.02]'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>{hasKudos ? 'دەستخۆشی کرا' : 'دەستخۆشی'}</span>
                            </button>

                            {/* Comments Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCommentCardId(isCommentsOpen ? null : item.id)
                              }
                              className={`h-9 px-3 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                isCommentsOpen
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="font-mono">{cardComments.length}</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable Comment Thread Drawer */}
                        {isCommentsOpen && (
                          <div className="px-3.5 py-3 bg-slate-50 border-t border-slate-200/80 space-y-2.5">
                            {cardComments.length === 0 ? (
                              <p className="text-xs font-bold text-slate-500">
                                هیچ سەرنجێک نەنووسراوە. یەکەم کەس بە دەستخۆشی بنووسێت!
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {cardComments.map((c, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <span className="font-black text-slate-900 me-1.5">
                                        {c.author}:
                                      </span>
                                      <span className="font-bold text-slate-700">{c.text}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {c.time}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                placeholder="نووسینی سەرنج یان دەستخۆشی..."
                                className="flex-1 h-9 px-3 rounded-[10px] bg-white border border-slate-200 text-xs font-bold focus:border-[#FC4C02] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddComment(item.id)}
                                className="h-9 px-3 rounded-[10px] bg-[#FC4C02] text-white text-xs font-black flex items-center gap-1"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>ناردن</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 2: MAPS (EXPLORE HEATMAP, SEGMENTS & FIELD ROUTES)
               ========================================================= */}
            {stravaTab === 'maps' && (
              <div className="space-y-3 pb-6">
                {/* Maps Top Sub-Navigation */}
                <div className="bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'explore', label: 'نەخشەی گەرمی (Heatmap)' },
                      { id: 'segments', label: 'سێگمێنتەکان (Segments)' },
                      { id: 'routes', label: 'ڕێڕەوەکان (Routes)' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMapsSubTab(t.id as typeof mapsSubTab)}
                        className={`h-8 px-3 rounded-[10px] text-xs font-black transition-all ${
                          mapsSubTab === t.id
                            ? 'bg-[#FC4C02] text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {mapsSubTab === 'explore' && (
                  <div className="px-3.5 space-y-3">
                    {/* Interactive Strava Global Heatmap of Kurdistan */}
                    <div className="rounded-2xl bg-slate-950 border border-slate-800 text-white overflow-hidden shadow-md">
                      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-[#FC4C02]" />
                            <span>نەخشەی چالاکی و گەرمی پارێزگاکان (Global Heatmap)</span>
                          </h3>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            چڕی دابەشکردنی هاوکاری و خێزانە تۆمارکراوەکان لە هەر ٧ پارێزگا
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowEmbeddedLeafletMap(!showEmbeddedLeafletMap)}
                          className="h-8 px-3 rounded-[8px] bg-[#FC4C02] text-white text-xs font-black shrink-0"
                        >
                          {showEmbeddedLeafletMap ? 'نەخشەی ستراڤا' : 'نەخشەی تەواو (GIS)'}
                        </button>
                      </div>

                      {showEmbeddedLeafletMap ? (
                        <div className="bg-white text-slate-900 p-2">
                          <button
                            type="button"
                            onClick={() => openSystemModule('geo')}
                            className="w-full mb-2 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
                          >
                            کردنەوەی نەخشەی جوگرافی بە شاشەی تەواو
                          </button>
                        </div>
                      ) : null}

                      {/* Strava Vector Heatmap Canvas */}
                      <div className="relative h-64 w-full bg-[#0B0F19]">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {/* Grid & Connecting Field Arteries */}
                          <polyline
                            points="18,12 26,20 48,42 52,72 70,86"
                            fill="none"
                            stroke="#FC4C02"
                            strokeWidth="1.2"
                            strokeDasharray="2 1.5"
                            strokeOpacity="0.65"
                          />
                          <polyline
                            points="48,42 76,62 86,74 70,86"
                            fill="none"
                            stroke="#FB923C"
                            strokeWidth="1.4"
                            strokeOpacity="0.75"
                          />

                          {governorateSegments.map(seg => {
                            const radius = Math.max(4, Math.min(11, 4 + seg.totalFamilies * 0.8));
                            return (
                              <g
                                key={seg.gov}
                                className="cursor-pointer"
                                onClick={() => setSelectedSegmentGov(seg.gov)}
                              >
                                <circle
                                  cx={seg.coords.x}
                                  cy={seg.coords.y}
                                  r={radius * 1.7}
                                  fill="#FC4C02"
                                  fillOpacity="0.22"
                                />
                                <circle
                                  cx={seg.coords.x}
                                  cy={seg.coords.y}
                                  r={radius}
                                  fill="#FC4C02"
                                  stroke="#FFFFFF"
                                  strokeWidth="0.9"
                                />
                                <text
                                  x={seg.coords.x}
                                  y={seg.coords.y - radius - 2.2}
                                  textAnchor="middle"
                                  fill="#FFFFFF"
                                  fontSize="3.8"
                                  fontWeight="900"
                                >
                                  {seg.gov} ({seg.totalFamilies})
                                </text>
                              </g>
                            );
                          })}
                        </svg>

                        <div className="absolute bottom-2.5 start-2.5 end-2.5 flex items-center justify-between bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-xl text-xs">
                          <span className="font-bold text-slate-300">
                            کلیک لە هەر بازنەیەک بکە بۆ کردنەوەی ڕیزبەندی سێگمێنت (Leaderboard)
                          </span>
                          <button
                            type="button"
                            onClick={() => openSystemModule('geo')}
                            className="text-[#FC4C02] font-black shrink-0 ms-2"
                          >
                            کردنەوەی GIS ←
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Governorate Quick Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {governorateSegments.map(seg => (
                        <button
                          key={seg.gov}
                          type="button"
                          onClick={() => setSelectedSegmentGov(seg.gov)}
                          className="p-3 rounded-2xl bg-white border border-slate-200 text-start hover:border-[#FC4C02] transition-all shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">{seg.gov}</span>
                            <span className="px-1.5 py-0.5 rounded bg-orange-50 text-[#FC4C02] font-mono text-[10px] font-black">
                              {seg.distanceKm} km
                            </span>
                          </div>
                          <p className="text-lg font-mono font-black text-slate-900 mt-1">
                            {seg.totalFamilies}{' '}
                            <span className="text-[11px] font-sans font-bold text-slate-500">خێزان</span>
                          </p>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                            <span className="text-rose-600">{seg.urgentCount} بەپەلە</span>
                            <span className="text-emerald-600">{seg.aidedCount} هاوکاریکراو</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mapsSubTab === 'segments' && (
                  <div className="px-3.5 space-y-2.5">
                    {governorateSegments.map((seg, i) => (
                      <div
                        key={seg.gov}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-orange-50 text-[#FC4C02] font-mono text-[10px] font-black">
                                #{i + 1} SEGMENT
                              </span>
                              <h4 className="text-xs font-black text-slate-900">
                                {seg.segmentTitle}
                              </h4>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                              پێشەنگی سێگمێنت (KOM): <strong className="text-slate-800">{seg.komLeader}</strong> 👑
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedSegmentGov(seg.gov)}
                            className="h-8 px-3 rounded-[10px] bg-slate-900 text-white text-xs font-bold"
                          >
                            ڕیزبەندی
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500">خێزان</p>
                            <p className="text-xs font-mono font-black text-slate-900">{seg.totalFamilies}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500">هاوکاریکراو</p>
                            <p className="text-xs font-mono font-black text-emerald-600">{seg.aidedCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500">مەودا</p>
                            <p className="text-xs font-mono font-black text-slate-900">{seg.distanceKm} km</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500">بەرزی</p>
                            <p className="text-xs font-mono font-black text-[#FC4C02]">{seg.elevationGain} m</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mapsSubTab === 'routes' && (
                  <div className="px-3.5 space-y-2.5">
                    {[
                      {
                        title: 'ڕێڕەوی دابەشکردنی سەبەتەی خۆراک — هەولێر',
                        gov: 'هەولێر',
                        km: 18.4,
                        elev: 310,
                        est: '٢ کاتژمێر و ١٥ خولەک',
                        families: 45,
                      },
                      {
                        title: 'ڕێڕەوی فریاگوزاری زستانە — سلێمانی و هەڵەبجە',
                        gov: 'سلێمانی',
                        km: 34.2,
                        elev: 640,
                        est: '٣ کاتژمێر و ٤٠ خولەک',
                        families: 60,
                      },
                      {
                        title: 'ڕێڕەوی پشکنینی مەیدانی — دهۆک و زاخۆ',
                        gov: 'دهۆک',
                        km: 27.5,
                        elev: 520,
                        est: '٣ کاتژمێر',
                        families: 38,
                      },
                    ].map((rt, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black">
                              ڕێڕەوی پێشنیارکراو • {rt.gov}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-1">{rt.title}</h4>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500">دووری گشتی</p>
                            <p className="text-xs font-mono font-black text-slate-900">{rt.km} km</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500">بەرزی</p>
                            <p className="text-xs font-mono font-black text-slate-900">{rt.elev} m</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500">ئامانج</p>
                            <p className="text-xs font-mono font-black text-[#FC4C02]">{rt.families} خێزان</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRouteTitle(rt.title);
                            setStravaTab('record');
                            showToast(`ڕێڕەوی (${rt.title}) ئامادەیە بۆ تۆمارکردن!`, 'info');
                          }}
                          className="w-full h-9 rounded-[10px] bg-[#FC4C02] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>بەکارهێنانی ئەم ڕێڕەوە لە تۆمارکەری مەیدانی</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
                TAB 3: RECORD (LIVE FIELD TELEMETRY HUD & LOGGER)
               ========================================================= */}
            {stravaTab === 'record' && (
              <div className="bg-slate-950 text-white min-h-[calc(100vh-130px)] flex flex-col justify-between p-4 select-none">
                {/* Top GPS Signal & Route Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>GPS ئامادەیە • سیگناڵی بەهێز</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      STRAVA FIELD HUD
                    </span>
                  </div>

                  {/* Mission Type Selector Pills */}
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {(
                      ['دابەشکردنی مەیدانی', 'سەردانی ماڵان', 'گواستنەوەی کۆگا'] as const
                    ).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMissionType(type)}
                        className={`py-2 px-2 rounded-lg text-[11px] font-black transition-all ${
                          missionType === type
                            ? 'bg-[#FC4C02] text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Live GPS Breadcrumb Radar Canvas */}
                  <div className="relative h-44 rounded-2xl bg-[#0D1322] border border-slate-800 overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2 2" />
                      <circle cx="50" cy="50" r="26" fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2 2" />
                      <polyline
                        fill="none"
                        stroke="#FC4C02"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={hudWaypoints.map(w => `${w.x},${w.y}`).join(' ')}
                      />
                      {hudWaypoints.map((w, idx) => (
                        <g key={idx}>
                          <circle
                            cx={w.x}
                            cy={w.y}
                            r={idx === hudWaypoints.length - 1 ? 3.2 : 2.2}
                            fill={idx === 0 ? '#10B981' : '#FC4C02'}
                            stroke="#FFFFFF"
                            strokeWidth="0.8"
                          />
                        </g>
                      ))}
                    </svg>
                    <div className="absolute top-2.5 start-2.5 bg-slate-950/85 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-bold text-slate-300">
                      {selectedRouteTitle}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextX = Math.max(12, Math.min(88, 20 + ((hudWaypoints.length * 19) % 68)));
                        const nextY = Math.max(16, Math.min(84, 70 - ((hudWaypoints.length * 17) % 52)));
                        setHudWaypoints(prev => [
                          ...prev,
                          { x: nextX, y: nextY, label: `خاڵی ${prev.length}` },
                        ]);
                        setRecordedCheckpoints(prev => prev + 1);
                        setRecordedKm(prev => Number((prev + 0.65).toFixed(2)));
                        showToast('خاڵی سەردانی مەیدانی زیادکرا 📍', 'success');
                      }}
                      className="absolute bottom-2.5 end-2.5 h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-black flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#FC4C02]" />
                      <span>+ تۆمارکردنی خاڵی GPS</span>
                    </button>
                  </div>
                </div>

                {/* Giant High-Contrast Outdoor Telemetry Readouts */}
                <div className="my-4 space-y-3 text-center">
                  <div className="py-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      کاتی تێپەڕبوو (ELAPSED TIME)
                    </p>
                    <p className="text-4xl font-mono font-black text-white tracking-tight mt-1">
                      {formatDuration(elapsedSeconds)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="py-3 px-2 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400">دووری بڕاو (DISTANCE)</p>
                      <p className="text-2xl font-mono font-black text-[#FC4C02] mt-1">
                        {recordedKm.toFixed(2)} <span className="text-xs">km</span>
                      </p>
                    </div>
                    <div className="py-3 px-2 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400">خاڵ و هاوکاری تۆمارکراو</p>
                      <p className="text-2xl font-mono font-black text-emerald-400 mt-1">
                        {recordedCheckpoints} <span className="text-xs font-sans">تۆمار</span>
                      </p>
                    </div>
                  </div>

                  {/* Quick Database Field Logging Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setQuickActionModal('distribute')}
                      className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-black text-white flex items-center justify-center gap-1.5"
                    >
                      <Truck className="w-4 h-4 text-[#FC4C02]" />
                      <span>دابەشکردن لە کۆگا</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickActionModal('donation')}
                      className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-black text-white flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-4 h-4 text-emerald-400" />
                      <span>تۆمارکردنی بەخشین</span>
                    </button>
                  </div>
                </div>

                {/* Tactile Strava Circular Control Buttons */}
                <div className="pt-2 pb-4 flex items-center justify-center gap-5">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecording(true);
                        setIsPaused(false);
                        showToast('تۆمارکردنی چالاکی مەیدانی دەستیپێکرد! 🏃‍♂️', 'info');
                      }}
                      className="w-20 h-20 rounded-full bg-[#FC4C02] hover:bg-[#e04300] text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-[0_0_30px_rgba(252,76,2,0.5)] ring-4 ring-[#FC4C02]/30 transition-transform active:scale-95"
                    >
                      <Play className="w-7 h-7 fill-white" />
                      <span>دەستپێکردن</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsPaused(!isPaused)}
                        className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex flex-col items-center justify-center gap-0.5 shadow-lg"
                      >
                        {isPaused ? <Play className="w-6 h-6 fill-slate-950" /> : <Pause className="w-6 h-6" />}
                        <span>{isPaused ? 'بەردەوامبە' : 'وەستان'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFinishRecording}
                        className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex flex-col items-center justify-center gap-1 shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-4 ring-emerald-500/30"
                      >
                        <Check className="w-7 h-7 stroke-[3]" />
                        <span>پاشەکەوت</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 4: GROUPS (ACTIVE CHALLENGES, CLUBS & LEADERBOARDS)
               ========================================================= */}
            {stravaTab === 'groups' && (
              <div className="space-y-3 pb-6">
                <div className="bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center gap-1.5">
                  {[
                    { id: 'challenges', label: 'چاڵێنج و کەمپەینەکان' },
                    { id: 'leaderboards', label: 'ڕیزبەندی پێشەنگان (KOM)' },
                    { id: 'clubs', label: 'کڵەبەکانی بۆتان' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setGroupsSubTab(t.id as typeof groupsSubTab)}
                      className={`h-8 px-3 rounded-[10px] text-xs font-black transition-all ${
                        groupsSubTab === t.id
                          ? 'bg-[#FC4C02] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {groupsSubTab === 'challenges' && (
                  <div className="px-3.5 space-y-3">
                    {projects.map(proj => {
                      const pct = Math.min(
                        100,
                        Math.round((proj.raisedBudgetUSD / Math.max(1, proj.targetBudgetUSD)) * 100)
                      );
                      return (
                        <div
                          key={proj.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FC4C02] shrink-0">
                                <Trophy className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-[#FC4C02] uppercase">
                                  چاڵێنجی مرۆیی • {proj.category}
                                </span>
                                <h4 className="text-sm font-black text-slate-900">{proj.title}</h4>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-mono font-black">
                              {pct}%
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-600">{proj.description}</p>

                          {/* Strava Orange Progress Bar */}
                          <div className="space-y-1">
                            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-gradient-to-r from-[#FC4C02] to-amber-500 rounded-full"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-600">
                              <span>کۆکراوە: ${proj.raisedBudgetUSD.toLocaleString()}</span>
                              <span>ئامانج: ${proj.targetBudgetUSD.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-500">
                              {proj.beneficiariesCount.toLocaleString()} خێزان • {proj.volunteersCount} خۆبەخش
                            </span>
                            <button
                              type="button"
                              onClick={() => openSystemModule('projects')}
                              className="h-8 px-3 rounded-[8px] bg-slate-900 text-white text-xs font-bold"
                            >
                              کردنەوەی پڕۆژە
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {groupsSubTab === 'leaderboards' && (
                  <div className="px-3.5 space-y-4">
                    {/* Top Donors KOM Leaderboard */}
                    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <h3 className="text-xs font-black">ڕیزبەندی پێشەنگانی بەخشین (Donors KOM)</h3>
                        </div>
                        <span className="text-[11px] font-mono text-amber-400">LIVE RANKING</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {[...donors]
                          .sort((a, b) => b.totalDonationsIQD - a.totalDonationsIQD)
                          .slice(0, 8)
                          .map((d, i) => (
                            <div key={d.id} className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${
                                    i === 0
                                      ? 'bg-amber-400 text-slate-950'
                                      : i === 1
                                      ? 'bg-slate-300 text-slate-900'
                                      : i === 2
                                      ? 'bg-amber-700 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="text-xs font-black text-slate-900">{d.fullName}</p>
                                  <p className="text-[10px] font-bold text-slate-500">{d.governorate}</p>
                                </div>
                              </div>
                              <span className="text-xs font-mono font-black text-[#FC4C02]">
                                {formatMoney(d.totalDonationsIQD, d.totalDonationsUSD)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Top Field Volunteers Leaderboard */}
                    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#FC4C02]" />
                          <h3 className="text-xs font-black">پاڵەوانانی مەیدانی (Volunteers KOM)</h3>
                        </div>
                        <span className="text-[11px] font-mono text-orange-400">BY HOURS</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {[...volunteers]
                          .sort((a, b) => b.hoursLogged - a.hoursLogged)
                          .slice(0, 8)
                          .map((v, i) => (
                            <div key={v.id} className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${
                                    i === 0
                                      ? 'bg-[#FC4C02] text-white'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="text-xs font-black text-slate-900">{v.fullName}</p>
                                  <p className="text-[10px] font-bold text-slate-500">
                                    {v.governorate} • {v.badgeNumber}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-mono font-black text-slate-900">
                                {v.hoursLogged} کاتژمێر
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {groupsSubTab === 'clubs' && (
                  <div className="px-3.5 space-y-3">
                    {[
                      {
                        name: 'کڵەبی ئەفسەرانی مەیدانی بۆتان',
                        members: volunteers.length,
                        desc: 'تیمی گەڕان و پشتڕاستکردنەوەی مەیدانی و دابەشکردنی خێرا لە هەر ٧ پارێزگاکە',
                        badge: '🏃‍♂️ مەیدانی',
                        tab: 'volunteers' as NavTab,
                      },
                      {
                        name: 'ئەنجومەنی بەخشەرانی ئەڵماس و زێڕین',
                        members: donors.length,
                        desc: 'تۆڕی بەخشەرە بەردەوامەکان و پاڵپشتیکارانی پڕۆژە ستراتیژییەکان',
                        badge: '💎 بەخشەران',
                        tab: 'donors' as NavTab,
                      },
                      {
                        name: 'تیمی بەڕێوەبردنی کۆگا و لۆجستی',
                        members: inventory.length,
                        desc: 'سەرپەرشتیاری ئامادەکردنی سەبەتەی خۆراک و پێداویستی پزیشکی',
                        badge: '📦 لۆجستی',
                        tab: 'inventory' as NavTab,
                      },
                    ].map((club, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded bg-orange-50 text-[#FC4C02] text-[10px] font-black">
                            {club.badge} • {club.members} ئەندام/تۆمار
                          </span>
                          <h4 className="text-sm font-black text-slate-900">{club.name}</h4>
                          <p className="text-xs font-bold text-slate-500">{club.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openSystemModule(club.tab)}
                          className="h-9 px-3 rounded-[10px] bg-slate-900 text-white text-xs font-bold shrink-0"
                        >
                          کردنەوە
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
                TAB 5: YOU (ATHLETE PROFILE, PROGRESS GRAPH & ALL MODULES)
               ========================================================= */}
            {stravaTab === 'you' && (
              <div className="space-y-3 pb-6">
                {/* Athlete / Humanitarian Profile Banner */}
                <div className="bg-white border-b border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FC4C02] to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                        {(currentUser?.name || 'ب').slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-base font-black text-slate-900">
                            {currentUser?.name || 'ڕێکخراوی بۆتان بامۆکی'}
                          </h2>
                          <span className="px-1.5 py-0.5 rounded bg-orange-50 text-[#FC4C02] text-[10px] font-black border border-orange-200">
                            PRO ATHLETE
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500">
                          {currentUser?.roleTitleKurdish || 'بەڕێوەبەری گشتی'} • کوردستان
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openSystemModule('settings')}
                      className="w-9 h-9 rounded-[10px] bg-slate-100 text-slate-700 flex items-center justify-center"
                      aria-label="ڕێکخستنەکان"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Strava Follower / Activity Counts */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500">چالاکییەکان</p>
                      <p className="text-sm font-mono font-black text-slate-900">
                        {feedActivities.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500">سوودمەندان</p>
                      <p className="text-sm font-mono font-black text-slate-900">
                        {beneficiaries.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500">بەخشەران</p>
                      <p className="text-sm font-mono font-black text-[#FC4C02]">
                        {donors.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500">پڕۆژەکان</p>
                      <p className="text-sm font-mono font-black text-emerald-600">
                        {projects.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Strava Progress Chart */}
                <div className="mx-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#FC4C02]" />
                      <span>هێڵکاری گەشە و پێشکەوتن (١٢ هەفتە)</span>
                    </h3>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'donations', label: 'بەخشین' },
                        { id: 'beneficiaries', label: 'خێزان' },
                        { id: 'hours', label: 'کاتژمێر' },
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setProgressMetric(m.id as typeof progressMetric)}
                          className={`px-2 py-1 rounded-[6px] text-[10px] font-black ${
                            progressMetric === m.id
                              ? 'bg-[#FC4C02] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-32 w-full">
                    <svg viewBox="0 0 100 45" preserveAspectRatio="none" className="w-full h-full">
                      <defs>
                        <linearGradient id="stravaProgGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FC4C02" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#FC4C02" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <polygon
                        points={
                          progressMetric === 'donations'
                            ? '0,42 0,32 16,26 32,29 48,18 64,21 80,11 100,6 100,42'
                            : progressMetric === 'beneficiaries'
                            ? '0,42 0,35 16,30 32,24 48,22 64,15 80,12 100,8 100,42'
                            : '0,42 0,28 16,31 32,20 48,25 64,14 80,16 100,9 100,42'
                        }
                        fill="url(#stravaProgGrad)"
                      />
                      <polyline
                        fill="none"
                        stroke="#FC4C02"
                        strokeWidth="2"
                        points={
                          progressMetric === 'donations'
                            ? '0,32 16,26 32,29 48,18 64,21 80,11 100,6'
                            : progressMetric === 'beneficiaries'
                            ? '0,35 16,30 32,24 48,22 64,15 80,12 100,8'
                            : '0,28 16,31 32,20 48,25 64,14 80,16 100,9'
                        }
                      />
                    </svg>
                  </div>
                </div>

                {/* Trophy Case */}
                <div className="mx-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#FC4C02]" />
                    <span>کەیسی مەدالیا و دەستکەوتەکان (Trophy Case)</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { title: 'پاڵەوانی مەیدان', sub: `${weeklySummary.aidedFamilies}+ خێزان`, icon: '🏆' },
                      { title: 'پشتگیری ئەڵماس', sub: `${donors.length} بەخشەر`, icon: '💎' },
                      { title: '٧ پارێزگای کوردستان', sub: '١٠٠٪ ڕووماڵ', icon: '👑' },
                    ].map((tr, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/80 text-center space-y-0.5"
                      >
                        <div className="text-xl">{tr.icon}</div>
                        <p className="text-[11px] font-black text-slate-900">{tr.title}</p>
                        <p className="text-[10px] font-mono font-bold text-[#FC4C02]">{tr.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All 11 System Modules Launcher Grid */}
                <div className="mx-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900">
                      هەموو بەشەکانی سیستەمی خێرخوازی (Full Modules)
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500">١١ بەشی تەواو</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SYSTEM_MODULES.map(mod => {
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => openSystemModule(mod.id)}
                          className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 flex flex-col items-center justify-center gap-1.5 text-center transition-all"
                        >
                          <Icon className="w-5 h-5 text-[#FC4C02]" />
                          <span className="text-[11px] font-black text-slate-800">{mod.label}</span>
                          {mod.count !== undefined && (
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              {mod.count} تۆمار
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. PERSISTENT 5-TAB STRAVA BOTTOM NAVIGATION DOCK */}
      <nav
        aria-label="ڕێڕەوی خوارەوەی ستراڤا"
        className="shrink-0 z-30 h-16 bg-white border-t border-slate-200 px-2 grid grid-cols-5 items-center shadow-[0_-4px_20px_rgba(15,23,42,0.05)] no-print"
      >
        {[
          { id: 'home', label: 'ماڵەوە', icon: Home },
          { id: 'maps', label: 'نەخشە', icon: MapIcon },
          { id: 'record', label: 'تۆمارکردن', icon: Radio, isCenterRecord: true },
          { id: 'groups', label: 'گرووپەکان', icon: Users },
          { id: 'you', label: 'تۆ', icon: Award },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = !isFullModuleOpen && stravaTab === tab.id;

          if (tab.isCenterRecord) {
            return (
              <div key={tab.id} className="flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsFullModuleOpen(false);
                    setStravaTab('record');
                  }}
                  aria-label="تۆمارکردنی چالاکی مەیدانی"
                  className={`-mt-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-slate-900 text-[#FC4C02] ring-4 ring-orange-200'
                      : 'bg-[#FC4C02] text-white ring-4 ring-orange-100'
                  }`}
                >
                  <Radio className={`w-5 h-5 ${isRecording ? 'animate-spin' : ''}`} />
                </button>
                <span className="text-[10px] font-black text-slate-800 mt-0.5">{tab.label}</span>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setIsFullModuleOpen(false);
                setStravaTab(tab.id as StravaTab);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                isActive ? 'text-[#FC4C02]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
              <span className="text-[11px] font-black">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 4. MODALS & SHEETS (Quick Distribute, Quick Donation, Notifications, Segment Leaderboard) */}
      {(quickActionModal !== 'none' || selectedSegmentGov !== null) && (
        <div
          ref={modalTrapRef}
          role="dialog"
          aria-modal="true"
          aria-label="پەنجەرەی کرداری خێرای ستراڤا"
          className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FC4C02]" />
                <span>
                  {selectedSegmentGov
                    ? `ڕیزبەندی سێگمێنتی ${selectedSegmentGov} (Leaderboard)`
                    : quickActionModal === 'distribute'
                    ? 'تۆماری خێرای مەیدانی (دابەشکردن / بەخشین)'
                    : quickActionModal === 'donation'
                    ? 'تۆمارکردنی بەخشینی خێرا'
                    : 'ئاگادارکردنەوەکان'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setQuickActionModal('none');
                  setSelectedSegmentGov(null);
                }}
                aria-label="داخستن"
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {selectedSegmentGov && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      خێزانە تۆمارکراوەکانی {selectedSegmentGov}
                    </span>
                    <span className="font-mono text-xs font-black text-[#FC4C02]">
                      {beneficiaries.filter(b => b.governorate === selectedSegmentGov).length} خێزان
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {beneficiaries
                      .filter(b => b.governorate === selectedSegmentGov)
                      .slice(0, 8)
                      .map((b, idx) => {
                        const v = computeVulnerabilityScore(b);
                        return (
                          <div key={b.id} className="py-2.5 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-black text-slate-900">
                                #{idx + 1} {b.fullName}
                              </p>
                              <p className="text-[11px] font-bold text-slate-500">
                                {b.address} • {b.familyMembers} ئەندام
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSegmentGov(null);
                                openBeneficiaryProfile(b.id);
                                setIsFullModuleOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-[8px] bg-slate-900 text-white font-mono text-[11px] font-bold"
                            >
                              خاڵی {v.score} ←
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {(quickActionModal === 'distribute' || quickActionModal === 'donation') && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100">
                    <button
                      type="button"
                      onClick={() => setQuickActionModal('distribute')}
                      className={`py-2 rounded-lg text-xs font-black ${
                        quickActionModal === 'distribute'
                          ? 'bg-[#FC4C02] text-white shadow-sm'
                          : 'text-slate-700'
                      }`}
                    >
                      🚚 دابەشکردنی کاڵا
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickActionModal('donation')}
                      className={`py-2 rounded-lg text-xs font-black ${
                        quickActionModal === 'donation'
                          ? 'bg-[#FC4C02] text-white shadow-sm'
                          : 'text-slate-700'
                      }`}
                    >
                      💎 بەخشینی نوێ
                    </button>
                  </div>

                  {quickActionModal === 'distribute' ? (
                    <form onSubmit={handleQuickDistributeSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          هەڵبژاردنی کاڵا لە کۆگا
                        </label>
                        <select
                          value={quickDistItemId}
                          onChange={e => setQuickDistItemId(e.target.value)}
                          className="w-full h-10 px-3 rounded-[10px] bg-slate-50 border border-slate-200 text-xs font-bold"
                        >
                          <option value="">-- کاڵایەک هەڵبژێرە --</option>
                          {inventory.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} (ماوە: {item.quantity} {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          هەڵبژاردنی سوودمەند
                        </label>
                        <select
                          value={quickDistBenId}
                          onChange={e => setQuickDistBenId(e.target.value)}
                          className="w-full h-10 px-3 rounded-[10px] bg-slate-50 border border-slate-200 text-xs font-bold"
                        >
                          <option value="">-- خێزانێک هەڵبژێرە --</option>
                          {beneficiaries.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.fullName} ({b.governorate})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          بڕ / ژمارەی دانە
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={quickDistQty}
                          onChange={e => setQuickDistQty(Number(e.target.value))}
                          className="w-full h-10 px-3 rounded-[10px] bg-slate-50 border border-slate-200 font-mono text-xs font-bold"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full h-10 rounded-[10px] bg-[#FC4C02] text-white text-xs font-black shadow-sm"
                      >
                        تۆمارکردن و بڵاوکردنەوە لە فید
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleQuickDonationSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          ناوی بەخشەر
                        </label>
                        <input
                          type="text"
                          value={quickDonDonorName}
                          onChange={e => setQuickDonDonorName(e.target.value)}
                          placeholder="ناوی سیانی بەخشەر..."
                          className="w-full h-10 px-3 rounded-[10px] bg-slate-50 border border-slate-200 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          بڕی بەخشین ({currencyView})
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={quickDonAmount}
                          onChange={e => setQuickDonAmount(e.target.value)}
                          placeholder={currencyView === 'IQD' ? '250000' : '200'}
                          className="w-full h-10 px-3 rounded-[10px] bg-slate-50 border border-slate-200 font-mono text-xs font-bold"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full h-10 rounded-[10px] bg-[#FC4C02] text-white text-xs font-black shadow-sm"
                      >
                        دروستکردنی پسوولەی فەرمی
                      </button>
                    </form>
                  )}
                </div>
              )}

              {quickActionModal === 'notifications' && (
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs font-bold text-slate-500 text-center py-6">
                      هیچ ئاگادارکردنەوەیەک نییە
                    </p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => markNotificationRead(n.id)}
                        className={`w-full text-start p-3 rounded-xl border transition-all ${
                          n.read
                            ? 'bg-slate-50 border-slate-200/70 opacity-75'
                            : 'bg-orange-50/50 border-orange-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{n.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">{n.timestamp}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-600 mt-1">{n.message}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
