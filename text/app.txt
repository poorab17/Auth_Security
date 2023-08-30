require('dotenv').config();
const express = require("express");
const bodyParser= require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const { error } = require("console");
const uri = "mongodb://0.0.0.0:27017/";



const app = express();
 app.use(express.static("public"));
 app.set('view engine','ejs');
 app.use(bodyParser.urlencoded({
    extended:true
 }));

 mongoose.connect(uri+"userDB");
 const userSchema = new mongoose.Schema({
    email:String,
    password:String,
 })


 userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});

 const User = new mongoose.model("User",userSchema);

 app.post("/register",(req,res)=>{
 const user1 = new User({
email: req.body.username,
password : req.body.password,
});

user1.save()
res.render("secrets");

})

 app.post("/login",(req,res)=>{
 
 const username= req.body.username;
const password =req.body.password;

User.findOne({email:username}).then((results)=>{
if(results){
    if(results.password===password){
     res.render("secrets");
    }
}
})

})

 app.get("/",(req,res)=>{
res.render("home");
 })

 app.get("/login",(req,res)=>{
res.render("login.ejs");
 })

 app.get("/register",(req,res)=>{
res.render("register.ejs");
 })


 app.listen(3000,()=>{
    console.log("runnning on port 3000");
 })

