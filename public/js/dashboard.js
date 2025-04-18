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
    
    document.getElementById("closeNoGoalModal").addEventListener("click", function () {
        document.getElementById("noMainGoalModal").style.display = "none";
        document.getElementById("modalOverlay").style.display = "none";
    });
    
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

        document.getElementById("closeNoGoalModal").addEventListener("click", function () {
            document.getElementById("noMainGoalModal").style.display = "none";
            document.getElementById("modalOverlay").style.display = "none";
        });

        if (!response.main_goal) {
            document.getElementById("noMainGoalModal").style.display = "block";
            document.getElementById("modalOverlay").style.display = "block";
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
        if (task.raw.notes && typeof task.raw.notes === 'string') {
            checklist = JSON.parse(task.raw.notes);
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
   //log check of data
    console.log(`Saving checklist for event ${eventid}:`, checklist);

    // Send the stringified checklist to the backend
    DataModel.checklistUpdate(eventid, checklist); 
}



document.getElementById('addNutritionPlan').addEventListener('click', savePlan);

async function savePlan() {
    const selectedDate = document.getElementById('nutritionDate').value;

    if (!selectedDate) {
        alert('Please select a date for the nutrition plan.');
        return;
    }

    const eventData = {
        calendar_id: "nutrition_plan",
        title: `Nutrition Plan - ${selectedDate}`,
        start: selectedDate,
        end: selectedDate,
        notes: "", // No checklist or notes for nutrition plan
        event_type: "allday"
    };

    console.log("Nutrition Plan event data:", eventData);

    DataModel.createEvent(eventData).then(success => {
        if (success) {
            fetchAndDisplayEvents();
            document.getElementById('nutritionPlanModal').style.display = 'none';
        }
    });
}

function openNutritionModal(task) {
    const nutritionModal = document.getElementById('nutritionPlanEntryModal');
    const nutritionItemsDiv = document.getElementById('nutritionItems');
    const saveButton = document.getElementById('saveNutritionButton');
    const appendButton = document.getElementById('addNutritionItem');
    const closeButton = document.getElementById('closeNutritionButton');

    const mealTypeInput = document.getElementById('mealType');
    const itemNameInput = document.getElementById('itemNameInput');
    const proteinInput = document.getElementById('proteinInput');
    const carbsInput = document.getElementById('carbsInput');
    const fatsInput = document.getElementById('fatsInput');
    const fluidsInput = document.getElementById('fluidsInput');

    if (!nutritionModal || !nutritionItemsDiv || !saveButton || !appendButton) {
        console.error("Error: Nutrition modal or one of its elements not found.");
        return;
    }

    nutritionModal.style.display = 'block';

    let nutritionItems = [];

    try {
        if (task.raw.notes && typeof task.raw.notes === 'string') {
            nutritionItems = JSON.parse(task.raw.notes);
        }    
    } 
    catch (e) {
        console.error("Error parsing task.raw.nutritionPlan:", e);
        nutritionItems = [];
    }

    const renderNutritionItems = () => {
        nutritionItemsDiv.innerHTML = '';

        if (nutritionItems.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="7">No nutrition items added.</td>`;
            nutritionItemsDiv.appendChild(emptyRow);
            return;
        }

        nutritionItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.meal}</td>
                <td>${item.itemName || ''}</td>
                <td>${item.protein}</td>
                <td>${item.carbs}</td>
                <td>${item.fats}</td>
                <td>${item.fluids}</td>
                <td>${item.totalKcal.toFixed(1)}</td>
            `;
            nutritionItemsDiv.appendChild(row); // nutritionItemsDiv is already a <tbody>
        });
    };

    renderNutritionItems(); // Initial render

    appendButton.onclick = () => {
        const meal = mealTypeInput.value;
        const itemName = itemNameInput.value || '';
        const protein = parseFloat(proteinInput.value) || 0;
        const carbs = parseFloat(carbsInput.value) || 0;
        const fats = parseFloat(fatsInput.value) || 0;
        const fluids = parseFloat(fluidsInput.value) || 0;
        const totalKcal = (protein * 4) + (carbs * 4) + (fats * 9);

        const newEntry = { meal, itemName, protein, carbs, fats, fluids, totalKcal };
        nutritionItems.push(newEntry);

        renderNutritionItems();

        // Clear inputs
        mealTypeInput.value = 'Breakfast';
        itemNameInput.value = '';
        proteinInput.value = '';
        carbsInput.value = '';
        fatsInput.value = '';
        fluidsInput.value = '0';
    };

    saveButton.onclick = () => {
        calendar.updateEvent(task.id, task.calendarId, {
            raw: {
                checklist: JSON.stringify(nutritionItems),
            },
        });

        saveNutritionToEvent(task.id, nutritionItems);
        nutritionModal.style.display = 'none';
    };

    closeButton.onclick = () => {
        mealTypeInput.value = 'Breakfast';
        itemNameInput.value = '';
        proteinInput.value = '';
        carbsInput.value = '';
        fatsInput.value = '';
        fluidsInput.value = '0';
        nutritionModal.style.display = 'none';
    };
}

function saveNutritionToEvent(eventId, nutritionItems) {
    console.log(`Saving nutrition plan for event ${eventId}:`, nutritionItems);
    DataModel.checklistUpdate(eventId, nutritionItems); // Your backend hook
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

document.getElementById("nutritionPlanForm").addEventListener("submit", function (e) {
    e.preventDefault();

    // Get selected gender
    const selectedGenderButton = document.querySelector('.gender-btn.selected');
    if (!selectedGenderButton) {
        alert("Please select a gender.");
        return;
    }
    const selectedGender = selectedGenderButton.getAttribute("data-gender");

    // Get input values
    const weight = parseFloat(document.getElementById("weight").value);
    const heightCm = parseFloat(document.getElementById("height").value);
    const age = parseFloat(document.getElementById("age").value);
    const activityLevel = parseFloat(document.getElementById("activity").value);

    // Validate inputs
    if (isNaN(weight) || isNaN(heightCm) || isNaN(age) || isNaN(activityLevel)) {
        alert("Please enter valid numbers for all fields.");
        return;
    }

    // Calculate BMR based on gender
    let bmr;
    if (selectedGender === "male") {
        bmr = (10 * weight) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * heightCm) - (5 * age) - 161;
    }

    // Calculate TDEE
    const tdee = bmr * activityLevel;

    // Display result
    const resultElement = document.getElementById("calorieResult");
    resultElement.textContent = `Estimated TDEE: ${tdee.toFixed(2)} calories/day`;
});

document.getElementById("closeNutritionPlan").addEventListener("click", function () {
    closeNutritionPlanModal();
});


// Meditation stuff
document.getElementById("meditationButton").addEventListener("click", () => {
    document.getElementById("meditationModal").style.display = "block";
    document.getElementById("meditationOverlay").style.display = "block";
    startMantraRotation();
});

document.getElementById("meditationOverlay").addEventListener("click", () => {
    document.getElementById("meditationModal").style.display = "none";
    document.getElementById("meditationOverlay").style.display = "none";
    clearInterval(mantraInterval);
});

// Default mantras
let mantras = ["I am calm", "I am present", "I am enough", "Peace flows through me"];
let currentMantraIndex = 0;
let mantraInterval;

// Show scrolling mantras
async function startMantraRotation() {
    const banner = document.getElementById("mantraBanner");

    // Fetch mantras from the backend
    const fetchedMantras = await DataModel.getMantras();
    if (fetchedMantras) {
        // Add the fetched mantras to the default list
        mantras = ["I am calm", "I am present", "I am enough", "Peace flows through me", ...fetchedMantras];
    } else {
        // If no mantras are fetched, use the default list
        mantras = ["I am calm", "I am present", "I am enough", "Peace flows through me"];
    }

    if (mantraInterval) clearInterval(mantraInterval);
    banner.textContent = mantras[currentMantraIndex];

    mantraInterval = setInterval(() => {
        currentMantraIndex = (currentMantraIndex + 1) % mantras.length;
        banner.textContent = mantras[currentMantraIndex];
    }, 5000);
}


// Add user mantra (backend ready)
function addMantra() {
    const input = document.getElementById("newMantra");
    const newText = input.value.trim();
    if (newText) {
        DataModel.createMantra(newText)
        mantras.push(newText);
        input.value = "";
    }
}

// Box Breathing: 4-4-4-4
function startBoxBreathing() {
    runBreathingCycle([4, 4, 4, 4], ["Breathe In", "Hold", "Breathe Out", "Hold"]);
}

// 4-7-8 Breathing
function start478Breathing() {
    runBreathingCycle([4, 7, 8], ["Breathe In", "Hold", "Breathe Out"]);
}

function runBreathingCycle(durations, instructions) {
    let i = 0;
    const timerEl = document.getElementById("breathingTimer");
    const instructionEl = document.getElementById("breathingInstruction");

    function runStep() {
        if (i >= durations.length) {
            // End of the cycle
            instructionEl.textContent = "Breathing complete";
            timerEl.textContent = "";
            return;
        }

        let count = durations[i];
        instructionEl.textContent = instructions[i];
        timerEl.textContent = count;

        const interval = setInterval(() => {
            count--;
            timerEl.textContent = count;
            if (count <= 0) {
                clearInterval(interval);
                i++;
                runStep(); // Move to next step
            }
        }, 1000);
    }

    runStep();
}

function closeMeditationModal() {
    document.getElementById("meditationModal").style.display = "none";
    document.getElementById("meditationOverlay").style.display = "none";
    clearInterval(mantraInterval);
}

//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////