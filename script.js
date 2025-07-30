let current = 0;
let score = 0;
let timer;
let timeLeft = 30;
let currentQuiz = null;
let currentStudent = "";
let currentLevel = null;
let currentQuizIndex = null;

const startScreen = document.getElementById("start-screen");
const quizListScreen = document.getElementById("quiz-list-screen");
const questionScreen = document.getElementById("question-screen");
const resultScreen = document.getElementById("result-screen");

const studentSelect = document.getElementById("student-select");
const levelList = document.getElementById("level-list");
const quizList = document.getElementById("quiz-list");

const questionText = document.getElementById("question-text");
const optionsList = document.getElementById("options-list");
const currentQ = document.getElementById("current-q");
const totalQ = document.getElementById("total-q");
const timerDisplay = document.getElementById("timer");
const scoreText = document.getElementById("score-text");
const quizTitle = document.getElementById("quiz-title");

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadStudents();
    loadLevels();
  }, 100);
});

function loadStudents() {
  const list = JSON.parse(localStorage.getItem("listOfStudents") || "[]");
  studentSelect.innerHTML = `<option value="">-- Select Student --</option>`;
  list.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    studentSelect.appendChild(option);
  });

  studentSelect.addEventListener("change", () => {
    currentStudent = studentSelect.value;
    loadLevels(); // Reload levels with indicators
  });
}

function loadLevels() {
  levelList.innerHTML = "";
  const levels = [...new Set(quizzes.map(q => q.level))];
  const lastAnswered = JSON.parse(localStorage.getItem("lastAnswered") || "[]");
  const studentProgress = lastAnswered.filter(entry => entry.student === currentStudent);

  levels.forEach(level => {
    const li = document.createElement("li");
    li.textContent = `Level ${level}`;
    li.classList.add("quiz-option");

    const hasProgress = studentProgress.some(entry => entry.level === level);
    if (hasProgress) {
      const dot = document.createElement("span");
      dot.classList.add("progress-dot");
      li.appendChild(dot);
    }

    li.addEventListener("click", () => showQuizzes(level));
    levelList.appendChild(li);
  });
}

function showQuizzes(level) {
  currentLevel = level;
  quizList.innerHTML = "";
  startScreen.classList.add("hidden");
  startScreen.classList.remove("active");
  quizListScreen.classList.remove("hidden");
  quizListScreen.classList.add("active");

  const lastAnswered = JSON.parse(localStorage.getItem("lastAnswered") || "[]");
  const studentProgress = lastAnswered.filter(entry => entry.student === currentStudent);

  quizzes.forEach((quiz, index) => {
    if (quiz.level === level) {
      const li = document.createElement("li");
      li.textContent = quiz.title;
      li.classList.add("quiz-option");

      const hasProgress = studentProgress.some(
        entry => entry.level === quiz.level && entry.quiz === quiz.quiz
      );

      if (hasProgress) {
        const dot = document.createElement("span");
        dot.classList.add("progress-dot");
        li.appendChild(dot);
      }

      li.addEventListener("click", () => startQuiz(index));
      quizList.appendChild(li);
    }
  });
}

function startQuiz(index) {
  currentQuiz = quizzes[index];
  currentQuizIndex = index;
  score = 0;
  quizTitle.textContent = currentQuiz.title;

  const lastAnswered = JSON.parse(localStorage.getItem("lastAnswered") || "[]");
  const studentProgress = lastAnswered.find(entry =>
    entry.student === currentStudent &&
    entry.level === currentQuiz.level &&
    entry.quiz === currentQuiz.quiz
  );

  current = studentProgress ? studentProgress.question : 0;

  quizListScreen.classList.add("hidden");
  quizListScreen.classList.remove("active");
  questionScreen.classList.remove("hidden");
  questionScreen.classList.add("active");

  loadQuestion();
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

  q.options.forEach(opt => {
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
  Array.from(optionsList.children).forEach(li => {
    if (li.textContent === correctText) {
      li.classList.add("correct");
    }
  });
}

function disableOptions() {
  Array.from(optionsList.children).forEach(li => li.style.pointerEvents = "none");
}

function nextQuestion() {
  current++;
  loadQuestion();
}

function saveProgress() {
  if (!currentStudent) return;

  let lastAnswered = JSON.parse(localStorage.getItem("lastAnswered") || "[]");

  const index = lastAnswered.findIndex(entry =>
    entry.student === currentStudent &&
    entry.level === currentQuiz.level &&
    entry.quiz === currentQuiz.quiz
  );

  if (index !== -1) {
    lastAnswered[index].question = current + 1;
  } else {
    lastAnswered.push({
      student: currentStudent,
      level: currentQuiz.level,
      quiz: currentQuiz.quiz,
      question: current + 1
    });
  }

  localStorage.setItem("lastAnswered", JSON.stringify(lastAnswered));
}

function showResult() {
  questionScreen.classList.add("hidden");
  questionScreen.classList.remove("active");
  resultScreen.classList.remove("hidden");
  resultScreen.classList.add("active");

  const total = currentQuiz.questions.length;
  const percent = ((score / total) * 100).toFixed(1);
  scoreText.innerHTML = `
    <div>Marks: <strong>${score}/${total}</strong></div>
    <div>Percentage: <strong>${percent}%</strong></div>
  `;
}

function setStudentList(namesArray) {
  if (!Array.isArray(namesArray)) {
    console.error("❌ Please provide an array of student names.");
    return;
  }

  const toTitleCase = str =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const cleaned = namesArray
    .map(name => toTitleCase(name.trim()))
    .filter(name => name); // remove empty strings

  const uniqueNames = [...new Set(cleaned)];

  localStorage.setItem("listOfStudents", JSON.stringify(uniqueNames));
  console.log("✅ Student list saved (cleaned):", uniqueNames);
}


