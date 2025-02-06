const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");

//User Create and Login Page
router.get("/", (req, res) => {
  try {
    let error = req.flash("error");
    const { loggedin = false } = req.session;
    return res.render("index", { error, loggedin });
  } catch {
    return res.status(500).send("Hmmm! Something went wrong....");
  }
});

//User Home Screen for shopping
router.get("/shop", async (req, res) => {
  try {
    const { loggedin = false, isAdminLoggedIn = false } = req.session;
    let products = await productModel.find();
    let success = req.flash("success");
    let error = req.flash("error");
    return res.render("shop", {
      products,
      success,
      error,
      isAdminLoggedIn,
      loggedin,
    });
  } catch {
    return res.status(500).send("Hmmm! Something went wrong....");
  }
});

//Add items to cart Page
router.get("/addtocart/:productid", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push(req.params.productid);
    await user.save();
    req.flash("success", "Item Added To Your Cart");
    return res.redirect("/shop");
  } catch {
    req.flash("error", "Hmmm! Something went wrong....");
    return res.redirect("/shop");
  }
});

router.get("/cart", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel
      .findOne({ email: req.user.email })
      .populate("cart");
    let product = await productModel.findById();
    return res.render("cart", { user, product });
  } catch {
    return res.status(500).send("Hmmm! Something went wrong....");
  }
});

//Place Order
router.post("/order-place", isLoggedIn, async (req, res) => {
  try {
    // User fetch with populated cart
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("cart");

    if (!user || user.cart.length === 0) {
      return res
        .status(400)
        .json({ message: "No products in cart to place an order" });
    }

    // Find existing order for the user
    let order = await orderModel.findOne({ user: user._id });

    // Prepare cart items
    const newItems = user.cart.map((product) => ({
      product: product._id,
      quantity: 1,
      price: product.price,
    }));

    if (order) {
      // User's order exists, push cart products into existing order's items
      order.items.push(...newItems);

      // Update total amount
      order.totalAmount += newItems.reduce((sum, item) => sum + item.price, 0);

      await order.save();
    } else {
      // No order exists, create a new one
      order = new orderModel({
        user: user._id,
        items: newItems,
        totalAmount: newItems.reduce((sum, item) => sum + item.price, 0),
      });

      await order.save();
    }

    // Empty user cart after order placement
    user.cart = [];
    await user.save();

    req.flash("success", "Order Placed Successfully!");
    return res.redirect("/shop");
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
