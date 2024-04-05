const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  url: { type: String, required: true },
  key: { type: String, required: true }  
});

const websiteInfoSchema = new Schema({
  email: { type: String, required: true },
  websiteName: { type: String, required: true },
  creatorID: { type: String, required: true },
  mobile: [imageSchema],
  desktop: [imageSchema] 
});

const WebsiteInfo = mongoose.model('WebsiteInfo', websiteInfoSchema);

module.exports = {WebsiteInfo};
