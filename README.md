# 🚀 Backend Ledger: Full-Stack Banking & Ledger System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Nodemailer](https://img.shields.io/badge/Nodemailer-339933?style=for-the-badge&logo=nodemailer&logoColor=white)

An advanced, minimal, and modern **full-stack banking web application** built with React, Tailwind CSS, shadcn/ui, Node.js, Express, and MongoDB. Features secure OTP authentication, tab-isolated session state, live account balances derived from double-entry ledger entries, Recharts data analytics, a dedicated fund transfer workflow, Excel statement exports, and a System Admin workspace.

</div>

---

## 🗺️ System Architecture

```mermaid
graph TD
    Client[React Client / Vite + Tailwind + shadcn] -->|1. Request / Auth / Transfer| Backend[Express Backend / Node.js]
    Backend -->|2. Query / Ledger Aggregation| Database[(MongoDB / Mongoose ODM)]
    Backend -->|3. Trigger OTP & Transaction Notifications| EmailService[Nodemailer OAuth2 Gmail Service]
    Backend -->|4. Generate .xlsx Workbook| ExcelService[ExcelJS Streaming Exporter]
    ExcelService -->|5. Download Stream| Client
    Database -->|6. Calculate Realtime Balances| BalanceEngine["getBalance() - Ledger Aggregation"]
    BalanceEngine -->|7. Balance Payload| Backend
    Backend -->|8. Signed JWT & Bearer Authorization| Client
```

---

## ✨ Core Features

### 🔐 Secure Authentication & Verification
* **OTP Sign-Up & Password Reset**: 6-digit email OTP verification powered by Nodemailer & Gmail OAuth2.
* **Inline Validation**: React Hook Form + Zod validation with live password strength indicators and criteria checklists.
* **Token Blacklisting**: Logout invalidates JWT tokens via a MongoDB token blacklist schema.
* **Tab-Isolated Sessions**: Uses `sessionStorage` and an Axios `Authorization: Bearer <token>` interceptor to allow multiple accounts to run concurrently in separate browser tabs without cross-contamination.

### 📊 Modern Dashboard & Recharts Analytics
* **Account Overview Card**: Shows masked account number, copy-to-clipboard, holder details, status badge, and balance visibility toggle.
* **Live Stat Indicators**: Real-time cards for Current Balance, Total Transactions count, Last Transaction timestamp, and Account Status.
* **Cash Flow Trend (`AreaChart`)**: Visualizes Credits (received) vs Debits (sent) over time using Recharts.
* **Fund Distribution (`PieChart`)**: Interactive donut chart displaying received vs sent fund ratios.

### 💸 Instant Fund Transfer Workflow
* **Live Validation**: Pre-submission checks for account existence, active status, and available balance.
* **Confirmation Dialog**: Detailed review modal before executing fund transfers.
* **Idempotency Protection**: Unique idempotency keys prevent duplicate charges.

### 📜 Transaction History & Audit (`/transactions`)
* **Live Search & Filter**: Search transactions by ID or account ID, with dropdown filters for Type (Credit/Debit) and Status (Completed, Pending, Failed, Reversed).
* **Audit Modal**: Click any transaction row to view complete details, full account IDs, timestamps, and idempotency keys.

### 📄 Account Statements (`/statements`)
* **Excel (.xlsx) Export**: One-click download of official account statements generated via ExcelJS.

### 🛡️ System Admin Workspace (`/admin-dashboard`)
* **Role-Based Access**: System users (`systemUser: true`) are automatically routed to the Admin Dashboard upon login.
* **Unlimited Capital Disbursement**: Admin workspace allows initial fund seeding via `/api/transactions/system/initial-funds` without balance constraints.

---

## 🔌 Core API Specifications

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Registers a new user account | No |
| **POST** | `/api/auth/verify` | Verifies user account using SMTP OTP | No |
| **POST** | `/api/auth/login` | Authenticates user credentials and sets token cookie | No |
| **POST** | `/api/auth/logout` | Clears local cookies and blacklists the token | Yes |
| **POST** | `/api/auth/resend` | Resends account activation OTP code | No |
| **POST** | `/api/auth/resetotp` | Generates a password recovery OTP code | No |
| **POST** | `/api/auth/resetpass` | Verifies recovery OTP and updates user password | No |
| **POST** | `/api/accounts` | Creates a new customer bank account | Yes |
| **GET** | `/api/accounts` | Lists all accounts owned by the authenticated user | Yes |
| **GET** | `/api/accounts/balance/:accountId` | Performs ledger aggregates to calculate live balance | Yes |
| **POST** | `/api/transactions` | Initiates fund transfers between accounts | Yes |
| **POST** | `/api/transactions/system/initial-funds` | Dispatches initial funds from system treasury | Yes (Admin) |
| **GET** | `/api/statements/:accountId` | Generates and streams account statement Excel book | Yes |
| **GET** | `/api/statements/history/:accountId` | Retrieves full transaction lists for analytics & charts | Yes |

---

## 🔄 Detailed Feature & API Workflows

This section maps out step-by-step data flows for key backend features, connecting frontend states, backend controllers, middleware guards, and MongoDB schema queries.

### 🔑 1. User Authentication & Verification Flow
Manages registration, secure OTP validation, sign-ins, and session blacklists.

```mermaid
graph TD
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:#fff,font-weight:bold;
    classDef server fill:#10b981,stroke:#047857,color:#fff,font-weight:bold;
    classDef db fill:#f59e0b,stroke:#b45309,color:#fff,font-weight:bold;
    
    Start["User Auth Portal Selection"] --> Route{Select Action}
    
    %% Register
    Route -->|Register| Register["POST /api/auth/register"]:::server
    Register --> FindUser{"Check email in userModel"}:::db
    FindUser -->|Registered| RegFail["Return 400: Email already exists"]:::server
    FindUser -->|New| SaveOtp["Generate OTP code & save pending user record"]:::db
    SaveOtp --> SendMail["Send email validation code via SMTP service"]:::server
    SendMail --> RegSuccess["Return 201: Verification pending"]:::server
    
    %% Verify OTP
    Route -->|Verify OTP| Verify["POST /api/auth/verify"]:::server
    Verify --> CheckOtp{"Validate OTP & Expiry in userModel"}:::db
    CheckOtp -->|Incorrect / Expired| VerifyFail["Return 400: Invalid OTP details"]:::server
    CheckOtp -->|Correct| ActivateUser["Set isVerified = true in userModel"]:::db
    ActivateUser --> VerifySuccess["Return 200: Account activated"]:::server
    
    %% Login
    Route -->|Login| Login["POST /api/auth/login"]:::server
    Login --> LoadUser{"Fetch user from DB by email"}:::db
    LoadUser -->|Not Verified| LoginUnverified["Return 400: Account not verified"]:::server
    LoadUser -->|Verified| CompareHash{"Compare hash via bcrypt"}:::db
    CompareHash -->|Match| SetCookie["Generate JWT Token & set HTTP-only cookie"]:::server
    CompareHash -->|Mismatch| LoginFail["Return 400: Invalid credentials"]:::server
    SetCookie --> LoginSuccess["Return 200: Auth session active"]:::server
    
    %% Logout
    Route -->|Logout| Logout["POST /api/auth/logout"]:::server
    Logout --> InvalidateToken["Add active token to tokenBlackListModel"]:::db
    InvalidateToken --> ClearCookie["Clear browser token cookies"]:::server
    ClearCookie --> LogoutSuccess["Return 200: Session terminated"]:::server

    class Start,RegFail,RegSuccess,VerifyFail,VerifySuccess,LoginUnverified,LoginFail,LoginSuccess,LogoutSuccess client;
```

---

### 💸 2. Transaction Processing & Isolation Flow
Examines isolation checks, debit validation, and updates to the ledger.

```mermaid
graph TD
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:#fff,font-weight:bold;
    classDef server fill:#10b981,stroke:#047857,color:#fff,font-weight:bold;
    classDef db fill:#f59e0b,stroke:#b45309,color:#fff,font-weight:bold;
    
    Start["Initiate Fund Transfer"] --> Guard["authMiddleware.authMiddleware: Verify JWT"]:::server
    Guard --> POST_Txn["POST /api/transactions"]:::server
    POST_Txn --> CheckSelf{"Check if fromAccount == toAccount"}:::server
    CheckSelf -->|Yes| FailSelf["Return 400: Cannot transfer to yourself"]:::server
    CheckSelf -->|No| FindAccounts{"Load sender & recipient accounts"}:::db
    
    FindAccounts -->|Missing or Closed| FailStatus["Return 400: Accounts invalid"]:::server
    FindAccounts -->|Active| CalcBalance["Run aggregation: account.getBalance()"]:::db
    
    CalcBalance --> CompareFunds{"Check balance >= amount"}
    CompareFunds -->|No| FailBalance["Return 400: Insufficient balance"]:::server
    CompareFunds -->|Yes| CreateTxn["Create transactionModel entry (status: Pending)"]:::db
    
    CreateTxn --> WriteLedger["Write atomic ledger entries for debit and credit"]:::db
    
    WriteLedger --> CompleteTxn["Set transactionModel status = Completed"]:::db
    CompleteTxn --> TxnSuccess["Return 201: Transfer successful"]:::server

    class Start,FailSelf,FailStatus,FailBalance,TxnSuccess client;
```

---

### 📑 3. Live Statement Workbook Exporter Flow
Aggregates ledger rows and streams formatted spreadsheets dynamically.

```mermaid
graph TD
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:#fff,font-weight:bold;
    classDef server fill:#10b981,stroke:#047857,color:#fff,font-weight:bold;
    classDef db fill:#f59e0b,stroke:#b45309,color:#fff,font-weight:bold;
    
    Start["Request Statement Export"] --> Guard["authMiddleware.authMiddleware"]:::server
    Guard --> GET_Statement["GET /api/statements/:accountId"]:::server
    GET_Statement --> QueryLedger["Query ledgerModel populated with transaction details"]:::db
    QueryLedger --> FormatRows["Format statement credits, debits, and headers"]:::server
    FormatRows --> StreamExcel["Stream binary using exceljs WorkbookWriter"]:::server
    StreamExcel --> Download["Browser download: statement_accountId.xlsx"]:::client

    class Start,Download client;
```

---

### 🛡️ 4. System Treasury Capital Injection Flow
Injects initial funds from the system treasury account to client accounts.

```mermaid
graph TD
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:#fff,font-weight:bold;
    classDef server fill:#10b981,stroke:#047857,color:#fff,font-weight:bold;
    classDef db fill:#f59e0b,stroke:#b45309,color:#fff,font-weight:bold;
    
    Start["Admin Panel: Dispatch Capital"] --> AdminGuard["authMiddleware.authSystemUserMiddleware: Verify System Email"]:::server
    AdminGuard --> POST_Funds["POST /api/transactions/system/initial-funds"]:::server
    POST_Funds --> FindTreasury{"Query systemUser accounts"}:::db
    
    FindTreasury -->|None| CreateTreasury["Create new active system treasury account"]:::db
    FindTreasury -->|Exists| FetchRecipient{"Load target client account ID"}:::db
    CreateTreasury --> FetchRecipient
    
    FetchRecipient -->|Invalid Account| FailRecip["Return 400: Recipient account invalid"]:::server
    FetchRecipient -->|Valid| InitTxn["Save transactionModel (from: Treasury, to: Client)"]:::db
    
    InitTxn --> WriteLedger["Write ledger entries for treasury and recipient"]:::db
    
    WriteLedger --> ProvisionSuccess["Return 200: Provision dispatched successfully"]:::server

    class Start,FailRecip,ProvisionSuccess client;
```

---

## 📁 Repository Directory Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/              # Database configuration
│   │   │   └── db.js
│   │   ├── contollers/          # API controllers
│   │   │   ├── account.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── statement.controller.js
│   │   │   └── transaction.controller.js
│   │   ├── middlewares/         # Middleware & Guards
│   │   │   └── auth.middleware.js
│   │   ├── models/              # Mongoose models
│   │   │   ├── accountModel.js
│   │   │   ├── ledger.Model.js
│   │   │   ├── tokenBlackListModel.js
│   │   │   ├── transaction.model.js
│   │   │   └── userModel.js
│   │   ├── routes/              # Mounted Express routes
│   │   │   ├── account.routes.js
│   │   │   ├── auth.js
│   │   │   ├── statement.routes.js
│   │   │   └── transcation.routes.js
│   │   ├── services/            # Services
│   │   │   ├── email.service.js
│   │   │   └── uuid.service.js
│   │   └── index.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── AppLayout.jsx  # App shell with Sidebar & Navbar
    │   │   └── ui/                # shadcn/ui primitives (Button, Card, Dialog, Toast...)
    │   ├── hooks/
    │   │   └── use-toast.js
    │   ├── pages/
    │   │   ├── Register.jsx
    │   │   ├── VerifyOtp.jsx
    │   │   ├── Login.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── ResetPassword.jsx
    │   │   ├── Dashboard.jsx      # Dashboard with Recharts
    │   │   ├── Transfer.jsx       # Transfer Money
    │   │   ├── Transactions.jsx   # Transaction History & Search
    │   │   ├── Statements.jsx     # Excel Export
    │   │   └── AdminDashboard.jsx # System Admin workspace
    │   ├── services/
    │   │   └── api.js             # Axios client with interceptors
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css              # Purple theme & design system
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Quick Start

### 1. Clone & Configure Backend
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/`:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
Jwt_Secret=your_jwt_secret
EMAIL_USER=your_email@gmail.com
CLIENT_ID=your_oauth_client_id
CLIENT_SECRET=your_oauth_client_secret
REFRESH_TOKEN=your_oauth_refresh_token
```

Start the backend:
```bash
npm start
```

### 2. Configure & Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
