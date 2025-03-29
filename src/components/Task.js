import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon, CalendarIcon, ClockIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import { format } from 'date-fns';

// Custom DatePicker component
function DatePicker({ value, onChange, buttonRef, isOpen, onToggle }) {
  const [currentMonth, setCurrentMonth] = useState(value ? dayjs(value) : dayjs());
  const [selectedDate, setSelectedDate] = useState(value ? dayjs(value) : null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
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
  
  // Handle date selection
  const handleDateClick = (date) => {
    // Update local state
    setSelectedDate(date);
    
    // Get the date as a string in YYYY-MM-DD format
    const formattedDate = date.format('YYYY-MM-DD');
    
    // Trigger the onChange handler with the formatted date
    onChange({ target: { value: formattedDate } });
    
    // Close the date picker
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
                type="button"
                onClick={() => day.month === 'current' && handleDateClick(day.date)}
                disabled={day.month !== 'current'}
                className={dayClasses}
              >
                {day.day}
              </button>
            );
          })}
        </div>
        
        {/* Footer with clear and today buttons */}
        <div className="mt-2 flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
          <button
            onClick={() => {
              setSelectedDate(null);
              onChange({ target: { value: '' } });
              onToggle(false);
            }}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Clear
          </button>
          
          <button
            onClick={() => {
              const today = dayjs();
              setSelectedDate(today);
              onChange({ target: { value: today.format('YYYY-MM-DD') } });
              onToggle(false);
            }}
            className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30"
          >
            Today
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Time dropdown component that renders in a portal
const TimeDropdown = React.memo(function TimeDropdown({ isOpen, onClose, timeOptions, selectedIndex, onSelect, buttonRef }) {
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
});

// For time selection - completely new implementation
const SimpleTimeSelector = React.memo(({ value, onChange, buttonLabel = '12:00 PM' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        (!inputRef.current || !inputRef.current.contains(event.target))
      ) {
        setIsOpen(false);
        setManualEntry(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate time options (12-hour format with AM/PM)
  const timeOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    
    // Check if the selected date is today by comparing year, month, and day
    const isToday = value && (() => {
      const selectedDate = new Date(value);
      return (
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getDate() === now.getDate()
      );
    })();
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    ['AM', 'PM'].forEach(period => {
      for (let hour = 0; hour < 12; hour++) {
        const displayHour = hour === 0 ? 12 : hour;
        const actualHour = period === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
        
        // Skip past times if this is today
        if (isToday && (actualHour < currentHour || (actualHour === currentHour && 0 < currentMinute))) {
          continue;
        }
        
        options.push({
          label: `${displayHour}:00 ${period}`,
          hour: actualHour,
          minute: 0,
          display: `${displayHour}:00 ${period}`
        });
        
        // Skip past half-hour if this is today
        if (isToday && (actualHour < currentHour || (actualHour === currentHour && 30 < currentMinute))) {
          continue;
        }
        
        options.push({
          label: `${displayHour}:30 ${period}`,
          hour: actualHour,
          minute: 30,
          display: `${displayHour}:30 ${period}`
        });
      }
    });
    
    return options;
  }, [value]);

  // Format time value for display
  const formatTimeDisplay = (date) => {
    if (!date) return buttonLabel;
    
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    const formattedDate = `${displayHours}:${displayMinutes} ${ampm}`;
    return formattedDate;
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
      // Start with the existing date to preserve the date portion
      date = new Date(value);
    } else {
      // Default to today
      date = new Date();
    }
    
    // Store the original date
    const originalDay = date.getDate();
    
    // Set the time components
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    // If the date changed due to timezone issues (e.g., shifted to next day),
    // correct it back to the original date
    if (date.getDate() !== originalDay) {
      date.setDate(originalDay);
    }
    
    // Call the onChange handler with the new date
    onChange(date);
    setIsOpen(false);
  };

  // Handle manual time entry
  const handleManualTimeEntry = () => {
    // Parse the input value (expected format: 1:30 PM or 13:30)
    try {
      const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;
      const match = inputValue.match(timeRegex);
      
      if (!match) {
        return;
      }
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3]?.toUpperCase();
      
      // Validate hours and minutes
      if (period) {
        // 12-hour format
        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
          return;
        }
        
        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
      } else {
        // 24-hour format
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          return;
        }
      }
      
      // Create a new date
      let date;
      if (value) {
        date = new Date(value);
      } else {
        date = new Date();
      }
      
      // Store the original date for later comparison
      const originalDay = date.getDate();
      
      // Check if this is today
      const now = new Date();
      const isToday = 
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
      
      // If today, check if time is in the past
      if (isToday && (
        hours < now.getHours() || 
        (hours === now.getHours() && minutes < now.getMinutes())
      )) {
        alert("Cannot set a time in the past. Please choose a future time.");
        return;
      }
      
      // Set the time components
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      // If the date changed due to timezone issues, correct it
      if (date.getDate() !== originalDay) {
        date.setDate(originalDay);
      }
      
      // Call the onChange handler with the new date
      onChange(date);
      setManualEntry(false);
      setIsOpen(false);
    } catch (error) {
      // Silent error handling
    }
  };

  // Handle manual input field change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle key press in manual input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualTimeEntry();
    }
  };

  // Start manual entry mode
  const startManualEntry = () => {
    setManualEntry(true);
    setInputValue(value ? formatTimeDisplay(value) : '');
    // Focus on input after rendering
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="relative">
      {manualEntry ? (
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="1:30 PM"
            className="w-full px-3 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-l-lg bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white text-sm"
          />
          <button
            onClick={handleManualTimeEntry}
            className="px-2 border border-l-0 border-gray-300/50 dark:border-gray-600/50 rounded-r-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
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
      )}
      
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
          {/* Manual entry option */}
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={startManualEntry}
          >
            Enter time manually...
          </button>
          
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
});

// Simplified Task component
export default React.memo(function Task(props) {
  const { task, onUpdate, onDelete } = props;
  
  const [isEditing, setIsEditing] = useState(task.isEditing || false);
  const [editedTask, setEditedTask] = useState(task);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const dateButtonRef = useRef(null);
  const timeButtonRef = useRef(null);
  const menuRef = useRef(null);
  
  // Update editedTask when the original task changes
  useEffect(() => {
    setEditedTask(task);
    setIsEditing(task.isEditing || false);
  }, [task]);
  
  // Handle input changes - memoized
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);
  
  // Handle date change
  const handleDateChange = useCallback((e) => {
    const dateValue = e.target.value;
    
    if (!dateValue) {
      // If date was cleared, show error since it's required
      setErrors(prev => ({
        ...prev,
        deadline: 'Deadline is required'
      }));
      return;
    }
    
    try {
      // Parse the date string correctly (YYYY-MM-DD)
      // Create a new date that preserves the local timezone by setting it at noon
      const [year, month, day] = dateValue.split('-').map(num => parseInt(num, 10));
      // Create the date at noon to avoid timezone shifting issues
      const newDate = new Date(year, month - 1, day, 12, 0, 0);
      
      // Get today's date at midnight local time for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Create a comparison date with time set to midnight
      const dateToCheck = new Date(year, month - 1, day);
      dateToCheck.setHours(0, 0, 0, 0);
      
      // Compare dates by timestamp for accurate day comparison
      if (dateToCheck.getTime() < today.getTime()) {
        setErrors(prev => ({
          ...prev,
          deadline: 'Deadline cannot be in the past'
        }));
        return;
      }
      
      // Clear any previous deadline errors
      if (errors.deadline) {
        setErrors(prev => ({ ...prev, deadline: null }));
      }
      
      // If we have an existing deadline, preserve its time
      if (editedTask.deadline) {
        const existingDate = new Date(editedTask.deadline);
        // Extract hours and minutes from existing date
        newDate.setHours(existingDate.getHours());
        newDate.setMinutes(existingDate.getMinutes());
      } else {
        // Set default time to 5:00 PM if no existing deadline
        newDate.setHours(17);
        newDate.setMinutes(0);
      }
      
      // Update the task with the new deadline
      const deadline = newDate.toISOString();
      
      setEditedTask(prev => ({
        ...prev,
        deadline
      }));
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        deadline: 'Invalid date format'
      }));
    }
  }, [editedTask.deadline, errors.deadline]);
  
  // Handle form submission - memoized
  const handleSubmit = useCallback(() => {
    // Validate the form first
    if (!validateForm()) {
      return;
    }
    
    // Submit the task update
    onUpdate(editedTask);
  }, [editedTask, onUpdate]);
  
  // Handle cancel - memoized
  const handleCancel = useCallback(() => {
    if (task.title === '' && task.description === '' && !task.deadline) {
      // If this is a brand new empty task, delete it
      onDelete();
    } else {
      // Otherwise just cancel editing
      setIsEditing(false);
      setEditedTask(task);
    }
  }, [task, onDelete]);
  
  // Handle delete - memoized
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    
    if (onDelete) {
      onDelete();
    }
  }, [onDelete]);
  
  // Validate form - memoized
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Title is required
    if (!editedTask.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    // Deadline is required
    if (!editedTask.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      // Create a date object from the deadline (in the user's local timezone)
      const deadlineDate = new Date(editedTask.deadline);
      
      // Create a date representing today at midnight in local timezone
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Create a copy of the deadline date with time set to midnight
      const deadlineMidnight = new Date(
        deadlineDate.getFullYear(),
        deadlineDate.getMonth(),
        deadlineDate.getDate(),
        0, 0, 0, 0
      );
      
      // Compare only the date portion (midnight to midnight)
      if (deadlineMidnight.getTime() < now.getTime()) {
        newErrors.deadline = 'Deadline cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [editedTask.title, editedTask.deadline]);
  
  // Format date for input - memoized
  const formatDateForInput = useCallback((date) => {
    if (!date) return '';
    
    // Convert date to a date object
    const dateObj = new Date(date);
    
    // Format as YYYY-MM-DD in local timezone
    const year = dateObj.getFullYear();
    // getMonth() is 0-indexed, so add 1
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }, []);
  
  // Format date for display - memoized
  const formatDateForDisplay = useCallback((date) => {
    if (!date) return 'Select date';
    try {
      // Try to parse the date whether it's an ISO string, Date object, or other format
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Select date';
      }
      return format(dateObj, 'MMM d, yyyy');
    } catch (error) {
      return 'Select date';
    }
  }, []);
  
  // Format time for display - memoized
  const formatTimeForDisplay = useCallback((date) => {
    if (!date) return '';
    return format(new Date(date), 'h:mm a');
  }, []);
  
  // Close menus when clicking outside - memoized
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close date picker if clicking outside
      if (showDatePicker && dateButtonRef.current && 
          !dateButtonRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      
      // Close time picker if clicking outside
      if (showTimePicker && timeButtonRef.current &&
          !timeButtonRef.current.contains(event.target)) {
        setShowTimePicker(false);
      }
      
      // Close menu if clicking outside
      if (isMenuOpen && menuRef.current && 
          !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker, showTimePicker, isMenuOpen]);
  
  // Calculate whether task is past deadline - memoized
  const isPastDeadline = useMemo(() => {
    if (!task.deadline) return false;
    const deadline = new Date(task.deadline);
    const now = new Date();
    return deadline < now;
  }, [task.deadline]);
  
  // Calculate task badge style - memoized
  const taskBadgeStyle = useMemo(() => {
    if (isPastDeadline) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
    if (task.deadline) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }, [isPastDeadline, task.deadline]);
    
  if (!isEditing && !task.title && !task.description && !task.deadline) {
    return null;
  }

  return (
    <div
      className={`group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg shadow-gray-200/40 dark:shadow-gray-900/40 border ${
        task.isEditing 
          ? 'border-blue-300/50 dark:border-blue-700/50 ring-2 ring-blue-200/50 dark:ring-blue-800/30' 
          : 'border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/70 dark:hover:border-gray-600/70'
      } transition-all duration-200 select-none relative ${!isEditing ? 'cursor-move hover:shadow-md' : ''}`}
      draggable={!isEditing}
      onDragStart={(e) => {
        if (isEditing) {
          e.preventDefault();
          return;
        }
        
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        
        // Add some delay to make dragging visual
        setTimeout(() => {
          e.target.classList.add('opacity-50');
        }, 0);
      }}
      onDragEnd={(e) => {
        e.target.classList.remove('opacity-50');
      }}
    >
      {isEditing ? (
        // Edit Mode
        <div className="space-y-3">
          <div>
            <input
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
                <input
                  type="date"
                  name="deadline-date"
                  placeholder="Required"
                  value={editedTask.deadline ? formatDateForInput(editedTask.deadline) : ''}
                  min={formatDateForInput(new Date())}
                  onChange={handleDateChange}
                  className={`w-full px-3 py-2 border ${errors.deadline ? 'border-red-500 dark:border-red-700' : 'border-gray-300/50 dark:border-gray-600/50'} rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-600/50 text-sm dark:[color-scheme:dark]`}
                />
              </div>
              
              <div className="w-[110px]">
                <SimpleTimeSelector 
                  value={editedTask.deadline}
                  onChange={(date) => {
                    setEditedTask({...editedTask, deadline: date});
                    if (errors.deadline) {
                      setErrors(prev => ({ ...prev, deadline: null }));
                    }
                  }}
                />
              </div>
            </div>
            {errors.deadline && (
              <p className={`mt-2 text-sm ${errors.deadline.includes('past') ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg flex items-center' : 'text-red-500 dark:text-red-400'}`}>
                {errors.deadline.includes('past') ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {errors.deadline} - Please select a future date and time
                  </>
                ) : (
                  errors.deadline
                )}
              </p>
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
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex-grow">{task.title}</h3>
            <div className="flex space-x-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsEditing(true);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                aria-label="Edit task"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onDelete) {
                    onDelete();
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label="Delete task"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
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
          
          {/* Drag handle indicator */}
          <div className="absolute top-1 left-1 text-gray-400 dark:text-gray-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-110">
            <ArrowsPointingOutIcon className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
}); 