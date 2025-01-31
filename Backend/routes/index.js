const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/isLoggedIn');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');
const orderModel = require('../models/order-model');

//User Create and Login Page
router.get('/', (req, res) => {
    try {
        let error = req.flash("error");
        const { loggedin = false } = req.session;
        return res.render("index", { error, loggedin });
    }
    catch {
        return res.status(500).send('Hmmm! Something went wrong....');
    }
});

//User Home Screen for shopping
router.get('/shop', isLoggedIn, async (req, res) => {
    try {
        let products = await productModel.find();
        let success = req.flash("success");
        let error = req.flash("error");
        return res.render("shop", { products, success, error });
    }
    catch {
        return res.status(500).send('Hmmm! Something went wrong....');
    }
});

//Add items to cart Page
router.get('/addtocart/:productid', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email });
        user.cart.push(req.params.productid);
        await user.save();
        req.flash("success", "Item Added To Your Cart");
        return res.redirect('/shop');
    }
    catch {
        req.flash("error", "Hmmm! Something went wrong....");
        return res.redirect('/shop');
    }
});

router.get('/cart', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email }).populate("cart");
        let product = await productModel.findById();
        return res.render('cart', { user, product });
    }
    catch {
        return res.status(500).send('Hmmm! Something went wrong....');
    }
});

//Pending Order Place System

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
        req.flash("success", "Order Placed")
        return res.redirect('/shop');
    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;