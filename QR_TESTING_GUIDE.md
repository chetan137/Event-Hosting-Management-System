# Testing the QR Code & Registration Status Feature

## Prerequisites
- Backend running on port 8081
- Frontend running on port 5173
- At least one user account and one admin account
- At least one event created

## Test Steps

### Step 1: User Registration (Pending State)

1. **Login as User** (not admin)
   - Email: user@example.com
   - Password: your password

2. **Navigate to Events Page**
   - Click on "Events" in navigation
   - Find an event and click "View Details" or "Register"

3. **Register for Event**
   - Fill in registration form (if required)
   - Click "Register"

4. **View Event Detail Page**
   - After registration, go to the event detail page
   - **Expected Result:** 
     - Status badge shows "⏳ Pending Approval" (yellow)
     - Info box says "Your registration is pending admin approval..."
     - No QR code displayed yet

5. **Check User Dashboard**
   - Click on "My Events" or "Dashboard"
   - **Expected Result:**
     - Event shows with "Pending" badge
     - Message: "Your registration is awaiting admin approval"

---

### Step 2: Admin Approval (Generating QR)

1. **Logout and Login as Admin**
   - Email: admin@example.com  
   - Password: your admin password

2. **Navigate to Admin Dashboard**
   - Click on "Admin" or "Dashboard"
   - Find the event you created

3. **View Event Registrations**
   - Click on event name or "View Details"
   - You should see list of registrations
   - Find the pending registration from Step 1

4. **Approve Registration**
   - Click "Approve" button next to the pending registration
   - **Check Backend Console:**
     ```
     🔵 [APPROVAL] Starting approval process...
     ✅ Found registration: YES
     ✅ User populated: user@example.com
     ✅ Event populated: Event Name
     ✅ Status saved: approved
     📧 Preparing email for user@example.com...
     🎟️ Generating QR code...
     🎟️ [QR] Starting QR generation...
     ✅ [QR] QR image generated (XXXX bytes)
     ✅ [QR] QR document saved to database
     ✅ QR code generated
     📤 Sending email via Brevo...
     ✅ [SUCCESS] Email sent to user@example.com
     ```

5. **Expected Result:**
   - Success toast/message appears
   - Registration status changes to "Approved"
   - Backend logs show QR generation and email sending

---

### Step 3: User Receives QR Code

1. **Check User Email**
   - Go to the email account (user@example.com)
   - Find email with subject: "Registration Approved ✅ - [Event Name]"
   - **Expected Email Content:**
     - ✅ Registration Approved heading
     - Event details (name, date, location)
     - **QR Code image displayed** (should be visible, not blank)
     - Warning not to share QR code
     - Note about viewing QR in dashboard

2. **Verify QR Code in Email**
   - The QR code should be a visible black and white pattern
   - Size should be around 200x200 pixels
   - Should NOT be blank or show error

---

### Step 4: View QR Code in Event Detail Page

1. **Login as User Again**
   - Email: user@example.com

2. **Navigate to Event Detail Page**
   - Go to "Events" → Select the registered event
   - Click "View Details"

3. **Check Registration Status**
   - **Expected Result:**
     - Status badge shows "✓ Approved" (green)
     - Full QR Code component is visible
     - QR code shows as black and white pattern (scannable)
     - Shows "Your Event QR Code" heading
     - Shows "Ready to Scan" status badge (blue)
     - Event name displayed
     - Expiration date shown
     - "Download QR Code" button available

4. **Test QR Code Download**
   - Click "Download QR Code" button
   - **Expected Result:**
     - PNG file downloads with name "[EventName]-QR.png"
     - File contains the QR code image

5. **Check User Dashboard (My Events)**
   - Navigate to "My Events"
   - Find the approved event
   - **Expected Result:**
     - Shows "Approved" badge (green)
     - Message: "Your registration has been approved! Show your QR code at the event."
     - "View QR Code" button available

---

### Step 5: QR Code Functionality Test

1. **Scan QR Code** (optional, if you have a QR scanner)
   - Use phone camera or QR scanner app
   - Scan the QR code from email or event page
   - **Expected:** Should decode to a JWT token string

2. **Verify QR Data in Backend** (optional)
   - Check MongoDB or database
   - Look for QRCode collection
   - Find the document with matching registrationId
   - **Expected Fields:**
     - `qrToken` - JWT string
     - `qrCodeImage` - Long base64 data URL (starts with `data:image/png;base64,`)
     - `isUsed` - false
     - `isExpired` - false
     - `expiresAt` - Date in future

---

## Expected States Summary

| State | Status Badge | QR Code Display | Info Message |
|-------|-------------|-----------------|--------------|
| Not Registered | None | No | "Register for this event to receive your QR code" |
| Pending Approval | ⏳ Pending (Yellow) | No | "Your registration is pending admin approval..." |
| Approved | ✓ Approved (Green) | Yes | Full QR code component with download button |
| Rejected | ✗ Rejected (Red) | No | "Your registration was not approved" |

---

## Troubleshooting

### QR Code Not Showing in Email
- Check backend console for QR generation logs
- Verify `qrCodeImage` is stored in database
- Check email HTML includes `<img src="...">` tag
- Ensure Brevo API key is valid

### QR Code Not Showing in Event Page
- Check browser console for API errors
- Verify `/api/qr/registration/:registrationId` endpoint returns data
- Ensure user is authenticated (JWT token valid)
- Check registration status is "approved"

### Status Badge Not Updating
- Refresh the page
- Check `/api/events/user/my-events` returns correct data
- Verify `registrationStatus` field in response
- Clear browser cache

### Email Not Received
- Check backend console for email sending logs
- Verify Brevo API key is correct in `.env`
- Check spam/junk folder
- Verify sender email is configured in Brevo

---

## Debug Commands

### Check Node Processes
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### Check MongoDB QR Codes
```javascript
// In MongoDB shell or Compass
db.qrcodes.find({ user: ObjectId("user_id_here") })
```

### Test API Endpoints
```bash
# Get user's events (requires auth token)
curl http://localhost:8081/api/events/user/my-events -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get QR code for registration
curl http://localhost:8081/api/qr/registration/REGISTRATION_ID -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Success Criteria ✅

- [x] User sees "Pending" status after registration
- [x] Admin can approve registration
- [x] Backend generates QR code and stores in database
- [x] Approval email is sent with embedded QR code
- [x] QR code is visible in email (not blank)
- [x] Event detail page shows "Approved" status badge
- [x] QR code component displays on event page when approved
- [x] QR code can be downloaded as PNG
- [x] Pending registrations show helpful waiting message
- [x] Rejected registrations show appropriate message
