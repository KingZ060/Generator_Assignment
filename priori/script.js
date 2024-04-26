function addTask() {
    const taskName = document.getElementById('task').value;
    const startTime = document.getElementById('start').value;
    const endTime = document.getElementById('end').value;

    if (!taskName || !startTime || !endTime) {
        alert('Please fill all fields!');
        return;
    }

    const taskList = document.getElementById('taskList');
    const li = document.createElement('li');
    li.textContent = `${taskName} - From ${startTime} to ${endTime}`;
    taskList.appendChild(li);

    // Clear the form fields
    document.getElementById('plannerForm').reset();
}

