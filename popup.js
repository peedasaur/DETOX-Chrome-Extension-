const urlInput = document.getElementById("urlInput");
const addBtn = document.getElementById("addBtn");
const urlList = document.getElementById("urlList");
const counterList = document.getElementById("counterList");

// Update the list of blocked URLs
function updateUI(blockedUrls) {
  urlList.innerHTML = "";
  blockedUrls.forEach((url, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = url;

    const btn = document.createElement("button");
    btn.innerHTML = "✖";
    btn.className = "remove-btn";
    btn.onclick = () => {
      blockedUrls.splice(i, 1);
      chrome.storage.sync.set({ blockedUrls });
      chrome.runtime.sendMessage({ action: "updateBlockedUrls", data: blockedUrls });
      updateUI(blockedUrls);
      loadVisitCounts();
    };

    li.appendChild(span);
    li.appendChild(btn);
    urlList.appendChild(li);
  });
}

// Load visit counts from storage
function loadVisitCounts() {
  counterList.innerHTML = "";
  chrome.storage.sync.get("visitCounts", (data) => {
    const counts = data.visitCounts || {};
    for (const domain in counts) {
      const li = document.createElement("li");
      li.innerHTML = `<span>${domain}: ${counts[domain]} visit(s)</span>`;
      counterList.appendChild(li);
    }
  });
}

// Add button click → add new blocked site
addBtn.addEventListener("click", () => {
  const rawUrl = urlInput.value.trim();
  const cleanUrl = rawUrl
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

  if (!cleanUrl) return;

  chrome.storage.sync.get("blockedUrls", (data) => {
    const blockedUrls = data.blockedUrls || [];
    if (!blockedUrls.includes(cleanUrl)) {
      blockedUrls.push(cleanUrl);
      chrome.storage.sync.set({ blockedUrls });
      chrome.runtime.sendMessage({ action: "updateBlockedUrls", data: blockedUrls });
      updateUI(blockedUrls);
    }
  });

  urlInput.value = "";
});

// Reset visit counts
document.getElementById("resetCountsBtn").addEventListener("click", () => {
  chrome.storage.sync.remove("visitCounts", () => {
    counterList.innerHTML = "";
  });
});

// Toggle expand/collapse sections
function toggleSection(id) {
  const list = document.getElementById(id);
  const arrow = document.getElementById(`${id}-arrow`);
  if (list.style.display === "none") {
    list.style.display = "block";
    arrow.textContent = "⏷";
  } else {
    list.style.display = "none";
    arrow.textContent = "⏵";
  }
}

// Run after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Collapse both sections by default
  document.getElementById("urlList").style.display = "none";
  document.getElementById("urlList-arrow").textContent = "⏵";
  document.getElementById("counterList").style.display = "none";
  document.getElementById("counterList-arrow").textContent = "⏵";

  // Attach toggle click handlers
  document.getElementById("toggleUrls").addEventListener("click", () => {
    toggleSection("urlList");
  });

  document.getElementById("toggleCounts").addEventListener("click", () => {
    toggleSection("counterList");
  });

  // Load blocked URLs and visit counts
  chrome.storage.sync.get("blockedUrls", (data) => {
    updateUI(data.blockedUrls || []);
  });

  loadVisitCounts();
});
