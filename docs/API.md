# API Documentation - Get Your Grant

This document provides comprehensive documentation for the Get Your Grant REST API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Authentication Endpoints](#authentication-endpoints)
- [Project Management](#project-management)
- [AI Assistant](#ai-assistant)
- [Payment System](#payment-system)
- [Partner Management](#partner-management)
- [User Profile](#user-profile)
- [Rate Limiting](#rate-limiting)

## Authentication

The API uses session-based authentication with CSRF protection.

### Headers Required

```http
Content-Type: application/json
X-CSRFToken: <csrf-token>
```

### Getting CSRF Token

```http
GET /assistant/csrf/
```

**Response:**
```json
{
  "csrfToken": "abc123..."
}
```

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.getyourgrant.eu`

All endpoints are prefixed with `/assistant/` unless otherwise specified.

## Response Format

### Success Response

```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "errors": { ... },
  "details": "Additional error details"
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `402` - Payment Required (Insufficient credits)
- `403` - Forbidden
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Authentication Endpoints

### Register User

```http
POST /assistant/register/
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password1": "securepassword123",
  "password2": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User created successfully",
  "redirect_url": "list_abstracts"
}
```

### Login

```http
POST /assistant/login/
```

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Logged in successfully",
  "redirect_url": "ask_form"
}
```

### Logout

```http
GET /assistant/logout/
```

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### Password Reset

#### Request Reset

```http
POST /assistant/password/reset/
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### Confirm Reset

```http
POST /assistant/password/reset/confirm/
```

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "newpassword123",
  "password_confirm": "newpassword123"
}
```

## Project Management

### List Projects

```http
GET /assistant/
```

**Response:**
```json
{
  "status": "success",
  "abstracts": [
    {
      "abstract_id": 1,
      "title": "Digital Education Initiative",
      "acronym": "DEI",
      "date_created": "2024-01-15T10:30:00Z",
      "is_paid": true,
      "is_big_paid": false
    }
  ]
}
```

### Create New Project

```http
POST /assistant/add_abstract_new/
```

**Request Body:**
```json
{
  "why": "To address digital divide in education",
  "what": "Create online learning platform",
  "how": "Develop web application with AI tutoring"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Abstract added successfully",
  "abstract": "Generated abstract content...",
  "abstract_id": 123
}
```

### Edit Project

```http
POST /assistant/edit_abstract_new/
```

**Request Body:**
```json
{
  "abstract_id": 123,
  "additional_request": "Add more focus on accessibility",
  "old_abstract": "Previous abstract content..."
}
```

### Get Project Details

```http
GET /assistant/abstract/{id}/
```

**Response:**
```json
{
  "status": "success",
  "abstract": {
    "abstract_id": 123,
    "title": "Digital Education Initiative",
    "acronym": "DEI",
    "topic_area_sector": "Education",
    "target_groups": "Students, Teachers",
    "scope_objective": "Improve digital literacy...",
    "actions_activities": "Develop platform, Train users...",
    "partners": "Universities, NGOs",
    "partner_type": "Small Corp",
    "keywords": "education, digital, AI",
    "generated_abstract_content": "Full abstract...",
    "budget": 50000,
    "duration": 24,
    "partner_companies": "[{\"name\": \"TechEdu\", \"country\": \"Germany\"}]"
  }
}
```

### View Small-Scale Submission

```http
GET /assistant/submission/{submission_id}/
```

**Response:**
```json
{
  "status": "success",
  "submission": { ... },
  "answers_small_corp": {
    "projectDescriptionObjectivesOutcomes": "Detailed objectives...",
    "projectDescriptionTargetGroups": "Target group analysis...",
    "cooperationArrangementsPartnershipFormation": "Partnership details...",
    "impactFollowUpSuccessEvaluation": "Evaluation methods..."
  },
  "activities": [
    {
      "activity_id": 1,
      "activityTitle": "Platform Development",
      "activityEstimatedStartDate": "2024-03-01",
      "activityEstimatedEndDate": "2024-08-31",
      "activityContentDescription": "Develop core platform...",
      "activityExpectedResults": "Functional platform..."
    }
  ]
}
```

### View Big Cooperation Submission

```http
GET /assistant/big-cooperation/submission/{submission_id}/
```

**Response:**
```json
{
  "status": "success",
  "submission": { ... },
  "answers_big_cooperation": {
    "project_address_priorities": "Priority alignment...",
    "motivation_and_funding_justification": "Funding rationale...",
    "partnership_formation": "Partnership strategy...",
    "monitoring_and_quality_control": "Quality assurance..."
  },
  "work_packages": [
    {
      "id": 1,
      "title": "Research and Development",
      "start_date": "2024-03-01",
      "end_date": "2024-12-31",
      "objectives": "Research objectives...",
      "main_results": "Expected outcomes..."
    }
  ]
}
```

### Update Project Administration

```http
PATCH /assistant/administration/{abstract_id}/edit/
```

**Request Body:**
```json
{
  "title": "Updated Project Title",
  "acronym": "UPT",
  "budget": 75000,
  "duration": 30,
  "partners": [
    {"name": "Partner 1", "country": "Germany", "type": "University"},
    {"name": "Partner 2", "country": "France", "type": "SME"}
  ]
}
```

### Delete Project

```http
DELETE /assistant/abstract/delete/{abstract_id}/
```

**Response:**
```json
{
  "status": "success",
  "message": "Abstract deleted successfully"
}
```

## AI Assistant

### Generate Answer for Question

```http
POST /assistant/generate-answer/{abstract_id}/{question_id}/{tab_id}/
```

**Parameters:**
- `abstract_id`: Project ID
- `question_id`: Question number (1-5)
- `tab_id`: Section ID (0=Project Description, 1=Cooperation, 3=Impact, 4=Summary)

**Response:**
```json
{
  "status": "success",
  "message": "Answer generated successfully",
  "answer": "Generated answer content (minimum 3000 characters)..."
}
```

### Update Answer with GPT

```http
POST /assistant/answers/gpt/update/{abstract_id}/{question_id}/{tab_id}/
```

**Request Body:**
```json
{
  "instructions": "Make the answer more focused on sustainability aspects"
}
```

### Generate Answer for Big Cooperation

```http
POST /assistant/big-cooperation/generate-answer/{abstract_id}/{question_id}/{tab_id}/
```

**Parameters:**
- `tab_id`: Section ID (0=Relevance, 1=Cooperation, 2=Management, 4=Impact, 5=Summary)

### Generate Abstract with Assistant

```http
POST /assistant/abstract/generate-abstract-assistant/{abstract_id}/
```

**Response:**
```json
{
  "status": "success",
  "message": "Abstract generated successfully",
  "generated_abstract": "Complete abstract content..."
}
```

## Activities and Work Packages

### List Activities

```http
GET /assistant/activities/list/{abstract_id}/
```

**Response:**
```json
{
  "status": "success",
  "activities": [
    {
      "activity_id": 1,
      "activityTitle": "Research Phase",
      "activityEstimatedStartDate": "2024-03-01",
      "activityEstimatedEndDate": "2024-06-30",
      "activityContentDescription": "Conduct research...",
      "activityTargetGroupDescription": "Researchers and students...",
      "activityContributionToProjectObjectives": "Supports objective 1...",
      "activityExpectedResults": "Research report...",
      "activityEstimatedCostBreakdown": "Personnel: €30,000..."
    }
  ],
  "abstract_id": 123
}
```

### Add Activities with GPT

```http
POST /assistant/activities/add/{abstract_id}/
```

**Response:**
```json
{
  "status": "success",
  "message": "Activities added successfully",
  "activities": [ ... ]
}
```

### Update Activity

```http
POST /assistant/activities/update/{activity_id}/
```

**Request Body:**
```json
{
  "activityTitle": "Updated Activity Title",
  "activityEstimatedStartDate": "2024-04-01",
  "activityEstimatedEndDate": "2024-07-31",
  "activityContentDescription": "Updated description..."
}
```

### Update Activity with GPT

```http
POST /assistant/activities/update/gpt/{activity_id}/
```

**Request Body:**
```json
{
  "instructions": "Focus more on innovation aspects"
}
```

### Delete Activity

```http
DELETE /assistant/activities/delete/{activity_id}/
```

### Work Packages (Big Cooperation)

#### List Work Packages

```http
GET /assistant/work-packages/list/{abstract_id}/
```

#### Add Work Packages with GPT

```http
POST /assistant/work-packages/add/{abstract_id}/
```

#### Update Work Package

```http
PATCH /assistant/work-packages/{work_package_id}/update/
```

#### Update Work Package with GPT

```http
POST /assistant/work-packages/{work_package_id}/update/gpt/
```

#### Delete Work Package

```http
DELETE /assistant/work-packages/{work_package_id}/delete/
```

## Work Plans

### Create Work Plan

```http
POST /assistant/work_plans/{abstract_id}/{scale}/create/
```

**Parameters:**
- `scale`: "small" or "big"

**Response:**
```json
{
  "status": "success",
  "message": "Work Plan created successfully",
  "workplans": [
    {
      "id": 1,
      "name": "Research Phase",
      "description": "Initial research and analysis",
      "estimated_start_date": "2024-03-01",
      "estimated_end_date": "2024-06-30",
      "tasks": "[{\"id\": 1, \"title\": \"Literature Review\"}]"
    }
  ]
}
```

### Get Work Plans

```http
GET /assistant/work_plans/{abstract_id}/{scale}/
```

### Edit Work Plan

```http
PATCH /assistant/work_plans/{abstract_id}/{workplan_id}/edit/
```

### Delete Work Plan

```http
DELETE /assistant/work_plans/{abstract_id}/{workplan_id}/delete/
```

## Payment System

### Get Payment Options

```http
GET /assistant/checkout/
```

**Response:**
```json
{
  "status": "success",
  "payment_options": [
    {"credits": 3, "amount": "300"},
    {"credits": 5, "amount": "500"},
    {"credits": 12, "amount": "1000"},
    {"credits": 26, "amount": "2000"}
  ]
}
```

### Create Payment

```http
POST /assistant/create_payment/
```

**Request Body:**
```json
{
  "credits": 5,
  "amount": "500"
}
```

**Response:**
```json
{
  "status": "success",
  "approval_url": "https://www.paypal.com/checkoutnow?token=..."
}
```

### Execute Payment

```http
GET /assistant/execute_payment/?paymentId=...&PayerID=...
```

**Response:**
```json
{
  "status": "success",
  "message": "Payment executed and credits added successfully",
  "redirect_url": "list_abstracts"
}
```

## Partner Management

### Get User Partners

```http
GET /assistant/partners/
```

**Response:**
```json
{
  "status": "success",
  "partners": [
    {
      "id": 1,
      "name": "TechEdu Solutions",
      "country": "Germany",
      "type": "SME",
      "date_created": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Add Partner from File

```http
POST /assistant/partners/add/
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Partner document (.docx file)

**Response:**
```json
{
  "status": "success",
  "message": "Partner added successfully"
}
```

### Delete Partner

```http
DELETE /assistant/partners/{partner_id}/delete/
```

## User Profile

### Get Profile

```http
GET /assistant/profile/
```

**Response:**
```json
{
  "status": "success",
  "profile": {
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "credit_points": 15,
    "company": "TechCorp",
    "country": "Germany",
    "contact_phone": "+49123456789",
    "company_site": "https://techcorp.com",
    "language": "en",
    "timezone": "Europe/Berlin",
    "currency": "EUR",
    "communication_email": true,
    "communication_phone": false,
    "allow_marketing": true
  }
}
```

### Update Profile

```http
PATCH /assistant/profile/
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "company": "NewTech Solutions",
  "country": "France",
  "contact_phone": "+33123456789",
  "communication_email": true,
  "allow_marketing": false
}
```

## Priorities

### Save Priorities (Small Scale)

```http
POST /assistant/save_priorities/
```

**Request Body:**
```json
{
  "submission_id": 123,
  "priorities": [
    "Digital transformation",
    "Green transition",
    "Social inclusion"
  ]
}
```

### Save Priorities (Big Cooperation)

```http
POST /assistant/save_priorities_big/
```

## Utility Endpoints

### List Calls

```http
GET /assistant/calls/
```

**Response:**
```json
{
  "status": "success",
  "calls": [
    {
      "id": 1,
      "title": "Erasmus+ Call 2024",
      "description": "Education and training opportunities",
      "deadline": "2024-03-15",
      "budget": "1000000.00",
      "eligible_partners": "EU organizations",
      "counties": "All EU countries",
      "video_link": "https://example.com/video"
    }
  ]
}
```

### FAQ

```http
GET /assistant/faq/
```

### Submit Feedback

```http
POST /assistant/feedback_form/
```

**Request Body:**
```json
{
  "message": "Great application, very helpful!",
  "rating": 5,
  "category": "General"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **AI generation endpoints**: 10 requests per hour per user
- **General endpoints**: 100 requests per minute per user

## Error Examples

### Insufficient Credits

```json
{
  "status": "error",
  "message": "Insufficient credit points. Please make a payment."
}
```

### Validation Error

```json
{
  "status": "error",
  "errors": {
    "email": ["This field is required."],
    "password": ["Password too short."]
  }
}
```

### Authentication Error

```json
{
  "status": "error",
  "message": "Authentication credentials were not provided."
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class GrantAPI {
  private baseURL = 'https://api.getyourgrant.eu/assistant';
  private csrfToken: string = '';

  async getCSRFToken() {
    const response = await fetch(`${this.baseURL}/csrf/`);
    const data = await response.json();
    this.csrfToken = data.csrfToken;
  }

  async createProject(projectData: {why: string, what: string, how: string}) {
    const response = await fetch(`${this.baseURL}/add_abstract_new/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.csrfToken
      },
      body: JSON.stringify(projectData)
    });
    return response.json();
  }
}
```

### Python

```python
import requests

class GrantAPI:
    def __init__(self, base_url="https://api.getyourgrant.eu/assistant"):
        self.base_url = base_url
        self.session = requests.Session()
        self.csrf_token = self.get_csrf_token()
    
    def get_csrf_token(self):
        response = self.session.get(f"{self.base_url}/csrf/")
        return response.json()["csrfToken"]
    
    def create_project(self, why, what, how):
        data = {"why": why, "what": what, "how": how}
        headers = {"X-CSRFToken": self.csrf_token}
        response = self.session.post(
            f"{self.base_url}/add_abstract_new/",
            json=data,
            headers=headers
        )
        return response.json()
```

For more examples and detailed integration guides, see the [Developer Guide](DEVELOPER_GUIDE.md).
