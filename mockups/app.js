const order = [
  ["enroll", "1. Enroll"],
  ["parcel", "2. Parcel"],
  ["harvest", "3. Harvest"],
  ["merge", "4. Merge"],
  ["transfer", "5. Transfer"],
  ["load", "6. Load"],
  ["accept", "7. Accept"],
  ["process", "8. Process"],
  ["pack", "9. Pack"],
  ["public", "10. Public claim"],
  ["buyer", "11. Buyer"],
  ["authority", "12. Authority"],
  ["audit", "13. Audit"],
  ["verify", "14. Verify"],
];

const nav = document.getElementById("nav");
const step = document.getElementById("step");
const main = document.getElementById("main");

order.forEach(([id, label]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.goto = id;
  button.textContent = label;
  button.addEventListener("click", () => show(id));
  nav.appendChild(button);

  const option = document.createElement("option");
  option.value = id;
  option.textContent = label;
  step.appendChild(option);
});

step.addEventListener("change", () => show(step.value));

function show(id) {
  document.querySelectorAll("[data-screen]").forEach((screen) => {
    screen.hidden = screen.dataset.screen !== id;
  });
  document.querySelectorAll("[data-goto]").forEach((button) => {
    const current = button.dataset.goto === id;
    if (current) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  step.value = id;
  main.focus();
}

document.querySelectorAll("form[data-next]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const submit = form.querySelector("button.primary");
    if (submit.dataset.ready === "1") {
      show(form.dataset.next);
      return;
    }
    const note = form.querySelector("[data-result]");
    note.hidden = false;
    note.textContent = form.dataset.done;
    submit.dataset.ready = "1";
    submit.textContent = "Continue";
  });
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => show(button.dataset.jump));
});

show("enroll");
