import express from "express";
import NodeCache from "node-cache";
import Stripe from "stripe";
import cors from "cors";
//Importing Routes
import userRoutes from "./routes/user.js";
import productRoutes from "./routes/products.js";
import ordersRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import dashboardRoutes from "./routes/stats.js";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 4000;

//Database Connection  String
const uri = process.env.MONGODB_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";
connectDB(uri);

export const stripe = new Stripe(stripeKey);

export const cache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/", (req, res) => {
  res.send("working api");
});

//Using Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", ordersRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`server is working on http://localhost:${port}`);
});
