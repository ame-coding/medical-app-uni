# Medisphere

A secure and robust full-stack application designed to help users manage their medical records and health reminders efficiently. This project features distinct user and admin roles, a clean user interface, and a secure backend built with Express.js and SQLite.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)

## Table of Contents

- [Key Features](#key-features)
  - [User Features](#user-features)
  - [Admin Features](#admin-features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Setup and Installation](#setup-and-installation)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Key Features

### User Features

* **Secure Authentication:** User login and authentication system using JWT for session management and bcrypt for password security.
* **Intuitive Dashboard:** A clean home screen that welcomes the user, displays a "Health Score", and provides quick actions for common tasks.
* **CRUD Operations for Records:** Users can create, view, and delete their medical records. All changes are saved to the server in real-time.
* **Reminders:** Users can create and manage reminders for medications and appointments to stay on top of their health schedule.
* **Dynamic Data:** All user-facing data, including records and reminders, is fetched dynamically from the server.
* **Simple Navigation:** The UI is designed with three clear tabs for easy navigation between Records, Reminders, and the user's Profile.

### Admin Features

* **Dedicated Admin Dashboard:** A separate, secure interface for administrators to manage the application.
* **User & Record Management:** Admins have the ability to view all users and their associated medical records.
* **Role-Based Access Control:** The system has role-based access implemented to ensure that only authorized admins can access management controls.
* **System Overview:** The dashboard provides a high-level overview with key metrics like total users, total records, and active reminders.
* **Server Maintenance:** Admins can control system-wide settings like enabling notifications or putting the app into maintenance mode.

## Tech Stack

| Category      | Technology                                    |
| :------------ | :-------------------------------------------- |
| **Frontend** | React Native, Expo, TypeScript              |
| **Backend** | Express.js, SQLite                          |
| **Security** | JWT (JSON Web Tokens), bcrypt                 |
| **Utilities** | Nodemon, Dotenv                               |

## Architecture Overview

The application follows a standard client-server architecture. The frontend (a React Native mobile app built with Expo) communicates with a backend Express.js server. The server handles all business logic, including user authentication, and performs CRUD operations on an SQLite database. User sessions are securely managed using JWT, and all sensitive data is protected.

## Setup and Installation

To get a local copy up and running, follow these simple steps.

### Backend Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
    ```
2.  **Navigate to the backend directory:**
    ```sh
    cd your-repository-name/express-serv
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```
4.  **Create a `.env` file** in the backend root directory. This is used for environment variables. Add the following:
    ```
    PORT=4000
    JWT_SECRET=your_super_secret_key
    ```
5.  **Start the server:**
    ```sh
    nodemon index.js
    ```
    The server will be running on `http://localhost:4000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```sh
    cd your-repository-name/frontend-directory-name
    ```
2.  **Install NPM packages:**
    ```sh
    npm install
    ```
3.  **Start the Expo development server:**
    ```sh
    npx expo start
    ```
    This will open the Expo developer tools in your browser. You can then run the app on a mobile simulator or scan the QR code with the Expo Go app on your phone.

## API Endpoints

The core API routes are configured for user authentication and record management.

| HTTP Method | Endpoint          | Description                                    |
| :---------- | :---------------- | :--------------------------------------------- |
| `POST`      | `/api/auth/login` | Authenticates a user and returns a JWT.        |
| `POST`      | `/api/auth/register` | Creates a new user account.                   |
| `GET`       | `/api/records`    | Fetches all medical records for the logged-in user. |
| `POST`      | `/api/records`    | Creates a new medical record.                  |
| `DELETE`    | `/api/records/:id` | Deletes a specific medical record.             |

## License

Distributed under the MIT License. See `LICENSE` for more information.
