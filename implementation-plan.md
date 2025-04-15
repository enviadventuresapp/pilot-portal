# Pilot Portal Implementation Plan

## 1. Backend Setup & Supabase Integration

- [x] Connect to Supabase (already done)
- [x] Configure environment variables for Supabase credentials
  - Move hardcoded credentials to .env file
  - Update client.ts to use environment variables
- [ ] Update Supabase schema:
  - Configure proper schema for pilots/users table
  - Configure proper schema for flights table
  - Configure proper schema for safety reports table
  - Configure proper schema for aircraft table
- [ ] Set up Row Level Security (RLS) policies:
  - Base policies for authenticated users
  - Special policies for admin roles

## 2. User Authentication & Access Control

- [x] Create service layer for database operations
  - Created authService.ts for authentication operations
  - Created pilotService.ts for pilot operations
  - Created flightService.ts for flight operations
  - Created safetyService.ts for safety report operations
  - Created aircraftService.ts for aircraft operations
- [x] Implement proper Supabase authentication flow:
  - Created useAuth hook
  - Created AuthContext provider
  - Created ProtectedRoute component 
  - Update Login component to use Supabase auth
  - Added logout functionality
- [x] Role-based access control:
  - Create admin role with full access (protected routes with adminOnly flag)
  - Create employee role with limited access
  - Prevent sensitive sections from being accessed by non-admins
- [x] User management:
  - Admin can view/edit/delete users
  - Implement proper role assignment

## 3. Flights Section

- [x] Replace localStorage with Supabase queries in FlightList:
  - [x] Fetch flights from Supabase
  - [x] Fetch aircraft from Supabase
  - [x] Implement loading state
  - [x] Handle errors
  - [x] Delete flights using Supabase
- [x] Update FlightForm component to use flightService:
  - [x] Fetch aircraft and pilots data
  - [x] Create new flights with Supabase
  - [x] Update existing flights
  - [x] Auto-populate tach start based on previous flights
  - [x] Proper error handling and loading states
- [x] Employee permissions:
  - [x] Allow employees to view flights
  - [x] Restrict delete actions to admin only
- [x] Form validation:
  - [x] Validate all input fields before saving
  - [x] Proper error messages

## 4. SMS (Safety Management System) Section

- [x] Replace localStorage with Supabase queries in SafetyList:
  - [x] Fetch safety reports from Supabase
  - [x] Fetch aircraft from Supabase
  - [x] Implement loading state
  - [x] Handle errors
  - [x] Delete safety reports using Supabase
- [x] Update SafetyForm component to use safetyService:
  - [x] Fetch aircraft data
  - [x] Create new reports with Supabase
  - [x] Update existing reports
  - [x] Proper error handling and loading states
- [x] Employee permissions:
  - [x] Allow employees to submit new reports
  - [x] Restrict management (delete) to admin
- [x] Safety report workflow:
  - [x] Implement status tracking (submitted, under-review, resolved, closed)
  - [x] Admin review functionality
  - [x] Status update with notes

## 5. Data Sync & Functionality

- [x] Implement real-time data sync:
  - [x] Set up Supabase subscriptions for real-time updates
  - [x] Handle offline/online scenarios
  - [x] Update UI in real-time for all changes
- [ ] Data migration:
  - Migrate existing localStorage data to Supabase (if needed)
  - Handle data conflicts
- [x] Error handling:
  - Network error handling
  - Retry mechanisms for failed operations

## 6. Testing & QA

- [ ] Test authentication flows:
  - Login as admin
  - Login as employee
  - Registration
  - Password reset
- [ ] Test flights functionality:
  - Create, read, update, delete flights
  - Test role-based permissions
- [ ] Test SMS functionality:
  - Create, read, update, delete safety reports
  - Test role-based permissions
  - Test workflow status changes
- [ ] Test data sync:
  - Verify real-time updates across devices
  - Test offline behavior

## Progress Tracking

We'll track our progress here as we complete each task:

- [x] Backend Setup & Supabase Integration (50%)
- [x] User Authentication & Access Control (100%)
- [x] Flights Section (100%)
- [x] SMS Section (100%)
- [x] Data Sync & Functionality (75%)
- [ ] Testing & QA (0%) 