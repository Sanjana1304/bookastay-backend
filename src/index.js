require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const hotelRouter = require("./routes/hotelRoute");
const userRouter = require("./routes/userRoute");
const authRouter = require("./routes/authRoute");
const bookingsRouter = require('./routes/bookingsRoute');
const verifyToken = require("./middleware/authMdl");
const cookieParser = require("cookie-parser");
const path = require("path");
const { v2: cloudinary } = require('cloudinary');
const hotelRouter2 = require("./routes/hotelRoute2");


mongoose.connect(process.env.MONGO_URI)
    .then(()=> console.log("Connected Woohoo! "))
    .catch(err => console.error("Could'nt connect"+err));


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const app=express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
//app.use(bodyParser.json());


app.use(
    cors({
        origin : process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials : true,
    })
)

app.get('/',(req,res)=>{
    res.send('Hello Sanjjj!');
});
app.use((req, res, next) => {
    res.setTimeout(120000, () => { // 2 minutes
        res.status(408).send('Request timed out');
    });
    next();
});

app.use(express.static(path.join(__dirname,'../../frontend/build')));
app.use("/hotelRoute",hotelRouter);

app.use("/userRoute",userRouter);
app.use('/authRoute',authRouter);
app.use('/hotelRoute2',hotelRouter2);
app.use('/bookingsRoute',bookingsRouter);

//to protect the routing from being directly accessed
app.get('/protectedRoute', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

app.get("*",async(req,res)=>{
    res.sendFile(path.join(__dirname,'../../frontend/build/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=>{
    console.log(`Woohoo! Port Successfully running on localhost:${PORT}`)
});