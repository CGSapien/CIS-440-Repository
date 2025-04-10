let calendar;

document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('calendar');
    if (!container) {
        console.error("Calendar container not found!");
        return;
    }

    // Initialize the Toast UI calendar
    calendar = new tui.Calendar(container, {
        defaultView: 'week',
        scheduleView: ['allDay', 'task'], // Show only all-day events
        useCreationPopup: false,
        useDetailPopup: true,
    
        week: {
            startDayOfWeek: 1,
            taskView: ['task', 'allday'], // Show tasks
            eventView: false, // Hide time-based events
        },
    });
    

    // Function to update the displayed month
    function updateMonthTitle() {
        const currentDate = calendar.getDate();
        document.getElementById('month-title').textContent = currentDate.toDate().toLocaleString('default', {
            month: 'long',
            year: 'numeric'
        });
    }

    // Add navigation controls inside the calendar header
    const calendarHeader = document.createElement('div');
    calendarHeader.classList.add('calendar-header');

    const prevButton = document.createElement('button');
    prevButton.textContent = '< Prev';
    prevButton.classList.add('calendar-nav-button');
    prevButton.onclick = function () {
        calendar.prev();
        updateMonthTitle();
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next >';
    nextButton.classList.add('calendar-nav-button');
    nextButton.onclick = function () {
        calendar.next();
        updateMonthTitle();
    };

    const monthTitle = document.createElement('h2');
    monthTitle.id = 'month-title';
    monthTitle.classList.add('calendar-month-title');
    
    calendarHeader.appendChild(prevButton);
    calendarHeader.appendChild(monthTitle);
    calendarHeader.appendChild(nextButton);
    
    container.prepend(calendarHeader);

    // Initialize month title
    updateMonthTitle();

    // get events
    async function fetchAndDisplayEvents() {
        try {
            const data = await DataModel.getEvents(); // Call API function
            if (!data || (!data.events.length && !data.tasks.length)) {
                console.warn("No events or tasks to display.");
                return;
            }
    
            // Clear existing events before adding new ones
            calendar.clear();
    
            // Format events
            const formattedEvents = data.events.map(event => ({
                id: event.event_id, // Ensure ID is a string
                calendarId: event.calendar_id, // Assign a calendar category
                title: event.title,
                category: event.event_type, // Events are time-based
                start: event.start, // Ensure format is YYYY-MM-DDTHH:mm:ss
                end: event.end,
                raw: {
                    checklist: event.notes // Store the checklist in the raw field
                },
            }));
    
            // Format tasks (mark completed tasks differently)
            const formattedTasks = data.tasks.map(task => ({
                id: task.event_id,
                calendarId: task.calendar_id, // Assign a calendar category
                title: task.title , // Append checkmark if complete
                category: task.event_type, // Differentiate tasks
                start: task.start, // Some tasks may have a due date
                end: task.end,
                raw: { notes: task.notes },
                backgroundColor: task.iscomplete ? '#90EE90' : '#FF6347'
            }));
    
            // Add both events and tasks to the calendar
            calendar.createEvents([...formattedEvents, ...formattedTasks]);
        } catch (error) {
            console.error("Error fetching and displaying events:", error);
        }
    }
    
    // Call `fetchAndDisplayEvents` when the calendar initializes
    fetchAndDisplayEvents();

    console.log("Calendar initialized successfully.");

    document.getElementById('dailyJournalButton').addEventListener('click', function() {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('eventModal').style.display = 'block';
    });

    document.getElementById('saveEvent').addEventListener('click', function() {
        saveEvent()
    });

    document.getElementById('cancelEvent').addEventListener('click', function() {
        closeEventModal()
    });

    window.fetchAndDisplayEvents = fetchAndDisplayEvents;
    
    function saveEvent() {
        const title = document.getElementById('eventTitle').value;
    const start = document.getElementById('eventDate').value;
    const end = document.getElementById('eventDate').value;
    const notes = document.getElementById('eventNotes') ? document.getElementById('eventNotes').value : '';

    // Get all the event items (time and detail fields) from the Todo list
    const eventItems = [];
    const eventItemElements = document.querySelectorAll('.eventItem');

    eventItemElements.forEach(item => {
        const time = item.querySelector('.eventTime').value;
        const detail = item.querySelector('.eventDetail').value;
        if (time && detail) {
            eventItems.push({ time: time, detail: detail });
        }
    });

    // Format the checklist for notes (if you want to store them as a checklist)
    const checklist = eventItems.map(item => ({
        item: `${item.time} - ${item.detail}`,
        complete: false
    }));

    // Event data object
    const eventData = {
        calendar_id: "daily_journal",
        title: title,
        start: start,
        end: end,
        notes: JSON.stringify(checklist), // Store the checklist as JSON in the notes field
        event_type: "allday"
    };

    console.log("Event data:", eventData);
    
        DataModel.createEvent(eventData).then(success => {
            if (success) {
                fetchAndDisplayEvents()
                closeEventModal();
            }
        });
    }

    function closeEventModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('eventModal').style.display = 'none';
    }
    
    function deleteEvent(event) {
        const eventId = event.id; 
        const calendarId = event.calendarId; // Required for deletion in Toast UI Calendar
    
        if (!eventId) {
            console.warn("No event ID found to delete.");
            return;
        }
    
        // Remove event from the calendar UI
        calendar.deleteEvent(eventId, calendarId);
    
        // Remove event from the database
        DataModel.deleteEvent(eventId)
            .then(success => {
                if (success) {
                    console.log(`Event with ID ${eventId} deleted successfully.`);
                    closeEventModal();
                } else {
                    console.error(`Failed to delete event with ID ${eventId}.`);
                }
            })
            .catch(error => {
                console.error("Error deleting event:", error);
            });
    }
    
    // Bind this function to the delete event
    calendar.on('beforeDeleteEvent', deleteEvent);

    calendar.on('clickEvent', function(event) {
        const task = event.event;
        const notesText = task.raw?.notes || "No description available.";
        
        // Only trigger the confirmation for tasks
        if (task.category === 'task') {
            const message = `${task.title}\n\n${notesText}\n\nDo you want to complete this task?`;
            
            if (window.confirm(message)) {
                alert('Task completed!');
                DataModel.toggleTaskCompletion(task.id);
    
                // Update the task color to indicate completion
                calendar.updateEvent(task.id, task.calendarId, {
                    backgroundColor: '#90EE90', // Green background to indicate completion
                });
    
                calendar.render();
            } else {
                alert('Task not completed.');
            }
        }
    
        // Open the checklist modal only for the 'daily_journal' calendar
        if (task.calendarId === 'daily_journal') {
            // Pass the relevant task data to the modal
            openChecklistModal(task);
        }
    });
        
});
