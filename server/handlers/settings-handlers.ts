import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertSellerSetting } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import { getShiprocketToken } from "./shiprocket-handlers";

// Pickup address handler - for invoices and shipping
export async function updatePickupAddressHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    const { pickupAddress } = req.body;

    if (!pickupAddress) {
      return res.status(400).json({ error: "Pickup address is required" });
    }

    // Update the seller settings
    const settings = await storage.getSellerSettings(sellerId);

    // Disallow editing if a pickup already exists; require support
    if (settings?.pickupAddress) {
      return res.status(403).json({
        error: "Pickup address locked",
        message:
          "Pickup address can only be added once. Please contact support to edit this information.",
        code: "PICKUP_EDIT_LOCKED",
      });
    }

    if (!settings) {
      // Create new settings with pickup address
      await storage.createSellerSettings({
        sellerId,
        pickupAddress:
          typeof pickupAddress === "string"
            ? pickupAddress
            : JSON.stringify(pickupAddress),
      });
    } else {
      // First-time creation allowed only
      await storage.updateSellerSettings(sellerId, {
        pickupAddress:
          typeof pickupAddress === "string"
            ? pickupAddress
            : JSON.stringify(pickupAddress),
      });
    }

    // After saving locally, attempt to register/update pickup in Shiprocket
    let shiprocketAddPickup: any = { attempted: false };
    try {
      const token = await getShiprocketToken();
      if (!token) {
        console.warn("[Shiprocket] Token unavailable, skipping addpickup");
        shiprocketAddPickup = {
          attempted: false,
          success: false,
          message: "Shiprocket token unavailable",
        };
      } else {
        shiprocketAddPickup.attempted = true;
        // Normalize input which may have different keys from UI
        const raw =
          typeof pickupAddress === "string"
            ? JSON.parse(pickupAddress)
            : pickupAddress;
        const nickname =
          raw?.pickup_location ||
          raw?.businessName ||
          raw?.contactName ||
          raw?.name;
        const shipperName = raw?.name || raw?.contactName || raw?.businessName;
        const email =
          raw?.email || raw?.contactEmail || (req.user as any)?.email || "";
        const phone = raw?.phone || raw?.contactPhone || "";
        const line1 =
          raw?.address || raw?.line1 || raw?.address1 || raw?.address_1 || "";
        const line2 = raw?.address_2 || raw?.line2 || raw?.address2 || "";
        const city = raw?.city || "";
        const state = raw?.state || "";
        const country = raw?.country || "India";
        const pin =
          raw?.pin_code ||
          raw?.pincode ||
          raw?.pinCode ||
          raw?.zip ||
          raw?.zipcode ||
          "";
        const address_type =
          raw?.address_type || (raw?.vendor_name ? "vendor" : undefined);
        const vendor_name = raw?.vendor_name;
        const gstin = raw?.gstin || raw?.gst || "";

        const payload: any = {
          pickup_location:
            nickname?.toString().slice(0, 36) || `Seller-${sellerId}`,
          name: shipperName || `Seller ${sellerId}`,
          email,
          phone,
          address: line1?.toString().slice(0, 80),
          address_2: line2 || "",
          city,
          state,
          country,
          pin_code: pin,
        };
        if (address_type) payload.address_type = address_type;
        if (vendor_name) payload.vendor_name = vendor_name;
        if (gstin) payload.gstin = gstin;

        console.log("[Shiprocket] addpickup request", {
          pickup_location: payload.pickup_location,
          pin_code: payload.pin_code,
          city: payload.city,
          state: payload.state,
        });

        const apiResp = await axios.post(
          "https://apiv2.shiprocket.in/v1/external/settings/company/addpickup",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("[Shiprocket] addpickup success", {
          pickup_location: payload.pickup_location,
        });
        shiprocketAddPickup = {
          attempted: true,
          success: true,
          message: "Pickup location registered/updated",
          data: apiResp?.data,
          pickup_location: payload.pickup_location,
        };
      }
    } catch (e: any) {
      console.error(
        "[Shiprocket] addpickup failed",
        e?.response?.data || e?.message || e
      );
      // Do not fail the seller save because of Shiprocket API
      shiprocketAddPickup = {
        attempted: true,
        success: false,
        message: e?.response?.data?.message || e?.message || "Addpickup failed",
        details: e?.response?.data,
      };
    }

    return res
      .status(200)
      .json({ success: true, shiprocket: shiprocketAddPickup });
  } catch (error) {
    console.error("Error updating pickup address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get settings for a seller
export async function getSellerSettingsHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== "admin" && req.user?.id !== sellerId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to view these settings" });
    }

    const settings = await storage.getSellerSettings(sellerId);

    if (!settings) {
      // If no settings exist yet, return default settings
      return res.status(200).json({
        sellerId,
        notificationPreferences: JSON.stringify({
          email: true,
          sms: false,
          push: true,
          orderNotifications: true,
          paymentNotifications: true,
          promotionNotifications: false,
        }),
        returnPolicy: "Standard 7-day return policy",
        autoAcceptOrders: false,
        holidayMode: false,
      });
    }

    return res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching seller settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create or update settings for a seller
export async function updateSellerSettingsHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== "admin" && req.user?.id !== sellerId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update these settings" });
    }

    const settingsSchema = z.object({
      notificationPreferences: z.string().optional(),
      taxInformation: z.string().optional(),
      returnPolicy: z.string().optional(),
      store: z.string().optional(),
      personalInfo: z.string().optional(),
      address: z.string().optional(),
      autoAcceptOrders: z.boolean().optional(),
      holidayMode: z.boolean().optional(),
      holidayModeEndDate: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    });

    const validatedData = settingsSchema.parse(req.body);

    const updatedSettings = await storage.createOrUpdateSellerSettings(
      sellerId,
      validatedData as Partial<InsertSellerSetting>
    );

    return res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating seller settings:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Toggle holiday mode
export async function toggleHolidayModeHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not the seller themselves, deny access (even admins shouldn't toggle this)
    if (req.user?.id !== sellerId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to toggle holiday mode" });
    }

    const settings = await storage.getSellerSettings(sellerId);

    const holidayMode = !settings?.holidayMode;
    let holidayModeEndDate = settings?.holidayModeEndDate;

    // If enabling holiday mode and no end date is set, default to 7 days from now
    if (holidayMode && !req.body.holidayModeEndDate && !holidayModeEndDate) {
      holidayModeEndDate = new Date();
      holidayModeEndDate.setDate(holidayModeEndDate.getDate() + 7);
    } else if (req.body.holidayModeEndDate) {
      holidayModeEndDate = new Date(req.body.holidayModeEndDate);
    }

    // If disabling holiday mode, clear the end date
    if (!holidayMode) {
      holidayModeEndDate = undefined;
    }

    const updatedSettings = await storage.createOrUpdateSellerSettings(
      sellerId,
      {
        holidayMode,
        holidayModeEndDate,
      }
    );

    return res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error toggling holiday mode:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update notification preferences
export async function updateNotificationPreferencesHandler(
  req: Request,
  res: Response
) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not the seller themselves, deny access
    if (req.user?.id !== sellerId) {
      return res.status(403).json({
        error: "You do not have permission to update notification preferences",
      });
    }

    const preferencesSchema = z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
      orderNotifications: z.boolean().optional(),
      paymentNotifications: z.boolean().optional(),
      promotionNotifications: z.boolean().optional(),
      returnNotifications: z.boolean().optional(),
    });

    const validatedPreferences = preferencesSchema.parse(req.body);

    // Get current settings
    const currentSettings = await storage.getSellerSettings(sellerId);

    // Parse current preferences or create default if none exist
    let currentPreferences = {};
    if (currentSettings?.notificationPreferences) {
      try {
        currentPreferences = JSON.parse(
          currentSettings.notificationPreferences
        );
      } catch (e) {
        console.error("Error parsing existing notification preferences:", e);
      }
    }

    // Merge with new preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...validatedPreferences,
    };

    // Update settings
    const updatedSettings = await storage.createOrUpdateSellerSettings(
      sellerId,
      {
        notificationPreferences: JSON.stringify(updatedPreferences),
      }
    );

    return res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update personal information
export async function updatePersonalInfoHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not the seller themselves, deny access (even admins shouldn't update this)
    if (req.user?.id !== sellerId) {
      return res.status(403).json({
        error: "You do not have permission to update personal information",
      });
    }

    // Validate the personal info data
    const personalInfoSchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      alternatePhone: z.string().optional(),
    });

    const validatedPersonalInfo = personalInfoSchema.parse(req.body);

    // Get current settings
    const currentSettings = await storage.getSellerSettings(sellerId);

    // Parse current personal info or create default if none exist
    let currentPersonalInfo = {};
    if (currentSettings?.personalInfo) {
      try {
        currentPersonalInfo = JSON.parse(currentSettings.personalInfo);
      } catch (e) {
        console.error("Error parsing existing personal info:", e);
      }
    }

    // Merge with new personal info
    const updatedPersonalInfo = {
      ...currentPersonalInfo,
      ...validatedPersonalInfo,
    };

    // Update settings
    const updatedSettings = await storage.createOrUpdateSellerSettings(
      sellerId,
      {
        personalInfo: JSON.stringify(updatedPersonalInfo),
      }
    );

    return res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating personal information:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update address information
export async function updateAddressHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not the seller themselves, deny access
    if (req.user?.id !== sellerId) {
      return res.status(403).json({
        error: "You do not have permission to update address information",
      });
    }

    // Validate the address data
    const addressSchema = z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
    });

    const validatedAddress = addressSchema.parse(req.body);

    // Get current settings
    const currentSettings = await storage.getSellerSettings(sellerId);

    // Parse current address or create default if none exist
    let currentAddress = {};
    if (currentSettings?.address) {
      try {
        currentAddress = JSON.parse(currentSettings.address);
      } catch (e) {
        console.error("Error parsing existing address:", e);
      }
    }

    // Merge with new address
    const updatedAddress = {
      ...currentAddress,
      ...validatedAddress,
    };

    // Update settings
    const updatedSettings = await storage.createOrUpdateSellerSettings(
      sellerId,
      {
        address: JSON.stringify(updatedAddress),
      }
    );

    return res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating address information:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update store information
export async function updateStoreHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not the seller themselves, deny access
    if (req.user?.id !== sellerId) {
      return res.status(403).json({
        error: "You do not have permission to update store information",
      });
    }

    // Validate the store data
    const storeSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      logo: z.string().optional(),
      banner: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      socialLinks: z
        .object({
          facebook: z.string().optional(),
          instagram: z.string().optional(),
          twitter: z.string().optional(),
          website: z.string().optional(),
        })
        .optional(),
      businessHours: z
        .array(
          z.object({
            day: z.string(),
            open: z.boolean(),
            openTime: z.string().optional(),
            closeTime: z.string().optional(),
          })
        )
        .optional(),
    });

    const validatedStore = storeSchema.parse(req.body);

    // Get current settings
    const currentSettings = await storage.getSellerSettings(sellerId);

    // Parse current store or create default if none exist
    let currentStore = {};
    if (currentSettings?.store) {
      try {
        currentStore = JSON.parse(currentSettings.store);
      } catch (e) {
        console.error("Error parsing existing store:", e);
      }
    }

    // Merge with new store
    const updatedStore = {
      ...currentStore,
      ...validatedStore,
    };

    // Update settings
    const updatedSettings = await storage.createOrUpdateSellerSettings(
      sellerId,
      {
        store: JSON.stringify(updatedStore),
      }
    );

    return res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating store information:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update tax information
export async function updateTaxInfoHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not the seller themselves, deny access
    if (req.user?.id !== sellerId) {
      return res.status(403).json({
        error: "You do not have permission to update tax information",
      });
    }

    const { taxInformation } = req.body;

    if (!taxInformation) {
      return res.status(400).json({ error: "Tax information is required" });
    }

    // Get current settings
    const currentSettings = await storage.getSellerSettings(sellerId);

    // Parse current tax info or create default if none exist
    let currentTaxInfo = {};
    if (currentSettings?.taxInformation) {
      try {
        currentTaxInfo = JSON.parse(currentSettings.taxInformation);
      } catch (e) {
        console.error("Error parsing existing tax info:", e);
      }
    }

    // Parse new tax info
    let newTaxInfo;
    try {
      newTaxInfo =
        typeof taxInformation === "string"
          ? JSON.parse(taxInformation)
          : taxInformation;
    } catch (e) {
      return res.status(400).json({ error: "Invalid tax information format" });
    }

    // Merge with new tax info
    const updatedTaxInfo = {
      ...currentTaxInfo,
      ...newTaxInfo,
    };

    // Update settings
    const updatedSettings = await storage.createOrUpdateSellerSettings(
      sellerId,
      {
        taxInformation: JSON.stringify(updatedTaxInfo),
      }
    );

    return res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating tax information:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
