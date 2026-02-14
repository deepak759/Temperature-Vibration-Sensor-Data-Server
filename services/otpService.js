import axios from "axios";
import { ApiResponse } from "../utils/ApiResponse.js";
import { 
  fast2smsKey,
  fast2smsUri,
  fast2smsId
} from "../constants.js"

export const sendOtp = async (phoneNumber, otp) => {
  try {
    const url = `${fast2smsUri}?authorization=${fast2smsKey}&route=dlt&sender_id=${fast2smsId}&message=176992&variables_values=${otp}%7C&flash=0&numbers=${phoneNumber}`
    console.log("URL === ",url);
    
    const otpRes = await axios.get(url);
    return { otpRes };
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return new ApiResponse(400, {},`An error occurred while sending OTP : ${error}`);
  }
};