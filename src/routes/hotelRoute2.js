const express = require("express");
const hotelSchemaModel = require("../schema/hotelSchemaCode");
const Stripe = require("stripe");
const verifyToken = require("../middleware/authMdl");

const stripe = new Stripe(process.env.STRIPE_API_KEY);


const hotelRouter2 = express.Router();

hotelRouter2.get("/search",async(req,res)=>{
    try {
        const query = constructSearchQuery(req.query);

        let sortOptions = {}
        switch (req.query.sortOption) {
            case "starRating":
                sortOptions = {starRating: -1};
                break;
            
            case "priceAsc":
                sortOptions = {price: 1};
                break;

            case "priceDesc":
                sortOptions = {price: -1};
                break;

            default:
                break;
        }

        const pageSize = 5;
        const pageNumber  = parseInt(
            req.query.page ? req.query.page.toString() : "1"
        );
        const skip = (pageNumber - 1) * pageSize;
        
        const hotels = await hotelSchemaModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize);

        const total = await hotelSchemaModel.countDocuments(query);

        const response = {
            data: hotels,
            pagination:{
                total,
                page: pageNumber,
                pages: Math.ceil(total/pageSize),
            },
        }

        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Something went wrooongg! "})
    }
})

//to do payment through stripe
hotelRouter2.post("/:hotelId/bookings/payment-intent",verifyToken,async(req,res)=>{
    const { numNyts } = req.body;
    const hotelId = req.params.hotelId;

    const hotel = await hotelSchemaModel.findById(hotelId);
    if (!hotel) {
        return res.status(400).json({message: "Hotel not found"})
    }

    //in case there is any modifications in the nmber of nights
    const totalCost = hotel.price * numNyts;

    const paymentIntent = await stripe.paymentIntents.create({
        amount: 100,
        currency: "usd",
        metadata:{
            hotelId,
            userIdd: req.userIdd,
        },
    });

    if (!paymentIntent.client_secret) {
        return res.status(500).json({message: "Error creating payment intent"});
    }

    const response = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret.toString(),
        totalCost
    }

    res.status(200).send(response);
})

//to add the booking details in the db once the payment is successful
hotelRouter2.post("/:hotelId/bookings",verifyToken,async(req,res)=>{
    try {
        const paymentIntentId = req.body.paymentIntentId;

        const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId
        );

        if (!paymentIntent) {
            return res.status(400).json({message: "paymet intent not found"});
        }

        if (paymentIntent.metadata.hotelId !== req.params.hotelId || 
            paymentIntent.metadata.userIdd !== req.userIdd)
        {
            return res.status(400).json({message: "payment intent mismatch"})
        }

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({message: `payment intent not succeeded. Status: ${paymentIntent.status}`})
        }

        const newBooking = {
            name: req.body.name,
            email: req.body.email,
            userId: req.body.userId,
            adultcnt: req.body.adultcnt,
            childcnt: req.body.childcnt,
            checkIn: new Date(req.body.checkIn),
            checkOut: new Date(req.body.checkOut),
            totalCost: req.body.totalCost,
            userIdd: req.userIdd,
        }

        const hotel = await hotelSchemaModel.findById(req.params.hotelId);
        if (!hotel) {
            return res.status(400).json({ message: "Hotel not found" });
        }

        hotel.bookings.push(newBooking);

        await hotel.save();
        res.status(200).send();


    } catch (error) {
        console.log(error);
        res.status(500).json({message: "something went wrong"});
    }
})


//to add star rating by a user once they check out
hotelRouter2.put('/:hotelId/bookings/:bookId/rate',verifyToken,async(req,res)=>{
    const hotelId = req.params.hotelId;
    const bookId = req.params.bookId;
    const { givenStar } = req.body;
    try {
        const result = await hotelSchemaModel.findOneAndUpdate(
            { _id: hotelId, 'bookings._id': bookId },
            { $set: {'bookings.$.starRate':givenStar} },
            { new: true}

        )

        if (!result) {
            return res.status(404).json({ message: 'Hotel or booking not found' });
        }
        res.status(200).json(result);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating the star rate' });
    }
})

hotelRouter2.put('/:hotelId/bookings/:bookId/extendstay',verifyToken, async(req,res)=>{
    const hotelId = req.params.hotelId;
    const bookId = req.params.bookId;
    const { newcheckout } = req.body;
    try {
        const result = await hotelSchemaModel.findOneAndUpdate(
            { _id: hotelId, 'bookings._id': bookId },
            { $set: {'bookings.$.checkOut':newcheckout} },
            { new: true}

        )

        if (!result) {
            return res.status(404).json({ message: 'Hotel or booking not found' });
        }
        res.status(200).json(result);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating the check out' });
    }
})


//delete a booking in a hotel
hotelRouter2.delete('/:hotelId/bookings/:bookId',verifyToken,async(req,res)=>{

    const hotelId = req.params.hotelId;
    const bookId = req.params.bookId;
    try {

        const bookingDeletedHotel = await hotelSchemaModel.findByIdAndUpdate(
            hotelId,
            { $pull: {bookings: {_id: bookId }}},
            {new : true}
        );
        if (!bookingDeletedHotel) {
            return res.status(400).json({ message: "Hotel not found" });
        }

        res.status(200).json({ message: 'Booking deleted successfully', bookingDeletedHotel });



    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

const constructSearchQuery = (qryParams) => {
    let constructedQry = {};

    if (qryParams.place) {
        constructedQry.$or = [
            {city: new RegExp(qryParams.place,"i")},
            {country: new RegExp(qryParams.place,"i")},
        ];
    }
    if (qryParams.adultcnt) {
        constructedQry.adults = {
            $gte: parseInt(qryParams.adultcnt),
        };
    }
    if (qryParams.childCnt) {
        constructedQry.child = {
            $gte: parseInt(qryParams.childCnt),
        };
    }

    if (qryParams.facilities && qryParams.facilities.length > 0) {
        constructedQry.facilities = {
            $all : Array.isArray(qryParams.facilities)
            ? qryParams.facilities
            : [qryParams.facilities],
        }
    }

    if (qryParams.types) {
        constructedQry.type = {
            $in: Array.isArray(qryParams.types)
            ? qryParams.types
            : [qryParams.types],
        }
    }

    if (qryParams.starRating) {
        const starRatings = Array.isArray(qryParams.starRating) ? qryParams.starRating : [qryParams.starRating];
        constructedQry.starRating = {
            $in: starRatings.map(Number), // Convert star ratings to numbers
        };
    }

    if (qryParams.maxPrice) {
        constructedQry.price = {
            $lte: parseInt(qryParams.maxPrice),
        }
    }

    return constructedQry;
}




module.exports = hotelRouter2;

