# API Reference

Complete REST API documentation for Cawpile.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a valid NextAuth.js session. Unauthenticated requests return `401 Unauthorized`.

Admin endpoints require `isAdmin: true` in the user record. Unauthorized admin requests return `403 Forbidden`.

---

## Book Search

### Search Books

Multi-provider book search with parallel execution.

```http
GET /api/books/search
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (title, author, ISBN) |
| `limit` | number | No | Max results (default: 20, max: 50) |

**Response:**
```json
{
  "results": [
    {
      "id": "string",
      "title": "string",
      "authors": ["string"],
      "isbn10": "string",
      "isbn13": "string",
      "imageUrl": "string",
      "pageCount": 350,
      "publishedDate": "2024-01-15",
      "description": "string",
      "categories": ["Fiction", "Literary"],
      "source": "google" | "hardcover" | "ibdb" | "local",
      "googleBooksId": "string",
      "hardcoverId": "string",
      "ibdbId": "string",
      "signature": "string"
    }
  ],
  "query": "string",
  "totalResults": 15
}
```

**Provider Weights:**
- Local Database: 10 (highest priority)
- Hardcover: 6
- Google Books: 5
- IBDB: 4

---

## User Books

### Get User's Library

```http
GET /api/user/books
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `WANT_TO_READ`, `READING`, `COMPLETED`, `DNF` |
| `year` | number | Filter by completion year |
| `sortBy` | string | Sort field: `END_DATE`, `START_DATE`, `TITLE`, `DATE_ADDED` |
| `sortOrder` | string | Sort direction: `ASC`, `DESC` |

**Response:**
```json
{
  "books": [
    {
      "id": "string",
      "status": "COMPLETED",
      "format": ["EBOOK"],
      "startDate": "2024-01-01",
      "finishDate": "2024-01-15",
      "progress": 100,
      "currentPage": 350,
      "review": "string",
      "isFavorite": true,
      "edition": {
        "id": "string",
        "title": "string",
        "authors": ["string"],
        "imageUrl": "string",
        "pageCount": 350
      },
      "cawpileRating": {
        "characters": 8,
        "atmosphere": 7,
        "writing": 9,
        "plot": 8,
        "intrigue": 7,
        "logic": 8,
        "enjoyment": 9,
        "average": 8.0,
        "stars": 4,
        "grade": "B+"
      }
    }
  ]
}
```

### Add Book to Library

```http
POST /api/user/books
```

**Request Body:**
```json
{
  "searchResult": {
    "title": "string",
    "authors": ["string"],
    "isbn13": "string",
    "googleBooksId": "string",
    "signature": "string"
  },
  "status": "READING",
  "format": ["EBOOK"],
  "startDate": "2024-01-01",
  "acquisitionMethod": "PURCHASED",
  "bookClubName": "string",
  "readathonName": "string",
  "isReread": false,
  "isNewAuthor": true
}
```

**Response:**
```json
{
  "success": true,
  "userBook": { ... },
  "message": "Book added to library"
}
```

### Update Book

```http
PATCH /api/user/books/[id]
```

**Request Body (all fields optional):**
```json
{
  "status": "COMPLETED",
  "format": ["EBOOK", "AUDIOBOOK"],
  "startDate": "2024-01-01",
  "finishDate": "2024-01-15",
  "progress": 100,
  "currentPage": 350,
  "review": "string",
  "notes": "string",
  "isFavorite": true,
  "dnfReason": "string",
  "lgbtqRepresentation": "YES",
  "lgbtqDetails": "string",
  "disabilityRepresentation": "NO",
  "authorPoc": "YES",
  "authorPocDetails": "string"
}
```

### Delete Book

```http
DELETE /api/user/books/[id]
```

**Response:**
```json
{
  "success": true,
  "message": "Book removed from library"
}
```

### Create Shared Review

```http
POST /api/user/books/[id]/share
```

**Request Body:**
```json
{
  "showDates": true,
  "showBookClubs": false,
  "showReadathons": false,
  "showReview": true
}
```

**Response:**
```json
{
  "success": true,
  "shareToken": "abc123xyz",
  "shareUrl": "https://domain.com/share/reviews/abc123xyz"
}
```

### Delete Shared Review

```http
DELETE /api/user/books/[id]/share
```

---

## User Preferences

### Update Preferences

```http
PATCH /api/user/preferences
```

**Request Body:**
```json
{
  "dashboardLayout": "GRID" | "TABLE"
}
```

### Update Settings

```http
PATCH /api/user/settings
```

**Request Body:**
```json
{
  "username": "string",
  "bio": "string",
  "readingGoal": 52,
  "librarySortBy": "END_DATE",
  "librarySortOrder": "DESC"
}
```

### Get Book Clubs (Autocomplete)

```http
GET /api/user/book-clubs
```

**Response:**
```json
{
  "bookClubs": [
    { "name": "Fantasy Book Club", "usageCount": 5 },
    { "name": "Sci-Fi Readers", "usageCount": 3 }
  ]
}
```

### Get Readathons (Autocomplete)

```http
GET /api/user/readathons
```

### Check Username Availability

```http
GET /api/user/username-check?username=johndoe
```

**Response:**
```json
{
  "available": true
}
```

### Upload Avatar

```http
POST /api/user/avatar
Content-Type: multipart/form-data

file: <image file>
```

---

## Charts

All chart endpoints accept an optional `year` query parameter. Without it, returns current year data.

### Books Per Month

```http
GET /api/charts/books-per-month?year=2024
```

**Response:**
```json
{
  "data": [
    { "month": "Jan", "completed": 5, "dnf": 1 },
    { "month": "Feb", "completed": 4, "dnf": 0 }
  ],
  "year": 2024,
  "total": { "completed": 52, "dnf": 3 }
}
```

### Pages Per Month

```http
GET /api/charts/pages-per-month?year=2024
```

**Response:**
```json
{
  "data": [
    { "month": "Jan", "pages": 1500 },
    { "month": "Feb", "pages": 1200 }
  ],
  "year": 2024,
  "total": 15000
}
```

### Book Format Distribution

```http
GET /api/charts/book-format?year=2024
```

**Response:**
```json
{
  "data": [
    { "name": "Ebook", "value": 25, "percentage": 48.1 },
    { "name": "Physical", "value": 20, "percentage": 38.5 },
    { "name": "Audiobook", "value": 7, "percentage": 13.5 }
  ],
  "year": 2024,
  "total": 52
}
```

### Main Genres

```http
GET /api/charts/main-genres?year=2024
```

### Acquisition Method

```http
GET /api/charts/acquisition-method?year=2024
```

### LGBTQ+ Representation

```http
GET /api/charts/lgbtq-representation?year=2024
```

### Disability Representation

```http
GET /api/charts/disability-representation?year=2024
```

### POC Authors

```http
GET /api/charts/poc-authors?year=2024
```

### New Authors

```http
GET /api/charts/new-authors?year=2024
```

### Available Years

```http
GET /api/charts/available-years
```

**Response:**
```json
{
  "years": [2024, 2023, 2022]
}
```

---

## Admin Endpoints

All admin endpoints require `isAdmin: true`.

### List Books (Admin)

```http
GET /api/admin/books
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |
| `search` | string | Search by title/author |
| `sortBy` | string | Sort field |
| `sortOrder` | string | ASC or DESC |
| `hasIssues` | boolean | Filter books with data issues |

### Create Book (Admin)

```http
POST /api/admin/books
```

**Request Body:**
```json
{
  "title": "string",
  "authors": ["string"],
  "isbn13": "string",
  "bookType": "FICTION"
}
```

### Update Book (Admin)

```http
PATCH /api/admin/books/[id]
```

### Delete Book (Admin)

```http
DELETE /api/admin/books/[id]
```

### Resync Book Provider Data

```http
POST /api/admin/books/[id]/resync
```

**Response:**
```json
{
  "success": true,
  "editionId": "string",
  "title": "string",
  "message": "Successfully synced book data",
  "summary": {
    "google": "updated",
    "hardcover": "created",
    "ibdb": "not_found"
  },
  "providerFieldCounts": {
    "google": 12,
    "hardcover": 8,
    "ibdb": 0
  }
}
```

### Bulk Operations

```http
POST /api/admin/books/bulk
```

**Request Body:**
```json
{
  "action": "delete" | "merge" | "updateType",
  "bookIds": ["id1", "id2"],
  "targetId": "string",
  "bookType": "FICTION"
}
```

### List Users (Admin)

```http
GET /api/admin/users
```

### Update User Role (Admin)

```http
PATCH /api/admin/users/[id]
```

**Request Body:**
```json
{
  "isAdmin": true,
  "isSuperAdmin": false
}
```

### Audit Log

```http
GET /api/admin/audit-log
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `adminId` | string | Filter by admin |
| `actionType` | string | Filter by action type |
| `entityType` | string | Filter by entity type |

**Response:**
```json
{
  "logs": [
    {
      "id": "string",
      "adminId": "string",
      "admin": { "name": "string", "email": "string" },
      "entityType": "book",
      "entityId": "string",
      "actionType": "UPDATE",
      "fieldName": "title",
      "oldValue": "Old Title",
      "newValue": "New Title",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### System Statistics

```http
GET /api/admin/stats
```

**Response:**
```json
{
  "totalUsers": 150,
  "totalBooks": 5000,
  "totalEditions": 5500,
  "totalUserBooks": 25000,
  "booksAddedToday": 15,
  "activeUsersThisMonth": 120
}
```

### Data Quality

```http
GET /api/admin/data-quality
```

---

## Public Endpoints

### Get Public Profile

```http
GET /api/profile/[username]
```

**Response:**
```json
{
  "user": {
    "username": "string",
    "bio": "string",
    "profilePictureUrl": "string",
    "readingGoal": 52
  },
  "stats": {
    "booksRead": 150,
    "pagesRead": 45000,
    "averageRating": 3.8
  },
  "currentlyReading": [...],
  "recentBooks": [...],
  "sharedReviews": [...]
}
```

### Get Shared Review

```http
GET /api/share/reviews/[shareToken]
```

**Response:**
```json
{
  "review": {
    "shareToken": "string",
    "showDates": true,
    "showBookClubs": false,
    "showReadathons": false,
    "showReview": true,
    "userBook": {
      "status": "COMPLETED",
      "startDate": "2024-01-01",
      "finishDate": "2024-01-15",
      "review": "string",
      "edition": { ... },
      "cawpileRating": { ... }
    },
    "user": {
      "username": "string",
      "profilePictureUrl": "string"
    }
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

**Common Status Codes:**
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |
