import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import { cache } from "../app.js";
import ErrorHandler from "../utils/utility-class.js";

export const myOrder = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;

  let orders = [];

  const key = `my-order-${user}`;
  if (cache.has(key)) orders = JSON.parse(cache.get(key) as string);
  else {
    orders = await Order.find({ user });
    cache.set(key, JSON.stringify(orders));
  }

  res.status(200).json({
    success: true,
    orders,
  });
});

export const allOrder = TryCatch(async (req, res, next) => {
  let orders = [];

  const key = `all-orders`;
  if (cache.has(key)) orders = JSON.parse(cache.get(key) as string);
  else {
    orders = await Order.find().populate("user", "name");
    cache.set(key, JSON.stringify(orders));
  }

  res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `order-${id}`;
  let order;
  if (cache.has(key)) order = JSON.parse(cache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name");
    if (!order) return next(new ErrorHandler("Order not found", 404));
    cache.set(key, JSON.stringify(order));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;
    await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });
    await reduceStock(orderItems);
    invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: orderItems.map((i) => String(i.productId)),
    });

    res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);

export const proccessOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  switch (order.status) {
    case "Proccessing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;

    default:
      order.status = "Delivered";
      break;
  }

  await order.save();
  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  await order.deleteOne();
  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
