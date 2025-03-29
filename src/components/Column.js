import React, { useState, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Task from './Task';
import { PlusIcon, ChevronDownIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

// Add a CSS class for scrollbar styling
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.7);
  }
  
  .task-swiper {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .task-swiper::-webkit-scrollbar {
    display: none;
  }
  
  .task-indicator {
    transition: all 0.3s ease;
  }
  
  .task-indicator-active {
    background-color: rgba(59, 130, 246, 0.7);
    width: 16px;
  }
  
  @media (min-width: 640px) {
    .task-swiper {
      scroll-snap-type: none;
    }
  }
  
  @media (max-width: 639px) {
    .task-swiper {
      scroll-snap-type: x mandatory;
    }
    
    .task-swiper > div {
      scroll-snap-align: center;
      flex: 0 0 100%;
    }
  }
`;

const Column = React.forwardRef(({ 
  id, 
  title, 
  tasks, 
  onAddTask, 
  onTaskUpdate, 
  onTaskDelete, 
  isCollapsed: parentIsCollapsed,
  onToggleCollapse,
  className = '',
  onTaskDrop
}, ref) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const taskListRef = useRef(null);
  
  // Initialize with the parent's collapsed state or default (based on mobile & column ID)
  const defaultState = id !== 'todo' && window.innerWidth < 640;
  const [localCollapsed, setLocalCollapsed] = useState(
    parentIsCollapsed !== undefined ? parentIsCollapsed : defaultState
  );
  
  // Determine if this column is collapsed based on local and parent states
  const isCollapsed = parentIsCollapsed !== undefined ? parentIsCollapsed : localCollapsed;
  
  // Add the styles to the document only once on the client side
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = scrollbarStyles;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);
  
  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      
      // Reset the current task index when switching to mobile
      if (mobile) {
        setCurrentTaskIndex(0);
      }
    };
    
    // Initialize
    checkMobile();
    
    // Update on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle scroll event to update the current task index
  useEffect(() => {
    if (isMobile && taskListRef.current) {
      const handleScroll = () => {
        if (taskListRef.current) {
          const scrollLeft = taskListRef.current.scrollLeft;
          const itemWidth = taskListRef.current.offsetWidth;
          const newIndex = Math.round(scrollLeft / itemWidth);
          setCurrentTaskIndex(newIndex);
        }
      };
      
      taskListRef.current.addEventListener('scroll', handleScroll);
      return () => taskListRef.current?.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile, tasks.length]);

  // Sync local state with parent prop whenever the parent state changes
  useEffect(() => {
    if (parentIsCollapsed !== undefined) {
      setLocalCollapsed(parentIsCollapsed);
    }
  }, [parentIsCollapsed]);

  const { setNodeRef } = useDroppable({
    id: id,
  });

  const handleTaskCancel = (taskId) => {
    if (onTaskDelete) {
      onTaskDelete(taskId);
    }
  };

  // This function explicitly toggles the local collapse state
  // If parent provided a callback, use it, otherwise manage state locally
  const handleToggleCollapse = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLocalCollapsed(prevState => !prevState);
  };

  // Determine column color based on ID
  const getColumnColor = () => {
    switch(id) {
      case 'todo':
        return 'from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20';
      case 'in-progress':
        return 'from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20';
      case 'review':
        return 'from-purple-50 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/20';
      case 'done':
        return 'from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20';
      default:
        return 'from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50';
    }
  };

  // Get matching border color
  const getBorderColor = () => {
    switch(id) {
      case 'todo':
        return 'border-blue-300/50 dark:border-blue-800/50';
      case 'in-progress':
        return 'border-amber-300/50 dark:border-amber-800/50';
      case 'review':
        return 'border-purple-300/50 dark:border-purple-800/50';
      case 'done':
        return 'border-emerald-300/50 dark:border-emerald-800/50';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };
  
  // Get header accent color
  const getHeaderAccent = () => {
    switch(id) {
      case 'todo':
        return 'bg-blue-200/30 dark:bg-blue-900/30';
      case 'in-progress':
        return 'bg-amber-200/30 dark:bg-amber-900/30';
      case 'review':
        return 'bg-purple-200/30 dark:bg-purple-900/30';
      case 'done':
        return 'bg-emerald-200/30 dark:bg-emerald-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };
  
  const handleHeaderClick = (e) => {
    // Only toggle if clicking the header itself or the chevron
    if (e.target.closest('.column-header')) {
      onToggleCollapse();
    }
  };

  const handleDragOver = (e) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.stopPropagation();
    
    // Set drop effect
    e.dataTransfer.dropEffect = 'move';
    
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    // Only consider it a leave if we're leaving the column
    // and not just moving between its children
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onTaskDrop) {
      onTaskDrop(taskId, id);
    }
  };

  // Navigate to the previous task (mobile only)
  const goToPrevTask = (e) => {
    e.stopPropagation();
    if (isMobile && taskListRef.current && currentTaskIndex > 0) {
      const newIndex = currentTaskIndex - 1;
      const itemWidth = taskListRef.current.offsetWidth;
      taskListRef.current.scrollTo({
        left: newIndex * itemWidth,
        behavior: 'smooth'
      });
      setCurrentTaskIndex(newIndex);
    }
  };
  
  // Navigate to the next task (mobile only)
  const goToNextTask = (e) => {
    e.stopPropagation();
    if (isMobile && taskListRef.current && currentTaskIndex < tasks.length - 1) {
      const newIndex = currentTaskIndex + 1;
      const itemWidth = taskListRef.current.offsetWidth;
      taskListRef.current.scrollTo({
        left: newIndex * itemWidth,
        behavior: 'smooth'
      });
      setCurrentTaskIndex(newIndex);
    }
  };

  // Handle column title toggle for collapse/expand
  const handleToggleClick = () => {
    // Pass the current collapsed state to the parent so it knows what to change it to
    onToggleCollapse();
  };

  return (
    <div 
      ref={ref}
      data-column-id={id}
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border ${
        isDragOver 
          ? 'border-blue-400/70 dark:border-blue-500/70 bg-blue-50/30 dark:bg-blue-900/30' 
          : 'border-gray-200/50 dark:border-gray-700/50'
      } overflow-hidden transition-all duration-300 ease-in-out ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className="column-header flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/80 cursor-pointer sticky top-0 z-10"
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{title}</h3>
          <span className="text-sm py-0.5 px-2 rounded-full bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-medium flex-shrink-0 border border-gray-200/50 dark:border-gray-600/50">
            {tasks.filter(task => task.title || task.description || task.deadline).length}
          </span>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${!isCollapsed ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
      
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'max-h-0' : 'max-h-[1000px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && !isCollapsed && tasks.length > 1 ? (
          <div className="relative px-1 pt-1 pb-6">
            {/* Swipeable container */}
            <div 
              ref={taskListRef}
              className="overflow-x-auto flex snap-x snap-mandatory scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="w-full flex-shrink-0 snap-center p-3"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <Task
                    key={task.id}
                    task={task}
                    onUpdate={(updatedTask) => onTaskUpdate(task.id, updatedTask)}
                    onCancel={onTaskDelete}
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation buttons */}
            {tasks.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-between px-1 pointer-events-none">
                <button 
                  onClick={goToPrevTask}
                  className={`p-1.5 rounded-full bg-white/70 dark:bg-gray-800/70 shadow-md pointer-events-auto ${currentTaskIndex === 0 ? 'opacity-30' : 'opacity-80'} backdrop-blur-sm`}
                  disabled={currentTaskIndex === 0}
                  aria-label="Previous task"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>
                
                <button 
                  onClick={goToNextTask}
                  className={`p-1.5 rounded-full bg-white/70 dark:bg-gray-800/70 shadow-md pointer-events-auto ${currentTaskIndex === tasks.length - 1 ? 'opacity-30' : 'opacity-80'} backdrop-blur-sm`}
                  disabled={currentTaskIndex === tasks.length - 1}
                  aria-label="Next task"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>
              </div>
            )}
            
            {/* Page indicator dots */}
            {tasks.length > 1 && (
              <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1 py-1">
                {tasks.map((_, index) => (
                  <div 
                    key={index}
                    className={`h-1.5 rounded-full ${
                      currentTaskIndex === index 
                        ? 'bg-blue-500/80 dark:bg-blue-400/80 w-4' 
                        : 'bg-gray-300/80 dark:bg-gray-600/80 w-2'
                    } transition-all duration-200`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {tasks.map((task) => (
              <Task
                key={task.id}
                task={task}
                onUpdate={(updatedTask) => onTaskUpdate(task.id, updatedTask)}
                onCancel={onTaskDelete}
              />
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No tasks yet</p>
                <p className="text-sm mt-1">Add or drag tasks here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

Column.displayName = 'Column';

export default Column; 