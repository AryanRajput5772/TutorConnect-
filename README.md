# 🎓 TutorConnect - Verified Home Tuition Platform

**TutorConnect** connects parents directly to rigorously verified, background-screened home tutors for their children. It ensures high child safety, academic quality, and transparent pricing by enforcing a **mandatory Admin Zoom Interview and credential screening workflow** before any tutor profile is published to the public front page.

---

## 🚀 Key Features

### 1. 🛡️ Verification & Zoom Interview Workflow (Core Requirement)
1. **Teacher Registration**: An educator registers on `/tutor/register` and fills in their detailed teaching profile (Highest Qualification, College, Teaching Experience, Subjects taught, Preferred Localities for home tuition, Hourly/Monthly Tuition Fees, and Bio).
2. **Instant Appearance on Admin Dashboard**: As soon as the tutor registers, their application appears in the **Admin Dashboard** (`/admin/dashboard`) under the **"Pending Review"** queue.
3. **Automated Zoom Meeting Link via Email**: The admin reviews the application and clicks **"Send Zoom Link"**. An interactive modal allows setting the Zoom URL, date/time, meeting ID, passcode, and document instructions. The system automatically sends a rich HTML email to the tutor with clickable Zoom links and interview instructions.
4. **Live Zoom Interview Conducted**: The admin interviews the tutor via Zoom to verify certificates, communication skills, subject pedagogy, and ID proof.
5. **Admin Approval & Instant Front Page Publishing**: With one click on **"Verify & Publish"**, the admin grants the tutor the **Verified Badge (✓ Verified)**.
6. **Live on Front Page**: The verified tutor instantly appears on the main homepage (`/`) and directory (`/tutors`) where parents can browse and filter them.

### 2. 👨‍👩‍👧 For Parents
- **Verified Tutors Directory**: Only tutors who have passed the Zoom interview are visible.
- **Search & Multi-Filters**: Filter by Subject (Maths, Physics, Science, English, etc.), Locality/City, Grade (Class 1-5, 6-8, 9-10, 11-12), and Maximum Hourly Fee.
- **Transparent Profiles**: Full view of degrees, colleges, experience, localities covered, and hourly rates.
- **1-Click Free Demo Request**: Submit student grade, locality, and preferred timing to book a trial class.

### 3. 👨‍🏫 For Tutors
- **Tutor Portal**: Dedicated dashboard displaying live verification status:
  - ⏳ *Pending Review*
  - 📹 *Zoom Interview Scheduled* (includes Zoom link and time)
  - ✅ *Verified & Live on Homepage*
- **Profile Management**: Update fees, subjects, and preferred localities anytime.
- **Inquiry Inbox**: View parent demo requests, student grades, and contact details.

### 4. 🛡️ For Administrators
- Comprehensive Admin Dashboard with metrics (Total Tutors, Pending Review, Scheduled, Verified, Inquiries).
- Search and status filter tabs.
- Interactive Zoom meeting scheduling modal with Nodemailer email delivery (with Ethereal preview support for dev).
- Verification and Rejection controls.
- Parent Inquiries manager.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Modern CSS3 (Responsive Design System, Custom Modals, Badges), Vanilla JavaScript
- **Template Engine**: EJS (Embedded JavaScript)
- **Backend**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Sessions (`express-session`) & Password Hashing (`bcryptjs`)
- **Email Service**: Nodemailer (supports SMTP / Gmail / Ethereal Test Previews)

---

## 📂 Project Directory Structure

```
TutorConnect/
├── config/
│   └── db.js                 # MongoDB connection logic
├── models/
│   ├── Tutor.js              # Tutor Schema (credentials, status, zoom details, fees)
│   ├── Admin.js              # Admin Schema
│   └── Inquiry.js            # Parent Demo Request Schema
├── middleware/
│   └── auth.js               # Route protection (isTutorAuth, isAdminAuth)
├── utils/
│   └── mailer.js             # Nodemailer Zoom meeting emails & notifications
├── routes/
│   ├── index.js              # Public routes (Home, /tutors, /tutors/:id, /inquire)
│   ├── tutor.js              # Tutor routes (Register, Login, Dashboard, Update)
│   └── admin.js              # Admin routes (Dashboard, Send Zoom, Verify, Reject)
├── views/
│   ├── partials/
│   │   ├── header.ejs        # Responsive navbar with dynamic auth status
│   │   ├── footer.ejs        # Footer with links and safety pledge
│   │   └── alerts.ejs        # Dismissible flash alerts
│   ├── index.ejs             # Landing page with verified tutors grid
│   ├── tutors.ejs            # Full search & filter directory
│   ├── tutor-detail.ejs      # Public tutor profile & parent demo request form
│   ├── how-it-works.ejs      # 3-Step verification explainer
│   ├── about.ejs             # About TutorConnect
│   ├── contact.ejs           # Support page
│   ├── 404.ejs & error.ejs   # Error templates
│   ├── tutor/
│   │   ├── register.ejs      # Educator application form
│   │   ├── login.ejs         # Educator login
│   │   └── dashboard.ejs     # Tutor portal (Zoom link & status banner)
│   └── admin/
│       ├── login.ejs         # Admin login
│       ├── dashboard.ejs     # Admin verification dashboard & Zoom modal
│       ├── tutor-view.ejs    # Detailed applicant inspection page
│       └── inquiries.ejs     # Parent inquiries management
├── public/
│   ├── css/
│   │   └── style.css         # Modern styling & responsive design
│   └── js/
│       └── main.js           # Client interactions & modal logic
├── seed.js                   # Initial data seeder (Admin + sample tutors)
├── test-flow.js              # Automated end-to-end integration test
├── .env                      # Environment configuration
├── server.js                 # Express server entry point
└── package.json
```

---

## 🚀 How to Run the Project

### 1. Start MongoDB
Ensure MongoDB is running locally:
```powershell
mongod --dbpath ./data
```
*(Or specify your MongoDB Atlas URI in `.env`)*

### 2. Seed Initial Admin & Sample Tutors
```bash
npm run seed
```
This automatically seeds:
- Default Admin account
- Sample verified tutors in various subjects and localities
- Sample pending tutor applications for testing

### 3. Start the Web Server
```bash
npm start
```
Open your browser at: **`http://localhost:3000`**

---

## 🔑 Default Login Credentials

### 🛡️ Admin Portal:
- URL: `http://localhost:3000/admin/login`
- Email: `admin@tutorconnect.com`
- Password: `admin123`

### 👨‍🏫 Sample Verified Tutor:
- URL: `http://localhost:3000/tutor/login`
- Email: `rajesh.sharma@example.com`
- Password: `password123`

### 👨‍🏫 Sample Pending Tutor (For Testing Admin Verification):
- Email: `suresh.patel@example.com`
- Password: `password123`

---

## 🧪 Run Automated Tests
```bash
npm test
```
Tests the complete end-to-end flow: Registration $\rightarrow$ Admin Review $\rightarrow$ Zoom Interview Email dispatch $\rightarrow$ Admin Verification $\rightarrow$ Publication to Front Page.
