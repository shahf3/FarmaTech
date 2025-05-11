# FarmaTech 💊🔗

**FarmaTech** is a blockchain-backed pharmaceutical supply chain monitoring system built using **Hyperledger Fabric**, **React.js**, **Node.js**, and **MongoDB**. It improves trust and transparency in the medicine supply chain by allowing stakeholders to track, verify, and secure pharmaceutical products — from manufacturer to consumer.

---

## 🚀 Features

### 🏭 Manufacturers
- Register and manage medicines
- Generate tamper-proof QR codes
- Track supply chain activity
- Register distributors and regulators
- Communicate securely with stakeholders

### 🚚 Distributors & Regulators
- Scan and update medicine status
- View and manage inventory
- Monitor delivery history
- Flag suspicious products
- Communicate with manufacturers

### 👤 Consumers
- Scan QR codes without logging in
- Verify authenticity of medicines
- View medicine origin, batch info, and safety status
- Claim medicine to prevent re-scans (anti-counterfeit)

---

## 🛠️ Technologies Used

- **Frontend**: React.js (with MaterialUI, Framer Motion)
- **Backend**: Node.js, Express, JWT Auth, SendGrid
- **Blockchain**: Hyperledger Fabric (chaincode in Node.js)
- **Database**: MongoDB with Mongoose
- **Security**: Role-based access control (RBAC), TLS, HMAC signatures

---

## 🧱 System Architecture

- **Client Layer**: React dashboards for each role
- **Server Layer**: RESTful APIs for medicine, user, and QR management
- **Blockchain Layer**: Hyperledger Fabric smart contracts handle immutable supply chain data
- **Data Layer**: MongoDB stores user profiles, messages, and QR scans off-chain

---

## 🔐 Role-Based Access

- **Manufacturers**: Full control (register, update, assign, communicate)
- **Distributors**: Track and verify assigned medicines
- **Regulators**: Approve, monitor, and audit supply chain actions
- **Consumers**: Public QR verification and claim access only

---

## 🧪 Testing

- **Backend Unit Tests**: [Jest] for auth, medicine routes, and notification logic
- **Chaincode Tests**: [Mocha/Chai] validate blockchain functions
- **Frontend Tests**: Integration tests with mock data
- **Integration Tests**: End-to-end API flow using shell scripts
- **Blockchain Stress Tests**: 60,000+ simulated transactions using custom JS scripts

---

## 📦 Installation

1. Clone the repo
2. Install dependencies for backend and frontend
3. Start MongoDB and Hyperledger Fabric (Docker-based)
4. Use `registerUser.js` to enroll wallets
5. Run the project with:

```bash
# Backend
cd fabric-test-app
npm install
node enrollAdmin.js
node registerUser.js
npm start

# Frontend
cd react-frontend
npm install
npm start
