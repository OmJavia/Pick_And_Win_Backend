const express=require("express");
const Razorpay = require('razorpay');
const { checkout, key, paymentVerification } = require("../controllers/payment.controller");

const route=express.Router();
const{addProducts,getProducts, deleteProduct, updateProduct, orderplace, getProductsbyid, myorder, updateProductbyid}=require("../controllers/products.controller")
const{signup,login, getallUsers, deleteUserById}=require("../controllers/auth.controller")
const verifyToken=require("../config/jwt")
const schema= require("../validate/auth.schema")
const upload=require("../utils/upload") 

// User's route
route.post("/login",schema.login, login)
route.post("/signup",signup)
route.get("/users",getallUsers)
route.post("/deleteuserbyid/:id",deleteUserById)
route.post("/checkout", verifyToken, checkout)
route.post("/paymentVerification", paymentVerification)
route.get("/getkey",key)


// Products's Route
route.post("/addproducts",upload('image'),addProducts)
route.get("/getproducts",getProducts)
route.get("/getproductsbyid/:id",getProductsbyid);
route.post("/deleteproducts/:id",deleteProduct)
route.post("/updateproducts",updateProduct)
route.post("/buyticket",verifyToken,orderplace)
route.get("/myorder",verifyToken,myorder)


route.put("/updateproduct/:id",upload('image'),updateProductbyid)


module.exports=route