const API_URL = "https://script.google.com/macros/s/AKfycbwH1_S9bIQ8YtV5OihsxJknCXGuTmHTiU4Sk_7EW9jWT2QHFuTEZ0MGnRa7E1tOhzh1pQ/exec";

let sheetData = [];

/* Normalize YYYY-MM-DD to JS Date (local timezone) */
function normalizeDate(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-");
  return new Date(y, m - 1, d);
}

/* Human format: Senin, 10 Januari */
function formatHumanDate(dateString) {
  const d = normalizeDate(dateString);
  if (!d) return dateString;

  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}



/* Fetch data + enable button after loaded */
async function loadData() {
  const checkBtn = document.getElementById("checkBtn");

  try {
    const res = await fetch(API_URL);
    const json = await res.json();

    sheetData = json.data;

    checkBtn.classList.add("enabled");
  } catch (err) {
    console.error("Fetch error:", err);
    document.querySelector("#availabilityTable tbody").innerHTML =
      "<tr><td colspan='6'>Error loading data.</td></tr>";
  }

  document.getElementById("loading").style.display = "none";
}

// function checkStatus(val) {
//   return (val === "" || val === null || val === undefined)
//     ? "Available"
//     : "Booked";
// }

function checkStatus(val) {
  const BOOKING_LINK = "https://wa.me/6281234567890"; // <-- REPLACE WITH YOUR ACTUAL LINK

  return (val === "" || val === null || val === undefined)
    ? `<a href="${BOOKING_LINK}" target="_blank" style="text-decoration: none; color: inherit;">Available</a>`
    : "Booked";
}

function renderTable(filtered) {
  const tbody = document.querySelector("#availabilityTable tbody");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No dates found.</td></tr>";
    return;
  }

  filtered.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td data-label="Date">${formatHumanDate(row.date)}</td>
      <td data-label="Season">${row.Season || "-"}</td>
      <td data-label="Omah Lor" class="${checkStatus(row["Omah Lor"]).toLowerCase()}">${checkStatus(row["Omah Lor"])}</td>
      <td data-label="Omah Kidul" class="${checkStatus(row["Omah Kidul"]).toLowerCase()}">${checkStatus(row["Omah Kidul"])}</td>
      <td data-label="Omah Wetan" class="${checkStatus(row["Omah Wetan"]).toLowerCase()}">${checkStatus(row["Omah Wetan"])}</td>
      <td data-label="Omah Kulon" class="${checkStatus(row["Omah Kulon"]).toLowerCase()}">${checkStatus(row["Omah Kulon"])}</td>
    `;

    tbody.appendChild(tr);
  });
}

function filterByDate() {
  const ci = document.getElementById("checkin").value;
  const co = document.getElementById("checkout").value;

  if (!ci || !co) {
    alert("Please select both check-in and check-out dates.");
    return;
  }

  const start = normalizeDate(ci);
  const end = normalizeDate(co);

  const filtered = sheetData.filter(row => {
    const d = normalizeDate(row.date);
    return d >= start && d < end;  // checkout not included
  });

  renderTable(filtered);
}

document.getElementById("checkBtn").addEventListener("click", filterByDate);

document.getElementById("checkin").addEventListener("change", function () {
  const checkinDate = new Date(this.value);
  const checkout = document.getElementById("checkout");

  // Minimum checkout = next day
  const minDate = new Date(checkinDate);
  minDate.setDate(minDate.getDate() + 1);

  // Maximum checkout = check-in + 14 days
  const maxDate = new Date(checkinDate);
  maxDate.setDate(maxDate.getDate() + 14);

  checkout.min = minDate.toISOString().split("T")[0];
  checkout.max = maxDate.toISOString().split("T")[0];

  // Reset checkout if outside new limits
  if (checkout.value && (checkout.value < checkout.min || checkout.value > checkout.max)) {
    checkout.value = "";
  }
});

loadData();
