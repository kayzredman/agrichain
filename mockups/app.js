const groups = [
  ["Overview", [["dashboard", "Today"]]],
  ["Set up", [["enroll", "Enroll"], ["parcel", "Parcel"]]],
  ["Record a lot", [
    ["harvest", "Harvest"],
    ["merge", "Merge"],
    ["transfer", "Transfer"],
    ["load", "Load"],
    ["accept", "Accept"],
    ["process", "Process"],
    ["pack", "Pack"],
  ]],
  ["Read", [["public", "Public claim"], ["buyer", "Buyer"], ["authority", "Authority"]]],
  ["Trust", [["audit", "Audit"], ["countersign", "Second signatures"], ["verify", "Verify"]]],
];

/* Who the top bar says you are. Every screen belongs to one organization,
   and the header has to agree with the role chip on the screen. */
const coop = ["Coopérative de Bondoukou", "Coop · Côte d’Ivoire · key v1"];
const plant = ["Saigon Kernel Plant", "Processor · Vietnam · key v2"];
const signedInAs = {
  dashboard: coop,
  enroll: coop, parcel: coop, harvest: coop, merge: coop, transfer: coop, load: coop,
  accept: plant, process: plant, pack: plant,
  public: ["Not signed in", "Anyone with the code on the bag"],
  buyer: ["Rotterdam Nut Traders", "Buyer · Netherlands · key v1"],
  authority: ["Conseil Coton-Anacarde", "Origin authority · Côte d’Ivoire · key v1"],
  audit: ["A. Mensah", "Auditor · origin authority desk · key v1"],
  countersign: ["Conseil Coton-Anacarde", "Origin authority · Côte d’Ivoire · key v1"],
  verify: coop,
};

const rail = document.getElementById("rail");
const step = document.getElementById("step");
const main = document.getElementById("main");

let lotStep = 0;

groups.forEach(([title, items]) => {
  const section = document.createElement("section");
  section.className = "rail-group";

  const heading = document.createElement("h2");
  heading.textContent = title;
  section.appendChild(heading);

  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", title);

  const optgroup = document.createElement("optgroup");
  optgroup.label = title;

  items.forEach(([id, label]) => {
    const numbered = title === "Set up" || title === "Record a lot";
    const idx = numbered ? String(++lotStep) : "";

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.goto = id;
    button.innerHTML = `<span class="idx" aria-hidden="true">${idx}</span>`;
    button.append(label);
    button.addEventListener("click", () => show(id));
    nav.appendChild(button);

    const option = document.createElement("option");
    option.value = id;
    option.textContent = idx ? `${idx}. ${label}` : label;
    optgroup.appendChild(option);
  });

  section.appendChild(nav);
  rail.appendChild(section);
  step.appendChild(optgroup);
});

step.addEventListener("change", () => show(step.value));

function show(id) {
  if (!document.querySelector(`[data-screen="${id}"]`)) id = "dashboard";
  document.querySelectorAll("[data-screen]").forEach((screen) => {
    screen.hidden = screen.dataset.screen !== id;
  });
  document.querySelectorAll("[data-goto]").forEach((button) => {
    if (button.dataset.goto === id) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  step.value = id;

  const [org, meta] = signedInAs[id];
  const whoami = document.querySelector(".whoami");
  whoami.querySelector("b").textContent = org;
  whoami.querySelector("span").textContent = meta;
  document.getElementById("ledger-state").hidden = id === "public";

  if (location.hash.slice(1) !== id) location.hash = id;

  // Focus moves for the screen reader, but the sticky bar would otherwise
  // sit over the heading, so the scroll is done here instead.
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

window.addEventListener("hashchange", () => show(location.hash.slice(1)));

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

document.querySelectorAll(".panel > table").forEach((table) => {
  const box = document.createElement("div");
  box.className = "scroller";
  box.tabIndex = 0;
  box.setAttribute("role", "region");
  box.setAttribute("aria-label", table.closest(".panel").querySelector("h2").textContent.trim());
  table.replaceWith(box);
  box.appendChild(table);
});

/* ---------------------------------------------------------------
   Activity flow
   The motion stands for one thing only: a signed event leaving the
   stage that held the lot and arriving at the stage that now does.
   --------------------------------------------------------------- */

const stages = [
  ["Parcel", "Coop", 12],
  ["Harvest", "Coop", 38],
  ["Merge", "Coop", 21],
  ["Transfer", "Coop", 17],
  ["Load", "Carrier", 15],
  ["Accept", "Plant", 13],
  ["Process", "Plant", 11],
  ["Pack", "Plant", 9],
  ["Claim", "Buyer", 9],
];

/* stage, event, lot, signer, detail, disposition.
   The disposition is the whole point of the column: most events advance on
   their own, a few stop to be looked at, and none of them are held back
   from the record while that is decided. */
const script = [
  [1, "Harvest", "H-1207", "Coopérative de Bondoukou", "1,840 kg from parcel BD-04", "clear"],
  [2, "Merge", "M-0462", "Coopérative de Bondoukou", "6 harvests, 11,300 kg", "clear"],
  [3, "Transfer", "M-0462", "Coopérative de Bondoukou", "named Saigon Kernel Plant as receiver", "clear"],
  [4, "Load", "M-0462", "MV Sassandra", "Abidjan to Ho Chi Minh City, seal 88204", "clear"],
  [5, "Accept", "M-0462", "Saigon Kernel Plant", "11,240 kg in, 0.5% under the transfer", "clear"],
  [6, "Process", "K-0462", "Saigon Kernel Plant", "2,520 kg kernel, 22.4% yield", "clear"],
  [7, "Pack", "K-0462B", "Saigon Kernel Plant", "100 × 22.68 kg, expiry 14 Oct 2027", "clear"],
  [8, "Claim", "K-0462B", "Public code", "AC-9Q4-7T2 published", "clear"],
  [1, "Harvest", "H-1208", "Coopérative de Bondoukou", "2,110 kg from parcel BD-09", "clear"],
  [2, "Merge", "M-0463", "Coopérative de Bondoukou", "4 harvests, 7,900 kg", "clear"],
  [3, "Transfer", "M-0463", "Coopérative de Bondoukou", "named Saigon Kernel Plant as receiver", "clear"],
  [5, "Accept", "M-0461", "Saigon Kernel Plant", "9,980 kg in, 4.1% under the transfer", "alert"],
];

const dispositions = {
  clear: ["clear", "Advanced"],
  alert: ["alert", "Alert"],
  waiting: ["waiting", "Awaiting countersign"],
};

const flow = document.getElementById("flow");
const feed = document.getElementById("feed");
const toggle = document.getElementById("flow-toggle");
const kpiFlight = document.getElementById("kpi-flight");
const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

const nodes = stages.map(([name, role, count]) => {
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.innerHTML = `
    <span class="stage-node" aria-hidden="true"></span>
    <span class="stage-count">${count}</span>
    <span class="stage-name">${name}</span>
    <span class="stage-role">${role}</span>`;
  flow.appendChild(stage);
  return stage;
});

const pip = document.createElement("span");
pip.className = "pip";
pip.style.opacity = "0";
flow.appendChild(pip);

let cursor = 0;
let running = true;
let timer = null;

function centre(stage) {
  const node = stage.querySelector(".stage-node");
  return node.getBoundingClientRect().left - flow.getBoundingClientRect().left
    + flow.scrollLeft + node.offsetWidth / 2;
}

function land(index, label, lot, who, detail, disposition) {
  const stage = nodes[index];
  const countEl = stage.querySelector(".stage-count");
  countEl.textContent = Number(countEl.textContent.replace(/\D/g, "")) + 1;

  stage.classList.remove("is-hot");
  void stage.offsetWidth;
  stage.classList.add("is-hot");
  setTimeout(() => stage.classList.remove("is-hot"), 1400);

  if (index === 1) kpiFlight.textContent = Number(kpiFlight.textContent) + 1;
  if (index === 8) kpiFlight.textContent = Math.max(0, Number(kpiFlight.textContent) - 1);

  const now = new Date();
  const row = document.createElement("li");
  row.className = "is-new";
  const hhmmss = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, "0")).join(":");
  const [tone, verdict] = dispositions[disposition];
  row.innerHTML = `
    <time>${hhmmss}</time>
    <span class="kind">${label}</span>
    <span class="code">${lot}</span>
    <span class="what">${detail}</span>
    <span class="who">${who}</span>
    <span class="status ${tone}">${verdict}</span>`;
  row.addEventListener("animationend", () => row.classList.remove("is-new"), { once: true });
  feed.prepend(row);
  while (feed.children.length > 7) feed.lastElementChild.remove();

  if (disposition === "alert") {
    const alerts = document.getElementById("kpi-alerts");
    alerts.textContent = Number(alerts.textContent) + 1;
    stage.classList.add("is-flagged");
    setTimeout(() => stage.classList.remove("is-flagged"), 1400);
  }
}

function tick() {
  const [index, label, lot, who, detail, disposition] = script[cursor % script.length];
  cursor += 1;

  if (calm.matches) {
    land(index, label, lot, who, detail, disposition);
    return;
  }

  const from = centre(nodes[index - 1]);
  const to = centre(nodes[index]);

  pip.style.opacity = "1";
  pip.classList.toggle("is-alert", disposition === "alert");
  const travel = pip.animate(
    [
      { transform: `translateX(${from - 7}px) scale(0.7)`, opacity: 0 },
      { transform: `translateX(${from - 7}px) scale(1)`, opacity: 1, offset: 0.12 },
      { transform: `translateX(${to - 7}px) scale(1)`, opacity: 1, offset: 0.88 },
      { transform: `translateX(${to - 7}px) scale(0.7)`, opacity: 0 },
    ],
    { duration: 900, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
  );

  travel.onfinish = () => {
    pip.style.opacity = "0";
    land(index, label, lot, who, detail, disposition);
  };
}

function schedule() {
  clearTimeout(timer);
  if (!running) return;
  timer = setTimeout(() => {
    tick();
    schedule();
  }, 2600);
}

toggle.addEventListener("click", () => {
  running = !running;
  toggle.textContent = running ? "Pause" : "Resume";
  toggle.setAttribute("aria-pressed", String(running));
  if (running) schedule();
  else clearTimeout(timer);
});

tick();
schedule();

show(location.hash.slice(1) || "dashboard");
