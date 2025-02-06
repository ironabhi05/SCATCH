const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const app = express();
const PORT = 7070;
const dbgr = require("debug")("development: Server");
const mongoDB = require("./config/mongoose-connection");
const ownerRouter = require("./routes/ownerRouter");
const productRouter = require("./routes/productRouter");
const userRouter = require("./routes/userRouter");
const indexRouter = require("./routes/index");
const flash = require("connect-flash");
const expressSession = require("express-session");
const methodOverride = require("method-override");
require("dotenv").config();

app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 3600000,
    },
  })
);
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.use("/owners", ownerRouter);
app.use("/users", userRouter);
app.use("/products", productRouter);
app.use("/", indexRouter);

console.log(process.env.NODE_ENV);
app.listen(PORT, () => {
  dbgr(`🌐Server is running on Port ${PORT}📡🚀🚀🚀`);
});
