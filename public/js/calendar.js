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
        useCreationPopup: true,
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

    // Example: Add a test event
    calendar.createEvents([
        {
            id: '1',
            calendarId: '1',
            title: 'Sample Event',
            category: 'time',
            start: '2025-03-12T10:00:00',
            end: '2025-03-12T12:00:00',
        },
    ]);

    console.log("Calendar initialized successfully.");

    document.getElementById('dailyJournalButton').addEventListener('click', function() {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('eventModal').style.display = 'block';
    });
    
    function closeEventModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('eventModal').style.display = 'none';
    }
    
    function saveEvent() {
        const title = document.getElementById('eventTitle').value;
        const start = document.getElementById('eventStart').value;
        const end = document.getElementById('eventEnd').value;
        const notes = document.getElementById('eventNotes').value;
        
        const eventData = {
            user_id: 1, // Replace with actual user ID 
            calendar_id: 1, 
            title: title,
            start: start,
            end: end,
            notes: notes
        };
        
        fetch('/api/saveEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Event saved:', data);
            closeEventModal();
        })
        .catch(error => console.error('Error:', error));
    }
});
