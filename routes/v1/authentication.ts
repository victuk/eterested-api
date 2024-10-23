import express from "express";
import * as statusCodes from "readable-http-codes";
import { comparePassword, signJWT, genOTP, isTimeDifferenceGreaterThan30Minutes, hashPassword } from "../../utils/authUtilities";
import { userCollection, userCollectionType } from '../../models/User';
import { sendEmail } from "../../utils/emailUtilities";
import { OTPCollection } from "../../models/otpManager";
import { multerUpload, uploadToCloudinary } from "../../utils/cloudinaryUtils";
import { CustomRequest } from "../../middleware/authenticatedUsersOnly";
import { v4 as uuidV4, v4 } from "uuid";
import { readdirSync } from "fs";
import { loginValidationSchema } from "../../validations/authValidations";
import jsonwebtoken from "jsonwebtoken";

const router = express.Router();


router.post("/upload-test", multerUpload.single("file"), async function (req: CustomRequest, res: express.Response, next: express.NextFunction) {
  try {


    const resp = await uploadToCloudinary(req.file!!.path);

    console.log("res", resp);


    res.send({
      message: "Uploads Successful",
    });

  } catch (error) {
    next(error);
  }
});


/* GET home page. */
router.post("/register", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {

    const {
      firstName,
      lastName,
      organizationName,
      role,
      username,
      cityOrLGA,
      state,
      tags,
      email,
      password
    } = req.body;

    req.body.role = "user";

    req.body.email = (req.body.email).toLocaleLowerCase();

    let user = await userCollection.findOne({ email });

    if (user) {
      return res.status(409).send({
        successful: false,
        errorMessage: "Email already exist"
      });
    }

    const hashedPassword = hashPassword(password);

    var newUser: any;

    if (!password) {
      res.status(400).send("Password field is required");
      return;
    }

    if(role == "user") {
      newUser = await userCollection.create({
        firstName,
        lastName,
        username,
        email,
        tags,
        cityOrLGA,
        state,
        role: "user",
        password: hashedPassword,
      });
    } else if (role == "organization") {

      newUser = await userCollection.create({
        firstName,
        lastName,
        organizationName,
        username,
        email,
        tags,
        cityOrLGA,
        state,
        role: "organization",
        password: hashedPassword,
      });
    }

    const token = v4();

    const otp = genOTP();

    if (await OTPCollection.exists({ userId: newUser._id })) {
      await OTPCollection.deleteMany({ userId: newUser._id });
    }

    await OTPCollection.create({
      userId: newUser._id,
      uId: token,
      otp
    });

    await sendEmail({
      to: newUser.email,
      subject: "e-Terested - Verify email",
      body: `${newUser?.firstName} ${newUser?.lastName}, \n Your otp is ${otp}`
    });

    res.send({
      message: "Registration Successful",
      userDetails: {
        fullName: newUser.fullName,
        email: newUser?.email,
        phoneNumber: newUser?.phoneNumber,
        cityOrLGA: newUser?.cityOrLGA
      },
      verificationId: token,
      successful: true
    });

  } catch (error) {
    next(error);
  }
});

router.post("/login", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {

    const { emailOrUsername, password } = req.body;

    req.body.emailOrUsername = (req.body.emailOrUsername.trim()).toLocaleLowerCase();

    // const {error} = loginValidationSchema.validate(req.body);

    // if(error) {
    //   console.log(error);
    //   res.send({errorMessage: "Invalid credentials"});
    //   return;
    // }

    const user = await userCollection.findOne({
      "$or": [
        {email: emailOrUsername},
        {username: emailOrUsername}
      ]
    });

    if (!user) return res.status(404).send({ message: "account-not-found" });

    if (!comparePassword(password, user?.password as string)) return res.status(400).send({ message: "invalid-credentials" });

    if (user.emailVerified == false) {
      res.status(400).send({
        isSuccessful: false,
        errorMessage: "Email not verified"
      });
      return;
    }

    const jwt = signJWT({
      email: user.email,
      userId: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role
    });

    const jwtExpiryDate: any = jsonwebtoken.decode(jwt);

    res.send({
      message: "Login Successful",
      token: jwt,
      jwtExpiryDate: jwtExpiryDate?.exp,
      jwtIssueDate: jwtExpiryDate?.iat,
      userDetails: {
        email: user.email,
        userId: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role
      },
      successful: true
    });

  } catch (error) {
    next(error);
  }
});


router.post("/verify-email", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {

    const { verificationId, otp } = req.body;

    const otpDetails = await OTPCollection.findOne({
      uId: verificationId
    });

    if (!otpDetails) {
      return res.status(404).send({
        isSuccessful: false,
        errorMessage: "OTP Not found"
      });
    }

    if (otpDetails.otp != otp) {
      return res.status(400).send({
        isSuccessful: false,
        errorMessage: "Invalid OTP"
      });
    }

    if (isTimeDifferenceGreaterThan30Minutes(new Date(), otpDetails.createdAt)) {
      return res.status(400).send({
        isSuccessful: false,
        errorMessage: "OTP has expired."
      });
    }

    await userCollection.findByIdAndUpdate(otpDetails.userId, {
      emailVerified: true
    });

    res.send({
      isSuccessful: true,
      message: "Email verified successful"
    });

  } catch (error) {
    next(error);
  }
});

router.post("/login-with-provider/:providerType", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {

    const { provider } = req.params;

    const { email, providerId } = req.body;

    const user = await userCollection.findOne({ email });
    if (!user) return res.status(404).send({ message: "account-not-found" });

    if (providerId != user.providerId || provider != user.provider) return res.status(400).send({ message: "invalid-credentials" });

    const jwt = signJWT({
      email: user.email,
      userId: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      role: "user"
    });

    res.send({
      message: "Login Successful",
      token: jwt,
      userDetails: {
        email: user.email,
        userId: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        role: "user"
      },
      successful: true
    });

  } catch (error) {
    next(error);
  }
});


router.post("/forgot-password", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const { email } = req.body;
    let userInfo = await userCollection.findOne({ email });
    if (userInfo?.provider != "credentials") return res.status(400).send({ errorMessage: "Invalid request" });

    if (!userInfo) return res.status(404).send("user-not-found");

    const otp = genOTP();
    const uId = v4();

    await OTPCollection.create({
      userId: userInfo!!._id,
      otp,
      uId,
    });


    await sendEmail({
      to: userInfo.email,
      subject: "e-Terested - Forgot password",
      body: `${userInfo?.firstName} ${userInfo?.lastName}, \n Your otp is ${otp}`
    });

    res.send({
      message: "otp-sent",
      verificationToken: uId,
      successful: true
    });

  } catch (error) {
    next(error);
  }
});


router.post("/resend-otp", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {

    const email = req.body.email;

    let userInfo = await userCollection.findOne({ email });
    if (userInfo?.provider != "credentials") return res.status(400).send({ message: "invalid-request" });

    if (!userInfo) return res.status(404).send("user-not-found");

    await OTPCollection.deleteMany({ userId: userInfo?._id });

    const otp = genOTP();
    const uId = uuidV4();

    await OTPCollection.create({
      userId: userInfo!!._id,
      uId,
      otp
    });

    await sendEmail({
      to: userInfo.email,
      subject: `e-Terested - OTP`,
      body: `${userInfo?.firstName} ${userInfo?.lastName},\nYour otp is ${otp}`
    });

    res.send({
      message: "otp-resent-successful",
      verificationToken: uId,
      successful: true
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const { verificationToken, otp, newPassword } = req.body;

    const user = await OTPCollection.findOne({ uId: verificationToken });

    if (!user) {
      return res.status(404).send({
        errorMessage: "OTP not found",
        successful: false
      });
    }

    if(user.otp != otp) {
      return res.status(400).send({
        successful: false,
        errorMessage: "Invalid OTP"
      });
    }

    var u = await userCollection.findById(user.userId);

    
    if (isTimeDifferenceGreaterThan30Minutes(new Date(), user!!.updatedAt)) {
      return res.status(400).send({
        errorMessage: "OTP has expired, request for a new OTP",
        successful: false
      });
    }
    
    if (comparePassword(newPassword, u?.password as string)) {
      return res.status(400).send({
        errorMessage: "Old and new passwords match",
        successful: false
      });
    }

    if(otp != user.otp) {
      return res.status(400).send({
        errorMessage: "Invalid OTP",
        successful: false
      });
    }


    const newHashedPassword = hashPassword(newPassword);

    await userCollection.findByIdAndUpdate(user.userId, {
      password: newHashedPassword
    });

    await OTPCollection.findOneAndDelete({ uId: verificationToken });

    res.send({
      successful: true,
      message: "update-successful"
    });

  } catch (error) {
    next(error);
  }
});

export default router;