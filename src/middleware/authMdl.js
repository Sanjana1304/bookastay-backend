//this middleware is there to verify token and prevent unauthorized users from accessing the app
const jwt = require("jsonwebtoken");

const verifyToken = (req,res,next)=>{
    const token = req.cookies["auth_token"];
    if (!token) {
        return res.status(401).json({message:"Unauthorized access"});
    }
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
        req.userIdd = (decoded).userIdd;
        next();
    } catch (error) {
        return res.status(401).json({message:"unauthorized"});
    }
}

module.exports = verifyToken;