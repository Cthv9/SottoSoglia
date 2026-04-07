import { useEffect, useState, useCallback } from 'react';
import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getPurchaseHistory,
  type Product,
  type Purchase,
  PurchaseError,
  finishTransaction,
} from 'react-native-iap';
import { useExpenseStore } from '@/store/expenses';
import { setSetting, getSetting } from '@/db/database';

export const PRODUCT_ID = 'sottosoglia_unlock';

export function useIAP() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUnlocked } = useExpenseStore();

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        await initConnection();
        // Check if already purchased
        const stored = await getSetting('unlocked');
        if (stored === '1') {
          setUnlocked(true);
          return;
        }
        // Also verify purchase history
        const history = await getPurchaseHistory();
        const hasPurchase = history.some((p: Purchase) => p.productId === PRODUCT_ID);
        if (hasPurchase) {
          await setSetting('unlocked', '1');
          setUnlocked(true);
          return;
        }
        // Load product info
        const products = await getProducts({ skus: [PRODUCT_ID] });
        if (mounted && products.length > 0) {
          setProduct(products[0]);
        }
      } catch {
        // IAP not available in dev mode — silently skip
      }
    }

    setup();

    return () => {
      mounted = false;
      endConnection();
    };
  }, [setUnlocked]);

  const purchase = useCallback(async () => {
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      const result = await requestPurchase({ sku: PRODUCT_ID });
      if (result) {
        await finishTransaction({ purchase: result as Purchase, isConsumable: false });
        await setSetting('unlocked', '1');
        setUnlocked(true);
      }
    } catch (e) {
      if ((e as PurchaseError).code !== 'E_USER_CANCELLED') {
        setError((e as Error).message ?? 'Purchase failed');
      }
    } finally {
      setLoading(false);
    }
  }, [product, setUnlocked]);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await getPurchaseHistory();
      const hasPurchase = history.some((p: Purchase) => p.productId === PRODUCT_ID);
      if (hasPurchase) {
        await setSetting('unlocked', '1');
        setUnlocked(true);
      } else {
        setError('Nessun acquisto trovato');
      }
    } catch (e) {
      setError((e as Error).message ?? 'Restore failed');
    } finally {
      setLoading(false);
    }
  }, [setUnlocked]);

  return { product, loading, error, purchase, restore };
}
