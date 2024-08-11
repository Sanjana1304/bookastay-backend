const express = require("express");
const hotelSchemaModel = require("../schema/hotelSchemaCode");
const multer = require("multer");
const cloudinary = require('cloudinary');
const verifyToken = require("../middleware/authMdl");

const hotelRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage:storage,
    limits:{
        fileSize: 5 * 1024 * 1024 //5mb
    }
})

const uploadImageToCloudinary = async (dataURI) => {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const res = await cloudinary.uploader.upload(dataURI, {
                timeout: 120000 // 120 seconds timeout
            });
            return res.url;
        } catch (error) {
            console.error(`Error uploading to Cloudinary (attempt ${attempt + 1}):`, error);
            if (attempt >= maxRetries - 1) {
                throw error;
            }
            attempt++;
        }
    }
};

hotelRouter.post('/',verifyToken,upload.array("imageFiles",6),async(req,res) => {
    try {
        const imageFiles = req.files;
        const hotel = await hotelSchemaModel.findOne({userId:req.body.userId});
        if (hotel) {
            return res.status(400).json({message: "Hotel already exists"})
        }
        const newHotelBody = req.body;
        const newHotel = new hotelSchemaModel(newHotelBody);

        //1. upload imgs to cloudinry
        const uploadPromises = imageFiles.map(async(image)=>{
            const b64 = Buffer.from(image.buffer).toString("base64");
            let dataURI = "data:"+image.mimetype+";base64,"+b64;

            console.log('Uploading image:', image.originalname, image.size);
            //using cloudinary sdk to upload the img
            // const res = await cloudinary.v2.uploader.upload(dataURI,{
            //     timeout: 60000
            // });

            // return res.url;

            return await uploadImageToCloudinary(dataURI);
        });

        //2. if upload is successfull, add the urls to the new hotel
        const imageUrls = await Promise.all(uploadPromises);
        newHotel.imageUrls = imageUrls;
        newHotel.lastUpdated = new Date();

        //save the new hotel in our db
        const savedHotel = await newHotel.save();
        console.log("Upload success")
        res.status(200).send(savedHotel);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

//to get a owner's hotel based on user id (this is used on owner's page)
hotelRouter.get('/:id',async(req,res) => {
    try {
        const userId = req.params.id;
        const hotelDeets = await hotelSchemaModel.findOne({userId:userId});

        if (!hotelDeets) {
            return res.status(400).send({ message: "The user still hasn't added his hotel details" });
        }

        res.status(200).json(hotelDeets);
    } catch (error) {
        res.status(500).send(error);
    }
})

//to get a hotel based on _id
hotelRouter.get('/hotel/:id',async(req,res)=>{
    try {
        const id = req.params.id;
        const hotelDeets = await hotelSchemaModel.findOne({_id:id});

        if (!hotelDeets) {
            return res.status(400).send({ message: "The user still hasn't added his hotel details" });
        }

        res.status(200).json(hotelDeets);
    } catch (error) {
        res.status(500).send(error);
    }
})

hotelRouter.put('/:id',async(req,res)=> {
    const hotelId = req.params.id;
    const newRecBody = req.body;
    try {
        const updhotel = await hotelSchemaModel.findByIdAndUpdate(
            hotelId,
            newRecBody,
            { new: true}
        );

        if (!updhotel) return res.status(404).send();

        res.status(200).json(updhotel);
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = hotelRouter;
