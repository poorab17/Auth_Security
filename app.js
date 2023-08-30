require('dotenv').config();
const express = require("express");
const bodyParser= require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const session =require("express-session");
const passport =require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { error } = require("console");
const uri = "mongodb://0.0.0.0:27017/";



const app = express();
 app.use(express.static("public"));
 app.set('view engine','ejs');
 app.use(bodyParser.urlencoded({
    extended:true
 }));

 app.use(session({
   secret:"our little secret",
   resave:false,
   saveUninitialized:false,
 }))

 app.use(passport.initialize());
 app.use(passport.session());

 mongoose.connect(uri+"userDB");

 const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String,
 })


 userSchema.plugin(passportLocalMongoose);
 userSchema.plugin(findOrCreate);

 const User = new mongoose.model("User",userSchema);
 passport.use(User.createStrategy());

//  passport.serializeUser(User.serializeUser());
//  passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user,done){
   done(null,user.id);
})

passport.deserializeUser(function(id, done) {
   User.findById(id)
       .then(user => done(null, user))
       .catch(err => done(err, null));
});



 passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

 
 app.get("/secrets",(req,res)=>{
   User.find({"secret":{$ne:null}}).then((foundUser,err)=>{
if(foundUser){
   res.render("secrets",{usersWithSecrets:foundUser})
}else
if(err){
    console.log(err);
}
   })
 })

  app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
      res.render("submit");
   }else{
      res.redirect("/login");
   }
 })

 app.post("/submit",(req,res)=>{
  const submittedSecret =req.body.secret;
User.findById(req.user.id)
       .then((foundUser)=>{
         if(foundUser){
            foundUser.secret=submittedSecret;
            foundUser.save().then(()=>{
               res.redirect("/secrets")
            })
         
         }
       })
       .catch(err => console.log(err));

 })

 app.post("/register",(req,res)=>{

   User.register({username: req.body.username},req.body.password,function(err,user){
      if(err){
         console.log(err);
         res.redirect("/register");

      }else{
         passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
         })
      }
   })

})

 app.post("/login",(req,res)=>{
 
   const user = new User({
  username: req.body.username,
  password :req.body.password,
   });
   req.login(user,function(err){
       if(err){
         console.log(err);

      }else{
         passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
         })
      }

   })


})

 app.get("/",(req,res)=>{
res.render("home");
 })

 app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect .
    res.redirect('/secrets');
  });


 app.get("/login",(req,res)=>{
res.render("login.ejs");
 })

 app.get("/register",(req,res)=>{
res.render("register.ejs");
 })

 

  app.get("/logout",(req,res)=>{
   req.logOut(()=>{});
   res.render("home");
 })



 app.listen(3000,()=>{
    console.log("runnning on port 3000");
 })

