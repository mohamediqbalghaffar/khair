import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Beneficiary, NeedCategory, OtherProvider } from '../types';

export const EXCEL_COLUMNS = {
  fullName: 'ناوی تەواوی کەس',
  nationalId: 'ژمارەی ناسنامە',
  gender: 'ڕەگەز (نێر / مێ)',
  age: 'تەمەن',
  phone: 'ژمارەی مۆبایل',
  governorate: 'پارێزگا',
  address: 'ناونیشانی ورد',
  isFamilyHead: 'ئایا سەرۆکی خێزانە؟',
  isProvider: 'ئایا بژێوی خێزان دابین دەکات؟',
  providerName: 'ناوی دابینکەر ئەگەر نا',
  isOnlyProvider: 'تەنها دابینکەرە؟',
  otherProviders: 'دابینکەرانی تر لە هەمان خێزاندا',
  familyMembers: 'ئەندامانی خێزان',
  monthlyIncomeIQD: 'داهاتی مانگانە (دینار)',
  needCategory: 'حاڵەت',
  notes: 'تێبینی و بارودۆخی تایبەت'
} as const;

// Pre-set allowed option lists
export const PRESET_OPTIONS = {
  gender: ['نێر', 'مێ'],
  governorate: ['هەولێر', 'سلێمانی', 'دهۆک', 'هەڵەبجە', 'کەرکووک', 'گەرمیان', 'زاخۆ'],
  isFamilyHead: ['بەڵێ', 'نەخێر'],
  isProvider: ['بەڵێ', 'نەخێر'],
  isOnlyProvider: ['بەڵێ', 'نەخێر', '-'],
  needCategory: [
    'هەژار و کەمدەرامەت',
    'بێباوک و هەتیو',
    'نەخۆشی درێژخایەن',
    'خاوەن پێداویستی تایبەت',
    'خوێندکاری هەژار'
  ]
};

export const downloadBeneficiaryExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ڕێکخراوی بۆتان بامۆکی';
  workbook.created = new Date();

  // 1. Create Lookup sheet for strict validation dropdowns (hidden from clutter)
  const lookupSheet = workbook.addWorksheet('_LookupData');
  lookupSheet.state = 'veryHidden'; // completely hide lookup sheet so Excel user only sees the main table

  // Write option columns in _LookupData
  // Col A: Gender
  PRESET_OPTIONS.gender.forEach((val, i) => {
    lookupSheet.getCell(i + 1, 1).value = val;
  });
  // Col B: Governorate
  PRESET_OPTIONS.governorate.forEach((val, i) => {
    lookupSheet.getCell(i + 1, 2).value = val;
  });
  // Col C: isFamilyHead
  PRESET_OPTIONS.isFamilyHead.forEach((val, i) => {
    lookupSheet.getCell(i + 1, 3).value = val;
  });
  // Col D: isProvider
  PRESET_OPTIONS.isProvider.forEach((val, i) => {
    lookupSheet.getCell(i + 1, 4).value = val;
  });
  // Col E: isOnlyProvider
  PRESET_OPTIONS.isOnlyProvider.forEach((val, i) => {
    lookupSheet.getCell(i + 1, 5).value = val;
  });
  // Col F: needCategory
  PRESET_OPTIONS.needCategory.forEach((val, i) => {
    lookupSheet.getCell(i + 1, 6).value = val;
  });

  // 2. Create Main Sheet with NATIVE RIGHT-TO-LEFT LAYOUT
  const worksheet = workbook.addWorksheet('تێمپلەیتی سوودمەندان', {
    views: [
      {
        state: 'normal',
        rightToLeft: true, // Native Right-To-Left view in Microsoft Excel!
        activeCell: 'A2'
      }
    ]
  });

  // Define Columns with headers and optimal widths
  worksheet.columns = [
    { header: EXCEL_COLUMNS.fullName, key: 'fullName', width: 26 },
    { header: EXCEL_COLUMNS.nationalId, key: 'nationalId', width: 20 },
    { header: EXCEL_COLUMNS.gender, key: 'gender', width: 15 },
    { header: EXCEL_COLUMNS.age, key: 'age', width: 12 },
    { header: EXCEL_COLUMNS.phone, key: 'phone', width: 18 },
    { header: EXCEL_COLUMNS.governorate, key: 'governorate', width: 16 },
    { header: EXCEL_COLUMNS.address, key: 'address', width: 32 },
    { header: EXCEL_COLUMNS.isFamilyHead, key: 'isFamilyHead', width: 22 },
    { header: EXCEL_COLUMNS.isProvider, key: 'isProvider', width: 24 },
    { header: EXCEL_COLUMNS.providerName, key: 'providerName', width: 24 },
    { header: EXCEL_COLUMNS.isOnlyProvider, key: 'isOnlyProvider', width: 20 },
    { header: EXCEL_COLUMNS.otherProviders, key: 'otherProviders', width: 30 },
    { header: EXCEL_COLUMNS.familyMembers, key: 'familyMembers', width: 16 },
    { header: EXCEL_COLUMNS.monthlyIncomeIQD, key: 'monthlyIncomeIQD', width: 22 },
    { header: EXCEL_COLUMNS.needCategory, key: 'needCategory', width: 24 },
    { header: EXCEL_COLUMNS.notes, key: 'notes', width: 36 }
  ];

  // Modern Table Styling: Style Header Row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 36;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0891B2' } // Elegant Cyan / Teal header
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0E7490' } },
      bottom: { style: 'medium', color: { argb: 'FF0E7490' } },
      left: { style: 'thin', color: { argb: 'FF0E7490' } },
      right: { style: 'thin', color: { argb: 'FF0E7490' } }
    };
  });

  // Two guide sample rows
  const sampleRows = [
    {
      fullName: 'ئازاد کامەران ئەحمەد',
      nationalId: '19850123456',
      gender: 'نێر',
      age: 42,
      phone: '07501234567',
      governorate: 'هەولێر',
      address: 'کەرکووک رۆد، گەڕەکی ڕاستی',
      isFamilyHead: 'بەڵێ',
      isProvider: 'بەڵێ',
      providerName: '-',
      isOnlyProvider: 'نەخێر',
      otherProviders: 'کاروان (کوڕ - 200000)',
      familyMembers: 5,
      monthlyIncomeIQD: 350000,
      needCategory: 'هەژار و کەمدەرامەت',
      notes: 'کرێچییە و پێویستی بە هاوکاری مانگانەیە'
    },
    {
      fullName: 'شیلان فەرهاد عومەر',
      nationalId: '19920987654',
      gender: 'مێ',
      age: 34,
      phone: '07709876543',
      governorate: 'سلێمانی',
      address: 'ڕاپەڕین، نزیک مزگەوتی گەورە',
      isFamilyHead: 'بەڵێ',
      isProvider: 'نەخێر',
      providerName: 'باوکی کۆچکردوو / خێرخوازان',
      isOnlyProvider: '-',
      otherProviders: '-',
      familyMembers: 3,
      monthlyIncomeIQD: 0,
      needCategory: 'بێباوک و هەتیو',
      notes: 'بێ سەرپەرشت و کەم دەرامەت'
    }
  ];

  sampleRows.forEach(row => worksheet.addRow(row));

  // Add 100 formatted empty rows ready for immediate user entry
  for (let i = 4; i <= 100; i++) {
    worksheet.addRow({});
  }

  // Define column letters / numbers for data validation
  // Col 3 (C): Gender -> _LookupData!$A$1:$A$2
  // Col 6 (F): Governorate -> _LookupData!$B$1:$B$7
  // Col 8 (H): isFamilyHead -> _LookupData!$C$1:$C$2
  // Col 9 (I): isProvider -> _LookupData!$D$1:$D$2
  // Col 11 (K): isOnlyProvider -> _LookupData!$E$1:$E$3
  // Col 15 (O): needCategory -> _LookupData!$F$1:$F$5

  // Apply Styling and Strict Data Validations across all data rows (Rows 2 to 100)
  for (let r = 2; r <= 100; r++) {
    const row = worksheet.getRow(r);
    row.height = 26;
    const isEven = r % 2 === 0;

    for (let c = 1; c <= 16; c++) {
      const cell = row.getCell(c);

      // Alternating row background for a modern zebra table look
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
      };

      cell.font = {
        name: 'Segoe UI',
        size: 10,
        color: { argb: 'FF1E293B' }
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Alignments: Numbers and short dropdowns centered, long texts right-aligned
      if ([2, 3, 4, 5, 6, 8, 9, 11, 13, 14, 15].includes(c)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      // Format numeric income & family count
      if (c === 14 && cell.value) {
        cell.numFmt = '#,##0';
      }
    }

    // Strict Data Validation Dropdowns (Prevents invalid manual typing)
    // 1. Gender (Col 3 / C)
    row.getCell(3).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_LookupData!$A$1:$A$2'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'ڕەگەزی نادروست',
      error: 'تکایە تەنها یەکێک لە بژاردە دیاریکراوەکانی (نێر یان مێ) لە لیستەکە هەڵبژێرە.'
    };

    // 2. Governorate (Col 6 / F)
    row.getCell(6).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_LookupData!$B$1:$B$7'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'پارێزگای نادروست',
      error: 'تکایە ناوی پارێزگاکە لە لیستە دیاریکراوەکە هەڵبژێرە.'
    };

    // 3. Head of family (Col 8 / H)
    row.getCell(8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_LookupData!$C$1:$C$2'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'بژاردەی نادروست',
      error: 'تکایە تەنها (بەڵێ یان نەخێر) هەڵبژێرە.'
    };

    // 4. Is Provider (Col 9 / I)
    row.getCell(9).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_LookupData!$D$1:$D$2'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'بژاردەی نادروست',
      error: 'تکایە تەنها (بەڵێ یان نەخێر) هەڵبژێرە.'
    };

    // 5. Is Only Provider (Col 11 / K)
    row.getCell(11).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_LookupData!$E$1:$E$3'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'بژاردەی نادروست',
      error: 'تکایە تەنها (بەڵێ، نەخێر، یان -) لە لیستەکە هەڵبژێرە.'
    };

    // 6. Need Category (Col 15 / O)
    row.getCell(15).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_LookupData!$F$1:$F$5'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'حاڵەتی نادروست',
      error: 'تکایە جۆری حاڵەت لە لیستە پەسەندکراوەکە هەڵبژێرە.'
    };
  }

  // Enable AutoFilter on header row
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 100, column: 16 }
  };

  // Generate binary and trigger modern browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'Template_Beneficiaries_Bamboki.xlsx';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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

  // Find the first data sheet (ignoring internal lookup sheet if present)
  let sheetName = workbook.SheetNames.find(n => !n.startsWith('_')) || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return { valid: [], errors: [{ row: 1, name: 'فایل', reason: 'پەڕەی کار لەناو فایلەکەدا نەدۆزرایەوە' }] };
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const valid: Array<Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>> = [];
  const errors: Array<{ row: number; name: string; reason: string }> = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;

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
      status: 'pending',
      notes
    });
  });

  return { valid, errors };
};
