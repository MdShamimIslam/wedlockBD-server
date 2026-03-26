# 💒 WedlockBD - API Service

Welcome to the backend infrastructure of **WedlockBD**, a sophisticated matrimonial system handling everything from user profile analytics to Stripe webhook verifications. This RESTful API is built with Node.js and Express.

## 🌟 Key Features & Systems

*   **Robust Database Architecture:** Scalable MongoDB schema storing dynamic profiles, favorites arrays, success stories, and metrics.
*   **Secure Stateless Authentication:** JWT token generation and highly secure middleware guards for Admin & User routes.
*   **Stripe Webhook Idempotency:** Implements "at-least-once" delivery protection with MongoDB `$setOnInsert` commands and randomized asynchronous offset delays to definitively prevent race-condition database duplicates on redundant webhook events.
*   **Premium Feature Controls:** APIs strictly restrict contact information unmasking to users with successfully recorded "approved" statuses in the `requestCollection`.
*   **Dashboard Aggregations:** Complex `.aggregate()` pipelines computing total revenue, active profiles, boys vs. girls ratio, and marriage success rates.

## 🛠️ Technology Stack

*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js
*   **Database:** MongoDB via official `mongodb` Native Node Driver (Direct Queries and Aggregation)
*   **Payments:** Stripe Node library
*   **Security:** JSON Web Tokens (JWT) for route authorization & CORS configuration.
*   **Environment Config:** `dotenv`

## 🚀 Getting Started (Local Setup)

The API is ready to accept HTTP traffic after exactly following these steps.

### 1. Prerequisites
*   Node.js (v18+ recommended)
*   NPM or Yarn
*   A running MongoDB Atlas Cluster or Local Database
*   Stripe CLI (Absolutely required for local testing of payment logic)

### 2. Installation
Navigate into the server directory and install dependencies:
```bash
cd server
npm install
```

### 3. Environment Variables Structure
Create an `.env` file in the root of the `server` directory and add:
```env
PORT=5000
DB_URI=mongodb+srv://<username>:<password>@cluster/
SECRET_TOKEN=your_strong_jwt_signing_secret

# Server Stripe Configuration
STRIPE_SK_KEY=sk_test_your_secret_stripe_api_key

# Very Important for Local Development (Must use `stripe listen` generated key, NOT the dashboard key!)
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_cli_webhook_secret

# The Frontend URL (Needed for Stripe redirect success/cancel URLs)
# (During local development it MUST be: http://localhost:5173, NOT the deployed link)
CLIENT_SITE_URL=http://localhost:5173
```

### 4. Simulating Stripe Webhooks Locally
Because `localhost` is not publicly accessible via the Internet, Stripe's servers cannot ping your `/webhook` endpoint when a test user successfully pays. 
To proxy successful payments to the local webhook endpoint:
1. Open a **second terminal**.
2. Run the Stripe CLI forwarder:
   ```bash
   stripe listen --forward-to localhost:5000/webhook
   ```
3. Copy the output signature secret `whsec_...` and set it as `STRIPE_WEBHOOK_SECRET` in `.env`.
4. **Restart the Node server entirely (Ctrl+C and `npm run dev`) for the variable to apply!**

### 5. Running the Backend API
Start the development server using nodemon:
```bash
npm run dev
```
The server will boot at `http://localhost:5000` and confirm a successful MongoDB connection.

## 📦 Deployment Protocol
When deploying the `server` to production (e.g. Vercel, Render, Heroku):
1. Navigate to your hosting provider's Environment Variables tab.
2. Enter `DB_URI`, `SECRET_TOKEN`, `STRIPE_SK_KEY`.
3. Update `CLIENT_SITE_URL` to your production frontend domain (e.g. `https://wedlockbd-fbc3e.web.app`).
4. Critically: Update `STRIPE_WEBHOOK_SECRET` to the actual "Signing Secret" found inside the "Webhooks" tab of your Stripe Dashboard.
