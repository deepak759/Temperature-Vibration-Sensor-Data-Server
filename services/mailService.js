import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: "game6112002@gmail.com",
    pass: "bzftnxixombuyjwe", // Consider using environment variables for security
  },
});

const sendMail = async (recipientEmail, subject, otp) => {
  try {
   
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #90e0ef;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            color: #000000;
            font-size: 20px;
          }
          .otp {
            display: inline-block;
            font-size: 1.5rem;
            font-weight: bold;
            color: #ffffff;
            background-color: #219ebc;
            padding: 10px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            font-size: 0.9rem;
            color: #888;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h2 class="header" style="color:#000000;">Your Verification Code</h2>
          <p>Hi there, Greetings from UNO MINDA</p>
          <p>Thank you for signing up! Use the following OTP to complete your verification:</p>
          <div class="otp">${otp}</div>
          <p>If you did not request this, please ignore this email.</p>
          <div class="footer">
            &copy; 2024 UNO MINDA. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const options = {
      from: "game6112002@gmail.com",
      to: recipientEmail,
      subject: subject,
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(options);
    console.log("Email sent successfully.", result.messageId);

  } catch (error) {
    console.log(`Error in email service due to ${error}.`);
  }
};

const sendFeedbackMail = async (recipientEmail, subject, feedbackData) => {
  try {
    const { query, name, email, text } = feedbackData;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #90e0ef;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            color: #000000;
            font-size: 20px;
            font-weight: bold;
          }
          .content {
            padding: 10px 0;
          }
          .feedback-box {
            background-color: #f1f8ff;
            padding: 10px;
            border-radius: 6px;
            font-size: 1rem;
            color: #333;
          }
          .footer {
            text-align: center;
            font-size: 0.9rem;
            color: #888;
            margin-top: 20px;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h2 class="header">New Feedback Received</h2>
          <div class="content">
            <p><span class="label">Username:</span> ${name}</p>
            <p><span class="label">User Email:</span> ${email}</p>
            <p><span class="label">Query Type:</span> ${query}</p>
            <p><span class="label">Message:</span></p>
            <div class="feedback-box">
              ${text}
            </div>
          </div>
          <p>If you need to follow up, please contact the user directly.</p>
          <div class="footer">
            &copy; 2024 Hint Bharat. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const options = {
      from: "mram34272@gmail.com",
      to: recipientEmail,
      subject: subject,
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(options);
    console.log("Feedback email sent successfully.", result.messageId);

  } catch (error) {
    console.log(`Error in sending feedback email: ${error}.`);
  }
};

// New function for vibration alerts with warning/critical levels
const sendVibrationAlert = async (recipientEmail, vibrationData, limitValue, alertLevel) => {
  try {
    // Determine color based on alert level
    const alertColor = alertLevel === 'critical' ? '#dc3545' : '#ffc107';
    const alertBgColor = alertLevel === 'critical' ? '#f8d7da' : '#fff3cd';
    const alertBorderColor = alertLevel === 'critical' ? '#f5c6cb' : '#ffeeba';
    
    // Set alert level display text
    const alertLevelText = alertLevel === 'critical' ? 'CRITICAL' : 'WARNING';
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border: 2px solid ${alertColor};
            border-radius: 8px;
          }
          .header {
            text-align: center;
            color: #000000;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .alert-badge {
            text-align: center;
            background-color: ${alertBgColor};
            color: ${alertColor};
            border: 1px solid ${alertBorderColor};
            padding: 10px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 1.2rem;
            font-weight: bold;
          }
          .data-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid ${alertColor};
          }
          .data-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .data-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #495057;
          }
          .value {
            color: #212529;
          }
          .exceeded-value {
            color: ${alertColor};
            font-weight: bold;
          }
          .threshold {
            display: inline-block;
            background-color: #e9ecef;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.9rem;
          }
          .action-required {
            background-color: #e7f3ff;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            font-size: 0.9rem;
            color: #888;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
          }
          .timestamp {
            text-align: center;
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h2 class="header">⚠️ VIBRATION ALERT ⚠️</h2>
          
          <div class="alert-badge">
            ALERT LEVEL: ${alertLevelText}
          </div>
          
          <div class="timestamp">
            Alert Generated: ${new Date().toLocaleString()}
          </div>
          
          <div class="data-box">
            <h3 style="color: ${alertColor}; margin-top: 0;">Vibration Data Exceeded Limit</h3>
            
            <div class="data-row">
              <span class="label">Current Vibration Value:</span>
              <span class="value exceeded-value">${vibrationData.value} mm/s</span>
            </div>
            
            <div class="data-row">
              <span class="label">Set Limit Value:</span>
              <span class="value">${limitValue} mm/s</span>
            </div>
            
            <div class="data-row">
              <span class="label">Exceeded By:</span>
              <span class="value exceeded-value">${(vibrationData.value - limitValue).toFixed(2)} mm/s</span>
            </div>
            
            ${vibrationData.location ? `
            <div class="data-row">
              <span class="label">Location:</span>
              <span class="value">${vibrationData.location}</span>
            </div>
            ` : ''}
            
            ${vibrationData.equipmentId ? `
            <div class="data-row">
              <span class="label">Equipment ID:</span>
              <span class="value">${vibrationData.equipmentId}</span>
            </div>
            ` : ''}
            
            <div class="data-row">
              <span class="label">Threshold Status:</span>
              <span class="value">
                <span class="threshold">Limit: ${limitValue} mm/s</span>
              </span>
            </div>
          </div>
          
          <div class="action-required">
            <h3 style="color: ${alertColor}; margin: 0 0 10px 0;">IMMEDIATE ACTION REQUIRED</h3>
            <p style="margin: 0;">
              ${alertLevel === 'critical' 
                ? 'Critical vibration levels detected! Please take immediate action to prevent equipment failure.' 
                : 'Warning: Vibration levels approaching critical threshold. Please investigate and take necessary precautions.'}
            </p>
          </div>
          
          ${vibrationData.additionalInfo ? `
          <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin: 15px 0;">
            <p><strong>Additional Information:</strong><br>${vibrationData.additionalInfo}</p>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>This is an automated alert from UNO MINDA Vibration Monitoring System</p>
            <p>Please ensure all equipment is checked and necessary safety protocols are followed.</p>
            <p>&copy; 2026 UNO Minda Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Customize subject based on alert level
    const alertSubject = alertLevel === 'critical' 
      ? `UNO Minda Ltd: CRITICAL: Vibration Alert - Value ${vibrationData.value} mm/s exceeded limit ${limitValue} mm/s`
      : `UNO Minda Ltd: WARNING: Vibration Alert - Value ${vibrationData.value} mm/s exceeded limit ${limitValue} mm/s`;

    const options = {
      from: "game6112002@gmail.com",
      to: recipientEmail,
      subject: alertSubject,
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(options);
    console.log(`Vibration ${alertLevel} alert sent successfully.`, result.messageId);
    return result;

  } catch (error) {
    console.log(`Error in sending vibration alert: ${error}.`);
    throw error;
  }
};

// Send credentials email when admin/godadmin creates a user
const sendCredentialsMail = async (recipientEmail, username, password, role, plantName) => {
  try {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #90e0ef;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            color: #000000;
            font-size: 20px;
            font-weight: bold;
          }
          .credentials-box {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #219ebc;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .credential-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #495057;
          }
          .value {
            color: #212529;
            font-family: monospace;
            background-color: #ffffff;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            font-size: 0.9rem;
            color: #888;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h2 class="header">Welcome to Vibration Monitoring System</h2>
          <p>Hi ${username},</p>
          <p>Your account has been created by an administrator. Below are your login credentials:</p>
          
          <div class="credentials-box">
            <div class="credential-row">
              <span class="label">Username:</span>
              <span class="value">${username}</span>
            </div>
            <div class="credential-row">
              <span class="label">Email:</span>
              <span class="value">${recipientEmail}</span>
            </div>
            <div class="credential-row">
              <span class="label">Password:</span>
              <span class="value">${password}</span>
            </div>
            <div class="credential-row">
              <span class="label">Role:</span>
              <span class="value">${role}</span>
            </div>
            ${plantName ? `
            <div class="credential-row">
              <span class="label">Plant Access:</span>
              <span class="value">${plantName}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
          </div>
          
          <p>You can now login to the system using these credentials. No email verification is required as your account has been pre-verified.</p>
          
          <p>If you have any questions, please contact your system administrator.</p>
          
          <div class="footer">
            &copy; 2026 UNO MINDA. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const options = {
      from: "game6112002@gmail.com",
      to: recipientEmail,
      subject: "Your Vibration Monitoring System Account Credentials",
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(options);
    console.log("Credentials email sent successfully.", result.messageId);
    return result;

  } catch (error) {
    console.log(`Error in sending credentials email: ${error}.`);
    throw error;
  }
};

export { sendMail, sendFeedbackMail, sendVibrationAlert, sendCredentialsMail };