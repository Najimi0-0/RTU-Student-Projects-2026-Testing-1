// script.js

// UI toggles (kept from original)
const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnPopup = document.querySelector('.btnLogin-popup');
const iconClose = document.querySelector('.icon-close');

// Open login popup directly
btnPopup?.addEventListener('click', () => {
    wrapper.classList.add('active-popup'); // show popup
    wrapper.classList.remove('active');    // ensure login is shown, not register
});

// Close popup
iconClose?.addEventListener('click', () => {
    wrapper.classList.remove('active-popup');
});

// Switch to register when clicking register link inside login
registerLink?.addEventListener('click', () => {
    wrapper.classList.add('active'); // show register
});

// Switch back to login when clicking login link inside register
loginLink?.addEventListener('click', () => {
    wrapper.classList.remove('active'); // show login
});


// Storage key
const STORAGE_KEY = 'appdate_accounts';

// Default admin account (preload once)
const adminAccount = {
  name: 'admin',
  email: 'admin@rtu.edu.ph',
  dob: '2006-09-19', // ISO date for comparison and CSV
  course: 'BSIT',
  password: 'admin1234'
};

function loadAccounts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // first-time: preload admin
    const arr = [adminAccount];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    return arr;
  }
  try {
    return JSON.parse(raw) || [];
  } catch (e) {
    console.error('Invalid accounts data in localStorage, resetting.');
    const arr = [adminAccount];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    return arr;
  }
}

function saveAccounts(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// CSV export (Excel-compatible)
function downloadCSV(accounts) {
  if (!Array.isArray(accounts) || accounts.length === 0) return;
  const headers = ['Name','Email','DateOfBirth','Course','Password'];
  const rows = accounts.map(a => [
    escapeCsv(a.name),
    escapeCsv(a.email),
    escapeCsv(a.dob),
    escapeCsv(a.course),
    escapeCsv(a.password)
  ]);
  const csvContent = [headers, ...rows].map(r => r.join(',')).join('\r\n');
  // Add BOM so Excel opens UTF-8 CSV correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'APPDATE_REGISTERED_ACCOUNTS.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(text) {
  if (text == null) return '';
  const s = String(text);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Validate RTU email: either admin@rtu.edu.ph OR 2024-200001..2024-200999@rtu.email.com
function isValidRtuEmail(email) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (e === 'admin@rtu.edu.ph') return true;
  const expectedDomain = '@rtu.edu.ph';
  if (!e.endsWith(expectedDomain)) return false;
  // check prefix '2024-200xxx'
  const prefix = e.split('@')[0]; // e.g. 2024-200123
  const parts = prefix.split('-'); // ["2024", "200123"]
  if (parts.length !== 2) return false;
  if (parts[0] !== '2024') return false;
  const numStr = parts[1]; // should be a 6-digit like 200001
  if (!/^\d{6}$/.test(numStr)) return false;
  const num = parseInt(numStr, 10);
  return num >= 200001 && num <= 200999;
}

// Registration handling
const registerForm = document.getElementById('registerForm');

registerForm?.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const dob = document.getElementById('regDob').value;
  const course = document.getElementById('regCourse').value;
  const pass = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  const agree = document.getElementById('agreeTerms').checked;

  if (!name || !email || !dob || !course || !pass || !confirm) {
    alert('Please fill all required fields.');
    return;
  }

  if (!agree) {
    alert('You must agree to the terms and conditions.');
    return;
  }

  if (!isValidRtuEmail(email)) {
    alert('RTU email must be admin@rtu.edu.ph or a valid RTU student email in the range 2024-200001@rtu.email.com to 2024-200999@rtu.email.com');
    return;
  }

  if (pass !== confirm) {
    alert('Passwords do not match.');
    return;
  }

  // Load existing accounts
  const accounts = loadAccounts();

  // Prevent duplicate email
  const exists = accounts.some(a => a.email.toLowerCase() === email);
  if (exists) {
    alert('An account with that email already exists.');
    return;
  }

  const account = {
    name,
    email,
    dob,
    course,
    password: pass
  };

  accounts.push(account);
  saveAccounts(accounts);

  // Download CSV of all accounts
  downloadCSV(accounts);

  alert('Registration successful. CSV downloaded. You can now login.');
  // Reset register form
  registerForm.reset();
  // Show login view
  wrapper.classList.remove('active');
});

// Login handling
const loginForm = document.getElementById('loginForm');

loginForm?.addEventListener('submit', function (e) {
  e.preventDefault();
  const loginEmail = document.getElementById('loginEmail').value.trim().toLowerCase();
  const loginPassword = document.getElementById('loginPassword').value;

  if (!loginEmail || !loginPassword) {
    alert('Please fill both email and password.');
    return;
  }

  const accounts = loadAccounts();
  const user = accounts.find(a => a.email.toLowerCase() === loginEmail);

  if (!user) {
    alert('No account found with that email.');
    return;
  }

  if (user.password !== loginPassword) {
    alert('Incorrect password.');
    return;
  }

  // Successful login
  alert(`Welcome, ${user.name}! Redirecting...`);
  // Redirect to home (same as original form behaviour)
  window.location.href = 'Home.html';
});

// Keep the FAQ accordion code (if any) intact
var acc = document.getElementsByClassName("accordion");
for (let i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function () {
    this.classList.toggle("active");
    this.parentElement.classList.toggle("active");
    var pannel = this.nextElementSibling;
    if (pannel.style.display === "block") pannel.style.display = "none";
    else pannel.style.display = "block";
  });
}

document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', function() {
    const targetId = this.dataset.target;
    const input = document.getElementById(targetId);
    if (input.type === 'password') {
      input.type = 'text';
      this.querySelector('ion-icon').name = 'eye-off-outline';
    } else {
      input.type = 'password';
      this.querySelector('ion-icon').name = 'eye-outline';
    }
  });
});

document.addEventListener("DOMContentLoaded", function() {
    const accordions = document.querySelectorAll(".accordion");

    accordions.forEach(button => {
        button.addEventListener("click", function () {
            const panel = this.nextElementSibling;

            // toggle panel individually
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null; // collapse
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px"; // expand
            }

            this.classList.toggle("active");
        });
    });
});