const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dcpnglpxf",
  api_key: process.env.CLOUDINARY_API_KEY || "112165375612794",
  api_secret: process.env.CLOUDINARY_API_SECRET || "h5MnmXMvI279aQ83jjLrpH35zeg",
});
module.exports = cloudinary;