# Local Setup Instructions

Welcome to the Car Repair Management System project! Follow these instructions to get the project fully running on your local machine.

## 🛠 Prerequisites

Before you begin, ensure you have the following installed on your system:
1. **[WAMP Server](https://www.wampserver.com/en/)** (or XAMPP/MAMP) with Apache and PHP 8+.
2. **[PostgreSQL](https://www.postgresql.org/download/)** (Database).
3. **[Node.js and npm](https://nodejs.org/)** (for the React/Vite frontend).
4. **[Composer](https://getcomposer.org/)** (for PHP dependencies).

---

## 🚀 Step-by-Step Setup

### 1. Project Placement
Since this project uses a PHP backend, the project folder must be located inside your local web server's document root.
- For WAMP, place the `CarRepairSystem` folder inside `C:\wamp64\www\`.
- Your project path should be `C:\wamp64\www\CarRepairSystem`.

### 2. Database Setup (PostgreSQL)
1. Open pgAdmin or your preferred PostgreSQL client.
2. Create a new database named `carrepairshop`.
3. Open the file `database/schema_postgres.sql` and execute the script inside the newly created `carrepairshop` database to set up the tables.

### 3. Backend Setup (PHP API)
1. **Environment Variables:**
   - In the root of the project (`C:\wamp64\www\CarRepairSystem`), duplicate the `.env.example` file and rename the copy to `.env`.
   - Open `.env` and verify the PostgreSQL database credentials. By default, it expects:
     ```env
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=carrepairshop
     DB_USER=postgres
     DB_PASSWORD=123
     ```
   - *Update `DB_PASSWORD` (and other details) if your local PostgreSQL setup uses different credentials.*

2. **Install Dependencies:**
   - Open your terminal or command prompt.
   - Navigate to the `api` directory:
     ```bash
     cd C:\wamp64\www\CarRepairSystem\api
     ```
   - Run Composer to install PHP packages:
     ```bash
     composer install
     ```

3. **PHP Configuration:**
   - Ensure your WAMP server has the PostgreSQL PDO extension enabled.
   - Left-click the WAMP icon in the system tray -> **PHP** -> **PHP Extensions** -> ensure `pdo_pgsql` and `pgsql` are checked/enabled.
   - Restart WAMP all services to apply changes.

### 4. Frontend Setup (React / Vite)
1. **Environment Variables:**
   - Navigate to the frontend directory: `CarRepairShop`.
   - Duplicate `CarRepairShop/.env.example` and rename it to `.env`.
   - Open `.env` and set the `VITE_API_URL` to point to your local WAMP server's API path:
     ```env
     VITE_API_URL=http://localhost/CarRepairSystem/api
     ```

2. **Install Dependencies and Run:**
   - In your terminal, navigate to the **root project directory** (`C:\wamp64\www\CarRepairSystem`):
     ```bash
     cd C:\wamp64\www\CarRepairSystem
     ```
   - Install the root dependencies (which include `concurrently` for running both servers):
     ```bash
     npm install
     ```
   - Make sure you also install the frontend dependencies if you haven't yet:
     ```bash
     cd CarRepairShop
     npm install
     cd ..
     ```
   - Start BOTH the PHP development server and the React frontend simultaneously:
     ```bash
     npm run dev
     ```

---

## 🎉 Accessing the Application

- **Frontend Application:** Open your browser and navigate to [http://localhost:5173](http://localhost:5173).
- **Backend API:** With the `npm run dev` script, the API runs independently on `http://localhost:8000` (you can update `VITE_API_URL=http://localhost:8000` in `CarRepairShop/.env` if it's not connecting).

