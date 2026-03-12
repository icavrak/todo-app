/**
 * Todo page script.
 * Runs after auth-guard.js confirms authentication.
 * Preserves original todo/theme UX.
 */
(function () {
  "use strict";

  const todoForm = document.getElementById("todo-form");
  const todoInput = document.getElementById("todo-input");
  const todoList = document.getElementById("todo-list");
  const logoutBtn = document.getElementById("logout-btn");
  const userDisplayName = document.getElementById("user-display-name");

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
    if (emptyState) emptyState.remove();
  }

  function createTodoItem(text) {
    const item = document.createElement("li");
    item.className = "todo-item";

    const leftGroup = document.createElement("div");
    leftGroup.className = "todo-left";

    const completeCheckbox = document.createElement("input");
    completeCheckbox.type = "checkbox";
    completeCheckbox.className = "complete-checkbox";
    completeCheckbox.setAttribute("aria-label", `Mark "${text}" as completed`);

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
      item.addEventListener(
        "animationend",
        () => {
          item.remove();
          renderEmptyState();
        },
        { once: true }
      );
    });

    leftGroup.append(completeCheckbox, label);
    item.append(leftGroup, deleteButton);
    return item;
  }

  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    clearEmptyState();
    todoList.appendChild(createTodoItem(text));
    todoInput.value = "";
    todoInput.focus();
  });

  // Populate display name once auth is confirmed
  document.addEventListener("auth:ready", (e) => {
    if (userDisplayName) {
      userDisplayName.textContent = e.detail.displayName || e.detail.email;
    }
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      try {
        await window.api.post("/api/logout");
      } catch {
        // Redirect regardless
      }
      window.location.href = "/login.html";
    });
  }

  renderEmptyState();
})();
