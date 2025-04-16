import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Define wallet data types
interface WalletSettings {
  id: number;
  firstPurchaseCoins: number;
  coinToCurrencyRatio: number;
  minOrderValue: number;
  maxRedeemableCoins: number;
  coinExpiryDays: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Wallet {
  id: number;
  userId: number;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  createdAt: string;
  updatedAt: string;
}

interface WalletTransaction {
  id: number;
  walletId: number;
  amount: number;
  transactionType: string;
  referenceType: string | null;
  referenceId: number | null;
  description: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface RedeemCoinsData {
  amount: number;
  referenceType?: string;
  referenceId?: number;
  description?: string;
}

interface RedeemCoinsResponse {
  wallet: Wallet;
  discountAmount: number;
}

interface WalletContextType {
  wallet: Wallet | null;
  walletSettings: WalletSettings | null;
  transactions: WalletTransaction[];
  isLoadingWallet: boolean;
  isLoadingTransactions: boolean;
  isLoadingSettings: boolean;
  refetchWallet: () => void;
  refetchTransactions: () => void;
  redeemCoinsMutation: any;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get wallet data
  const {
    data: wallet,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest("GET", "/api/wallet");
      if (!res.ok) throw new Error("Failed to fetch wallet");
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Get wallet settings
  const {
    data: walletSettings,
    isLoading: isLoadingSettings,
  } = useQuery<WalletSettings>({
    queryKey: ["/api/wallet/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet/settings");
      if (!res.ok) throw new Error("Failed to fetch wallet settings");
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Get wallet transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useQuery<{ transactions: WalletTransaction[], pagination: any }>({
    queryKey: ["/api/wallet/transactions"],
    queryFn: async () => {
      if (!user) return { transactions: [], pagination: { total: 0 } };
      const res = await apiRequest("GET", "/api/wallet/transactions");
      if (!res.ok) throw new Error("Failed to fetch wallet transactions");
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Redeem coins mutation
  const redeemCoinsMutation = useMutation({
    mutationFn: async (data: RedeemCoinsData): Promise<RedeemCoinsResponse> => {
      const res = await apiRequest("POST", "/api/wallet/redeem", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to redeem coins");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coins redeemed successfully",
        description: "Your wallet has been updated.",
      });
      // Refresh wallet data and transactions
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to redeem coins",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <WalletContext.Provider
      value={{
        wallet: wallet || null,
        walletSettings: walletSettings || null,
        transactions: transactionsData?.transactions || [],
        isLoadingWallet,
        isLoadingTransactions,
        isLoadingSettings,
        refetchWallet,
        refetchTransactions,
        redeemCoinsMutation,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}