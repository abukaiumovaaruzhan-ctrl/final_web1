"use strict";

/* SpinPoint Final Project
   Front-end demonstration only. Data is stored in this browser's localStorage.
   Do not use real passwords or sensitive personal information.
*/

const STORAGE_KEYS = {
  theme: "spinpoint-theme",
  users: "spinpoint-users",
  currentUser: "spinpoint-current-user",
  favorites: "spinpoint-favorites",
  bookings: "spinpoint-bookings"
};

const trainingSessions = [
  { id: 1, name: "Beginner Basics", day: "Monday", time: "17:00–18:00", level: "Beginner", type: "Group", price: 3500, coach: "Coach A" },
  { id: 2, name: "Control & Footwork", day: "Tuesday", time: "18:00–19:00", level: "Intermediate", type: "Group", price: 3500, coach: "Coach B" },
  { id: 3, name: "Advanced Match Play", day: "Wednesday", time: "19:00–20:30", level: "Advanced", type: "Group", price: 3500, coach: "Coach A" },
  { id: 4, name: "First Rally", day: "Thursday", time: "17:00–18:00", level: "Beginner", type: "Group", price: 3500, coach: "Coach C" },
  { id: 5, name: "Spin & Serve", day: "Friday", time: "18:00–19:00", level: "Intermediate", type: "Group", price: 3500, coach: "Coach B" },
  { id: 6, name: "Tournament Practice", day: "Saturday", time: "11:00–12:30", level: "Advanced", type: "Group", price: 3500, coach: "Coach A" },
  { id: 7, name: "Personal Coaching", day: "Saturday", time: "14:00–15:00", level: "Intermediate", type: "Individual", price: 7000, coach: "Coach C" },
  { id: 8, name: "Open Play", day: "Sunday", time: "12:00–14:00", level: "Beginner", type: "Group", price: 3500, coach: "Club team" }
];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key} from localStorage.`, error);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Could not save ${key} to localStorage.`, error);
    return false;
  }
}

function getCurrentUser() {
  return readJSON(STORAGE_KEYS.currentUser, null);
}

function getFavorites() {
  return readJSON(STORAGE_KEYS.favorites, []);
}

function getBookings() {
  return readJSON(STORAGE_KEYS.bookings, []);
}

function setMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

function setupTheme() {
  const buttons = document.querySelectorAll("[data-theme-toggle]");
  let theme = "light";

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === "dark" || saved === "light") theme = saved;
  } catch (error) {
    console.warn("Theme preference cannot be read.", error);
  }

  function applyTheme(nextTheme) {
    document.documentElement.dataset.theme = nextTheme;
    buttons.forEach(button => {
      const dark = nextTheme === "dark";
      button.textContent = dark ? "☀️ Light" : "🌙 Dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  applyTheme(theme);

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      try {
        localStorage.setItem(STORAGE_KEYS.theme, theme);
      } catch (error) {
        console.warn("Theme preference cannot be saved.", error);
      }
    });
  });
}

function setupNavigation() {
  const currentUser = getCurrentUser();
  document.querySelectorAll("[data-account-link]").forEach(link => {
    if (currentUser && currentUser.email) {
      link.textContent = "My profile";
      link.href = "account.html";
    } else {
      link.textContent = "Log in";
      link.href = "account.html";
    }
  });
}

function createSessionCard(session) {
  const column = document.createElement("div");
  column.className = "col-md-6 col-lg-4";

  const card = document.createElement("article");
  card.className = "session-card";

  const badge = document.createElement("span");
  badge.className = "level-tag";
  badge.textContent = session.level;

  const heading = document.createElement("h3");
  heading.className = "mt-3";
  heading.textContent = session.name;

  const details = document.createElement("p");
  details.className = "session-meta mb-2";
  details.textContent = `${session.day} · ${session.time}`;

  const coach = document.createElement("p");
  coach.className = "session-meta mb-0";
  coach.textContent = `Format: ${session.type} · ${session.coach}`;

  const price = document.createElement("p");
  price.className = "session-price";
  price.textContent = `${session.price.toLocaleString("en-US")} ₸`;

  const actions = document.createElement("div");
  actions.className = "session-actions";

  const bookingLink = document.createElement("a");
  bookingLink.className = "btn btn-outline-primary btn-sm";
  bookingLink.href = `join.html?session=${encodeURIComponent(session.name)}`;
  bookingLink.textContent = "Choose session";

  const favoriteButton = document.createElement("button");
  favoriteButton.type = "button";
  favoriteButton.className = "favorite-button";
  const isSaved = getFavorites().some(item => item.id === session.id);
  favoriteButton.setAttribute("aria-pressed", String(isSaved));
  favoriteButton.textContent = isSaved ? "♥ Saved" : "♡ Save";
  favoriteButton.setAttribute("aria-label", `${isSaved ? "Remove" : "Add"} ${session.name} ${isSaved ? "from" : "to"} favourites`);

  favoriteButton.addEventListener("click", () => {
    const favorites = getFavorites();
    const exists = favorites.some(item => item.id === session.id);
    const updated = exists
      ? favorites.filter(item => item.id !== session.id)
      : [...favorites, { id: session.id, name: session.name, day: session.day, time: session.time, level: session.level, price: session.price }];

    writeJSON(STORAGE_KEYS.favorites, updated);
    favoriteButton.setAttribute("aria-pressed", String(!exists));
    favoriteButton.textContent = exists ? "♡ Save" : "♥ Saved";
    favoriteButton.setAttribute("aria-label", `${exists ? "Add" : "Remove"} ${session.name} ${exists ? "to" : "from"} favourites`);
    updateFavoriteCount();
  });

  actions.append(bookingLink, favoriteButton);
  card.append(badge, heading, details, coach, price, actions);
  column.appendChild(card);
  return column;
}

function updateFavoriteCount() {
  const count = getFavorites().length;
  const output = document.getElementById("favoriteCount");
  if (output) output.textContent = String(count);
}

function renderSessions() {
  const list = document.getElementById("sessionList");
  if (!list) return;

  const search = (document.getElementById("sessionSearch")?.value || "").trim().toLowerCase();
  const level = document.getElementById("levelFilter")?.value || "all";

  const filtered = trainingSessions.filter(session => {
    const searchable = `${session.name} ${session.day} ${session.coach} ${session.level} ${session.type}`.toLowerCase();
    return searchable.includes(search) && (level === "all" || session.level === level);
  });

  list.replaceChildren(...filtered.map(createSessionCard));

  const count = document.getElementById("resultsCount");
  if (count) count.textContent = `Showing ${filtered.length} of ${trainingSessions.length} sessions`;

  const empty = document.getElementById("emptyState");
  if (empty) empty.classList.toggle("d-none", filtered.length !== 0);

  updateFavoriteCount();
}

function setupSessionFilters() {
  const search = document.getElementById("sessionSearch");
  const level = document.getElementById("levelFilter");
  const clear = document.getElementById("clearFilters");

  search?.addEventListener("input", renderSessions);
  level?.addEventListener("change", renderSessions);
  clear?.addEventListener("click", () => {
    if (search) search.value = "";
    if (level) level.value = "all";
    renderSessions();
  });

  renderSessions();
}

function updatePrice() {
  const quantityInput = document.getElementById("sessionCount");
  const typeInput = document.getElementById("sessionType");
  const totalOutput = document.getElementById("totalPrice");
  const errorOutput = document.getElementById("calculatorError");
  if (!quantityInput || !typeInput || !totalOutput) return;

  const quantity = Number(quantityInput.value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20 || quantityInput.value.trim() === "") {
    if (errorOutput) errorOutput.textContent = "Enter a whole number from 1 to 20.";
    totalOutput.textContent = "—";
    return;
  }

  if (errorOutput) errorOutput.textContent = "";
  totalOutput.textContent = `${(quantity * Number(typeInput.value)).toLocaleString("en-US")} ₸`;
}

function setupCalculator() {
  document.getElementById("sessionCount")?.addEventListener("input", updatePrice);
  document.getElementById("sessionType")?.addEventListener("change", updatePrice);
  updatePrice();
}

function validateInput(input, errorId) {
  const error = document.getElementById(errorId);
  const value = input.type === "checkbox" ? input.checked : input.value.trim();
  let message = "";

  if (input.required && !value) {
    message = input.type === "checkbox" ? "Please confirm this statement." : "This field is required.";
  } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    message = "Enter a valid email address.";
  } else if (input.type === "password" && value && value.length < 6) {
    message = "Password must contain at least 6 characters.";
  } else if ((input.id === "fullName" || input.id === "signupName") && value && (!/^[\p{L}\s'-]+$/u.test(value) || value.length < 2)) {
    message = "Enter a name with at least 2 letters.";
  } else if (input.id === "phone" && value && (!/^\+?[0-9\s()-]+$/.test(value) || value.replace(/\D/g, "").length < 7 || value.replace(/\D/g, "").length > 15)) {
    message = "Enter a valid phone number.";
  } else if (input.type === "date" && value) {
    const selected = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) message = "Choose today or a future date.";
  }

  input.classList.toggle("is-invalid", Boolean(message));
  input.classList.toggle("is-valid", !message && Boolean(value));
  input.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
  return !message;
}

function attachLiveValidation(form) {
  const fields = [...form.querySelectorAll("input[required], select[required]")];
  fields.forEach(field => {
    const errorId = `${field.id}Error`;
    field.addEventListener("blur", () => validateInput(field, errorId));
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) validateInput(field, errorId);
    });
    field.addEventListener("change", () => {
      if (field.classList.contains("is-invalid")) validateInput(field, errorId);
    });
  });
  return fields;
}

function setupBookingForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const fields = attachLiveValidation(form);
  const dateInput = document.getElementById("date");
  const success = document.getElementById("formSuccess");

  if (dateInput) {
    const today = new Date();
    dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  const params = new URLSearchParams(window.location.search);
  const selectedSession = params.get("session");
  const trainingSelect = document.getElementById("training");
  if (selectedSession && trainingSelect) {
    trainingSelect.value = selectedSession.toLowerCase().includes("personal") ? "Personal training" : "Group training";
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const valid = fields.map(field => validateInput(field, `${field.id}Error`)).every(Boolean);

    if (!valid) {
      const firstInvalid = form.querySelector(".is-invalid");
      firstInvalid?.focus();
      if (success) {
        success.classList.remove("d-none");
        success.className = "alert alert-danger mt-3";
        success.textContent = "Please correct the highlighted fields.";
      }
      return;
    }

    const booking = {
      id: `SP-${Date.now()}`,
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      phone: document.getElementById("phone").value.trim(),
      level: document.getElementById("level").value,
      training: document.getElementById("training").value,
      date: document.getElementById("date").value,
      message: document.getElementById("message").value.trim(),
      createdAt: new Date().toISOString()
    };

    const bookings = getBookings();
    bookings.push(booking);
    const saved = writeJSON(STORAGE_KEYS.bookings, bookings);

    if (success) {
      success.className = "success-message mt-3";
      success.classList.remove("d-none");
      success.textContent = saved
        ? `Thank you, ${booking.fullName}! Your demo booking has been saved. Open My account to view your booking history.`
        : "Your booking was checked, but browser storage is unavailable. Please try another browser.";
      success.focus();
    }

    if (saved) {
      form.reset();
      fields.forEach(field => {
        field.classList.remove("is-valid", "is-invalid");
        field.removeAttribute("aria-invalid");
        const error = document.getElementById(`${field.id}Error`);
        if (error) error.textContent = "";
      });
      if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
    }
  });
}

function setupAccountForms() {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  if (signupForm) {
    const fields = attachLiveValidation(signupForm);
    signupForm.addEventListener("submit", event => {
      event.preventDefault();
      const valid = fields.map(field => validateInput(field, `${field.id}Error`)).every(Boolean);
      const message = document.getElementById("signupMessage");
      if (!valid) {
        setMessage(message, "Please correct the highlighted fields.", "error");
        signupForm.querySelector(".is-invalid")?.focus();
        return;
      }

      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim().toLowerCase();
      const password = document.getElementById("signupPassword").value;
      const users = readJSON(STORAGE_KEYS.users, []);

      if (users.some(user => user.email === email)) {
        setMessage(message, "An account with this email already exists. Please log in.", "error");
        return;
      }

      users.push({ id: `U-${Date.now()}`, name, email, password });
      if (!writeJSON(STORAGE_KEYS.users, users)) {
        setMessage(message, "Could not save your account. Check browser storage settings.", "error");
        return;
      }

      writeJSON(STORAGE_KEYS.currentUser, { name, email });
      setMessage(message, "Account created successfully. Your profile is ready.", "success");
      signupForm.reset();
      showProfile();
      setupNavigation();
    });
  }

  if (loginForm) {
    const fields = attachLiveValidation(loginForm);
    loginForm.addEventListener("submit", event => {
      event.preventDefault();
      const valid = fields.map(field => validateInput(field, `${field.id}Error`)).every(Boolean);
      const message = document.getElementById("loginMessage");
      if (!valid) {
        setMessage(message, "Please complete the required fields.", "error");
        loginForm.querySelector(".is-invalid")?.focus();
        return;
      }

      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const password = document.getElementById("loginPassword").value;
      const users = readJSON(STORAGE_KEYS.users, []);
      const user = users.find(item => item.email === email && item.password === password);

      if (!user) {
        setMessage(message, "Incorrect email or password. Check your details or create an account.", "error");
        return;
      }

      writeJSON(STORAGE_KEYS.currentUser, { name: user.name, email: user.email });
      setMessage(message, "Login successful. Your profile is now open.", "success");
      loginForm.reset();
      showProfile();
      setupNavigation();
    });
  }
}

function renderProfile() {
  const current = getCurrentUser();
  if (!current) return;

  document.getElementById("profileName").textContent = current.name;
  document.getElementById("profileEmailName").textContent = current.name;
  document.getElementById("profileEmail").textContent = current.email;

  const favorites = getFavorites();
  const bookings = getBookings().filter(item => item.email === current.email);

  document.getElementById("profileFavoriteCount").textContent = String(favorites.length);
  document.getElementById("profileBookingCount").textContent = String(bookings.length);

  const favoriteList = document.getElementById("profileFavorites");
  favoriteList.replaceChildren();

  if (favorites.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "You have no favourite sessions yet. Visit the Club page to save one.";
    favoriteList.appendChild(empty);
  } else {
    favorites.forEach(favorite => {
      const item = document.createElement("div");
      item.className = "saved-item";
      const info = document.createElement("p");
      info.textContent = `${favorite.name} — ${favorite.day}, ${favorite.time}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn btn-sm btn-outline-danger";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        writeJSON(STORAGE_KEYS.favorites, getFavorites().filter(entry => entry.id !== favorite.id));
        renderProfile();
      });
      item.append(info, remove);
      favoriteList.appendChild(item);
    });
  }

  const history = document.getElementById("bookingHistory");
  history.replaceChildren();
  if (bookings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "No bookings yet. Use the Join us page to save your first trial session.";
    history.appendChild(empty);
  } else {
    const table = document.createElement("table");
    table.className = "table align-middle";
    table.innerHTML = "<thead><tr><th>Booking ID</th><th>Date</th><th>Training</th><th>Level</th></tr></thead>";
    const body = document.createElement("tbody");
    bookings.slice().reverse().forEach(booking => {
      const row = document.createElement("tr");
      [booking.id, booking.date, booking.training, booking.level].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    history.appendChild(table);
  }
}

function showProfile() {
  const current = getCurrentUser();
  const authView = document.getElementById("authView");
  const profileView = document.getElementById("profileView");
  if (!authView || !profileView) return;

  if (current) {
    authView.classList.add("d-none");
    profileView.classList.remove("d-none");
    renderProfile();
  } else {
    authView.classList.remove("d-none");
    profileView.classList.add("d-none");
  }
}

function setupProfileActions() {
  const logout = document.getElementById("logoutButton");
  logout?.addEventListener("click", () => {
    try { localStorage.removeItem(STORAGE_KEYS.currentUser); } catch (error) {}
    showProfile();
    setupNavigation();
  });

  document.getElementById("clearFavorites")?.addEventListener("click", () => {
    writeJSON(STORAGE_KEYS.favorites, []);
    renderProfile();
  });

  showProfile();
}

function setupJQueryEffects() {
  if (!window.jQuery) return;

  // Effect 1: accessible FAQ slide toggle.
  $(".faq-question").on("click", function () {
    const button = $(this);
    const answer = button.next(".faq-answer");
    const willOpen = button.attr("aria-expanded") !== "true";
    $(".faq-answer").not(answer).stop(true, true).slideUp(220);
    $(".faq-question").not(button).attr("aria-expanded", "false").find("span").text("+");
    answer.stop(true, true).slideToggle(220);
    button.attr("aria-expanded", String(willOpen));
    button.find("span").text(willOpen ? "−" : "+");
  });

  // Effect 2: reveal sections once when the page is ready.
  $(".feature-card, .session-card, .form-card, .profile-card").hide().each(function (index) {
    $(this).delay(index * 60).fadeIn(280);
  });

  // Effect 3: subtle button feedback; stop queued animations on fast repeated hover.
  $(document).on("mouseenter", ".btn, .favorite-button", function () {
    $(this).stop(true, false).animate({ opacity: 0.82 }, 100);
  }).on("mouseleave", ".btn, .favorite-button", function () {
    $(this).stop(true, false).animate({ opacity: 1 }, 100);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  setupNavigation();
  setupSessionFilters();
  setupCalculator();
  setupBookingForm();
  setupAccountForms();
  setupProfileActions();
  setupJQueryEffects();
});
