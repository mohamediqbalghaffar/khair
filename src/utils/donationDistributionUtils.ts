import { Donation, Beneficiary, InventoryItem, AidRecord } from '../types';
import { getExchangeRateForDate } from './exchangeRates';

export interface DonationCashMetrics {
  totalAmount: number;
  distributedAmount: number;
  remainingAmount: number;
  remainingCash: number;
  isFullyDistributed: boolean;
  distributionsCount: number;
  uniqueBeneficiariesCount: number;
  currency: 'IQD' | 'USD';
  currencySymbol: string;
  dayRate: number;
  linkedAids: Array<AidRecord & { beneficiaryId: string; beneficiaryName: string }>;
}

export interface DonationInKindMetrics {
  matchedItem: InventoryItem | null;
  totalQuantity: number;
  remainingQuantity: number;
  distributedQuantity: number;
  unit: string;
  isFullyDistributed: boolean;
  distributionsCount: number;
  uniqueBeneficiariesCount: number;
  linkedAids: Array<AidRecord & { beneficiaryId: string; beneficiaryName: string }>;
}

export interface DonationOverallMetrics {
  isCash: boolean;
  isInKind: boolean;
  totalQuantityOrAmount: number;
  distributedQuantityOrAmount: number;
  remainingQuantityOrAmount: number;
  isFullyDistributed: boolean;
  unitOrCurrency: string;
  distributionsCount: number;
  uniqueBeneficiariesCount: number;
  cashMetrics?: DonationCashMetrics;
  inKindMetrics?: DonationInKindMetrics;
}

/**
 * Calculates live cash distribution metrics for a given cash donation receipt.
 */
export const getDonationCashMetrics = (
  donation: Donation,
  beneficiaries: Beneficiary[]
): DonationCashMetrics => {
  const isIQD = donation.currency === 'IQD';
  const currencySymbol = isIQD ? 'د.ع' : '$';
  const dayRate = donation.exchangeRateAtDate || getExchangeRateForDate(donation.date).rate || 1530;

  // Find all monetary aid distributions linked to this receipt
  const linkedAids: Array<AidRecord & { beneficiaryId: string; beneficiaryName: string }> = [];
  const uniqueBenIds = new Set<string>();

  for (const ben of beneficiaries) {
    if (!ben.aidHistory) continue;
    for (const aid of ben.aidHistory) {
      if (
        aid.type === 'monetary' &&
        (aid.receiptNumber === donation.receiptNumber || (aid.donationId && aid.donationId === donation.id))
      ) {
        linkedAids.push({
          ...aid,
          beneficiaryId: ben.id,
          beneficiaryName: ben.fullName
        });
        uniqueBenIds.add(ben.id);
      }
    }
  }

  // Sum up distributed amount in the donation's original currency
  const distributedInOriginalCurrency = linkedAids.reduce((sum, aid) => {
    if (aid.amount && aid.currency === donation.currency) {
      return sum + aid.amount;
    }
    const aidIQD = aid.amountIQD || 0;
    if (isIQD) {
      return sum + aidIQD;
    } else {
      return sum + (dayRate > 0 ? aidIQD / dayRate : 0);
    }
  }, 0);

  const totalAmount = donation.amount || 0;
  const distributedAmount = isIQD
    ? Math.round(distributedInOriginalCurrency)
    : Number(distributedInOriginalCurrency.toFixed(2));
  const remainingAmount = Math.max(
    0,
    isIQD
      ? totalAmount - distributedAmount
      : Number((totalAmount - distributedAmount).toFixed(2))
  );

  return {
    totalAmount,
    distributedAmount,
    remainingAmount,
    remainingCash: remainingAmount,
    isFullyDistributed: remainingAmount <= 0,
    distributionsCount: linkedAids.length,
    uniqueBeneficiariesCount: uniqueBenIds.size,
    currency: donation.currency,
    currencySymbol,
    dayRate,
    linkedAids
  };
};

/**
 * Calculates live in-kind distribution metrics for a given in-kind donation receipt.
 */
export const getDonationInKindMetrics = (
  donation: Donation,
  inventory: InventoryItem[],
  beneficiaries: Beneficiary[]
): DonationInKindMetrics => {
  const matchedItem = inventory.find(
    i => i.sourceReceiptNumber === donation.receiptNumber || i.sourceDonationId === donation.id
  ) || null;

  const unit = matchedItem?.unit || donation.itemDetails?.unit || 'دانە';
  const totalQuantity = donation.itemDetails?.quantity || matchedItem?.quantity || 0;

  // Find all in-kind aid distributions linked to this receipt
  const linkedAids: Array<AidRecord & { beneficiaryId: string; beneficiaryName: string }> = [];
  const uniqueBenIds = new Set<string>();

  for (const ben of beneficiaries) {
    if (!ben.aidHistory) continue;
    for (const aid of ben.aidHistory) {
      if (
        aid.type === 'in-kind' &&
        (aid.receiptNumber === donation.receiptNumber || (aid.donationId && aid.donationId === donation.id))
      ) {
        linkedAids.push({
          ...aid,
          beneficiaryId: ben.id,
          beneficiaryName: ben.fullName
        });
        uniqueBenIds.add(ben.id);
      }
    }
  }

  const distributedQuantity = linkedAids.reduce((sum, aid) => sum + (Number(aid.quantity) || 0), 0);
  const remainingQuantity = matchedItem ? matchedItem.quantity : Math.max(0, totalQuantity - distributedQuantity);

  return {
    matchedItem,
    totalQuantity,
    remainingQuantity,
    distributedQuantity,
    unit,
    isFullyDistributed: remainingQuantity <= 0,
    distributionsCount: linkedAids.length,
    uniqueBeneficiariesCount: uniqueBenIds.size,
    linkedAids
  };
};

/**
 * Unified helper returning progress metrics for either cash or in-kind donation receipts.
 */
export const getDonationOverallMetrics = (
  donation: Donation,
  inventory: InventoryItem[],
  beneficiaries: Beneficiary[]
): DonationOverallMetrics => {
  const isCash = !donation.category || donation.category === 'cash';

  if (isCash) {
    const cash = getDonationCashMetrics(donation, beneficiaries);
    return {
      isCash: true,
      isInKind: false,
      totalQuantityOrAmount: cash.totalAmount,
      distributedQuantityOrAmount: cash.distributedAmount,
      remainingQuantityOrAmount: cash.remainingAmount,
      isFullyDistributed: cash.isFullyDistributed,
      unitOrCurrency: cash.currencySymbol,
      distributionsCount: cash.distributionsCount,
      uniqueBeneficiariesCount: cash.uniqueBeneficiariesCount,
      cashMetrics: cash
    };
  } else {
    const inKind = getDonationInKindMetrics(donation, inventory, beneficiaries);
    return {
      isCash: false,
      isInKind: true,
      totalQuantityOrAmount: inKind.totalQuantity,
      distributedQuantityOrAmount: inKind.distributedQuantity,
      remainingQuantityOrAmount: inKind.remainingQuantity,
      isFullyDistributed: inKind.isFullyDistributed,
      unitOrCurrency: inKind.unit,
      distributionsCount: inKind.distributionsCount,
      uniqueBeneficiariesCount: inKind.uniqueBeneficiariesCount,
      inKindMetrics: inKind
    };
  }
};

/**
 * Calculates total undistributed cash available in the treasury across all cash donations.
 */
export const getTotalTreasuryCashAvailable = (
  donations: Donation[],
  beneficiaries: Beneficiary[]
) => {
  const cashDonations = donations.filter(d => !d.category || d.category === 'cash');
  let availableIQD = 0;
  let availableUSD = 0;

  for (const don of cashDonations) {
    const m = getDonationCashMetrics(don, beneficiaries);
    if (m.remainingAmount > 0) {
      if (m.currency === 'IQD') {
        availableIQD += m.remainingAmount;
      } else {
        availableUSD += m.remainingAmount;
      }
    }
  }

  return { availableIQD, availableUSD };
};
