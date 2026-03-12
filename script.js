const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

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
    item.remove();
    renderEmptyState();
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

renderEmptyState();
