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

export default function Column({ 
  id, 
  title, 
  tasks, 
  onAddTask, 
  onTaskUpdate, 
  onTaskDelete, 
  isCollapsed: parentIsCollapsed,
  onToggleCollapse,
  className
}) {
  // Initialize with the parent's collapsed state or default (based on mobile & column ID)
  const defaultState = id !== 'todo' && window.innerWidth < 640;
  const [localCollapsed, setLocalCollapsed] = useState(
    parentIsCollapsed !== undefined ? parentIsCollapsed : defaultState
  );
  
  // Determine if this column is collapsed based on local and parent states
  const isCollapsed = parentIsCollapsed !== undefined ? parentIsCollapsed : localCollapsed;
  
  // Mobile detection and task swiping
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const taskListRef = useRef(null);
  
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
    
    console.log(`Column ${id} toggle clicked, collapsed: ${isCollapsed}`);
    
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setLocalCollapsed(prevState => !prevState);
    }
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

  return (
    <div
      ref={setNodeRef}
      className={`bg-gradient-to-br ${getColumnColor()} rounded-xl backdrop-blur-sm border ${getBorderColor()} 
        shadow-lg shadow-gray-200/50 dark:shadow-gray-900/30 flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'h-[60px] min-h-[60px]' : 'min-h-[200px] max-h-[calc(100vh-120px)]'}
        ${className || 'w-full sm:w-[calc(50%-12px)] xl:w-[calc(25%-18px)]'}`}
    >
      <div 
        className={`p-4 border-b ${!isCollapsed ? 'border-gray-200/50 dark:border-gray-700/50' : 'border-transparent'} flex items-center justify-between sticky top-0 z-10 ${getHeaderAccent()} rounded-t-xl backdrop-blur-sm cursor-pointer`}
        onClick={handleToggleCollapse}
      >
        <div className="flex items-center gap-2 flex-grow overflow-hidden">
          <button 
            className="p-1 hover:bg-white/30 dark:hover:bg-gray-700/50 rounded-md flex-shrink-0 transition-colors"
            onClick={handleToggleCollapse}
            aria-label={isCollapsed ? "Expand column" : "Collapse column"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          <span className="text-sm py-0.5 px-2 rounded-full bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-medium flex-shrink-0 border border-gray-200/50 dark:border-gray-600/50">
            {tasks.filter(task => task.title || task.description || task.deadline).length}
          </span>
        </div>
        {!isCollapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
            className="flex-shrink-0 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-700 transition-colors ml-1 shadow-sm backdrop-blur-sm"
            style={{
              borderRadius: '0.75rem',
              height: '32px',
              minWidth: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 12px'
            }}
            data-testid={`add-task-${id}`}
            aria-label="Add Task"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden lg:inline ml-1">Add</span>
          </button>
        )}
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}
      >
        {isMobile ? (
          <div className="relative h-full p-1">
            {/* Swipeable container */}
            <div 
              ref={taskListRef}
              className="task-swiper overflow-x-auto flex items-stretch w-full pb-2"
              style={{ overflowY: 'hidden' }}
            >
              <SortableContext
                items={tasks.map(task => task.id)}
                strategy={horizontalListSortingStrategy}
              >
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 w-full min-w-full flex-shrink-0">
                    <Task
                      task={task}
                      onUpdate={(updatedTask) => onTaskUpdate(task.id, updatedTask)}
                      onCancel={handleTaskCancel}
                    />
                  </div>
                ))}
              </SortableContext>
              
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 w-full">
                  <p>No tasks yet</p>
                  <p className="text-sm mt-1">Drag tasks here or click Add Task</p>
                </div>
              )}
            </div>
            
            {/* Navigation buttons for mobile */}
            {tasks.length > 1 && tasks.filter(task => task.title || task.description || task.deadline).length >= 2 && (
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
            {tasks.length > 1 && tasks.filter(task => task.title || task.description || task.deadline).length >= 2 && (
              <div className="absolute bottom-0 inset-x-0 flex justify-center gap-1 py-1">
                {tasks.map((_, index) => (
                  <div 
                    key={index}
                    className={`h-1.5 rounded-full task-indicator ${
                      currentTaskIndex === index 
                        ? 'task-indicator-active bg-blue-500/80 dark:bg-blue-400/80' 
                        : 'bg-gray-300/80 dark:bg-gray-600/80 w-4'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <SortableContext
                items={tasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {tasks.map((task) => (
                  <Task
                    key={task.id}
                    task={task}
                    onUpdate={(updatedTask) => onTaskUpdate(task.id, updatedTask)}
                    onCancel={handleTaskCancel}
                  />
                ))}
              </SortableContext>
              
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                  <p>No tasks yet</p>
                  <p className="text-sm mt-1">Drag tasks here or click Add Task</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 