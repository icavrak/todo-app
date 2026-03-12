const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const themeToggle = document.getElementById("theme-toggle");
const THEME_STORAGE_KEY = "theme";

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  applyTheme(savedTheme === "dark" ? "dark" : "light");
}

function renderEmptyState() {
  if (todoList.children.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.id = "empty-state";
    empty.textContent = "No todos yet. Add one above.";
    todoList.appendChild(empty);
  }
}

function clearEmptyState() {
  const emptyState = document.getElementById("empty-state");
  if (emptyState) {
    emptyState.remove();
  }
}

function createTodoItem(text) {
  const item = document.createElement("li");
  item.className = "todo-item";

  const leftGroup = document.createElement("div");
  leftGroup.className = "todo-left";

  const completeCheckbox = document.createElement("input");
  completeCheckbox.type = "checkbox";
  completeCheckbox.className = "complete-checkbox";
  completeCheckbox.setAttribute("aria-label", `Mark ${text} as completed`);

  const label = document.createElement("span");
  label.className = "todo-text";
  label.textContent = text;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";

  completeCheckbox.addEventListener("change", () => {
    item.classList.toggle("completed", completeCheckbox.checked);
  });

  deleteButton.addEventListener("click", () => {
    item.classList.add("removing");
    item.addEventListener("animationend", () => {
      item.remove();
      renderEmptyState();
    }, { once: true });
  });

  leftGroup.append(completeCheckbox, label);
  item.append(leftGroup, deleteButton);
  return item;
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) {
    return;
  }

  clearEmptyState();
  todoList.appendChild(createTodoItem(text));
  todoInput.value = "";
  todoInput.focus();
});

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

initTheme();
renderEmptyState();
