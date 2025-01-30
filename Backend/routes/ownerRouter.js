const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model')
const bcrypt = require('bcrypt');
const { createOwner, adminLogin } = require('../controllers/authController');
const userModel = require('../models/user-model');
const isAdminLoggedIn = require('../middleware/isAdminLoggedIn');
const productModel = require('../models/product-model');
const orderModel = require('../models/order-model');

if (process.env.NODE_ENV === "development") {
    router.post('/create', createOwner);
}

router.post('/admin/login', adminLogin);

router.get('/admin/logout', isAdminLoggedIn, (req, res) => {
    res.clearCookie('token', "");
    res.redirect('/owners/admin/login')
});

router.get('/admin/login', (req, res) => {
    let error = req.flash("error")
    const { adminLoggedin = false, loggedin = false } = req.session;
    res.render('adminLogin', { error, adminLoggedin, loggedin })
});

router.get('/admin/panel', isAdminLoggedIn, async (req, res) => {
    let products = await productModel.find();
    let users = await userModel.find();
    let orders = await orderModel.find();
    const { adminLoggedin = false, loggedin = false } = req.session;
    res.render('adminPanel', { users, products, orders, adminLoggedin, loggedin });
});

//pending
router.get('/admin/users', isAdminLoggedIn, async (req, res) => {
    let users = await userModel.find();
    const { adminLoggedin = false, loggedin = false } = req.session;
    res.render('showUsers', { users, adminLoggedin, loggedin });
});


module.exports = router;



