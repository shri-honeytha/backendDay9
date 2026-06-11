import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config();
const SECRET="mysecret123"

const PORT=process.env.PORT || 8081
const app = express();

app.use(cors());
app.use(express.json());
app.listen(PORT, () => {
  console.log("Server started");
});

mongoose.connect(process.env.MONGO_URI)

const userSchema = new mongoose.Schema({
  name:String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  role: {
    type: String,
    default: "user",
  },
});

const userModel = mongoose.model("User", userSchema);

app.post("/users/register", async (req, res) => {
 

    const {name,email,password,role} = req.body;
    const hashedPassword=await bcrypt.hash(password,10)
    const user=await userModel.create({
        name, email, password:hashedPassword,role
    })
    res.json(user)
   
} )

app.post("/users/login", async (req, res) => {
  
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if(user){
        const chkPassword=await bcrypt.compare(password,user.password)
        if(chkPassword){
            const obj={
id: user._id,
name:user.name,
    email:user.email,role:user.role
            }
            const token=await jwt.sign(obj,SECRET,{expiresIn:"1h"})
            res.json({...obj,token})
        }
        else{
            res.json({message:"Invalid Password"})
        }
    
    }
    else{
        res.json({message:"user not found"})
    }
});

const authenticate=async (req,res,next)=>{

    try{
    const authHeader=req.headers.authorization
    const token=authHeader.split(" ")[1] //[0] is Bearer and [1] is abc from authHeader, it will extract the token abc
   const user=await jwt.verify(token,SECRET)
   req.user=user
   next()
    }
    catch(error){
res.json({message:"Unauthorized"})
    }
  

}

app.get("/users", authenticate,async (req, res) => {
    const users = await userModel.find();
    res.json(users);
});
