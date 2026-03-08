(function () {
  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (element.hasAttribute("disabled")) return false;
    return true;
  }

  function findFirst(selectors) {
    for (const selector of selectors) {
      const candidates = Array.from(document.querySelectorAll(selector));
      const visible = candidates.find((el) => isVisible(el));
      if (visible) return visible;
    }
    return null;
  }

  function setElementValue(element, value, allowHtml) {
    if (!element) return false;
    const nextValue = String(value || "");

    if (element.isContentEditable) {
      if (allowHtml) {
        element.innerHTML = nextValue;
      } else {
        element.textContent = nextValue;
      }
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    if ("value" in element) {
      element.focus();
      element.value = nextValue;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    return false;
  }

  function fillFields(row) {
    const commentField = findFirst([
      "textarea#comment",
      "textarea[name='comment']",
      "textarea[name*='comment' i]",
      "textarea[id*='comment' i]",
      "[contenteditable='true'][name*='comment' i]",
      "[contenteditable='true'][id*='comment' i]"
    ]);

    const nameField = findFirst([
      "input#author",
      "input[name='author']",
      "input[name='name']",
      "input[name*='name' i]",
      "input[id*='name' i]"
    ]);

    const emailField = findFirst([
      "input#email",
      "input[type='email']",
      "input[name='email']",
      "input[name*='email' i]",
      "input[id*='email' i]"
    ]);

    const websiteField = findFirst([
      "input#url",
      "input[name='url']",
      "input[name='website']",
      "input[name*='website' i]",
      "input[id*='website' i]"
    ]);

    const filled = {
      comment: setElementValue(commentField, row.comment, true),
      name: setElementValue(nameField, row.name, true),
      email: setElementValue(emailField, row.email, false),
      website: setElementValue(websiteField, row.website, false)
    };

    const missing = Object.entries(filled)
      .filter(([, ok]) => !ok)
      .map(([key]) => key);

    return {
      ok: missing.length < 4,
      message: missing.length ? `Some fields not found: ${missing.join(", ")}` : "All fields filled.",
      filled,
      missing
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "SAFE_FILL_COMMENT_FIELDS") return;
    const row = message.row || {};
    const result = fillFields(row);
    sendResponse(result);
  });
})();
