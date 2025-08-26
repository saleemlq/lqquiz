let current = 0;
let score = 0;
let timer;
let timeLeft = 30;
let currentQuiz = null;
let currentStudent = "";
let currentLevel = null;
let currentQuizIndex = null;
let viewStack = [];

const startScreen = document.getElementById("start-screen");
const quizListScreen = document.getElementById("quiz-list-screen");
const questionScreen = document.getElementById("question-screen");
const resultScreen = document.getElementById("result-screen");

const levelList = document.getElementById("level-list");
const quizList = document.getElementById("quiz-list");

const questionText = document.getElementById("question-text");
const optionsList = document.getElementById("options-list");
const currentQ = document.getElementById("current-q");
const totalQ = document.getElementById("total-q");
const timerDisplay = document.getElementById("timer");
const scoreText = document.getElementById("score-text");
const quizTitle = document.getElementById("quiz-title");
const backButton = document.getElementById("back-button");

const studentDisplay = document.getElementById("student-display");
const backButtonAndName = document.querySelector(".button-and-name");

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadStudents();
    loadLevels();
  }, 100);
});

backButton.addEventListener("click", () => {
  goBack();
});

function showScreen(screen) {
  [startScreen, quizListScreen, questionScreen, resultScreen].forEach((s) => {
    s.classList.add("hidden");
    s.classList.remove("active");
  });

  screen.classList.remove("hidden");
  screen.classList.add("active");

  backButton.style.display = viewStack.length > 0 ? "inline-block" : "none";
  backButtonAndName.style.display = viewStack.length > 0 ? "flex" : "none";
  studentDisplay.textContent = currentStudent ? `👤 ${currentStudent}` : "";
}

function goBack() {
  const last = viewStack.pop();
  if (!last) return;
  showScreen(last);
}

function loadStudents() {
  const list = JSON.parse(localStorage.getItem("listOfStudents") || "[]");
  const dropdown = document.getElementById("student-dropdown");
  const selected = dropdown.querySelector(".dropdown-selected");
  const optionsList = dropdown.querySelector(".dropdown-options");

  optionsList.innerHTML = "";
  if (!currentStudent) selected.textContent = "-- Select Student --";

  list.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    li.classList.add("quiz-option");

    li.addEventListener("click", (e) => {
      e.stopPropagation();
      selected.textContent = name;
      currentStudent = name;
      dropdown.classList.remove("open");
      loadLevels();
    });

    optionsList.appendChild(li);
  });

  dropdown
    .querySelector(".dropdown-selected")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });
}

function loadLevels() {
  levelList.innerHTML = "";
  const levels = [...new Set(quizzes.map((q) => q.level))];
  const progress = getStudentProgress();

  levels.forEach((level) => {
    const li = document.createElement("li");
    li.textContent = typeof level === "number" ? `Level ${level}` : `${level}`;
    li.classList.add("quiz-option");

    if (progress.some((p) => p.level === level && p.question < p.total)) {
      const dot = document.createElement("span");
      dot.classList.add("progress-dot");
      li.appendChild(dot);
    }

    li.addEventListener("click", () => {
      viewStack.push(startScreen);
      showQuizzes(level);
    });

    levelList.appendChild(li);
  });

  showScreen(startScreen);
}

function showQuizzes(level) {
  currentLevel = level;
  quizList.innerHTML = "";
  const progress = getStudentProgress();

  quizzes.forEach((quiz, index) => {
    if (quiz.level !== level) return;

    const li = document.createElement("li");
    li.textContent = quiz.title;
    li.classList.add("quiz-option");

    const saved = progress.find(
      (p) => p.level === quiz.level && p.quiz === quiz.quiz
    );

    if (saved) {
      if (saved.highestPercentage > 0) {
        const percent = document.createElement("span");
        percent.classList.add("score-info");
        percent.textContent = ` (${saved.highestPercentage}%)`;
        li.appendChild(percent);
      }
      if (saved.question < saved.total) {
        const dot = document.createElement("span");
        dot.classList.add("progress-dot");
        li.appendChild(dot);
      }
    }

    li.addEventListener("click", () => {
      viewStack.push(quizListScreen);
      startQuiz(index);
    });

    quizList.appendChild(li);
  });

  showScreen(quizListScreen);
}

function startQuiz(index) {
  currentQuiz = quizzes[index];
  currentQuizIndex = index;
  quizTitle.textContent = currentQuiz.title;

  const saved = getStudentProgress().find(
    (p) => p.level === currentQuiz.level && p.quiz === currentQuiz.quiz
  );

  const isCompleted = saved && saved.question >= currentQuiz.questions.length;
  current = isCompleted ? 0 : saved?.question || 0;
  score = isCompleted ? 0 : saved?.score || 0;

  showScreen(questionScreen);
  loadQuestion();
}

// helper: shuffle array
function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function loadQuestion() {
  if (current >= currentQuiz.questions.length) {
    showResult();
    return;
  }

  clearInterval(timer);
  timeLeft = 30;
  timerDisplay.textContent = timeLeft;

  const q = currentQuiz.questions[current];
  questionText.textContent = q.question;
  optionsList.innerHTML = "";
  currentQ.textContent = current + 1;
  totalQ.textContent = currentQuiz.questions.length;

  // shuffle options
  const shuffledOptions = shuffleArray([...q.options]);

  shuffledOptions.forEach((opt) => {
    const li = document.createElement("li");
    li.textContent = opt;
    li.addEventListener("click", () => checkAnswer(li, opt === q.answer));
    optionsList.appendChild(li);
  });

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft === 0) {
      clearInterval(timer);
      showCorrect();
      setTimeout(nextQuestion, 1000);
    }
  }, 1000);
}

function checkAnswer(elem, correct) {
  clearInterval(timer);
  if (correct) {
    elem.classList.add("correct");
    score++;
  } else {
    elem.classList.add("wrong");
    showCorrect();
  }

  disableOptions();
  saveProgress();
  setTimeout(nextQuestion, 1000);
}

function showCorrect() {
  const correctText = currentQuiz.questions[current].answer;
  Array.from(optionsList.children).forEach((li) => {
    if (li.textContent === correctText) {
      li.classList.add("correct");
    }
  });
}

function disableOptions() {
  Array.from(optionsList.children).forEach(
    (li) => (li.style.pointerEvents = "none")
  );
}

function nextQuestion() {
  current++;
  loadQuestion();
}

function getStudentProgress() {
  return JSON.parse(localStorage.getItem("lastAnswered") || "[]").filter(
    (p) => p.student === currentStudent
  );
}

function saveProgress() {
  if (!currentStudent) return;
  const total = currentQuiz.questions.length;
  const percent = parseFloat(((score / total) * 100).toFixed(1));

  let progress = JSON.parse(localStorage.getItem("lastAnswered") || "[]");
  const idx = progress.findIndex(
    (p) =>
      p.student === currentStudent &&
      p.level === currentQuiz.level &&
      p.quiz === currentQuiz.quiz
  );

  if (idx !== -1) {
    progress[idx].question = current + 1;
    progress[idx].score = score;
    progress[idx].total = total;
    progress[idx].highestPercentage = Math.max(
      progress[idx].highestPercentage || 0,
      percent
    );
  } else {
    progress.push({
      student: currentStudent,
      level: currentQuiz.level,
      quiz: currentQuiz.quiz,
      question: current + 1,
      score: score,
      total: total,
      highestPercentage: percent,
    });
  }

  localStorage.setItem("lastAnswered", JSON.stringify(progress));
}

function showResult() {
  viewStack.push(questionScreen);
  showScreen(resultScreen);

  const total = currentQuiz.questions.length;
  const percent = ((score / total) * 100).toFixed(1);
  const roundedPercent = Math.round(percent);

  // Multiple quotes per range
  const quotes = {
    90: [
      "Outstanding work! You didn’t just pass — you inspired!",
      "Excellent! Your answers show mastery.",
      "You’ve set the bar high — keep it up!",
      "Superb! You’re a role model for learning.",
      "Fantastic performance — excellence achieved!"
    ],
    80: [
      "Great job! You’re nearly perfect.",
      "Excellent effort — very well done!",
      "Strong results — keep pushing forward.",
      "Impressive work, just a step from mastery!",
      "Amazing consistency — bravo!"
    ],
    70: [
      "Well done! Solid achievement.",
      "Good progress — keep building.",
      "You’re moving in the right direction!",
      "Your dedication is showing results.",
      "Strong performance — keep going!"
    ],
    60: [
      "Not bad! You’re improving steadily.",
      "Good effort — more practice will perfect it.",
      "Solid work, you’re on the right track.",
      "Encouraging result — keep studying!",
      "Nice progress — consistency is key!"
    ],
    50: [
      "A fair attempt — keep learning!",
      "Decent progress — next time will be better.",
      "Halfway there — keep practicing!",
      "Effort shows — now aim higher!",
      "You’re building a strong foundation."
    ],
    40: [
      "A learning step — reflect and grow.",
      "Don’t stop here — progress is coming.",
      "Every mistake is a step forward.",
      "Keep trying — success is built this way.",
      "Encouraging start — more effort, more reward."
    ],
    30: [
      "Small progress — but it counts!",
      "Not the end — keep striving!",
      "Stay motivated, results will improve.",
      "This is a lesson, not a failure.",
      "Perseverance will pay off."
    ],
    20: [
      "Resilience matters more than scores.",
      "Don’t lose heart — keep pushing.",
      "Failure is just delayed success.",
      "Try again — you’re capable of more!",
      "Keep practicing — the path is long but worth it."
    ],
    10: [
      "Even small steps matter.",
      "Don’t give up — the start is always hardest.",
      "Courage is in trying again.",
      "You’ve started the journey — continue it!",
      "The effort counts — keep going!"
    ],
    0: [
      "Every result is a step forward.",
      "Don’t worry — mistakes are teachers.",
      "Fall down 7 times, stand up 8.",
      "Failure is the seed of success.",
      "This is not the end — it’s the beginning!"
    ]
  };

  function getRandomQuote(percent) {
    if (percent >= 90) return quotes[90][Math.floor(Math.random() * 5)];
    if (percent >= 80) return quotes[80][Math.floor(Math.random() * 5)];
    if (percent >= 70) return quotes[70][Math.floor(Math.random() * 5)];
    if (percent >= 60) return quotes[60][Math.floor(Math.random() * 5)];
    if (percent >= 50) return quotes[50][Math.floor(Math.random() * 5)];
    if (percent >= 40) return quotes[40][Math.floor(Math.random() * 5)];
    if (percent >= 30) return quotes[30][Math.floor(Math.random() * 5)];
    if (percent >= 20) return quotes[20][Math.floor(Math.random() * 5)];
    if (percent >= 10) return quotes[10][Math.floor(Math.random() * 5)];
    return quotes[0][Math.floor(Math.random() * 5)];
  }

  document.getElementById("quote").innerText = getRandomQuote(roundedPercent);

  scoreText.innerHTML = `
    <div class="green">Marks: <strong>${score}/${total}</strong></div>
    <div class="green">Percentage: <strong>${roundedPercent}%</strong></div>
  `;
}

function setStudentList(namesArray) {
  if (!Array.isArray(namesArray)) return;

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");

  const cleaned = namesArray.map((n) => toTitleCase(n.trim())).filter(Boolean);
  const unique = [...new Set(cleaned)];

  localStorage.setItem("listOfStudents", JSON.stringify(unique));
  console.log("✅ Student list saved:", unique);
}

const manageBtn = document.getElementById("manage-students-btn");
const popup = document.getElementById("student-popup");
const closePopup = document.getElementById("close-popup");
const studentInputsDiv = document.getElementById("student-inputs");

// Open popup
manageBtn.addEventListener("click", () => {
  popup.classList.remove("hidden");
  renderStudentInputs();
});

// Close popup
closePopup.addEventListener("click", () => {
  popup.classList.add("hidden");
  location.reload();
});

// Render input fields
function renderStudentInputs(focusIndex = null, cursorPos = null) {
  studentInputsDiv.innerHTML = "";
  const students = JSON.parse(localStorage.getItem("listOfStudents") || "[]");

  students.forEach((name, idx) => {
    addStudentInput(name, idx, focusIndex, cursorPos);
  });

  addStudentInput("", students.length, focusIndex, cursorPos);
}

function capitalizeWords(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function addStudentInput(
  value = "",
  index,
  focusIndex = null,
  cursorPos = null
) {
  const row = document.createElement("div");
  row.className = "student-row";

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = "Add another student";

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "❌";
  removeBtn.className = "remove-btn";

  if (focusIndex === index) {
    setTimeout(() => {
      input.focus();
      if (cursorPos !== null) {
        input.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  }

  removeBtn.addEventListener("click", () => {
    let list = JSON.parse(localStorage.getItem("listOfStudents") || "[]");
    list.splice(index, 1);
    localStorage.setItem("listOfStudents", JSON.stringify(list));
    renderStudentInputs();
    loadStudents();
  });

  input.addEventListener("input", () => {
    let list = JSON.parse(localStorage.getItem("listOfStudents") || "[]");
    let rawValue = input.value;

    if (!rawValue.trim()) {
      list[index] = "";
      localStorage.setItem("listOfStudents", JSON.stringify(list));
      loadStudents();
      return;
    }

    if (rawValue.endsWith(" ")) {
      return;
    }

    const formattedName = capitalizeWords(rawValue.trim());

    const duplicate = list.some(
      (n, i) => i !== index && n.toLowerCase() === formattedName.toLowerCase()
    );

    if (duplicate) {
      input.style.border = "2px solid red";
      return;
    }
    input.style.border = "";

    list[index] = formattedName;
    list = list.filter((n, i) => n || i < list.length - 1);
    list = [...new Set(list.map((n) => n.toLowerCase()))].map((n) =>
      capitalizeWords(n)
    );

    localStorage.setItem("listOfStudents", JSON.stringify(list));

    if (index === list.length - 1 && formattedName) {
      renderStudentInputs(index, input.selectionStart);
    }

    loadStudents();
  });

  row.appendChild(input);

  if (value) {
    row.appendChild(removeBtn);
  }

  studentInputsDiv.appendChild(row);
}
