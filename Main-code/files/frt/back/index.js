const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const { connection } = require('./db');
const app = express();
const port = 8080;
const path = require("path")
require('dotenv').config();
const session = require("express-session")
const passport = require("passport");
const userdb = require('./model/userSchema');
const InventoryItem = require('./model/inventory.model');
const Oauth2Statergy = require("passport-google-oauth2").Strategy;

app.use(cors({
  origin:`${process.env.frontendURL}/`,
  methods:"GET,POST,PUT,DELETE",
  credentials:true
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("/*",(req,res)=>{
  res.sendFile(
      path.join(__dirname,"../frontend/build/index.html"),
      function(err){

          if(err){
              res.status(500).send(err)
          }
      }
  )

})

const clientId = process.env.Google_Client_ID
const clientSecret = process.env.Google_Client_secret;
const redirectUri = process.env.REDIRECT_URI;


let accessToken = '';
let sellerId = '';
let marketplaceIds = '';


app.use(session({
  secret:"fw230126",
  resave:false,
  saveUninitialized:true
})) 
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new Oauth2Statergy({
    clientID : clientId,
    clientSecret : clientSecret,
    callbackURL : "/auth/google/callback",
    scope:["profile","email"]

  },
  async(accessToken,refreshToken,profile,done)=>{
    try {
      let user = await userdb.findOne({googleId:profile.id});
      if(!user){
         user = new userdb({
          googleId:profile.id,
          displayName:profile.displayName,
          email:profile.emails[0].value,
          image:profile.photos[0].value
         })
         await user.save()
      }
      return done(null,user)
    } catch (error) {
      return done(error,null)
    }
  }
  )
)

passport.serializeUser((user,done)=>{
  done(null,user)
})
passport.deserializeUser((user,done)=>{
  done(null,user)
})

// initial ggoolr auth login
app.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}))
app.post('/saveConfig', (req, res) => {
  sellerId = req.body.sellerId;
  marketplaceIds = req.body.marketplaceIds;
  res.sendStatus(200);
});

app.get("/auth/google/callback",passport.authenticate("google",{
  successRedirect:`${process.env.frontendURL}/`,
  failureRedirect:`${process.env.frontendURL}/login`
}))


app.get('/inventory', (req, res) => {
  axios.get('https://sellingpartnerapi-na.amazon.com/fba/inventory/v1/summaries', {
    params: {
      MarketplaceId: marketplaceIds,
      SellerId: sellerId,
      QueryType: 'ALL',
    },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
    }
  })
    .then(async response => {
      const inventoryData = response.data;
      const inventoryItem = new InventoryItem({ inventoryData });
      await inventoryItem.save();

      console.log('Inventory data has been saved to MongoDB');
      fs.writeFile('inventory.json', JSON.stringify(inventoryData, null, 2), (err) => {
        if (err) {
          console.error('Error writing inventory data to file:', err);
          res.status(500).send('Error writing inventory data to file');
        } else {
          console.log('Inventory data has been written to inventory.json');
          res.send('Inventory data has been collected and saved to file.');
        }
      });
    })
    .catch(error => {
      console.error('Error accessing inventory:', error);
      res.status(500).send('Error accessing inventory');
    });
});

const PORT = 8080;
app.listen(PORT,async()=>{
 
    try {
        await connection;
        console.log(`Server is running at Port ${PORT} and also connected to DataBase`)
    } catch (error) {
        console.log(error.message)
    }
})




