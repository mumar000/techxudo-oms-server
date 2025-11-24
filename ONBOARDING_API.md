# Employee Onboarding API Documentation

## Overview

The employee onboarding system provides a complete workflow for creating employees, sending offer letters, and managing the onboarding process.

## Flow Diagram

```
Admin Creates Employee
        ↓
System Creates Inactive User Account
        ↓
System Creates Onboarding Record with Token
        ↓
System Sends Offer Letter Email (React Email)
        ↓
Employee Receives Email & Clicks Link
        ↓
Employee Reviews Offer
        ↓
    ┌───────┴───────┐
    ↓               ↓
Accept Offer    Reject Offer
    ↓               ↓
Complete Profile    Account Deactivated
    ↓
Upload CNIC & Profile Picture
    ↓
Add Social Links (GitHub/LinkedIn)
    ↓
Set Password
    ↓
Onboarding Complete → Account Activated
```

## Reminder System

- **Day 3**: First reminder email
- **Day 5**: Second reminder email
- **Day 6.5**: Final reminder email
- **Day 7**: Token expires, status → "expired"

## API Endpoints

### 1. Create Employee (Admin Only)

**Endpoint:** `POST /api/onboarding/create-employee`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "designation": "Software Engineer",
  "salary": 50000,
  "phone": "+92-300-1234567",
  "department": "Engineering",
  "joiningDate": "2025-12-01"
}
```

**Required Fields:**
- fullName
- email
- designation
- salary
- phone

**Optional Fields:**
- department
- joiningDate (defaults to 7 days from now)

**Response:**
```json
{
  "success": true,
  "message": "Offer letter sent successfully! Employee will receive an email with onboarding instructions.",
  "data": {
    "employee": {
      "id": "64abc123...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "designation": "Software Engineer",
      "department": "Engineering",
      "salary": 50000,
      "joiningDate": "2025-12-01T00:00:00.000Z"
    },
    "onboarding": {
      "id": "64def456...",
      "status": "pending",
      "expiresAt": "2025-11-24T00:00:00.000Z"
    }
  }
}
```

---

### 2. Get Onboarding Details (Public)

**Endpoint:** `GET /api/onboarding/:token`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "pending",
    "offerDetails": {
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "designation": "Software Engineer",
      "department": "Engineering",
      "salary": 50000,
      "joiningDate": "2025-12-01T00:00:00.000Z",
      "phone": "+92-300-1234567"
    },
    "respondedAt": null,
    "rejectionReason": null,
    "expiresAt": "2025-11-24T00:00:00.000Z"
  }
}
```

**Possible Statuses:**
- `pending` - Offer sent, waiting for response
- `accepted` - Offer accepted, waiting for profile completion
- `rejected` - Offer rejected
- `completed` - Onboarding completed
- `expired` - Token expired
- `revoked` - Offer revoked by admin

---

### 3. Accept Offer (Public)

**Endpoint:** `POST /api/onboarding/:token/accept`

**Response:**
```json
{
  "success": true,
  "message": "Offer accepted successfully! Please complete your onboarding.",
  "data": {
    "status": "accepted"
  }
}
```

---

### 4. Reject Offer (Public)

**Endpoint:** `POST /api/onboarding/:token/reject`

**Request Body:**
```json
{
  "reason": "Accepted another offer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Offer rejected successfully"
}
```

---

### 5. Complete Onboarding (Public)

**Endpoint:** `POST /api/onboarding/:token/complete`

**Request Body:**
```json
{
  "password": "MySecurePass123!",
  "cnicImage": "https://res.cloudinary.com/.../cnic.jpg",
  "avatar": "https://res.cloudinary.com/.../profile.jpg",
  "github": "https://github.com/johndoe",
  "linkedin": "https://linkedin.com/in/johndoe",
  "dateOfBirth": "1995-06-15",
  "address": {
    "street": "123 Main St",
    "city": "Karachi",
    "state": "Sindh",
    "zipCode": "75500",
    "country": "Pakistan"
  },
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Sister",
    "phone": "+92-300-7654321"
  }
}
```

**Required Fields:**
- password (min 6 characters)
- At least one of: github OR linkedin

**Optional Fields:**
- cnicImage (Cloudinary URL from frontend)
- avatar (Cloudinary URL from frontend)
- dateOfBirth
- address
- emergencyContact

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully! You can now login with your credentials.",
  "data": {
    "email": "john.doe@example.com",
    "fullName": "John Doe"
  }
}
```

---

### 6. Get All Onboarding Status (Admin Only)

**Endpoint:** `GET /api/onboarding/admin/status`

**Query Parameters:**
- `status` (optional) - Filter by status
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "onboardings": [
      {
        "_id": "64def456...",
        "employeeId": {
          "_id": "64abc123...",
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "designation": "Software Engineer",
          "department": "Engineering"
        },
        "status": "pending",
        "offerDetails": { ... },
        "tokenExpiry": "2025-11-24T00:00:00.000Z",
        "createdAt": "2025-11-17T00:00:00.000Z",
        "createdBy": {
          "_id": "...",
          "fullName": "Admin User",
          "email": "admin@techxudo.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    },
    "statusCounts": {
      "pending": 15,
      "accepted": 10,
      "completed": 20,
      "rejected": 1,
      "expired": 1
    }
  }
}
```

---

### 7. Revoke Onboarding (Admin Only)

**Endpoint:** `POST /api/onboarding/:id/revoke`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Position no longer available"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding revoked successfully"
}
```

**Notes:**
- Can only revoke onboarding with status: `pending` or `accepted`
- Employee account will be deactivated

---

### 8. Resend Offer Letter (Admin Only)

**Endpoint:** `POST /api/onboarding/:id/resend`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Offer letter resent successfully"
}
```

**Notes:**
- Can only resend for `pending` status
- Generates a new token with extended validity

---

## Email Templates

All emails use **React Email** with modern, professional design:

### Offer Letter Email
- Modern gradient header
- Detailed offer information cards
- Clear call-to-action button
- Next steps checklist
- 7-day expiration warning

### Reminder Emails
- **First Reminder** (Day 3): Gentle reminder
- **Second Reminder** (Day 5): Moderate urgency
- **Final Reminder** (Day 6.5): High urgency

All emails include:
- Consistent branding
- Mobile-responsive design
- Professional typography
- Clear action buttons

---

## Frontend Implementation Guide

### 1. Employee Creation Form

```javascript
const createEmployee = async (formData) => {
  const response = await fetch('/api/onboarding/create-employee', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fullName: formData.fullName,
      email: formData.email,
      designation: formData.designation,
      salary: formData.salary,
      phone: formData.phone,
      department: formData.department,
      joiningDate: formData.joiningDate
    })
  });

  return response.json();
};
```

### 2. Onboarding Landing Page

```javascript
const OnboardingPage = () => {
  const { token } = useParams();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetch(`/api/onboarding/${token}`)
      .then(res => res.json())
      .then(data => setDetails(data.data));
  }, [token]);

  return (
    <div>
      {details?.status === 'pending' && <OfferReview />}
      {details?.status === 'accepted' && <ProfileCompletion />}
    </div>
  );
};
```

### 3. File Upload with Cloudinary (Frontend)

```javascript
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'your_preset');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  const data = await response.json();
  return data.secure_url; // Use this URL in API
};
```

### 4. Complete Onboarding

```javascript
const completeOnboarding = async (token, data) => {
  // Upload files to Cloudinary first
  const cnicUrl = await uploadToCloudinary(data.cnicFile);
  const avatarUrl = await uploadToCloudinary(data.avatarFile);

  const response = await fetch(`/api/onboarding/${token}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password: data.password,
      cnicImage: cnicUrl,
      avatar: avatarUrl,
      github: data.github,
      linkedin: data.linkedin,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      emergencyContact: data.emergencyContact
    })
  });

  return response.json();
};
```

---

## Environment Variables

Required in `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_NAME=Techxudo OMS
FROM_EMAIL=your-email@gmail.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

---

## Cron Jobs

The system automatically:
- Sends reminder emails at 9:00 AM daily (Asia/Karachi timezone)
- Marks expired onboarding as "expired"
- Tracks all sent reminders

To modify the schedule, edit `services/cronJobs.js`:
```javascript
cron.schedule("0 9 * * *", ...) // Daily at 9 AM
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common error codes:
- `400` - Bad request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (admin only)
- `404` - Not found
- `410` - Gone (expired link)
- `500` - Server error

---

## Security Notes

1. **Token Security**: Tokens are hashed (SHA-256) before storage
2. **Password Security**: Passwords are hashed using bcrypt
3. **HTTPS**: Use HTTPS in production for email links
4. **SMTP**: Use app-specific passwords, not main account passwords
5. **Validation**: All inputs are validated server-side

---

## Testing

### Test Employee Creation

```bash
curl -X POST http://localhost:5000/api/onboarding/create-employee \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Employee",
    "email": "test@example.com",
    "designation": "Developer",
    "salary": 50000,
    "phone": "+92-300-1234567"
  }'
```

### Test Get Onboarding Details

```bash
curl http://localhost:5000/api/onboarding/YOUR_TOKEN
```

---

## Support

For issues or questions, contact the development team or check the main README.
