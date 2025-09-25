# API Documentation

Base URL: http://localhost:3000

## Authentication

- POST /auth/signup
  - body: { name, email, password, role? one of [victim, donor, ngo, volunteer, admin] }
  - response: { token, user }

- POST /auth/login
  - body: { email, password }
  - response: { token, user }

Auth header for protected endpoints: `Authorization: Bearer <token>`

## Health
- GET /health -> { status: 'ok' }

## Resources
- GET /resources?type=food&q=delhi -> [ { id, type, quantity, location, ... } ]
- POST /resources
  - body: { type: 'food'|'medicine'|'shelter'|'clothes'|'other', quantity: number, location: string }
  - response: created resource

## Requests (Victims)
- GET /api/requests?status=pending&urgency=high -> list
- POST /api/requests
  - body: { name, location, item: 'food'|'medicine'|'clothes'|'shelter'|'other', quantity, urgency? }
  - response: created request
- PUT /api/requests/:id/status
  - body: { status: 'pending'|'approved'|'rejected'|'in_progress'|'completed' }

## Donations (Donors/NGOs)
- GET /api/donations -> list
- POST /api/donations
  - body: { donorName, itemType, quantity, location, contactInfo }

## Admin (Protected: role=admin)
- PUT /api/admin/users/:id/approve -> approve NGO/Volunteer
- PUT /api/admin/requests/:id/status { status } -> approve/reject/advance request
- POST /api/admin/tasks { title, assignedTo, relatedRequest? } -> assign volunteer task
- GET /api/admin/reports/summary -> { totals, pendingRequests }

## Volunteers (Protected: role=volunteer)
- GET /api/volunteers/tasks -> tasks assigned to current volunteer
- PUT /api/volunteers/tasks/:id/status { status } -> update status

## WebSocket Events
- Channel: `urgent_alert` broadcast to all clients
  - payload: { message, location }
