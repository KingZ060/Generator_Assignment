//With some help from Chatgpt

function toggleTimeInput() {
    var checkbox = document.getElementById('uniqueTimeToggle');
    var form = document.getElementById('timeInputForm');
    var breakCheckbox = document.getElementById('breakToggle');
    if (checkbox.checked) {
        form.style.display = 'block';
        breakCheckbox.disabled = true;
    } else {
        form.style.display = 'none';
        breakCheckbox.disabled = false;
    }
}

function parseTaskDescription(taskString) {
    const defaultDuration = 120;
    let task = { name: "", duration: defaultDuration };
    let parts = taskString.split(' for ');
    task.name = parts[0].trim();

    if (parts.length > 1) {
        let timePart = parts[1].trim();
        let timeValue = parseInt(timePart);
        let timeUnits = timePart.match(/[a-zA-Z]+/)[0];

        if (timeUnits.startsWith('hour')) {
            task.duration = timeValue * 60;
        } else if (timeUnits.startsWith('minute')) {
            task.duration = timeValue;
        }
    }

    return task;
}


let tasksWithUniqueTime = [];
let tasksWithoutUniqueTime = [];
let schedule = [];

function addTask() {
    const task = document.getElementById('task');
    const taskInput = task.value.trim();
    if (!taskInput) {
        alert("Please enter a task description.");
        return;
    }

    const hasUniqueTime = document.getElementById('uniqueTimeToggle').checked;
    const startTime = hasUniqueTime ? document.getElementById('startTime').value : null;
    const endTime = hasUniqueTime ? document.getElementById('endTime').value : null;
    const wantsBreak = document.getElementById('breakToggle').checked;
    const taskDetails = parseTaskDescription(taskInput);

    let timeConflict = tasksWithUniqueTime.some(s => (s.endTime > startTime && s.startTime < endTime));
    if (timeConflict) {
        alert("You already have a task in this time slot");
        return;
    }

    if (hasUniqueTime) {
        tasksWithUniqueTime.push({
            taskInput: taskDetails.name,
            startTime,
            endTime,
            duration: taskDetails.duration
        });
    } else {
        tasksWithoutUniqueTime.push({
            taskInput: taskDetails.name,
            wantsBreak,
            duration: taskDetails.duration
        });
    }

    task.value = '';  // Clear the input field after adding the task
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateSchedule(attemptCount = 0) {
    const maxAttempts = 3;
    if (attemptCount >= maxAttempts) {
        alert("Failed to schedule all tasks after several attempts.");
        return; 
    }

    schedule = [];
    let allAssigned = true;
    
    tasksWithUniqueTime.forEach(task => {
        schedule.push({
            task: task.taskInput,
            startTime: formatTimeToAmPm(task.startTime),
            endTime: formatTimeToAmPm(task.endTime)
        });
    });

    shuffleArray(tasksWithoutUniqueTime);
    for (let i = 0; i < tasksWithoutUniqueTime.length; i++) {
        let task = tasksWithoutUniqueTime[i];
        const assigned = assignRandomTime(task.taskInput, task.duration, task.wantsBreak);
        if (!assigned) {
            allAssigned = false;
            break;
        }
    }

    if (!allAssigned) {
        console.log("Not all tasks could be scheduled, retrying...");
        generateSchedule(attemptCount + 1);
    } else if (schedule.length === 0) {
        alert("You are free all day! Please add some tasks to do!");
    
    }else {
        updateScheduleDisplay();  // Update the display only if all tasks are successfully scheduled
    }
}

function updateScheduleDisplay() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    schedule.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.startTime}-${item.endTime} ${item.task}`;
        taskList.appendChild(li);
    });
    document.getElementById('downloadButton').style.display = 'block';
}

function formatTimeToAmPm(timeString) {
    const timeParts = timeString.split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

function getRandomStartTimes() {
    const startTimes = [];
    const startTime = new Date("1970/01/01 09:00");
    const endTime = new Date("1970/01/01 22:00");
    const increment = 30; // Time increment in minutes

    for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + increment)) {
        startTimes.push(new Date(time));
    }
    shuffleArray(startTimes);
    return startTimes;
}

function assignRandomTime(task, durationHours, includeBreak = false) {
    const possibleStartTimes = getRandomStartTimes();
    const durationMilliseconds = durationHours * 60000; // Convert hours to milliseconds
    const breakDuration = 15 * 60000; // 30 minutes break in milliseconds

    for (let possibleStart of possibleStartTimes) {
        let endTaskTime = new Date(possibleStart.getTime() + durationMilliseconds);
        if (includeBreak) {
            endTaskTime = new Date(endTaskTime.getTime() + breakDuration);
        }

        let startTimeFormatted = formatTimeToAmPm(possibleStart.toTimeString().substring(0, 5));
        let endTimeFormatted = formatTimeToAmPm(endTaskTime.toTimeString().substring(0, 5));

        let overlap = schedule.some(s => !(s.endTime <= startTimeFormatted || s.startTime >= endTimeFormatted));
        if (!overlap) {
            if (includeBreak) {
                const breakStartTime = new Date(possibleStart.getTime() + durationMilliseconds / 2 - breakDuration / 2);
                const breakEndTime = new Date(breakStartTime.getTime() + breakDuration);

                schedule.push({ task: task + " (Part 1)", startTime: startTimeFormatted, endTime: formatTimeToAmPm(breakStartTime.toTimeString().substring(0, 5)) });
                schedule.push({ task: "Break", startTime: formatTimeToAmPm(breakStartTime.toTimeString().substring(0, 5)), endTime: formatTimeToAmPm(breakEndTime.toTimeString().substring(0, 5)) });
                schedule.push({ task: task + " (Part 2)", startTime: formatTimeToAmPm(breakEndTime.toTimeString().substring(0, 5)), endTime: endTimeFormatted });
            } else {
                schedule.push({ task, startTime: startTimeFormatted, endTime: endTimeFormatted });
            }
            return true;
        }
    }

    return null;
}

function download(){
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Task, Start Time to End Time\n";
    schedule.forEach(item => {
        const row = `${item.task}, ${item.startTime} to ${item.endTime}`;
        csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

