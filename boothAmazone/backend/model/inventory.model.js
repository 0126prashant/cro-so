const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    inventoryData: mongoose.Schema.Types.Mixed
  }, { timestamps: true }); // Adding timestamps for tracking
  
  // Create a model from the schema
  const InventoryItem = mongoose.model('InventoryItem', InventorySchema);
  
  module.exports = InventoryItem;