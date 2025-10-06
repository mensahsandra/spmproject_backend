# Dashboard UI/UX Improvements Design

## Overview

This design document outlines the technical approach for implementing dashboard UI/UX improvements including conditional greeting card display, top-right profile placement, enhanced sidebar navigation, and consistent layout structure across the Student Performance Matrix application.

## Architecture

### Component Structure

```
App Layout
├── Header Component
│   ├── Logo/Brand (left)
│   └── Profile Component (top-right)
├── Sidebar Navigation
│   ├── Main Navigation Items
│   ├── Other Services Section
│   └── Active State Management
└── Main Content Area
    ├── Conditional Greeting Card (dashboard only)
    └── Page-Specific Content
```

### State Management

The application will use a combination of:
- **Route-based conditional rendering** for greeting card display
- **Global user context** for profile information
- **Navigation state management** for active menu items
- **Responsive layout hooks** for mobile adaptation

## Components and Interfaces

### 1. Layout Components

#### MainLayout Component
```typescript
interface MainLayoutProps {
  children: React.ReactNode;
  showGreeting?: boolean;
  currentPage: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showGreeting = false,
  currentPage
}) => {
  // Layout structure with conditional greeting
}
```

#### ProfileComponent
```typescript
interface ProfileComponentProps {
  user: {
    name: string;
    role: 'student' | 'lecturer';
    avatar?: string;
    email: string;
  };
  position: 'top-right';
}

const ProfileComponent: React.FC<ProfileComponentProps> = ({ user, position }) => {
  // Top-right positioned profile with dropdown
}
```

#### SidebarNavigation
```typescript
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  section?: 'main' | 'other-services';
}

interface SidebarProps {
  navigationItems: NavigationItem[];
  currentPath: string;
  userRole: 'student' | 'lecturer';
}
```

### 2. Conditional Rendering Logic

#### Route-Based Greeting Display
```typescript
const useShowGreeting = (pathname: string): boolean => {
  const dashboardRoutes = ['/student/dashboard', '/lecturer/dashboard'];
  return dashboardRoutes.includes(pathname) || pathname.endsWith('/home');
};
```

#### Navigation State Management
```typescript
const useActiveNavigation = (currentPath: string) => {
  const getActiveItem = (path: string) => {
    if (path.includes('/dashboard') || path.endsWith('/home')) return 'home';
    if (path.includes('/generate')) return 'generate';
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/assessment') || path.includes('/performance')) return 'assessment';
    if (path.includes('/export')) return 'export';
    return null;
  };
  
  return getActiveItem(currentPath);
};
```

## Data Models

### User Profile Model
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer';
  avatar?: string;
  studentId?: string;
  staffId?: string;
  centre?: string;
}
```

### Navigation Configuration
```typescript
interface NavigationConfig {
  student: NavigationItem[];
  lecturer: NavigationItem[];
}

const navigationConfig: NavigationConfig = {
  student: [
    { id: 'home', label: 'Home', icon: HomeIcon, path: '/student/dashboard', section: 'main' },
    { id: 'attendance', label: 'Attendance', icon: AttendanceIcon, path: '/student/attendance', section: 'main' },
    { id: 'performance', label: 'Performance', icon: PerformanceIcon, path: '/student/performance', section: 'main' },
    { id: 'deadlines', label: 'Deadlines', icon: DeadlineIcon, path: '/student/deadlines', section: 'main' },
    { id: 'counselling', label: 'Counselling', icon: CounsellingIcon, path: '/student/counselling', section: 'other-services' },
    { id: 'feedback', label: 'Feedback', icon: FeedbackIcon, path: '/student/feedback', section: 'other-services' }
  ],
  lecturer: [
    { id: 'home', label: 'Home', icon: HomeIcon, path: '/lecturer/dashboard', section: 'main' },
    { id: 'generate', label: 'Generate', icon: GenerateIcon, path: '/lecturer/generate', section: 'main' },
    { id: 'attendance', label: 'Attendance', icon: AttendanceIcon, path: '/lecturer/attendance', section: 'main' },
    { id: 'assessment', label: 'Assessment', icon: AssessmentIcon, path: '/lecturer/assessment', section: 'main' },
    { id: 'export', label: 'Export', icon: ExportIcon, path: '/lecturer/export', section: 'main' }
  ]
};
```

## Error Handling

### Layout Error Boundaries
```typescript
class LayoutErrorBoundary extends React.Component {
  // Handle layout-specific errors
  // Fallback to basic layout without advanced features
}
```

### Navigation Fallbacks
- If active navigation state fails, default to current route highlighting
- If profile data is unavailable, show placeholder with initials
- If sidebar navigation fails, provide basic navigation menu

## Testing Strategy

### Unit Tests
1. **Component Rendering Tests**
   - Test conditional greeting card display based on route
   - Test profile component positioning and dropdown functionality
   - Test sidebar navigation item highlighting

2. **Hook Tests**
   - Test `useShowGreeting` hook with various routes
   - Test `useActiveNavigation` hook state management
   - Test responsive layout hooks

3. **Integration Tests**
   - Test navigation between pages maintains layout consistency
   - Test profile dropdown interactions
   - Test sidebar navigation functionality

### Visual Regression Tests
1. **Layout Screenshots**
   - Dashboard with greeting card (student/lecturer)
   - Non-dashboard pages without greeting card
   - Profile component positioning across different screen sizes
   - Sidebar navigation visibility and highlighting

2. **Responsive Design Tests**
   - Mobile layout adaptation
   - Tablet layout behavior
   - Desktop layout consistency

### User Experience Tests
1. **Navigation Flow Tests**
   - Test smooth transitions between pages
   - Test active state updates
   - Test profile accessibility

2. **Accessibility Tests**
   - Test keyboard navigation
   - Test screen reader compatibility
   - Test color contrast and visibility

## Implementation Phases

### Phase 1: Layout Structure
1. Create MainLayout component with conditional greeting
2. Implement ProfileComponent with top-right positioning
3. Set up route-based conditional rendering

### Phase 2: Navigation Enhancement
1. Enhance SidebarNavigation component
2. Implement active state management
3. Improve "Other Services" section visibility

### Phase 3: Responsive Design
1. Implement mobile-responsive layouts
2. Test across different screen sizes
3. Optimize for touch interactions

### Phase 4: Polish and Testing
1. Add smooth transitions and animations
2. Implement comprehensive testing
3. Performance optimization
4. Accessibility improvements

## Technical Considerations

### CSS/Styling Approach
- Use CSS Grid/Flexbox for layout structure
- Implement CSS custom properties for consistent theming
- Use responsive design patterns (mobile-first approach)
- Ensure proper z-index management for profile dropdown

### Performance Optimization
- Lazy load non-critical components
- Optimize re-renders with React.memo where appropriate
- Use efficient state management to prevent unnecessary updates

### Browser Compatibility
- Support modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation for older browsers
- Test across different devices and screen sizes