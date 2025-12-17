"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
// Use the API key from your .env file
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
exports.default = resend;
