import { ParseResult } from './excelBeneficiaryUtils';

export interface StagedExcelImportReport {
  fileName: string;
  validRows: ParseResult['valid'];
  duplicateRows: Array<{
    rowData: ParseResult['valid'][number];
    reason: string;
  }>;
  errorRows: ParseResult['errors'];
}

export function buildStagedExcelReport(
  fileName: string,
  parsed: ParseResult,
  existingBeneficiaries: Array<{ fullName?: string; name?: string; phone?: string }>,
  language: 'ckb' | 'ar' | 'en' = 'ckb'
): StagedExcelImportReport {
  const existingPhones = new Set(
    existingBeneficiaries
      .map((b) => (b.phone || '').replace(/\D+/g, ''))
      .filter(Boolean)
  );
  const existingNames = new Set(
    existingBeneficiaries.map((b) => (b.fullName || b.name || '').trim().toLowerCase()).filter(Boolean)
  );

  const validRows: ParseResult['valid'] = [];
  const duplicateRows: StagedExcelImportReport['duplicateRows'] = [];

  for (const row of parsed.valid) {
    const cleanPhone = (row.phone || '').replace(/\D+/g, '');
    const cleanName = (row.fullName || '').trim().toLowerCase();

    if (cleanPhone && existingPhones.has(cleanPhone)) {
      duplicateRows.push({
        rowData: row,
        reason:
          language === 'en'
            ? `Duplicate phone number (${row.phone})`
            : `ژمارەی مۆبایل دووبارەیە (${row.phone})`,
      });
    } else if (cleanName && existingNames.has(cleanName)) {
      duplicateRows.push({
        rowData: row,
        reason:
          language === 'en'
            ? `Duplicate beneficiary name (${row.fullName})`
            : `ناوی سوودمەند دووبارەیە (${row.fullName})`,
      });
    } else {
      validRows.push(row);
    }
  }

  return {
    fileName,
    validRows,
    duplicateRows,
    errorRows: parsed.errors,
  };
}
