//Load the calendar and chart using the user exerciseLog data
document.addEventListener("DOMContentLoaded", async function () {
  var calendarEl = document.getElementById("calendar");
  var {eventArray, weeklyLogs} = await getExerciseData();
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: eventArray,
  });
  calendar.render();
//Render the Chart using the user exerciseLog data
  let myChart = document.getElementById('chart').getContext('2d');
  let exerciseChart = new Chart(myChart, {
    type: 'bar',
    responsive: true,
    data: {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{
        label: 'Time (Hours)',
        data: weeklyLogs[weeklyLogs.length - 1].durations,
        backgroundColor: '#0077b6',
        borderWidth: 1,
      }]
    },
    options: {}
  });
});
//Sets the default tab to be the weekly chart
window.addEventListener("DOMContentLoaded", function () {
  document.getElementById("defaultOpen").click();
});
//Function to open the tabs
function openLog(evt, view) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(view).style.display = "block";
  evt.currentTarget.className += " active";
}
//Retrieves the exercise data from the database and formats it for the calendar and chart
async function getExerciseData() {
  const response = await fetch("http://127.0.0.1:8000/exercisePage/calendarData");
  const data = await response.json();

  const exerciseLog = data.exercise;
//Get the current date for the day
  const today = new Date();
  const todaysLogs = exerciseLog.filter(log => {
  const logDate = new Date(log.date);
  return logDate.getDate() === today.getDate() &&
    logDate.getMonth() === today.getMonth() &&
    logDate.getFullYear() === today.getFullYear();
  });
//Display the exercise data for the day
  displayDailyLogs(todaysLogs);


  const eventArray = [];
  let weeklyLogs = [];
//Format the date from string to YYYY-MM-DD
  for (const key in exerciseLog) {
    if (Object.prototype.hasOwnProperty.call(exerciseLog, key)) {
      const entry = exerciseLog[key];
      const date = new Date(entry.date);
      const formattedDate = formatDate(date);

      const event = {
        title: entry.exercise,
        start: formattedDate,
        end: formattedDate,
      };

      eventArray.push(event);
//Function to display the weekly hours of exercise in the chart
      let week = weeklyLogs.find(w => date >= new Date(w.start) && date <= new Date(w.end));

      if (!week) {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        week = { start: formatDate(weekStart), end: formatDate(weekEnd), durations: [0, 0, 0, 0, 0, 0, 0] };
        weeklyLogs.push(week);
      }

      const dayOfWeek = date.getDay();
      week.durations[dayOfWeek] += parseFloat(entry.duration);
    }
  }

  return { eventArray, weeklyLogs };
}
//Function to add delete buttons to the table
function attachDeleteButtonListeners() {
  document.querySelectorAll(".delete-btn").forEach(button => {
    const id = button.getAttribute("data-id");
    button.addEventListener("click", () => deleteExerciseEntry(id));
  });
}


//Function to format the table 
function displayDailyLogs(dailyLogs) {
  console.log(dailyLogs);
  const dailyLogsDiv = document.getElementById("dailyLogs");
  let content = "<table><thead><tr><th>Exercise</th><th>Duration (hours)</th><th>Calories</th><th>Remove</th></tr></thead><tbody>";

  dailyLogs.forEach(log => {
    console.log(log);
    content += `<tr>
                <td>${log.exercise}</td>
                <td>${log.duration}</td>
                <td>${log.caloriesBurned}</td>
                <td><button class="delete-btn" data-id="${log.id}">X</button></td>
                </tr>`;
  });

  content += "</tbody></table>";

  dailyLogsDiv.innerHTML = content;
  attachDeleteButtonListeners();
}
//Function to delete entries from table and database
async function deleteExerciseEntry(id) {
  // Select the button and the row
  const button = document.querySelector(`button[data-id="${id}"]`);
  const row = button.closest("tr");

  // If they exist, remove the row
  if (button && row) {
    row.remove();
  }

  try {
    // Now make the request
    await fetch(`https://drab-rose-indri-sari.cyclic.app/exercisePage/calendarData/${id}`, {
      method: "DELETE",
    });

  } catch (error) {
    console.error("Failed to delete exercise entry", error);
    // Handle the error here, e.g., alert the user, reload the list, etc.
  }
}


let currentDay = new Date().getDate();
let currentWeek = getWeekNumber(new Date());

//Function to reset the table based on the day
setInterval(() => {
  const now = new Date();
  if (now.getDate() !== currentDay) {
    currentDay = now.getDate();
    document.getElementById("dailyLogs").innerHTML = '';
  }
}, 60 * 60000); // check every hour

//Function to reset the chart based on the week
setInterval(async () => {
  const now = new Date();
  const nowWeek = getWeekNumber(now);
  
  if (nowWeek !== currentWeek) {
    currentWeek = nowWeek;

    // Fetch new data and update the chart
    var {eventArray, weeklyLogs} = await getExerciseData();
    exerciseChart.data.datasets[0].data = weeklyLogs[weeklyLogs.length - 1].durations;
    exerciseChart.update();
  }
}, 60 * 60000); // check every hour

//Function to get the week number
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}
//Function to format the date
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

