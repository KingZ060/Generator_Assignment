function toggleTimeInput() {
    var checkbox = document.getElementById('uniqueTimeToggle');
    var form = document.getElementById('timeInputForm');
    if (checkbox.checked) {
        form.style.display = 'block';
    } else {
        form.style.display = 'none';
    }
}

let tasks = [];

function addTask() {
    const taskInput = document.getElementById('task');
    if (!taskInput.value.trim()) {
        alert("Please enter a task description.");
        return;
    }
    const task = taskInput.value.trim();
    const hasUniqueTime = document.getElementById('uniqueTimeToggle').checked;
    const startTime = hasUniqueTime ? document.getElementById('startTime').value : null;
    const endTime = hasUniqueTime ? document.getElementById('endTime').value : null;
    const wantsBreak = document.getElementById('breakToggle').checked;

    tasks.push({
        task,
        hasUniqueTime,
        startTime,
        endTime,
        wantsBreak,
        duration: 2
    });

    taskInput.value = '';
}

function generateSchedule() {
    let schedule = [];

    for (let i = tasks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
    }

    // Schedule tasks
    tasks.forEach(task => {
        if (task.hasUniqueTime) {
            schedule.push({  // Add task directly if it has unique time
                task: task.task,
                startTime: formatTimeToAmPm(task.startTime),
                endTime: formatTimeToAmPm(task.endTime)
            });
            if (task.wantsBreak) {
                // Insert break logic here
            }
        } else {
            // Use a function to find a random slot
            const assigned = assignRandomTime(task.task, task.duration, task.wantsBreak);
            if (assigned) {
                schedule.push(assigned);
            }
        }
    });

    updateScheduleDisplay(schedule);
}

function updateScheduleDisplay(schedule) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear previous entries

    schedule.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.startTime}-${item.endTime} ${item.task}`;
        taskList.appendChild(li);
    });
}

function formatTimeToAmPm(timeString) {
    const timeParts = timeString.split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}

function getRandomStartTimes() {
    const startTimes = [];
    const startTime = new Date("1970/01/01 09:00");
    const endTime = new Date("1970/01/01 22:00");
    const increment = 30; // Time increment in minutes

    for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + increment)) {
        console.log(time.toTimeString());
        startTimes.push(new Date(time)); // Clone the date to avoid mutation
    }

    // Shuffle array to ensure random order
    for (let i = startTimes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [startTimes[i], startTimes[j]] = [startTimes[j], startTimes[i]];
    }

    return startTimes;
}

function assignRandomTime(task, durationHours, includeBreak = false) {
    const possibleStartTimes = getRandomStartTimes();
    const durationMilliseconds = durationHours * 3600000; // Convert hours to milliseconds
    const breakDuration = 15 * 60000; // 30 minutes break in milliseconds

    for (let possibleStart of possibleStartTimes) {
        let endTaskTime = new Date(possibleStart.getTime() + durationMilliseconds);
        if (includeBreak) {
            // Adjust end time to include break time
            endTaskTime = new Date(endTaskTime.getTime() + breakDuration);
        }

        let startTimeFormatted = formatTimeToAmPm(possibleStart.toTimeString().substring(0, 5));
        let endTimeFormatted = formatTimeToAmPm(endTaskTime.toTimeString().substring(0, 5));

        // Check for overlap
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
            return { startTime: startTimeFormatted, endTime: endTimeFormatted };
        }
    }

    return null; // If no suitable time found
}
