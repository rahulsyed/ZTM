// Google Apps Script for IAG Pickleball Tournament Registration
// Deploy this as a Web App and use the URL in your HTML form

function doPost(e) {
  try {
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Tournament Registrations');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Tournament Registrations');
      
      // Add headers
      const headers = [
        'Timestamp',
        'Full Name',
        'Email',
        'Phone',
        'Open Category',
        'Open Partner Name',
        'Mixed Doubles',
        'Mixed Partner Name',
        'Family Social',
        'Family Partner Name',
        'Total Events',
        'Registration Fee',
        'Terms Accepted',
        'Payment Received',
        'Notes'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#FF9933')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
      
      // Freeze header row
      sheet.setFrozenRows(1);
      
      // Set column widths
      sheet.setColumnWidth(1, 150);  // Timestamp
      sheet.setColumnWidth(2, 150);  // Full Name
      sheet.setColumnWidth(3, 200);  // Email
      sheet.setColumnWidth(4, 120);  // Phone
      sheet.setColumnWidth(5, 120);  // Open Category
      sheet.setColumnWidth(6, 150);  // Open Partner
      sheet.setColumnWidth(7, 150);  // Mixed Doubles
      sheet.setColumnWidth(8, 150);  // Mixed Partner
      sheet.setColumnWidth(9, 120);  // Family Social
      sheet.setColumnWidth(10, 150); // Family Partner
      sheet.setColumnWidth(11, 100); // Total Events
      sheet.setColumnWidth(12, 120); // Registration Fee
      sheet.setColumnWidth(13, 120); // Terms Accepted
      sheet.setColumnWidth(14, 150); // Payment Received
      sheet.setColumnWidth(15, 200); // Notes
    }
    
    // Parse form data
    const formData = e.parameter;
    
    // Extract data
    const timestamp = new Date();
    const fullName = formData.fullName || '';
    const email = formData.email || '';
    const phone = formData.phone || '';
    
    // Open category (radio button - only one selected)
    const openCategory = formData.openCategory || 'Not Selected';
    const openPartner = formData.openPartnerName || '';
    
    // Mixed category (checkbox)
    const mixedCategory = formData.mixedCategory || 'Not Selected';
    const mixedPartner = formData.mixedPartnerName || '';
    
    // Family category (checkbox)
    const familyCategory = formData.familyCategory || 'Not Selected';
    const familyPartner = formData.familyPartnerName || '';
    
    // Calculate total events and fee
    let totalEvents = 0;
    let registrationFee = 0;
    
    if (openCategory !== 'Not Selected') totalEvents++;
    if (mixedCategory !== 'Not Selected') totalEvents++;
    if (familyCategory !== 'Not Selected') totalEvents++;
    
    // Calculate fee based on logic:
    // 1 event (Open OR Mixed): $40
    // Family only: $25
    // 2 events: $60
    // All 3 events: $80
    if (totalEvents === 1) {
      if (familyCategory !== 'Not Selected') {
        registrationFee = 25;
      } else {
        registrationFee = 40;
      }
    } else if (totalEvents === 2) {
      registrationFee = 60;
    } else if (totalEvents === 3) {
      registrationFee = 80;
    }
    
    const termsAccepted = formData.terms ? 'Yes' : 'No';
    
    // Create row data
    const rowData = [
      timestamp,
      fullName,
      email,
      phone,
      openCategory,
      openPartner,
      mixedCategory,
      mixedPartner,
      familyCategory,
      familyPartner,
      totalEvents,
      '$' + registrationFee,
      termsAccepted,
      'Pending',  // Payment Received - default to Pending for manual update
      ''          // Notes - empty for manual entry
    ];
    
    // Append the row
    sheet.appendRow(rowData);
    
    // Get the last row number
    const lastRow = sheet.getLastRow();
    
    // Format the new row
    sheet.getRange(lastRow, 1, 1, rowData.length)
      .setHorizontalAlignment('left')
      .setVerticalAlignment('middle')
      .setWrap(true);
    
    // Center align specific columns
    sheet.getRange(lastRow, 11).setHorizontalAlignment('center'); // Total Events
    sheet.getRange(lastRow, 12).setHorizontalAlignment('center'); // Registration Fee
    sheet.getRange(lastRow, 13).setHorizontalAlignment('center'); // Terms Accepted
    sheet.getRange(lastRow, 14).setHorizontalAlignment('center'); // Payment Received
    
    // Add data validation for Payment Received column
    const paymentCell = sheet.getRange(lastRow, 14);
    const paymentRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pending', 'Received', 'Refunded'], true)
      .setAllowInvalid(false)
      .build();
    paymentCell.setDataValidation(paymentRule);
    
    // Color code payment status
    if (totalEvents > 0) {
      paymentCell.setBackground('#FFF3CD'); // Yellow for pending
    }
    
    // Add alternating row colors for better readability
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, rowData.length).setBackground('#F8F9FA');
    }
    
    // Send email notification to organizers (optional)
    try {
      const emailSubject = `New Tournament Registration: ${fullName}`;
      const emailBody = `
New registration received for IAG Pickleball Tournament:

Player Name: ${fullName}
Email: ${email}
Phone: ${phone}

Events Registered:
- Open Category: ${openCategory}${openPartner ? ' (Partner: ' + openPartner + ')' : ''}
- Mixed Doubles: ${mixedCategory}${mixedPartner ? ' (Partner: ' + mixedPartner + ')' : ''}
- Family Social: ${familyCategory}${familyPartner ? ' (Partner: ' + familyPartner + ')' : ''}

Total Events: ${totalEvents}
Registration Fee: $${registrationFee}

Payment Status: Pending
Please update the spreadsheet once payment is received.

View Registration: ${ss.getUrl()}
      `;
      
      // Add organizer emails here
      const organizerEmails = [
        // 'pj@example.com',
        // 'vanith@example.com',
        // 'anish@example.com'
      ];
      
      if (organizerEmails.length > 0) {
        MailApp.sendEmail({
          to: organizerEmails.join(','),
          subject: emailSubject,
          body: emailBody
        });
      }
    } catch (emailError) {
      Logger.log('Email notification failed: ' + emailError.toString());
      // Continue execution even if email fails
    }
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'message': 'Registration submitted successfully',
      'registrationFee': registrationFee
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify setup
function testSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Tournament Registrations');
  
  if (!sheet) {
    Logger.log('Sheet does not exist. Run doPost() first to create it.');
    return;
  }
  
  Logger.log('Sheet exists with ' + sheet.getLastRow() + ' rows');
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
}

// Function to get web app URL (run this after deploying)
function getWebAppUrl() {
  const scriptId = ScriptApp.getScriptId();
  Logger.log('Script ID: ' + scriptId);
  Logger.log('After deploying as Web App, your URL will be:');
  Logger.log('https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec');
}
