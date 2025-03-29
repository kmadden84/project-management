import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Column from './Column';
import { AdjustmentsHorizontalIcon, ChevronDownIcon, ExclamationTriangleIcon, SunIcon, MoonIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, ChartBarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from './ThemeProvider';

// Custom toast content with icon for board save
const BoardSavedToast = () => (
  <div className="flex items-center">
    <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
    <span>Board state and preferences saved!</span>
  </div>
);

const defaultColumns = [
  { id: 'todo', title: 'To Do', tasks: [] },
  { id: 'in-progress', title: 'In Progress', tasks: [] },
  { id: 'review', title: 'Review', tasks: [] },
  { id: 'done', title: 'Done', tasks: [] },
];

export default function Board() {
  const { theme, toggleTheme, saveThemePreference } = useTheme();
  const [darkMode, setDarkMode] = useState(theme === 'dark');
  
  // Sync darkMode with theme from ThemeProvider
  useEffect(() => {
    setDarkMode(theme === 'dark');
  }, [theme]);

  const [columns, setColumns] = useState(() => {
    // Try to load saved state from localStorage
    const savedState = localStorage.getItem('boardState');
    return savedState ? JSON.parse(savedState) : defaultColumns;
  });
  const [activeTask, setActiveTask] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [allColumnsCollapsed, setAllColumnsCollapsed] = useState(false);
  const [tasksSectionCollapsed, setTasksSectionCollapsed] = useState(false);
  const [analyticsSectionCollapsed, setAnalyticsSectionCollapsed] = useState(true);
  
  // State to track column collapse states - fixed initialization
  const [columnStates, setColumnStates] = useState(() => {
    const isMobileView = window.innerWidth < 640;
    return {
      todo: true, // Todo is always expanded 
      'in-progress': !isMobileView, 
      review: !isMobileView,
      done: !isMobileView
    };
  });
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  // Update allColumnsCollapsed based on column states
  useEffect(() => {
    // Check if all non-todo columns are collapsed
    const areAllCollapsed = !columnStates['in-progress'] && 
                          !columnStates['review'] && 
                          !columnStates['done'];
    
    setAllColumnsCollapsed(areAllCollapsed);
  }, [columnStates]);
  
  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      
      // Reset column states when switching between mobile and desktop
      if (mobile !== isMobile) {
        setColumnStates(prev => ({
          todo: true, // Todo is always expanded
          'in-progress': !mobile,
          review: !mobile,
          done: !mobile
        }));
      }
    };
    
    // Initialize
    checkMobile();
    
    // Update on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Create a ref for the options dropdown container
  const optionsRef = useRef(null);

  // Handle clicks outside of the options dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (optionsRef.current && !optionsRef.current.contains(event.target) && showOptions) {
        setShowOptions(false);
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  // On initial mount only - ensure theme class is applied to document
  useEffect(() => {
    // Apply correct theme class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);
  
  // This effect runs whenever darkMode changes to keep the DOM in sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // Save board state to localStorage
  const saveBoardState = () => {
    // Save the board columns and tasks
    localStorage.setItem('boardState', JSON.stringify(columns));
    
    // Explicitly save the current theme preference
    saveThemePreference();
    
    // Show toast with custom styling
    toast(
      <BoardSavedToast />, 
      {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: "backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 shadow-lg",
        bodyClassName: "font-medium",
        toastId: "board-saved", // Prevent duplicate toasts
      }
    );
    
    setShowOptions(false);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    // Use the ThemeProvider's toggleTheme function to ensure consistency
    toggleTheme();
    
    // Toast notification will be shown after the state updates
    toast(
      <div className="flex items-center">
        {!darkMode ? 
          <MoonIcon className="h-5 w-5 mr-2 text-indigo-300" /> : 
          <SunIcon className="h-5 w-5 mr-2 text-amber-400" />
        }
        <span>Theme changed to {!darkMode ? 'Dark' : 'Light'} mode</span>
      </div>, 
      {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        className: "backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 shadow-lg",
        toastId: "theme-changed"
      }
    );
    
    setShowThemeModal(false);
    setShowOptions(false);
  };

  // Show theme selection modal
  const showThemeSelector = () => {
    setShowOptions(false);
    setShowThemeModal(true);
  };

  // Select light mode
  const selectLightMode = () => {
    // Only change if we're not already in light mode
    if (darkMode) {
      toggleTheme();
      
      toast(
        <div className="flex items-center">
          <SunIcon className="h-5 w-5 mr-2 text-amber-400" />
          <span>Theme changed to Light mode</span>
        </div>, 
        {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: "backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 shadow-lg",
          toastId: "theme-light"
        }
      );
    }
    
    setShowThemeModal(false);
  };
  
  // Select dark mode
  const selectDarkMode = () => {
    // Only change if we're not already in dark mode
    if (!darkMode) {
      toggleTheme();
      
      toast(
        <div className="flex items-center">
          <MoonIcon className="h-5 w-5 mr-2 text-indigo-300" />
          <span>Theme changed to Dark mode</span>
        </div>, 
        {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: "backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 shadow-lg",
          toastId: "theme-dark"
        }
      );
    }
    
    setShowThemeModal(false);
  };

  // Cancel theme selection
  const cancelThemeSelection = () => {
    setShowThemeModal(false);
  };

  // Toggle collapse state for all columns
  const toggleAllColumns = () => {
    const newState = !allColumnsCollapsed;
    setAllColumnsCollapsed(newState);
    
    // Update all column states
    setColumnStates({
      todo: true, // Todo is always expanded
      'in-progress': !newState,
      review: !newState,
      done: !newState
    });
    
    setShowOptions(false);
  };

  // Handle individual column collapse toggle - connected to the Column component
  const handleColumnToggle = (columnId, isCollapsed) => {
    // Allow all columns to be collapsible
    setColumnStates(prev => {
      const newState = {
        ...prev,
        [columnId]: !prev[columnId]
      };
      
      return newState;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnByTaskId = (taskId) => {
    return columns.find(column => 
      column.tasks.some(task => task.id === taskId)
    );
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const activeColumn = findColumnByTaskId(active.id);
    if (activeColumn) {
      const task = activeColumn.tasks.find(t => t.id === active.id);
      setActiveTask(task);
    }
  };

  // Sort tasks by deadline
  const sortTasksByDeadline = (tasks) => {
    return [...tasks].sort((a, b) => {
      // If both have deadlines, sort by date (most urgent first)
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      // Tasks with deadlines come before tasks without deadlines
      if (a.deadline && !b.deadline) {
        return -1;
      }
      if (!a.deadline && b.deadline) {
        return 1;
      }
      // If neither has a deadline, maintain the existing order
      return 0;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeColumn = findColumnByTaskId(activeId);
    // Check if we're dropping over a column or a task
    const isOverColumn = columns.map(col => col.id).includes(overId);
    const overColumn = isOverColumn 
                      ? columns.find(col => col.id === overId)
                      : findColumnByTaskId(overId);

    if (!activeColumn || !overColumn) return;

    // Get the active task
    const activeTask = activeColumn.tasks.find(task => task.id === activeId);
    
    // If dropping on a column
    if (isOverColumn) {
      setColumns(columns => {
        return columns.map(col => {
          // Remove from source column
          if (col.id === activeColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter(task => task.id !== activeId)
            };
          }
          // Add to target column and sort by deadline
          if (col.id === overId) {
            const updatedTasks = [...col.tasks, activeTask];
            return {
              ...col,
              tasks: sortTasksByDeadline(updatedTasks)
            };
          }
          return col;
        });
      });
    } 
    // If dropping on another task
    else {
      // Only reorder if in the same column
      if (activeColumn.id === overColumn.id) {
        const overTaskIndex = overColumn.tasks.findIndex(task => task.id === overId);
        const activeTaskIndex = activeColumn.tasks.findIndex(task => task.id === activeId);
        
        setColumns(columns => {
          return columns.map(col => {
            if (col.id === activeColumn.id) {
              const newTasks = [...col.tasks];
              newTasks.splice(activeTaskIndex, 1);
              newTasks.splice(overTaskIndex, 0, activeTask);
              return {
                ...col,
                tasks: newTasks
              };
            }
            return col;
          });
        });
      } 
      // Move to a different column and sort by deadline
      else {
        setColumns(columns => {
          return columns.map(col => {
            // Remove from source column
            if (col.id === activeColumn.id) {
              return {
                ...col,
                tasks: col.tasks.filter(task => task.id !== activeId)
              };
            }
            // Add to target column and sort by deadline instead of inserting at specific position
            if (col.id === overColumn.id) {
              const updatedTasks = [...col.tasks, activeTask];
              return {
                ...col,
                tasks: sortTasksByDeadline(updatedTasks)
              };
            }
            return col;
          });
        });
      }
    }
  };

  const addTask = (columnId) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      deadline: null,
      createdAt: new Date(),
      isEditing: true, // Start in edit mode
    };

    setColumns(columns =>
      columns.map(column =>
        column.id === columnId
          ? { 
              ...column, 
              // Add the new task and sort all tasks by deadline
              tasks: sortTasksByDeadline([...column.tasks, newTask])
            }
          : column
      )
    );
  };

  const handleTaskUpdate = (columnId, taskId, updatedTask) => {
    setColumns(columns =>
      columns.map(column =>
        column.id === columnId
          ? {
              ...column,
              tasks: sortTasksByDeadline(
                column.tasks.map(task =>
                  task.id === taskId
                    ? { ...updatedTask, isEditing: false }
                    : task
                )
              ),
            }
          : column
      )
    );
  };

  const handleTaskDelete = (columnId, taskId) => {
    setColumns(columns =>
      columns.map(column =>
        column.id === columnId
          ? { ...column, tasks: column.tasks.filter(task => task.id !== taskId) }
          : column
      )
    );
  };

  // Prompt for clear all tasks
  const promptClearAllTasks = () => {
    setShowOptions(false);
    setShowClearConfirmation(true);
  };

  // Clear all tasks from all columns
  const handleClearAllTasks = () => {
    setColumns(columns =>
      columns.map(column => ({
        ...column,
        tasks: []
      }))
    );
    setShowClearConfirmation(false);
  };

  // Cancel clear all tasks
  const cancelClearAllTasks = () => {
    setShowClearConfirmation(false);
  };

  // Export all tasks as CSV
  const handleExportCSV = () => {
    // Prepare the CSV data
    const csvRows = [];
    
    // Add header row
    csvRows.push(['Column', 'Task ID', 'Title', 'Description', 'Deadline']);
    
    // Add data rows
    columns.forEach(column => {
      column.tasks.forEach(task => {
        const deadline = task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd HH:mm:ss') : '';
        csvRows.push([
          column.title,
          task.id,
          task.title,
          task.description,
          deadline
        ]);
      });
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.map(cell => 
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(',')).join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `project-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowOptions(false);
  };

  // Calculate progress statistics for analytics
  const calculateAnalytics = () => {
    const totalTasks = columns.reduce((total, column) => total + column.tasks.length, 0);
    const completedTasks = columns.find(col => col.id === 'done')?.tasks.length || 0;
    const inProgressTasks = columns.find(col => col.id === 'in-progress')?.tasks.length || 0;
    const reviewTasks = columns.find(col => col.id === 'review')?.tasks.length || 0;
    const todoTasks = columns.find(col => col.id === 'todo')?.tasks.length || 0;
    
    // Calculate completion percentage
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate overdue tasks
    const overdueTasks = columns.reduce((count, column) => {
      const overdue = column.tasks.filter(task => {
        if (!task.deadline) return false;
        return new Date(task.deadline) < new Date() && column.id !== 'done';
      }).length;
      return count + overdue;
    }, 0);
    
    // Calculate completed early tasks
    const completedEarlyTasks = columns.find(col => col.id === 'done')?.tasks.filter(task => {
      if (!task.deadline) return false;
      // Consider a task completed early if it was finished at least a day before deadline
      return new Date(task.deadline) > new Date();
    }).length || 0;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
      completionPercentage,
      overdueTasks,
      completedEarlyTasks
    };
  };
  
  // Get analytics data
  const analytics = calculateAnalytics();
  
  // Toggle Tasks section collapse
  const toggleTasksSection = () => {
    setTasksSectionCollapsed(!tasksSectionCollapsed);
  };
  
  // Toggle Analytics section collapse
  const toggleAnalyticsSection = () => {
    setAnalyticsSectionCollapsed(!analyticsSectionCollapsed);
  };

  // Add the columnsRef that was missing
  const columnsRef = useRef(new Map());

  // Handle task drop
  const handleTaskDrop = (taskId, targetColumnId) => {
    const sourceColumn = columns.find(col => 
      col.tasks.some(task => task.id === taskId)
    );
    
    if (!sourceColumn || sourceColumn.id === targetColumnId) {
      return;
    }
    
    const taskToMove = sourceColumn.tasks.find(task => task.id === taskId);
    if (!taskToMove) return;
    
    // Move task to new column
    setColumns(columns => {
      return columns.map(col => {
        // Remove from source column
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
          };
        }
        // Add to target column
        if (col.id === targetColumnId) {
          // Sort tasks by deadline if we have sortTasksByDeadline function
          if (typeof sortTasksByDeadline === 'function') {
            return {
              ...col,
              tasks: sortTasksByDeadline([...col.tasks, taskToMove])
            };
          }
          return {
            ...col,
            tasks: [...col.tasks, taskToMove]
          };
        }
        return col;
      });
    });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Toast Container with explicit z-index */}
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
        limit={3}
        toastClassName="rounded-xl overflow-hidden shadow-lg"
        style={{ zIndex: 9999 }}
      />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-blue-800 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">Tasks and Analytics</h1>
        
        <div className="relative" ref={optionsRef}>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 bg-white/60 dark:bg-gray-800/60 rounded-xl shadow-sm hover:bg-white/90 dark:hover:bg-gray-800/90 backdrop-blur-sm transition-colors flex items-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="h-6 w-6" />
            <span className="hidden sm:inline">Options</span>
          </button>
          
          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm ring-1 ring-black/5 ring-opacity-5 z-20 border border-gray-200/50 dark:border-gray-700/50">
              <div className="py-1 bg-transparent">
                <button 
                  onClick={toggleAllColumns}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 first:rounded-t-xl last:rounded-b-xl"
                >
                  {allColumnsCollapsed ? 'Expand All Columns' : 'Collapse All Columns'}
                </button>
                <button 
                  onClick={promptClearAllTasks}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70"
                >
                  Clear All Tasks
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70"
                >
                  Export as CSV
                </button>
                <button 
                  onClick={saveBoardState}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 first:rounded-t-xl last:rounded-b-xl"
                >
                  Save Board State
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tasks Section */}
      <div className="mb-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 ease-in-out">
        <button 
          onClick={toggleTasksSection}
          className="w-full flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors"
        >
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tasks</h2>
          </div>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${!tasksSectionCollapsed ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {!tasksSectionCollapsed && (
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-6 justify-center sm:justify-start">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  id={column.id}
                  ref={el => {
                    if (el) {
                      columnsRef.current.set(column.id, el);
                    } else {
                      columnsRef.current.delete(column.id);
                    }
                  }}
                  title={column.title}
                  tasks={column.tasks}
                  onAddTask={() => addTask(column.id)}
                  onTaskUpdate={(taskId, updatedTask) =>
                    handleTaskUpdate(column.id, taskId, updatedTask)
                  }
                  onTaskDelete={(taskId) => handleTaskDelete(column.id, taskId)}
                  isCollapsed={!columnStates[column.id]}
                  onToggleCollapse={() => handleColumnToggle(column.id, !columnStates[column.id])}
                  className="w-full sm:w-[calc(50%-12px)] xl:w-[calc(25%-18px)]"
                  onTaskDrop={handleTaskDrop}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Analytics Section */}
      <div className="mb-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 ease-in-out">
        <button 
          onClick={toggleAnalyticsSection}
          className="w-full flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors"
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-purple-500 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Analytics</h2>
          </div>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${!analyticsSectionCollapsed ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {!analyticsSectionCollapsed && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task Completion Progress */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-5 shadow-md">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Task Completion</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 mb-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full h-6 flex items-center justify-center text-xs font-medium text-white transition-all duration-500 ease-in-out"
                    style={{ width: `${analytics.completionPercentage}%` }}
                  >
                    {analytics.completionPercentage}%
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Completed: {analytics.completedTasks}/{analytics.totalTasks}</span>
                  <span>{analytics.completionPercentage}% Complete</span>
                </div>
              </div>
              
              {/* Task Status Breakdown */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-5 shadow-md">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Task Status</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">To Do</span>
                      <span className="text-sm text-gray-700 dark:text-gray-200">{analytics.todoTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${analytics.totalTasks > 0 ? (analytics.todoTasks / analytics.totalTasks) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">In Progress</span>
                      <span className="text-sm text-gray-700 dark:text-gray-200">{analytics.inProgressTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${analytics.totalTasks > 0 ? (analytics.inProgressTasks / analytics.totalTasks) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Review</span>
                      <span className="text-sm text-gray-700 dark:text-gray-200">{analytics.reviewTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${analytics.totalTasks > 0 ? (analytics.reviewTasks / analytics.totalTasks) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Done</span>
                      <span className="text-sm text-gray-700 dark:text-gray-200">{analytics.completedTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Deadline Stats */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-5 shadow-md">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Deadline Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50/50 dark:bg-red-900/20 rounded-lg p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.overdueTasks}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 text-center">Overdue Tasks</span>
                  </div>
                  <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.completedEarlyTasks}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 text-center">Completed Early</span>
                  </div>
                </div>
              </div>
              
              {/* Productivity Stats */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-5 shadow-md">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Productivity Insights</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Efficiency Rate</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {analytics.totalTasks > 0 
                          ? `${Math.round((analytics.completedTasks - analytics.overdueTasks) / analytics.totalTasks * 100)}%` 
                          : '0%'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Urgency Index</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {analytics.totalTasks > 0 
                          ? analytics.overdueTasks > 0 
                            ? 'High' 
                            : analytics.inProgressTasks > analytics.todoTasks 
                              ? 'Medium' 
                              : 'Low'
                          : 'None'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Tasks Per Category</span>
                      <span className="font-medium text-gray-800 dark:text-white">{analytics.totalTasks / 4}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Clear All Tasks?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to clear all tasks? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelClearAllTasks}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllTasks}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600/90 hover:bg-red-700 rounded-lg transition-colors backdrop-blur-sm shadow-sm"
              >
                Clear Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Choose Theme</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={selectLightMode}
                className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
                  !darkMode ? 'ring-2 ring-blue-500 bg-blue-50/80' : 'bg-white/80 hover:bg-gray-50/80 border border-gray-200/50'
                }`}
              >
                <SunIcon className="h-8 w-8 text-amber-500 mb-2" />
                <span className="text-gray-800 font-medium">Light Mode</span>
              </button>
              <button
                onClick={selectDarkMode}
                className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
                  darkMode ? 'ring-2 ring-blue-500 bg-gray-700/80' : 'bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50'
                }`}
              >
                <MoonIcon className="h-8 w-8 text-indigo-300 mb-2" />
                <span className="text-gray-200 font-medium">Dark Mode</span>
              </button>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelThemeSelection}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors backdrop-blur-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 