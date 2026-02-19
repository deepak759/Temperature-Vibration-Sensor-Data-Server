# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: <token>
```

The token is obtained after successful login and is valid for 7 days.

---

## User Roles

- **godadmin**: Full system access - can manage all plants, users, and assign admins
- **admin**: Plant-specific admin - can manage users and alert emails for assigned plants
- **viewer**: Read-only access - can view dashboard data for assigned plants

---

## 1. Authentication Routes (`/api/auth`)

### 1.1 Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "OTP sent to email",
  "userId": "507f1f77bcf86cd799439011"
}
```

**Error Responses:**
- `400` - User already exists
- `500` - Server error

---

### 1.2 Verify OTP
**POST** `/api/auth/verify-otp`

Verify email address using OTP sent during registration.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": 123456
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Responses:**
- `400` - Invalid OTP or OTP expired
- `404` - User not found

---

### 1.3 Login
**POST** `/api/auth/login`

Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer",
    "plantAccess": [
      {
        "plantId": "507f1f77bcf86cd799439012",
        "plantName": "Plant A",
        "accessType": "viewer"
      }
    ]
  }
}
```

**Error Responses:**
- `400` - Email not verified or invalid password
- `404` - User not found

---

### 1.4 Resend OTP
**POST** `/api/auth/resend-otp`

Resend OTP to user's email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "OTP resent"
}
```

**Error Responses:**
- `400` - Already verified
- `404` - User not found

---

## 2. Plant Routes (`/api/plants`)

**All routes require authentication.**

### 2.1 Get All Plants
**GET** `/api/plants`

Get list of all active plants. **Godadmin only.**

**Headers:**
```
Authorization: <token>
```

**Response (200):**
```json
{
  "message": "Plants retrieved successfully",
  "plants": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Plant A",
      "description": "Main production plant",
      "location": "New York",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "admin",
        "email": "admin@example.com"
      },
      "isActive": true,
      "createdAt": "2026-02-19T10:00:00.000Z",
      "updatedAt": "2026-02-19T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Godadmin access required
- `500` - Server error

---

### 2.2 Get Plant by ID
**GET** `/api/plants/:plantId`

Get details of a specific plant.

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant

**Response (200):**
```json
{
  "message": "Plant retrieved successfully",
  "plant": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Plant A",
    "description": "Main production plant",
    "location": "New York",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "admin",
      "email": "admin@example.com"
    },
    "isActive": true,
    "createdAt": "2026-02-19T10:00:00.000Z",
    "updatedAt": "2026-02-19T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - No token provided
- `404` - Plant not found
- `500` - Server error

---

### 2.3 Create Plant
**POST** `/api/plants`

Create a new plant. **Godadmin only.**

**Headers:**
```
Authorization: <token>
```

**Request Body:**
```json
{
  "name": "Plant B",
  "description": "Secondary production plant",
  "location": "Los Angeles"
}
```

**Required Fields:**
- `name` - Plant name (must be unique)

**Optional Fields:**
- `description` - Plant description
- `location` - Plant location

**Response (201):**
```json
{
  "message": "Plant created successfully",
  "plant": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Plant B",
    "description": "Secondary production plant",
    "location": "Los Angeles",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "admin",
      "email": "admin@example.com"
    },
    "isActive": true,
    "createdAt": "2026-02-19T10:00:00.000Z",
    "updatedAt": "2026-02-19T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Plant name already exists or missing required fields
- `401` - No token provided
- `403` - Godadmin access required
- `500` - Server error

---

### 2.4 Update Plant
**PUT** `/api/plants/:plantId`

Update plant information. **Godadmin only.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant

**Request Body:**
```json
{
  "name": "Plant B Updated",
  "description": "Updated description",
  "location": "San Francisco",
  "isActive": true
}
```

**All fields are optional.** Only include fields you want to update.

**Response (200):**
```json
{
  "message": "Plant updated successfully",
  "plant": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Plant B Updated",
    "description": "Updated description",
    "location": "San Francisco",
    "isActive": true,
    "createdAt": "2026-02-19T10:00:00.000Z",
    "updatedAt": "2026-02-19T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Godadmin access required
- `404` - Plant not found
- `500` - Server error

---

### 2.5 Delete Plant
**DELETE** `/api/plants/:plantId`

Soft delete a plant (sets isActive to false). **Godadmin only.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant

**Response (200):**
```json
{
  "message": "Plant deleted successfully"
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Godadmin access required
- `404` - Plant not found
- `500` - Server error

---

## 3. Admin Routes (`/api/admin`)

**All routes require authentication and admin access to the specified plant.**

### 3.1 Add Viewer User
**POST** `/api/admin/plants/:plantId/users`

Add a user with viewer access to a plant. **Admin access required for the plant.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant

**Request Body:**
```json
{
  "username": "viewer_user",
  "email": "viewer@example.com",
  "password": "password123"
}
```

**Required Fields:**
- `username` - Username (must be unique)
- `email` - Email address (must be unique)
- `password` - User password

**Response (201):**
```json
{
  "message": "Viewer user created successfully. OTP sent to email",
  "user": {
    "id": "507f1f77bcf86cd799439014",
    "username": "viewer_user",
    "email": "viewer@example.com",
    "role": "viewer"
  }
}
```

**Note:** If user already exists, plant access will be added instead:
```json
{
  "message": "User already exists. Plant access added successfully",
  "user": {
    "id": "507f1f77bcf86cd799439014",
    "username": "viewer_user",
    "email": "viewer@example.com",
    "role": "viewer"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `401` - No token provided
- `403` - Admin access required for this plant
- `404` - Plant not found
- `500` - Server error

---

### 3.2 Get Plant Users
**GET** `/api/admin/plants/:plantId/users`

Get all users who have access to a specific plant. **Admin access required for the plant.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant

**Response (200):**
```json
{
  "message": "Plant users retrieved successfully",
  "plant": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Plant A"
  },
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "admin",
      "plantAccess": "admin",
      "emailVerified": true,
      "createdAt": "2026-02-19T10:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "username": "viewer_user",
      "email": "viewer@example.com",
      "role": "viewer",
      "plantAccess": "viewer",
      "emailVerified": true,
      "createdAt": "2026-02-19T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Admin access required for this plant
- `404` - Plant not found
- `500` - Server error

---

### 3.3 Add Alert Email
**POST** `/api/admin/plants/:plantId/alert-emails`

Add an email address to receive alerts when vibration exceeds threshold. **Admin access required for the plant.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant

**Request Body:**
```json
{
  "email": "alerts@example.com"
}
```

**Required Fields:**
- `email` - Email address to receive alerts

**Response (201):**
```json
{
  "message": "Alert email added successfully",
  "alertEmail": {
    "_id": "507f1f77bcf86cd799439015",
    "plantId": "507f1f77bcf86cd799439012",
    "email": "alerts@example.com",
    "addedBy": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "admin_user",
      "email": "admin@example.com"
    },
    "isActive": true,
    "createdAt": "2026-02-19T12:00:00.000Z",
    "updatedAt": "2026-02-19T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Email already exists for this plant or missing email
- `401` - No token provided
- `403` - Admin access required for this plant
- `404` - Plant not found
- `500` - Server error

---

### 3.4 Get Plant Alert Emails
**GET** `/api/admin/plants/:plantId/alert-emails`

Get all active alert emails for a plant. **Admin access required for the plant.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant

**Response (200):**
```json
{
  "message": "Alert emails retrieved successfully",
  "plant": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Plant A"
  },
  "alertEmails": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "plantId": "507f1f77bcf86cd799439012",
      "email": "alerts@example.com",
      "addedBy": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "admin_user",
        "email": "admin@example.com"
      },
      "isActive": true,
      "createdAt": "2026-02-19T12:00:00.000Z",
      "updatedAt": "2026-02-19T12:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Admin access required for this plant
- `404` - Plant not found
- `500` - Server error

---

### 3.5 Remove Alert Email
**DELETE** `/api/admin/plants/:plantId/alert-emails/:alertEmailId`

Remove an alert email from a plant. **Admin access required for the plant.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant
- `alertEmailId` - MongoDB ObjectId of the alert email

**Response (200):**
```json
{
  "message": "Alert email removed successfully"
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Admin access required for this plant
- `404` - Alert email not found
- `500` - Server error

---

## 4. Godadmin Routes (`/api/godadmin`)

**All routes require authentication and godadmin role.**

### 4.1 Get All Users
**GET** `/api/godadmin/users`

Get all users in the system with their plant access details. **Godadmin only.**

**Headers:**
```
Authorization: <token>
```

**Response (200):**
```json
{
  "message": "All users retrieved successfully",
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "godadmin",
      "email": "godadmin@example.com",
      "role": "godadmin",
      "plantAccess": [
        {
          "plantId": "all",
          "plantName": "All Plants",
          "accessType": "godadmin"
        }
      ],
      "emailVerified": true,
      "createdAt": "2026-02-19T10:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "admin",
      "plantAccess": [
        {
          "plantId": "507f1f77bcf86cd799439013",
          "plantName": "Plant A",
          "accessType": "admin"
        }
      ],
      "emailVerified": true,
      "createdAt": "2026-02-19T11:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "username": "viewer_user",
      "email": "viewer@example.com",
      "role": "viewer",
      "plantAccess": [
        {
          "plantId": "507f1f77bcf86cd799439013",
          "plantName": "Plant A",
          "accessType": "viewer"
        }
      ],
      "emailVerified": true,
      "createdAt": "2026-02-19T12:00:00.000Z"
    }
  ],
  "totalUsers": 3
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Godadmin access required
- `500` - Server error

---

### 4.2 Add Admin User
**POST** `/api/godadmin/plants/:plantId/admins`

Add a user as admin for a specific plant. Can create new user or assign existing user. **Godadmin only.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant

**Request Body (Create New User):**
```json
{
  "username": "new_admin",
  "email": "newadmin@example.com",
  "password": "password123"
}
```

**Request Body (Assign Existing User):**
```json
{
  "userId": "507f1f77bcf86cd799439014"
}
```

**Response (201) - New User:**
```json
{
  "message": "Admin user created successfully. OTP sent to email",
  "user": {
    "id": "507f1f77bcf86cd799439016",
    "username": "new_admin",
    "email": "newadmin@example.com",
    "role": "admin",
    "plantAccess": {
      "plantId": "507f1f77bcf86cd799439012",
      "plantName": "Plant A",
      "accessType": "admin"
    }
  }
}
```

**Response (200) - Existing User:**
```json
{
  "message": "User assigned as admin successfully",
  "user": {
    "id": "507f1f77bcf86cd799439014",
    "username": "viewer_user",
    "email": "viewer@example.com",
    "role": "admin",
    "plantAccess": {
      "plantId": "507f1f77bcf86cd799439012",
      "plantName": "Plant A",
      "accessType": "admin"
    }
  }
}
```

**Error Responses:**
- `400` - Missing required fields for new user
- `401` - No token provided
- `403` - Godadmin access required
- `404` - Plant or user not found
- `500` - Server error

---

### 4.3 Remove Admin Access
**DELETE** `/api/godadmin/plants/:plantId/admins/:userId`

Remove admin access from a user for a specific plant. **Godadmin only.**

**Headers:**
```
Authorization: <token>
```

**URL Parameters:**
- `plantId` - MongoDB ObjectId of the plant
- `userId` - MongoDB ObjectId of the user

**Response (200):**
```json
{
  "message": "Admin access removed successfully",
  "user": {
    "id": "507f1f77bcf86cd799439014",
    "username": "admin_user",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Godadmin access required
- `404` - Plant or user not found
- `500` - Server error

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad Request - Invalid input or missing required fields |
| 401 | Unauthorized - No token or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Notes

1. **Authentication**: All routes except `/api/auth/*` require a valid JWT token in the Authorization header.

2. **Role Hierarchy**:
   - **godadmin**: Has access to all routes and can manage everything
   - **admin**: Can manage users and alert emails for plants they have admin access to
   - **viewer**: Read-only access (routes not yet implemented in this documentation)

3. **Plant Access**: Users can have different access levels (admin/viewer) for different plants. This is stored in the `plantAccess` Map field.

4. **Soft Delete**: Plants are soft-deleted (isActive set to false) rather than permanently removed.

5. **Email Verification**: New users must verify their email via OTP before they can login.

6. **Alert Emails**: Alert emails are stored per plant and can be managed by plant admins. These emails will receive notifications when vibration exceeds threshold (implementation depends on vibration service).

---

## Example Usage Flow

1. **Register a new user:**
   ```bash
   POST /api/auth/register
   ```

2. **Verify email with OTP:**
   ```bash
   POST /api/auth/verify-otp
   ```

3. **Login to get token:**
   ```bash
   POST /api/auth/login
   ```

4. **As godadmin, create a plant:**
   ```bash
   POST /api/plants
   Authorization: <godadmin_token>
   ```

5. **As godadmin, assign admin to plant:**
   ```bash
   POST /api/godadmin/plants/:plantId/admins
   Authorization: <godadmin_token>
   ```

6. **As admin, add viewer user:**
   ```bash
   POST /api/admin/plants/:plantId/users
   Authorization: <admin_token>
   ```

7. **As admin, add alert email:**
   ```bash
   POST /api/admin/plants/:plantId/alert-emails
   Authorization: <admin_token>
   ```
