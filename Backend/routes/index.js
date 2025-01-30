const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/isLoggedIn');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const orderModel = require('../models/order-model');

router.get('/', (req, res) => {
    let error = req.flash("error");
    const { adminLoggedin = false, loggedin = false } = req.session;
    return res.render("index", { error, adminLoggedin, loggedin });
});

router.get('/addtocart/:productid', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push(req.params.productid);
    await user.save();
    req.flash("success", "Item added to cart");
    return res.redirect('/shop');
});

router.get('/cart', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("cart");
    let product = await productModel.findOne();
    return res.render('cart', { user, product });
});

router.get('/shop', isLoggedIn, async (req, res) => {
    let products = await productModel.find();
    let success = req.flash("successs");
    return res.render("shop", { products, success });
});

router.post('/product/:id', (req, res) => {
    res.send("product");
});

router.post('/order-place', isLoggedIn, async (req, res) => {
    try {
        // Convert ObjectId values in the cart to strings
        const productIds = req.user.cart.map(id => id.toString());

        // Fetch the user with a populated cart
        const user = await userModel.findOne({ email: req.user.email }).populate('cart');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Filter the cart to include only selected products
        const selectedProducts = user.cart.filter(product =>
            productIds.includes(product._id.toString())  // Corrected condition
        );

        if (selectedProducts.length === 0) {
            return res.status(400).json({ message: 'No valid products selected' });
        }

        // Calculate total amount for selected products
        const totalAmount = selectedProducts.reduce((sum, product) => sum + product.price, 0);

        // Create order items for the selected products
        const orderItems = selectedProducts.map(product => ({
            product: product._id,
            quantity: 1, // Assuming each product has a quantity of 1
            price: product.price
        }));

        // Create the order
        const order = new orderModel({
            user: user._id,
            items: orderItems,
            totalAmount: totalAmount
        });

        await order.save();

        // Remove selected products from the user's cart
        user.cart = user.cart.filter(product => !productIds.includes(product._id.toString()));

        await user.save();

        return res.redirect('/cart');
    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;