import { Router } from "express";
import {
  allOrder,
  deleteOrder,
  getSingleOrder,
  myOrder,
  newOrder,
  proccessOrder,
} from "../controllers/order.js";
import { isAdmin } from "../middlewares/auth.js";

const app = Router();

// Route - /api/v1/order/new
app.post("/new", newOrder);

// Route - /api/v1/order/my
app.get("/my", myOrder);

// Route - /api/v1/order/all
app.get("/all", isAdmin, allOrder);

// Route - /api/v1/order/dynamicID
app
  .route("/:id")
  .get(getSingleOrder)
  .put(isAdmin, proccessOrder)
  .delete(isAdmin, deleteOrder);

export default app;
