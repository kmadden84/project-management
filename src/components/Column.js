import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

const Column = React.memo(React.forwardRef(({ 
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
  
  // Check if we're on mobile - memoize the resize handler
  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 640;
    setIsMobile(mobile);
    
    // Reset the current task index when switching to mobile
    if (mobile) {
      setCurrentTaskIndex(0);
    }
  }, []);
  
  useEffect(() => {
    // Initialize
    checkMobile();
    
    // Update on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);
  
  // Handle scroll event to update the current task index - memoize the scroll handler
  const handleScroll = useCallback(() => {
    if (taskListRef.current) {
      const scrollLeft = taskListRef.current.scrollLeft;
      const itemWidth = taskListRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setCurrentTaskIndex(newIndex);
    }
  }, []);
  
  useEffect(() => {
    if (isMobile && taskListRef.current) {
      taskListRef.current.addEventListener('scroll', handleScroll);
      return () => taskListRef.current?.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile, tasks.length, handleScroll]);

  // Sync local state with parent prop whenever the parent state changes
  useEffect(() => {
    if (parentIsCollapsed !== undefined) {
      setLocalCollapsed(parentIsCollapsed);
    }
  }, [parentIsCollapsed]);

  const { setNodeRef } = useDroppable({
    id: id,
  });

  const handleTaskCancel = useCallback((taskId) => {
    if (onTaskDelete) {
      onTaskDelete(taskId);
    }
  }, [onTaskDelete]);

  // This function explicitly toggles the local collapse state
  // If parent provided a callback, use it, otherwise manage state locally
  const handleToggleCollapse = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLocalCollapsed(prevState => !prevState);
  }, []);

  // Determine column color based on ID - memoized to avoid recalculation
  const columnColor = useMemo(() => {
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
  }, [id]);

  // Get matching border color - memoized to avoid recalculation
  const borderColor = useMemo(() => {
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
  }, [id]);
  
  // Get header accent color - memoized to avoid recalculation
  const headerAccent = useMemo(() => {
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
  }, [id]);
  
  const handleHeaderClick = useCallback((e) => {
    // Call the onToggleCollapse directly when the header is clicked
    onToggleCollapse();
  }, [onToggleCollapse]);

  const handleDragOver = useCallback((e) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.stopPropagation();
    
    // Set drop effect
    e.dataTransfer.dropEffect = 'move';
    
    if (!isDragOver) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e) => {
    // Only consider it a leave if we're leaving the column
    // and not just moving between its children
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onTaskDrop) {
      onTaskDrop(taskId, id);
    }
  }, [onTaskDrop, id]);

  // Navigate to the previous task (mobile only)
  const goToPrevTask = useCallback((e) => {
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
  }, [isMobile, currentTaskIndex]);
  
  // Navigate to the next task (mobile only)
  const goToNextTask = useCallback((e) => {
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
  }, [isMobile, currentTaskIndex, tasks.length]);

  // Handle column title toggle for collapse/expand
  const handleToggleClick = useCallback(() => {
    // Pass the current collapsed state to the parent so it knows what to change it to
    onToggleCollapse();
  }, [onToggleCollapse]);
  
  // Memoize task IDs array for SortableContext to prevent unnecessary re-renders
  const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

  return (
    <div 
      ref={ref}
      data-column-id={id}
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border ${
        isDragOver 
          ? 'border-blue-400/70 dark:border-blue-500/70 bg-blue-50/30 dark:bg-blue-900/30' 
          : borderColor
      } overflow-hidden transition-all duration-300 ease-in-out ${className} ${
        isCollapsed ? 'h-[56px] border-2' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className={`column-header flex items-center justify-between p-4 ${
          isCollapsed 
            ? `bg-gradient-to-r ${columnColor}` 
            : 'bg-gray-50/80 dark:bg-gray-800/80'
        } cursor-pointer sticky top-0 z-10`}
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
          isCollapsed ? 'max-h-0 opacity-0 m-0 p-0' : 'max-h-[80vh] opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile ? (
          // Mobile view - swipeable horizontal task list
          <div className="p-3">
            <div 
              className="relative overflow-hidden"
              ref={setNodeRef}
            >
              {/* Task swiper */}
              <div 
                ref={taskListRef}
                className="task-swiper flex overflow-x-auto pb-4 pt-2"
              >
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div key={task.id} className="px-1 flex-shrink-0 w-full">
                      <Task
                        task={task}
                        onUpdate={(updatedTask) => onTaskUpdate(task.id, updatedTask)}
                        onDelete={() => handleTaskCancel(task.id)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="w-full px-1">
                    <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No tasks yet</p>
                      <button 
                        onClick={() => onAddTask()}
                        className="mt-2 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        Add a task
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Pagination controls for mobile */}
              {tasks.length > 1 && (
                <div className="flex justify-between items-center mt-2">
                  <button 
                    className={`p-1 rounded-full ${
                      currentTaskIndex > 0 
                      ? 'text-gray-500 dark:text-gray-400' 
                      : 'text-gray-300 dark:text-gray-600 cursor-default'
                    }`}
                    onClick={goToPrevTask}
                    disabled={currentTaskIndex === 0}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  <div className="flex space-x-1 justify-center">
                    {tasks.map((_, idx) => (
                      <div 
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentTaskIndex 
                          ? 'bg-blue-500 dark:bg-blue-400 w-4' 
                          : 'bg-gray-300 dark:bg-gray-600 w-1.5'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <button 
                    className={`p-1 rounded-full ${
                      currentTaskIndex < tasks.length - 1
                      ? 'text-gray-500 dark:text-gray-400' 
                      : 'text-gray-300 dark:text-gray-600 cursor-default'
                    }`}
                    onClick={goToNextTask}
                    disabled={currentTaskIndex >= tasks.length - 1}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Desktop view - vertical list of tasks
          <div 
            className="p-3 custom-scrollbar overflow-y-auto max-h-[calc(100vh-220px)]"
            ref={setNodeRef}
          >
            <SortableContext 
              items={taskIds} 
              strategy={verticalListSortingStrategy}
            >
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Task
                      key={task.id}
                      task={task}
                      onUpdate={(updatedTask) => onTaskUpdate(task.id, updatedTask)}
                      onDelete={() => handleTaskCancel(task.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tasks yet</p>
                  <button 
                    onClick={() => onAddTask()}
                    className="mt-2 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                  >
                    Add a task
                  </button>
                </div>
              )}
            </SortableContext>
          </div>
        )}
      </div>
    </div>
  );
}));

Column.displayName = 'Column';

export default Column; 