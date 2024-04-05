
require ("dotenv").config();

const auth = async (req, res, next) => {
    try {
        const creatorID = req.creatorID; 
console.log("crteID",creatorID)
        next(); 
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};


 module.exports = {
    auth
 }