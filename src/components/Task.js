import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon, CalendarIcon, ClockIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Simpler date handling
import dayjs from 'dayjs';

// Custom DatePicker component
function DatePicker({ value, onChange, buttonRef, isOpen, onToggle }) {
  const [currentMonth, setCurrentMonth] = useState(value ? dayjs(value) : dayjs());
  const [selectedDate, setSelectedDate] = useState(value ? dayjs(value) : null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Set up the calendar days
  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf('month').day(); // 0 = Sunday
  const lastMonthDays = currentMonth.subtract(1, 'month').daysInMonth();
  
  // Create days grid with previous, current, and next month days
  const days = [];
  
  // Fill in previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: lastMonthDays - i,
      month: 'prev',
      date: currentMonth.subtract(1, 'month').date(lastMonthDays - i)
    });
  }
  
  // Fill in current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: 'current',
      date: currentMonth.date(i)
    });
  }
  
  // Fill in next month days to complete the grid (up to 42 total cells for 6 weeks)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      month: 'next',
      date: currentMonth.add(1, 'month').date(i)
    });
  }
  
  // Update position when opened
  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 280) // Ensure calendar is wide enough
      });
    }
  }, [isOpen, buttonRef]);
  
  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    function handleClickOutside(event) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        onToggle(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle, buttonRef]);
  
  // Handle date selection
  const handleDateClick = (date) => {
    const newDate = date.toDate();
    
    // If existing value, keep the time
    if (value) {
      const existingDate = dayjs(value);
      newDate.setHours(existingDate.hour());
      newDate.setMinutes(existingDate.minute());
    }
    
    setSelectedDate(date);
    onChange({ target: { value: date.format('YYYY-MM-DD') } });
    onToggle(false);
  };
  
  // Move to previous/next month
  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  
  // Format month title
  const monthTitle = currentMonth.format('MMMM YYYY');
  
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '280px', // Fixed width calendar
        zIndex: 9999
      }}
      className="rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="bg-white dark:bg-gray-800 p-2">
        {/* Calendar header */}
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={prevMonth}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="text-gray-800 dark:text-white font-medium">
            {monthTitle}
          </div>
          <button 
            onClick={nextMonth}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div 
              key={index} 
              className={`text-center text-xs py-1 font-medium ${index === 0 || index === 6 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-gray-500 dark:text-gray-400'}`}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            // Determine if this day is today
            const isToday = day.date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
            
            // Determine if this day is selected
            const isSelected = selectedDate && day.date.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
            
            // Styling classes based on day state
            let dayClasses = "text-center text-xs h-8 w-8 flex items-center justify-center rounded-full ";
            
            if (day.month === 'current') {
              // Current month day
              dayClasses += isSelected 
                ? "bg-blue-500 text-white" 
                : isToday 
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300" 
                  : "text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700";
            } else {
              // Previous or next month day
              dayClasses += "text-gray-400 dark:text-gray-600";
            }
            
            return (
              <button
                key={index}
                onClick={() => day.month === 'current' && handleDateClick(day.date)}
                disabled={day.month !== 'current'}
                className={dayClasses}
              >
                {day.day}
              </button>
            );
          })}
        </div>
        
        {/* Footer with clear button */}
        <div className="mt-2 flex justify-start border-t border-gray-200 dark:border-gray-700 pt-2">
          <button
            onClick={() => {
              onChange({ target: { value: '' } });
              setSelectedDate(null);
              onToggle(false);
            }}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Time dropdown component that renders in a portal
function TimeDropdown({ isOpen, onClose, timeOptions, selectedIndex, onSelect, buttonRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 9999
      }}
      className="shadow-lg rounded-md py-1 max-h-52 overflow-y-auto"
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
        {timeOptions.map((time, index) => (
          <button
            key={index}
            type="button"
            className={`w-full text-left px-3 py-1.5 text-xs ${
              index === selectedIndex 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => {
              // Call onSelect with the time parameters
              onSelect(time.hour, time.minute);
              // Close after selection
              onClose();
            }}
          >
            {time.display}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

// For time selection - completely new implementation
const SimpleTimeSelector = ({ value, onChange, buttonLabel = '12:00 PM' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate time options (12-hour format with AM/PM)
  const timeOptions = [];
  ['AM', 'PM'].forEach(period => {
    for (let hour = 0; hour < 12; hour++) {
      const displayHour = hour === 0 ? 12 : hour;
      const actualHour = period === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
      
      timeOptions.push({
        label: `${displayHour}:00 ${period}`,
        hour: actualHour,
        minute: 0
      });
      
      timeOptions.push({
        label: `${displayHour}:30 ${period}`,
        hour: actualHour,
        minute: 30
      });
    }
  });

  // Format time value for display
  const formatTimeDisplay = (date) => {
    if (!date) return buttonLabel;
    
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Check if a time option is currently selected
  const isTimeSelected = (hour, minute) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getHours() === hour && d.getMinutes() === minute;
  };

  // Handle time selection
  const handleTimeSelect = (hour, minute) => {
    // Create a new date based on current value or today
    let date;
    if (value) {
      date = new Date(value);
    } else {
      date = new Date();
    }
    
    // Set the time components
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    // Call the onChange handler with the new date
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-lg bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white flex justify-between items-center"
      >
        <span className="text-sm">{value ? formatTimeDisplay(value) : buttonLabel}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + window.scrollY + 4 : 0,
            left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left + window.scrollX : 0,
            width: 180,
            maxHeight: 300,
            zIndex: 9999,
            overflowY: 'auto'
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg"
        >
          {/* AM Section */}
          <div className="p-1 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
            AM
          </div>
          
          <div className="py-1">
            {timeOptions.filter(option => option.hour < 12).map((option, index) => (
              <button
                key={index}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm ${
                  isTimeSelected(option.hour, option.minute)
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleTimeSelect(option.hour, option.minute)}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* PM Section */}
          <div className="p-1 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
            PM
          </div>
          
          <div className="py-1">
            {timeOptions.filter(option => option.hour >= 12).map((option, index) => (
              <button
                key={index}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm ${
                  isTimeSelected(option.hour, option.minute)
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleTimeSelect(option.hour, option.minute)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function Task({ task, onUpdate, onCancel }) {
  const [editedTask, setEditedTask] = useState({ ...task });
  const [isEditing, setIsEditing] = useState(task.isEditing || false);
  const [errors, setErrors] = useState({});
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const titleInputRef = useRef(null);
  const timeButtonRef = useRef(null);
  const dateButtonRef = useRef(null);
  
  // Add custom styles for select dropdown
  useEffect(() => {
    // Check if the style already exists
    if (!document.getElementById('custom-select-styles')) {
      const style = document.createElement('style');
      style.id = 'custom-select-styles';
      style.innerHTML = `
        /* Customize select appearance */
        select.time-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
        
        /* Customize option groups */
        select.time-select optgroup {
          font-size: 0.75rem;
          font-weight: bold;
          color: #6B7280;
          background-color: #f8f9fa;
          padding: 4px 8px;
        }
        
        /* Customize options */
        select.time-select option {
          padding: 8px 12px;
          font-size: 0.875rem;
        }
        
        /* Selected option styling */
        select.time-select option:checked {
          background-color: #3b82f6;
          color: white;
        }
        
        /* Hover effect */
        select.time-select option:hover {
          background-color: #f3f4f6;
        }
        
        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          select.time-select optgroup {
            background-color: #1f2937;
            color: #9ca3af;
          }
          
          select.time-select option:hover {
            background-color: #374151;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Start in edit mode for empty new tasks
  useEffect(() => {
    if (task.isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [task.isEditing]);
  
  // Close time dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (timeButtonRef.current && !timeButtonRef.current.contains(event.target) && timeDropdownOpen) {
        setTimeDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [timeDropdownOpen]);
  
  // Update edited task when task prop changes
  useEffect(() => {
    setEditedTask(task);
    // Also update editing state if task.isEditing changes
    setIsEditing(task.isEditing || false);
    setErrors({});
  }, [task]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTask((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    
    if (!value) {
      setEditedTask(prev => ({ ...prev, deadline: null }));
      if (errors.deadline) {
        setErrors(prev => ({ ...prev, deadline: null }));
      }
      return;
    }
    
    try {
      // Get the current time from the existing deadline or use current time
      const currentTime = editedTask.deadline 
        ? dayjs(editedTask.deadline) 
        : dayjs();
      
      // Create a new date with the selected date but keep the current time
      const newDate = dayjs(value)
        .hour(currentTime.hour())
        .minute(currentTime.minute())
        .second(0)
        .toDate();
      
      setEditedTask((prev) => ({ ...prev, deadline: newDate }));
      
      // Clear deadline error if it exists
      if (errors.deadline) {
        setErrors(prev => ({ ...prev, deadline: null }));
      }
    } catch (error) {
      console.error("Error setting date:", error);
    }
  };

  // Generate time options
  const generateTimeOptions = () => {
    // Create times in half-hour increments (12am to 11:30pm)
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourDisplay = hour % 12 === 0 ? 12 : hour % 12;
      const period = hour < 12 ? 'AM' : 'PM';
      
      // On the hour
      times.push({
        display: `${hourDisplay}:00 ${period}`,
        hour: hour,
        minute: 0,
        period
      });
      
      // Half hour
      times.push({
        display: `${hourDisplay}:30 ${period}`,
        hour: hour,
        minute: 30,
        period
      });
    }
    
    return times;
  };
  
  // Get current time selection index
  const getCurrentTimeIndex = () => {
    if (!editedTask.deadline) {
      // Default to 12:00 PM
      return generateTimeOptions().findIndex(t => t.display === '12:00 PM');
    }
    
    const d = dayjs(editedTask.deadline);
    const hour = d.hour();
    const minute = d.minute();
    
    // Find closest time (rounding down)
    const timeIndex = generateTimeOptions().findIndex(
      t => t.hour === hour && (minute < 30 ? t.minute === 0 : t.minute === 30)
    );
    
    return timeIndex !== -1 ? timeIndex : 0;
  };

  // For debugging
  console.log("Current deadline in state:", editedTask.deadline);

  const handleSubmit = () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    // Update the task
    onUpdate(editedTask);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // If it's a new task (no content) and we cancel, delete it
    if (!task.title && !task.description && !task.deadline) {
      onCancel(task.id);
      return;
    }
    
    // Otherwise reset to original values
    setEditedTask(task);
    setIsEditing(false);
    setErrors({});
  };

  const handleDelete = (e) => {
    // Stop propagation to prevent drag and other events
    e.stopPropagation();
    e.preventDefault();
    
    if (onCancel) {
      onCancel(task.id);
    }
  };

  // Handle time change directly
  const handleTimeChange = (hour, minute) => {
    // Create a new date based on the existing one or current date
    const date = editedTask.deadline ? new Date(editedTask.deadline) : new Date();
    
    // Update the time components
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    // Update both edited task state and parent component
    const updatedTask = { ...editedTask, deadline: date };
    setEditedTask(updatedTask);
    
    // Directly update the parent component
    if (isEditing) {
      // Don't automatically update the parent during editing, wait for Save
    } else {
      onUpdate(updatedTask);
    }
    
    // Clear any deadline errors
    if (errors.deadline) {
      setErrors(prev => ({ ...prev, deadline: null }));
    }
    
    // Close dropdown
    setTimeDropdownOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editedTask.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!editedTask.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!editedTask.deadline) {
      newErrors.deadline = 'Deadline is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format date for date input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = dayjs(date);
    return d.format('YYYY-MM-DD');
  };
  
  // Format date for display (MMM D, YYYY)
  const formatDateForDisplay = (date) => {
    if (!date) return 'Select date';
    const d = dayjs(date);
    return d.format('MMM D, YYYY');
  };
  
  // Format time for display (hh:mm A)
  const formatTimeForDisplay = (date) => {
    if (!date) return '12:00 PM';
    
    // Convert to Date object if it's an ISO string
    const d = new Date(date);
    
    // Format manually to ensure consistency
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    
    return `${hours}:${minutes} ${period}`;
  };

  // Don't show empty tasks in view mode
  if (!isEditing && !task.title && !task.description && !task.deadline) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg shadow-gray-200/40 dark:shadow-gray-900/40 border ${
        isEditing 
          ? 'border-blue-300/50 dark:border-blue-700/50 ring-2 ring-blue-200/50 dark:ring-blue-800/30' 
          : 'border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/70 dark:hover:border-gray-600/70'
      } transition-all duration-200`}
    >
      {isEditing ? (
        // Edit Mode
        <div className="space-y-3">
          <div>
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={editedTask.title || ''}
              onChange={handleInputChange}
              placeholder="Task title"
              className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500 dark:border-red-700' : 'border-gray-300/50 dark:border-gray-600/50'} rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-600/50`}
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.title}</p>
            )}
          </div>
          
          <div>
            <textarea
              name="description"
              value={editedTask.description || ''}
              onChange={handleInputChange}
              placeholder="Description"
              className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500 dark:border-red-700' : 'border-gray-300/50 dark:border-gray-600/50'} rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-600/50 min-h-[80px]`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.description}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Deadline:</label>
            <div className="flex flex-wrap gap-2">
              <div className="flex-grow min-w-[140px] relative">
                <button
                  ref={dateButtonRef}
                  type="button"
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  className={`w-full px-3 py-2 border flex justify-between items-center ${errors.deadline ? 'border-red-500 dark:border-red-700' : 'border-gray-300/50 dark:border-gray-600/50'} rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-600/50 text-sm text-left`}
                >
                  <span>{formatDateForDisplay(editedTask.deadline)}</span>
                  <CalendarIcon className="h-4 w-4 ml-1 text-gray-400" />
                </button>
                
                <DatePicker
                  value={editedTask.deadline}
                  onChange={handleDateChange}
                  buttonRef={dateButtonRef}
                  isOpen={datePickerOpen}
                  onToggle={setDatePickerOpen}
                />
              </div>
              
              <div className="w-[110px]">
                <SimpleTimeSelector 
                  value={editedTask.deadline}
                  onChange={(date) => {
                    // Update task with new date
                    setEditedTask({...editedTask, deadline: date});
                    
                    // Clear deadline error if it exists
                    if (errors.deadline) {
                      setErrors(prev => ({ ...prev, deadline: null }));
                    }
                  }}
                />
              </div>
            </div>
            {errors.deadline && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.deadline}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100/70 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center backdrop-blur-sm"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-3 py-1.5 text-sm text-white bg-blue-500/90 hover:bg-blue-600 dark:bg-blue-600/90 dark:hover:bg-blue-700 rounded-lg transition-colors flex items-center shadow-sm shadow-blue-500/20 dark:shadow-blue-800/20 backdrop-blur-sm"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Save
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <div className="space-y-2 relative">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex-grow" {...listeners}>{task.title}</h3>
            <div className="flex space-x-1 ml-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors z-10"
                aria-label="Edit task"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-10"
                aria-label="Delete task"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div {...listeners}>
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-700/50 p-2 rounded-lg">{task.description}</p>
            )}
            {task.deadline && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-2 bg-blue-50/50 dark:bg-blue-900/20 px-2 py-1.5 rounded-lg w-fit">
                <div className="flex items-center">
                  <span className="mr-1 font-medium">Due:</span> 
                  {task.deadline && new Date(task.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 