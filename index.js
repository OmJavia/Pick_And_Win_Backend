const express=require("express");
const app=express();
const port=450;
var bodyParser = require('body-parser')
const route=require("./routes/route")
const cors = require('cors');
const path=require("path")
const Razorpay = require('razorpay')

app.use(cors({}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname,'public')))

app.use("/",route)

app.listen(port,()=>{
    console.log("sever started on",port)
})