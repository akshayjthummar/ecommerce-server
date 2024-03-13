import { Router } from "express";
import {
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  getAllCoupon,
  newCoupon,
} from "../controllers/payment.js";
import { isAdmin } from "../middlewares/auth.js";

const app = Router();

// Route - /api/v1/payment/create
app.post("/create", createPaymentIntent);

// Route - /api/v1/payment/discount
app.get("/discount", applyDiscount);

// Route - /api/v1/payment/coupon/new
app.post("/coupon/new", isAdmin, newCoupon);

// Route - /api/v1/payment/coupon/all
app.get("/coupon/all", isAdmin, getAllCoupon);

// Route - /api/v1/payment/coupon/:id
app.delete("/coupon/:id", isAdmin, deleteCoupon);

export default app;
