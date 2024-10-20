import joi from "joi";

const loginValidationSchema = joi.object({
    email: joi.string().email({tlds: {allow: false}}).required(),
    password: joi.string().min(6).required()
});

const buyerRegistrationSchema = joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    email: joi.string().email({tlds: {allow: false}}).required(),
    phoneNumber: joi.string(),
    password: joi.string().min(6).required(),
    provider: joi.optional(),
    providerId: joi.optional()
});



export {
    loginValidationSchema,
    buyerRegistrationSchema
};
