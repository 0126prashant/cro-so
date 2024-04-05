const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
    name: String,
    pdfData: Buffer,
    contentType: String,
    creatorID : String
});

const Pdf = mongoose.model('Pdf', pdfSchema);
module.exports = { Pdf };
