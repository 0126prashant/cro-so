const mongoose = require('mongoose');

const screenShotschema = new mongoose.Schema(
  { 
    email : {type:String, required:true},
    creatorId : {type : mongoose.Schema.Types.ObjectId,ref:"users"}
    
  },
  {
    versionKey: false
  }
);

const DataModel = mongoose.model('data', screenShotschema);

module.exports = { DataModel };