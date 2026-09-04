import * as XLSX from 'xlsx';
import { Beneficiary, NeedCategory, OtherProvider } from '../types';

export const EXCEL_COLUMNS = {
  fullName: 'ناوی تەواوی کەس',
  nationalId: 'ژمارەی ناسنامە',
  gender: 'ڕەگەز (نێر / مێ)',
  age: 'تەمەن',
  phone: 'ژمارەی مۆبایل',
  governorate: 'پارێزگا',
  address: 'ناونیشانی ورد',
  isFamilyHead: 'ئایا سەرۆکی خێزانە؟ (بەڵێ / نەخێر)',
  isProvider: 'ئایا بژێوی خێزان دابین دەکات؟ (بەڵێ / نەخێر)',
  providerName: 'ناوی دابینکەر ئەگەر نا',
  isOnlyProvider: 'تەنها دابینکەرە؟ (بەڵێ / نەخێر)',
  otherProviders: 'دابینکەرانی تر لە هەمان خێزاندا',
  familyMembers: 'ئەندامانی خێزان',
  monthlyIncomeIQD: 'داهاتی مانگانە (دینار)',
  needCategory: 'حاڵەت',
  notes: 'تێبینی و بارودۆخی تایبەت'
} as const;

export const downloadBeneficiaryExcelTemplate = () => {
  const headers = [
    EXCEL_COLUMNS.fullName,
    EXCEL_COLUMNS.nationalId,
    EXCEL_COLUMNS.gender,
    EXCEL_COLUMNS.age,
    EXCEL_COLUMNS.phone,
    EXCEL_COLUMNS.governorate,
    EXCEL_COLUMNS.address,
    EXCEL_COLUMNS.isFamilyHead,
    EXCEL_COLUMNS.isProvider,
    EXCEL_COLUMNS.providerName,
    EXCEL_COLUMNS.isOnlyProvider,
    EXCEL_COLUMNS.otherProviders,
    EXCEL_COLUMNS.familyMembers,
    EXCEL_COLUMNS.monthlyIncomeIQD,
    EXCEL_COLUMNS.needCategory,
    EXCEL_COLUMNS.notes
  ];

  // Sample guidance rows to demonstrate the format
  const sampleData = [
    {
      [EXCEL_COLUMNS.fullName]: 'ئازاد کامەران ئەحمەد',
      [EXCEL_COLUMNS.nationalId]: '19850123456',
      [EXCEL_COLUMNS.gender]: 'نێر',
      [EXCEL_COLUMNS.age]: 42,
      [EXCEL_COLUMNS.phone]: '07501234567',
      [EXCEL_COLUMNS.governorate]: 'هەولێر',
      [EXCEL_COLUMNS.address]: 'کەرکووک رۆد، گەڕەکی ڕاستی',
      [EXCEL_COLUMNS.isFamilyHead]: 'بەڵێ',
      [EXCEL_COLUMNS.isProvider]: 'بەڵێ',
      [EXCEL_COLUMNS.providerName]: '-',
      [EXCEL_COLUMNS.isOnlyProvider]: 'نەخێر',
      [EXCEL_COLUMNS.otherProviders]: 'کاروان (کوڕ - 200000)',
      [EXCEL_COLUMNS.familyMembers]: 5,
      [EXCEL_COLUMNS.monthlyIncomeIQD]: 350000,
      [EXCEL_COLUMNS.needCategory]: 'هەژار',
      [EXCEL_COLUMNS.notes]: 'کرێچییە و پێویستی بە هاوکاری مانگانەیە'
    },
    {
      [EXCEL_COLUMNS.fullName]: 'شیلان فەرهاد عومەر',
      [EXCEL_COLUMNS.nationalId]: '19920987654',
      [EXCEL_COLUMNS.gender]: 'مێ',
      [EXCEL_COLUMNS.age]: 34,
      [EXCEL_COLUMNS.phone]: '07709876543',
      [EXCEL_COLUMNS.governorate]: 'سلێمانی',
      [EXCEL_COLUMNS.address]: 'ڕاپەڕین، نزیک مزگەوتی گەورە',
      [EXCEL_COLUMNS.isFamilyHead]: 'بەڵێ',
      [EXCEL_COLUMNS.isProvider]: 'نەخێر',
      [EXCEL_COLUMNS.providerName]: 'باوکی کۆچکردوو / خێرخوازان',
      [EXCEL_COLUMNS.isOnlyProvider]: '-',
      [EXCEL_COLUMNS.otherProviders]: '-',
      [EXCEL_COLUMNS.familyMembers]: 3,
      [EXCEL_COLUMNS.monthlyIncomeIQD]: 0,
      [EXCEL_COLUMNS.needCategory]: 'بێباوک',
      [EXCEL_COLUMNS.notes]: 'بێ سەرپەرشت و کەم دەرامەت'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 22 }, // ناوی تەواو
    { wch: 18 }, // ناسنامە
    { wch: 14 }, // ڕەگەز
    { wch: 10 }, // تەمەن
    { wch: 16 }, // مۆبایل
    { wch: 14 }, // پارێزگا
    { wch: 30 }, // ناونیشان
    { wch: 24 }, // سەرۆکی خێزان
    { wch: 26 }, // بژێوی دابین دەکات
    { wch: 24 }, // ناوی دابینکەر
    { wch: 22 }, // تەنها دابینکەر
    { wch: 28 }, // دابینکەرانی تر
    { wch: 16 }, // ئەندامانی خێزان
    { wch: 20 }, // داهات
    { wch: 18 }, // حاڵەت
    { wch: 35 }  // تێبینی
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'تێمپلەیتی سوودمەندان');

  XLSX.writeFile(workbook, 'Template_Beneficiaries_Bamboki.xlsx');
};

const normalizeGovernorate = (val: string): Beneficiary['governorate'] => {
  const clean = (val || '').toString().trim();
  if (clean.includes('سلێمانی')) return 'سلێمانی';
  if (clean.includes('دهۆک')) return 'دهۆک';
  if (clean.includes('هەڵەبجە')) return 'هەڵەبجە';
  if (clean.includes('کەرکووک') || clean.includes('کرکوک')) return 'کەرکووک';
  if (clean.includes('گەرمیان')) return 'گەرمیان';
  if (clean.includes('زاخۆ')) return 'زاخۆ';
  return 'هەولێر';
};

const normalizeCategory = (val: string): NeedCategory => {
  const clean = (val || '').toString().toLowerCase().trim();
  if (clean.includes('هەتیو') || clean.includes('بێباوک') || clean === 'orphan') return 'orphan';
  if (clean.includes('نەخۆش') || clean === 'sick') return 'sick';
  if (clean.includes('پێداویستی') || clean.includes('کەمئەندام') || clean === 'disabled') return 'disabled';
  if (clean.includes('خوێندکار') || clean === 'student') return 'student';
  if (clean.includes('ئاوارە') || clean === 'displaced') return 'displaced';
  return 'poor';
};

const parseBooleanKurdish = (val: any, defaultVal = false): boolean => {
  if (typeof val === 'boolean') return val;
  const str = (val || '').toString().toLowerCase().trim();
  if (str === 'بەڵێ' || str === 'بەڵئ' || str === 'yes' || str === 'true' || str === '1') return true;
  if (str === 'نەخێر' || str === 'نە' || str === 'no' || str === 'false' || str === '0') return false;
  return defaultVal;
};

const parseOtherProvidersString = (str: string): OtherProvider[] => {
  if (!str || str.trim() === '-' || str.trim() === '') return [];
  // Expected formats like: "کاروان (کوڕ - 200000); سۆران (برا - 150000)" or comma separated
  const parts = str.split(/[;؛]/).map(p => p.trim()).filter(Boolean);
  return parts.map(part => {
    const match = part.match(/^([^(]+)(?:\(([^)-]+)(?:-\s*(\d+))?\))?/);
    if (match) {
      return {
        name: match[1].trim(),
        relation: match[2] ? match[2].trim() : 'خێزان',
        monthlyIncomeIQD: match[3] ? Number(match[3]) : undefined
      };
    }
    return {
      name: part,
      relation: 'ئەندامی خێزان'
    };
  });
};

export interface ParseResult {
  valid: Array<Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>>;
  errors: Array<{ row: number; name: string; reason: string }>;
}

export const parseBeneficiaryExcelFile = async (file: File): Promise<ParseResult> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    return { valid: [], errors: [{ row: 1, name: 'فایل', reason: 'پەڕەی کار لەناو فایلەکەدا نەدۆزرایەوە' }] };
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const valid: Array<Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>> = [];
  const errors: Array<{ row: number; name: string; reason: string }> = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 considering 1-indexed and header row

    const fullName = String(
      row[EXCEL_COLUMNS.fullName] || row['fullName'] || row['ناو'] || row['ناوی تەواو'] || ''
    ).trim();

    const nationalId = String(
      row[EXCEL_COLUMNS.nationalId] || row['nationalId'] || row['ناسنامە'] || row['ژمارەی نیشتمانی'] || ''
    ).trim();

    const phone = String(
      row[EXCEL_COLUMNS.phone] || row['phone'] || row['مۆبایل'] || row['ژمارەی مۆبایل'] || ''
    ).trim();

    if (!fullName) {
      errors.push({ row: rowNum, name: 'نادیار', reason: 'ناوی تەواوی کەس داواکراوە' });
      return;
    }

    if (!nationalId) {
      errors.push({ row: rowNum, name: fullName, reason: 'ژمارەی ناسنامە داواکراوە' });
      return;
    }

    const rawGender = String(row[EXCEL_COLUMNS.gender] || row['gender'] || row['ڕەگەز'] || '').trim();
    const gender: 'male' | 'female' = (rawGender.includes('مێ') || rawGender.toLowerCase() === 'female') ? 'female' : 'male';

    const rawAge = Number(row[EXCEL_COLUMNS.age] || row['age'] || row['تەمەن']) || 35;
    const age = rawAge > 0 && rawAge < 125 ? rawAge : 35;

    const rawFamilyHead = row[EXCEL_COLUMNS.isFamilyHead] ?? row['isFamilyHead'] ?? row['سەرۆکی خێزان'];
    const isFamilyHead = parseBooleanKurdish(rawFamilyHead, true);

    const rawIsProvider = row[EXCEL_COLUMNS.isProvider] ?? row['isProvider'] ?? row['بژێوی دابین دەکات'];
    const isProvider = parseBooleanKurdish(rawIsProvider, true);

    let providerName: string | undefined = undefined;
    let isOnlyProvider: boolean | undefined = undefined;
    let otherProviders: OtherProvider[] = [];

    if (!isProvider) {
      providerName = String(row[EXCEL_COLUMNS.providerName] || row['providerName'] || '').trim() || 'دابینکەری دەرەکی';
    } else {
      const rawOnlyProvider = row[EXCEL_COLUMNS.isOnlyProvider] ?? row['isOnlyProvider'];
      isOnlyProvider = parseBooleanKurdish(rawOnlyProvider, true);
      if (!isOnlyProvider) {
        const rawOther = String(row[EXCEL_COLUMNS.otherProviders] || row['otherProviders'] || '').trim();
        otherProviders = parseOtherProvidersString(rawOther);
      }
    }

    const governorate = normalizeGovernorate(String(row[EXCEL_COLUMNS.governorate] || row['governorate'] || 'هەولێر'));
    const address = String(row[EXCEL_COLUMNS.address] || row['address'] || row['ناونیشان'] || 'ناونیشانی تۆمارنەکراو').trim();
    const familyMembers = Math.max(1, Number(row[EXCEL_COLUMNS.familyMembers] || row['familyMembers'] || row['ئەندامانی خێزان']) || 1);
    const monthlyIncomeIQD = Math.max(0, Number(row[EXCEL_COLUMNS.monthlyIncomeIQD] || row['monthlyIncomeIQD'] || row['داهات']) || 0);
    const needCategory = normalizeCategory(String(row[EXCEL_COLUMNS.needCategory] || row['needCategory'] || 'poor'));
    const notes = String(row[EXCEL_COLUMNS.notes] || row['notes'] || row['تێبینی'] || '').trim();

    valid.push({
      fullName,
      nationalId,
      phone: phone || '07500000000',
      gender,
      age,
      isFamilyHead,
      isProvider,
      providerName,
      isOnlyProvider,
      otherProviders: otherProviders.length > 0 ? otherProviders : undefined,
      governorate,
      address,
      familyMembers,
      monthlyIncomeIQD,
      needCategory,
      status: 'approved',
      notes
    });
  });

  return { valid, errors };
};
