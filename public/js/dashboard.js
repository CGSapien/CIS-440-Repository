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

addItemButton.addEventListener('click', function() {
    // Create a new div for the new event item
    let newEventItemDiv = document.createElement('div');
    newEventItemDiv.classList.add('eventItem');

    // Create time input
    let timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.classList.add('eventTime');  // Add class for styling or future reference

    // Create detail input
    let detailInput = document.createElement('input');
    detailInput.type = 'text';
    detailInput.classList.add('eventDetail');  // Add class for styling or future reference
    detailInput.placeholder = 'Details';  // Placeholder text

    // Append inputs to the new event item div
    newEventItemDiv.appendChild(timeInput);
    newEventItemDiv.appendChild(detailInput);

    // Append the new event item div to the event items container
    eventItemsContainer.appendChild(newEventItemDiv);
});

const maxExercises = 10;

document.getElementById('trainingPlanButton').addEventListener('click', () => {
    document.getElementById('trainingModal').style.display = 'block';
    document.getElementById('trainingModalOverlay').style.display = 'block';
});

function closeTrainingModal() {
    document.getElementById('trainingModal').style.display = 'none';
    document.getElementById('trainingModalOverlay').style.display = 'none';
    document.getElementById('trainingPlanForm').reset();

    ['warmup', 'exercise', 'flexibility'].forEach(type => {
        const section = document.getElementById(`${type}-section`);
        const entries = section.querySelectorAll(`.${type}-entry`);
        entries.forEach((entry, index) => {
            if (index > 0) entry.remove(); // Keep only the first
        });
    });
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
                if (!name) return null;

                let notes = '';
                if (type === 'flexibility') {
                    notes = `Time: ${entry.querySelector(`input[name="${type}Time[]"]`).value || 'N/A'} | ` +
                            `Notes: ${entry.querySelector(`input[name="${type}Notes[]"]`).value || 'None'}`;
                } else {
                    const sets = entry.querySelector(`input[name="${type}Sets[]"]`)?.value || 'N/A';
                    const reps = entry.querySelector(`input[name="${type}Reps[]"]`)?.value || 'N/A';
                    const load = entry.querySelector(`input[name="${type}Load[]"]`)?.value || 'N/A';
                    const distance = entry.querySelector(`input[name="${type}Distance[]"]`)?.value || 'N/A';
                    const extraNotes = entry.querySelector(`input[name="${type}Notes[]"]`)?.value || 'None';

                    notes = `Sets: ${sets} | Reps: ${reps} | Load: ${load} | Distance: ${distance} | Notes: ${extraNotes}`;
                }

                return {
                    calendar_id: "excersise",
                    title: name,
                    start: startTime,
                    end: endTime,
                    event_type: "task",
                    iscomplete: 0,
                    notes: notes
                };
            }).filter(exercise => exercise !== null);
        }

        const warmups = getExercises('warmup');
        const exercises = getExercises('exercise');
        const flexibility = getExercises('flexibility');

        const trainingTasks = [...warmups, ...exercises, ...flexibility];

        console.log("Final Training Plan Data:", trainingTasks);

        for (const task of trainingTasks) {
            const success = await DataModel.createEvent(task);
            if (!success) {
                console.error("Failed to save task:", task);
            }
        }

        console.log("Training plan submitted successfully!");
        fetchAndDisplayEvents();
        closeTrainingModal();
    } catch (error) {
        console.error("Error submitting training plan:", error);
    }
}

function openChecklistModal(task) {
    const checklistModal = document.getElementById('checklistModal');
    const checklistItemsDiv = document.getElementById('checklistItems');
    const saveButton = document.getElementById('saveChecklistButton');
    const appendItemButton = document.getElementById('appendItemButton');
    const newItemTime = document.getElementById('newItemTime');
    const newItemDetail = document.getElementById('newItemDetail');
    const closeButton = document.getElementById('closeChecklistButton');

    if (!checklistModal || !checklistItemsDiv || !saveButton || !appendItemButton || !newItemTime || !newItemDetail) {
        console.error("Error: Modal or one of its elements not found.");
        return;
    }

    checklistModal.style.display = 'block';

    let checklist = [];

    try {
        if (task.raw.checklist && typeof task.raw.checklist === 'string') {
            checklist = JSON.parse(task.raw.checklist);
        } else {
            checklist = [];
        }
    } catch (e) {
        console.error("Error parsing task.raw.checklist:", e);
        checklist = [];
    }

    if (!Array.isArray(checklist)) {
        console.error("Error: checklist is not an array.", checklist);
        return;
    }

    // Helper to render checklist items
    const renderChecklist = () => {
        checklistItemsDiv.innerHTML = '';

        if (checklist.length === 0) {
            checklistItemsDiv.innerHTML = '<p>No items in the checklist.</p>';
            return;
        }

        checklist.forEach((item, index) => {
            let checklistItemDiv = document.createElement('div');
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.complete;
            checkbox.setAttribute('data-item', item.item);

            checkbox.addEventListener('click', () => {
                item.complete = checkbox.checked;
            });

            checklistItemDiv.appendChild(checkbox);
            checklistItemDiv.appendChild(document.createTextNode(` ${item.time || ''} ${item.item}`));
            checklistItemsDiv.appendChild(checklistItemDiv);
        });
    };

    renderChecklist(); // Initial render

    // Add new item logic
    appendItemButton.onclick = () => {
        const time = newItemTime.value.trim();
        const detail = newItemDetail.value.trim();
    
        if (!detail || !time) {
            alert("Please enter both time and detail for the checklist item.");
            return;
        }
    
        const formattedItem = `${time} - ${detail}`;
    
        const newItem = {
            item: formattedItem,
            complete: false
        };
    
        checklist.push(newItem);
        renderChecklist();
    
        newItemTime.value = '';
        newItemDetail.value = '';
    };
    

    // Save logic
    saveButton.onclick = () => {
        calendar.updateEvent(task.id, task.calendarId, {
            raw: {
                checklist: checklist
            },
        });

        saveChecklistToEvent(task.id, checklist);
        checklistModal.style.display = 'none';
    };

    closeButton.onclick = () => {
        
        newItemTime.value = '';
        newItemDetail.value = '';
        checklistModal.style.display = 'none';
    };
}

function saveChecklistToEvent(eventid, checklist) {
    // Example: Saving the checklist to the event (could be an API call to save to a database)
    // Here we're just logging it, but you should replace it with the actual save logic.
    console.log(`Saving checklist for event ${eventid}:`, checklist);

    // Send the stringified checklist to the backend
    DataModel.checklistUpdate(eventid, checklist); // The backend expects a string, not an array
}

document.addEventListener('DOMContentLoaded', () => {

    // Reference the Nutrition Plan button and modal
    const nutritionPlanButton = document.getElementById('nutritionPlanButton');
    const nutritionPlanModal = document.getElementById('nutritionPlanModal');
    const nutritionPlanForm = document.getElementById('nutritionPlanForm');
    const cancelButton = document.getElementById('closeNutritionPlan');

    // Open Nutrition Plan Modal when button is clicked
    nutritionPlanButton.addEventListener('click', () => {
        nutritionPlanModal.style.display = 'block';
    });

    // Close Nutrition Plan Modal when Cancel button is clicked
    cancelButton.addEventListener('click', () => {
        closeNutritionPlanModal(); // Close modal
    });

    function closeNutritionPlanModal() {
        nutritionPlanModal.style.display = 'none';
    }

    // Submit the Nutrition Plan form
    nutritionPlanForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const mealType = document.getElementById('mealType').value.trim();
        const mealDescription = document.getElementById('mealDescription').value.trim();
        const mealTime = document.getElementById('mealTime').value;

        // if (!mealType || !mealDescription || !mealTime) {
        //     alert('Please fill out all fields!');
        //     return;
        // }

        // Here we would send the nutrition plan data to the server or handle it as needed.
        // For example, if using DataModel:
        const success = await DataModel.createNutritionPlan({
            mealType,
            mealDescription,
            mealTime,
        });

        if (success) {
            alert('Nutrition plan saved successfully!');
            closeNutritionPlanModal(); // Close the modal after saving
        } else {
            alert('Failed to save nutrition plan. Try again.');
        }
    });

    // Close modal functionality when clicking outside of the modal content area
    window.addEventListener('click', (event) => {
        if (event.target === nutritionPlanModal) {
            closeNutritionPlanModal();
        }
    });
});

document.getElementById("nutritionPlanForm").addEventListener("submit", function(e) {
    e.preventDefault();

    // Get input values (convert to floats)
    const menWeight = parseFloat(document.getElementById("menKg").value) || null;
    const menHeightInches = parseFloat(document.getElementById("menInches").value) || null;
    const menAge = parseFloat(document.getElementById("menAge").value) || null;

    const womenWeight = parseFloat(document.getElementById("womenKg").value) || null;
    const womenHeightInches = parseFloat(document.getElementById("womenInches").value) || null;
    const womenAge = parseFloat(document.getElementById("womenAge").value) || null;

    let menResult = document.getElementById("menResult");
    let womenResult = document.getElementById("womenResult");

    // Clear previous results
    menResult.textContent = "";
    womenResult.textContent = "";

    // Calculate for Men
    if (menWeight !== null && menHeightInches !== null && menAge !== null) {
        const menHeightCm = menHeightInches * 2.54;
        const menBMR = (10 * menWeight) + (6.25 * menHeightCm) - (5 * menAge) + 5;
        menResult.textContent = `Men = ${menBMR.toFixed(2)} calories/day`;
    } else {
        menResult.textContent = "It looks like you left the values for men empty!";
    }

    // Calculate for Women
    if (womenWeight !== null && womenHeightInches !== null && womenAge !== null) {
        const womenHeightCm = womenHeightInches * 2.54;
        const womenBMR = (10 * womenWeight) + (6.25 * womenHeightCm) - (5 * womenAge) - 161;
        womenResult.textContent = `Women = ${womenBMR.toFixed(2)} calories/day`;
    } else {
        womenResult.textContent = "It looks like you left the values for wom empty!";
    }
});

document.getElementById("closeNutritionPlan").addEventListener("click", function () {
    closeNutritionPlanModal();
});

//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////