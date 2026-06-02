'use strict';
const Joi = require('joi');
const { ValidationError } = require('../errors');

const phoneRegex = /^[+]?[0-9]{10,15}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const fields = {};
    error.details.forEach((d) => { fields[d.path.join('.')] = d.message; });
    return next(new ValidationError('Validation failed', fields));
  }
  req.body = value;
  next();
};

const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().trim(),
  lastName: Joi.string().min(2).max(50).required().trim(),
  email: Joi.string().email().lowercase().required().trim(),
  phone: Joi.string().pattern(phoneRegex).required().messages({
    'string.pattern.base': 'Phone must be a valid number (10-15 digits)',
  }),
  password: Joi.string().pattern(passwordRegex).required().messages({
    'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
  referralCode: Joi.string().optional().allow(''),
});

const loginSchema = Joi.object({
  phone: Joi.string().pattern(phoneRegex).required(),
  password: Joi.string().required(),
});

const otpSchema = Joi.object({
  phone: Joi.string().pattern(phoneRegex).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
  }),
});

const requestOtpSchema = Joi.object({
  phone: Joi.string().pattern(phoneRegex).required(),
});

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateOTP: validate(otpSchema),
  validateRequestOTP: validate(requestOtpSchema),
};
