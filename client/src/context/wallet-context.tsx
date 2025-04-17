import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRoute, useLocation } from "wouter";

// Types
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
  conversionRate: number;
  maxUsagePercentage: number;
  minCartValue: number;
  applicableCategories: string;
  isActive: boolean;
}

type RedeemCoinsOptions = {
  referenceType?: string;
  referenceId?: number;
  description?: string;
  orderValue?: number;
  category?: string;
};

// Context interface
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

// Default mock values for public/non-authenticated routes
const defaultWalletContext: WalletContextType = {
  wallet: null,
  transactions: [],
  settings: null,
  isLoading: false,
  isSettingsLoading: false,
  isTransactionsLoading: false,
  redeemCoins: async () => {},
  refetchWallet: () => {},
  refetchTransactions: () => {},
};

// Create context with default values to avoid null checks
const WalletContext = createContext<WalletContextType>(defaultWalletContext);

// Helper function to check if a route is public/non-authenticated
function isPublicRoute(pathname: string): boolean {
  // List of routes that don't require authentication
  const publicRoutes = ['/search', '/seller/public-profile'];
  return publicRoutes.some(route => pathname.startsWith(route));
}

// Provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [location] = useLocation();
  
  // If we're on a public route, just render children with the default context
  if (isPublicRoute(location)) {
    return (
      <WalletContext.Provider value={defaultWalletContext}>
        {children}
      </WalletContext.Provider>
    );
  }
  
  // For authenticated routes, use the actual wallet data
  // We'll let the Auth provider handle the authentication check
  
  // Get wallet data
  const {
    data: wallet = null,
    isLoading: isWalletLoading,
    refetch: refetchWallet
  } = useQuery({
    queryKey: ['/api/wallet'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/wallet');
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          if (res.status === 401) {
            // Not authenticated
            return null;
          }
          throw new Error('Failed to fetch wallet data');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching wallet:', error);
        return null;
      }
    }
  });

  // Get wallet transactions
  const {
    data: transactionsData = { transactions: [], total: 0 },
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['/api/wallet/transactions'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/wallet/transactions');
        if (!res.ok) {
          if (res.status === 401) {
            // Not authenticated
            return { transactions: [], total: 0 };
          }
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
    }
  });

  // Get wallet settings
  const {
    data: rawSettings = null,
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

// Custom hook to use the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  // The context is never null because we provide default values
  return context;
}