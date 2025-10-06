# Dashboard UI/UX Improvements Requirements

## Introduction

This specification outlines improvements to the student and lecturer dashboard user interface and navigation experience. The goal is to create a more intuitive and professional layout with proper component placement and improved sidebar navigation visibility.

## Requirements

### Requirement 1: Dashboard-Specific Greeting Card

**User Story:** As a student or lecturer, I want to see the greeting card and welcome message only on the main dashboard page, so that other pages have more space for their specific content.

#### Acceptance Criteria

1. WHEN a user navigates to `/student/dashboard` or `/lecturer/dashboard` THEN the system SHALL display the greeting card with welcome message
2. WHEN a user clicks the "Home" button in the sidebar THEN the system SHALL navigate to the dashboard and display the greeting card
3. WHEN a user navigates to any other page (Generate, Attendance, Assessment, Export) THEN the system SHALL NOT display the greeting card
4. WHEN a user is on a non-dashboard page THEN the system SHALL provide more vertical space for page-specific content

### Requirement 2: Top-Right Profile Placement

**User Story:** As a student or lecturer, I want my profile information displayed in the top-right corner of all pages, so that I can easily access my profile and have a consistent navigation experience.

#### Acceptance Criteria

1. WHEN a user is on any page THEN the system SHALL display the user profile in the top-right corner
2. WHEN displaying the profile THEN the system SHALL show the user's profile picture/avatar and name
3. WHEN a user clicks on the profile THEN the system SHALL provide a dropdown menu with profile options
4. WHEN the profile is displayed THEN it SHALL be consistent across all pages (dashboard, generate, attendance, etc.)
5. WHEN on mobile devices THEN the profile SHALL remain accessible and properly positioned

### Requirement 3: Enhanced Sidebar Navigation Visibility

**User Story:** As a student or lecturer, I want to clearly see all navigation options in the sidebar including "Other Services" section, so that I can easily access all available features.

#### Acceptance Criteria

1. WHEN a user views the sidebar THEN the system SHALL display all navigation buttons with clear visibility
2. WHEN the sidebar contains an "Other Services" section THEN it SHALL be clearly visible and accessible
3. WHEN navigation buttons are displayed THEN they SHALL have proper contrast and readability
4. WHEN a user hovers over navigation items THEN the system SHALL provide visual feedback
5. WHEN the sidebar is collapsed/expanded THEN all navigation options SHALL remain accessible
6. WHEN on different screen sizes THEN the sidebar navigation SHALL maintain functionality and visibility

### Requirement 4: Consistent Layout Structure

**User Story:** As a student or lecturer, I want a consistent layout structure across all pages, so that I have a predictable and professional user experience.

#### Acceptance Criteria

1. WHEN a user navigates between pages THEN the system SHALL maintain consistent header, sidebar, and content area positioning
2. WHEN the greeting card is hidden on non-dashboard pages THEN the content area SHALL expand to utilize the available space
3. WHEN the profile is positioned in the top-right THEN it SHALL not interfere with page content or navigation
4. WHEN the sidebar is displayed THEN it SHALL maintain consistent width and positioning across all pages
5. WHEN responsive design is applied THEN the layout SHALL adapt appropriately for different screen sizes

### Requirement 5: Role-Specific Dashboard Content

**User Story:** As a student, I want to see student-specific dashboard content, and as a lecturer, I want to see lecturer-specific content, so that the interface is relevant to my role.

#### Acceptance Criteria

1. WHEN a student accesses the dashboard THEN the system SHALL display student-specific greeting and dashboard cards (Attendance, Performance, Deadlines)
2. WHEN a lecturer accesses the dashboard THEN the system SHALL display lecturer-specific greeting and dashboard cards (Generate Session, View Attendance, Input/Update Grades, Export Reports)
3. WHEN displaying role-specific content THEN the system SHALL use appropriate messaging and functionality for each role
4. WHEN a user's role changes THEN the dashboard content SHALL update accordingly
5. WHEN dashboard cards are displayed THEN they SHALL be properly organized and visually appealing

### Requirement 6: Navigation State Management

**User Story:** As a user, I want the navigation to clearly indicate which page I'm currently on, so that I always know my location within the application.

#### Acceptance Criteria

1. WHEN a user is on a specific page THEN the corresponding sidebar navigation item SHALL be highlighted/active
2. WHEN a user navigates between pages THEN the active state SHALL update to reflect the current page
3. WHEN the "Home" button is active THEN it SHALL indicate the user is on the dashboard
4. WHEN navigation states change THEN the transitions SHALL be smooth and visually clear
5. WHEN using keyboard navigation THEN the active states SHALL be properly managed and accessible