# Tasks and Analytics

A modern, responsive task management and analytics application built with React and Tailwind CSS.

## Features

### Task Management
- **Kanban Board Layout**: Organize tasks across four columns - To Do, In Progress, Review, and Done
- **Drag and Drop**: Intuitive drag-and-drop interface for moving tasks between columns
- **Task Creation**: Create new tasks with title, description, and deadline
- **Task Editing**: Edit existing tasks to update details
- **Task Deletion**: Remove tasks that are no longer needed
- **Deadlines**: Set and track deadlines for each task
- **Task Sorting**: Automatic sorting of tasks by deadline (most urgent first)

### User Interface
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Collapsible Columns**: Expand or collapse columns to focus on specific work stages
- **Collapsible Sections**: Toggle visibility of Tasks and Analytics sections
- **Dark/Light Mode**: Switch between dark and light themes based on preference
- **Glassmorphism UI**: Modern glass-like UI with backdrop blur effects
- **Smooth Animations**: Polished transitions and animations throughout the app
- **Toast Notifications**: Feedback notifications for important actions
- **Ease of use**: Ability to drag tasks to different status categories

### Data Management
- **Persistent Storage**: Local storage integration to save and retrieve board state
- **CSV Export**: Export all task data to CSV format for external use
- **Clear All Tasks**: Option to clear all tasks with confirmation dialog
- **Save Board State**: Manual saving of the current board state

### Analytics Dashboard
- **Task Completion Progress**: Visual representation of overall completion rate
- **Task Status Breakdown**: Distribution of tasks across different status columns
- **Deadline Performance**: Tracking of overdue tasks and tasks completed early
- **Productivity Insights**: Metrics like efficiency rate and urgency index

### Accessibility and UX
- **System Theme Detection**: Automatic theme selection based on system preferences
- **Save State**: Save state in local storage so you never lose your progress
- **Keyboard Navigation**: Support for keyboard controls for improved accessibility
- **Mobile-Optimized Interactions**: Special handling for touch devices
- **Confirmation Dialogs**: Prevent accidental data loss with confirmation prompts

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/kmadden84/project-management.git
```

2. Navigate to the project directory
```
cd project-management
```

3. Install dependencies
```
npm install
```

4. Start the development server
```
npm start
```

5. Open http://localhost:3000 in your browser

### Build for Production
```
npm run build
```

## Deployment

This project is configured for deployment to GitHub Pages.

1. Ensure your changes are committed and pushed to your GitHub repository
2. Run the deploy command:
```
npm run deploy
```

3. Your application will be built and deployed to the `gh-pages` branch
4. After deployment, your application will be available at: https://kmadden84.github.io/project-management/

## Technologies Used

- **React**: Frontend library for building the user interface
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Heroicons**: SVG icon collection
- **date-fns**: Date utility library for working with deadlines
- **Local Storage API**: For persisting application state 
