import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Donor, Donation, DonorType, DonationCategory, DonationItemDetails } from '../types';
import {
  HeartHandshake,
  Search,
  Plus,
  Receipt,
  Building2,
  User,
  Send,
  Trash2,
  X,
  Coins,
  Package,
  Boxes,
  AlertTriangle,
  GraduationCap,
  Shirt,
  Stethoscope,
  Flame,
  Warehouse,
  Truck,
  CheckCircle2,
  Info,
  Edit3,
  Calendar,
  TrendingUp,
  BadgeCheck
} from 'lucide-react';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { getExchangeRateForDate, convertByDateRate, aggregateAmountsByDayRate } from '../utils/exchangeRates';

export const DonorsView: React.FC = () => {
  const {
    donors,
    donations,
    projects,
    beneficiaries,
    addDonor,
    updateDonor,
    deleteDonor,
    addDonation,
    updateDonation,
    deleteDonation,
    sendSMS
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'donors' | 'donations'>('donors');
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false);
  const [isAddDonationModalOpen, setIsAddDonationModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Donation | null>(null);

  // New Donor Form State
  const [donorForm, setDonorForm] = useState({
    fullName: '',
    type: 'individual' as DonorType,
    phone: '',
    email: '',
    governorate: 'هەولێر',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  // New Donation Form State with Rich Categories & Details
  const [donationAmountStr, setDonationAmountStr] = useState('100000');
  const [donationUnitPriceStr, setDonationUnitPriceStr] = useState('');
  const [donationEstValueStr, setDonationEstValueStr] = useState('');
  const [donationForm, setDonationForm] = useState({
    donorId: '',
    category: 'cash' as DonationCategory,
    // Cash
    amount: 100000,
    currency: 'IQD' as 'IQD' | 'USD',
    // In-Kind specific fields
    quantity: 50,
    unit: 'کارتۆن / سەبەتە',
    weightKgPerUnit: 15,
    contentsDescription: 'برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە',
    estimatedMarketValue: 0,
    educationStage: 'سەرەتایی',
    clothingType: 'جلوبەرگی زستانە',
    // Payment method (Default is Cash!)
    method: 'کاش' as Donation['method'],
    date: new Date().toISOString().split('T')[0],
    // Destination (Warehouse, direct distribution, funds, or projects)
    destinationType: 'warehouse',
    notes: ''
  });

  // Custom Day-Rate Overrides (Optional user fine-tuning)
  const [customAddRate, setCustomAddRate] = useState<number | null>(null);
  const [isCustomAddRateOpen, setIsCustomAddRateOpen] = useState(false);
  const [customEditRate, setCustomEditRate] = useState<number | null>(null);
  const [isCustomEditRateOpen, setIsCustomEditRateOpen] = useState(false);

  // Edit Donation Modal State
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [isEditDonationModalOpen, setIsEditDonationModalOpen] = useState(false);
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editUnitPriceStr, setEditUnitPriceStr] = useState('');
  const [editEstValueStr, setEditEstValueStr] = useState('');
  const [editDonationForm, setEditDonationForm] = useState({
    donorId: '',
    category: 'cash' as DonationCategory,
    amount: 100000,
    currency: 'IQD' as 'IQD' | 'USD',
    quantity: 50,
    unit: 'کارتۆن / سەبەتە',
    weightKgPerUnit: 15,
    contentsDescription: '',
    estimatedMarketValue: 0,
    educationStage: 'سەرەتایی',
    clothingType: 'جلوبەرگی زستانە',
    method: 'کاش' as Donation['method'],
    date: new Date().toISOString().split('T')[0],
    destinationType: 'warehouse',
    notes: ''
  });

  // Quantity of in-kind donation already distributed to beneficiaries
  const alreadyDistributedCount = useMemo(() => {
    if (!editingDonation || editingDonation.category === 'cash') return 0;
    return beneficiaries.reduce((total, ben) => {
      return total + (ben.aidHistory || [])
        .filter(aid =>
          aid.type === 'in-kind' && (
            (aid.receiptNumber && aid.receiptNumber === editingDonation.receiptNumber) ||
            (aid.receiptNumber && aid.receiptNumber === editingDonation.id)
          )
        )
        .reduce((sum, aid) => sum + (Number(aid.quantity) || 0), 0);
    }, 0);
  }, [editingDonation, beneficiaries]);

  // Edit Donor Modal State
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [isEditDonorModalOpen, setIsEditDonorModalOpen] = useState(false);
  const [editDonorForm, setEditDonorForm] = useState({
    fullName: '',
    type: 'individual' as DonorType,
    phone: '',
    email: '',
    governorate: 'هەولێر',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  // Filtered Donors
  const filteredDonors = donors.filter(d => {
    const q = searchQuery.toLowerCase();
    return d.fullName.toLowerCase().includes(q) || d.phone.includes(q) || d.governorate.toLowerCase().includes(q);
  });

  // Filtered Donations
  const filteredDonations = donations.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(q) ||
      d.receiptNumber.toLowerCase().includes(q) ||
      (d.projectName && d.projectName.toLowerCase().includes(q)) ||
      (d.categoryLabel && d.categoryLabel.toLowerCase().includes(q))
    );
  });

  const handleAddDonorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDonor(donorForm);
    setIsAddDonorModalOpen(false);
    setDonorForm({
      fullName: '',
      type: 'individual',
      phone: '',
      email: '',
      governorate: 'هەولێر',
      status: 'active',
      notes: ''
    });
  };

  // Reset donation form
  const resetDonationForm = (donorId?: string) => {
    setDonationAmountStr('100000');
    setDonationUnitPriceStr('');
    setDonationEstValueStr('');
    setDonationForm({
      donorId: donorId || (donors.length > 0 ? donors[0].id : ''),
      category: 'cash',
      amount: 100000,
      currency: 'IQD',
      quantity: 50,
      unit: 'کارتۆن / سەبەتە',
      weightKgPerUnit: 15,
      contentsDescription: 'برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە',
      estimatedMarketValue: 0,
      educationStage: 'سەرەتایی',
      clothingType: 'جلوبەرگی زستانە',
      method: 'کاش',
      date: new Date().toISOString().split('T')[0],
      destinationType: 'warehouse',
      notes: ''
    });
    setCustomAddRate(null);
    setIsCustomAddRateOpen(false);
  };

  // Linked unit price & total value calculations for Add Donation
  const handleAddDonationUnitPriceChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setDonationUnitPriceStr(clean);
    const unitP = clean ? parseInt(clean, 10) : 0;
    const qty = Number(donationForm.quantity) || 1;
    if (unitP > 0) {
      setDonationEstValueStr((unitP * qty).toString());
    } else {
      setDonationEstValueStr('');
    }
  };

  const handleAddDonationTotalValueChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setDonationEstValueStr(clean);
    const totalV = clean ? parseInt(clean, 10) : 0;
    const qty = Number(donationForm.quantity) || 1;
    if (totalV > 0 && qty > 0) {
      setDonationUnitPriceStr(Math.round(totalV / qty).toString());
    } else {
      setDonationUnitPriceStr('');
    }
  };

  const handleAddDonationQuantityChange = (newQty: number) => {
    setDonationForm(prev => ({ ...prev, quantity: newQty }));
    const unitP = donationUnitPriceStr ? parseInt(donationUnitPriceStr.replace(/[^0-9]/g, ''), 10) : 0;
    if (unitP > 0) {
      setDonationEstValueStr((unitP * newQty).toString());
    } else {
      const totalV = donationEstValueStr ? parseInt(donationEstValueStr.replace(/[^0-9]/g, ''), 10) : 0;
      if (totalV > 0 && newQty > 0) {
        setDonationUnitPriceStr(Math.round(totalV / newQty).toString());
      }
    }
  };

  // Linked unit price & total value calculations for Edit Donation
  const handleEditDonationUnitPriceChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setEditUnitPriceStr(clean);
    const unitP = clean ? parseInt(clean, 10) : 0;
    const qty = Number(editDonationForm.quantity) || 1;
    if (unitP > 0) {
      setEditEstValueStr((unitP * qty).toString());
    } else {
      setEditEstValueStr('');
    }
  };

  const handleEditDonationTotalValueChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setEditEstValueStr(clean);
    const totalV = clean ? parseInt(clean, 10) : 0;
    const qty = Number(editDonationForm.quantity) || 1;
    if (totalV > 0 && qty > 0) {
      setEditUnitPriceStr(Math.round(totalV / qty).toString());
    } else {
      setEditUnitPriceStr('');
    }
  };

  const handleEditDonationQuantityChange = (newQty: number) => {
    setEditDonationForm(prev => ({ ...prev, quantity: newQty }));
    const unitP = editUnitPriceStr ? parseInt(editUnitPriceStr.replace(/[^0-9]/g, ''), 10) : 0;
    if (unitP > 0) {
      setEditEstValueStr((unitP * newQty).toString());
    } else {
      const totalV = editEstValueStr ? parseInt(editEstValueStr.replace(/[^0-9]/g, ''), 10) : 0;
      if (totalV > 0 && newQty > 0) {
        setEditUnitPriceStr(Math.round(totalV / newQty).toString());
      }
    }
  };

  // Handle Category Change with smart defaults
  const handleCategoryChange = (cat: DonationCategory) => {
    let defaultContents = '';
    let defaultUnit = 'دانە';
    let defaultWeight = 0;
    let defaultMethod = donationForm.method;

    if (cat === 'cash') {
      defaultMethod = 'کاش';
    } else if (cat === 'food_basket') {
      defaultUnit = 'کارتۆن / سەبەتە';
      defaultWeight = 15;
      defaultContents = 'برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'student_supplies') {
      defaultUnit = 'جانتا / پاکێج';
      defaultContents = 'جانتای پشت، دەفتەر، قەڵەم، جێقەڵەم، ئامێری ئەندازە';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'clothes') {
      defaultUnit = 'دەست / پارچە';
      defaultContents = 'چاکەت، پێڵاو، جلوبەرگی زستانەی منداڵان و گەوران';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'medical') {
      defaultUnit = 'دانە / پاکەت';
      defaultContents = 'ویلچێری خاوەن پێداویستی، پێداویستی نەشتەرگەری، دەرمانی درێژخایەن';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'heating_appliances') {
      defaultUnit = 'دانە';
      defaultContents = 'سۆپای نەوت، بەتانی زستانە، فەرش';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'qurbani_meat') {
      defaultUnit = 'کیلۆگرام / سەر ئاژەڵ';
      defaultContents = 'گۆشتی قوربانی دابەشکراو بە پاکێجی تەندروست';
      defaultMethod = 'کەرەستە و کاڵا';
    } else {
      defaultUnit = 'دانە';
      defaultContents = '';
      defaultMethod = 'کەرەستە و کاڵا';
    }

    setDonationForm(prev => ({
      ...prev,
      category: cat,
      unit: defaultUnit,
      weightKgPerUnit: defaultWeight,
      contentsDescription: defaultContents,
      method: defaultMethod
    }));
  };

  const handleAddDonationCurrencySwitch = (newCurr: 'IQD' | 'USD') => {
    if (newCurr === donationForm.currency) return;
    const clean = donationAmountStr.replace(/[^0-9]/g, '');
    const num = clean ? parseInt(clean, 10) : 0;
    const dayRate = customAddRate || getExchangeRateForDate(donationForm.date).rate;
    if (num > 0 && dayRate > 0) {
      if (newCurr === 'USD') {
        setDonationAmountStr(Math.round(num / dayRate).toString());
      } else {
        setDonationAmountStr(Math.round(num * dayRate).toString());
      }
    }
    setDonationForm(prev => ({ ...prev, currency: newCurr }));
  };

  const handleEditDonationCurrencySwitch = (newCurr: 'IQD' | 'USD') => {
    if (newCurr === editDonationForm.currency) return;
    const clean = editAmountStr.replace(/[^0-9]/g, '');
    const num = clean ? parseInt(clean, 10) : 0;
    const dayRate = customEditRate || getExchangeRateForDate(editDonationForm.date).rate;
    if (num > 0 && dayRate > 0) {
      if (newCurr === 'USD') {
        setEditAmountStr(Math.round(num / dayRate).toString());
      } else {
        setEditAmountStr(Math.round(num * dayRate).toString());
      }
    }
    setEditDonationForm(prev => ({ ...prev, currency: newCurr }));
  };

  const handleAddDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDonor = donors.find(d => d.id === donationForm.donorId);
    if (!targetDonor) {
      alert('تکایە بەخشەرێک هەڵبژێرە');
      return;
    }

    // Resolve Destination / Allocation Name
    const destNames: Record<string, string> = {
      warehouse: 'کۆگای سەرەکی ڕێکخراو (پاشەکەوتکردن بۆ کاتی پێویست)',
      direct_distribution: 'دابەشکردنی دەستبەجێ و ڕاستەوخۆ بەسەر خێزانە هەژارەکاندا',
      general_fund: 'سندووقی گشتی خێرخوازی و فریاگوزاری خێرا',
      orphan_fund: 'سندووقی چاودێری و کەفالەتی مانگانەی هەتیوان',
      medical_fund: 'سندووقی نەشتەرگەری و دەرمانی کتوپڕ',
      students_fund: 'سندووقی خوێندکاران و پشتیوانی پەروەردە',
      winter_campaign: 'سندووقی کەمپەینی زستانە و سوتەمەنی'
    };

    let finalProjectName = '';
    let finalProjectId: string | undefined = undefined;

    if (donationForm.destinationType.startsWith('proj_')) {
      const pId = donationForm.destinationType.replace('proj_', '');
      const p = projects.find(pr => pr.id === pId);
      finalProjectId = p?.id;
      finalProjectName = p ? `پڕۆژە: ${p.title}` : 'پڕۆژەی دیاریکراو';
    } else {
      finalProjectName = destNames[donationForm.destinationType] || 'سندووقی گشتی خێرخوازی';
    }

    // Resolve Category Label & Items
    const categoryLabelsMap: Record<DonationCategory, string> = {
      cash: 'کۆمەکی نەختینەیی (پارەی کاش)',
      food_basket: 'سەبەتەی خۆراکی',
      student_supplies: 'جانتا و پێداویستی خوێندکاران',
      clothes: 'جلوبەرگ و پۆشاک',
      medical: 'دەرمان و پێداویستی پزیشکی',
      heating_appliances: 'کەلوپەلی ناوماڵ و گەرمکەرەوە',
      qurbani_meat: 'قوربانی و گۆشت',
      other_in_kind: 'کەرەستە و کەلوپەلی تر'
    };

    const isCash = donationForm.category === 'cash';
    const cleanAmount = donationAmountStr.replace(/[^0-9]/g, '');
    const cleanEstValue = donationEstValueStr.replace(/[^0-9]/g, '');
    const cleanUnitP = donationUnitPriceStr.replace(/[^0-9]/g, '');
    const finalAmount = isCash
      ? (cleanAmount ? parseInt(cleanAmount, 10) : 0)
      : (cleanEstValue ? parseInt(cleanEstValue, 10) : 0);
    const donQty = Number(donationForm.quantity) || 1;
    const finalUnitP = cleanUnitP ? parseInt(cleanUnitP, 10) : (finalAmount > 0 && donQty > 0 ? Math.round(finalAmount / donQty) : 0);

    let itemDetails: DonationItemDetails | undefined = undefined;
    if (!isCash) {
      itemDetails = {
        quantity: donQty,
        unit: donationForm.unit,
        unitPrice: finalUnitP,
        estimatedMarketValue: finalAmount,
        weightKgPerUnit:
          donationForm.category === 'food_basket'
            ? Number(donationForm.weightKgPerUnit)
            : undefined,
        contentsDescription:
          donationForm.category === 'student_supplies'
            ? `${donationForm.contentsDescription} (قۆناغ: ${donationForm.educationStage})`
            : donationForm.category === 'clothes'
            ? `${donationForm.clothingType} - ${donationForm.contentsDescription}`
            : donationForm.contentsDescription
      };
    }

    const dayRateInfo = getExchangeRateForDate(donationForm.date);
    const appliedRate = customAddRate || dayRateInfo.rate;
    const conversion = convertByDateRate(finalAmount, donationForm.currency, appliedRate);

    const newDonation = addDonation({
      donorId: targetDonor.id,
      donorName: targetDonor.fullName,
      category: donationForm.category,
      categoryLabel: categoryLabelsMap[donationForm.category],
      itemDetails,
      amount: finalAmount,
      currency: donationForm.currency,
      exchangeRateAtDate: appliedRate,
      convertedAmount: conversion.convertedAmount,
      exchangeRateSource: dayRateInfo.source,
      method: donationForm.method,
      date: donationForm.date,
      projectId: finalProjectId,
      projectName: finalProjectName,
      notes: donationForm.notes
    });

    setIsAddDonationModalOpen(false);
    setActiveReceipt(newDonation);
    resetDonationForm();
  };

  // Open Edit Donation Modal
  const handleOpenEditDonation = (don: Donation) => {
    setEditingDonation(don);

    let destType = 'warehouse';
    if (don.projectId) {
      destType = `proj_${don.projectId}`;
    } else if (don.projectName?.includes('دەستبەجێ')) {
      destType = 'direct_distribution';
    } else if (don.projectName?.includes('هەتیوان')) {
      destType = 'orphan_fund';
    } else if (don.projectName?.includes('دەرمان') || don.projectName?.includes('پزیشکی')) {
      destType = 'medical_fund';
    } else if (don.projectName?.includes('خوێندکاران')) {
      destType = 'students_fund';
    } else if (don.projectName?.includes('زستانە')) {
      destType = 'winter_campaign';
    } else if (don.projectName?.includes('گشتی')) {
      destType = 'general_fund';
    }

    const donQty = don.itemDetails?.quantity || 1;
    let donUnitP = don.itemDetails?.unitPrice || 0;
    let donTotalV = don.itemDetails?.estimatedMarketValue || don.amount || 0;
    if (!donUnitP) {
      if (donTotalV > 0 && donQty > 0) {
        if (don.amount > donTotalV && don.amount === donQty * donTotalV) {
          donUnitP = donTotalV;
          donTotalV = don.amount;
        } else {
          donUnitP = Math.round(donTotalV / donQty);
        }
      }
    }

    setEditAmountStr(don.amount ? don.amount.toString() : '');
    setEditUnitPriceStr(donUnitP > 0 ? donUnitP.toString() : '');
    setEditEstValueStr(donTotalV > 0 ? donTotalV.toString() : '');

    setEditDonationForm({
      donorId: don.donorId,
      category: don.category || 'cash',
      amount: don.amount,
      currency: don.currency,
      quantity: donQty,
      unit: don.itemDetails?.unit || 'دانە',
      weightKgPerUnit: don.itemDetails?.weightKgPerUnit || 0,
      contentsDescription: don.itemDetails?.contentsDescription || '',
      estimatedMarketValue: donTotalV,
      educationStage: 'سەرەتایی',
      clothingType: 'جلوبەرگی زستانە',
      method: don.method,
      date: don.date,
      destinationType: destType,
      notes: don.notes || ''
    });

    setCustomEditRate(don.exchangeRateAtDate || null);
    setIsCustomEditRateOpen(false);

    setIsEditDonationModalOpen(true);
  };

  const handleEditCategoryChange = (cat: DonationCategory) => {
    let defaultContents = '';
    let defaultUnit = 'دانە';
    let defaultWeight = 0;
    let defaultMethod = editDonationForm.method;

    if (cat === 'cash') {
      defaultMethod = 'کاش';
    } else if (cat === 'food_basket') {
      defaultUnit = 'کارتۆن / سەبەتە';
      defaultWeight = 15;
      defaultContents = 'برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'student_supplies') {
      defaultUnit = 'جانتا / پاکێج';
      defaultContents = 'جانتای پشت، دەفتەر، قەڵەم، جێقەڵەم، ئامێری ئەندازە';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'clothes') {
      defaultUnit = 'دەست / پارچە';
      defaultContents = 'چاکەت، پێڵاو، جلوبەرگی زستانەی منداڵان و گەوران';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'medical') {
      defaultUnit = 'دانە / پاکەت';
      defaultContents = '';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'heating_appliances') {
      defaultUnit = 'ئامێر / دانە';
      defaultContents = 'سۆپای نەوت، بەتانی گەرم، سۆپای غاز';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'qurbani_meat') {
      defaultUnit = 'کیلۆگرام / پاکێج';
      defaultContents = 'گۆشتی قوربانی فرێش لە ناو کیسی بەستراودا';
      defaultMethod = 'کەرەستە و کاڵا';
    } else {
      defaultUnit = 'دانە';
      defaultContents = '';
      defaultMethod = 'کەرەستە و کاڵا';
    }

    setEditDonationForm(prev => ({
      ...prev,
      category: cat,
      unit: defaultUnit,
      weightKgPerUnit: defaultWeight,
      contentsDescription: defaultContents,
      method: defaultMethod
    }));
  };

  const handleSaveEditDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonation) return;

    const targetDonor = donors.find(d => d.id === editDonationForm.donorId) || {
      id: editingDonation.donorId,
      fullName: editingDonation.donorName
    };

    const destNames: Record<string, string> = {
      warehouse: 'کۆگای سەرەکی ڕێکخراو (پاشەکەوتکردن بۆ کاتی پێویست)',
      direct_distribution: 'دابەشکردنی دەستبەجێ بەسەر خێزانە هەژارەکاندا',
      orphan_fund: 'سندووقی پشتگیری هەتیوان و بێسەرپەرشتان',
      medical_fund: 'سندووقی چارەسەری نەخۆش و دەرمان',
      students_fund: 'سندووقی هاوکاری خوێندکارانی کەمدەرامەت',
      general_fund: 'سندووقی گشتی خێرخوازی',
      winter_campaign: 'سندووقی کەمپەینی زستانە و سوتەمەنی'
    };

    let finalProjectName = '';
    let finalProjectId: string | undefined = undefined;

    if (editDonationForm.destinationType.startsWith('proj_')) {
      const pId = editDonationForm.destinationType.replace('proj_', '');
      const p = projects.find(pr => pr.id === pId);
      finalProjectId = p?.id;
      finalProjectName = p ? `پڕۆژە: ${p.title}` : 'پڕۆژەی دیاریکراو';
    } else {
      finalProjectName = destNames[editDonationForm.destinationType] || 'سندووقی گشتی خێرخوازی';
    }

    const categoryLabelsMap: Record<DonationCategory, string> = {
      cash: 'کۆمەکی نەختینەیی (پارەی کاش)',
      food_basket: 'سەبەتەی خۆراکی',
      student_supplies: 'جانتا و پێداویستی خوێندکاران',
      clothes: 'جلوبەرگ و پۆشاک',
      medical: 'دەرمان و پێداویستی پزیشکی',
      heating_appliances: 'کەلوپەلی ناوماڵ و گەرمکەرەوە',
      qurbani_meat: 'قوربانی و گۆشت',
      other_in_kind: 'کەرەستە و کەلوپەلی تر'
    };

    const isCash = editDonationForm.category === 'cash';
    const cleanAmount = editAmountStr.replace(/[^0-9]/g, '');
    const cleanEstValue = editEstValueStr.replace(/[^0-9]/g, '');
    const cleanUnitP = editUnitPriceStr.replace(/[^0-9]/g, '');
    const finalAmount = isCash
      ? (cleanAmount ? parseInt(cleanAmount, 10) : 0)
      : (cleanEstValue ? parseInt(cleanEstValue, 10) : 0);

    let itemDetails: DonationItemDetails | undefined = undefined;
    if (!isCash) {
      const requestedQty = Number(editDonationForm.quantity) || 1;
      if (alreadyDistributedCount > 0 && requestedQty < alreadyDistributedCount) {
        alert(`هەڵە! ناکرێت بڕی کۆی بەخشین (${requestedQty}) لەو بڕە کەمتر بێت کە پێشتر دابەشکراوە بەسەر خێزانەکاندا (${alreadyDistributedCount})!`);
        return;
      }

      const finalUnitP = cleanUnitP ? parseInt(cleanUnitP, 10) : (finalAmount > 0 && requestedQty > 0 ? Math.round(finalAmount / requestedQty) : 0);

      itemDetails = {
        quantity: requestedQty,
        unit: editDonationForm.unit,
        unitPrice: finalUnitP,
        estimatedMarketValue: finalAmount,
        weightKgPerUnit:
          editDonationForm.category === 'food_basket'
            ? Number(editDonationForm.weightKgPerUnit)
            : undefined,
        contentsDescription:
          editDonationForm.category === 'student_supplies'
            ? `${editDonationForm.contentsDescription} (قۆناغ: ${editDonationForm.educationStage})`
            : editDonationForm.category === 'clothes'
            ? `${editDonationForm.clothingType} - ${editDonationForm.contentsDescription}`
            : editDonationForm.contentsDescription
      };
    }

    const dayRateInfo = getExchangeRateForDate(editDonationForm.date);
    const appliedRate = customEditRate || dayRateInfo.rate;
    const conversion = convertByDateRate(finalAmount, editDonationForm.currency, appliedRate);

    const updatedDonation: Donation = {
      ...editingDonation,
      donorId: targetDonor.id,
      donorName: targetDonor.fullName,
      category: editDonationForm.category,
      categoryLabel: categoryLabelsMap[editDonationForm.category],
      itemDetails,
      amount: finalAmount,
      currency: editDonationForm.currency,
      exchangeRateAtDate: appliedRate,
      convertedAmount: conversion.convertedAmount,
      exchangeRateSource: dayRateInfo.source,
      method: editDonationForm.method,
      date: editDonationForm.date,
      projectId: finalProjectId,
      projectName: finalProjectName,
      notes: editDonationForm.notes
    };

    updateDonation(updatedDonation);
    setIsEditDonationModalOpen(false);
    setEditingDonation(null);
  };

  const handleDeleteDonation = (don: Donation) => {
    const confirmMsg = `دڵنیایت لە سڕینەوەی پسوولەی بەخشینی [${don.receiptNumber}] بە بڕی (${don.amount.toLocaleString()} ${don.currency === 'IQD' ? 'د.ع' : '$'}) لەلایەن [${don.donorName}]؟\n\nئەم کردارە بڕەکە لە کۆی بەخشینی بەخشەر و کاڵاکانی کۆگاش دەسڕێتەوە.`;
    if (window.confirm(confirmMsg)) {
      deleteDonation(don.id);
    }
  };

  const handleOpenEditDonor = (donor: Donor) => {
    setEditingDonor(donor);
    setEditDonorForm({
      fullName: donor.fullName,
      type: donor.type,
      phone: donor.phone,
      email: donor.email,
      governorate: donor.governorate,
      status: donor.status,
      notes: donor.notes || ''
    });
    setIsEditDonorModalOpen(true);
  };

  const handleSaveEditDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonor) return;
    updateDonor({
      ...editingDonor,
      fullName: editDonorForm.fullName,
      type: editDonorForm.type,
      phone: editDonorForm.phone,
      email: editDonorForm.email,
      governorate: editDonorForm.governorate,
      status: editDonorForm.status,
      notes: editDonorForm.notes
    });
    setIsEditDonorModalOpen(false);
    setEditingDonor(null);
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-emerald-600" />
            بەڕێوەبردنی بەخشەران و پسوولەی بەخشین
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تۆماری فەرمی بەخشینە نەختینەیی و عەینییەکان و دروستکردنی پسوولەی ئەلیکترۆنی باوەڕپێکراو
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddDonorModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            بەخشەری نوێ
          </button>
          
          <button
            onClick={() => {
              resetDonationForm();
              setIsAddDonationModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Receipt className="w-4 h-4" />
            تۆمارکردنی بەخشین + پسوولە
          </button>
        </div>
      </div>

      {/* Sub Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('donors')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'donors'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            لیستی بەخشەران ({donors.length})
          </button>
          <button
            onClick={() => setActiveSubTab('donations')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'donations'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            پسوولەکانی بەخشین ({donations.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەدوای ناو، ژمارەی پسوولە..."
            className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* View 1: Donors Cards Grid */}
      {activeSubTab === 'donors' && (
        donors.length === 0 ? (
          <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">هیچ بەخشەرێک تۆمار نەکراوە (سفر تۆمار)</p>
            <p className="text-xs text-slate-400 mt-1">بۆ دەستپێکردنی تۆمارکردنی فەرمی، کلیک لە دوگمەی «بەخشەری نوێ» بکە لە سەرەوە</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDonors.map(donor => {
              const donorDonations = donations.filter(d => d.donorId === donor.id);
              const donorAgg = aggregateAmountsByDayRate(donorDonations);
              const hasDonations = donorDonations.length > 0;
              const dispIQD = donorAgg.totalIQD;
              const dispUSD = donorAgg.totalUSD;

              return (
              <div
                key={donor.id}
                className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                        {donor.type === 'corporate' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{donor.fullName}</h3>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          {donor.type === 'corporate' ? 'کۆمپانیا و بازرگان' : donor.type === 'organization' ? 'دەزگا و ڕێکخراو' : 'بەخشەری کەسی'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      چالاک
                    </span>
                  </div>

                  <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">کۆی بەخشین (دینار بە نرخی ڕۆژ):</span>
                      <span className="font-bold text-slate-900">{dispIQD.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">کۆی بەخشین (دۆلار بە نرخی ڕۆژ):</span>
                      <span className="font-bold text-cyan-700">${dispUSD.toLocaleString()}</span>
                    </div>
                    {hasDonations && donorAgg.directIQD > 0 && donorAgg.directUSD > 0 && (
                      <div className="text-[10px] text-slate-400 font-mono text-left">
                        ڕاستەوخۆ: {donorAgg.directIQD.toLocaleString()} د.ع + ${donorAgg.directUSD.toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">مۆبایل:</span>
                      <span className="font-mono font-bold text-slate-700">{donor.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      sendSMS(donor.phone, donor.fullName, `بەڕێز ${donor.fullName}، سوپاس و پێزانینی بێپایانی ڕێکخراوی بۆتان بامۆکی قبوڵ بفەرموون بۆ هاوکاری و بەخشندەییتان.`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    نامەی سوپاس (SMS)
                  </button>

                  <button
                    onClick={() => {
                      resetDonationForm(donor.id);
                      setIsAddDonationModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors border border-emerald-200"
                    title="تۆمارکردنی بەخشینی نوێ"
                  >
                    + بەخشین
                  </button>

                  <button
                    onClick={() => handleOpenEditDonor(donor)}
                    className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
                    title="دەستکاریکردنی بەخشەر"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const donCount = donations.filter(d => d.donorId === donor.id).length;
                      const msg = donCount > 0
                        ? `دڵنیایت لە سڕینەوەی بەخشەر [${donor.fullName}]؟\n\nئاگاداری: ئەم بەخشەرە (${donCount}) پسوولەی بەخشینی تۆمارکراوی هەیە. سڕینەوەی بەخشەرەکە دەبێتە هۆی سڕینەوەی تەواوی پسوولەکانی و نوێبوونەوەی بودجەی پڕۆژەکان بۆ ئەوەی هیچ پارەیەکی نادیار نەمێنێتەوە.`
                        : `دڵنیایت لە سڕینەوەی بەخشەر [${donor.fullName}]؟`;
                      if (confirm(msg)) {
                        deleteDonor(donor.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200"
                    title="سڕینەوەی بەخشەر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* View 2: Official Receipts Table */}
      {activeSubTab === 'donations' && (
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3.5 px-4">ژمارەی پسوولە</th>
                  <th className="py-3.5 px-4">ناوی بەخشەر / جۆری بەخشین</th>
                  <th className="py-3.5 px-4">بڕ / بەها</th>
                  <th className="py-3.5 px-4">شێوازی ڕادەستکردن</th>
                  <th className="py-3.5 px-4">مەبەست و شوێنی بەخشین</th>
                  <th className="py-3.5 px-4">بەروار</th>
                  <th className="py-3.5 px-4 text-center">کردارەکان (پسوولە / دەستکاری / سڕینەوە)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">هیچ پسوولەیەکی بەخشین تۆمار نەکراوە (سفر تۆمار)</p>
                      <p className="text-xs text-slate-400 mt-1">بۆ تۆمارکردنی بەخشینی نوێ، کلیک لە دوگمەی «تۆمارکردنی بەخشین + پسوولە» بکە لە سەرەوە</p>
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map(don => (
                    <tr key={don.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-700">
                        {don.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{don.donorName}</p>
                        <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                          {don.categoryLabel || 'کۆمەکی نەختینەیی'}
                          {don.itemDetails?.quantity ? ` (${don.itemDetails.quantity} ${don.itemDetails.unit || ''})` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {don.amount > 0 ? (
                          <div>
                            <span className="font-black text-emerald-700 text-sm block">
                              {don.amount.toLocaleString()} {don.currency === 'IQD' ? 'د.ع' : '$'}
                            </span>
                            {(() => {
                              const dayRate = don.exchangeRateAtDate || getExchangeRateForDate(don.date).rate;
                              const conv = don.convertedAmount || (
                                don.currency === 'IQD'
                                  ? Number((don.amount / dayRate).toFixed(2))
                                  : Math.round(don.amount * dayRate)
                              );
                              return (
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5" title={`نرخی بۆرسەی ڕۆژ: 1$ = ${dayRate.toLocaleString()} د.ع`}>
                                  <span className="text-cyan-700 font-bold">
                                    {don.currency === 'IQD' ? `≈ $${conv.toLocaleString()}` : `≈ ${conv.toLocaleString()} د.ع`}
                                  </span>
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded border border-slate-200">
                                    {dayRate.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-bold">بەخشینی عەینی</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                          {don.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {don.projectName || 'سندووقی گشتی هاوکاری'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {don.date}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveReceipt(don)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-50 text-cyan-800 hover:bg-cyan-100 font-bold text-[11px] transition-colors border border-cyan-200"
                            title="بینینی پسوولەی فەرمی"
                          >
                            <Receipt className="w-3.5 h-3.5 text-cyan-600" />
                            پسوولە
                          </button>
                          <button
                            onClick={() => handleOpenEditDonation(don)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[11px] transition-colors border border-amber-200"
                            title="دەستکاریکردنی ئەم پسوولەیە"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                            دەستکاری
                          </button>
                          <button
                            onClick={() => handleDeleteDonation(don)}
                            className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-[11px] transition-colors border border-rose-200"
                            title="سڕینەوەی ئەم پسوولەیە"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Add Donor */}
      {isAddDonorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsAddDonorModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              تۆمارکردنی بەخشەری نوێ
            </h3>

            <form onSubmit={handleAddDonorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناوی تەواو یان ناوی کۆمپانیا:</label>
                <input
                  type="text"
                  required
                  value={donorForm.fullName}
                  onChange={(e) => setDonorForm({ ...donorForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">جۆری بەخشەر:</label>
                <select
                  value={donorForm.type}
                  onChange={(e) => setDonorForm({ ...donorForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                >
                  <option value="individual">کەسی (خێرخوازی ئاسایی)</option>
                  <option value="corporate">کۆمپانیا و بازرگان</option>
                  <option value="organization">دەزگای نێودەوڵەتی یان ناوخۆیی</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی مۆبایل:</label>
                  <input
                    type="tel"
                    required
                    value={donorForm.phone}
                    onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پارێزگا:</label>
                  <select
                    value={donorForm.governorate}
                    onChange={(e) => setDonorForm({ ...donorForm, governorate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="هەولێر">هەولێر</option>
                    <option value="سلێمانی">سلێمانی</option>
                    <option value="دهۆک">دهۆک</option>
                    <option value="هەڵەبجە">هەڵەبجە</option>
                    <option value="کەرکووک">کەرکووک</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ئیمەیڵ (ئارەزوومەندانە):</label>
                <input
                  type="email"
                  value={donorForm.email}
                  onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی:</label>
                <textarea
                  rows={2}
                  value={donorForm.notes}
                  onChange={(e) => setDonorForm({ ...donorForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddDonorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  تۆمارکردن لە داتابەیس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Donation with Rich Category Selection & Details */}
      {isAddDonationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddDonationModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              تۆمارکردنی بەخشین و دەرکردنی پسوولەی فەرمی
            </h3>

            <form onSubmit={handleAddDonationSubmit} className="space-y-4 text-xs">
              
              {/* Select Donor & Date of Donation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دیاریکردنی بەخشەر:</label>
                  <select
                    required
                    value={donationForm.donorId}
                    onChange={(e) => setDonationForm({ ...donationForm, donorId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    {donors.length === 0 ? (
                      <option value="">هیچ بەخشەرێک تۆمار نەکراوە - تکایە سەرەتا بەخشەر تۆمار بکە</option>
                    ) : (
                      donors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.phone})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>بەرواری بەخشین:</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">بۆ دیاریکردنی نرخی ڕۆژ</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={donationForm.date}
                    onChange={(e) => {
                      setDonationForm({ ...donationForm, date: e.target.value });
                      setCustomAddRate(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold font-mono"
                  />
                </div>
              </div>

              {/* Requirement 1: Category of Fund (پۆلێنی بەخشین) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-slate-800 font-bold text-sm">
                  ۱. پۆلێن و جۆری بەخشین (Category of Fund):
                </label>

                <select
                  value={donationForm.category}
                  onChange={(e) => handleCategoryChange(e.target.value as DonationCategory)}
                  className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold text-xs sm:text-sm"
                >
                  <option value="cash">💰 کۆمەکی نەختینەیی (پارەی کاش)</option>
                  <option value="food_basket">📦 سەبەتەی خۆراکی (Food Aid Boxes)</option>
                  <option value="student_supplies">🎒 جانتا و پێداویستی خوێندکاران (Student Bags)</option>
                  <option value="clothes">👕 جلوبەرگ و پۆشاک (Clothing & Apparel)</option>
                  <option value="medical">🩺 دەرمان و پێداویستی پزیشکی (Medical Supplies)</option>
                  <option value="heating_appliances">🔥 کەلوپەلی ناوماڵ و گەرمکەرەوە (Home & Heating)</option>
                  <option value="qurbani_meat">🥩 قوربانی و بەخشینی گۆشت (Qurbani / Meat)</option>
                  <option value="other_in_kind">🎁 کەرەستە و کەلوپەلی تر (Other In-Kind)</option>
                </select>

                {/* DYNAMIC CATEGORY DETAILS */}
                {/* 1. If Cash: show cash amount & currency */}
                {donationForm.category === 'cash' ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">بڕی پارەی بەخشراو:</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={donationAmountStr}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, '');
                              setDonationAmountStr(clean);
                            }}
                            placeholder={donationForm.currency === 'IQD' ? 'نموونە: 100,000' : 'نموونە: 100'}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-base font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                            {donationForm.currency === 'IQD' ? 'د.ع' : '$ USD'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">دراو:</label>
                        <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleAddDonationCurrencySwitch('IQD')}
                            className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                              donationForm.currency === 'IQD'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            دینار (IQD)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddDonationCurrencySwitch('USD')}
                            className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                              donationForm.currency === 'USD'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            دۆلار (USD $)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Suggestion Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold">بڕی ئامادەکراو:</span>
                      {(donationForm.currency === 'IQD'
                        ? ['25000', '50000', '100000', '250000', '500000', '1000000']
                        : ['25', '50', '100', '250', '500', '1000']
                      ).map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDonationAmountStr(val)}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                        >
                          {donationForm.currency === 'IQD' ? `${parseInt(val, 10).toLocaleString()} د.ع` : `$${parseInt(val, 10).toLocaleString()}`}
                        </button>
                      ))}
                    </div>

                    {/* Real-time Day-by-Day Bazaar Currency Conversion Display */}
                    {donationAmountStr && parseInt(donationAmountStr, 10) > 0 && (() => {
                      const dayRateInfo = getExchangeRateForDate(donationForm.date);
                      const activeRate = customAddRate || dayRateInfo.rate;
                      const num = parseInt(donationAmountStr, 10);
                      const conv = convertByDateRate(num, donationForm.currency, activeRate);

                      return (
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-cyan-50/80 border border-emerald-200/80 space-y-2 text-xs shadow-xs animate-in fade-in">
                          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-200/60 pb-2">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ڕۆژی بەخشین: <span className="font-mono text-cyan-800">{donationForm.date}</span></span>
                            </div>
                            <div className="flex items-center gap-1 font-bold text-emerald-800 bg-white/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              <span>نرخی بۆرسەی ڕۆژ:</span>
                              <span className="font-mono font-black text-emerald-700">1 USD = {activeRate.toLocaleString()} IQD</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                            <div className="flex items-center gap-1 text-slate-600 font-medium">
                              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>هاوتای بەخشین بە نرخی ئەو ڕۆژە:</span>
                            </div>
                            <div className="font-mono font-black text-sm text-emerald-950 bg-white px-3 py-1 rounded-xl border border-emerald-300 shadow-xs">
                              {conv.formattedConversion}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-slate-500 gap-1 border-t border-emerald-100">
                            <span className="text-slate-600">✓ پشتڕاستکراوە بەپێی بۆرسەی کیفاح و هەولێر (AlanChand)</span>
                            <button
                              type="button"
                              onClick={() => setIsCustomAddRateOpen(!isCustomAddRateOpen)}
                              className="text-cyan-700 hover:text-cyan-900 font-bold underline cursor-pointer"
                            >
                              {isCustomAddRateOpen ? 'داخستنی دەستکاری' : 'دەستکاریکردنی نرخی ڕۆژ (ئارەزوومەندانە)'}
                            </button>
                          </div>

                          {isCustomAddRateOpen && (
                            <div className="pt-2 border-t border-emerald-200/80 flex items-center gap-2">
                              <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">نرخی دەستی (دینار بۆ هەر دۆلارێک):</label>
                              <input
                                type="number"
                                value={activeRate}
                                onChange={(e) => setCustomAddRate(Number(e.target.value) || null)}
                                className="w-24 px-2 py-1 rounded-lg bg-white border border-emerald-300 font-mono font-bold text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => { setCustomAddRate(null); setIsCustomAddRateOpen(false); }}
                                className="text-[10px] text-rose-600 hover:underline font-bold"
                              >
                                گەڕانەوە بۆ نرخی ڕاستەقینەی بۆرسە
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* 2. If In-Kind Category: Show common details (boxes, weight, ingredients, bags, etc.) */
                  <div className="p-3.5 bg-white rounded-xl border border-emerald-200 space-y-3 pt-3 animate-in fade-in">
                    
                    {/* Food Aid specific details */}
                    {donationForm.category === 'food_basket' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی سەبەتە / کارتۆنی خۆراک:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={donationForm.quantity}
                              onChange={(e) => setDonationForm({ ...donationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">کێشی هەر کارتۆنێک (کیلۆگرام):</label>
                            <input
                              type="number"
                              min={1}
                              value={donationForm.weightKgPerUnit}
                              onChange={(e) => setDonationForm({ ...donationForm, weightKgPerUnit: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">پێکهاتە و ناوەرۆکی سەبەتەکە (کەلوپەلەکان):</label>
                          <textarea
                            rows={2}
                            value={donationForm.contentsDescription}
                            onChange={(e) => setDonationForm({ ...donationForm, contentsDescription: e.target.value })}
                            placeholder="نموونە: برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە"
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 leading-relaxed"
                          />
                        </div>
                      </>
                    )}

                    {/* Student Bags specific details */}
                    {donationForm.category === 'student_supplies' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی جانتا / پاکێجی خوێندکار:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={donationForm.quantity}
                              onChange={(e) => setDonationForm({ ...donationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">قۆناغی خوێندن:</label>
                            <select
                              value={donationForm.educationStage}
                              onChange={(e) => setDonationForm({ ...donationForm, educationStage: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                            >
                              <option value="سەرەتایی">پۆلەکانی سەرەتایی (١ تا ٦)</option>
                              <option value="ناوەندی">پۆلەکانی ناوەندی (٧ تا ٩)</option>
                              <option value="ئامادەیی">پۆلەکانی ئامادەیی (١٠ تا ١٢)</option>
                              <option value="زانکۆ">خوێندکارانی پەیمانگە و زانکۆ</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">پێکهاتە و کەلوپەلی ناو جانتا:</label>
                          <input
                            type="text"
                            value={donationForm.contentsDescription}
                            onChange={(e) => setDonationForm({ ...donationForm, contentsDescription: e.target.value })}
                            placeholder="جانتای پشت، دەفتەر، قەڵەم، جێقەڵەم، ئامێری ئەندازە..."
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    {/* Clothing specific details */}
                    {donationForm.category === 'clothes' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی دەست / پارچە جلوبەرگ:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={donationForm.quantity}
                              onChange={(e) => setDonationForm({ ...donationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">جۆری پۆشاک:</label>
                            <select
                              value={donationForm.clothingType}
                              onChange={(e) => setDonationForm({ ...donationForm, clothingType: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                            >
                              <option value="جلوبەرگی زستانە">جلوبەرگی زستانە (چاکەت، کڵاو، دەستکێش)</option>
                              <option value="جلوبەرگی هاوینە">جلوبەرگی هاوینە</option>
                              <option value="جلی جەژن بۆ هەتیوان">جلی جەژن بۆ هەتیوان و منداڵان</option>
                              <option value="پێڵاو">پێڵاوی تازە</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">وەسف و تێبینی لەسەر پۆشاکەکە:</label>
                          <input
                            type="text"
                            value={donationForm.contentsDescription}
                            onChange={(e) => setDonationForm({ ...donationForm, contentsDescription: e.target.value })}
                            placeholder="نموونە: چاکەتی کوڕان و کچان بە قەبارەی جیاواز"
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    {/* Medical / Appliances / Qurbani / Other details */}
                    {['medical', 'heating_appliances', 'qurbani_meat', 'other_in_kind'].includes(donationForm.category) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">بڕ و ژمارەی بەخشراو:</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={donationForm.quantity}
                            onChange={(e) => setDonationForm({ ...donationForm, quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">وەسف و جۆری کەرەستەکە:</label>
                          <input
                            type="text"
                            required
                            value={donationForm.contentsDescription}
                            onChange={(e) => setDonationForm({ ...donationForm, contentsDescription: e.target.value })}
                            placeholder="نموونە: ویلچێر، سۆپا، گۆشتی قوربانی..."
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Linked Pricing: Unit Price OR Total Price with Auto-Distribution */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-600" />
                          بەها و نرخی کۆمەک (نرخی تاک یان کۆی گشتی):
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">
                          دەتوانیت نرخی یەک دانە یان کۆی گشتی بنووسیت؛ سیستەم ئۆتۆماتیکی دابەشی دەکات
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Unit Price */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                            نرخی هەر یەک دانەیەک / کارتۆنێک:
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={donationUnitPriceStr ? parseInt(donationUnitPriceStr, 10).toLocaleString() : ''}
                              onChange={(e) => handleAddDonationUnitPriceChange(e.target.value)}
                              placeholder="نموونە: 50,000"
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold font-mono text-xs"
                            />
                            <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-400">
                              {donationForm.currency === 'IQD' ? 'د.ع' : '$'}
                            </span>
                          </div>
                        </div>

                        {/* Total Value */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                            کۆی گشتی بەهای بەخشینەکە:
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={donationEstValueStr ? parseInt(donationEstValueStr, 10).toLocaleString() : ''}
                              onChange={(e) => handleAddDonationTotalValueChange(e.target.value)}
                              placeholder="نموونە: 3,000,000"
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold font-mono text-xs"
                            />
                            <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-400">
                              {donationForm.currency === 'IQD' ? 'د.ع' : '$'}
                            </span>
                          </div>
                        </div>

                        {/* Currency Toggle */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">دراوی بەها:</label>
                          <div className="grid grid-cols-2 gap-1 mt-0.5">
                            <button
                              type="button"
                              onClick={() => handleAddDonationCurrencySwitch('IQD')}
                              className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                                donationForm.currency === 'IQD'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              دینار (IQD)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddDonationCurrencySwitch('USD')}
                              className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                                donationForm.currency === 'USD'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              دۆلار (USD)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Formula Visual Pill */}
                      {(donationUnitPriceStr || donationEstValueStr) && (
                        <div className="p-2.5 rounded-xl bg-cyan-50/90 border border-cyan-200/90 text-cyan-950 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="font-bold text-cyan-800">هەژمارکردنی ئۆتۆماتیکی:</span>
                            <span className="font-mono font-bold">
                              {donationForm.quantity || 1} {donationForm.unit} × {Number(donationUnitPriceStr || 0).toLocaleString()} {donationForm.currency === 'IQD' ? 'د.ع' : '$'}
                            </span>
                          </span>
                          <span className="font-mono font-black text-xs text-cyan-900 bg-white px-2.5 py-1 rounded-lg border border-cyan-200 shadow-xs">
                            کۆی بەها: {Number(donationEstValueStr || 0).toLocaleString()} {donationForm.currency === 'IQD' ? 'د.ع' : '$'}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* Requirement 2: Default payment style is Cash & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ۲. شێوازی پێدان / ڕادەستکردن:
                  </label>
                  <select
                    value={donationForm.method}
                    onChange={(e) => setDonationForm({ ...donationForm, method: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <option value="کاش">💵 کاش (دەستی) - نەختینە</option>
                    <option value="FIB">🏦 بانکی یەکەمی عێراق FIB</option>
                    <option value="FastPay">📱 فاست پەی FastPay</option>
                    <option value="ZainCash">📲 زەین کاش ZainCash</option>
                    <option value="حەواڵەی بانکی">🏛️ حەواڵەی بانکی / ئەلیکترۆنی</option>
                    <option value="کەرەستە و کاڵا">📦 کەرەستە و کاڵای عەینی (ڕادەستکردنی مەیدانی)</option>
                  </select>
                </div>

                {/* Requirement 3: Funding destination - Warehouse, Direct Distribution, Funds, Projects */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ۳. ئاراستە و مەبەستی بەخشین:
                  </label>
                  <select
                    value={donationForm.destinationType}
                    onChange={(e) => setDonationForm({ ...donationForm, destinationType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <optgroup label="🏢 کۆگا و پاشەکەوتکردن (Warehouse & Storage)">
                      <option value="warehouse">کۆگای سەرەکی ڕێکخراو (پاشەکەوتکردن بۆ کاتی پێویست و فریاگوزاری)</option>
                    </optgroup>

                    <optgroup label="🤝 دابەشکردنی خێرا (Direct Distribution)">
                      <option value="direct_distribution">دابەشکردنی دەستبەجێ و ڕاستەوخۆ بەسەر خێزانە هەژارەکاندا</option>
                    </optgroup>

                    <optgroup label="🛡️ سندووقە فەرمییەکان (Designated Funds)">
                      <option value="general_fund">سندووقی گشتی خێرخوازی و فریاگوزاری خێرا</option>
                      <option value="orphan_fund">سندووقی چاودێری و کەفالەتی مانگانەی هەتیوان</option>
                      <option value="medical_fund">سندووقی نەشتەرگەری و دەرمانی کتوپڕ</option>
                      <option value="students_fund">سندووقی خوێندکاران و پشتیوانی پەروەردە</option>
                      <option value="winter_campaign">سندووقی کەمپەینی زستانە و سوتەمەنی</option>
                    </optgroup>

                    {projects.length > 0 && (
                      <optgroup label="📋 پڕۆژە فەرمییەکان (Active Projects)">
                        {projects.map(p => (
                          <option key={p.id} value={`proj_${p.id}`}>
                            پڕۆژەی دیاریکراو: {p.title}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Receipt Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی سەر پسوولە:</label>
                <input
                  type="text"
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                  placeholder="هەر تێبینییەک لەسەر وەرگرتنی ئەم بەخشینە..."
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddDonationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  داخستن
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white font-bold shadow-md hover:shadow-lg transition-all"
                >
                  دەرکردنی پسوولەی فەرمی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Donation */}
      {isEditDonationModalOpen && editingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsEditDonationModalOpen(false);
                setEditingDonation(null);
              }}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  دەستکاریکردنی پسوولەی بەخشین
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                  {editingDonation.receiptNumber}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveEditDonation} className="space-y-4 text-xs">
              
              {/* Select Donor & Date of Donation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەخشەر:</label>
                  <select
                    required
                    value={editDonationForm.donorId}
                    onChange={(e) => setEditDonationForm({ ...editDonationForm, donorId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    {donors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>بەرواری بەخشین:</span>
                    <span className="text-[10px] text-amber-700 font-semibold">بۆ دیاریکردنی نرخی ڕۆژ</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editDonationForm.date}
                    onChange={(e) => {
                      setEditDonationForm({ ...editDonationForm, date: e.target.value });
                      setCustomEditRate(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold font-mono"
                  />
                </div>
              </div>

              {/* Category of Fund */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-slate-800 font-bold text-sm">
                  پۆلێن و جۆری بەخشین (Category of Fund):
                </label>

                <select
                  value={editDonationForm.category}
                  onChange={(e) => handleEditCategoryChange(e.target.value as DonationCategory)}
                  className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold text-xs sm:text-sm"
                >
                  <option value="cash">💰 کۆمەکی نەختینەیی (پارەی کاش)</option>
                  <option value="food_basket">📦 سەبەتەی خۆراکی (Food Aid Boxes)</option>
                  <option value="student_supplies">🎒 جانتا و پێداویستی خوێندکاران (Student Bags)</option>
                  <option value="clothes">👕 جلوبەرگ و پۆشاک (Clothing & Apparel)</option>
                  <option value="medical">🩺 دەرمان و پێداویستی پزیشکی (Medical Supplies)</option>
                  <option value="heating_appliances">🔥 کەلوپەلی ناوماڵ و گەرمکەرەوە (Home & Heating)</option>
                  <option value="qurbani_meat">🥩 قوربانی و بەخشینی گۆشت (Qurbani / Meat)</option>
                  <option value="other_in_kind">🎁 کەرەستە و کەلوپەلی تر (Other In-Kind)</option>
                </select>

                {/* Dynamic Category Details */}
                {editDonationForm.category === 'cash' ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">بڕی پارەی بەخشراو:</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={editAmountStr}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, '');
                              setEditAmountStr(clean);
                            }}
                            placeholder={editDonationForm.currency === 'IQD' ? 'نموونە: 100,000' : 'نموونە: 100'}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-base font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                            {editDonationForm.currency === 'IQD' ? 'د.ع' : '$ USD'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">دراو:</label>
                        <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleEditDonationCurrencySwitch('IQD')}
                            className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                              editDonationForm.currency === 'IQD'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            دینار (IQD)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditDonationCurrencySwitch('USD')}
                            className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                              editDonationForm.currency === 'USD'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            دۆلار (USD $)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Suggestion Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold">بڕی ئامادەکراو:</span>
                      {(editDonationForm.currency === 'IQD'
                        ? ['25000', '50000', '100000', '250000', '500000', '1000000']
                        : ['25', '50', '100', '250', '500', '1000']
                      ).map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEditAmountStr(val)}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                        >
                          {editDonationForm.currency === 'IQD' ? `${parseInt(val, 10).toLocaleString()} د.ع` : `$${parseInt(val, 10).toLocaleString()}`}
                        </button>
                      ))}
                    </div>

                    {/* Real-time Day-by-Day Bazaar Currency Conversion Display */}
                    {editAmountStr && parseInt(editAmountStr, 10) > 0 && (() => {
                      const dayRateInfo = getExchangeRateForDate(editDonationForm.date);
                      const activeRate = customEditRate || dayRateInfo.rate;
                      const num = parseInt(editAmountStr, 10);
                      const conv = convertByDateRate(num, editDonationForm.currency, activeRate);

                      return (
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-yellow-50/80 border border-amber-200/80 space-y-2 text-xs shadow-xs animate-in fade-in">
                          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-amber-200/60 pb-2">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              <span>ڕۆژی بەخشین: <span className="font-mono text-amber-800">{editDonationForm.date}</span></span>
                            </div>
                            <div className="flex items-center gap-1 font-bold text-amber-800 bg-white/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                              <span>نرخی بۆرسەی ڕۆژ:</span>
                              <span className="font-mono font-black text-amber-700">1 USD = {activeRate.toLocaleString()} IQD</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                            <div className="flex items-center gap-1 text-slate-600 font-medium">
                              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>هاوتای بەخشین بە نرخی ئەو ڕۆژە:</span>
                            </div>
                            <div className="font-mono font-black text-sm text-slate-900 bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-xs">
                              {conv.formattedConversion}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-slate-500 gap-1 border-t border-amber-100">
                            <span className="text-slate-600">✓ پشتڕاستکراوە بەپێی بۆرسەی کیفاح و هەولێر (AlanChand)</span>
                            <button
                              type="button"
                              onClick={() => setIsCustomEditRateOpen(!isCustomEditRateOpen)}
                              className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                            >
                              {isCustomEditRateOpen ? 'داخستنی دەستکاری' : 'دەستکاریکردنی نرخی ڕۆژ (ئارەزوومەندانە)'}
                            </button>
                          </div>

                          {isCustomEditRateOpen && (
                            <div className="pt-2 border-t border-amber-200/80 flex items-center gap-2">
                              <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">نرخی دەستی (دینار بۆ هەر دۆلارێک):</label>
                              <input
                                type="number"
                                value={activeRate}
                                onChange={(e) => setCustomEditRate(Number(e.target.value) || null)}
                                className="w-24 px-2 py-1 rounded-lg bg-white border border-amber-300 font-mono font-bold text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => { setCustomEditRate(null); setIsCustomEditRateOpen(false); }}
                                className="text-[10px] text-rose-600 hover:underline font-bold"
                              >
                                گەڕانەوە بۆ نرخی ڕاستەقینەی بۆرسە
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-3.5 bg-white rounded-xl border border-emerald-200 space-y-3 pt-3 animate-in fade-in">
                    {/* Live Warehouse Distribution & Stock Status */}
                    {alreadyDistributedCount > 0 && (
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-amber-900">
                            <Boxes className="w-4 h-4 text-amber-600" />
                            دۆخی ئەم کاڵایە لە کۆگا و هاوکارییەکان:
                          </span>
                          <span className="bg-white px-2.5 py-0.5 rounded-full border border-amber-300 font-mono text-amber-800 font-bold text-[11px]">
                            {alreadyDistributedCount} دانە پێشتر دراوە بە خێزانەکان
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          لە کۆی ئەم بەخشینە، تا ئێستا <strong>{alreadyDistributedCount}</strong> دانە دابەشکراوە بەسەر خێزانە هەژارەکاندا.
                          بە نوێکردنەوەی بڕی کۆ بۆ <strong>{editDonationForm.quantity}</strong>، بڕی ماوەی بەردەستی ناو کۆگا دەبێتە{' '}
                          <strong className="font-mono text-emerald-800 text-sm font-black">
                            {Math.max(0, (Number(editDonationForm.quantity) || 0) - alreadyDistributedCount)}
                          </strong> دانە.
                        </p>
                        {Number(editDonationForm.quantity) < alreadyDistributedCount && (
                          <div className="p-2 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-800 font-bold flex items-center gap-1.5 text-[11px]">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>ئاگاداری: ناتوانیت بڕی کۆی بەخشین لە {alreadyDistributedCount} دانە کەمتر بکەیتەوە چونکە پێشتر دابەشکراوە!</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Food Aid specific details */}
                    {editDonationForm.category === 'food_basket' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی سەبەتە / کارتۆنی خۆراک:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={editDonationForm.quantity}
                              onChange={(e) => setEditDonationForm({ ...editDonationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">کێشی هەر کارتۆنێک (کیلۆگرام):</label>
                            <input
                              type="number"
                              min={1}
                              value={editDonationForm.weightKgPerUnit}
                              onChange={(e) => setEditDonationForm({ ...editDonationForm, weightKgPerUnit: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">پێکهاتە و ناوەرۆکی سەبەتەکە:</label>
                          <textarea
                            rows={2}
                            value={editDonationForm.contentsDescription}
                            onChange={(e) => setEditDonationForm({ ...editDonationForm, contentsDescription: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 leading-relaxed"
                          />
                        </div>
                      </>
                    )}

                    {/* Student Bags details */}
                    {editDonationForm.category === 'student_supplies' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی جانتا / پاکێجی خوێندکار:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={editDonationForm.quantity}
                              onChange={(e) => setEditDonationForm({ ...editDonationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">قۆناغی خوێندن:</label>
                            <select
                              value={editDonationForm.educationStage}
                              onChange={(e) => setEditDonationForm({ ...editDonationForm, educationStage: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                            >
                              <option value="سەرەتایی">پۆلەکانی سەرەتایی (١ تا ٦)</option>
                              <option value="ناوەندی">پۆلەکانی ناوەندی (٧ تا ٩)</option>
                              <option value="ئامادەیی">پۆلەکانی ئامادەیی (١٠ تا ١٢)</option>
                              <option value="زانکۆ">خوێندکارانی پەیمانگە و زانکۆ</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">پێکهاتە و کەلوپەلی ناو جانتا:</label>
                          <input
                            type="text"
                            value={editDonationForm.contentsDescription}
                            onChange={(e) => setEditDonationForm({ ...editDonationForm, contentsDescription: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    {/* Clothing details */}
                    {editDonationForm.category === 'clothes' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی دەست / پارچە جلوبەرگ:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={editDonationForm.quantity}
                              onChange={(e) => setEditDonationForm({ ...editDonationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">جۆری پۆشاک:</label>
                            <select
                              value={editDonationForm.clothingType}
                              onChange={(e) => setEditDonationForm({ ...editDonationForm, clothingType: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                            >
                              <option value="جلوبەرگی زستانە">جلوبەرگی زستانە (چاکەت، کڵاو، دەستکێش)</option>
                              <option value="جلوبەرگی هاوینە">جلوبەرگی هاوینە</option>
                              <option value="جلی جەژن بۆ هەتیوان">جلی جەژن بۆ هەتیوان و منداڵان</option>
                              <option value="پێڵاو">پێڵاوی تازە</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">وەسف و تێبینی لەسەر پۆشاکەکە:</label>
                          <input
                            type="text"
                            value={editDonationForm.contentsDescription}
                            onChange={(e) => setEditDonationForm({ ...editDonationForm, contentsDescription: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    {/* Medical / Appliances / Qurbani / Other details */}
                    {['medical', 'heating_appliances', 'qurbani_meat', 'other_in_kind'].includes(editDonationForm.category) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">بڕ و ژمارەی بەخشراو:</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={editDonationForm.quantity}
                            onChange={(e) => setEditDonationForm({ ...editDonationForm, quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">وەسف و جۆری کەرەستەکە:</label>
                          <input
                            type="text"
                            required
                            value={editDonationForm.contentsDescription}
                            onChange={(e) => setEditDonationForm({ ...editDonationForm, contentsDescription: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Linked Pricing: Unit Price OR Total Price with Auto-Distribution */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-600" />
                          بەها و نرخی کۆمەک (نرخی تاک یان کۆی گشتی):
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">
                          دەتوانیت نرخی یەک دانە یان کۆی گشتی بنووسیت؛ سیستەم ئۆتۆماتیکی دابەشی دەکات
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Unit Price */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                            نرخی هەر یەک دانەیەک / کارتۆنێک:
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editUnitPriceStr ? parseInt(editUnitPriceStr, 10).toLocaleString() : ''}
                              onChange={(e) => handleEditDonationUnitPriceChange(e.target.value)}
                              placeholder="نموونە: 50,000"
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold font-mono text-xs"
                            />
                            <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-400">
                              {editDonationForm.currency === 'IQD' ? 'د.ع' : '$'}
                            </span>
                          </div>
                        </div>

                        {/* Total Value */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                            کۆی گشتی بەهای بەخشینەکە:
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editEstValueStr ? parseInt(editEstValueStr, 10).toLocaleString() : ''}
                              onChange={(e) => handleEditDonationTotalValueChange(e.target.value)}
                              placeholder="نموونە: 3,000,000"
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold font-mono text-xs"
                            />
                            <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-400">
                              {editDonationForm.currency === 'IQD' ? 'د.ع' : '$'}
                            </span>
                          </div>
                        </div>

                        {/* Currency Toggle */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">دراوی بەها:</label>
                          <div className="grid grid-cols-2 gap-1 mt-0.5">
                            <button
                              type="button"
                              onClick={() => handleEditDonationCurrencySwitch('IQD')}
                              className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                                editDonationForm.currency === 'IQD'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              دینار (IQD)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditDonationCurrencySwitch('USD')}
                              className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                                editDonationForm.currency === 'USD'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              دۆلار (USD)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Formula Visual Pill */}
                      {(editUnitPriceStr || editEstValueStr) && (
                        <div className="p-2.5 rounded-xl bg-cyan-50/90 border border-cyan-200/90 text-cyan-950 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="font-bold text-cyan-800">هەژمارکردنی ئۆتۆماتیکی:</span>
                            <span className="font-mono font-bold">
                              {editDonationForm.quantity || 1} {editDonationForm.unit} × {Number(editUnitPriceStr || 0).toLocaleString()} {editDonationForm.currency === 'IQD' ? 'د.ع' : '$'}
                            </span>
                          </span>
                          <span className="font-mono font-black text-xs text-cyan-900 bg-white px-2.5 py-1 rounded-lg border border-cyan-200 shadow-xs">
                            کۆی بەها: {Number(editEstValueStr || 0).toLocaleString()} {editDonationForm.currency === 'IQD' ? 'د.ع' : '$'}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* Payment Method & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    شێوازی پێدان / ڕادەستکردن:
                  </label>
                  <select
                    value={editDonationForm.method}
                    onChange={(e) => setEditDonationForm({ ...editDonationForm, method: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <option value="کاش">💵 کاش (دەستی) - نەختینە</option>
                    <option value="FIB">🏦 بانکی یەکەمی عێراق FIB</option>
                    <option value="FastPay">📱 فاست پەی FastPay</option>
                    <option value="ZainCash">📲 زەین کاش ZainCash</option>
                    <option value="حەواڵەی بانکی">🏛️ حەواڵەی بانکی / ئەلیکترۆنی</option>
                    <option value="کەرەستە و کاڵا">📦 کەرەستە و کاڵای عەینی (ڕادەستکردنی مەیدانی)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ئاراستە و مەبەستی بەخشین:
                  </label>
                  <select
                    value={editDonationForm.destinationType}
                    onChange={(e) => setEditDonationForm({ ...editDonationForm, destinationType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <optgroup label="🏢 کۆگا و پاشەکەوتکردن (Warehouse & Storage)">
                      <option value="warehouse">کۆگای سەرەکی ڕێکخراو (پاشەکەوتکردن بۆ کاتی پێویست و فریاگوزاری)</option>
                    </optgroup>

                    <optgroup label="🤝 دابەشکردنی خێرا (Direct Distribution)">
                      <option value="direct_distribution">دابەشکردنی دەستبەجێ و ڕاستەوخۆ بەسەر خێزانە هەژارەکاندا</option>
                    </optgroup>

                    <optgroup label="🛡️ سندووقە فەرمییەکان (Designated Funds)">
                      <option value="general_fund">سندووقی گشتی خێرخوازی و فریاگوزاری خێرا</option>
                      <option value="orphan_fund">سندووقی چاودێری و کەفالەتی مانگانەی هەتیوان</option>
                      <option value="medical_fund">سندووقی نەشتەرگەری و دەرمانی کتوپڕ</option>
                      <option value="students_fund">سندووقی خوێندکاران و پشتیوانی پەروەردە</option>
                      <option value="winter_campaign">سندووقی کەمپەینی زستانە و سوتەمەنی</option>
                    </optgroup>

                    {projects.length > 0 && (
                      <optgroup label="📋 پڕۆژە فەرمییەکان (Active Projects)">
                        {projects.map(p => (
                          <option key={p.id} value={`proj_${p.id}`}>
                            پڕۆژەی دیاریکراو: {p.title}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Receipt Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی سەر پسوولە:</label>
                <input
                  type="text"
                  value={editDonationForm.notes}
                  onChange={(e) => setEditDonationForm({ ...editDonationForm, notes: e.target.value })}
                  placeholder="هەر تێبینییەک لەسەر وەرگرتنی ئەم بەخشینە..."
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDonationModalOpen(false);
                    setEditingDonation(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white font-bold shadow-md hover:shadow-lg transition-all"
                >
                  پاشەکەوتکردنی دەستکارییەکان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Donor */}
      {isEditDonorModalOpen && editingDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => {
                setIsEditDonorModalOpen(false);
                setEditingDonor(null);
              }}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              دەستکاریکردنی زانیاری بەخشەر
            </h3>

            <form onSubmit={handleSaveEditDonor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناوی تەواو / دامەزراوە:</label>
                <input
                  type="text"
                  required
                  value={editDonorForm.fullName}
                  onChange={(e) => setEditDonorForm({ ...editDonorForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">جۆری بەخشەر:</label>
                  <select
                    value={editDonorForm.type}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, type: e.target.value as DonorType })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="individual">کەسی</option>
                    <option value="corporate">کۆمپانیا و بازرگان</option>
                    <option value="organization">دەزگا و ڕێکخراو</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پارێزگا:</label>
                  <select
                    value={editDonorForm.governorate}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, governorate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="هەولێر">هەولێر</option>
                    <option value="سلێمانی">سلێمانی</option>
                    <option value="دهۆک">دهۆک</option>
                    <option value="هەڵەبجە">هەڵەبجە</option>
                    <option value="کەرکووک">کەرکووک</option>
                    <option value="دەرەوەی وڵات">دەرەوەی وڵات</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی مۆبایل:</label>
                  <input
                    type="tel"
                    required
                    value={editDonorForm.phone}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دۆخ:</label>
                  <select
                    value={editDonorForm.status}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="active">چالاک</option>
                    <option value="inactive">ناچالاک</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ئیمەیڵ (ئارەزوومەندانە):</label>
                <input
                  type="email"
                  value={editDonorForm.email}
                  onChange={(e) => setEditDonorForm({ ...editDonorForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی:</label>
                <input
                  type="text"
                  value={editDonorForm.notes}
                  onChange={(e) => setEditDonorForm({ ...editDonorForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDonorModalOpen(false);
                    setEditingDonor(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  پاشەکەوتکردنی دەستکارییەکان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Generator Modal */}
      <OfficialReceiptModal
        donation={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

    </div>
  );
};
