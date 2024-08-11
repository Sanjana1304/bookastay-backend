const express = require("express");
const jwt = require("jsonwebtoken");
const userSchemaModel = require("../schema/userSchemaCode");
const verifyToken = require("../middleware/authMdl");

const userRouter = express.Router();

userRouter.post('/register',async(req,res)=>{
    try {
        const user = await userSchemaModel.findOne({userId:req.body.userId});
        if (user) {
            return res.status(400).json({message: "User already exists"})
        }
        const newuserBody = req.body;
        const newUser = new userSchemaModel(newuserBody);

        const savedUser = await newUser.save();
        const token = jwt.sign(
            {userIdd:newUser.id},
            process.env.JWT_SECRET_KEY,{
                expiresIn:"1d"
            }
        );

        res.cookie("auth_token",token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            maxAge: 86400000,
        })

        res.sendStatus(200);
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error);
    }
})

userRouter.get('/getMe',verifyToken,async(req,res)=>{
    try {
        const useridd = req.userIdd;
        const record = await userSchemaModel.findById(useridd).select("-password");

        if (!record) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).json(record);
    } catch (error) {
        res.status(500).send(error);
    }
})

userRouter.put('/editMe',verifyToken,async(req,res)=>{
    try {
        const useridd = req.userIdd;
        const newRecBody = req.body;
        const updRec = await userSchemaModel.findByIdAndUpdate(
            useridd,
            newRecBody,
            {new:true}
        );

        if (!updRec) return res.status(404).send();

        res.status(200).json(updRec);
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = userRouter;