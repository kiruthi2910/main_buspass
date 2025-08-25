<!-- 
  Project: TCE Staff Bus Payment Web App
  Developed by:
    Jovin J - B.tech IT,TCE jovinjeffin@gmail.com, (Phone No: 8925228892) 
    Aswinkumar I - B.tech IT,TCE tceaswin@gmail.com, (Phone No: 8825558350) 
    Praveen S - B.tech IT,TCE spraveen2666@gmail.com, (Phone No: 6381622037)    
    Ms.C.V.Nisha Angeline - Assistant Professor.,IT,TCE
-->
# TCE Staff Bus Pass Payment System

A web application for Thiagarajar College of Engineering (TCE) staff to manage and pay for their monthly staff bus pass online.

## Features

### 1. User Authentication
- Secure login for staff and admin users.
- Authentication is handled via Firebase Auth.
- Only authorized TCE staff can access the payment system.

### 2. Staff Dashboard
- View personal profile information (name, email, department, phone, bus stop, route, fare).
- See current payment status: **Paid**, **Pending**, or **Overdue**.
- View last payment date and amount due.
- Download or print the digital bus pass (with QR code) after successful payment.
- **Manual Refresh:** Staff must click the **Refresh** button in the Payment Status section to update and view their latest payment status and bus pass. (Auto-refresh on login is also available, but for the latest status after payment, use the refresh button.)
- Change password functionality.
- Logout option.

### 3. Payment Processing
- Pay monthly bus fare online via integrated payment gateway (demo mode for now).
- Payment window is open from 1st to 5th of each month.
- Payment status and bus pass are updated after successful payment.
- Refund & Cancellation Policy and Delivery & Fulfillment Policy are shown before payment. Staff must accept these policies to proceed.

### 4. Bus Pass Generation
- After payment, a digital bus pass is generated for the current month.
- Bus pass includes staff details, validity dates, and a QR code for verification.
- Downloadable as PDF and printable.
- QR code links to online verification page.

### 5. Admin Dashboard (if enabled)
- Admins can view all staff, payment statuses, and manage/reset payment windows.
- Filter staff by payment status.

### 6. Terms, Privacy, and Policies
- Terms & Conditions, Privacy Policy, Refund & Cancellation Policy, and Delivery & Fulfillment Policy are available and shown to users.
- Policies must be accepted before payment.

### 7. Favicon
- The TCE logo (`icon.ico`) is used as the favicon for all pages.

## How to Use

1. **Login:** Staff log in with their TCE credentials.
2. **Dashboard:** View personal and payment information.
3. **Pay Now:** During the payment window, click **Pay Now**. Accept the policies to proceed.
4. **Bus Pass:** After payment, download or print your bus pass.
5. **Refresh:** To see the latest payment status or bus pass, click the **Refresh** button in the Payment Status section.
6. **Logout:** Log out when done.

## Development & Deployment

- Built with React, TypeScript, Vite, Tailwind CSS, and Firebase.
- To run locally:
  1. Install dependencies: `npm install`
  2. Start dev server: `npm run dev`
- To build for production: `npm run build`
- To deploy on Firebase Hosting:
  1. Build the app: `npm run build`
  2. Deploy: `firebase deploy`

## File Structure (Key Files)
- `src/components/StaffDashboard.tsx` — Staff dashboard UI and logic
- `src/components/PaymentProcessor.ts` — Payment logic
- `src/components/BusPassVerify.tsx` — Bus pass verification page
- `src/components/terms.html` — Terms, privacy, and policy documents
- `src/contexts/AuthContext.tsx` — Authentication context
- `src/services/UserService.ts` — User and payment data management
- `src/firebase.ts` — Firebase configuration
- `public/` and `src/components/tcelogo.png` — Favicon and logo

## Notes
- Payment gateway is currently in demo mode (simulated payments).
- All policies are enforced as per TCE requirements.
- For any issues, contact the TCE Transport Office or support email as shown in the app.

---

© 2025 Thiagarajar College of Engineering. All rights reserved.
