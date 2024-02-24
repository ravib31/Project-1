const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//Register a User

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "Sample id",
      url: "pictureUrl",
    },
  });
  sendToken(user, 201, res);
});

//Login User

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHander("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHander("Invalid Email or Password",401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid Email or Password", 401));
  }
  sendToken(user, 200, res);
});

// Logout User

exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Log-out Successfully",
  });
});

//Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHander("User Not Found", 404));
  }

  // Get Reset Password Token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;
  const message = `Your Password reset token is :- ${resetPasswordUrl}\n If you have not required this email then ,Ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `रV password recovery`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHander(error.message, 500));
  }
});

//Reset Password

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorHander("Token is expired or invalid", 400));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Password Not Matched", 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});


// User Details

exports.getUserDetails = catchAsyncErrors(async(req,res,next)=>{

  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });

})


// Update User Password

exports.updatePassword = catchAsyncErrors(async(req,res,next)=>{

  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if(!isPasswordMatched){
    return next(new ErrorHander("Please enter correct password ",400));
  }
  if(req.body.newPassword !== req.body.confirmPassword){
    return next(new ErrorHander("Password not Matched",400));
  }
  user.password = req.body.newPassword;
  await user.save();
  sendToken(user,200,res);
  
});




// Update User Profile

exports.updateProfile = catchAsyncErrors(async(req,res,next)=>{

  const newUserData ={
    name:req.body.name,
    email:req.body.email,
  }
  const user =await  User.findByIdAndUpdate(req.user.id,newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false,
  })
  res.status(200).json({
    success:true
  });
  
})


// Get All Users 

exports.getAllUser = catchAsyncErrors(async(req,res,next)=>{
  const users = await User.find();
  res.status(200).json({
    success:true,
    users,
  })
})

// Get Single User (admin)

exports.getSingleUser = catchAsyncErrors(async(req,res,next)=>{
  const user = await User.findById(req.params.id);
  
    if(!user){
      return next(new ErrorHander(`User not found with ID:${req.params.id}`))
    }
    res.status(200).json({
    success:true,
    user,
  })
})


// Update User Role by Admin

exports.updateUserRole = catchAsyncErrors(async(req,res,next)=>{

  const newUserData ={
    name:req.body.name,
    email:req.body.email,
    role:req.body.role
  }
  const user =await  User.findByIdAndUpdate(req.params.id,newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false,
  })
  res.status(200).json({
    success:true
  });
  
})



// Delete User by  Admin

exports.deleteUser = catchAsyncErrors(async(req,res,next)=>{

 const user = await User.findById(req.params.id);

 if(!user){
  return next(new ErrorHander(`User Does not exits with ID:${req.params.id}`))
 }

 await user.deleteOne();
  res.status(200).json({
    success:true,
    message:"User Deleted Successfully"
  });
  
})

