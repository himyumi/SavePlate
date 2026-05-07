# SavePlate

A food inventory and meal planning app with MongoDB backend.

## Setup

1. **Install Node.js** (if not already installed)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up MongoDB:**
   - Option 1: Local MongoDB
     - Install MongoDB locally
     - Use default URI: `mongodb://localhost:27017/saveplate`
   
   - Option 2: MongoDB Atlas (cloud)
     - Create account at mongodb.com
     - Create cluster and database
     - Get connection string
     - Update `.env` file

4. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MongoDB URI.

5. **Run the server:**
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

6. **Open the app:**
   - Frontend: Open `index.html` in browser
   - Server runs on `http://localhost:4000`

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User signup
- `GET /api/inventory` - Get user's inventory
- `POST /api/inventory` - Add inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/donations` - Get donations
- `GET /api/meals` - Get user's meals
- `POST /api/meals` - Update meals
- `GET /api/chart` - Get chart data

## Notes

- Passwords are stored in plain text (for demo only). In production, use bcrypt.
- Authentication uses simple header-based user ID (not secure). Use JWT in production.
- Frontend loads data from API on page load.