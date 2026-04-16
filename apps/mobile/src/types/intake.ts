import { ItemCategory, StorageSpace } from '@/src/types/item';

export interface BarcodeScanResult {
  rawCode: string;
  name?: string;
  brand?: string;
  category?: ItemCategory;
  storageSpace?: StorageSpace;
  quantityUnit?: string;
  source: 'mock' | 'barcode_db' | 'ai';
}

export interface OcrDateResult {
  rawText: string;
  expiresOn?: string;
  productionDate?: string;
  shelfLifeDays?: number;
  confidence?: number;
  source: 'mock' | 'ocr';
}

export interface IntakeDraftPatch {
  name?: string;
  category?: ItemCategory;
  storageSpace?: StorageSpace;
  expiresOn?: string;
  quantityUnit?: string;
  note?: string;
}
