const form = document.querySelector("form");
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const apiKey = document.querySelector("#api-key").value;
  chrome.storage.sync.set({ apiKey: apiKey }, function () {
    alert("API key saved!");
  });
});
