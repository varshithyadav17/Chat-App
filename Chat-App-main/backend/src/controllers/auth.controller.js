import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { generateToken } from "../lib/util.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req,res) => {
    const {fullName,email,password} = req.body;
    try{
        if(!password||!email||!fullName){
            return res.status(400).json({message:"All fields are mandatory"});
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be atleast 6 characters long"});
        }

        const user = await User.findOne({email});

        if(user) return res.status(400).json({message:"Email already exists"});

        const salt = await bcrypt.genSalt(10);
        const hasedPassword = await bcrypt.hash(password,salt);

        const newUser = new User({
            fullName,
            email,
            password:hasedPassword
        })

        if(newUser){
            generateToken(newUser._id,res);
            await newUser.save();
            
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic
            });
        }
        else{
            res.status(400).json({message: "Invalid user data" });
        }
    }
    catch(error){
        console.error(`Error in signup controller ${error.message}`);
        res.status(500).json({message: "Internal Server Error"})
    }
}

export const login = async (req,res)=> {
    const {email,password} = req.body;
    try {
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                message:"User not found",
            })
        }

        const correct_pass = await bcrypt.compare(password,user.password);
        if(!correct_pass){
            return res.status(400).json({
                message: "Invalid credentials"
            })
        } 

        generateToken(user._id,res);

        return res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic
        })

    } catch (error) {
        console.error("Error while logging in: ",error.message);
        res.status(500).json({
            message:"Internal Server Error"
        })
    }

}

export const logout = (req,res) => {
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({
            message:"Sucessfully logged out"
        })
    }
    catch(error){
        console.error("Error while logging out: ",error.message);
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}


export const updateProfile = async (req,res) => {
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;
        
        if(!userId){
            return res.status(400).json({
                message:"User not found"
            })
        }
        if(!profilePic){
            return res.status(400).json({
                message:"Profile Pic is required"
            })
        }
        
        const updatedRes = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {profilePic: updatedRes.secure_url},
            {new:true}
        )
        console.log();
        return res.status(200).json(updatedUser);

    } catch (error) {
        console.log("error in updating profile: ",error);
        return res.status(500).json({
            message:"Internal server error"
        })
    }
}

export const checkAuth = async (req,res) => {
    try {
        return res.status(200).json(req.user)
    } catch (error) {
        console.error("Error in checkAuth controller", error.message);
        return res.status(500).json({
            message:"Internal server error"
        })
    }
}