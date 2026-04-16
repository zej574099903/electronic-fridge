import { BarcodeScanResult } from '@/src/types/intake';
import { ItemCategory, StorageSpace } from '@/src/types/item';

const mockBarcodeMap: Record<string, BarcodeScanResult> = {
  '690000000001': {
    rawCode: '690000000001',
    name: '纯牛奶',
    brand: '示例品牌',
    category: 'drink',
    storageSpace: 'chilled',
    quantityUnit: '盒',
    source: 'mock',
  },
  '690000000002': {
    rawCode: '690000000002',
    name: '原味酸奶',
    brand: '示例品牌',
    category: 'dessert',
    storageSpace: 'chilled',
    quantityUnit: '杯',
    source: 'mock',
  },
  '690000000003': {
    rawCode: '690000000003',
    name: '速冻水饺',
    brand: '示例品牌',
    category: 'prepared',
    storageSpace: 'frozen',
    quantityUnit: '袋',
    source: 'mock',
  },
};

export async function lookupBarcode(code: string): Promise<BarcodeScanResult | null> {
  const normalized = code.trim();

  if (!normalized) {
    return null;
  }

  if (mockBarcodeMap[normalized]) {
    return mockBarcodeMap[normalized];
  }

  const remoteResult = await lookupBarcodeFromOpenFoodFacts(normalized);
  if (remoteResult) {
    return remoteResult;
  }

  return {
    rawCode: normalized,
    source: 'mock',
  };
}

async function lookupBarcodeFromOpenFoodFacts(code: string): Promise<BarcodeScanResult | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${code}`, {
      headers: {
        'User-Agent': 'electronic-fridge-mobile/0.1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      status?: number;
      product?: {
        product_name?: string;
        product_name_zh?: string;
        product_name_en?: string;
        brands?: string;
        categories?: string;
        categories_tags?: string[];
        quantity?: string;
      };
    };

    if (payload.status !== 1 || !payload.product) {
      return null;
    }

    const product = payload.product;
    const name = product.product_name_zh || product.product_name || product.product_name_en;
    const category = inferCategory(product.categories_tags, product.categories, name);
    const storageSpace = inferStorageSpace(product.categories_tags, product.categories, name);
    const quantityUnit = inferQuantityUnit(product.quantity, name);

    return {
      rawCode: code,
      name,
      brand: product.brands,
      category,
      storageSpace,
      quantityUnit,
      source: 'barcode_db',
    };
  } catch {
    return null;
  }
}

function inferCategory(categoriesTags?: string[], categoriesText?: string, name?: string): ItemCategory | undefined {
  const haystack = `${categoriesTags?.join(' ') ?? ''} ${categoriesText ?? ''} ${name ?? ''}`.toLowerCase();

  if (matchesAny(haystack, ['yogurt', 'yaourt', '酸奶', 'dessert', 'pudding', '布丁'])) {
    return 'dessert';
  }

  if (matchesAny(haystack, ['milk', 'juice', 'water', 'drink', 'milkshake', '牛奶', '饮料', '果汁', '矿泉水'])) {
    return 'drink';
  }

  if (matchesAny(haystack, ['fruit', 'apple', 'banana', 'orange', '水果', '苹果', '香蕉'])) {
    return 'fruit';
  }

  if (matchesAny(haystack, ['chips', 'snack', 'cracker', 'cookie', 'biscuit', '零食', '薯片', '饼干'])) {
    return 'snack';
  }

  if (matchesAny(haystack, ['dumpling', 'pizza', 'frozen', 'prepared', 'meal', '速冻', '水饺', '披萨'])) {
    return 'prepared';
  }

  return 'ingredient';
}

function inferStorageSpace(categoriesTags?: string[], categoriesText?: string, name?: string): StorageSpace | undefined {
  const haystack = `${categoriesTags?.join(' ') ?? ''} ${categoriesText ?? ''} ${name ?? ''}`.toLowerCase();

  if (matchesAny(haystack, ['frozen', 'ice cream', 'gelato', '速冻', '冷冻', '冰淇淋'])) {
    return 'frozen';
  }

  return 'chilled';
}

function inferQuantityUnit(quantity?: string, name?: string) {
  const haystack = `${quantity ?? ''} ${name ?? ''}`.toLowerCase();

  if (matchesAny(haystack, ['ml', 'l', '升', '毫升'])) {
    return '盒';
  }

  if (matchesAny(haystack, ['g', 'kg', '克', '千克'])) {
    return '袋';
  }

  return undefined;
}

function matchesAny(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}
