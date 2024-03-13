import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  SearchRequestQuery,
  newProductRequestBody,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { cache } from "../app.js";
import { invalidateCache } from "../utils/features.js";
//import { faker } from "@faker-js/faker";

// Revalidate on New,Update,Delete Product and New Order
export const getLatestProduct = TryCatch(async (req, res, next) => {
  let products;
  if (cache.has("latest-products")) {
    products = JSON.parse(cache.get("latest-products") as string);
  } else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    cache.set("latest-products", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

// Revalidate on New,Update,Delete Product and New Order
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
  if (cache.has("categories")) {
    categories = JSON.parse(cache.get("categories") as string);
  } else {
    categories = await Product.distinct("category");
    cache.set("categories", JSON.stringify(categories));
  }

  return res.status(200).json({
    success: true,
    categories,
  });
});

// Revalidate on New,Update,Delete Product and New Order
export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;
  if (cache.has("all-products")) {
    products = JSON.parse(cache.get("all-products") as string);
  } else {
    products = await Product.find({});
    cache.set("all-products", JSON.stringify(products));
  }
  return res.status(200).json({
    success: true,
    products,
  });
});

// Revalidate on New,Update,Delete Product and New Order
export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;
  if (cache.has(`product-${id}`)) {
    product = JSON.parse(cache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product not found.", 404));
    cache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(200).json({
    success: true,
    product,
  });
});
export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, newProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo) return next(new ErrorHandler("Please enter photo", 400));
    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("Photo deleted");
      });
      return next(new ErrorHandler("please enter all fields", 400));
    }
    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo?.path,
    });
    invalidateCache({ product: true, admin: true });
    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
    });
  }
);
export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const photo = req.file;
  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product not found.", 404));

  if (photo) {
    rm(product.photo, () => {
      console.log("old photo deleted");
    });
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;

  await product.save();
  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product updated successfully.",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler("Product not found.", 404));

  rm(product.photo!, () => {
    console.log("product photo deleted");
  });
  await product.deleteOne();
  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "product deleted",
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, price, category } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};
    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };
    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProduct] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    console.log(filteredOnlyProduct.length / limit);

    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

// const randomProductGenerate = async (count: number) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       category: faker.commerce.department(),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       photo: "uploads/24efddea-e123-4217-a580-1f1a34a85f17.jpg",
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//     };

//     products.push(product);
//   }
//   await Product.create(products);
// };
// randomProductGenerate(40);
// const deleteRandomsProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ succecss: true });
// };
// deleteRandomsProducts();
