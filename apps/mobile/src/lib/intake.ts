import { BarcodeScanResult, IntakeDraftPatch, OcrDateResult } from '@/src/types/intake';

export function patchDraftFromBarcode(result: BarcodeScanResult): IntakeDraftPatch {
  return {
    name: result.name,
    category: result.category,
    storageSpace: result.storageSpace,
    quantityUnit: result.quantityUnit,
    note: result.brand ? `品牌：${result.brand}` : undefined,
  };
}

export function patchDraftFromOcr(result: OcrDateResult): IntakeDraftPatch {
  return {
    expiresOn: result.expiresOn,
  };
}
