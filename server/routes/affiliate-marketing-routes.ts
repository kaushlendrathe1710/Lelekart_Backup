import { Router } from "express";
import {
  getAllAffiliates,
  createAffiliate,
  updateAffiliate,
  deleteAffiliate,
} from "../handlers/affiliate-marketing-handlers";

const router = Router();

router.get("/api/admin/affiliates", getAllAffiliates);
router.post("/api/admin/affiliates", createAffiliate);
router.put("/api/admin/affiliates/:id", updateAffiliate);
router.delete("/api/admin/affiliates/:id", deleteAffiliate);

export default router;
