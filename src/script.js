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
const defaultDate = "2024/01/01";
let rng;
let seed = '';

function addTask() {
    const task = document.getElementById('task');
    const taskInput = task.value.trim();
    if (!taskInput) {
        alert("Please enter a task description.");
        return;
    }

    const hasUniqueTime = document.getElementById('uniqueTimeToggle').checked;
    let startTime = hasUniqueTime ? document.getElementById('startTime').value : null;
    let endTime = hasUniqueTime ? document.getElementById('endTime').value : null;
    const wantsBreak = document.getElementById('breakToggle').checked;
    const taskDetails = parseTaskDescription(taskInput);
    if (hasUniqueTime){
        startTime = new Date(defaultDate + " " + formatTimeToAmPm(startTime));
        endTime = new Date(defaultDate + " " + formatTimeToAmPm(endTime));

        console.log(startTime, endTime);
        let timeConflict = tasksWithUniqueTime.some(s => (s.endTime > startTime && s.startTime < endTime));
        if (timeConflict) {
            alert("You already have a task in this time slot");
            return;
        }
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
    resetForm();
}

function resetForm() {
    document.getElementById('uniqueTimeToggle').checked = false;
    document.getElementById('timeInputForm').style.display = 'none';
    document.getElementById('breakToggle').checked = false;
    document.getElementById('breakToggle').disabled = false;
    document.getElementById('task').value = '';
    // if (document.getElementById('seed')) {
    //     document.getElementById('seed').value = '';
    // }
    if (document.getElementById('startTime')) {
        document.getElementById('startTime').value = '';
    }
    if (document.getElementById('endTime')) {
        document.getElementById('endTime').value = '';
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1)); //Idea from Chatgpt
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateSchedule(attemptCount = 0) {
    const maxAttempts = 5;
    if (attemptCount >= maxAttempts) {
        alert("Failed to schedule all tasks after several attempts.");
        return; 
    }
    seed = document.getElementById('seed').value;
    schedule = [];
    let allAssigned = true;
    
    tasksWithUniqueTime.forEach(task => {
        schedule.push({
            task: task.taskInput,
            startTime: task.startTime,
            endTime: task.endTime
        });
    });
    console.log(seed.length)

    if(seed.length == 0){
        console.log("No seed provided, generating random seed");
        rng = new Math.seedrandom();
    }else{
        console.log("Seed provided, using seed to generate random numbers");
        rng = new Math.seedrandom(seed);
    }
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

    schedule.sort(function (a, b) {
        return a.startTime - b.startTime;
    });

    schedule.forEach(item => {
        console.log(item.startTime, item.endTime);
    });

    schedule.forEach(item => {
        const li = document.createElement('li');

        formatTimeToAmPm(item.startTime.toTimeString().substring(0, 5))
        li.textContent = `${formatTimeToAmPm(item.startTime.toTimeString().substring(0, 5))} - ${formatTimeToAmPm(item.endTime.toTimeString().substring(0, 5))}  ${item.task}`;
        taskList.appendChild(li);
    });
    resetForm();
    document.getElementById('downloadButton').style.display = 'block';
    document.getElementById('copyButton').style.display = 'block';
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
    const startTime = new Date("2024/01/01 08:00");
    const endTime = new Date("2024/01/01 22:00");
    const increment = 30;

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
        let endTaskTime = new Date(possibleStart.getTime() + durationMilliseconds + (includeBreak ? breakDuration : 0));
        
        let overlap = schedule.some(s => {
            let scheduledStart = s.startTime;
            let scheduledEnd = s.endTime;
            return endTaskTime > scheduledStart && possibleStart < scheduledEnd;
        });
        // console.log(overlap)
        if (!overlap) {
            if (includeBreak) {
                const breakStartTime = new Date(possibleStart.getTime() + durationMilliseconds / 2);
                const breakEndTime = new Date(breakStartTime.getTime() + breakDuration);

                schedule.push({ task: task + " (Part 1)", startTime: possibleStart, endTime: breakStartTime });
                schedule.push({ task: "Break", startTime: breakStartTime, endTime: breakEndTime });
                schedule.push({ task: task + " (Part 2)", startTime: breakEndTime, endTime: endTaskTime });
            } else {
                schedule.push({ task, startTime: possibleStart, endTime: endTaskTime });
            }
            return true;
        }
    }

    return null;
}

function download(){ //Was deleted by mistake, ideas from chatgpt about how to create a csv file
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Start Time to End Time, Task Name\n";
    csvContent += document.getElementById('taskList').innerText;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function copy(){
    content = "Start Time to End Time, Task Name\n";
    content += document.getElementById('taskList').innerText;
    navigator.clipboard.writeText(content).then(() => {
        alert('Text successfully copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy text. Please try again!');
        console.error('Failed to copy text: ', err);
    });

}