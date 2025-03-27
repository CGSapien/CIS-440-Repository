////////////////////////////////////////////////////////////////
//DASHBOARD.JS
//THIS IS YOUR "CONTROLLER", IT ACTS AS THE MIDDLEMAN
// BETWEEN THE MODEL (datamodel.js) AND THE VIEW (dashboard.html)
////////////////////////////////////////////////////////////////


//ADD ALL EVENT LISTENERS INSIDE DOMCONTENTLOADED
//AT THE BOTTOM OF DOMCONTENTLOADED, ADD ANY CODE THAT NEEDS TO RUN IMMEDIATELY
document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    //ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
    //////////////////////////////////////////
    //END ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////
    //EVENT LISTENERS
    //////////////////////////////////////////
    // Log out and redirect to login
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    //////////////////////////////////////////
    //END EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////////////////
    //CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////////////////

    // Initial check for the token
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/';
    } else {
        DataModel.setToken(token);
        loadSavedGoals()
    }
    //////////////////////////////////////////
    //END CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////
});
//END OF DOMCONTENTLOADED


//////////////////////////////////////////
//FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////

document.getElementById("mindmapButton").addEventListener("click", function() {
    document.getElementById("mindmapModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
    loadSavedGoals();
});

function closeModal() {
    document.getElementById("mindmapModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
}

function addSubGoal() {
    let subGoals = document.getElementById("subGoals").children.length;
    if (subGoals >= 2) return;
    
    let div = document.createElement("div");
    div.innerHTML = `<label>Sub Goal:</label>
                     <input type='text' class='sub-goal'>
                     <button onclick='addTertiaryGoal(this)'>Add Tertiary Goal</button>
                     <div class='tertiaryGoals'></div>`;
    document.getElementById("subGoals").appendChild(div);
}

function addTertiaryGoal(button) {
    let parentDiv = button.nextElementSibling;
    if (parentDiv.children.length >= 1) return; // Limit to 1 tertiary goal per sub-goal

    let div = document.createElement("div");
    div.innerHTML = `<label>Tertiary Goal:</label>
                     <input type='text' class='tertiary-goal'>`;
    parentDiv.appendChild(div);
}

async function submitGoals() {
    let mainGoal = document.getElementById("mainGoal").value.trim();
    let subGoalElements = document.querySelectorAll(".sub-goal");
    let tertiaryGoalElements = document.querySelectorAll(".tertiary-goal");

    let goals = {};

    // Add main goal only if the user provides input
    if (mainGoal !== "") {
        goals.main_goal = mainGoal;
    } else {
        goals.main_goal = null;
    }

    subGoalElements.forEach((sub, index) => {
        let subGoalText = sub.value.trim();
        let tertiaryGoalText = tertiaryGoalElements[index]?.value.trim();

        if (index === 0) {
            if (subGoalText !== "") {
                goals.Sub1 = subGoalText;
            } else {
                goals.Sub1 = null;
            }

            if (tertiaryGoalText !== "") {
                goals.tertiary1 = tertiaryGoalText;
            } else {
                goals.tertiary1 = null;
            }
        } else if (index === 1) {
            if (subGoalText !== "") {
                goals.Sub2 = subGoalText;
            } else {
                goals.Sub2 = null;
            }

            if (tertiaryGoalText !== "") {
                goals.tertiary2 = tertiaryGoalText;
            } else {
                goals.tertiary2 = null;
            }
        }
    });

    console.log("Submitting goals:", goals); // Check data before sending

    // Call the API function
    let success = await DataModel.updateUserGoals(goals);

    if (success) {
        alert("Goals updated successfully!");
        loadSavedGoals()
    } else {
        alert("Failed to update goals. Check the console for errors.");
    }
}

async function loadSavedGoals() {
    try {
        let response = await DataModel.getGoals(); // Ensure it's awaited if it's an async function
        
        if (!response) return; // Ensure response exists

        // Update main goal button text
        let mainGoalButton = document.getElementById("main-goal-node");
        if (mainGoalButton) {
            mainGoalButton.textContent = "Main goal: " + response.main_goal || "No Main Goal";
        } 

        // Get sub-goals container and clear existing buttons
        let subGoalsContainer = document.querySelector(".sub-goals-container");
        subGoalsContainer.innerHTML = ""; 

        // Populate sub-goals if they exist
        if (response.Sub1 || response.Sub2) {
            if (response.Sub1) {
                let subGoal1 = document.createElement("button");
                subGoal1.className = "sub-goal-node";
                subGoal1.id = "sub-goal-1";
                subGoal1.textContent = "Sub goal: " + response.Sub1;
                subGoalsContainer.appendChild(subGoal1);
            }
            if (response.Sub2) {
                let subGoal2 = document.createElement("button");
                subGoal2.className = "sub-goal-node";
                subGoal2.id = "sub-goal-2";
                subGoal2.textContent = "Sub goal: " + response.Sub2;
                subGoalsContainer.appendChild(subGoal2);
            }
        }

        // Get tertiary goals container and clear existing buttons
        let tertiaryGoalsContainer = document.querySelector(".tertiary-goal-container");
        tertiaryGoalsContainer.innerHTML = ""; 

        // Populate tertiary goals if they exist
        if (response.tertiary1) {
            let tertiaryGoal1 = document.createElement("button");
            tertiaryGoal1.className = "tertiary-goal-node";
            tertiaryGoal1.id = "tertiary-goal-1";
            tertiaryGoal1.textContent = "Tertiary goal: " + response.tertiary1;
            tertiaryGoalsContainer.appendChild(tertiaryGoal1);
        }
        if (response.tertiary2) {
            let tertiaryGoal2 = document.createElement("button");
            tertiaryGoal2.className = "tertiary-goal-node";
            tertiaryGoal2.id = "tertiary-goal-2";
            tertiaryGoal2.textContent = "Tertiary goal: " + response.tertiary2;
            tertiaryGoalsContainer.appendChild(tertiaryGoal2);
        }

    } catch (error) {
        console.error("Error loading saved goals:", error);
    }
}

// ADD EXERCISE FUNCTIONS
const maxExercises = 3;

document.getElementById('trainingPlanButton').addEventListener('click', () => {
    document.getElementById('trainingModal').style.display = 'block';
    document.getElementById('trainingModalOverlay').style.display = 'block';
});

function closeTrainingModal() {
    document.getElementById('trainingModal').style.display = 'none';
    document.getElementById('trainingModalOverlay').style.display = 'none';
}

function addExercise(type) {
    const section = document.getElementById(`${type}-section`);
    const entries = section.querySelectorAll(`.${type}-entry`);

    if (entries.length >= maxExercises) return;

    const newEntry = entries[0].cloneNode(true);
    newEntry.querySelectorAll('input').forEach(input => input.value = '');
    section.insertBefore(newEntry, section.lastElementChild);
}

document.getElementById("trainingPlanForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent page reload
    await submitTrainingPlan();
});

async function submitTrainingPlan() {
    try {
        const startTime = document.querySelector('input[name="startTime"]').value;
        const endTime = document.querySelector('input[name="endTime"]').value;

        if (!startTime || !endTime) {
            console.error("Start and End times are required.");
            return;
        }

        function getExercises(type) {
            return Array.from(document.querySelectorAll(`#${type}-section .${type}-entry`)).map(entry => {
                const name = entry.querySelector(`input[name="${type}Name[]"]`).value.trim();
                if (!name) return null; // Skip empty entries

                return {
                    calendar_id: "excersise",
                    title: name, // Exercise name becomes the title
                    start: startTime,
                    end: endTime,
                    event_type: "task",
                    iscomplete: 0, // Default to incomplete
                    notes: `Sets: ${entry.querySelector(`input[name="${type}Sets[]"]`).value || 'N/A'} | ` +
                           `Reps: ${entry.querySelector(`input[name="${type}Reps[]"]`).value || 'N/A'} | ` +
                           `Load: ${entry.querySelector(`input[name="${type}Load[]"]`).value || 'N/A'} | ` +
                           `Notes: ${entry.querySelector(`input[name="${type}Notes[]"]`).value || 'None'}`
                };
            }).filter(exercise => exercise !== null); // Remove null values
        }

        // Gather all exercises separately
        const warmups = getExercises('warmup');
        const exercises = getExercises('exercise');
        const flexibility = getExercises('flexibility');

        // Combine all tasks into one array
        const trainingTasks = [...warmups, ...exercises, ...flexibility];

        console.log("Final Training Plan Data:", trainingTasks);

        // **Send each task to the API**
        for (const task of trainingTasks) {
            const success = await DataModel.createEvent(task);
            if (!success) {
                console.error("Failed to save task:", task);
            }
        }

        console.log("Training plan submitted successfully!");
        closeTrainingModal(); // Close modal after submission
    } catch (error) {
        console.error("Error submitting training plan:", error);
    }
}

//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////