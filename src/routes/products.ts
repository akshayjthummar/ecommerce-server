import { Router } from "express";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProduct,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";
import { isAdmin } from "../middlewares/auth.js";

const app = Router();

// to create new product - /api/v1/product/new
app.post("/new", isAdmin, singleUpload, newProduct);

// to get latest 5 product - /api/v1/product/latest
app.get("/latest", getLatestProduct);

// to get all products with filter - /api/v1/product/all
app.get("/all", getAllProducts);

// to get all unique categories - /api/v1/product/categories
app.get("/categories", getAllCategories);

// to get admin products - /api/v1/product/admin-products
app.get("/admin-products", isAdmin, getAdminProducts);

// to get update & delete product
app
  .route("/:id")
  .get(getSingleProduct)
  .put(isAdmin, singleUpload, updateProduct)
  .delete(isAdmin, deleteProduct);

export default app;
