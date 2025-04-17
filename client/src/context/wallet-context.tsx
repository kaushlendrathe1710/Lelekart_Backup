import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRoute } from "wouter";

interface WalletTransaction {
  id: number;
  userId: number;
  amount: number;
  type: "credit" | "debit" | "expired";
  description: string;
  createdAt: string;
  expiresAt: string | null;
}

interface Wallet {
  id: number;
  userId: number;
  balance: number;
}

interface WalletSettings {
  id?: number;
  firstPurchaseCoins: number;
  expiryDays: number;
  conversionRate: number; // How many coins equal 1 INR
  maxUsagePercentage: number; // Maximum percentage of order value that can be paid with coins
  minCartValue: number; // Minimum cart value required to use coins
  applicableCategories: string; // Comma-separated list of categories where coins can be applied
  isActive: boolean;
}

type RedeemCoinsOptions = {
  referenceType?: string;
  referenceId?: number;
  description?: string;
  orderValue?: number;
  category?: string;
};

type WalletContextType = {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  settings: WalletSettings | null;
  isLoading: boolean;
  isSettingsLoading: boolean;
  isTransactionsLoading: boolean;
  redeemCoins: (amount: number, options?: RedeemCoinsOptions) => Promise<void>;
  refetchWallet: () => void;
  refetchTransactions: () => void;
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isPublicPage] = useRoute("/seller/public-profile/:id");
  const [isSearchPage] = useRoute("/search");
  
  // For public pages and search pages, just render children without auth requirements
  if (isPublicPage || isSearchPage) {
    return <>{children}</>;
  }
  
  // Only use auth for authenticated pages
  const { user } = useAuth();
  
  // Get wallet data
  const {
    data: wallet,
    isLoading: isWalletLoading,
    refetch: refetchWallet
  } = useQuery({
    queryKey: ['/api/wallet'],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await apiRequest('GET', '/api/wallet');
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch wallet data');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching wallet:', error);
        return null;
      }
    },
    enabled: !!user
  });

  // Get wallet transactions
  const {
    data: transactionsData = { transactions: [], total: 0 },
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['/api/wallet/transactions'],
    queryFn: async () => {
      if (!user) return { transactions: [], total: 0 };
      try {
        const res = await apiRequest('GET', '/api/wallet/transactions');
        if (!res.ok) {
          throw new Error('Failed to fetch wallet transactions');
        }
        const data = await res.json();
        // Handle both formats: either array or {transactions: array, total: number}
        if (Array.isArray(data)) {
          return { transactions: data, total: data.length };
        }
        return data;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return { transactions: [], total: 0 };
      }
    },
    enabled: !!user,
  });

  // Get wallet settings
  const {
    data: rawSettings,
    isLoading: isSettingsLoading,
  } = useQuery({
    queryKey: ['/api/wallet/settings'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/wallet/settings');
        if (!res.ok) {
          throw new Error('Failed to fetch wallet settings');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching wallet settings:', error);
        return null;
      }
    },
  });
  
  // Map server field names to client field names
  const settings = rawSettings ? {
    ...rawSettings,
    // Map the server's isEnabled field to our client-side isActive field
    isActive: rawSettings.isEnabled,
    // Ensure we have the correct number formats
    conversionRate: Number(rawSettings.coinToCurrencyRatio),
    expiryDays: Number(rawSettings.coinExpiryDays),
    maxUsagePercentage: Number(rawSettings.maxUsagePercentage || 0),
    minCartValue: Number(rawSettings.minCartValue || 0)
  } : null;

  // Redeem coins mutation
  const redeemCoinsMutation = useMutation({
    mutationFn: async (params: {
      amount: number;
    } & RedeemCoinsOptions) => {
      const res = await apiRequest('POST', '/api/wallet/redeem', params);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to redeem coins');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coins Redeemed",
        description: "Your coins have been successfully redeemed",
      });
      refetchWallet();
      refetchTransactions();
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const redeemCoins = async (amount: number, options?: RedeemCoinsOptions) => {
    await redeemCoinsMutation.mutateAsync({
      amount,
      ...options
    });
  };

  // Extract transactions from the data structure
  const transactions = transactionsData?.transactions || [];

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        settings,
        isLoading: isWalletLoading,
        isTransactionsLoading,
        isSettingsLoading,
        redeemCoins,
        refetchWallet,
        refetchTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const [isPublicPage] = useRoute("/seller/public-profile/:id");
  const [isSearchPage] = useRoute("/search");
  const context = useContext(WalletContext);
  
  // For public pages and search pages, provide a mock wallet context
  if (isPublicPage || isSearchPage) {
    return {
      wallet: null,
      transactions: [],
      settings: null,
      isLoading: false,
      isSettingsLoading: false,
      isTransactionsLoading: false,
      redeemCoins: async () => {},
      refetchWallet: () => {},
      refetchTransactions: () => {},
    } as WalletContextType;
  }
  
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}