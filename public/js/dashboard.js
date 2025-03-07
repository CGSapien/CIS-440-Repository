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

    let mainGoal = document.getElementById("mainGoal").value.trim() || null;
    let subGoalElements = document.querySelectorAll(".sub-goal");
    let tertiaryGoalElements = document.querySelectorAll(".tertiary-goal");

    let goals = {
        main_goal: mainGoal,
        Sub1: null,
        Sub2: null,
        tertiary1: null,
        tertiary2: null
    };

    subGoalElements.forEach((sub, index) => {
        let subGoalText = sub.value.trim() || null;
        let tertiaryGoalText = tertiaryGoalElements[index]?.value.trim() || null;

        if (index === 0) {
            goals.Sub1 = subGoalText;
            goals.tertiary1 = tertiaryGoalText;
        } else if (index === 1) {
            goals.Sub2 = subGoalText;
            goals.tertiary2 = tertiaryGoalText;
        }
    });

    console.log("Submitting goals:", goals); // Check data before sending

    // Call the API function
    let success = await DataModel.updateUserGoals(goals);

    if (success) {
        alert("Goals updated successfully!");
    } else {
        alert("Failed to update goals. Check the console for errors.");
    }
}


async function loadSavedGoals() {
    try {
        let response = DataModel.getGoals;
        if (!response.ok) return;

        let data = await response.json();
        document.getElementById("mainGoal").value = data.mainGoal || "";

        let subGoalsContainer = document.getElementById("subGoals");
        subGoalsContainer.innerHTML = ""; // Clear existing sub-goals

        (data.subGoals || []).forEach(subGoalObj => {
            let div = document.createElement("div");
            div.innerHTML = `<label>Sub Goal:</label>
                             <input type='text' class='sub-goal' value='${subGoalObj.subGoal}'>
                             <button onclick='addTertiaryGoal(this)'>Add Tertiary Goal</button>
                             <div class='tertiaryGoals'>
                                 <div>
                                     <label>Tertiary Goal:</label>
                                     <input type='text' class='tertiary-goal' value='${subGoalObj.tertiaryGoal || ""}'>
                                 </div>
                             </div>`;
            subGoalsContainer.appendChild(div);
        });

    } catch (error) {
        console.error("Error loading saved goals:", error);
    }
}
//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////