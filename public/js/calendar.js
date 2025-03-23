document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('calendar');
    if (!container) {
        console.error("Calendar container not found!");
        return;
    }

    // Initialize the Toast UI calendar
    const calendar = new tui.Calendar(container, {
        defaultView: 'month',
        taskView: true,
        scheduleView: ['time'],
        useCreationPopup: false,
        useDetailPopup: true,
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
            const events = await DataModel.getEvents(); // Call API function
            if (!events || events.length === 0) {
                console.warn("No events to display.");
                return;
            }
    
            // Clear existing events before adding new ones
            calendar.clear();
    
            // Format events for Toast UI Calendar
            const formattedEvents = events.map(event => ({
                id: event.event_id.toString(), // Ensure ID is a string
                calendarId: event.calendar_id,
                title: event.title,
                category: 'All-Day',
                start: event.start, // Ensure format is YYYY-MM-DDTHH:mm:ss
                end: event.end,
                body: event.notes || ''
            }));
    
            // Add events to the calendar
            calendar.createEvents(formattedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
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
    
    function saveEvent() {
        const title = document.getElementById('eventTitle').value;
        const start = document.getElementById('eventStart').value;
        const end = document.getElementById('eventEnd').value;
        const notes = document.getElementById('eventNotes').value;
    
        const eventData = {
            calendar_id: "daily_journal",
            title: title,
            start: start,
            end: end,
            notes: notes
        };
    
        DataModel.createEvent(eventData).then(success => {
            if (success) {
                closeEventModal();
            }
        });
        DataModel.deleteEvent(eventData).then(success => {
            if (success) {
                closeEventModal();
            }
        });
    }

    function closeEventModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('eventModal').style.display = 'none';
    }

    document.getElementById('deleteEvent').addEventListener('click', function () {
        deleteEvent();
    });
    
    function deleteEvent() {
        const event_id = document.getElementById('event_id').value; 
        if (!event_id) {
            console.warn("No event ID found to delete.");
            return;
        }
    
        // Remove event from the calendar
        calendar.deleteEvent(event_id); 
    
        // Remove event from the database using DataModel API
        DataModel.deleteEvent(event_id).then(success => {
            if (success) {
                console.log(`Event with ID ${event_id} deleted successfully.`);
                closeEventModal(); // Close the popup modal
            } else {
                console.error(`Failed to delete event with ID ${event_id}.`);
            }
        }).catch(error => {
            console.error("Error deleting event:", error);
        });
    }
    
});
