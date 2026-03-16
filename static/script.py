let startTime;
let isRunning = false;
let splits = [];
let timerInterval;

const timerDisplay = document.getElementById('timer');

document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault();

    if (!isRunning) {
        // START
        startTime = performance.now();
        splits = [];
        isRunning = true;
        timerInterval = setInterval(updateDisplay, 10);
    } else {
        // RECORD SPLIT
        const now = performance.now();
        splits.push((now - startTime) / 1000);
        
        if (splits.length === 4) {
            stopTimer();
        }
    }
});

function updateDisplay() {
    const elapsed = (performance.now() - startTime) / 1000;
    timerDisplay.innerText = elapsed.toFixed(2);
}

async function stopTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    
    // Send data to your Python Backend for AI feedback
    const response = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            total_time: splits[3],
            splits: splits
        })
    });
    const data = await response.json();
    alert("AI Feedback: " + data.feedback);
}
