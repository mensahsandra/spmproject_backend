# Implementation Plan

- [x] 1. Hide greeting card on non-dashboard pages



  - Add conditional rendering to only show greeting card on `/student/dashboard`, `/lecturer/dashboard`, and when Home button is clicked
  - Update the dashboard layout component to check current route
  - Hide greeting card on Generate, Attendance, Assessment, Export pages
  - Test greeting card appears only on dashboard/home and disappears on other pages
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Move profile to top-right corner



  - Relocate profile component from current position to top-right corner
  - Update CSS positioning to match the design shown in the images
  - Ensure profile shows user name and avatar in top-right position
  - Make profile visible on all pages in the same top-right location
  - Test profile positioning works on both student and lecturer interfaces
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 3. Fix sidebar navigation visibility



  - Improve CSS styling to make "Other Services" section clearly visible
  - Fix any styling issues that are hiding navigation buttons
  - Ensure all sidebar navigation items (Counselling, Feedback, About Us, etc.) are visible
  - Update sidebar styling to improve contrast and readability
  - Test that all navigation buttons in sidebar are visible and clickable
  - _Requirements: 3.1, 3.2, 3.3_
