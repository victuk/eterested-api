import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import Datauri from 'datauri';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import "dotenv/config"
import fs from "fs";

type FileType = "image" | "file";

/**
* @description This function converts the buffer to data url
* @param {Object} req containing the field object
* @returns {String} The data url from the string buffer
*/
// export { multerUploads, dataUri };

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
  });



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/')
    },
    filename: function (req, file, cb) {
      cb(null, uuidv4() + '.' + file.mimetype.split("/")[1])
    }
  })
  
const multerUpload = multer({ storage: storage })

async function uploadToCloudinary(fileOrFiles:string | Array<string>, fileType: FileType = "image"): Promise<any> {
  try {
      var uploadPreset:string;
        if(fileType == "image") {
            uploadPreset = "trovi_images_test";
        } else if(fileType == "file") {
            uploadPreset = "trovi_files_test"
        } else {
          return;
        }

        if(typeof(fileOrFiles) == "string") {
          const fileProps = await cloudinary.uploader.upload(fileOrFiles, {
            folder: uploadPreset
        });
        // await fs.unlink(fileOrFiles);
        return fileProps;
        } else if(typeof(fileOrFiles) == "object") {
          const filesProps:any  = [];
          for(let i = 0; i < fileOrFiles.length; i++) {
            console.log(uploadPreset);
            filesProps.push(await cloudinary.uploader.upload(fileOrFiles[i], {
              folder: uploadPreset
          }));
            // await fs.unlink(fileOrFiles[i]);
          }
          return filesProps;
        } else {
          return;
        }
        
    } catch (error) {
        console.log(error);
        return error;
    } finally {
      const files = fs.readdirSync("public");
      files.filter(f => fs.statSync(path.join("public", f)).isFile()).forEach(file => {
        const filePath = path.join("public", file);
        fs.unlinkSync(filePath);
      });
    }
}



async function deleteFromCloudinary(publicId: string, resourceType: "image" | "raw" | "video") {
  try {

    const result = await cloudinary.uploader.destroy("trovi_images_test/" + publicId, {
      resource_type: resourceType
    });

    return result.result;
  } catch (error) {
    console.log(error);
    return "An error occurred";
  }
}

export {
    uploadToCloudinary,
    multerUpload,
    deleteFromCloudinary
};