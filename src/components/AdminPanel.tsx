import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  getAllUsers, 
  getAllDeposits, 
  getAllWithdrawals, 
  getSystemSettings, 
  updateSystemSettings, 
  updateDepositStatus, 
  updateWithdrawalStatus, 
  updateUserStats,
  deleteUserByAdmin,
  deleteMultipleUsersByAdmin,
  updateUserByAdmin,
  addManualWithdrawalByAdmin,
  addManualDepositByAdmin,
  updateDepositByAdmin,
  updateWithdrawalByAdmin,
  uploadFileToStorage,
  subscribeToAllUsers,
  subscribeToAllDeposits,
  subscribeToAllWithdrawals,
  deleteWithdrawalByAdmin,
  deleteDepositByAdmin,
  deleteAllDepositsByAdmin,
  deleteAllWithdrawalsByAdmin,
  subscribeToUserNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateAdminPhone,
  subscribeToAllChats,
  subscribeToSupportMessages,
  sendSupportMessage,
  markChatAsReadByAdmin,
  recordUserActivity
} from '../firebaseService';
import { db } from '../firebase';
import { User, Deposit, Withdrawal, SystemSettings, VipPlan, UserNotification, SupportChat, SupportMessage } from '../types';
import { formatHourToArabic, calculateRemainingEffectiveDays } from '../utils';
import { 
  ShieldAlert, 
  Users, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Settings, 
  Check, 
  X, 
  Edit2, 
  Search, 
  RefreshCw, 
  LogOut, 
  CreditCard,
  Zap,
  Clock,
  MessageSquare,
  Key,
  Send,
  Bell,
  Volume2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  ChevronDown,
  Sun,
  Moon,
  MapPin,
  Globe,
  Calendar,
  Network,
  Share2,
  UserPlus,
  Award,
  CheckCircle2,
  PhoneCall,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck,
  Eye,
  Unlock,
  Copy,
  Phone,
  ExternalLink,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { SignalLogo } from './SignalLogo';
import { getCountryFlagEmoji } from '../locationService';
import VideoPoolManager from './VideoPoolManager';

interface AdminPanelProps {
  adminUser: User;
  onLogout: () => void;
}

export default function AdminPanel({ adminUser, onLogout }: AdminPanelProps) {
  const [adminNotifications, setAdminNotifications] = useState<UserNotification[]>([]);
  const [showAdminNotifModal, setShowAdminNotifModal] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!adminUser) return;
    const unsub = subscribeToUserNotifications(adminUser, (notifList) => {
      setAdminNotifications(notifList);
    });
    return () => unsub();
  }, [adminUser]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'BET',
    rechargeAddress: '',
    rechargeAddressTRC20: '',
    rechargeAddressBEP20: '',
    telegramLink: '',
    minDeposit: 25,
    minWithdrawal: 10,
    holidayActive: false,
    globalNotification: ''
  });
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'teams' | 'deposits' | 'withdrawals' | 'plans' | 'settings' | 'all' | 'support' | 'banned' | 'videoPool'>('overview');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Team Management & Referral Tree States
  const [selectedUserForTeamModal, setSelectedUserForTeamModal] = useState<User | null>(null);
  const [teamModalHistory, setTeamModalHistory] = useState<User[]>([]);
  const [expandedLeaderPhones, setExpandedLeaderPhones] = useState<Record<string, boolean>>({});
  const [teamSearchTerm, setTeamSearchTerm] = useState<string>('');
  const [teamListFilter, setTeamListFilter] = useState<'has_team' | 'all' | 'vip' | 'deposited'>('has_team');
  const [modalLevelFilter, setModalLevelFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [modalMemberSearch, setModalMemberSearch] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleLeaderExpand = (phone: string) => {
    setExpandedLeaderPhones(prev => ({
      ...prev,
      [phone]: !prev[phone]
    }));
  };

  const openTeamModal = (user: User) => {
    setTeamModalHistory([user]);
    setSelectedUserForTeamModal(user);
    setModalLevelFilter('all');
    setModalMemberSearch('');
  };

  const drillDownToMember = (member: User) => {
    setTeamModalHistory(prev => [...prev, member]);
    setSelectedUserForTeamModal(member);
    setModalLevelFilter('all');
    setModalMemberSearch('');
  };

  const goBackInTeamModal = () => {
    setTeamModalHistory(prev => {
      if (prev.length <= 1) {
        setSelectedUserForTeamModal(null);
        return [];
      }
      const nextHistory = prev.slice(0, -1);
      setSelectedUserForTeamModal(nextHistory[nextHistory.length - 1]);
      setModalLevelFilter('all');
      setModalMemberSearch('');
      return nextHistory;
    });
  };

  const closeTeamModal = () => {
    setTeamModalHistory([]);
    setSelectedUserForTeamModal(null);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Map of invite codes to Users for rapid lookups
  const inviteCodeToUserMap = useMemo(() => {
    const map: Record<string, User> = {};
    users.forEach(u => {
      if (u.inviteCode) {
        map[u.inviteCode.trim().toUpperCase()] = u;
      }
    });
    return map;
  }, [users]);

  // Map of direct invites: referrerCode -> User[]
  const directInvitesMap = useMemo(() => {
    const map: Record<string, User[]> = {};
    users.forEach(u => {
      if (u.referrerCode) {
        const ref = u.referrerCode.trim().toUpperCase();
        if (!map[ref]) map[ref] = [];
        map[ref].push(u);
      }
    });
    return map;
  }, [users]);

  // Helper to get structured 3-level team breakdown
  const getUserTeamBreakdown = (user: User | null) => {
    if (!user || !user.inviteCode) {
      return { level1: [], level2: [], level3: [], all: [], directCount: 0, totalCount: 0, depositedCount: 0 };
    }
    const myCode = user.inviteCode.trim().toUpperCase();
    
    // Level 1 (Direct)
    const level1 = directInvitesMap[myCode] || [];
    
    // Level 2 (Indirect 1) -> Empty
    const level2: User[] = [];

    // Level 3 (Indirect 2) -> Empty
    const level3: User[] = [];

    const all = [...level1];
    const depositedCount = all.filter(m => m.hasDeposited === true).length;

    return {
      level1,
      level2,
      level3,
      all,
      directCount: level1.length,
      totalCount: all.length,
      depositedCount
    };
  };

  const filteredTeamUsers = useMemo(() => {
    return users.filter(u => {
      if (!u) return false;
      
      // If we are in 'banned' tab, only show banned. Otherwise hide banned.
      if (activeTab === 'banned') {
        if (!u.isBanned) return false;
      } else {
        if (u.isBanned) return false;
      }
      const q = teamSearchTerm.trim().toLowerCase();
      const uName = u.username || '';
      const uPhone = u.phone || '';
      const matchesSearch = !q || 
        uName.toLowerCase().includes(q) || 
        uPhone.includes(q) || 
        (u.inviteCode && u.inviteCode.toLowerCase().includes(q)) ||
        (u.referrerCode && u.referrerCode.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const teamInfo = getUserTeamBreakdown(u);

      if (teamListFilter === 'has_team') {
        return teamInfo.totalCount > 0;
      }
      if (teamListFilter === 'vip') {
        return u.vipTier && u.vipTier !== 'الباقة العادية' && u.vipTier !== 'VIP0';
      }
      if (teamListFilter === 'deposited') {
        return u.hasDeposited === true;
      }

      return true;
    }).sort((a, b) => {
      const aTeam = getUserTeamBreakdown(a).totalCount;
      const bTeam = getUserTeamBreakdown(b).totalCount;
      if (bTeam !== aTeam) return bTeam - aTeam;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [users, teamSearchTerm, teamListFilter, directInvitesMap]);

  const selectedUserTeam = useMemo(() => {
    if (!selectedUserForTeamModal) return null;
    return getUserTeamBreakdown(selectedUserForTeamModal);
  }, [selectedUserForTeamModal, directInvitesMap]);

  const filteredModalMembers = useMemo(() => {
    if (!selectedUserTeam) return [];
    
    let list: { member: User; level: number }[] = [];
    if (modalLevelFilter === '1') {
      list = selectedUserTeam.level1.map(m => ({ member: m, level: 1 }));
    } else if (modalLevelFilter === '2') {
      list = selectedUserTeam.level2.map(m => ({ member: m, level: 2 }));
    } else if (modalLevelFilter === '3') {
      list = selectedUserTeam.level3.map(m => ({ member: m, level: 3 }));
    } else {
      list = [
        ...selectedUserTeam.level1.map(m => ({ member: m, level: 1 })),
        ...selectedUserTeam.level2.map(m => ({ member: m, level: 2 })),
        ...selectedUserTeam.level3.map(m => ({ member: m, level: 3 }))
      ];
    }

    if (modalMemberSearch.trim()) {
      const q = modalMemberSearch.trim().toLowerCase();
      list = list.filter(item => {
        if (!item?.member) return false;
        const uName = item.member.username || '';
        const uPhone = item.member.phone || '';
        return (
          uName.toLowerCase().includes(q) ||
          uPhone.includes(q) ||
          (item.member.inviteCode && item.member.inviteCode.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [selectedUserTeam, modalLevelFilter, modalMemberSearch]);

  // Support Chat admin states
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread'>('all');
  const adminChatEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to all chats
  useEffect(() => {
    const unsubChats = subscribeToAllChats((updatedChats) => {
      setChats(updatedChats);
    });
    return () => unsubChats();
  }, []);

  // Subscribe to selected chat's messages
  useEffect(() => {
    if (!selectedChatId) return;

    // Mark chat as read by admin
    markChatAsReadByAdmin(selectedChatId).catch(err => console.error("Error marking chat as read:", err));

    const unsubMsgs = subscribeToSupportMessages(selectedChatId, (msgs) => {
      setChatMessages(msgs);
    });

    return () => unsubMsgs();
  }, [selectedChatId]);

  // Scroll to bottom of active admin chat on messages change
  useEffect(() => {
    if (selectedChatId && activeTab === 'support') {
      setTimeout(() => {
        adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages.length, selectedChatId, activeTab]);

  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatId) return;

    const replyText = adminReplyText.trim();
    setAdminReplyText('');

    const activeChat = chats.find(c => c.id === selectedChatId);
    const username = activeChat?.username || selectedChatId;
    const senderName = "المدير - الدعم الفني";

    try {
      await sendSupportMessage(selectedChatId, username, replyText, 'admin', senderName);
    } catch (err) {
      console.error("Error sending admin reply:", err);
      showToast("حدث خطأ أثناء إرسال الرد");
    }
  };
  
  // Settings Inputs
  const [siteNameInput, setSiteNameInput] = useState<string>('BET');
  const [rechargeInput, setRechargeInput] = useState<string>('');
  const [rechargeTRC20Input, setRechargeTRC20Input] = useState<string>('');
  const [rechargeBEP20Input, setRechargeBEP20Input] = useState<string>('');
  const [telegramLinkInput, setTelegramLinkInput] = useState<string>('');
  const [minDepositInput, setMinDepositInput] = useState<number>(25);
  const [minWithdrawalInput, setMinWithdrawalInput] = useState<number>(10);
  const [holidayActiveInput, setHolidayActiveInput] = useState<boolean>(false);
  const [holidayDaysInput, setHolidayDaysInput] = useState<number[]>([5]); // Default to Friday
  const [globalNotificationInput, setGlobalNotificationInput] = useState<string>('');
  const [appDownloadUrlInput, setAppDownloadUrlInput] = useState<string>('');
  const [tasksCodeInput, setTasksCodeInput] = useState<string>('');
  const [hideTrialPlansInput, setHideTrialPlansInput] = useState<boolean>(false);
  const [telegramSupportUsernameInput, setTelegramSupportUsernameInput] = useState<string>('');
  const [signalGroupLinkInput, setSignalGroupLinkInput] = useState<string>('');
  const [showSignalGroupInput, setShowSignalGroupInput] = useState<boolean>(true);
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);
  const [showSendCodeConfirm, setShowSendCodeConfirm] = useState<boolean>(false);

  // Withdrawal lock states
  const [withdrawLockActiveInput, setWithdrawLockActiveInput] = useState<boolean>(false);
  const [withdrawLockDaysInput, setWithdrawLockDaysInput] = useState<number[]>([5]);
  const [withdrawRatesInfoInput, setWithdrawRatesInfoInput] = useState<string>('');

  // Notice alert states
  const [rechargeNoticeInput, setRechargeNoticeInput] = useState<string>('');
  const [rechargeNotice2Input, setRechargeNotice2Input] = useState<string>('');
  const [withdrawNoticeInput, setWithdrawNoticeInput] = useState<string>('');
  const [withdrawNotice2Input, setWithdrawNotice2Input] = useState<string>('');

  // Working hours states (2 shifts)
  const [workingHoursNoticeInput, setWorkingHoursNoticeInput] = useState<string>('');
  const [enforceWorkingHoursInput, setEnforceWorkingHoursInput] = useState<boolean>(true);
  const [workStartHourInput, setWorkStartHourInput] = useState<number>(12);
  const [workEndHourInput, setWorkEndHourInput] = useState<number>(15);
  const [workStartHour2Input, setWorkStartHour2Input] = useState<number>(21);
  const [workEndHour2Input, setWorkEndHour2Input] = useState<number>(1);

  // VIP Plans CRUD states
  const [planNameInput, setPlanNameInput] = useState<string>('');
  const [planPriceInput, setPlanPriceInput] = useState<number>(0);
  const [planProfitInput, setPlanProfitInput] = useState<number>(0);
  const [planTasksInput, setPlanTasksInput] = useState<number>(5);
  const [planSingleTaskRewardInput, setPlanSingleTaskRewardInput] = useState<number>(0.3);
  const [planIsTrialInput, setPlanIsTrialInput] = useState<boolean>(false);
  const [planMaxSubscribersInput, setPlanMaxSubscribersInput] = useState<number>(0);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planIdToDeleteConfirm, setPlanIdToDeleteConfirm] = useState<string | null>(null);

  // Default / Free Membership plan states
  const [defaultTasksLimitInput, setDefaultTasksLimitInput] = useState<number>(2);
  const [defaultTaskRewardInput, setDefaultTaskRewardInput] = useState<number>(1.50);
  
  // Confirm Delete User State (no window.confirm fallback)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Batch User Selection & Delete states
  const [selectedUserPhones, setSelectedUserPhones] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);
  const [batchDeleteProgress, setBatchDeleteProgress] = useState<{ current: number; total: number } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  // States for user balance editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEarnings, setEditEarnings] = useState<number>(0);
  const [editTaskIncome, setEditTaskIncome] = useState<number>(0);
  const [editEffectiveDays, setEditEffectiveDays] = useState<number>(0);

  // States for Advanced User Edit modal
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editUsernameInput, setEditUsernameInput] = useState<string>('');
  const [editPhoneInput, setEditPhoneInput] = useState<string>('');
  const [editPasswordInput, setEditPasswordInput] = useState<string>('');
  const [editWalletAddressInput, setEditWalletAddressInput] = useState<string>('');
  const [editVipTierInput, setEditVipTierInput] = useState<string>('');
  const [editWithdrawalBlocked, setEditWithdrawalBlocked] = useState<boolean>(false);
  const [editBypassHoliday, setEditBypassHoliday] = useState<boolean>(false);
  const [editIsBanned, setEditIsBanned] = useState<boolean>(false);
  const [editBanReason, setEditBanReason] = useState<string>('');

  // States for Manual Withdrawal modal
  const [selectedUserForWithdrawal, setSelectedUserForWithdrawal] = useState<User | null>(null);
  const [showManualWithdrawalModal, setShowManualWithdrawalModal] = useState<boolean>(false);
  const [manualWithPhoneInput, setManualWithPhoneInput] = useState<string>('');
  const [manualWithAmount, setManualWithAmount] = useState<number>(10);
  const [manualWithWallet, setManualWithWallet] = useState<string>('');
  const [manualWithStatus, setManualWithStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [manualWithDate, setManualWithDate] = useState<string>(new Date().toISOString().substring(0, 16)); // YYYY-MM-DDTHH:mm

  // Deposit & Withdrawal Date Sorting States
  const [depositSortOrder, setDepositSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [withdrawalSortOrder, setWithdrawalSortOrder] = useState<'newest' | 'oldest'>('newest');

  // States for Manual Deposit modal
  const [selectedUserForDeposit, setSelectedUserForDeposit] = useState<User | null>(null);
  const [showManualDepositModal, setShowManualDepositModal] = useState<boolean>(false);
  const [manualDepPhoneInput, setManualDepPhoneInput] = useState<string>('');
  const [manualDepAmount, setManualDepAmount] = useState<number>(25);
  const [manualDepCurrency, setManualDepCurrency] = useState<string>('USDT (Polygon)');
  const [manualDepStatus, setManualDepStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [manualDepDate, setManualDepDate] = useState<string>(new Date().toISOString().substring(0, 16));

  // States for Edit Deposit modal
  const [selectedDepositForEdit, setSelectedDepositForEdit] = useState<Deposit | null>(null);
  const [editDepAmount, setEditDepAmount] = useState<number>(0);
  const [editDepCurrency, setEditDepCurrency] = useState<string>('USDT (Polygon)');
  const [editDepStatus, setEditDepStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [editDepDate, setEditDepDate] = useState<string>('');

  // States for Edit Withdrawal modal
  const [selectedWithdrawalForEdit, setSelectedWithdrawalForEdit] = useState<Withdrawal | null>(null);
  const [editWithAmount, setEditWithAmount] = useState<number>(0);
  const [editWithCurrency, setEditWithCurrency] = useState<string>('USDT (BEP20)');
  const [editWithWalletAddress, setEditWithWalletAddress] = useState<string>('');
  const [editWithStatus, setEditWithStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [editWithDate, setEditWithDate] = useState<string>('');

  // States for Admin Phone & Password change
  const [adminPhoneInput, setAdminPhoneInput] = useState<string>(adminUser?.phone || '');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>(adminUser?.rawPassword || adminUser?.password || '');
  const [savingAdminCreds, setSavingAdminCreds] = useState<boolean>(false);
  const [adminCredMsg, setAdminCredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (adminUser) {
      setAdminPhoneInput(adminUser.phone || '');
      setAdminPasswordInput(adminUser.rawPassword || adminUser.password || '');
    }
  }, [adminUser]);

  useEffect(() => {
    if (selectedUserForEdit) {
      setEditUsernameInput(selectedUserForEdit.username || '');
      setEditPhoneInput(selectedUserForEdit.phone || '');
      setEditPasswordInput(selectedUserForEdit.rawPassword || selectedUserForEdit.password || '');
      setEditWalletAddressInput(selectedUserForEdit.walletAddress || '');
      setEditVipTierInput(selectedUserForEdit.vipTier || 'الباقة العادية');
      setEditEarnings(selectedUserForEdit.earnings || 0);
      setEditTaskIncome(selectedUserForEdit.taskIncome || 0);
      setEditEffectiveDays(calculateRemainingEffectiveDays(selectedUserForEdit, settings.holidayDays ?? [5]));
      setEditWithdrawalBlocked(!!selectedUserForEdit.isWithdrawalBlocked);
      setEditBypassHoliday(!!selectedUserForEdit.bypassHoliday);
    }
  }, [selectedUserForEdit]);

  const handleSaveAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCredMsg(null);
    if (!adminPhoneInput.trim()) {
      setAdminCredMsg({ type: 'error', text: 'يرجى إدخال رقم هاتف جديد صالح لتسجيل الدخول' });
      return;
    }
    setSavingAdminCreds(true);
    try {
      const res = await updateAdminPhone(adminUser.phone, adminPhoneInput.trim(), adminPasswordInput.trim());
      if (res.success) {
        setAdminCredMsg({ type: 'success', text: res.message });
        showToast(res.message);
        adminUser.phone = adminPhoneInput.trim();
        if (adminPasswordInput.trim()) {
          adminUser.password = adminPasswordInput.trim();
          adminUser.rawPassword = adminPasswordInput.trim();
        }
      } else {
        setAdminCredMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setAdminCredMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء تعديل بيانات المدير' });
    } finally {
      setSavingAdminCreds(false);
    }
  };



  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [allUsers, allDepos, allWiths, sysSettings] = await Promise.all([
        getAllUsers(),
        getAllDeposits(),
        getAllWithdrawals(),
        getSystemSettings()
      ]);
      setUsers(allUsers);
      setDeposits(allDepos);
      setWithdrawals(allWiths);
      setSettings(sysSettings);
      
      // Initialize inputs from settings
      setSiteNameInput(sysSettings.siteName ?? 'BET');
      setRechargeInput(sysSettings.rechargeAddress ?? '');
      setRechargeTRC20Input(sysSettings.rechargeAddressTRC20 ?? '');
      setRechargeBEP20Input(sysSettings.rechargeAddressBEP20 ?? '');
      setTelegramLinkInput(sysSettings.telegramLink ?? '');
      setMinDepositInput(sysSettings.minDeposit ?? 25);
      setMinWithdrawalInput(sysSettings.minWithdrawal ?? 10);
      setHolidayActiveInput(sysSettings.holidayActive ?? false);
      setHolidayDaysInput(sysSettings.holidayDays ?? [5]);
      setGlobalNotificationInput(sysSettings.globalNotification ?? '');
      setWithdrawLockActiveInput(sysSettings.withdrawLockActive ?? false);
      setWithdrawLockDaysInput(sysSettings.withdrawLockDays ?? [5]);
      setWithdrawRatesInfoInput(sysSettings.withdrawRatesInfo ?? '');
      setRechargeNoticeInput(sysSettings.rechargeNotice ?? '');
      setRechargeNotice2Input(sysSettings.rechargeNotice2 ?? '');
      setWithdrawNoticeInput(sysSettings.withdrawNotice ?? '');
      setWithdrawNotice2Input(sysSettings.withdrawNotice2 ?? '');
      setDefaultTasksLimitInput(sysSettings.defaultTasksLimit ?? 2);
      setDefaultTaskRewardInput(sysSettings.defaultTaskReward ?? 1.50);
      setWorkingHoursNoticeInput(sysSettings.workingHoursNotice ?? '');
      setEnforceWorkingHoursInput(sysSettings.enforceWorkingHours ?? true);
      setWorkStartHourInput(sysSettings.workStartHour ?? 12);
      setWorkEndHourInput(sysSettings.workEndHour ?? 15);
      setWorkStartHour2Input(sysSettings.workStartHour2 ?? 21);
      setWorkEndHour2Input(sysSettings.workEndHour2 ?? 1);
      setAppDownloadUrlInput(sysSettings.appDownloadUrl ?? '');
      setTasksCodeInput(sysSettings.tasksCode ?? '');
      setHideTrialPlansInput(sysSettings.hideTrialPlans ?? false);
      setTelegramSupportUsernameInput(sysSettings.telegramSupportUsername ?? '');
      setSignalGroupLinkInput(sysSettings.signalGroupLink ?? '');
      setShowSignalGroupInput(sysSettings.showSignalGroup !== undefined ? sysSettings.showSignalGroup : true);
    } catch (error) {
      console.error("Error loading admin data:", error);
      showToast("خطأ أثناء تحميل البيانات من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    let heartbeatInterval: any = null;
    if (adminUser?.phone) {
      recordUserActivity(adminUser.phone).catch(e => console.warn(e));
      heartbeatInterval = setInterval(() => {
        recordUserActivity(adminUser.phone).catch(e => console.warn(e));
      }, 45000);
    }

    // Subscribe to live updates so new registrations or actions from any device appear instantly
    const unsubUsers = subscribeToAllUsers((updatedUsers) => {
      if (Array.isArray(updatedUsers)) setUsers(updatedUsers);
    });
    const unsubDepos = subscribeToAllDeposits((updatedDepos) => {
      if (Array.isArray(updatedDepos)) setDeposits(updatedDepos);
    });
    const unsubWiths = subscribeToAllWithdrawals((updatedWiths) => {
      if (Array.isArray(updatedWiths)) setWithdrawals(updatedWiths);
    });

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (unsubUsers) unsubUsers();
      if (unsubDepos) unsubDepos();
      if (unsubWiths) unsubWiths();
    };
  }, [adminUser?.phone]);



  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateSettings = async () => {
    if (!siteNameInput.trim()) {
      showToast("يرجى إدخال اسم الموقع");
      return;
    }

    setUpdating('settings');
    try {
      const updated: SystemSettings = {
        siteName: siteNameInput.trim(),
        rechargeAddress: rechargeInput.trim(),
        rechargeAddressTRC20: rechargeTRC20Input.trim(),
        rechargeAddressBEP20: rechargeBEP20Input.trim(),
        telegramLink: telegramLinkInput.trim(),
        minDeposit: Number(minDepositInput),
        minWithdrawal: Number(minWithdrawalInput),
        holidayActive: holidayActiveInput,
        holidayDays: holidayDaysInput,
        globalNotification: globalNotificationInput.trim(),
        withdrawLockActive: withdrawLockActiveInput,
        withdrawLockDays: withdrawLockDaysInput,
        withdrawRatesInfo: withdrawRatesInfoInput.trim(),
        rechargeNotice: rechargeNoticeInput.trim(),
        rechargeNotice2: rechargeNotice2Input.trim(),
        withdrawNotice: withdrawNoticeInput.trim(),
        withdrawNotice2: withdrawNotice2Input.trim(),
        defaultTasksLimit: Number(defaultTasksLimitInput),
        defaultTaskReward: Number(defaultTaskRewardInput),
        workingHoursNotice: workingHoursNoticeInput.trim(),
        enforceWorkingHours: enforceWorkingHoursInput,
        workStartHour: Number(workStartHourInput),
        workEndHour: Number(workEndHourInput),
        workStartHour2: Number(workStartHour2Input),
        workEndHour2: Number(workEndHour2Input),
        appDownloadUrl: appDownloadUrlInput.trim(),
        tasksCode: tasksCodeInput.trim(),
        hideTrialPlans: hideTrialPlansInput,
        supportAgentName: settings.supportAgentName,
        supportAgentSubtitle: settings.supportAgentSubtitle,
        supportAgentAvatar: settings.supportAgentAvatar,
        supportFaqs: settings.supportFaqs,
        telegramSupportUsername: telegramSupportUsernameInput.trim(),
        signalGroupLink: signalGroupLinkInput.trim(),
        showSignalGroup: showSignalGroupInput,
        vipPlans: settings.vipPlans ?? [
          { id: 'plan_600', name: 'باقة 600$', price: 600, profit: 18, tasksCount: 5 },
          { id: 'plan_1200', name: 'باقة 1200$', price: 1200, profit: 38, tasksCount: 5 }
        ]
      };
      await updateSystemSettings(updated);
      setSettings(updated);
      showToast("تم تحديث إعدادات المنصة بنجاح! جاري تحديث الصفحة تلقائياً...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast("فشل في تحديث الإعدادات");
    } finally {
      setUpdating(null);
    }
  };

  const handleSendCodeToSubscribers = async (confirmed?: boolean) => {
    const code = tasksCodeInput.trim();
    if (!code) {
      showToast("⚠️ يرجى تعيين رمز مهام صالح أولاً!");
      return;
    }

    if (!confirmed) {
      setShowSendCodeConfirm(true);
      return;
    }

    setShowSendCodeConfirm(false);
    setSendingNotification(true);
    try {
      const msg = `🔑 رمز المهام اليومي الجديد لفتح السجل الخاص بك هو: ${code}`;
      
      // Get only active subscribers (المشتركين الفعليين بباقات VIP أو أصحاب الإيداعات)
      const subscribers = users.filter(u => 
        u.role !== 'admin' && (
          u.hasDeposited === true || 
          (u.vipTier && u.vipTier !== 'الباقة العادية' && u.vipTier !== 'VIP0' && u.vipTier.trim() !== '')
        )
      );

      if (subscribers.length === 0) {
        showToast("⚠️ تنبيه: لا يوجد مشتركون باقات VIP حالياً لإرسال الرمز إليهم.");
        return;
      }

      // Send dedicated notification to each subscriber's personal account
      await Promise.all(
        subscribers.map(sub => {
          const target = sub.phone || sub.id;
          return createNotification(target, msg);
        })
      );
      
      showToast(`🎉 تم إرسال الرمز اليومي بنجاح إلى المشتركين فقط (${subscribers.length} مشترك) ولن يظهر لغير المشتركين! 👑`);
    } catch (err) {
      console.error("Error sending daily code to subscribers:", err);
      showToast("⚠️ حدث خطأ أثناء إرسال الإشعار.");
    } finally {
      setSendingNotification(false);
    }
  };

  const handleDepositAction = async (dep: Deposit, status: 'approved' | 'rejected') => {
    setUpdating(`dep_${dep.id}`);
    try {
      await updateDepositStatus(dep.id, status, dep.phone, dep.amount);
      showToast(status === 'approved' ? "تمت الموافقة على الإيداع وإضافة الرصيد للعضو! جاري التحديث تلقائياً..." : "تم رفض طلب الإيداع! جاري التحديث تلقائياً...");
      await loadAdminData(); // refresh
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast("حدث خطأ أثناء معالجة الطلب");
    } finally {
      setUpdating(null);
    }
  };

  const handleWithdrawalAction = async (withd: Withdrawal, status: 'approved' | 'rejected') => {
    setUpdating(`with_${withd.id}`);
    try {
      await updateWithdrawalStatus(withd.id, status, withd.phone, withd.amount);
      showToast(status === 'approved' ? "تم تأكيد السحب وخصم الرصيد نهائياً! جاري التحديث تلقائياً..." : "تم رفض السحب وإعادة الرصيد للعضو! جاري التحديث تلقائياً...");
      await loadAdminData(); // refresh
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast("حدث خطأ أثناء معالجة الطلب");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteWithdrawal = async (withdrawalId: string) => {
    setUpdating(`delete_with_${withdrawalId}`);
    try {
      await deleteWithdrawalByAdmin(withdrawalId);
      showToast("تم حذف طلب السحب بنجاح من النظام!");
      setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
    } catch (err) {
      showToast("حدث خطأ أثناء محاولة حذف طلب السحب");
    } finally {
      setUpdating(null);
    }
  };

  const handleEditUserClick = (u: User) => {
    setEditingUserId(u.id);
    setEditEarnings(u.earnings);
    setEditTaskIncome(u.taskIncome);
    setEditEffectiveDays(calculateRemainingEffectiveDays(u, settings.holidayDays ?? [5]));
    setShowDeleteConfirm(false);
  };

  const handleSaveUserStats = async (phone: string) => {
    setUpdating(`save_user_${phone}`);
    try {
      await updateUserStats(phone, {
        earnings: editEarnings,
        taskIncome: editTaskIncome,
        effectiveDays: editEffectiveDays,
        vipStartDate: new Date().toISOString()
      });
      showToast("تم تحديث بيانات العضو بنجاح! جاري التحديث تلقائياً...");
      setEditingUserId(null);
      await loadAdminData();
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast("فشل في حفظ التعديلات");
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveAdvancedUserEdit = async () => {
    if (!selectedUserForEdit) return;
    setUpdating('save_advanced_user');
    try {
      const targetId = selectedUserForEdit.id || selectedUserForEdit.phone;
      const updatedPlan = editVipTierInput;
      await updateUserByAdmin(targetId, {
        username: editUsernameInput.trim(),
        password: editPasswordInput.trim(),
        walletAddress: editWalletAddressInput.trim(),
        vipTier: updatedPlan,
        earnings: Number(editEarnings),
        taskIncome: Number(editTaskIncome),
        effectiveDays: Number(editEffectiveDays),
        vipStartDate: new Date().toISOString(),
        isWithdrawalBlocked: editWithdrawalBlocked,
        bypassHoliday: editBypassHoliday,
        isBanned: editIsBanned,
        banReason: editBanReason
      });

      setUsers(prev => prev.map(u => {
        if (u.phone === targetId || u.id === targetId) {
          return {
            ...u,
            username: editUsernameInput.trim(),
            password: editPasswordInput.trim() || u.password,
            rawPassword: editPasswordInput.trim() || u.rawPassword,
            walletAddress: editWalletAddressInput.trim() || u.walletAddress,
            vipTier: updatedPlan,
            earnings: Number(editEarnings),
            taskIncome: Number(editTaskIncome),
            effectiveDays: Number(editEffectiveDays),
            vipStartDate: new Date().toISOString(),
            isWithdrawalBlocked: editWithdrawalBlocked,
            bypassHoliday: editBypassHoliday,
            isBanned: editIsBanned,
            banReason: editBanReason
          };
        }
        return u;
      }));

      showToast(`🎉 تم حفظ وتحديث بيانات العضو بنجاح!`);
      setSelectedUserForEdit(null);
    } catch (err) {
      showToast("حدث خطأ أثناء تحديث بيانات العضو");
    } finally {
      setUpdating(null);
    }
  };

  const handleQuickBan = async (phone: string, isBanned: boolean, reason: string, id?: string) => {
    try {
      const target = id || phone;
      if (!target) {
        showToast('❌ عذراً، لا يمكن تحديد معرف العضو');
        return;
      }
      
      setUpdating(`quick_ban_${target}`);
      await updateUserByAdmin(target, { isBanned, banReason: reason });
      
      showToast(isBanned ? '✅ تم حظر المستخدم بنجاح' : '✅ تم إلغاء حظر المستخدم بنجاح');
      
      // Update local state immediately for better UX
      setUsers(prev => prev.map(u => {
        const uId = u.id || u.phone;
        if (uId === target || u.phone === target || u.id === target) {
          return { ...u, isBanned, banReason: reason };
        }
        return u;
      }));

      // No need to loadAdminData() as subscribeToAllUsers will handle real-time sync
    } catch (err) {
      console.error('Quick ban failed:', err);
      showToast('❌ فشل في تنفيذ العملية، يرجى المحاولة لاحقاً');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForEdit) return;
    const targetPhone = selectedUserForEdit.phone;
    setUpdating('delete_user');
    try {
      await deleteUserByAdmin(targetPhone);
      setUsers(prev => prev.filter(u => u.phone !== targetPhone));
      setSelectedUserPhones(prev => prev.filter(p => p !== targetPhone));
      showToast("تم حذف العضو بالكامل من قاعدة البيانات بنجاح!");
      setSelectedUserForEdit(null);
      setShowDeleteConfirm(false);
      await loadAdminData();
    } catch (err) {
      showToast("حدث خطأ أثناء محاولة حذف العضو");
    } finally {
      setUpdating(null);
    }
  };

  const toggleSelectUser = (phone: string) => {
    setSelectedUserPhones(prev => 
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const toggleSelectAllVisibleUsers = () => {
    const visiblePhones = filteredUsers.map(u => u.phone);
    const allVisibleSelected = visiblePhones.length > 0 && visiblePhones.every(p => selectedUserPhones.includes(p));
    if (allVisibleSelected) {
      setSelectedUserPhones(prev => prev.filter(p => !visiblePhones.includes(p)));
    } else {
      setSelectedUserPhones(prev => Array.from(new Set([...prev, ...visiblePhones])));
    }
  };

  const handleSelectAllOfflineUsers = () => {
    const offlinePhones = users.filter(u => !isUserOnline(u)).map(u => u.phone);
    if (offlinePhones.length === 0) {
      showToast("لا يوجد أعضاء غير نشطين حالياً لتحديدهم");
      return;
    }
    setSelectedUserPhones(Array.from(new Set(offlinePhones)));
    showToast(`تم تحديد ${offlinePhones.length} عضو غير نشط`);
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedUserPhones.length === 0) return;
    setUpdating('batch_delete_users');
    const total = selectedUserPhones.length;
    setBatchDeleteProgress({ current: 0, total });
    
    try {
      let successCount = 0;
      for (let i = 0; i < selectedUserPhones.length; i++) {
        const phone = selectedUserPhones[i];
        setBatchDeleteProgress({ current: i + 1, total });
        try {
          await deleteUserByAdmin(phone);
          successCount++;
        } catch (e) {
          console.warn("Error in batch delete for phone:", phone, e);
        }
      }
      
      const deletedPhones = [...selectedUserPhones];
      setUsers(prev => prev.filter(u => !deletedPhones.includes(u.phone)));
      setSelectedUserPhones([]);
      setShowBatchDeleteModal(false);
      showToast(`✅ تم بنجاح حذف ${successCount} عضو من أصل ${total} عضو محدد!`);
      await loadAdminData();
    } catch (err) {
      showToast("حدث خطأ أثناء تنفيذ الحذف الجماعي للأعضاء");
    } finally {
      setUpdating(null);
      setBatchDeleteProgress(null);
    }
  };

  const handleAddOrUpdatePlan = async () => {
    if (!planNameInput.trim()) {
      showToast("يرجى إدخال اسم الباقة");
      return;
    }
    if (planPriceInput < 0 || planTasksInput <= 0 || planSingleTaskRewardInput <= 0) {
      showToast("يرجى إدخال قيم صالحة للسعر وعدد المهام وسعر المهمة");
      return;
    }

    setUpdating('vip_plans');
    try {
      const calculatedProfit = Number((planTasksInput * planSingleTaskRewardInput).toFixed(2));
      const currentPlans = settings.vipPlans ? [...settings.vipPlans] : [];
      if (editingPlanId) {
        const idx = currentPlans.findIndex(p => p.id === editingPlanId);
        if (idx !== -1) {
          currentPlans[idx] = {
            id: editingPlanId,
            name: planNameInput.trim(),
            price: Number(planPriceInput),
            profit: calculatedProfit,
            tasksCount: Number(planTasksInput),
            isTrial: planIsTrialInput,
            maxSubscribers: Number(planMaxSubscribersInput)
          };
        }
      } else {
        const newPlan: VipPlan = {
          id: `plan_${Date.now()}`,
          name: planNameInput.trim(),
          price: Number(planPriceInput),
          profit: calculatedProfit,
          tasksCount: Number(planTasksInput),
          isTrial: planIsTrialInput,
          maxSubscribers: Number(planMaxSubscribersInput)
        };
        currentPlans.push(newPlan);
      }

      const updatedSettings: SystemSettings = {
        ...settings,
        vipPlans: currentPlans
      };

      await updateSystemSettings(updatedSettings);
      setSettings(updatedSettings);
      showToast(editingPlanId ? "تم تعديل باقة الاشتراك بنجاح! جاري التحديث تلقائياً..." : "تم إضافة باقة الاشتراك بنجاح! جاري التحديث تلقائياً...");
      
      setPlanNameInput('');
      setPlanPriceInput(0);
      setPlanProfitInput(0);
      setPlanTasksInput(5);
      setPlanSingleTaskRewardInput(0.3);
      setEditingPlanId(null);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      console.error(e);
      showToast("فشل في تعديل الباقات");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    setUpdating('vip_plans');
    try {
      const currentPlans = settings.vipPlans ? settings.vipPlans.filter(p => p.id !== planId) : [];
      const updatedSettings: SystemSettings = {
        ...settings,
        vipPlans: currentPlans
      };
      await updateSystemSettings(updatedSettings);
      setSettings(updatedSettings);
      showToast("تم حذف الباقة بنجاح! جاري التحديث تلقائياً...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      console.error(e);
      showToast("فشل في حذف الباقة");
    } finally {
      setUpdating(null);
    }
  };

  const handleMovePlan = async (planId: string, direction: 'top' | 'up' | 'down' | 'bottom') => {
    if (!settings.vipPlans || settings.vipPlans.length <= 1) return;
    const currentPlans = [...settings.vipPlans];
    const idx = currentPlans.findIndex(p => p.id === planId);
    if (idx === -1) return;

    if (direction === 'top') {
      if (idx === 0) return;
      const [moved] = currentPlans.splice(idx, 1);
      currentPlans.unshift(moved);
    } else if (direction === 'bottom') {
      if (idx === currentPlans.length - 1) return;
      const [moved] = currentPlans.splice(idx, 1);
      currentPlans.push(moved);
    } else if (direction === 'up') {
      if (idx === 0) return;
      const temp = currentPlans[idx];
      currentPlans[idx] = currentPlans[idx - 1];
      currentPlans[idx - 1] = temp;
    } else if (direction === 'down') {
      if (idx === currentPlans.length - 1) return;
      const temp = currentPlans[idx];
      currentPlans[idx] = currentPlans[idx + 1];
      currentPlans[idx + 1] = temp;
    }

    setUpdating(`reorder_${planId}`);
    try {
      const updatedSettings: SystemSettings = {
        ...settings,
        vipPlans: currentPlans
      };
      await updateSystemSettings(updatedSettings);
      setSettings(updatedSettings);
      showToast(
        direction === 'top' ? "تم جعل هذه الباقة الأولى في الترتيب بنجاح!" :
        direction === 'bottom' ? "تم جعل هذه الباقة الأخيرة في الترتيب بنجاح!" :
        "تم تغيير ترتيب الباقة بنجاح!"
      );
    } catch (e) {
      showToast("فشل في تعديل ترتيب الباقات");
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateManualWithdrawal = async () => {
    const phone = selectedUserForWithdrawal ? selectedUserForWithdrawal.phone : manualWithPhoneInput.trim();
    if (!phone) {
      showToast("يرجى اختيار العضو أو كتابة رقم الهاتف");
      return;
    }
    if (manualWithAmount <= 0) {
      showToast("يرجى إدخال مبلغ سحب صالح");
      return;
    }
    setUpdating('create_manual_withdrawal');
    try {
      const isoDate = new Date(manualWithDate).toISOString();
      await addManualWithdrawalByAdmin(
        phone,
        Number(manualWithAmount),
        manualWithWallet.trim(),
        manualWithStatus,
        isoDate
      );
      showToast("تم تسجيل السحب اليدوي بنجاح! جاري التحديث تلقائياً...");
      setSelectedUserForWithdrawal(null);
      setShowManualWithdrawalModal(false);
      setManualWithPhoneInput('');
      await loadAdminData();
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast("فشل في تسجيل السحب اليدوي");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteDeposit = async (depositId: string) => {
    setUpdating(`delete_dep_${depositId}`);
    try {
      await deleteDepositByAdmin(depositId);
      showToast("تم حذف سجل الإيداع بنجاح من النظام!");
      setDeposits(prev => prev.filter(d => d.id !== depositId));
    } catch (err) {
      showToast("حدث خطأ أثناء محاولة حذف سجل الإيداع");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteAllDeposits = async () => {
    setUpdating('delete_all_deposits');
    try {
      await deleteAllDepositsByAdmin();
      showToast("تم مسح جميع سجلات الإيداع بنجاح!");
      setDeposits([]);
    } catch (err) {
      showToast("حدث خطأ أثناء محاولة مسح سجلات الإيداع");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteAllWithdrawals = async () => {
    setUpdating('delete_all_withdrawals');
    try {
      await deleteAllWithdrawalsByAdmin();
      showToast("تم مسح جميع سجلات السحب بنجاح!");
      setWithdrawals([]);
    } catch (err) {
      showToast("حدث خطأ أثناء محاولة مسح سجلات السحب");
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateManualDeposit = async () => {
    const phone = selectedUserForDeposit ? selectedUserForDeposit.phone : manualDepPhoneInput.trim();
    if (!phone) {
      showToast("يرجى اختيار العضو أو كتابة رقم الهاتف");
      return;
    }
    if (manualDepAmount <= 0) {
      showToast("يرجى إدخال مبلغ إيداع صالح");
      return;
    }
    setUpdating('create_manual_deposit');
    try {
      const isoDate = new Date(manualDepDate).toISOString();
      await addManualDepositByAdmin(
        phone,
        Number(manualDepAmount),
        manualDepCurrency,
        manualDepStatus,
        isoDate
      );
      showToast("تم تسجيل الإيداع اليدوي بنجاح! جاري التحديث...");
      setSelectedUserForDeposit(null);
      setShowManualDepositModal(false);
      setManualDepPhoneInput('');
      await loadAdminData();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      showToast("فشل في تسجيل الإيداع اليدوي");
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateDepositSubmit = async () => {
    if (!selectedDepositForEdit) return;
    if (editDepAmount <= 0) {
      showToast("يرجى إدخال مبلغ صالح");
      return;
    }
    setUpdating(`edit_dep_${selectedDepositForEdit.id}`);
    try {
      const isoDate = new Date(editDepDate).toISOString();
      await updateDepositByAdmin(selectedDepositForEdit.id, {
        amount: Number(editDepAmount),
        currency: editDepCurrency,
        status: editDepStatus,
        createdAt: isoDate
      });
      showToast("تم تعديل سجل الإيداع بنجاح!");
      setSelectedDepositForEdit(null);
      await loadAdminData();
    } catch (err) {
      showToast("فشل في تعديل سجل الإيداع");
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateWithdrawalSubmit = async () => {
    if (!selectedWithdrawalForEdit) return;
    if (editWithAmount <= 0) {
      showToast("يرجى إدخال مبلغ صالح");
      return;
    }
    setUpdating(`edit_with_${selectedWithdrawalForEdit.id}`);
    try {
      const isoDate = new Date(editWithDate).toISOString();
      await updateWithdrawalByAdmin(selectedWithdrawalForEdit.id, {
        amount: Number(editWithAmount),
        currency: editWithCurrency,
        walletAddress: editWithWalletAddress.trim(),
        status: editWithStatus,
        createdAt: isoDate
      });
      showToast("تم تعديل سجل السحب بنجاح!");
      setSelectedWithdrawalForEdit(null);
      await loadAdminData();
    } catch (err) {
      showToast("فشل في تعديل سجل السحب");
    } finally {
      setUpdating(null);
    }
  };

  // User Online Filter State
  const [userOnlineFilter, setUserOnlineFilter] = useState<'all' | 'online' | 'offline'>('all');

  const isUserOnline = (u: User) => {
    if (!u) return false;
    if (adminUser && u.phone === adminUser.phone) return true;
    
    // To be considered online, a user must have been active recently (within the last 3 minutes)
    // We do not rely on u.isOnline === true alone, because users usually close the app/tab without explicit logout,
    // leaving u.isOnline as true in Firestore indefinitely.
    if (u.lastActiveAt) {
      const activeMs = new Date(u.lastActiveAt).getTime();
      if (!isNaN(activeMs)) {
        const diff = Date.now() - activeMs;
        // Active within last 3 minutes = online now
        return diff >= 0 && diff < 3 * 60 * 1000;
      }
    }
    
    // Fallback: If lastActiveAt is missing but they are marked as online and logged in within the last 3 minutes
    if (u.isOnline === true && u.lastLoginAt) {
      const loginMs = new Date(u.lastLoginAt).getTime();
      if (!isNaN(loginMs)) {
        const diff = Date.now() - loginMs;
        return diff >= 0 && diff < 3 * 60 * 1000;
      }
    }
    
    return false;
  };

  // Filter users based on phone or username search and online status
  const filteredUsers = users.filter(u => {
    if (!u) return false;
    
    // Handle banned tab vs regular tabs
    if (activeTab === 'banned') {
      if (!u.isBanned) return false;
    } else {
      if (u.isBanned) return false;
    }
    const uName = u.username || '';
    const uPhone = u.phone || '';
    const matchesSearch = uName.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      uPhone.includes(searchQuery || '');
    if (!matchesSearch) return false;

    if (userOnlineFilter === 'online') {
      return isUserOnline(u);
    } else if (userOnlineFilter === 'offline') {
      return !isUserOnline(u);
    }
    return true;
  });

  const filteredDeposits = deposits.filter(d => d && (depositFilter === 'all' ? true : d.status === depositFilter));
  const sortedDeposits = [...filteredDeposits].sort((a, b) => {
    const tA = new Date(a?.createdAt || 0).getTime();
    const tB = new Date(b?.createdAt || 0).getTime();
    return depositSortOrder === 'newest' ? tB - tA : tA - tB;
  });

  const filteredWithdrawals = withdrawals.filter(w => w && (withdrawalFilter === 'all' ? true : w.status === withdrawalFilter));
  const sortedWithdrawals = [...filteredWithdrawals].sort((a, b) => {
    const tA = new Date(a?.createdAt || 0).getTime();
    const tB = new Date(b?.createdAt || 0).getTime();
    return withdrawalSortOrder === 'newest' ? tB - tA : tA - tB;
  });

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800 pb-20" dir="rtl">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-xl text-xs font-semibold border border-white/10 animate-fadeIn">
          {notification}
        </div>
      )}

      {/* Top Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-100 animate-pulse" />
            <div>
              <h1 className="text-base font-extrabold">لوحة تحكم الإدارة (الأدمن)</h1>
              <p className="text-[10px] text-red-100">تحكم كامل بالأعضاء، الحسابات، الأرصدة، الشحن والسحب</p>
            </div>
          </div>
          <div className="flex items-center gap-2">

            <button
              onClick={() => setShowAdminNotifModal(true)}
              className="relative p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all cursor-pointer flex items-center justify-center text-white"
              title="إشعارات الإدارة"
            >
              <Bell className="w-5 h-5 text-white" />
              {adminNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-extrabold text-[9px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-bounce border border-red-700">
                  {adminNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            <button 
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Navigation Tabs Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 py-2.5 min-w-max">
            {[
              { id: 'overview', label: 'الرئيسية والإحصائيات', icon: ShieldAlert, badge: null },
              { id: 'users', label: 'قائمة الأعضاء', icon: Users, badge: users.filter(u => !u.isBanned).length },
              { 
                id: 'teams', 
                label: 'الفريق', 
                icon: Network, 
                badge: users.filter(u => !u.isBanned && (directInvitesMap[u.inviteCode?.trim().toUpperCase() || ''] || []).length > 0).length,
                badgeColor: 'bg-indigo-100 text-indigo-700 font-extrabold'
              },
              { 
                id: 'deposits', 
                label: 'طلبات الإيداع', 
                icon: ArrowDownCircle, 
                badge: deposits.filter(d => d.status === 'pending').length,
                badgeColor: deposits.filter(d => d.status === 'pending').length > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
              },
              { 
                id: 'withdrawals', 
                label: 'طلبات السحب', 
                icon: ArrowUpCircle, 
                badge: withdrawals.filter(w => w.status === 'pending').length,
                badgeColor: withdrawals.filter(w => w.status === 'pending').length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
              },
              { id: 'plans', label: 'باقات VIP', icon: Zap, badge: settings.vipPlans?.length || 0 },
              { id: 'settings', label: 'إعدادات المنصة', icon: Settings, badge: null },
              { id: 'all', label: 'العرض الشامل', icon: RefreshCw, badge: null },
              { 
                id: 'support', 
                label: 'الدعم الفني والرسائل', 
                icon: MessageSquare, 
                badge: chats.filter(c => c.unreadByAdmin).length > 0 ? chats.filter(c => c.unreadByAdmin).length : null,
                badgeColor: 'bg-green-500 text-white animate-pulse font-extrabold'
              },
              {
                id: 'banned',
                label: 'سجلات المحظورين',
                icon: ShieldAlert,
                badge: users.filter(u => u.isBanned).length,
                badgeColor: 'bg-rose-100 text-rose-700 font-extrabold'
              }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md font-extrabold ring-2 ring-red-500/20'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700')
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overview Dashboard Tab View */}
      {activeTab === 'overview' && (
        <div className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
          {/* Main Dashboard Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400">إجمالي الأعضاء</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-extrabold text-slate-800">{users.filter(u => !u.isBanned).length}</span>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400">إجمالي الإيداعات</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-extrabold text-emerald-600">{deposits.length}</span>
                <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400">إجمالي السحوبات</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-extrabold text-amber-600">{withdrawals.length}</span>
                <ArrowUpCircle className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400">إيداعات معلقة</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-extrabold text-rose-600">
                  {deposits.filter(d => d.status === 'pending').length}
                </span>
                <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400">سحوبات معلقة</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-extrabold text-amber-500">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400">المشتركون في VIP</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-extrabold text-purple-600">
                  {users.filter(u => !u.isBanned && u.vipTier && u.vipTier.trim() !== '' && u.vipTier !== 'الباقة العادية' && u.vipTier !== 'العادية').length}
                </span>
                <Zap className="w-5 h-5 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400">أعضاء محظورون</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-extrabold text-rose-800">{users.filter(u => u.isBanned).length}</span>
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>اختصارات التصفح والتحكم السريع</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <button
                onClick={() => setActiveTab('users')}
                className="p-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/60 rounded-xl text-right transition-all cursor-pointer group"
              >
                <Users className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">إدارة الأعضاء</div>
                <div className="text-[10px] text-slate-500">{users.filter(u => !u.isBanned).length} عضو مسجل</div>
              </button>

              <button
                onClick={() => setActiveTab('deposits')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 rounded-xl text-right transition-all cursor-pointer group"
              >
                <ArrowDownCircle className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">طلبات الإيداع</div>
                <div className="text-[10px] text-emerald-600 font-bold">
                  {deposits.filter(d => d.status === 'pending').length} طلب معلق
                </div>
              </button>

              <button
                onClick={() => setActiveTab('withdrawals')}
                className="p-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60 rounded-xl text-right transition-all cursor-pointer group"
              >
                <ArrowUpCircle className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">طلبات السحب</div>
                <div className="text-[10px] text-amber-600 font-bold">
                  {withdrawals.filter(w => w.status === 'pending').length} طلب معلق
                </div>
              </button>

              <button
                onClick={() => setActiveTab('plans')}
                className="p-3 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/60 rounded-xl text-right transition-all cursor-pointer group"
              >
                <Zap className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">باقات VIP والمهام</div>
                <div className="text-[10px] text-slate-500">{settings.vipPlans?.length || 0} باقة متاحة</div>
              </button>

              <button
                onClick={() => setActiveTab('videoPool')}
                className="p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl text-right transition-all cursor-pointer group"
              >
                <Youtube className="w-5 h-5 text-rose-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">روابط مهام الفيديو</div>
                <div className="text-[10px] text-slate-500">يوتيوب / تيك توك / فيسبوك / انستقرام</div>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className="p-3 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-right transition-all cursor-pointer group"
              >
                <Settings className="w-5 h-5 text-slate-700 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">إعدادات المنصة</div>
                <div className="text-[10px] text-slate-500">الشبكات وساعات العمل</div>
              </button>

              <button
                onClick={() => setActiveTab('banned')}
                className="p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl text-right transition-all cursor-pointer group"
              >
                <ShieldAlert className="w-5 h-5 text-rose-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">سجلات المحظورين</div>
                <div className="text-[10px] text-slate-500">{users.filter(u => u.isBanned).length} عضو محظور</div>
              </button>
            </div>
          </div>

          {/* Operational Status Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400">حالة العطلة الرسمية</div>
                <div className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {holidayActiveInput ? 'مفعلة (السحب مغلق)' : 'غير مفعلة (متاح العادي)'}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                holidayActiveInput ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {holidayActiveInput ? 'مقفل' : 'نشط'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400">حالة قفل السحب الدوري</div>
                <div className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {withdrawLockActiveInput ? 'مفعل بالساعات' : 'سحب مفتوح دائماً'}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                withdrawLockActiveInput ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {withdrawLockActiveInput ? 'مقيد' : 'مفتوح'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400">ساعات العمل الرسمية (الفترتان)</div>
                <div className="text-xs font-extrabold text-slate-800 mt-0.5" dir="ltr">
                  {formatHourToArabic(workStartHourInput)}-{formatHourToArabic(workEndHourInput)} | {formatHourToArabic(workStartHour2Input)}-{formatHourToArabic(workEndHour2Input)}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                enforceWorkingHoursInput ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {enforceWorkingHoursInput ? 'مطبقة' : 'غير مجبرة'}
              </span>
            </div>
          </div>
        </div>
      )}



      {activeTab !== 'overview' && (
        <div className={`max-w-6xl mx-auto px-4 mt-6 ${
          activeTab === 'all' ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : 'space-y-6'
        }`}>
          
          {/* Main Content Column */}
          <div className={activeTab === 'all' ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
            
            {/* Table: Registered Users Panel */}
            {(activeTab === 'users' || activeTab === 'all' || activeTab === 'banned') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                <h2 className="text-xs font-bold text-slate-700">قائمة الأعضاء وتعديل الأرصدة الفوري</h2>
              </div>

              {/* Online / Offline Filter Pills & Quick Batch Selectors */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-[10px] font-bold">
                  {[
                    { id: 'all', label: `الكل (${users.filter(u => !u.isBanned).length})` },
                    { id: 'online', label: `🟢 نشط الآن (${users.filter(u => !u.isBanned && isUserOnline(u)).length})` },
                    { id: 'offline', label: `🔴 غير نشط (${users.filter(u => !u.isBanned && !isUserOnline(u)).length})` }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserOnlineFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        userOnlineFilter === f.id ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Quick Selection Helpers */}
                <button
                  type="button"
                  onClick={toggleSelectAllVisibleUsers}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-[10px] font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  title="تحديد كل المعروضين حالياً"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>{filteredUsers.length > 0 && filteredUsers.every(u => selectedUserPhones.includes(u.phone)) ? 'إلغاء تحديد المعروضين' : 'تحديد كل المعروضين'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectAllOfflineUsers}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-[10px] font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  title="تحديد جميع الأعضاء غير النشطين للحذف"
                >
                  <span>تحديد غير النشطين</span>
                </button>
              </div>

              <div className="relative max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو برقم الهاتف..."
                  className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                />
              </div>
            </div>

            {/* Batch Selection Action Bar (Appears when members are selected) */}
            {selectedUserPhones.length > 0 && (
              <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    {selectedUserPhones.length}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-950">
                        تم تحديد {selectedUserPhones.length} عضو من أصل {users.filter(u => !u.isBanned).length}
                      </span>
                      <span className="bg-red-200/80 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                        جاهز للحذف الجماعي
                      </span>
                    </div>
                    <span className="text-[10px] text-red-700 font-medium block">
                      سيتم حذف جميع الأعضاء المحددين وبياناتهم كاملة دفعة واحدة بضغطة زر.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowBatchDeleteModal(true)}
                    disabled={updating !== null}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-red-600/25 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الأعضاء المحددين ({selectedUserPhones.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedUserPhones([])}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-500 border-b border-slate-200">
                    <th className="p-3 font-bold text-center w-12">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserPhones.includes(u.phone))}
                          onChange={toggleSelectAllVisibleUsers}
                          title="تحديد أو إلغاء تحديد الكل في هذه الصفحة"
                          className="w-4 h-4 text-red-600 bg-white border-slate-300 rounded focus:ring-red-500 cursor-pointer accent-red-600"
                        />
                      </div>
                    </th>
                    <th className="p-3 font-bold">تفاصيل العضو (اسم، هاتف، كلمة مرور)</th>
                    <th className="p-3 font-bold">تاريخ التسجيل والنشاط (داخل/خارج)</th>
                    <th className="p-3 font-bold">رمز الدعوة والباقة</th>
                    <th className="p-3 font-bold">الرصيد الكلي (الأرباح)</th>
                    <th className="p-3 font-bold">دخل المهمة</th>
                    <th className="p-3 font-bold">أيام العمل</th>
                    <th className="p-3 font-bold">المحفظة المرتبطة</th>
                    <th className="p-3 font-bold text-center">خيارات التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        جاري تحميل قائمة الأعضاء...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        لا يوجد أعضاء يطابقون البحث حالياً.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const isEditing = editingUserId === u.id;
                      const isSelected = selectedUserPhones.includes(u.phone);
                      return (
                        <tr 
                          key={`${u.phone || u.id}_${idx}`} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-red-50/60 hover:bg-red-50/80 border-r-4 border-r-red-500' 
                              : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="p-3 text-center w-12" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectUser(u.phone)}
                                className="w-4 h-4 text-red-600 bg-white border-slate-300 rounded focus:ring-red-500 cursor-pointer accent-red-600"
                                title="تحديد العضو للحذف الجماعي"
                              />
                            </div>
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="font-bold text-slate-800">{u.username}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1" dir="ltr">
                              <span className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-600">الهاتف:</span>
                              <span>{u.phone}</span>
                            </div>
                            {u.email && (
                              <div className="text-[10px] text-blue-700 bg-blue-50/80 border border-blue-200/70 px-1.5 py-0.5 rounded flex items-center justify-between gap-1 mt-0.5" dir="ltr">
                                <div className="flex items-center gap-1 truncate">
                                  <span className="text-[10px]">✉️</span>
                                  <span className="font-mono text-[9.5px] font-bold truncate">{u.email}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyText(u.email || '', `email_${u.phone}`);
                                  }}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer shrink-0"
                                  title="نسخ البريد الإلكتروني"
                                >
                                  {copiedKey === `email_${u.phone}` ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            <div className="text-[10px] text-rose-600 flex items-center gap-1 flex-wrap" dir="rtl">
                              <span className="bg-rose-50 border border-rose-100 px-1 py-0.5 rounded font-bold">الباسورد:</span>
                              <span className="font-mono font-extrabold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded text-[11px] select-all" dir="ltr">
                                {u.rawPassword || u.password || 'غير متوفر'}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="text-xs">{getCountryFlagEmoji(u.countryCode)}</span>
                              <span className="font-extrabold">{u.country || 'قيد التحديد (بانتظار فتح العضو للتطبيق)'}</span>
                              {(u.city || u.region) && (
                                <span className="font-bold text-emerald-700">• {u.city || u.region}</span>
                              )}
                              {u.ip && (
                                <span className="text-[9px] font-mono text-slate-500 bg-white px-1 rounded border border-slate-200" dir="ltr">
                                  {u.ip}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 space-y-1 text-[10px]">
                            {/* Creation Date */}
                            <div className="text-slate-600 font-bold flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200/60">
                              <span className="text-slate-400 font-medium">أنشئ:</span>
                              <span dir="ltr" className="font-mono text-slate-800 text-[9.5px]">
                                {u.createdAt ? new Date(u.createdAt).toLocaleString('ar-EG', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'غير معروف'}
                              </span>
                            </div>

                            {/* Active/Inactive Status Badge */}
                            <div className="pt-0.5">
                              {isUserOnline(u) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                  نشط الآن (داخل الموقع)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  غير نشط (خارج الموقع)
                                </span>
                              )}
                            </div>

                            {/* Login / Logout Timestamps */}
                            <div className="text-[9px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                              {u.lastLoginAt && (
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-600">آخر دخول:</span>
                                  <span dir="ltr" className="font-mono text-slate-700">
                                    {new Date(u.lastLoginAt).toLocaleString('ar-EG', {
                                      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
                                    })}
                                  </span>
                                </div>
                              )}
                              {u.lastLogoutAt ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-600">آخر خروج:</span>
                                  <span dir="ltr" className="font-mono text-slate-700">
                                    {new Date(u.lastLogoutAt).toLocaleString('ar-EG', {
                                      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
                                    })}
                                  </span>
                                </div>
                              ) : u.lastActiveAt ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-600">آخر تواجد:</span>
                                  <span dir="ltr" className="font-mono text-slate-700">
                                    {new Date(u.lastActiveAt).toLocaleString('ar-EG', {
                                      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
                                    })}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-3 space-y-1">
                            <div>
                              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px] font-bold text-slate-600">
                                {u.inviteCode}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 items-start mt-1">
                              {u.vipTier && u.vipTier !== 'C1' ? (
                                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-extrabold inline-block">
                                  {u.vipTier}
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold inline-block">
                                  بدون باقة
                                </span>
                              )}
                              {calculateRemainingEffectiveDays(u, settings.holidayDays ?? [5]) > 0 ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.5 rounded text-[8px] font-black inline-block">
                                  ● حساب فعال
                                </span>
                              ) : (
                                <span className="bg-rose-50 text-rose-700 border border-rose-150 px-1.5 py-0.5 rounded text-[8px] font-black inline-block">
                                  ● غير فعال
                                </span>
                              )}
                              {u.isWithdrawalBlocked ? (
                                <span className="bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded text-[8px] font-black inline-block">
                                  🔒 السحب معطل
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[8px] font-black inline-block">
                                  ✅ السحب مفعّل
                                </span>
                              )}
                              {u.bypassHoliday && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[8px] font-black inline-block">
                                  🔓 العطلة مفتوحة
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <input 
                                type="number" 
                                value={editEarnings} 
                                onChange={(e) => setEditEarnings(parseFloat(e.target.value) || 0)}
                                className="w-16 p-1 border rounded text-center font-bold text-slate-800"
                              />
                            ) : (
                              <span className="font-bold text-blue-600">{u.earnings} USDT</span>
                            )}
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <input 
                                type="number" 
                                value={editTaskIncome} 
                                onChange={(e) => setEditTaskIncome(parseFloat(e.target.value) || 0)}
                                className="w-16 p-1 border rounded text-center font-bold text-slate-800"
                              />
                            ) : (
                              <span className="text-slate-600">{u.taskIncome} USDT</span>
                            )}
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <input 
                                type="number" 
                                value={editEffectiveDays} 
                                onChange={(e) => setEditEffectiveDays(parseInt(e.target.value) || 0)}
                                className="w-16 p-1 border rounded text-center font-bold text-slate-800"
                              />
                            ) : (
                              <span className="text-slate-600">{calculateRemainingEffectiveDays(u, settings.holidayDays ?? [5])} يوم</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] text-slate-500 block max-w-[120px] truncate" dir="ltr">
                              {u.walletAddress || 'غير مرتبط'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSaveUserStats(u.phone)}
                                  disabled={updating === `save_user_${u.phone}`}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 items-stretch max-w-[110px] mx-auto">
                                <button
                                  onClick={() => {
                                    setSelectedUserForEdit(u);
                                    setEditUsernameInput(u.username);
                                    setEditPhoneInput(u.phone);
                                    setEditPasswordInput(u.rawPassword || u.password || '');
                                    setEditVipTierInput(u.vipTier || 'الباقة العادية');
                                    setEditEarnings(u.earnings);
                                    setEditTaskIncome(u.taskIncome);
                                    setEditEffectiveDays(calculateRemainingEffectiveDays(u, settings.holidayDays ?? [5]));
                                    setEditWithdrawalBlocked(!!u.isWithdrawalBlocked);
                                    setEditIsBanned(!!u.isBanned);
                                    setEditBanReason(u.banReason || '');
                                  }}
                                  className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>تعديل وحذف</span>
                                </button>

                                <button
                                  disabled={updating === `quick_ban_${u.id || u.phone}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const confirmMsg = u.isBanned ? `هل تريد إلغاء حظر ${u.username}؟` : `هل تريد حظر ${u.username} نهائياً؟`;
                                    const confirmBan = window.confirm(confirmMsg);
                                    if (confirmBan) {
                                      const reason = u.isBanned ? "" : window.prompt("ادخل سبب الحظر (اختياري):", "مخالفة شروط الاستخدام");
                                      handleQuickBan(u.phone, !u.isBanned, reason || "", u.id);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    updating === `quick_ban_${u.id || u.phone}` ? 'opacity-50 cursor-wait' : ''
                                  } ${
                                    u.isBanned 
                                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                  }`}
                                >
                                  {updating === `quick_ban_${u.id || u.phone}` ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    u.isBanned ? <Unlock className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />
                                  )}
                                  <span>{u.isBanned ? 'إلغاء الحظر' : 'حظر نهائي'}</span>
                                </button>

                                <button
                                  onClick={() => openTeamModal(u)}
                                  className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                  title="عرض شجرة وفريق هذا المستخدم"
                                >
                                  <Users className="w-3 h-3" />
                                  <span>فريق المستخدم</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Panel: Team Tree & Referral Network (إدارة الفريق وشبكة الإحالات) */}
          {activeTab === 'teams' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>إدارة الفريق وشبكة الإحالات</span>
                    <span className="bg-indigo-500/30 text-indigo-200 text-[10px] px-2 py-0.5 rounded-full border border-indigo-400/30 font-mono">
                      {users.filter(u => !u.isBanned).length} مستخدم
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    عرض كل شخص مع فريقه المباشر وشجرته التابعة له عند الضغط على اسمه
                  </p>
                </div>
              </div>

              {/* Summary Badges in Header */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-center">
                  <span className="block text-[9px] text-indigo-200 font-medium">أصحاب الفرق</span>
                  <span className="text-xs font-black text-amber-300">
                    {users.filter(u => !u.isBanned && getUserTeamBreakdown(u).totalCount > 0).length} قائد
                  </span>
                </div>
                <div className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-center">
                  <span className="block text-[9px] text-indigo-200 font-medium">المشتركين المودعين</span>
                  <span className="text-xs font-black text-emerald-400">
                    {users.filter(u => !u.isBanned && u.hasDeposited === true).length} عضو
                  </span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-[11px] font-bold">
                {[
                  { id: 'has_team', label: `👥 أصحاب الفرق (${users.filter(u => !u.isBanned && getUserTeamBreakdown(u).totalCount > 0).length})` },
                  { id: 'all', label: `📋 كل الأعضاء (${users.filter(u => !u.isBanned).length})` },
                  { id: 'vip', label: `⭐ باقات VIP (${users.filter(u => !u.isBanned && u.hasDeposited === true && u.vipTier && u.vipTier !== 'الباقة العادية' && u.vipTier !== 'VIP0').length})` },
                  { id: 'deposited', label: `💎 مودعين (${users.filter(u => !u.isBanned && u.hasDeposited === true).length})` }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTeamListFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      teamListFilter === f.id ? 'bg-indigo-600 text-white shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[260px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، رقم الهاتف، أو كود الإحالة..."
                  value={teamSearchTerm}
                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                {teamSearchTerm && (
                  <button
                    onClick={() => setTeamSearchTerm('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table of Users and Their Teams */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200 text-[11px]">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 min-w-[170px]">المستخدم (القائد)</th>
                    <th className="p-3 min-w-[120px]">كود الدعوة الخاص به</th>
                    <th className="p-3 min-w-[150px]">تمت دعوته بواسطة</th>
                    <th className="p-3 text-center min-w-[110px]">الفريق المباشر (L1)</th>
                    <th className="p-3 text-center min-w-[120px]">إجمالي الفريق (L1-L3)</th>
                    <th className="p-3 text-center min-w-[110px]">الباقة الحالية</th>
                    <th className="p-3 text-center min-w-[140px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeamUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-20 text-indigo-500" />
                        <span className="font-bold text-sm block">لا يوجد مستخدمين مطابقين لخيارات البحث</span>
                      </td>
                    </tr>
                  ) : (
                    filteredTeamUsers
                      .filter(u => getUserTeamBreakdown(u).directCount > 0)
                      .map((u, index) => {
                      const teamInfo = getUserTeamBreakdown(u);
                      const inviterUser = u.referrerCode ? inviteCodeToUserMap[u.referrerCode.trim().toUpperCase()] : null;
                      const hasActiveTeam = teamInfo.totalCount > 0;
                      const isExpanded = !!expandedLeaderPhones[u.phone];

                      return (
                        <React.Fragment key={`${u.phone || u.id}_${index}`}>
                          <tr 
                            className={`hover:bg-indigo-50/40 transition-colors ${
                              hasActiveTeam ? 'bg-white font-medium' : 'bg-slate-50/40'
                            }`}
                          >
                            {/* Index */}
                            <td className="p-3 text-center text-slate-400 font-mono text-[10px]">
                              {index + 1}
                            </td>

                            {/* User Details (Clickable) */}
                            <td className="p-3">
                              <div 
                                onClick={() => openTeamModal(u)}
                                className="group cursor-pointer flex items-center gap-2.5"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                                  {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors underline decoration-dotted underline-offset-4">
                                      {u.username}
                                    </span>
                                    {isUserOnline(u) && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="نشط الآن"></span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] text-slate-500" dir="ltr">{u.phone}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyText(u.phone, `phone_${u.phone}`);
                                      }}
                                      className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
                                      title="نسخ رقم الهاتف"
                                    >
                                      {copiedKey === `phone_${u.phone}` ? (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                  {u.email && (
                                    <div className="flex items-center gap-1 text-[9.5px] text-indigo-700 bg-indigo-50/80 border border-indigo-200/60 px-1 py-0.5 rounded mt-0.5" dir="ltr">
                                      <span className="truncate max-w-[130px] font-mono font-medium">{u.email}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Invite Code */}
                            <td className="p-3">
                              {u.inviteCode ? (
                                <div className="flex items-center gap-1">
                                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-mono font-black text-[11px]">
                                    {u.inviteCode}
                                  </span>
                                  <button
                                    onClick={() => handleCopyText(u.inviteCode || '', `inv_${u.phone}`)}
                                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
                                    title="نسخ كود الدعوة"
                                  >
                                    {copiedKey === `inv_${u.phone}` ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px]">--</span>
                              )}
                            </td>

                            {/* Referrer Info (تمت دعوته بواسطة) */}
                            <td className="p-3">
                              {inviterUser ? (
                                <div 
                                  onClick={() => openTeamModal(inviterUser)}
                                  className="cursor-pointer hover:bg-slate-100 p-1 rounded-lg transition-colors inline-block"
                                  title="عرض فريق الراعي"
                                >
                                  <span className="font-bold text-slate-800 text-xs block hover:text-indigo-600">
                                    {inviterUser.username}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-500 block" dir="ltr">
                                    {inviterUser.phone}
                                  </span>
                                </div>
                              ) : u.referrerCode ? (
                                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  كود: {u.referrerCode}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                  تسجيل مباشر
                                </span>
                              )}
                            </td>

                            {/* Level 1 Direct Team Count */}
                            <td className="p-3 text-center">
                              {teamInfo.directCount > 0 ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl font-black text-xs">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>{teamInfo.directCount} عضو</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0</span>
                              )}
                            </td>

                            {/* Total Multi-level Team Count */}
                            <td className="p-3 text-center">
                              {teamInfo.totalCount > 0 ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-xl font-black text-xs shadow-sm">
                                    <Network className="w-3.5 h-3.5" />
                                    <span>{teamInfo.totalCount} عضو</span>
                                  </span>
                                  {teamInfo.depositedCount > 0 && (
                                    <span className="text-[9px] text-emerald-600 font-extrabold mt-0.5">
                                      ({teamInfo.depositedCount} مودع نشط)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0</span>
                              )}
                            </td>

                            {/* VIP Tier */}
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-extrabold ${
                                u.vipTier && u.vipTier !== 'الباقة العادية' && u.vipTier !== 'VIP0'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {u.vipTier || 'الباقة العادية'}
                              </span>
                            </td>

                            {/* Actions Button */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {teamInfo.directCount > 0 && (
                                  <button
                                    onClick={() => toggleLeaderExpand(u.phone)}
                                    className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                      isExpanded 
                                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300' 
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                                    }`}
                                    title={isExpanded ? 'طي الأعضاء' : 'توسيع الأعضاء المباشرين'}
                                  >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}
                                <button
                                  onClick={() => openTeamModal(u)}
                                  className="px-2 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm flex-1 flex items-center justify-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>شجرة</span>
                                </button>
                                <div className="flex items-center justify-center gap-1 w-full mt-1">
                                  <button
                                    onClick={() => {
                                      setSelectedUserForEdit(u);
                                      setEditUsernameInput(u.username);
                                      setEditPhoneInput(u.phone);
                                      setEditPasswordInput(u.rawPassword || u.password || '');
                                      setEditVipTierInput(u.vipTier || 'الباقة العادية');
                                      setEditEarnings(u.earnings);
                                      setEditTaskIncome(u.taskIncome);
                                      setEditEffectiveDays(calculateRemainingEffectiveDays(u, settings.holidayDays ?? [5]));
                                      setEditWithdrawalBlocked(!!u.isWithdrawalBlocked);
                                      setEditIsBanned(!!u.isBanned);
                                      setEditBanReason(u.banReason || '');
                                    }}
                                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all cursor-pointer"
                                    title="تعديل وحذف"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    disabled={updating === `quick_ban_${u.id || u.phone}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const confirmMsg = u.isBanned ? `هل تريد إلغاء حظر ${u.username}؟` : `هل تريد حظر ${u.username} نهائياً؟`;
                                      const confirmBan = window.confirm(confirmMsg);
                                      if (confirmBan) {
                                        const reason = u.isBanned ? "" : window.prompt("ادخل سبب الحظر (اختياري):", "مخالفة شروط الاستخدام");
                                        handleQuickBan(u.phone, !u.isBanned, reason || "", u.id);
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      updating === `quick_ban_${u.id || u.phone}` ? 'opacity-50 cursor-wait' : ''
                                    } ${
                                      u.isBanned 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                        : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                                    }`}
                                    title={u.isBanned ? 'إلغاء الحظر' : 'حظر نهائي'}
                                  >
                                    {updating === `quick_ban_${u.id || u.phone}` ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      u.isBanned ? <Unlock className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Inline Expansion of Direct Team Members */}
                          {isExpanded && (
                            <tr className="bg-indigo-50/20 border-b border-indigo-100">
                              <td colSpan={8} className="p-3 pr-8">
                                <div className="bg-white rounded-xl border border-indigo-100 p-3 shadow-xs space-y-2">
                                  <div className="flex items-center justify-between text-xs font-black text-indigo-900 border-b border-slate-100 pb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <UserCheck className="w-4 h-4 text-emerald-600" />
                                      <span>الأعضاء المباشرين للقائد ({u.username}): {teamInfo.directCount} عضو</span>
                                    </span>
                                    <button
                                      onClick={() => openTeamModal(u)}
                                      className="text-indigo-600 hover:underline text-[11px]"
                                    >
                                      عرض شجرة الفريق كاملة ⬅
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {teamInfo.level1.map((m, mIdx) => (
                                      <div key={`${m.phone || m.id}_${mIdx}`} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                                        <div>
                                          <div className="font-extrabold text-slate-800">{m.username}</div>
                                          <div className="font-mono text-[10px] text-slate-400" dir="ltr">{m.phone}</div>
                                        </div>
                                        <div className="text-left space-y-0.5">
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold block">{m.vipTier || 'عادي'}</span>
                                          {getUserTeamBreakdown(m).totalCount > 0 && (
                                            <button
                                              onClick={() => openTeamModal(m)}
                                              className="text-[9px] text-indigo-600 hover:underline font-bold"
                                            >
                                              فريقه ({getUserTeamBreakdown(m).totalCount})
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Panel: Pending Deposit & Recharge Requests (طلبات الشحن المعلقة) */}
          {(activeTab === 'deposits' || activeTab === 'all') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xs font-bold text-slate-700">طلبات الشحن والإيداع (BEP20 / TRC20 / Polygon)</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedUserForDeposit(null);
                    setShowManualDepositModal(true);
                    setManualDepPhoneInput('');
                    setManualDepAmount(25);
                    setManualDepCurrency('USDT (Polygon)');
                    setManualDepStatus('approved');
                    setManualDepDate(new Date().toISOString().substring(0, 16));
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  <span>إضافة إيداع يدوي</span>
                </button>

                <button
                  onClick={handleDeleteAllDeposits}
                  disabled={updating !== null || deposits.length === 0}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                  title="مسح وحذف كافة سجلات الإيداع"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>حذف السجل بالكامل</span>
                </button>

                <button
                  onClick={() => setDepositSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                  className="bg-slate-200/80 hover:bg-slate-300 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                  title="ترتيب السجل حسب التاريخ"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{depositSortOrder === 'newest' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-[10px] font-bold">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'pending', label: 'المعلقة' },
                    { id: 'approved', label: 'المقبولة' },
                    { id: 'rejected', label: 'المرفوضة' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setDepositFilter(f.id as any)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        depositFilter === f.id ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <button onClick={loadAdminData} className="text-slate-400 hover:text-slate-600 p-1" title="تحديث البيانات">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-500 border-b border-slate-200">
                    <th className="p-3 font-bold">العضو</th>
                    <th className="p-3 font-bold">المبلغ المطلوب والشبكة</th>
                    <th className="p-3 font-bold">إثبات التحويل / الصورة</th>
                    <th className="p-3 font-bold">تاريخ الطلب</th>
                    <th className="p-3 font-bold text-center">الحالة</th>
                    <th className="p-3 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">جاري التحميل...</td>
                    </tr>
                  ) : sortedDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">لا توجد طلبات إيداع تطلع نتائج تصفيتك حالياً.</td>
                    </tr>
                  ) : (
                    sortedDeposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{dep.username}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5" dir="ltr">{dep.phone}</div>
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          <div>{dep.amount} USDT</div>
                          <span className="inline-block text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded mt-0.5" dir="ltr">
                            {dep.currency || 'USDT (Polygon)'}
                          </span>
                        </td>
                        <td className="p-3">
                          {dep.screenshotUrl ? (
                            <div 
                              className="flex items-center gap-1.5 cursor-pointer group"
                              onClick={() => setActiveLightboxImage(dep.screenshotUrl!)}
                            >
                              <img
                                src={dep.screenshotUrl}
                                alt="Screenshot"
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm group-hover:scale-110 transition-transform duration-200 cursor-zoom-in"
                              />
                              <span className="text-[9px] text-slate-400 font-bold group-hover:text-blue-600 transition-colors">(اضغط للتكبير)</span>
                            </div>
                          ) : dep.txHash ? (
                            <span className="font-mono text-[10px] text-slate-500 select-all block max-w-[150px] truncate" dir="ltr" title={dep.txHash}>
                              {dep.txHash}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">لا توجد صورة</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400 text-[10px]">
                          {new Date(dep.createdAt).toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            dep.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            dep.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}>
                            {dep.status === 'pending' ? 'معلق' : dep.status === 'approved' ? 'مقبول' : 'مرفوض'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {dep.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleDepositAction(dep, 'approved')}
                                  disabled={updating !== null}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  <Check className="w-3 h-3" />
                                  موافقة
                                </button>
                                <button
                                  onClick={() => handleDepositAction(dep, 'rejected')}
                                  disabled={updating !== null}
                                  className="bg-rose-500 hover:bg-rose-600 text-white px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  <X className="w-3 h-3" />
                                  رفض
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => {
                                setSelectedDepositForEdit(dep);
                                setEditDepAmount(dep.amount);
                                setEditDepCurrency(dep.currency || 'USDT (Polygon)');
                                setEditDepStatus(dep.status);
                                try {
                                  setEditDepDate(new Date(dep.createdAt).toISOString().substring(0, 16));
                                } catch (e) {
                                  setEditDepDate(new Date().toISOString().substring(0, 16));
                                }
                              }}
                              disabled={updating !== null}
                              className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 p-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                              title="تعديل سجل الإيداع"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleDeleteDeposit(dep.id)}
                              disabled={updating !== null}
                              className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 p-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                              title="حذف هذا الإيداع نهائياً"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

        </div>

        {/* Sidebar Controls (Right 1 column or Full width depending on tab) */}
        {(activeTab === 'settings' || activeTab === 'plans' || activeTab === 'withdrawals' || activeTab === 'all') && (
        <div className={activeTab === 'all' ? 'space-y-6' : 'space-y-6'}>
          
          {/* Admin Account Credentials Card (تغيير رقم هاتف ودخول المدير) */}
          {(activeTab === 'settings' || activeTab === 'all') && (
          <div className="bg-[#0B1528] p-5 rounded-2xl shadow-xl border border-[#F39C12]/40 text-white">
            <div className="flex items-center justify-between border-b border-blue-900/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#F39C12]" />
                <h2 className="text-sm font-extrabold text-[#F39C12]">إعدادات حساب المدير (تغيير رقم تسجيل الدخول وكلمة السر)</h2>
              </div>
              <span className="text-[10px] bg-[#F39C12]/20 text-[#F39C12] border border-[#F39C12]/30 px-2 py-0.5 rounded-full font-bold">
                خاص بالمدير
              </span>
            </div>

            <form onSubmit={handleSaveAdminCredentials} className="space-y-4">
              {adminCredMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                  adminCredMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {adminCredMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 text-right">رقم هاتف المدير الجديد (لتسجيل الدخول)</label>
                  <input
                    type="text"
                    required
                    value={adminPhoneInput}
                    onChange={(e) => setAdminPhoneInput(e.target.value)}
                    placeholder="مثال: 07519952000"
                    className="w-full px-3 py-2.5 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F39C12] text-center font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 text-right">كلمة مرور المدير الجديد</label>
                  <input
                    type="text"
                    required
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="w-full px-3 py-2.5 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F39C12] text-center font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[10px] text-slate-400 text-right">
                  * سيمكنك استخدام الرقم الجديد فوراً لتسجيل الدخول إلى لوحة التحكم من أي جهاز.
                </span>
                <button
                  type="submit"
                  disabled={savingAdminCreds}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingAdminCreds ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>حفظ رقم وكلمة سر المدير</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Settings Card: General System Settings */}
          {(activeTab === 'settings' || activeTab === 'all') && (
          <div className="bg-[#0B1528] p-5 rounded-2xl shadow-xl border border-blue-900/40 text-white">
            <div className="flex items-center gap-2 mb-4 border-b border-blue-900/30 pb-3">
              <Settings className="w-5 h-5 text-[#F39C12]" />
              <h2 className="text-sm font-extrabold text-[#F39C12]">إعدادات المنصة العامة</h2>
            </div>

            <div className="space-y-4">
              {/* Row 1: siteName & telegramLink */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 text-right">تغيير اسم الموقع</label>
                  <input
                    type="text"
                    value={siteNameInput}
                    onChange={(e) => setSiteNameInput(e.target.value)}
                    placeholder="مثال: BET"
                    className="w-full px-3 py-2.5 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F39C12] text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 text-right">رابط إدارة منصة {siteNameInput}</label>
                  <input
                    type="text"
                    value={telegramLinkInput}
                    onChange={(e) => setTelegramLinkInput(e.target.value)}
                    placeholder="رابط التليجرام أو الدعم"
                    className="w-full px-3 py-2.5 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-[#F39C12] text-center"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Deposit Wallet Addresses Section */}
              <div className="p-3.5 bg-[#070D19] rounded-xl border border-blue-900/40 space-y-3">
                <div className="text-[11px] font-extrabold text-[#F39C12] flex items-center justify-between border-b border-blue-900/40 pb-2">
                  <span>عناوين شبكات الإيداع والتحويل (USDT Deposit Networks)</span>
                  <span className="text-[9px] text-slate-400 font-normal">يمكن التعديل والربط مع صفحة الشحن للمستخدم</span>
                </div>

                <div className="space-y-3">
                  {/* 1. BEP20 */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 mb-1 text-right flex items-center justify-between">
                      <span>عنوان الإيداع (USDT BEP-20) - BNB Smart Chain</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">BEP20</span>
                    </label>
                    <input
                      type="text"
                      value={rechargeBEP20Input}
                      onChange={(e) => setRechargeBEP20Input(e.target.value)}
                      placeholder="عنوان محفظة BEP20 (مثال: 0x...)"
                      className="w-full px-3 py-2 bg-[#030712] border border-amber-500/30 rounded-xl text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400 text-center"
                      dir="ltr"
                    />
                  </div>

                  {/* 2. TRC20 */}
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 mb-1 text-right flex items-center justify-between">
                      <span>عنوان الإيداع (USDT TRC-20) - TRON Network</span>
                      <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">TRC20</span>
                    </label>
                    <input
                      type="text"
                      value={rechargeTRC20Input}
                      onChange={(e) => setRechargeTRC20Input(e.target.value)}
                      placeholder="عنوان محفظة TRC-20 (مثال: T...)"
                      className="w-full px-3 py-2 bg-[#030712] border border-rose-500/30 rounded-xl text-xs font-mono text-rose-200 focus:outline-none focus:border-rose-400 text-center"
                      dir="ltr"
                    />
                  </div>

                  {/* 3. POLYGON */}
                  <div>
                    <label className="block text-[11px] font-bold text-purple-400 mb-1 text-right flex items-center justify-between">
                      <span>عنوان الإيداع (USDT Polygon) - Polygon Network</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">POLYGON</span>
                    </label>
                    <input
                      type="text"
                      value={rechargeInput}
                      onChange={(e) => setRechargeInput(e.target.value)}
                      placeholder="عنوان محفظة Polygon (مثال: 0x...)"
                      className="w-full px-3 py-2 bg-[#030712] border border-purple-500/30 rounded-xl text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-400 text-center"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: minDeposit & minWithdrawal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 text-right">الحد الأدنى للإيداع ($)</label>
                  <input
                    type="number"
                    value={minDepositInput}
                    onChange={(e) => setMinDepositInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F39C12] text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 text-right">الحد الأدنى للسحب ($)</label>
                  <input
                    type="number"
                    value={minWithdrawalInput}
                    onChange={(e) => setMinWithdrawalInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F39C12] text-center"
                  />
                </div>
              </div>



              {/* Row 3.5: Global Notification Banner */}
              <div>
                <label className="block text-[11px] font-bold text-[#F39C12] mb-1.5 text-right flex items-center justify-between">
                  <span>رسالة الإشعار العام للموقع (تنبيه في كل الصفحات)</span>
                  <span className="text-[10px] text-slate-400 bg-blue-950 px-1.5 py-0.5 rounded">هام</span>
                </label>
                <textarea
                  value={globalNotificationInput}
                  onChange={(e) => setGlobalNotificationInput(e.target.value)}
                  placeholder="اكتب هنا إشعاراً عاماً سيظهر لجميع المستخدمين في أعلى الشاشة عبر كامل أقسام المنصة..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F39C12] text-right leading-relaxed"
                />
              </div>

              {/* Row 3.8: App File Upload / Download Link */}
              {false && (
              <div className="bg-[#0D1E36] p-4 rounded-xl border border-blue-900/30 space-y-3">
                <span className="block text-xs font-extrabold text-[#F39C12] border-b border-blue-900/10 pb-2">📦 ملف تحميل تطبيق المنصة الرسمي</span>
                
                <div className="space-y-1 text-right">
                  <label className="block text-[10px] font-bold text-slate-200">رفع ملف التطبيق (.apk أو أي امتداد آخر):</label>
                  <p className="text-[9px] text-slate-400">يمكنك رفع ملف التطبيق مباشرة ليتم حفظه وتوفيره تلقائياً للتنزيل من قبل المستخدمين.</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="file"
                      accept=".apk,application/vnd.android.package-archive"
                      disabled={isUploadingFile}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Warn if file size is very large
                          const fileSizeMB = file.size / (1024 * 1024);
                          if (fileSizeMB > 50) {
                            showToast("⚠️ حجم الملف كبير جداً (أكبر من 50 ميجابايت). قد تواجه مشاكل في سرعة الرفع أو التحميل للأعضاء.");
                          }
                          
                          setIsUploadingFile(true);
                          setUploadProgress(5);
                          showToast("⏳ جاري رفع الملف وتجهيزه، يرجى عدم إغلاق الصفحة...");
                          
                          const progressInterval = setInterval(() => {
                            setUploadProgress(prev => {
                              if (prev >= 92) {
                                clearInterval(progressInterval);
                                return 92;
                              }
                              return prev + Math.floor(Math.random() * 10) + 2;
                            });
                          }, 200);

                          try {
                            const url = await uploadFileToStorage(file);
                            clearInterval(progressInterval);
                            setUploadProgress(100);
                            setAppDownloadUrlInput(url);
                            showToast("🎉 تم رفع ملف التطبيق وتجهيزه للحفظ بنجاح!");
                          } catch (err: any) {
                            clearInterval(progressInterval);
                            showToast(err.message || "حدث خطأ أثناء رفع الملف");
                          } finally {
                            setTimeout(() => {
                              setIsUploadingFile(false);
                              setUploadProgress(0);
                            }, 800);
                          }
                        }
                      }}
                      className="block w-full text-xs text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                  {isUploadingFile && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري رفع ملف التطبيق وحفظه بشكل آمن...</span>
                        </span>
                        <span className="font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#070D19] h-2 rounded-full overflow-hidden border border-blue-950">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <span className="block text-[9px] text-slate-400 text-center font-bold">
                        تتم عملية التهيئة السريعة لقنوات التحميل المباشرة لضمان تنزيل خفيف وسريع.
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="block text-[10px] font-bold text-slate-200">أو أدخل رابط تحميل خارجي مباشرة:</label>
                  <input
                    type="text"
                    value={appDownloadUrlInput}
                    onChange={(e) => setAppDownloadUrlInput(e.target.value)}
                    placeholder="مثال: https://drive.google.com/... أو رابط مباشر آخر"
                    className="w-full px-3 py-2 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-[#F39C12] text-left font-mono"
                    dir="ltr"
                  />
                  {appDownloadUrlInput && (
                    <div className="flex items-center justify-between text-[8px] text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded border border-emerald-900/30 mt-1">
                      <span>✓ ملف التطبيق مهيأ وموجود للتنزيل</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppDownloadUrlInput('');
                          showToast("تم إزالة ملف التطبيق");
                        }}
                        className="text-rose-400 hover:text-rose-300 underline"
                      >
                        إزالة الملف
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* VIP Trial Plans Enable/Disable Toggle */}
              <div className="bg-[#070D19] p-4 rounded-xl border border-blue-900/30 mt-2 flex flex-col md:flex-row items-center justify-between gap-3 text-right">
                <div className="flex-1 w-full">
                  <span className="block text-xs font-extrabold text-slate-200 flex items-center gap-1.5 justify-end">
                    <span>عرض الباقات التجريبية للأعضاء</span>
                    <span className={`w-2 h-2 rounded-full ${!hideTrialPlansInput ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1 leading-relaxed">
                    التحكم بظهور أو إخفاء الباقات التجريبية (Trial) بالكامل من واجهة "ترقية VIP" للأعضاء. عند تفعيل الإخفاء، لا تظهر إلا الباقات المدفوعة.
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setHideTrialPlansInput(false)}
                    type="button"
                    className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      !hideTrialPlansInput 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                        : 'bg-[#0B1528] text-slate-400 border border-blue-900/30'
                    }`}
                  >
                    إظهار الباقات
                  </button>
                  <button
                    onClick={() => setHideTrialPlansInput(true)}
                    type="button"
                    className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      hideTrialPlansInput 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20 font-extrabold' 
                        : 'bg-[#0B1528] text-slate-400 border border-blue-900/30'
                    }`}
                  >
                    إخفاء الباقات
                  </button>
                </div>
              </div>
              
              {/* Telegram Username Configuration */}
              <div className="bg-[#070D19] p-4 rounded-xl border border-blue-900/30 mt-4 text-right">
                <div className="mb-3">
                  <span className="block text-xs font-extrabold text-slate-200">إعدادات دعم التليجرام</span>
                  <span className="block text-[10px] text-slate-400 mt-1">أدخل يوزر التليجرام (بدون @) لتفعيل زر دعم التليجرام للمستخدمين</span>
                </div>
                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">يوزر التليجرام (بدون @)</label>
                  <input
                    type="text"
                    value={telegramSupportUsernameInput}
                    onChange={(e) => setTelegramSupportUsernameInput(e.target.value)}
                    placeholder="username"
                    className="w-full px-3 py-2.5 bg-[#0B1528] border border-blue-900/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Signal Group Configuration (إعدادات ورابط مجموعة سجنال في الصفحة الرئيسية) */}
              <div className="bg-gradient-to-br from-[#070D19] to-[#0d1c3a] p-4 sm:p-5 rounded-2xl border-2 border-[#2C6BED]/40 shadow-xl mt-4 text-right space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/40 pb-3.5">
                  <div className="flex items-center gap-3">
                    <SignalLogo className="w-10 h-10 shrink-0" rounded="rounded-xl" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-white">إعدادات مجموعة OXLO على تطبيق Signal</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          showSignalGroupInput 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {showSignalGroupInput ? '✅ الزر مفعّل وظاهر' : '❌ الزر مخفي'}
                        </span>
                      </div>
                      <span className="block text-[10px] sm:text-[11px] text-slate-300 mt-0.5">
                        تحكم في رابط مجموعة تطبيق Signal وإمكانية إظهار أو إخفاء زر المجموعة في نهاية الصفحة الرئيسية للمستخدمين
                      </span>
                    </div>
                  </div>

                  {/* Toggle Show/Hide Button */}
                  <div className="flex items-center gap-1.5 bg-[#0B1528] p-1 rounded-xl border border-blue-900/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSignalGroupInput(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        showSignalGroupInput
                          ? 'bg-[#2C6BED] text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      إظهار الزر
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSignalGroupInput(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        !showSignalGroupInput
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      إخفاء الزر
                    </button>
                  </div>
                </div>

                {/* Input for Signal Group Link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="font-bold text-slate-200">رابط دعوة مجموعة Signal (Link):</label>
                    {signalGroupLinkInput && (
                      <a
                        href={signalGroupLinkInput.startsWith('http') ? signalGroupLinkInput : `https://${signalGroupLinkInput}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2C6BED] hover:text-blue-300 flex items-center gap-1 font-bold text-[10px]"
                      >
                        <span>تجربة فتح الرابط</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={signalGroupLinkInput}
                      onChange={(e) => setSignalGroupLinkInput(e.target.value)}
                      placeholder="https://signal.group/#CjQK..."
                      className="w-full pl-3 pr-3 py-2.5 bg-[#030712] border border-[#2C6BED]/40 rounded-xl text-xs font-mono text-blue-200 focus:outline-none focus:border-[#2C6BED] text-left"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    ضع رابط الدعوة المباشر للمجموعة على تطبيق Signal. عند ضغط المشتركين على الزر في الصفحة الرئيسية سيتم توجيههم مباشرة إلى المجموعة.
                  </p>
                </div>
              </div>



              {/* Row 4: Holiday Active Toggle & Days Selector */}
              <div className="bg-[#070D19] p-4 rounded-xl border border-blue-900/30 mt-2 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-semibold border-b border-blue-900/20 pb-3">
                  <div className="text-right">
                    <span className="block text-xs font-extrabold text-slate-200">تفعيل نظام العطلة الأسبوعية</span>
                    <span className="block text-[10px] text-slate-400 mt-1 leading-relaxed">
                      عند التشغيل، لن يتمكن الأعضاء من تنفيذ أو تقديم المهام خلال الأيام المحددة أدناه.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setHolidayActiveInput(true)}
                      type="button"
                      className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                        holidayActiveInput 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                          : 'bg-[#0B1528] text-slate-400 border border-blue-900/30'
                      }`}
                    >
                      تشغيل
                    </button>
                    <button
                      onClick={() => setHolidayActiveInput(false)}
                      type="button"
                      className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                        !holidayActiveInput 
                          ? 'bg-[#F39C12] text-[#0B1528] shadow-lg shadow-[#F39C12]/20 font-extrabold' 
                          : 'bg-[#0B1528] text-slate-400 border border-blue-900/30'
                      }`}
                    >
                      إيقاف
                    </button>
                  </div>
                </div>

                {/* Days of the week selection */}
                <div className="text-right">
                  <span className="block text-[11px] font-extrabold text-[#F39C12] mb-2">تحديد أيام العطلة الأسبوعية:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {[
                      { id: 5, name: "الجمعة" },
                      { id: 6, name: "السبت" },
                      { id: 0, name: "الأحد" },
                      { id: 1, name: "الإثنين" },
                      { id: 2, name: "الثلاثاء" },
                      { id: 3, name: "الأربعاء" },
                      { id: 4, name: "الخميس" }
                    ].map((day) => {
                      const isSelected = holidayDaysInput.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setHolidayDaysInput(holidayDaysInput.filter(d => d !== day.id));
                            } else {
                              setHolidayDaysInput([...holidayDaysInput, day.id]);
                            }
                          }}
                          className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all border ${
                            isSelected 
                              ? 'bg-[#F39C12] text-[#0B1528] border-[#F39C12] shadow-sm font-extrabold' 
                              : 'bg-[#0B1528] text-slate-300 border-blue-900/30 hover:border-blue-900/70'
                          }`}
                        >
                          {day.name}
                        </button>
                      );
                    })}
                  </div>
                  <span className="block text-[9px] text-slate-500 mt-2 text-right">
                    * ملاحظة: يمكنك اختيار أي عدد من الأيام (مثل الجمعة والسبت). سيقوم النظام تلقائياً بتعطيل واجهة المهام في تلك الأيام المحددة.
                  </span>
                </div>
              </div>

              {/* Row 4.5: Withdrawal Manual Lock and Rates Info */}
              <div className="bg-[#070D19] p-4 rounded-xl border border-blue-900/30 mt-2 space-y-4 text-right">
                <span className="block text-xs font-extrabold text-[#F39C12] border-b border-blue-900/10 pb-2">🔒 إعدادات قفل السحب وتحديد الأيام والأسعار</span>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-semibold">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-200">قفل السحب العام يدوياً</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5 leading-relaxed">عند التفعيل، سيتم قفل عمليات السحب بالكامل لجميع المستخدمين.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWithdrawLockActiveInput(true)}
                      type="button"
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        withdrawLockActiveInput 
                          ? 'bg-rose-600 text-white font-black' 
                          : 'bg-[#0B1528] text-slate-400 border border-blue-900/30'
                      }`}
                    >
                      تفعيل القفل
                    </button>
                    <button
                      onClick={() => setWithdrawLockActiveInput(false)}
                      type="button"
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        !withdrawLockActiveInput 
                          ? 'bg-emerald-600 text-white font-black' 
                          : 'bg-[#0B1528] text-slate-400 border border-blue-900/30'
                      }`}
                    >
                      مفتوح
                    </button>
                  </div>
                </div>

                {/* Days of the week selection for Withdrawal Lock */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-300 mb-1.5">تحديد أيام قفل السحب أسبوعياً تلقائياً:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                    {[
                      { id: 5, name: "الجمعة" },
                      { id: 6, name: "السبت" },
                      { id: 0, name: "الأحد" },
                      { id: 1, name: "الإثنين" },
                      { id: 2, name: "الثلاثاء" },
                      { id: 3, name: "الأربعاء" },
                      { id: 4, name: "الخميس" }
                    ].map((day) => {
                      const isSelected = withdrawLockDaysInput.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setWithdrawLockDaysInput(withdrawLockDaysInput.filter(d => d !== day.id));
                            } else {
                              setWithdrawLockDaysInput([...withdrawLockDaysInput, day.id]);
                            }
                          }}
                          className={`py-1.5 px-0.5 rounded text-[9px] font-bold text-center transition-all border cursor-pointer ${
                            isSelected 
                              ? 'bg-rose-600 text-white border-rose-500 font-extrabold' 
                              : 'bg-[#0B1528] text-slate-300 border-blue-900/30'
                          }`}
                        >
                          {day.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rates/Exchange Price Info displayed to user on Withdrawal Form */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">أسعار الصرف وعمولات السحب المعروضة للمستخدمين:</label>
                  <input
                    type="text"
                    value={withdrawRatesInfoInput}
                    onChange={(e) => setWithdrawRatesInfoInput(e.target.value)}
                    placeholder="مثال: رسوم معالجة السحب 0% - سعر الصرف مستقر"
                    className="w-full px-3 py-2 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-[#F39C12] text-right"
                  />
                </div>

                {/* 4 Notices/Alerts for Deposits and Withdrawals (Old & New) */}
                <div className="border-t border-blue-900/20 pt-3 space-y-3 text-right">
                  <span className="block text-[11px] font-extrabold text-[#F39C12]">🔔 التنبيهات المخصصة لصفحات السحب والشحن</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[#0B1528] p-3 rounded-xl border border-blue-900/20 space-y-2">
                      <span className="block text-[10px] font-bold text-[#F39C12]">الشحن (تنبيه 1 - القديم)</span>
                      <textarea
                        rows={2}
                        value={rechargeNoticeInput}
                        onChange={(e) => setRechargeNoticeInput(e.target.value)}
                        placeholder="أدخل رسالة تنبيه للمستخدمين في صفحة شحن الرصيد..."
                        className="w-full px-3 py-2 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-[#F39C12] text-right"
                      />
                    </div>

                    <div className="bg-[#0B1528] p-3 rounded-xl border border-blue-900/20 space-y-2">
                      <span className="block text-[10px] font-bold text-teal-400">الشحن (تنبيه 2 - الجديد)</span>
                      <textarea
                        rows={2}
                        value={rechargeNotice2Input}
                        onChange={(e) => setRechargeNotice2Input(e.target.value)}
                        placeholder="أدخل التنبيه الإضافي الجديد تحت التنبيه الأول..."
                        className="w-full px-3 py-2 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[#0B1528] p-3 rounded-xl border border-blue-900/20 space-y-2">
                      <span className="block text-[10px] font-bold text-[#F39C12]">السحب (تنبيه 1 - القديم)</span>
                      <textarea
                        rows={2}
                        value={withdrawNoticeInput}
                        onChange={(e) => setWithdrawNoticeInput(e.target.value)}
                        placeholder="أدخل رسالة تنبيه للمستخدمين في صفحة سحب الأرباح..."
                        className="w-full px-3 py-2 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-[#F39C12] text-right"
                      />
                    </div>

                    <div className="bg-[#0B1528] p-3 rounded-xl border border-blue-900/20 space-y-2">
                      <span className="block text-[10px] font-bold text-teal-400">السحب (تنبيه 2 - الجديد)</span>
                      <textarea
                        rows={2}
                        value={withdrawNotice2Input}
                        onChange={(e) => setWithdrawNotice2Input(e.target.value)}
                        placeholder="أدخل التنبيه الإضافي الجديد تحت التنبيه الأول..."
                        className="w-full px-3 py-2 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 text-right"
                      />
                    </div>
                  </div>

                  {/* Working Hours Configuration (إعدادات ساعات العمل والتنويه) */}
                  <div className="bg-[#0D1E36] p-4 rounded-xl border border-blue-900/30 space-y-4">
                    <span className="block text-xs font-extrabold text-[#F39C12] border-b border-blue-900/30 pb-1.5 flex items-center gap-1.5 justify-start">
                      <Clock className="w-4 h-4 text-[#F39C12]" />
                      <span>إعدادات أوقات العمل الرسمية وتنويه السجل</span>
                    </span>

                    <div className="flex items-center justify-between bg-[#070D19] p-3 rounded-xl border border-blue-900/20">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="enforceWorkingHours"
                          checked={enforceWorkingHoursInput}
                          onChange={(e) => setEnforceWorkingHoursInput(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-stone-900 border-stone-750"
                        />
                        <label htmlFor="enforceWorkingHours" className="text-xs font-black text-white cursor-pointer select-none">
                          تفعيل قفل تنفيذ المهام خارج ساعات العمل
                        </label>
                      </div>
                      <span className="text-[10px] text-stone-400">إذا كان مفعلاً، لا يمكن تنفيذ أو استلام مهام خارج الأوقات المحددة</span>
                    </div>

                    {/* Shift 1 Configuration */}
                    <div className="bg-[#070D19] p-3.5 rounded-xl border border-teal-500/20 space-y-2 text-right">
                      <div className="flex items-center justify-between text-xs font-black text-teal-400 border-b border-teal-500/10 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span>☀️</span>
                          <span>الفترة الأولى (مثال: من 12 ظهراً إلى 5 عصراً)</span>
                        </span>
                        <span className="text-[10px] text-teal-300 font-bold bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-500/30">
                          من {formatHourToArabic(workStartHourInput)} إلى {formatHourToArabic(workEndHourInput)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-300">ساعة بدء الفترة الأولى (0 - 23)</label>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={workStartHourInput}
                            onChange={(e) => setWorkStartHourInput(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#0C192C] border border-teal-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 text-center font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-300">ساعة نهاية الفترة الأولى (0 - 23)</label>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={workEndHourInput}
                            onChange={(e) => setWorkEndHourInput(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#0C192C] border border-teal-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shift 2 Configuration */}
                    <div className="bg-[#070D19] p-3.5 rounded-xl border border-purple-500/20 space-y-2 text-right">
                      <div className="flex items-center justify-between text-xs font-black text-purple-300 border-b border-purple-500/10 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span>🌙</span>
                          <span>الفترة الثانية (مثال: من 9 مساءً إلى 1 ليلاً)</span>
                        </span>
                        <span className="text-[10px] text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                          من {formatHourToArabic(workStartHour2Input)} إلى {formatHourToArabic(workEndHour2Input)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-300">ساعة بدء الفترة الثانية (0 - 23)</label>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={workStartHour2Input}
                            onChange={(e) => setWorkStartHour2Input(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#0C192C] border border-purple-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400 text-center font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-300">ساعة نهاية الفترة الثانية (0 - 23)</label>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={workEndHour2Input}
                            onChange={(e) => setWorkEndHour2Input(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#0C192C] border border-purple-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400 text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setWorkingHoursNoticeInput(
                              `💡 تنويه هام لجميع الأعضاء: يرجى العلم بأن أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية مقسمة على فترتين يومياً:\n- الفترة الأولى: من الساعة ${formatHourToArabic(workStartHourInput)} وحتى ${formatHourToArabic(workEndHourInput)}.\n- الفترة الثانية: من الساعة ${formatHourToArabic(workStartHour2Input)} وحتى ${formatHourToArabic(workEndHour2Input)} بتوقيت مكة المكرمة.`
                            );
                          }}
                          className="text-[10px] text-[#F39C12] hover:underline font-bold bg-[#F39C12]/10 px-2.5 py-1 rounded-lg border border-[#F39C12]/20 cursor-pointer"
                        >
                          ⚡ توليد نص التنويه تلقائياً من الفترتين
                        </button>
                        <label className="block text-[10px] font-bold text-white">نص كليشة تنويه السجل (المعروض للمستخدمين)</label>
                      </div>
                      <textarea
                        rows={3}
                        value={workingHoursNoticeInput}
                        onChange={(e) => setWorkingHoursNoticeInput(e.target.value)}
                        placeholder="أدخل رسالة تنويه العمل بالمهام (الظاهرة في أعلى السجل)..."
                        className="w-full px-3 py-2 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs text-white focus:outline-none focus:border-[#F39C12] text-right"
                      />
                    </div>
                  </div>

                  {/* Daily Tasks Code Settings (إعدادات رمز المهام اليومي) */}
                  <div className="bg-[#0D1E36] p-4 rounded-xl border border-blue-900/30 space-y-4">
                    <span className="block text-xs font-extrabold text-[#F39C12] border-b border-blue-900/30 pb-1.5 flex items-center gap-1.5 justify-start">
                      <Key className="w-4 h-4 text-[#F39C12]" />
                      <span>قفل السجل برمز المهام اليومي</span>
                    </span>

                    <div className="space-y-2 text-right">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            // Generate random 5 digit numeric code
                            const randomCode = Math.floor(10000 + Math.random() * 90000).toString();
                            setTasksCodeInput(randomCode);
                          }}
                          className="text-[10px] text-teal-400 hover:underline font-bold bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 cursor-pointer"
                        >
                          🎲 توليد رمز عشوائي جديد
                        </button>
                        <label className="block text-[10px] font-bold text-white">رمز المهام اليومي المطلوب لدخول صفحة السجل</label>
                      </div>
                      <input
                        type="text"
                        value={tasksCodeInput}
                        onChange={(e) => setTasksCodeInput(e.target.value)}
                        placeholder="اتركه فارغاً لإلغاء القفل (رمز المهام اليومي)"
                        className="w-full px-3 py-2.5 bg-[#070D19] border border-blue-900/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F39C12] text-center"
                        dir="ltr"
                      />
                      <p className="text-[10px] text-stone-400 leading-relaxed mt-1">
                        * فكرة جميلة: عند تفعيل هذا الرمز، سيُطلب من العضو إدخال الرمز الصحيح قبل فتح صفحة السجل (المهمات). يمكنك تغيير الرمز كل يوم وإعطائه للأعضاء النشطين لتنظيم وتوجيه العمل! اتركه فارغاً لتعطيل هذا الطلب.
                      </p>

                      {/* Send code to VIP members button with inline confirmation */}
                      {tasksCodeInput.trim() && (
                        showSendCodeConfirm ? (
                          <div className="mt-3 bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl flex flex-col gap-2 animate-fadeIn text-center">
                            <span className="text-[10px] text-teal-300 font-extrabold leading-relaxed">
                              هل أنت متأكد من إرسال رمز المهام اليومي ({tasksCodeInput.trim()}) إلى جرس إشعارات المشتركين فقط (VIP)؟ لن يصل لغير المشتركين نهائياً.
                            </span>
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => handleSendCodeToSubscribers(true)}
                                disabled={sendingNotification}
                                className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] px-3 py-1.5 rounded-lg font-black cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                              >
                                {sendingNotification && <RefreshCw className="w-3 h-3 animate-spin" />}
                                نعم، أرسل للمشتركين فقط
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowSendCodeConfirm(false)}
                                className="bg-stone-700 hover:bg-stone-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-black cursor-pointer transition-all active:scale-95"
                              >
                                تراجع
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendCodeToSubscribers(false)}
                            disabled={sendingNotification}
                            className="w-full mt-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-2 px-3 rounded-lg text-[11px] font-black shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                          >
                            {sendingNotification ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Bell className="w-3.5 h-3.5" />
                            )}
                            <span>👑 إرسال الرمز الحالي إلى جرس إشعارات المشتركين فقط (VIP) 🚀</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleUpdateSettings}
                disabled={updating === 'settings'}
                className="w-full bg-[#F39C12] hover:bg-[#E67E22] text-[#0B1528] py-3 rounded-xl text-xs font-extrabold shadow-lg shadow-[#F39C12]/10 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {updating === 'settings' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0B1528]" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>حفظ التعديلات العامة</span>
              </button>
            </div>
          </div>
          )}

          {/* Video Task Pool Management */}
          {(activeTab === 'videoPool') && <VideoPoolManager />}

          {/* VIP / Subscription Tiers CRUD card */}
          {(activeTab === 'plans' || activeTab === 'all') && (
          <div className="bg-[#0B1528] p-5 rounded-2xl shadow-xl border border-blue-900/40 text-white text-right">
            <div className="flex items-center gap-2 mb-4 border-b border-blue-900/30 pb-3">
              <Zap className="w-5 h-5 text-[#F39C12] fill-[#F39C12]" />
              <h2 className="text-sm font-extrabold text-[#F39C12]">إدارة باقات واشتراكات VIP (المنصب)</h2>
            </div>

            {/* Form to create/edit plan */}
            <div className="bg-[#070D19] p-4 rounded-xl border border-blue-900/30 space-y-3">
              <span className="block text-xs font-extrabold text-slate-200">
                {editingPlanId ? '📝 تعديل باقة قائمة' : '➕ إضافة باقة اشتراك VIP جديدة'}
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">اسم الباقة (مثال: VIP 1)</label>
                  <input
                    type="text"
                    value={planNameInput}
                    onChange={(e) => setPlanNameInput(e.target.value)}
                    placeholder="اسم الباقة"
                    className="w-full px-2.5 py-2 bg-[#0B1528] border border-blue-900/40 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#F39C12]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">سعر الاشتراك ($ / USDT)</label>
                  <input
                    type="number"
                    value={planPriceInput}
                    onChange={(e) => setPlanPriceInput(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#0B1528] border border-blue-900/40 rounded-lg text-xs font-bold text-white text-center focus:outline-none focus:border-[#F39C12]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">سعر المهمة الواحدة ($ / USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={planSingleTaskRewardInput}
                    onChange={(e) => setPlanSingleTaskRewardInput(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#0B1528] border border-blue-900/40 rounded-lg text-xs font-bold text-white text-center focus:outline-none focus:border-[#F39C12]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">عدد المهام اليومية الممنوحة</label>
                  <input
                    type="number"
                    value={planTasksInput}
                    onChange={(e) => setPlanTasksInput(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#0B1528] border border-blue-900/40 rounded-lg text-xs font-bold text-white text-center focus:outline-none focus:border-[#F39C12]"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-[#0B1528] border border-blue-900/40 rounded-lg px-2.5 py-2 w-full h-[38px]">
                    <input
                      type="checkbox"
                      checked={planIsTrialInput}
                      onChange={(e) => setPlanIsTrialInput(e.target.checked)}
                      className="accent-[#F39C12] w-4 h-4"
                    />
                    <span className="text-[10px] font-bold text-slate-200">باقة تجريبية (لمدة يوم واحد)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">الحد الأقصى للمشتركين (0 = عدد غير محدود)</label>
                  <input
                    type="number"
                    value={planMaxSubscribersInput}
                    onChange={(e) => setPlanMaxSubscribersInput(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#0B1528] border border-blue-900/40 rounded-lg text-xs font-bold text-white text-center focus:outline-none focus:border-[#F39C12]"
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-right mt-2">
                * الربح اليومي الإجمالي المحسوب لهذه الباقة: <strong className="text-emerald-400">{(planTasksInput * planSingleTaskRewardInput).toFixed(2)}$</strong>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddOrUpdatePlan}
                  disabled={updating === 'vip_plans'}
                  className="flex-1 bg-[#F39C12] hover:bg-[#E67E22] text-[#0B1528] py-2 rounded-lg text-xs font-black cursor-pointer transition-all active:scale-95 text-center"
                >
                  {editingPlanId ? 'حفظ التعديلات' : 'إضافة الباقة'}
                </button>
                {editingPlanId && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlanNameInput('');
                      setPlanPriceInput(0);
                      setPlanProfitInput(0);
                      setPlanTasksInput(5);
                      setPlanSingleTaskRewardInput(0.3);
                      setEditingPlanId(null);
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>

            {/* List of active VIP/Job tiers */}
            <div className="mt-4 space-y-2">
              <span className="block text-xs font-extrabold text-[#F39C12]">الباقات المتاحة حالياً بالمنصة:</span>
              
              {!(settings.vipPlans && settings.vipPlans.length > 0) ? (
                <div className="text-center text-xs text-slate-400 py-3 bg-[#070D19] rounded-xl border border-blue-900/20">
                  لا توجد باقات مخصصة مضافة حالياً (0 باقات).
                </div>
              ) : (
                settings.vipPlans.map((plan, idx) => {
                  const planSubscribers = users.filter(u => !u.isBanned && u.vipTier === plan.name).length;
                  return (
                  <div key={plan.id} className="bg-[#070D19] p-3 rounded-xl border border-blue-900/20 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2 text-right">
                      <span className="w-6 h-6 rounded-full bg-blue-900/40 border border-blue-700/50 text-[#F39C12] text-[10px] font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-extrabold text-slate-200 block">
                          {plan.name} {plan.isTrial && <span className="text-emerald-400 text-[10px] ml-1">(تجريبية)</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          السعر: <strong className="text-[#F39C12]">{plan.price}$</strong> • الربح: <strong className="text-emerald-400">{plan.profit}$</strong> • مهام: {plan.tasksCount}
                        </span>
                        <span className="text-[10px] text-blue-400 block mt-0.5">
                          عدد المشتركين: <strong>{planSubscribers}</strong> {plan.maxSubscribers ? `من ${plan.maxSubscribers}` : ''} عضو
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Reordering Buttons */}
                      <div className="flex items-center gap-0.5 bg-[#0B1528] p-1 rounded-lg border border-blue-900/40">
                        <button
                          type="button"
                          onClick={() => handleMovePlan(plan.id, 'top')}
                          disabled={idx === 0 || updating === `reorder_${plan.id}`}
                          title="نقل للأعلى تماماً (أولواحدة بالترتيب)"
                          className="p-1 hover:bg-blue-900/50 text-[#F39C12] disabled:opacity-25 rounded transition-all cursor-pointer"
                        >
                          <ChevronsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePlan(plan.id, 'up')}
                          disabled={idx === 0 || updating === `reorder_${plan.id}`}
                          title="رفع مرتبة واحدة للأعلى"
                          className="p-1 hover:bg-blue-900/50 text-slate-200 disabled:opacity-25 rounded transition-all cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePlan(plan.id, 'down')}
                          disabled={idx === (settings.vipPlans?.length || 1) - 1 || updating === `reorder_${plan.id}`}
                          title="تنزيل مرتبة واحدة للأسفل"
                          className="p-1 hover:bg-blue-900/50 text-slate-200 disabled:opacity-25 rounded transition-all cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePlan(plan.id, 'bottom')}
                          disabled={idx === (settings.vipPlans?.length || 1) - 1 || updating === `reorder_${plan.id}`}
                          title="نقل للأسفل تماماً (آخر واحدة بالترتيب)"
                          className="p-1 hover:bg-blue-900/50 text-[#F39C12] disabled:opacity-25 rounded transition-all cursor-pointer"
                        >
                          <ChevronsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setEditingPlanId(plan.id);
                          setPlanNameInput(plan.name);
                          setPlanPriceInput(plan.price);
                          setPlanProfitInput(plan.profit);
                          setPlanTasksInput(plan.tasksCount || 5);
                          setPlanIsTrialInput(plan.isTrial || false);
                          setPlanMaxSubscribersInput(plan.maxSubscribers || 0);
                          const singleReward = plan.tasksCount && plan.tasksCount > 0 ? Number((plan.profit / plan.tasksCount).toFixed(2)) : 0;
                          setPlanSingleTaskRewardInput(singleReward);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2.5 py-1.5 rounded font-bold cursor-pointer transition-all"
                      >
                        تعديل
                      </button>

                      {planIdToDeleteConfirm === plan.id ? (
                        <div className="flex items-center gap-1 animate-fadeIn">
                          <button 
                            onClick={() => {
                              handleDeletePlan(plan.id);
                              setPlanIdToDeleteConfirm(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] px-2 py-1.5 rounded font-bold cursor-pointer transition-all"
                          >
                            تأكيد الحذف
                          </button>
                          <button 
                            onClick={() => setPlanIdToDeleteConfirm(null)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] px-2 py-1.5 rounded font-bold cursor-pointer transition-all"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setPlanIdToDeleteConfirm(plan.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] px-2.5 py-1.5 rounded font-bold cursor-pointer transition-all"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>
          )}

          {/* Panel: Pending Withdrawal Requests (طلبات السحب المعلقة) */}
          {(activeTab === 'withdrawals' || activeTab === 'all') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-amber-500" />
                <h2 className="text-xs font-bold text-slate-700">طلبات السحب للمراجعة والتنفيذ</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedUserForWithdrawal(null);
                    setShowManualWithdrawalModal(true);
                    setManualWithPhoneInput('');
                    setManualWithAmount(10);
                    setManualWithWallet('');
                    setManualWithStatus('approved');
                    setManualWithDate(new Date().toISOString().substring(0, 16));
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  <span>إضافة سحب يدوي</span>
                </button>

                <button
                  onClick={handleDeleteAllWithdrawals}
                  disabled={updating !== null || withdrawals.length === 0}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                  title="مسح وحذف كافة سجلات السحب"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>حذف السجل بالكامل</span>
                </button>

                <button
                  onClick={() => setWithdrawalSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                  className="bg-slate-200/80 hover:bg-slate-300 px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                  title="ترتيب السجل حسب التاريخ"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{withdrawalSortOrder === 'newest' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-[10px] font-bold">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'pending', label: 'المعلقة' },
                    { id: 'approved', label: 'المقبولة' },
                    { id: 'rejected', label: 'المرفوضة' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setWithdrawalFilter(f.id as any)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        withdrawalFilter === f.id ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3 font-medium">
              {loading ? (
                <div className="text-center text-slate-400 py-4 text-xs">جاري التحميل...</div>
              ) : sortedWithdrawals.length === 0 ? (
                <div className="text-center text-slate-400 py-4 text-xs">لا توجد طلبات سحب تطابق الفلتر حالياً.</div>
              ) : (
                sortedWithdrawals.map((withd) => (
                  <div key={withd.id} className="p-3 border border-slate-150 rounded-xl space-y-2 text-xs hover:border-slate-300 transition-all bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{withd.username}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-amber-600">{withd.amount} USDT</span>
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded" dir="ltr">
                          {withd.currency || 'USDT (BEP20)'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span dir="ltr">{withd.phone}</span>
                      <span>{new Date(withd.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                    
                    <div className="bg-white p-2 rounded border border-slate-100 text-left font-mono text-[9px] select-all break-all" dir="ltr" title="عنوان محفظة سحب العضو">
                      {withd.walletAddress}
                    </div>

                    <div className="flex justify-between items-center pt-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                          withd.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          withd.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                          {withd.status === 'pending' ? 'معلق' : withd.status === 'approved' ? 'مقبول' : 'مرفوض'}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedWithdrawalForEdit(withd);
                            setEditWithAmount(withd.amount);
                            setEditWithCurrency(withd.currency || 'USDT (BEP20)');
                            setEditWithWalletAddress(withd.walletAddress || '');
                            setEditWithStatus(withd.status);
                            try {
                              setEditWithDate(new Date(withd.createdAt).toISOString().substring(0, 16));
                            } catch (e) {
                              setEditWithDate(new Date().toISOString().substring(0, 16));
                            }
                          }}
                          disabled={updating !== null}
                          className="bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-700 p-1 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5"
                          title="تعديل هذا السحب"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDeleteWithdrawal(withd.id)}
                          disabled={updating !== null}
                          className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-100 p-1 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5"
                          title="حذف هذا السحب نهائياً"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {withd.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleWithdrawalAction(withd, 'approved')}
                            disabled={updating !== null}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <Check className="w-2.5 h-2.5" />
                            قبول
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(withd, 'rejected')}
                            disabled={updating !== null}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                            رفض
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}

        </div>
        )}

      </div>
      )}

      {/* Support Chat Admin Tab View */}
      {activeTab === 'support' && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col md:flex-row h-[700px]">
            
            {/* Right Column: Chats List (Sidebar) */}
            <div className="w-full md:w-80 border-l border-slate-200 flex flex-col h-full bg-slate-50/50">
              
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    محادثات الدعم الفني
                  </h3>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                    {chats.length} محادثة
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black">
                  <button
                    onClick={() => setChatFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      chatFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    الكل ({chats.length})
                  </button>
                  <button
                    onClick={() => setChatFilter('unread')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer relative ${
                      chatFilter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    غير المقروء ({chats.filter(c => c.unreadByAdmin).length})
                    {chats.filter(c => c.unreadByAdmin).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {(() => {
                  const filtered = chats
                    .filter(c => {
                      if (!c) return false;
                      const q = chatSearchQuery.trim().toLowerCase();
                      if (!q) return true;
                      const cPhone = c.phone || '';
                      const cName = c.username || '';
                      return cPhone.toLowerCase().includes(q) || cName.toLowerCase().includes(q);
                    })
                    .filter(c => {
                      if (chatFilter === 'unread') return c.unreadByAdmin;
                      return true;
                    });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
                        <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                        <span>لا توجد محادثات مطابقة.</span>
                      </div>
                    );
                  }

                  return filtered.map((chat) => {
                    const isSelected = selectedChatId === chat.id;
                    const userObj = users.find(u => u.phone === chat.phone);
                    const isOnline = userObj ? isUserOnline(userObj) : false;
                    
                    return (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`w-full p-3 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]'
                            : 'bg-white hover:bg-slate-100 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar & Online status */}
                          <div className="relative shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {chat.username ? chat.username.charAt(0) : "ع"}
                            </div>
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                          </div>

                          {/* Info Text */}
                          <div className="min-w-0">
                            <h4 className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                              {chat.username || chat.phone}
                            </h4>
                            <p className={`text-[10px] font-mono mt-0.5 truncate ${isSelected ? 'text-white/85' : 'text-slate-500'}`} dir="ltr">
                              {chat.phone}
                            </p>
                            <p className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                              {chat.lastMessage || 'بدء المحادثة...'}
                            </p>
                          </div>
                        </div>

                        {/* Unread badge or Time */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {chat.unreadByAdmin && !isSelected ? (
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce"></span>
                          ) : (
                            <span className={`text-[9px] font-mono ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                              {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'}) : ''}
                            </span>
                          )}
                          
                          {userObj?.vipTier && (
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${
                              isSelected 
                                ? 'bg-white/20 text-white border-white/10' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              VIP {userObj.vipTier}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Left Column: Active Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-white relative">
              {selectedChatId ? (
                (() => {
                  const activeChat = chats.find(c => c.id === selectedChatId);
                  const userObj = users.find(u => u.phone === activeChat?.phone);
                  const isOnline = userObj ? isUserOnline(userObj) : false;

                  return (
                    <>
                      {/* Active Chat Header */}
                      <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 text-right">
                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                              {activeChat?.username ? activeChat.username.charAt(0) : "ع"}
                            </div>
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-800">{activeChat?.username || "عضو المنصة"}</h4>
                              {userObj?.vipTier && (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-2 py-0.5 rounded border border-amber-200">
                                  VIP {userObj.vipTier}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                              <span className="font-mono" dir="ltr">{activeChat?.phone}</span>
                              <span>•</span>
                              <span>الرصيد: {userObj?.earnings ?? 0} USDT</span>
                              <span>•</span>
                              {isOnline ? (
                                <span className="text-emerald-600 font-extrabold">متصل الآن</span>
                              ) : (
                                <span>آخر ظهور: {userObj?.lastActiveAt ? new Date(userObj.lastActiveAt).toLocaleDateString('ar-EG', {hour: '2-digit', minute: '2-digit'}) : 'غير متوفر'}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons on the left of header */}
                        <div className="flex items-center gap-2">
                          {userObj && (
                            <button
                              onClick={() => setSelectedUserForEdit(userObj)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              تعديل حساب العضو
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedChatId(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-xl transition-all cursor-pointer border border-slate-200"
                            title="إغلاق المحادثة"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Chat Messages Scrolling Box */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 flex flex-col">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 font-bold text-xs">
                            لا توجد رسائل سابقة في هذه المحادثة.
                          </div>
                        ) : (
                          chatMessages.map((msg) => {
                            const isAdmin = msg.sender === 'admin';
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col max-w-[70%] ${isAdmin ? 'self-end items-end text-right' : 'self-start items-start text-left'}`}
                              >
                                {/* Sender Name Label */}
                                <span className="text-[9px] text-slate-400 mb-0.5 font-bold">
                                  {isAdmin ? 'أنا (المدير)' : (msg.senderName || activeChat?.username || "العضو")}
                                </span>

                                {/* Message bubble */}
                                <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                                  isAdmin
                                    ? 'bg-slate-900 text-white rounded-tr-none'
                                    : 'bg-white text-slate-850 border border-slate-200 rounded-tl-none'
                                }`}>
                                  {msg.text}
                                </div>

                                {/* Timestamp */}
                                <span className="text-[8px] text-slate-400 mt-1" dir="ltr">
                                  {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}
                                </span>
                              </div>
                            );
                          })
                        )}
                        <div ref={adminChatEndRef} />
                      </div>

                      {/* Preset Replies Panel */}
                      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 shrink-0">
                        <span className="text-[9px] text-slate-400 font-extrabold block mb-1">ردود سريعة معتمدة للدعم:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "مرحباً بك عزيزي، كيف يمكنني مساعدتك اليوم؟",
                            "تم تفعيل وشحن حسابك بنجاح، يرجى مراجعة المحفظة.",
                            "يرجى رفع لقطة شاشة واضحة لعملية التحويل يظهر فيها الهاش.",
                            "الحد الأدنى للسحب هو 2 USDT، يرجى الاستمرار بتجميع الأرباح.",
                            "تمت الموافقة على طلب السحب الخاص بك بنجاح، يرجى فحص محفظتك.",
                            "يرجى التحقق من صحة رابط المهمة المرفوعة والمحاولة مجدداً."
                          ].map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => setAdminReplyText(preset)}
                              className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[9px] text-slate-600 hover:text-blue-700 font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Message Input Form */}
                      <form onSubmit={handleSendAdminReply} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                        <button
                          type="submit"
                          disabled={!adminReplyText.trim()}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Send className="w-4.5 h-4.5 rotate-180" />
                          إرسال الرد
                        </button>
                        <input
                          type="text"
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleSendAdminReply();
                            }
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                          placeholder="اكتب ردك للمشترك هنا... (اضغط Ctrl+Enter للإرسال السريع)"
                        />
                      </form>
                    </>
                  );
                })()
              ) : (
                /* Active Chat Placeholder */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
                  <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shadow-inner border border-blue-100 mb-4 animate-bounce">
                    <MessageSquare className="w-10 h-10 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">منصة إدارة المحادثات والدعم المباشر</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                    الرجاء تحديد محادثة عضو من القائمة الجانبية للبدء في التواصل ومراجع طلباته والرد الفوري عليه.
                  </p>

                  {/* Summary support stats */}
                  <div className="grid grid-cols-2 gap-4 mt-6 max-w-md w-full">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                      <span className="text-[10px] text-slate-400 font-extrabold block">إجمالي المحادثات</span>
                      <span className="text-lg font-black text-slate-800 mt-1 block">{chats.length}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm relative overflow-hidden">
                      <span className="text-[10px] text-slate-400 font-extrabold block">محادثات بانتظار الرد</span>
                      <span className="text-lg font-black text-rose-600 mt-1 block">
                        {chats.filter(c => c.unreadByAdmin).length}
                      </span>
                      {chats.filter(c => c.unreadByAdmin).length > 0 && (
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Advanced Edit User Modal */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-extrabold text-xs">إدارة وتعديل بيانات العضو المتقدمة</h3>
              </div>
              <button 
                onClick={() => setSelectedUserForEdit(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-semibold text-right text-xs text-slate-700">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                <span className="block text-[10px] text-blue-600 font-extrabold">المعرف الفريد (الهاتف):</span>
                <span className="block font-mono font-bold text-slate-800" dir="ltr">{selectedUserForEdit.phone}</span>
                <span className="block text-[9px] text-slate-400 font-medium leading-relaxed">
                  * هذا الحقل هو هوية المستخدم الأساسية في النظام ولا يمكن تعديله لتجنب تلف علاقات الدعوات.
                </span>
              </div>

              {/* Creation Date and Online Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="block text-[10px] text-slate-500 font-extrabold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    تاريخ إنشاء الحساب (التسجيل):
                  </span>
                  <span className="block font-mono font-bold text-slate-800 text-[11px]" dir="ltr">
                    {selectedUserForEdit.createdAt ? new Date(selectedUserForEdit.createdAt).toLocaleString('ar-EG', {
                      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
                    }) : 'غير معروف'}
                  </span>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1">
                  <span className="block text-[10px] text-amber-900 font-extrabold">حالة الاتصال والتواجد:</span>
                  <div>
                    {isUserOnline(selectedUserForEdit) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        نشط الآن (داخل الموقع)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        غير نشط (خارج الموقع)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Login and Logout Times Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[10px]">
                <span className="block text-slate-500 font-extrabold border-b border-slate-200 pb-1 mb-1">
                  سجل الدخول والخروج والنشاط:
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="font-sans text-slate-400 block text-[9px]">آخر دخول:</span>
                    <span className="text-slate-800 font-bold" dir="ltr">
                      {selectedUserForEdit.lastLoginAt ? new Date(selectedUserForEdit.lastLoginAt).toLocaleString('ar-EG', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
                      }) : 'لم يسجل دخول'}
                    </span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-400 block text-[9px]">آخر خروج / تواجد:</span>
                    <span className="text-slate-800 font-bold" dir="ltr">
                      {selectedUserForEdit.lastLogoutAt ? new Date(selectedUserForEdit.lastLogoutAt).toLocaleString('ar-EG', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
                      }) : (selectedUserForEdit.lastActiveAt ? new Date(selectedUserForEdit.lastActiveAt).toLocaleString('ar-EG', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
                      }) : 'غير معروف')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detected Real Location Card */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-1">
                <span className="block text-[10px] text-emerald-800 font-extrabold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  الموقع الجغرافي المسجل الحقيقي (الدولة والمنطقة):
                </span>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm">{getCountryFlagEmoji(selectedUserForEdit.countryCode)}</span>
                  <span className="font-extrabold text-slate-900">{selectedUserForEdit.country || 'سيتم التحديد تلقائياً فور فتح العضو للتطبيق'}</span>
                  {(selectedUserForEdit.city || selectedUserForEdit.region) && (
                    <span className="text-emerald-700 font-bold">• {selectedUserForEdit.city || selectedUserForEdit.region}</span>
                  )}
                  {selectedUserForEdit.ip && (
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 mr-auto" dir="ltr">
                      IP: {selectedUserForEdit.ip}
                    </span>
                  )}
                </div>
                {selectedUserForEdit.lastLocationUpdate && (
                  <span className="block text-[9px] text-slate-400 font-medium">
                    آخر تحديث تلقائي للموقع: {new Date(selectedUserForEdit.lastLocationUpdate).toLocaleString('ar-EG')}
                  </span>
                )}
              </div>

              {/* Username Input */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">اسم المستخدم (الكامل):</label>
                <input
                  type="text"
                  value={editUsernameInput}
                  onChange={(e) => setEditUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">كلمة مرور الحساب (الباسورد):</label>
                <input
                  type="text"
                  value={editPasswordInput}
                  onChange={(e) => setEditPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  dir="ltr"
                />
              </div>

              {/* Wallet Address Input — تعديل حصري للأدمن (العضو لا يقدر يغيّره بنفسه) */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">عنوان محفظة السحب (Polygon):</label>
                <input
                  type="text"
                  value={editWalletAddressInput}
                  onChange={(e) => setEditWalletAddressInput(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  dir="ltr"
                />
                <p className="text-[10px] text-amber-600 font-bold mt-1">هذا الحقل مقفول على العضو نفسه — التعديل هنا فقط.</p>
              </div>

              {/* VIP Tier Selector */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">نوع الباقة المشترك بها (VIP Tier):</label>
                <select
                  value={editVipTierInput}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    setEditVipTierInput(selectedVal);
                    const matchedPlan = settings.vipPlans?.find(p => p.name === selectedVal);
                    if (matchedPlan?.isTrial) {
                      setEditEffectiveDays(1);
                    } else if (selectedVal === "الباقة العادية") {
                      setEditEffectiveDays(0);
                    } else {
                      setEditEffectiveDays(365);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="الباقة العادية">الباقة العادية</option>
                  {(settings.vipPlans && settings.vipPlans.length > 0 ? settings.vipPlans : [
                    { id: 'plan_600', name: 'باقة 600$', price: 600, profit: 18, tasksCount: 5 },
                    { id: 'plan_1200', name: 'باقة 1200$', price: 1200, profit: 38, tasksCount: 5 }
                  ]).map((plan) => (
                    <option key={plan.id} value={plan.name}>{plan.name}</option>
                  ))}
                </select>
              </div>

              {/* Numeric Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-600 text-[10px]">الرصيد الكلي (USDT):</label>
                  <input
                    type="number"
                    value={editEarnings}
                    onChange={(e) => setEditEarnings(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-600 text-[10px]">دخل المهمة (USDT):</label>
                  <input
                    type="number"
                    value={editTaskIncome}
                    onChange={(e) => setEditTaskIncome(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-600 text-[10px]">يوم العمل الفعال:</label>
                  <input
                    type="number"
                    value={editEffectiveDays}
                    onChange={(e) => setEditEffectiveDays(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Withdrawal Block Setting */}
              <div className="p-3 bg-red-50/50 border border-red-200/60 rounded-xl space-y-2">
                <span className="block text-[10px] text-red-800 font-extrabold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  حالة سحب الأرباح لهذا العضو:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditWithdrawalBlocked(false)}
                    className={`flex-1 py-2 px-3 rounded-lg border font-bold text-[11px] transition-all cursor-pointer text-center ${
                      !editWithdrawalBlocked
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    السحب مفعّل وطبيعي (مسموح)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditWithdrawalBlocked(true)}
                    className={`flex-1 py-2 px-3 rounded-lg border font-bold text-[11px] transition-all cursor-pointer text-center ${
                      editWithdrawalBlocked
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    وقف/حظر السحب للعضو 🔒
                  </button>
                </div>
                {editWithdrawalBlocked && (
                  <p className="text-[10px] text-rose-700 font-bold bg-white p-2 rounded-lg border border-rose-150 leading-relaxed text-right">
                    ⚠️ عند حظر السحب، لن يتمكن هذا العضو من تقديم أي طلبات سحب، وسيظهر له تنبيه يطالبه بجلب (2) من المشتركين الجدد والنشطين على الأقل في فئة VIP (B1) ليستعيد ميزة السحب التلقائي لديه.
                  </p>
                )}
              </div>

              {/* Holiday Bypass Setting */}
              <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2">
                <span className="block text-[10px] text-amber-800 font-extrabold flex items-center gap-1.5 justify-end">
                  حالة العطلة الرسمية لهذا العضو:
                  <Calendar className="w-4 h-4 text-amber-600" />
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditBypassHoliday(false)}
                    className={`flex-1 py-2 px-3 rounded-lg border font-bold text-[11px] transition-all cursor-pointer text-center ${
                      !editBypassHoliday
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    يخضع للعطلة الرسمية (إيقاف)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditBypassHoliday(true)}
                    className={`flex-1 py-2 px-3 rounded-lg border font-bold text-[11px] transition-all cursor-pointer text-center ${
                      editBypassHoliday
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    فتح العطلة وتخطي القفل 🔓
                  </button>
                </div>
                {editBypassHoliday && (
                  <p className="text-[10px] text-emerald-800 font-bold bg-white p-2 rounded-lg border border-emerald-150 leading-relaxed text-right">
                    🔓 لقد قمت باستثناء هذا العضو من العطلة الإجبارية. يمكنه العمل والوصول لقائمة المهمات وإنجازها بشكل طبيعي حتى لو كانت المنصة في وضع العطلة الرسمية اليوم!
                  </p>
                )}
              </div>

              
              {/* Ban Device Section */}
              <div className="p-3 bg-rose-50/50 border border-rose-200/60 rounded-xl space-y-2 mt-2">
                <span className="block text-[10px] text-rose-800 font-extrabold flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    حظر الجهاز والحساب نهائياً (Ban):
                  </div>
                </span>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditIsBanned(false);
                      setEditBanReason('');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg border font-bold text-[11px] transition-all cursor-pointer text-center ${
                      !editIsBanned
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    حساب سليم ومصرح له بالدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsBanned(true)}
                    className={`flex-1 py-2 px-3 rounded-lg border font-bold text-[11px] transition-all cursor-pointer text-center ${
                      editIsBanned
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-extrabold'
                        : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    حظر وطرد نهائي 🚫
                  </button>
                </div>
                {editIsBanned && (
                  <div className="space-y-2 mt-2 animate-fadeIn">
                    <label className="block text-[10px] text-rose-800 font-bold">سبب الحظر (يظهر للمستخدم):</label>
                    <input
                      type="text"
                      value={editBanReason}
                      onChange={(e) => setEditBanReason(e.target.value)}
                      placeholder="مثال: مخالفة شروط الاستخدام..."
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                    />
                    <p className="text-[9px] text-rose-600 leading-relaxed font-bold">
                      ⚠️ بمجرد تفعيل الحظر وحفظ التعديلات، سيتم طرد العضو من النظام تلقائياً ولن يتمكن من الدخول إلى حسابه من نفس الهاتف نهائياً.
                    </p>
                  </div>
                )}
              </div>

              {/* Buttons action layout */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSaveAdvancedUserEdit}
                  disabled={updating !== null}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer text-center font-bold text-xs"
                >
                  {updating === 'save_advanced_user' ? 'جاري الحفظ...' : 'حفظ وإغلاق'}
                </button>

                {showDeleteConfirm ? (
                  <div className="flex-1 bg-rose-50 border border-rose-200 p-2 rounded-xl flex items-center justify-between gap-2 animate-fadeIn">
                    <span className="text-[10px] text-rose-700 font-extrabold">تأكيد الحذف نهائياً؟</span>
                    <div className="flex gap-1">
                      <button
                        onClick={handleDeleteUser}
                        disabled={updating !== null}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-black cursor-pointer transition-all"
                      >
                        {updating === 'delete_user' ? 'جاري الحذف...' : 'حذف'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] px-2.5 py-1.5 rounded-lg font-black cursor-pointer transition-all"
                      >
                        تراجع
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={updating !== null}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-3 rounded-xl transition-all cursor-pointer text-center text-xs"
                  >
                    حذف العضو نهائياً
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Withdrawal Creator Modal */}
      {(selectedUserForWithdrawal || showManualWithdrawalModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-extrabold text-xs">إضافة سحب يدوي مخصص (وتاريخ) للعضو</h3>
              </div>
              <button 
                onClick={() => { setSelectedUserForWithdrawal(null); setShowManualWithdrawalModal(false); }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-semibold text-right text-xs text-slate-700">
              {selectedUserForWithdrawal ? (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                  <span className="block text-[10px] text-amber-800 font-extrabold">العضو المستهدف:</span>
                  <span className="block font-bold text-slate-900">{selectedUserForWithdrawal.username}</span>
                  <span className="block font-mono text-[10px] text-slate-500" dir="ltr">{selectedUserForWithdrawal.phone}</span>
                </div>
              ) : (
                <div>
                  <label className="block mb-1 font-bold text-slate-600">اختر العضو أو أدخل رقم الهاتف:</label>
                  <select
                    value={manualWithPhoneInput}
                    onChange={(e) => {
                      setManualWithPhoneInput(e.target.value);
                      const matched = users.find(u => u.phone === e.target.value);
                      if (matched && matched.walletAddress) {
                        setManualWithWallet(matched.walletAddress);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none mb-2"
                  >
                    <option value="">-- اختر العضو من القائمة --</option>
                    {users.map((u, i) => (
                      <option key={`${u.phone || u.id}_${i}`} value={u.phone}>
                        {u.username} ({u.phone})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={manualWithPhoneInput}
                    onChange={(e) => setManualWithPhoneInput(e.target.value)}
                    placeholder="أو أدخل رقم الهاتف يدوياً"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Withdrawal Amount */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">قيمة مبلغ السحب (USDT):</label>
                <input
                  type="number"
                  value={manualWithAmount}
                  onChange={(e) => setManualWithAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                />
              </div>

              {/* Withdrawal Destination Wallet */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">المحفظة / المحفظة المستهدفة:</label>
                <input
                  type="text"
                  value={manualWithWallet}
                  onChange={(e) => setManualWithWallet(e.target.value)}
                  placeholder=" pre-filled or manual address "
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 text-left"
                  dir="ltr"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">حالة عملية السحب:</label>
                <select
                  value={manualWithStatus}
                  onChange={(e) => setManualWithStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="approved">مقبول ومؤكد (Approved)</option>
                  <option value="pending">معلق للمراجعة (Pending)</option>
                  <option value="rejected">مرفوض (Rejected)</option>
                </select>
              </div>

              {/* Custom Date & Time Picker */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">تاريخ وتوقيت العملية المخصص (يدوياً):</label>
                <input
                  type="datetime-local"
                  value={manualWithDate}
                  onChange={(e) => setManualWithDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleCreateManualWithdrawal}
                  disabled={updating !== null}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  {updating === 'create_manual_withdrawal' ? 'جاري التسجيل...' : 'تسجيل وإدراج السحب اليدوي'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Deposit Creator Modal */}
      {(selectedUserForDeposit || showManualDepositModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-xs">إضافة إيداع يدوي مخصص (وتاريخ) لعضو</h3>
              </div>
              <button 
                onClick={() => { setSelectedUserForDeposit(null); setShowManualDepositModal(false); }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-semibold text-right text-xs text-slate-700">
              {selectedUserForDeposit ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                  <span className="block text-[10px] text-emerald-800 font-extrabold">العضو المستهدف:</span>
                  <span className="block font-bold text-slate-900">{selectedUserForDeposit.username}</span>
                  <span className="block font-mono text-[10px] text-slate-500" dir="ltr">{selectedUserForDeposit.phone}</span>
                </div>
              ) : (
                <div>
                  <label className="block mb-1 font-bold text-slate-600">اختر العضو أو أدخل رقم الهاتف:</label>
                  <select
                    value={manualDepPhoneInput}
                    onChange={(e) => setManualDepPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none mb-2"
                  >
                    <option value="">-- اختر العضو من القائمة --</option>
                    {users.map((u, i) => (
                      <option key={`${u.phone || u.id}_${i}`} value={u.phone}>
                        {u.username} ({u.phone})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={manualDepPhoneInput}
                    onChange={(e) => setManualDepPhoneInput(e.target.value)}
                    placeholder="أو أدخل رقم الهاتف يدوياً"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Deposit Amount */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">قيمة مبلغ الإيداع (USDT):</label>
                <input
                  type="number"
                  value={manualDepAmount}
                  onChange={(e) => setManualDepAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                />
              </div>

              {/* Deposit Network / Currency */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">الشبكة / نوع المحفظة:</label>
                <select
                  value={manualDepCurrency}
                  onChange={(e) => setManualDepCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="USDT (Polygon)">USDT (Polygon)</option>
                  <option value="USDT (TRC20)">USDT (TRC20)</option>
                  <option value="USDT (BEP20)">USDT (BEP20)</option>
                  <option value="يدوي / شحن إداري">يدوي / شحن إداري</option>
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">حالة عملية الإيداع:</label>
                <select
                  value={manualDepStatus}
                  onChange={(e) => setManualDepStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="approved">مقبول ومؤكد (يضيف الرصيد فوراً)</option>
                  <option value="pending">معلق للمراجعة (Pending)</option>
                  <option value="rejected">مرفوض (Rejected)</option>
                </select>
              </div>

              {/* Custom Date & Time Picker */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">تاريخ وتوقيت العملية المخصص (يدوياً):</label>
                <input
                  type="datetime-local"
                  value={manualDepDate}
                  onChange={(e) => setManualDepDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleCreateManualDeposit}
                  disabled={updating !== null}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  {updating === 'create_manual_deposit' ? 'جاري التسجيل...' : 'تسجيل وإدراج الإيداع اليدوي'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deposit Modal */}
      {selectedDepositForEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-extrabold text-xs">تعديل بيانات سجل الإيداع</h3>
              </div>
              <button 
                onClick={() => setSelectedDepositForEdit(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-semibold text-right text-xs text-slate-700">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                <span className="block text-[10px] text-blue-800 font-extrabold">بيانات العضو:</span>
                <span className="block font-bold text-slate-900">{selectedDepositForEdit.username}</span>
                <span className="block font-mono text-[10px] text-slate-500" dir="ltr">{selectedDepositForEdit.phone}</span>
              </div>

              {/* Amount */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">المبلغ (USDT):</label>
                <input
                  type="number"
                  value={editDepAmount}
                  onChange={(e) => setEditDepAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">الشبكة / العملة:</label>
                <input
                  type="text"
                  value={editDepCurrency}
                  onChange={(e) => setEditDepCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                  dir="ltr"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">حالة الطلب:</label>
                <select
                  value={editDepStatus}
                  onChange={(e) => setEditDepStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="approved">مقبول (Approved)</option>
                  <option value="pending">معلق (Pending)</option>
                  <option value="rejected">مرفوض (Rejected)</option>
                </select>
              </div>

              {/* Custom Date & Time */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">تاريخ وتوقيت السجل:</label>
                <input
                  type="datetime-local"
                  value={editDepDate}
                  onChange={(e) => setEditDepDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={handleUpdateDepositSubmit}
                  disabled={updating !== null}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  {updating === `edit_dep_${selectedDepositForEdit.id}` ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  onClick={() => setSelectedDepositForEdit(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Withdrawal Modal */}
      {selectedWithdrawalForEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-extrabold text-xs">تعديل بيانات سجل السحب</h3>
              </div>
              <button 
                onClick={() => setSelectedWithdrawalForEdit(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-semibold text-right text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                <span className="block text-[10px] text-amber-800 font-extrabold">بيانات العضو:</span>
                <span className="block font-bold text-slate-900">{selectedWithdrawalForEdit.username}</span>
                <span className="block font-mono text-[10px] text-slate-500" dir="ltr">{selectedWithdrawalForEdit.phone}</span>
              </div>

              {/* Amount */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">المبلغ (USDT):</label>
                <input
                  type="number"
                  value={editWithAmount}
                  onChange={(e) => setEditWithAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">الشبكة / العملة:</label>
                <input
                  type="text"
                  value={editWithCurrency}
                  onChange={(e) => setEditWithCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                  dir="ltr"
                />
              </div>

              {/* Wallet Address */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">عنوان المحفظة:</label>
                <input
                  type="text"
                  value={editWithWalletAddress}
                  onChange={(e) => setEditWithWalletAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">حالة الطلب:</label>
                <select
                  value={editWithStatus}
                  onChange={(e) => setEditWithStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="approved">مقبول (Approved)</option>
                  <option value="pending">معلق (Pending)</option>
                  <option value="rejected">مرفوض (Rejected)</option>
                </select>
              </div>

              {/* Custom Date & Time */}
              <div>
                <label className="block mb-1 font-bold text-slate-600">تاريخ وتوقيت السجل:</label>
                <input
                  type="datetime-local"
                  value={editWithDate}
                  onChange={(e) => setEditWithDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-center"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={handleUpdateWithdrawalSubmit}
                  disabled={updating !== null}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  {updating === `edit_with_${selectedWithdrawalForEdit.id}` ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  onClick={() => setSelectedWithdrawalForEdit(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Lightbox Modal for screenshot verification */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-[#070D19] p-2.5 rounded-2xl border border-blue-900/40 flex items-center justify-center overflow-hidden">
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer z-50"
            >
              ✕
            </button>
            <img
              src={activeLightboxImage}
              alt="Full Transfer Screenshot"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
          <p className="text-white/60 text-xs mt-3 font-semibold">اضغط على زر الإغلاق ✕ أو خارج الصورة للعودة</p>
          <div className="absolute inset-0 -z-10 cursor-pointer" onClick={() => setActiveLightboxImage(null)}></div>
        </div>
      )}

      {/* Admin Notifications Modal */}
      {showAdminNotifModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-extrabold text-xs">إشعارات الإدارة والعمليات</h3>
              </div>
              <button
                onClick={() => setShowAdminNotifModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-80 overflow-y-auto font-semibold text-right text-xs">
              {adminNotifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <span>لا توجد إشعارات جديدة حالياً.</span>
                </div>
              ) : (
                adminNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      n.read ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-red-50/80 border-red-200 text-red-950 font-bold'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs leading-relaxed">{n.message}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1"></span>
                      )}
                    </div>
                    <span className="block text-[9px] text-slate-400 mt-1" dir="ltr">
                      {new Date(n.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {adminNotifications.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <button
                  onClick={() => markAllNotificationsAsRead(adminUser)}
                  className="text-[10px] font-extrabold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  تعيين الكل كـ مقروء
                </button>
                <button
                  onClick={() => setShowAdminNotifModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Details Modal (نافذة تفاصيل الفريق وشجرة الإحالات) */}
      {selectedUserForTeamModal && selectedUserTeam && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-200 font-black text-lg shadow-inner">
                  {selectedUserForTeamModal.username ? selectedUserForTeamModal.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg text-white">
                      فريق: {selectedUserForTeamModal.username}
                    </h3>
                    <span className="bg-amber-400/90 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                      {selectedUserForTeamModal.vipTier || 'الباقة العادية'}
                    </span>
                    {selectedUserForTeamModal.hasDeposited && (
                      <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-400/30">
                        مستثمر مودع
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-indigo-300" />
                      <span className="font-mono text-white font-bold" dir="ltr">{selectedUserForTeamModal.phone}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span>كود الدعوة:</span>
                      <span className="bg-white/20 text-white px-1.5 py-0.5 rounded font-mono font-black text-[11px]">
                        {selectedUserForTeamModal.inviteCode || 'لا يوجد'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForTeamModal(null)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                <span className="block text-[10px] font-bold text-slate-500 mb-0.5">المستوى 1 (مباشر)</span>
                <span className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                  {selectedUserTeam.directCount}
                </span>
                <span className="text-[9px] text-slate-400 block">أعضاء بدعوته المباشرة</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                <span className="block text-[10px] font-bold text-slate-500 mb-0.5">إجمالي الفريق</span>
                <span className="text-base sm:text-lg font-black text-indigo-700 font-mono">
                  {selectedUserTeam.totalCount}
                </span>
                <span className="text-[9px] text-slate-400 block">جميع الأعضاء المباشرين</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                <span className="block text-[10px] font-bold text-slate-500 mb-0.5">الأعضاء المودعين النشطين</span>
                <span className="text-base sm:text-lg font-black text-amber-600 font-mono">
                  {selectedUserTeam.depositedCount}
                </span>
                <span className="text-[9px] text-slate-400 block">قاموا بالشحن والإيداع</span>
              </div>
            </div>

            {/* Filter and Search Bar inside modal */}
            <div className="p-3 sm:p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {/* Level Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `الكل (${selectedUserTeam.totalCount})` },
                  { id: '1', label: `المستوى 1 (${selectedUserTeam.directCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setModalLevelFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                      modalLevelFilter === tab.id
                        ? 'bg-indigo-600 text-white font-black shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Inside Team */}
              <div className="relative min-w-[200px] sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث في أعضاء الفريق..."
                  value={modalMemberSearch}
                  onChange={(e) => setModalMemberSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
                {modalMemberSearch && (
                  <button
                    onClick={() => setModalMemberSearch('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body - Team Members List */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/50">
              {filteredModalMembers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                  <Network className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700">لا يوجد أعضاء في هذا القسم</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {modalMemberSearch ? 'لا توجد نتائج مطابقة لبحثك' : 'لم يسجل أي عضو في هذا المستوى بعد'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredModalMembers.map((item, idx) => {
                    const m = item.member;
                    const directSponsor = m.referrerCode ? inviteCodeToUserMap[m.referrerCode.trim().toUpperCase()] : null;
                    const subTeam = getUserTeamBreakdown(m);

                    return (
                      <div 
                        key={`${m.phone || m.id}_${idx}`}
                        className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                      >
                        {/* Top Ribbon / Level Badge */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300`}>
                              المستوى 1 (مباشر)
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              m.vipTier && m.vipTier !== 'الباقة العادية' && m.vipTier !== 'VIP0'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {m.vipTier || 'الباقة العادية'}
                            </span>
                            {m.hasDeposited ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                ✅ مودع
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-medium px-1.5 py-0.5 rounded">
                                ⏳ مجاني
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Member Details */}
                        <div className="pt-2.5 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                {m.username}
                              </span>
                              {isUserOnline(m) && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="نشط الآن"></span>
                              )}
                            </div>

                            {/* Phone & Quick Copy */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-slate-700 text-xs" dir="ltr">
                                {m.phone}
                              </span>
                              <button
                                onClick={() => handleCopyText(m.phone, `modal_phone_${m.phone}`)}
                                className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
                                title="نسخ رقم الهاتف"
                              >
                                {copiedKey === `modal_phone_${m.phone}` ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Referrer Info */}
                            {directSponsor && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
                                <span className="text-slate-400">الراعي المباشر:</span>
                                <span className="font-bold text-slate-700">{directSponsor.username}</span>
                                <span className="font-mono text-slate-400" dir="ltr">({directSponsor.phone})</span>
                              </div>
                            )}

                            {/* Join Date */}
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>انضم بتاريخ: {m.createdAt ? new Date(m.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'غير محدد'}</span>
                            </div>
                          </div>

                          {/* Balance & Sub-team Quick Drill */}
                          <div className="text-left space-y-1.5 shrink-0">
                            <div className="bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-left">
                              <span className="block text-[8px] text-slate-400">الرصيد / الأرباح</span>
                              <span className="text-[11px] font-black text-slate-800 font-mono">
                                ${((m.balance || 0) + (m.earnings || 0)).toFixed(2)}
                              </span>
                            </div>

                            {/* Button to Drill Down into this member's team */}
                            {subTeam.totalCount > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedUserForTeamModal(m);
                                  setModalLevelFilter('all');
                                  setModalMemberSearch('');
                                }}
                                className="w-full text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                                title="عرض فريق هذا العضو"
                              >
                                <Network className="w-3 h-3" />
                                <span>فريقه ({subTeam.totalCount})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-600 font-bold">
                إجمالي المعروض: <span className="font-black text-indigo-600">{filteredModalMembers.length}</span> من أصل <span className="font-black text-slate-800">{selectedUserTeam.totalCount}</span> عضو
              </div>
              <button
                onClick={() => setSelectedUserForTeamModal(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal (نافذة تأكيد الحذف الجماعي للأعضاء) */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-red-200 w-full max-w-xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-inner">
                  <Trash2 className="w-6 h-6 text-red-100" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                    <span>حذف جماعي للأعضاء</span>
                    <span className="bg-white text-red-700 text-xs px-2 py-0.5 rounded-full font-black">
                      {selectedUserPhones.length}
                    </span>
                  </h3>
                  <p className="text-xs text-red-100 mt-0.5">
                    تأكيد حذف الحسابات المحددة من قاعدة البيانات نهائياً
                  </p>
                </div>
              </div>

              {!updating && (
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteModal(false)}
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Alert Warning Box */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-rose-800 space-y-1">
                  <span className="font-black block text-xs">تحذير أمني هام!</span>
                  <p className="text-[11px] leading-relaxed">
                    سيتم مسح بيانات <strong className="font-black text-rose-950">({selectedUserPhones.length})</strong> عضو بشكل كامل ونهائي من قاعدة البيانات، بما في ذلك سجلاتهم المالية، طلبات الإيداع والسحب، وسجلات المهام.
                  </p>
                </div>
              </div>

              {/* Progress Indicator if Deleting */}
              {batchDeleteProgress && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                      <span>جاري حذف الأعضاء...</span>
                    </span>
                    <span className="font-mono text-red-600 font-black">
                      {batchDeleteProgress.current} / {batchDeleteProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${(batchDeleteProgress.current / batchDeleteProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Preview of Selected Members */}
              <div>
                <span className="font-bold text-slate-700 block mb-2">
                  قائمة الأعضاء المحدد حذفهم ({selectedUserPhones.length}):
                </span>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {users.filter(u => selectedUserPhones.includes(u.phone)).map((u, idx) => (
                    <div key={`${u.phone || u.id}_${idx}`} className="p-2.5 flex items-center justify-between gap-2 hover:bg-white transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 w-4 text-center">{idx + 1}</span>
                        <div className="min-w-0">
                          <span className="font-black text-slate-800 block truncate text-xs">{u.username}</span>
                          <span className="font-mono text-[10px] text-slate-500 block" dir="ltr">{u.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {u.vipTier || 'بدون باقة'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {u.earnings || 0} USDT
                        </span>
                        <button
                          type="button"
                          disabled={updating !== null}
                          onClick={() => toggleSelectUser(u.phone)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="استبعاد من الحذف"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-slate-500 font-bold">
                المجموع المحدد: <strong className="text-red-600 font-black">{selectedUserPhones.length}</strong> عضو
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteModal(false)}
                  disabled={updating !== null}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  disabled={updating !== null || selectedUserPhones.length === 0}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {updating === 'batch_delete_users' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري حذف الأعضاء...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>تأكيد وحذف ({selectedUserPhones.length}) عضو نهائياً</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
