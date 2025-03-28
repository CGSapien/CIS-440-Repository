////////////////////////////////////////////////////////////////
//DATAMODEL.JS
//THIS IS YOUR "MODEL", IT INTERACTS WITH THE ROUTES ON YOUR
//SERVER TO FETCH AND SEND DATA.  IT DOES NOT INTERACT WITH
//THE VIEW (dashboard.html) OR THE CONTROLLER (dashboard.js)
//DIRECTLY.  IT IS A "MIDDLEMAN" BETWEEN THE SERVER AND THE
//CONTROLLER.  ALL IT DOES IS MANAGE DATA.
////////////////////////////////////////////////////////////////

const DataModel = (function () {
    //WE CAN STORE DATA HERE SO THAT WE DON'T HAVE TO FETCH IT
    //EVERY TIME WE NEED IT.  THIS IS CALLED "CACHING".
    //WE CAN ALSO STORE THINGS HERE TO MANAGE STATE, LIKE
    //WHEN THE USER SELECTS SOMETHING IN THE VIEW AND WE
    //NEED TO KEEP TRACK OF IT SO WE CAN USE THAT INFOMRATION
    //LATER.  RIGHT NOW, WE'RE JUST STORING THE JWT TOKEN
    //AND THE LIST OF USERS.
    let token = null;  // Holds the JWT token
    let users = [];    // Holds the list of user emails
    let goals = [];

    //WE CAN CREATE FUNCTIONS HERE TO FETCH DATA FROM THE SERVER
    //AND RETURN IT TO THE CONTROLLER.  THE CONTROLLER CAN THEN
    //USE THAT DATA TO UPDATE THE VIEW.  THE CONTROLLER CAN ALSO
    //SEND DATA TO THE SERVER TO BE STORED IN THE DATABASE BY
    //CALLING FUNCTIONS THAT WE DEFINE HERE.
    return {
        //utility function to store the token so that we
        //can use it later to make authenticated requests
        setToken: function (newToken) {
            token = newToken;
        },

        //function to fetch the list of users from the server
        getUsers: async function () {
            // Check if the token is set
            if (!token) {
                console.error("Token is not set.");
                return [];
            }

            try {
                // this is our call to the /api/users route on the server
                const response = await fetch('/api/users', {
                    method: 'GET',
                    headers: {
                        // we need to send the token in the headers
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error("Error fetching users:", await response.json());
                    return [];
                }

                const data = await response.json();
                //store the emails in the users variable so we can
                //use them again later without having to fetch them
                users = data.emails;
                //return the emails to the controller
                //so that it can update the view
                return users;
            } catch (error) {
                console.error("Error in API call:", error);
                return [];
            }
        },

        //function to get the goals of the user
        getGoals: async function () {
            // Check if the token is set
            if (!token) {
                console.error("Token is not set.");
                return null; // Return null instead of an empty array since we are fetching a single user's goals
            }
        
            try {
                // Call the /api/goals route on the server
                const response = await fetch('/api/goals', {
                    method: 'GET',
                    headers: {
                        'Authorization': token ,  
                        'Content-Type': 'application/json',
                    },
                });
        
                if (!response.ok) {
                    console.error("Error fetching user goals:", await response.json());
                    return null;
                }
        
                const data = await response.json();
                goals = data.goals
                
                console.log(goals)
                return goals;  // Return the fetched goals
            } catch (error) {
                console.error("Error in API call:", error);
                return null;
            }
        },
        //update the goals 
        updateUserGoals: async function (goalData) {
            if (!token) {
                console.error("Token is not set.");
                return false; // Indicate failure
            }

            console.log("📤 Sending request to /api/updategoals...");
            console.log("🔍 Token:", token);
            console.log("📨 Payload:", goalData);
    
            try {
                const response = await fetch('/api/updategoals', {
                    method: 'PUT',
                    headers: {
                        'Authorization': token,  // Ensure proper format
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(goalData),
                });
    
                if (!response.ok) {
                    console.error("Error updating user goals:", await response.json());
                    return false; // Indicate failure
                }
    
                console.log("Goals updated successfully.");
                return true; // Indicate success
            } catch (error) {
                console.error("Error in API call:", error);
                return false;
            }
        },

        createEvent: async function(eventData) {
            try {
                // Ensure tasks have the iscomplete field
                if (eventData.event_type === "task" && eventData.iscomplete === undefined) {
                    eventData.iscomplete = 0; // Default to incomplete
                }
        
                const response = await fetch('/api/newevents', {
                    method: 'POST',
                    headers: {  
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });
        
                if (!response.ok) {
                    console.error("Error saving event:", await response.json());
                    return false; // Indicate failure
                }
        
                const data = await response.json();
                console.log('Event saved:', data);
                return true; // Indicate success
            } catch (error) {
                console.error("Error in API call:", error);
                return false;
            }
        },
        getEvents: async function() {

            try {
                const response = await fetch('/api/events', {
                    method: 'GET',
                    headers: {  
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });
        
                if (!response.ok) {
                    console.error("Error retrieving events:", await response.json());
                    return null; // Indicate failure
                }
        
                const data = await response.json();
                console.log('Events and Tasks retrieved:', data);
        
                return data; // Return the full response (both events and tasks)
            } catch (error) {
                console.error("Error in API call:", error);
                return null;
            }
        },

        deleteEvent: async function(event_Id) {
            try {
                const response = await fetch(`/api/events/deleteEvent/${event_Id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete event.');
                }
                
                return data;
            } catch (error) {
                console.error('Error:', error.message);
                return { error: error.message };
            }
        },

        // 30 lines of code to change a single value... 
        toggleTaskCompletion: async function (eventId) {
            if (!token) {
                console.error("❌ Token is not set.");
                return false; // Indicate failure
            }
        
            console.log("📤 Sending request to /api/eventchanges...");
            console.log("🔍 Token:", token);
            console.log("📨 Event ID:", eventId);
        
            try {
                const response = await fetch('/api/eventchanges', {
                    method: 'PUT',
                    headers: {
                        'Authorization': token,  // Ensure proper format
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ event_id: eventId }),
                });
        
                if (!response.ok) {
                    console.error("❌ Error toggling task completion:", await response.json());
                    return false; // Indicate failure
                }
        
                console.log("✅ Task completion status toggled successfully.");
                return true; // Indicate success
            } catch (error) {
                console.error("❌ Error in API call:", error);
                return false;
            }
        },
        
            
        //ADD MORE FUNCTIONS HERE TO FETCH DATA FROM THE SERVER
        //AND SEND DATA TO THE SERVER AS NEEDED
    };
})();