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

function updateBlockingRules() {
  const rules = [];

  blockedUrls.forEach((url, index) => {
    const base = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

    rules.push({
      id: index * 2 + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { url: chrome.runtime.getURL("block.html") }
      },
      condition: {
        urlFilter: `*://${base}/*`,
        resourceTypes: ["main_frame"]
      }
    });

    rules.push({
      id: index * 2 + 2,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { url: chrome.runtime.getURL("block.html") }
      },
      condition: {
        urlFilter: `*://www.${base}/*`,
        resourceTypes: ["main_frame"]
      }
    });
  });

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: blockedUrls.length * 2 }, (_, i) => i + 1),
    addRules: rules
  });
}

// 🔄 Track visits to blocked domains
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const url = new URL(details.initiator || details.documentUrl || details.url);
      const domain = url.hostname.replace(/^www\./, "");

      chrome.storage.sync.get(["visitCounts", "blockedUrls"], (data) => {
        const counts = data.visitCounts || {};
        const blocked = data.blockedUrls || [];

        if (blocked.includes(domain)) {
          counts[domain] = (counts[domain] || 0) + 1;
          chrome.storage.sync.set({ visitCounts: counts });
        }
      });
    } catch (e) {
      console.warn("Error tracking visit:", e);
    }
  },
  { urls: ["<all_urls>"], types: ["main_frame"] }
);
