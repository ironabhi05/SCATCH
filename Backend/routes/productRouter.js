const express = require("express");
const router = express.Router();
const upload = require("../config/multer-Config");
const productModel = require("../models/product-model");
const isAdminLoggedIn = require("../middleware/isAdminLoggedIn");

router.post(
  "/create",
  isAdminLoggedIn,
  upload.single("image"),
  async (req, res) => {
    try {
      let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
      let product = await productModel.create({
        image: req.file.buffer,
        name,
        price,
        discount,
        bgcolor,
        panelcolor,
        textcolor,
      });
      let success = req.flash("success", "Product added");
      return res.redirect("/products/create");
    } catch (err) {
      return res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/create", isAdminLoggedIn, (req, res) => {
  let success = req.flash("success");
  res.render("createproducts", {
    success,
    loggedin: req.session.loggedin || false,
  });
});

module.exports = router;
