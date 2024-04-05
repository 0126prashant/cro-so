const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    websiteName : {type:String, required:true},
    userEmail : {type:String, required:true},
    inputUrl : {type:String, required:true},
  },
  {
    versionKey: false
  }
);

const UserModel = mongoose.model('user', userSchema);

module.exports = { UserModel };