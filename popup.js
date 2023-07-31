const settingsBtn = document.querySelector("#settings-btn");
settingsBtn.addEventListener("click", function () {
  chrome.runtime.openOptionsPage();
});
