import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const SUBSCRIPTION_TIERS = {
  basic: {
    name: "Basic",
    label: "Starter Visibility",
    price_id: "price_1TITwdLzBapklKeQIJc4JQIU",
    product_id: "prod_UH20hOQ5SEdXsR",
    price: 699,
    color: "emerald" as const,
  },
  pro: {
    name: "Pro",
    label: "Growth Engine",
    price_id: "price_1TITx9LzBapklKeQeR57rO1J",
    product_id: "prod_UH21YmyAWW0tXd",
    price: 1499,
    color: "blue" as const,
  },
  enterprise: {
    name: "Enterprise",
    label: "Enterprise",
    price_id: "price_1TITxYLzBapklKeQ7o35AMz0",
    product_id: "prod_UH21KYOECTzKeA",
    price: 3000,
    color: "red" as const,
  },
} as const;

export type TierKey = keyof typeof SUBSCRIPTION_TIERS;

export function getTierByProductId(productId: string | null): TierKey | null {
  if (!productId) return null;
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.product_id === productId) return key as TierKey;
  }
  return null;
}

export interface SubscriptionState {
  subscribed: boolean;
  tier: TierKey | null;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    tier: null,
    productId: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      const tier = getTierByProductId(data?.product_id);
      setState({
        subscribed: data?.subscribed ?? false,
        tier,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
      setState(s => ({ ...s, loading: false }));
    }
  }, [session]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const openCheckout = async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Customer portal error:", err);
      throw err;
    }
  };

  return { ...state, checkSubscription, openCheckout, openCustomerPortal };
}
