import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import CryptoJS from "crypto-js";

type UserType = "buyer" | "shopper" | "shopAdmin";

function hashPassword(password:string) {
    return bcrypt.hashSync(password.toString(), bcrypt.genSaltSync(10));
}

function comparePassword(userPassword:string, databasePassword:string) {
    return bcrypt.compareSync(userPassword.toString(), databasePassword);
}

function signJWT(payload: object | string) {
    return jwt.sign(payload, process.env.AUTH_KEY as string, {
        expiresIn: "5d"
    });
}

function verifyJWT(payload: string) {
    try {
        return {
            anyError: false,
            userDetails: jwt.verify(payload, process.env.AUTH_KEY as string)
        }
    } catch (error) {
        return {
            anyError: true,
            userDetails: {}
        }
    }
}

// const CryptoJS = require('crypto-js');

const encryptWithAES = (text:string) => {
  const passphrase = process.env.CRYPTO_PASSPHRASE;
  let stringifiedText = JSON.stringify(text);
  return CryptoJS.AES.encrypt(stringifiedText, passphrase as string).toString();
};

const decryptWithAES = (ciphertext:string) => {
  const passphrase = process.env.CRYPTO_PASSPHRASE;
  const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase as string);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(originalText);
};


const genOTP = function() {
    return Math.floor(100000 + Math.random() * 900000)
}

function isTimeDifferenceGreaterThan30Minutes(date1:Date, date2: Date) {
    const diffInMilliseconds: number = Math.abs(date2.getTime() - date1.getTime());
    const diffInMinutes: number = diffInMilliseconds / (1000 * 60);
    return diffInMinutes > 30;
}

export {
    hashPassword,
    comparePassword,
    signJWT,
    verifyJWT,
    encryptWithAES,
    decryptWithAES,
    genOTP,
    isTimeDifferenceGreaterThan30Minutes
}