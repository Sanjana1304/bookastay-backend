const express = require("express");
const userSchemaModel = require("../schema/userSchemaCode");
bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRouter = express.Router();

authRouter.post('/login',async(req,res)=>{
    const {userId,password} = req.body;
    try {
        const user = await userSchemaModel.findOne({userId});
        if (!user) {
            return res.status(400).json({message: "Invalid Credentials"})
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if (!isMatch) {
            return res.status(400).json({message: "Invalid Password"})
        }
        const token = jwt.sign(
            {userIdd:user.id},
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1d",
            }
        );
        res.cookie("auth_token",token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            maxAge: 86400000,
        });

        res.status(200).json({
            message: 'Sign in successful',
            token,
            user:{
                userIdd:user._id,
                userId: user.userId,
                name: user.name,
                email:user.email,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({"message": "Something went wrong"})
    }
})

// authRouter.get("/validate-token",verifyToken,(req,res)=>{
//     res.status(200).send({userIdd:req.userIdd})
// })


authRouter.post('/logout', (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = authRouter;



module.exports = authRouter;

