import { Request, Response } from "express";
import { storage } from "../storage";

// Get all seller withdrawal requests with seller details
export async function getSellerWithdrawalsHandler(req: Request, res: Response) {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get all pending withdrawal requests (negative amounts)
    const withdrawals = await storage.getSellerWithdrawalsForAdmin();

    // For each withdrawal, get seller details and settings
    const withdrawalsWithDetails = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        try {
          // Get seller basic info
          const seller = await storage.getUserById(withdrawal.sellerId);

          // Get seller settings for bank details
          const sellerSettings = await storage.getSellerSettings(
            withdrawal.sellerId
          );

          return {
            ...withdrawal,
            seller: seller
              ? {
                  id: seller.id,
                  name: seller.name,
                  email: seller.email,
                  phone: seller.phone,
                }
              : null,
            sellerSettings: sellerSettings
              ? {
                  taxInformation: sellerSettings.taxInformation,
                  personalInfo: sellerSettings.personalInfo,
                  address: sellerSettings.address,
                }
              : null,
          };
        } catch (error) {
          console.error(
            `Error fetching details for withdrawal ${withdrawal.id}:`,
            error
          );
          return {
            ...withdrawal,
            seller: null,
            sellerSettings: null,
          };
        }
      })
    );

    return res.json(withdrawalsWithDetails);
  } catch (error) {
    console.error("Error fetching seller withdrawals:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update withdrawal status
export async function updateWithdrawalStatusHandler(
  req: Request,
  res: Response
) {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { status, referenceId, notes } = req.body;

    // Validate status
    const validStatuses = ["pending", "processing", "completed", "failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get the withdrawal request
    const withdrawal = await storage.getSellerPaymentById(parseInt(id));
    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    // Update the withdrawal status
    const updatedWithdrawal = await storage.updateSellerPayment(parseInt(id), {
      status,
      referenceId: referenceId || null,
      notes: notes || withdrawal.notes,
      paymentDate: status === "completed" ? new Date() : null,
      updatedAt: new Date(),
    });

    return res.json({
      message: "Withdrawal status updated successfully",
      withdrawal: updatedWithdrawal,
    });
  } catch (error) {
    console.error("Error updating withdrawal status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
