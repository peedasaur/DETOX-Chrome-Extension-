let blockedUrls = [];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("blockedUrls", (data) => {
    blockedUrls = data.blockedUrls || [];
    updateBlockingRules();
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "updateBlockedUrls") {
    blockedUrls = msg.data;
    updateBlockingRules();
  }
});

function normalizeDomain(url) {
  try {
    const parsedUrl = new URL(url.startsWith("http") ? url : "https://" + url);
    return parsedUrl.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateBlockingRules() {
  const rules = [];
  const ruleIdsToRemove = [];

  blockedUrls.forEach((url, index) => {
    const base = normalizeDomain(url);
    const id = index + 1;
    ruleIdsToRemove.push(id);

    rules.push({
      id: id,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { url: chrome.runtime.getURL("block.html") }
      },
      condition: {
        regexFilter: `^(https?:\\/\\/)?(www\\.)?${escapeRegex(base)}\\/.*`,
        resourceTypes: ["main_frame"]
      }
    });

    chrome.storage.local.get(["visitCounts"], (data) => {
      const visitCounts = data.visitCounts || {};
      visitCounts[base] = (visitCounts[base] || 0) + 1;
      chrome.storage.local.set({ visitCounts });
    });
  });

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 100 }, (_, i) => i + 1),
    addRules: rules
  });
}
