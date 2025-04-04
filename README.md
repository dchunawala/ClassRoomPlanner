# ClassRoom Manager

Efficiently manage class schedules and room assignments while preventing scheduling conflicts.

## Features

- **Smart Scheduling**: Automatically detects and prevents scheduling conflicts
- **Room Management**: Organize and track classroom availability
- **Semester Organization**: Manage classes across different academic terms
- **Real-time Validation**: Instant feedback on scheduling conflicts
- **User-friendly Interface**: Easy-to-use interface for managing classes and rooms

## Key Capabilities

- Prevent double-booking of rooms
- Detect time conflicts between classes
- Manage multiple semesters
- Track room assignments
- Support for different class schedules (Fall, Spring, Summer)

## Technical Stack

- React with TypeScript
- Material-UI components
- Day.js for time management
- Local storage for data persistence

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage Guide

### Managing Semesters
- Click "Add Semester" to create a new academic term
- Set semester details (name, year, etc.)
- Mark semesters as active/inactive

### Managing Rooms
- Add rooms with capacity information
- Assign rooms to specific semesters
- View room availability

### Scheduling Classes
- Add classes with course details
- Select available rooms
- System automatically prevents:
  - Room double-booking
  - Time conflicts between classes
  - Invalid scheduling patterns

## Development

Built with modern web technologies focusing on:
- Type safety with TypeScript
- Component-based architecture
- Responsive design
- Real-time validation
- Clean and intuitive user interface

## Data Management

- Uses local storage for data persistence
- Maintains separate stores for:
  - Semesters
  - Rooms
  - Classes
  - Schedule information

## Validation Rules

- Prevents overlapping class schedules
- Validates room availability
- Ensures complete class information
- Special handling for specific time restrictions (e.g., Tuesday/Thursday schedules)