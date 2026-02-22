/*******************************
 * Calendar.js
 * - click a day to add event
 * - + Create Event opens modal with date picker
 * - events saved as {id,title,date,time,category}
 * - delete and edit events from day or upcoming list
 * - search by exact date (type=date)
 * - shows errors in modal instead of alerts
 * - modal shakes on error
 *******************************/

const monthYearEl = document.querySelector(".month-year");
const calendarGrid = document.querySelector(".calendar-grid");
const prevMonthBtn = document.querySelector(".prev-month");
const nextMonthBtn = document.querySelector(".next-month");
const todayBtn = document.querySelector(".today-btn");
const createEventBtn = document.querySelector(".create-event-btn");
const modalOverlay = document.querySelector(".modal-overlay");

const saveBtn = document.querySelector(".save-btn");
const cancelBtn = document.querySelector(".cancel-btn");

const eventTitleInput = document.querySelector(".event-title-input");
const eventDateInput = document.querySelector(".event-date-input");
const eventTimeFrom = document.querySelector(".event-time-from");
const eventTimeTo = document.querySelector(".event-time-to");
const noTimeBtn = document.getElementById("noTimeBtn");
let noTimeSelected = false;
const errorMessageEl = document.querySelector(".error-message");

const eventsListEl = document.querySelector(".events-list");
const searchDateInput = document.querySelector(".search-date");
const searchBtn = document.querySelector(".search-btn");

// state
let today = new Date();
let viewMonth = today.getMonth();
let viewYear = today.getFullYear();
let events = JSON.parse(localStorage.getItem("appdateEvents")) || [];
let deleteTargetId = null;

const months = [
  "January","February","March","April","May","June","July",
  "August","September","October","November","December"
];

// UTILS
function isoDateFromParts(y, m0, d) {
  return `${y}-${String(m0+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function parseISO(iso) {
  const parts = iso.split("-");
  return { y: Number(parts[0]), m0: Number(parts[1]) - 1, d: Number(parts[2]) };
}
function saveEvents() {
  localStorage.setItem("appdateEvents", JSON.stringify(events));
}

// SHAKE FUNCTION
function triggerShake() {
  modalOverlay.classList.add("shake");
  setTimeout(() => modalOverlay.classList.remove("shake"), 400);
}

// ------------------------------
// Modal Carousel for Event Type
// ------------------------------
const categories = [
  "School Event",
  "Holiday",
  "School Activity",
  "School Homework",
  "Personal Activity"
];

// Map each category to a color
const categoryColors = {
  "Holiday": "#5C0505",
  "School Event": "#052C60",
  "School Activity": "#F0AA00",
  "School Homework": "#054C05",
  "Personal Activity": "#3A055C"
};

let categoryIndex = 0;

const categoryBtn = document.getElementById("categoryBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const modalTitle = document.getElementById("modal-title");

function updateCategory() {
  if (categoryBtn) categoryBtn.textContent = categories[categoryIndex];
  categoryBtn.style.backgroundColor = categoryColors[categories[categoryIndex]]; // visible color
}

// Click left button
leftBtn?.addEventListener("click", () => {
  categoryIndex--;
  if (categoryIndex < 0) categoryIndex = categories.length - 1;
  updateCategory();
});

// Click right button
rightBtn?.addEventListener("click", () => {
  categoryIndex++;
  if (categoryIndex >= categories.length) categoryIndex = 0;
  updateCategory();
});

// Initialize carousel on modal open
updateCategory();

// **No Time Button Logic**
noTimeBtn?.addEventListener("click", () => {
  noTimeSelected = !noTimeSelected;

  if (noTimeSelected) {
    // Clear and disable time inputs
    eventTimeFrom.value = "";
    eventTimeTo.value = "";
    eventTimeFrom.disabled = true;
    eventTimeTo.disabled = true;
    noTimeBtn.textContent = "With Time";
  } else {
    // Enable time inputs
    eventTimeFrom.disabled = false;
    eventTimeTo.disabled = false;
    noTimeBtn.textContent = "No Time";
  }
});

// OPEN / CLOSE MODAL
function openModalForDate(isoDate) {
  modalOverlay.classList.remove("hidden");
  if(modalTitle) modalTitle.textContent = "Add Event";
  eventDateInput.value = isoDate;
  eventTitleInput.value = "";
  eventTimeFrom.value = "";
  eventTimeTo.value = "";
  errorMessageEl.textContent = "";
  categoryIndex = 0;
  updateCategory();
  noTimeSelected = false;
  eventTimeFrom.disabled = false;
  eventTimeTo.disabled = false;
  if(noTimeBtn) noTimeBtn.textContent = "No Time";
  saveBtn.onclick = saveEventFromModal;
}

function openModalCreate() {
  modalOverlay.classList.remove("hidden");
  const iso = isoDateFromParts(today.getFullYear(), today.getMonth(), today.getDate());
  eventDateInput.value = iso;
  eventTitleInput.value = "";
  eventTimeFrom.value = "";
  eventTimeTo.value = "";
  errorMessageEl.textContent = "";
  categoryIndex = 0;
  updateCategory();
  noTimeSelected = false;
  eventTimeFrom.disabled = false;
  eventTimeTo.disabled = false;
  if(noTimeBtn) noTimeBtn.textContent = "No Time";
  saveBtn.onclick = saveEventFromModal;
}

// Open modal for editing existing event
function openModalForEdit(ev) {
  modalOverlay.classList.remove("hidden");
  if(modalTitle) modalTitle.textContent = "Edit Event";
  eventTitleInput.value = ev.title;
  eventDateInput.value = ev.date;
  if(ev.time) {
    const parts = ev.time.split(" - ");
    eventTimeFrom.value = parts[0];
    eventTimeTo.value = parts[1];
    noTimeSelected = false;
    eventTimeFrom.disabled = false;
    eventTimeTo.disabled = false;
    if(noTimeBtn) noTimeBtn.textContent = "No Time";
  } else {
    eventTimeFrom.value = "";
    eventTimeTo.value = "";
    noTimeSelected = true;
    eventTimeFrom.disabled = true;
    eventTimeTo.disabled = true;
    if(noTimeBtn) noTimeBtn.textContent = "With Time";
  }
  errorMessageEl.textContent = "";
  categoryIndex = categories.indexOf(ev.category);
  updateCategory();
  saveBtn.onclick = () => saveEventEdit(ev.id);
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  eventTitleInput.value = "";
  eventDateInput.value = "";
  eventTimeFrom.value = "";
  eventTimeTo.value = "";
  errorMessageEl.textContent = "";
  saveBtn.onclick = null;
}

// SAVE EVENT
function saveEventFromModal() {
  const title = eventTitleInput.value.trim();
  const dateVal = eventDateInput.value;
  const from = eventTimeFrom.value;
  const to = eventTimeTo.value;

  if (!title) { errorMessageEl.textContent = "Please add a title!"; triggerShake(); return; }
  if (!dateVal) { errorMessageEl.textContent = "Please select a date!"; triggerShake(); return; }
  let timeValue = noTimeSelected ? "" : `${from} - ${to}`;
  if (!noTimeSelected && (!from || !to)) { errorMessageEl.textContent = "Please enter time range or select No Time!"; triggerShake(); return; }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);

  events.push({
    id,
    title,
    date: dateVal,
    time: timeValue,
    category: categories[categoryIndex]
  });

  saveEvents();
  closeModal();

  const { y, m0 } = parseISO(dateVal);
  if (y === viewYear && m0 === viewMonth) renderCalendar();
  else { viewYear = y; viewMonth = m0; renderCalendar(); }
}

// SAVE EDITED EVENT
function saveEventEdit(id) {
  const title = eventTitleInput.value.trim();
  const dateVal = eventDateInput.value;
  const from = eventTimeFrom.value;
  const to = eventTimeTo.value;

  if (!title) { errorMessageEl.textContent = "Please add a title!"; triggerShake(); return; }
  if (!dateVal) { errorMessageEl.textContent = "Please select a date!"; triggerShake(); return; }
  let timeValue = noTimeSelected ? "" : `${from} - ${to}`;
  if (!noTimeSelected && (!from || !to)) { errorMessageEl.textContent = "Please enter time range or select No Time!"; triggerShake(); return; }

  const idx = events.findIndex(e => e.id === id);
  if (idx !== -1) {
    events[idx] = { id, title, date: dateVal, time: timeValue, category: categories[categoryIndex] };
    saveEvents();
    closeModal();

    const { y, m0 } = parseISO(dateVal);
    if (y === viewYear && m0 === viewMonth) renderCalendar();
    else { viewYear = y; viewMonth = m0; renderCalendar(); }
  }
}

// DELETE
function deleteEventById(id) {
  deleteTargetId = id;
  const deleteModal = document.getElementById("delete-modal");
  deleteModal.classList.remove("hidden");
}

const deleteCancel = document.getElementById("delete-cancel");
const deleteConfirm = document.getElementById("delete-confirm");
const deleteModal = document.getElementById("delete-modal");

deleteCancel.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
  deleteTargetId = null;
});

deleteConfirm.addEventListener("click", () => {
  if (deleteTargetId) {
    const idx = events.findIndex(e => e.id === deleteTargetId);
    if (idx !== -1) events.splice(idx, 1);
    saveEvents();
    renderCalendar();
  }
  deleteModal.classList.add("hidden");
  deleteTargetId = null;
});

deleteModal.addEventListener("click", e => {
  if (e.target === deleteModal) {
    deleteModal.classList.add("hidden");
    deleteTargetId = null;
  }
});

// RENDER
function renderCalendar() {
  monthYearEl.textContent = `${months[viewMonth]} ${viewYear}`;
  calendarGrid.innerHTML = "";

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevLastDate = new Date(viewYear, viewMonth, 0).getDate();

  // prev month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevLastDate - i;
    const cell = document.createElement("div");
    cell.className = "day prev-month";
    cell.innerHTML = `<span class="day-number">${d}</span>`;
    calendarGrid.appendChild(cell);
  }

  // current month days
  for (let d = 1; d <= lastDate; d++) {
    const cell = document.createElement("div");
    cell.className = "day";
    cell.dataset.day = d;
    cell.innerHTML = `<div class="day-number">${d}</div><div class="day-events"></div>`;

    if (d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()) {
      cell.classList.add("today");
    }

    const iso = isoDateFromParts(viewYear, viewMonth, d);
    const dayEvents = events.filter(ev => ev.date === iso);
    const container = cell.querySelector(".day-events");

    dayEvents.forEach(ev => {
      const evEl = document.createElement("div");
      evEl.className = "ev-item";
      evEl.style.backgroundColor = categoryColors[ev.category] || "#052C60"; // category color

      const btnContainer = document.createElement("div");
      btnContainer.style.display = "flex";
      btnContainer.style.flexDirection = "column";
      btnContainer.style.gap = "4px";

      const editBtn = document.createElement("button");
      editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
      editBtn.style.background = "transparent";
      editBtn.style.border = "none";
      editBtn.style.color = "#fff";
      editBtn.style.cursor = "pointer";
      editBtn.title = "Edit";
      editBtn.addEventListener("click", (e) => { e.stopPropagation(); openModalForEdit(ev); });

      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      deleteBtn.style.background = "transparent";
      deleteBtn.style.border = "none";
      deleteBtn.style.color = "#fff";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.title = "Delete";
      deleteBtn.addEventListener("click", (e) => { e.stopPropagation(); deleteEventById(ev.id); });

      btnContainer.appendChild(editBtn);
      btnContainer.appendChild(deleteBtn);

      // **move buttons after the content to stay on right**
      evEl.innerHTML += `
        <div class="ev-left">
          <span class="ev-title">${ev.title}</span>
          <div class="ev-time">${ev.time ? formatTime12h(ev.time.split(" - ")[0]) + " - " + formatTime12h(ev.time.split(" - ")[1]) : "Time not Included"}</div>
        </div>
      `;
      evEl.appendChild(btnContainer);

      container.appendChild(evEl);

      evEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const targetEventEl = Array.from(eventsListEl.querySelectorAll(".event"))
          .find(el => el.querySelector(".event-date").textContent.includes(ev.date)
                    && el.querySelector("strong").textContent === ev.title);
        if (targetEventEl) {
          targetEventEl.scrollIntoView({ behavior: "smooth", block: "center" });
          const origColor = categoryColors[ev.category] || "#052C60";
          targetEventEl.style.transition = "transform 0.2s, background-color 0.3s";
          targetEventEl.style.transform = "translateY(-5px)";
          targetEventEl.style.backgroundColor = "#1A73E8"; // temporary highlight
          setTimeout(() => { targetEventEl.style.transform = ""; targetEventEl.style.backgroundColor = origColor; }, 300);
        }
      });
    });

    cell.addEventListener("click", (e) => { if (!e.target.closest(".ev-item")) openModalForDate(iso); });
    calendarGrid.appendChild(cell);
  }

  const totalRendered = calendarGrid.querySelectorAll(".day").length;
  const toRender = 42 - totalRendered;
  for (let j = 1; j <= toRender; j++) {
    const cell = document.createElement("div");
    cell.className = "day next-month";
    cell.innerHTML = `<span class="day-number">${j}</span>`;
    calendarGrid.appendChild(cell);
  }

  renderUpcomingEvents();
}

// UPCOMING EVENTS
function renderUpcomingEvents() {
  eventsListEl.innerHTML = "";

  const validEvents = events.filter(ev => ev.title && ev.date);

  if (!validEvents.length) {
    const placeholder = document.createElement("div");
    placeholder.textContent = "No upcoming events.";
    placeholder.style.color = "#444";
    eventsListEl.appendChild(placeholder);
    return;
  }

  const sorted = validEvents.slice().sort((a, b) => {
    if (a.date === b.date) return (a.time || "").localeCompare(b.time || "");
    return a.date.localeCompare(b.date);
  });

  sorted.forEach(ev => {
    const el = document.createElement("div");
    el.className = "event";
    el.style.backgroundColor = categoryColors[ev.category] || "#052C60"; // category color

    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.flexDirection = "column";
    btnContainer.style.gap = "4px";

    const editBtn = document.createElement("button");
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    editBtn.style.background = "transparent";
    editBtn.style.border = "none";
    editBtn.style.color = "#fff";
    editBtn.style.cursor = "pointer";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", () => openModalForEdit(ev));

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.style.background = "transparent";
    deleteBtn.style.border = "none";
    deleteBtn.style.color = "#fff";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.title = "Delete";
    deleteBtn.addEventListener("click", () => deleteEventById(ev.id));

    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(deleteBtn);

    el.innerHTML += `
      <div class="left">
        <strong>${ev.title}</strong>
        <div class="event-type">Type: ${ev.category}</div>
        <div class="event-date">Date: ${ev.date}</div>
        <div class="event-time">Time: ${ev.time ? formatTime12h(ev.time.split(" - ")[0]) + " - " + formatTime12h(ev.time.split(" - ")[1]) : "Time not Included"}</div>
      </div>
    `;
    el.appendChild(btnContainer);

    eventsListEl.appendChild(el);
  });

  // Bind notes modal opening after rendering
  enableNotesFromEventList();
}

// time format
function formatTime12h(time24) {
  if (!time24) return "";
  let [hour, minute] = time24.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

// NAVIGATION
prevMonthBtn.addEventListener("click", () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } renderCalendar(); });
nextMonthBtn.addEventListener("click", () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } renderCalendar(); });
todayBtn.addEventListener("click", () => { viewMonth = today.getMonth(); viewYear = today.getFullYear(); renderCalendar(); });

createEventBtn.addEventListener("click", openModalCreate);
cancelBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

// SEARCH / JUMP TO DATE
searchBtn.addEventListener("click", () => {
  const val = searchDateInput.value;
  if (!val) { errorMessageEl.textContent = "Select a date to go to."; return; }
  const { y, m0, d } = parseISO(val);
  viewYear = y; viewMonth = m0;
  renderCalendar();

  setTimeout(() => {
    const dayEls = Array.from(calendarGrid.querySelectorAll(".day"))
      .filter(el => !el.classList.contains("prev-month") && !el.classList.contains("next-month"));
    const target = dayEls.find(el => Number(el.dataset.day) === d);
    if (target) {
      target.classList.add("search-highlight");
      target.scrollIntoView({behavior:"smooth", block:"center"});
      setTimeout(()=> target.classList.remove("search-highlight"), 1800);
    } else { errorMessageEl.textContent = "The selected day is not visible in this month view."; }
  }, 40);
});

// INIT
renderCalendar();

// ==================== Notes Editor Integration ====================
const notesModal = document.getElementById("notes-modal");
const notesClose = notesModal.querySelector(".notes-close");
const notesTitle = notesModal.querySelector(".notes-title");
const notesDateVal = notesModal.querySelector(".notes-date-val");
const notesTypeVal = notesModal.querySelector(".notes-type-val");
const editorArea = notesModal.querySelector(".editor-area");
const notesSaveBtn = notesModal.querySelector("#notes-save");
const lastEditedEl = notesModal.querySelector(".last-edited-val");

const headingSelect = notesModal.querySelector("#heading-select");
const fontColorInput = notesModal.querySelector("#font-color");
const highlightColorInput = notesModal.querySelector("#highlight-color");
const insertImageBtn = notesModal.querySelector("#insert-image-btn");
const imageInput = notesModal.querySelector("#image-input");
const addCheckboxBtn = notesModal.querySelector("#add-checkbox");

const toolbarButtons = document.querySelectorAll(".editor-toolbar [data-cmd]");

// State
let currentNoteEventId = null;
let autosaveTimer = null;
highlightColorInput.value = "#ffffff";

// ==================== Functions ====================
function openNotesModal(ev) {
  notesModal.classList.remove("hidden");
  notesTitle.textContent = ev.title || "Event Notes";
  notesDateVal.textContent = ev.date || "-";
  notesTypeVal.textContent = ev.category || "-";
  editorArea.innerHTML = ev.notes || "<p><br></p>";
  currentNoteEventId = ev.id;
  updateLastEdited(ev);
  editorArea.focus();
  makeImagesDraggable();
}

function saveNotesNow() {
  if (!currentNoteEventId) return;
  const idx = events.findIndex(e => e.id === currentNoteEventId);
  if (idx === -1) return;
  events[idx].notes = editorArea.innerHTML;
  events[idx].notesLastEdited = new Date().toISOString();
  saveEvents();
  updateLastEdited(events[idx]);
  renderCalendar();
}

function scheduleAutoSave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(saveNotesNow, 1000);
}

function updateLastEdited(ev) {
  lastEditedEl.textContent = ev && ev.notesLastEdited
    ? new Date(ev.notesLastEdited).toLocaleString()
    : "—";
}

function insertHTMLAtCursor(html) {
  editorArea.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) {
    editorArea.insertAdjacentHTML('beforeend', html);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const frag = range.createContextualFragment(html);
  range.insertNode(frag);
  range.setStartAfter(frag.lastChild || frag);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  scheduleAutoSave();
}

// ==================== Toolbar Buttons ====================
toolbarButtons.forEach(btn => {
  const cmd = btn.dataset.cmd;
  btn.addEventListener("click", () => {
    document.execCommand(cmd, false, null);
    btn.classList.toggle("active", document.queryCommandState(cmd));
    editorArea.focus();
  });
});

editorArea.addEventListener("keyup", updateToolbarState);
editorArea.addEventListener("mouseup", updateToolbarState);
function updateToolbarState() {
  toolbarButtons.forEach(btn => {
    const cmd = btn.dataset.cmd;
    btn.classList.toggle("active", document.queryCommandState(cmd));
  });
  scheduleAutoSave();
}

// ==================== Keyboard Shortcuts ====================
editorArea.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case "b": e.preventDefault(); document.execCommand("bold"); break;
      case "i": e.preventDefault(); document.execCommand("italic"); break;
      case "u": e.preventDefault(); document.execCommand("underline"); break;
      case "x": e.preventDefault(); document.execCommand("strikeThrough"); break;
    }
    updateToolbarState();
  }
});

// ==================== Heading & Colors ====================
headingSelect.addEventListener("change", () => {
  const val = headingSelect.value;
  document.execCommand("formatBlock", false, val === "p" ? "P" : val.toUpperCase());
  editorArea.focus();
});

fontColorInput.addEventListener("input", () => {
  document.execCommand("foreColor", false, fontColorInput.value);
  editorArea.focus();
});

highlightColorInput.addEventListener("input", () => {
  const val = highlightColorInput.value;
  document.execCommand("hiliteColor", false, val === "none" ? "transparent" : val);
  editorArea.focus();
});

// ==================== Images & Checkboxes ====================
insertImageBtn.addEventListener("click", () => imageInput.click());

// Insert image on file select
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    // Wrap image in a draggable/resizable div
    const wrapper = document.createElement("div");
    wrapper.contentEditable = "false"; // prevent breaking editor
    wrapper.style.display = "inline-block";
    wrapper.style.position = "relative";
    wrapper.style.resize = "both";
    wrapper.style.overflow = "hidden";
    wrapper.style.cursor = "move";
    wrapper.style.border = "1px dashed #888"; // optional visual border
    wrapper.style.maxWidth = "100%";

    const img = document.createElement("img");
    img.src = evt.target.result;
    img.style.width = "100%";
    img.style.height = "auto";
    wrapper.appendChild(img);

    insertNodeAtCursor(wrapper); // insert as DOM node

    makeImagesDraggable(); // enable drag for new wrapper
  };
  reader.readAsDataURL(file);
  imageInput.value = "";
});

// Insert DOM node at cursor
function insertNodeAtCursor(node) {
  editorArea.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) {
    editorArea.appendChild(node);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  scheduleAutoSave();
}

// Make all image wrappers draggable
function makeImagesDraggable() {
  const wrappers = editorArea.querySelectorAll('div[contenteditable="false"]');
  wrappers.forEach(wrapper => {
    wrapper.onmousedown = function(e) {
      e.preventDefault();
      let shiftX = e.clientX - wrapper.getBoundingClientRect().left;
      let shiftY = e.clientY - wrapper.getBoundingClientRect().top;

      wrapper.style.position = "absolute";
      wrapper.style.zIndex = 1000;

      function moveAt(pageX, pageY) {
        const rect = editorArea.getBoundingClientRect();
        wrapper.style.left = pageX - shiftX - rect.left + "px";
        wrapper.style.top = pageY - shiftY - rect.top + "px";
      }

      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.onmouseup = function() {
        document.removeEventListener("mousemove", onMouseMove);
        document.onmouseup = null;
      };
    };
    wrapper.ondragstart = () => false;
  });
} 

addCheckboxBtn.addEventListener("click", () => {
  insertHTMLAtCursor(`<div class="check-item"><input type="checkbox"><span contenteditable="true"></span></div><div><br></div>`);
});

// ==================== Draggable & Resizable Images ====================
function makeImagesDraggable() {
  const imgs = editorArea.querySelectorAll("img");
  imgs.forEach(img => {
    img.classList.add("draggable");
    img.style.position = "relative";
    img.style.cursor = "move";
    img.style.maxWidth = "100%";

    img.onmousedown = null;

    img.onmousedown = function(e) {
      e.preventDefault();
      let shiftX = e.clientX - img.getBoundingClientRect().left;
      let shiftY = e.clientY - img.getBoundingClientRect().top;

      img.style.position = "absolute";
      img.style.zIndex = 1000;

      function moveAt(pageX, pageY) {
        const rect = editorArea.getBoundingClientRect();
        img.style.left = pageX - shiftX - rect.left + "px";
        img.style.top = pageY - shiftY - rect.top + "px";
      }

      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
      }

      document.addEventListener("mousemove", onMouseMove);

      document.onmouseup = function() {
        document.removeEventListener("mousemove", onMouseMove);
        document.onmouseup = null;
      };
    };

    img.ondragstart = function() { return false; };
    img.style.resize = "both";
    img.style.overflow = "hidden";
  });
}

// ==================== Open Notes Modal from Event List ====================
function enableNotesFromEventList() {
  const eventEls = document.querySelectorAll(".event");
  eventEls.forEach(el => {
    const title = el.querySelector("strong")?.textContent;
    const date = el.querySelector(".event-date")?.textContent.replace("Date: ", "");
    const ev = events.find(e => e.title === title && e.date === date);
    if (!ev) return;

    el.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openNotesModal(ev);
    });
  });
}

// ==================== Close & Save Notes ====================
notesClose.addEventListener("click", () => {
  notesModal.classList.add("hidden");
  currentNoteEventId = null;
});

notesSaveBtn.addEventListener("click", () => {
  saveNotesNow();
  notesModal.classList.add("hidden");
});

window.addEventListener("beforeunload", saveNotesNow);