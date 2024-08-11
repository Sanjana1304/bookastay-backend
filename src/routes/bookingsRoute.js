const express = require("express");
const hotelSchemaModel = require("../schema/hotelSchemaCode");
const verifyToken = require("../middleware/authMdl");

const bookingsRouter = express.Router();

bookingsRouter.get('/:userId',verifyToken,async(req,res)=>{
    try {
        const hotels = await hotelSchemaModel.find({
            "bookings.userId" : req.params.userId,
        });

        const results = hotels.map((hotel)=>{
            const userBookings = hotel.bookings.filter(
                (booking)=> booking.userId === req.params.userId
            );

            const hotelswithUserBookings ={
                ...hotel.toObject(),
                bookings: userBookings,
            };

        return hotelswithUserBookings;
        });
        
        res.status(200).json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Unable to fetch bookings '})
    }
})

module.exports = bookingsRouter