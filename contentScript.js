// Add an event listener to the document
document.addEventListener("input", function (event) {
  // Get the event target
  const target = event.target;

  // Check if the target is an input element, textarea or contenteditable div
  if (
    target.matches(
      'input[type="text"], input[type="search"], textarea, [contenteditable="true"]'
    )
  ) {
    let inputField = document.querySelector(
      '.public-DraftEditor-content [data-text="true"]'
    );
    // Send a message to the background script with the input text
    const inputValue = inputField
      ? inputField.textContent.trim()
      : target.value || target.textContent;

    //for asking anything from openai
    if (/^ask:/i.test(inputValue) && inputValue.endsWith(";")) {
      // Replace the input value with a modified version
      getAndReplaceData(inputValue, inputField, target, "ask:", "");
    }
    //for writing reply for any given text
    else if (/^rpy:/i.test(inputValue) && inputValue.endsWith(";")) {
      getAndReplaceData(
        inputValue,
        inputField,
        target,
        "rpy:",
        "write reply of given text according to tone of given text - "
      );
    }
    //for fixing grammar of any given text
    else if (/^fix:/i.test(inputValue) && inputValue.endsWith(";")) {
      getAndReplaceData(
        inputValue,
        inputField,
        target,
        "fix:",
        "In given text only correct spelling, syntax, or grammar mistakes, do not make improvements.If the original text has no mistake, just output the original text and nothing else - "
      );
    }

    //for writing a better version of any given text
    else if (/^imp:/i.test(inputValue) && inputValue.endsWith(";")) {
      getAndReplaceData(
        inputValue,
        inputField,
        target,
        "imp:",
        "I will give you text content, you will rewrite it and Do not give answer of text Just improve the given text.Keep the meaning the same.Only give me the output and nothing else - "
      );
    }

    // chrome.runtime.sendMessage({ input: target.value || target.innerText });
  }
});

function extractSentence(str, prefix) {
  if (str.startsWith(prefix)) {
    str = str.slice(prefix.length); // remove the prefix
  }
  str = str.trim(); // remove leading and trailing whitespace
  if (str.endsWith(";")) {
    str = str.slice(0, -1); // remove the semicolon
  }
  return str;
}

function getAndReplaceData(inputValue, inputField, target, prefix, addedStr) {
  chrome.storage.sync.get("apiKey", function (data) {
    const OPENAI_API_KEY = data.apiKey;
    // Use the apiKey in your extension's logic...

    const onlyText = addedStr + extractSentence(inputValue, prefix);

    fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `${onlyText}`,
        temperature: 0.6,
        max_tokens: 150,
        top_p: 1,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const newValue = inputValue.replace(
          inputValue,
          data?.choices[0].text.trim()
        );
        if (target.value) target.value = newValue;
        else if (inputField) {
          function dispatchPaste(target, text) {
            function selectTargetText(target) {
              const selection = window.getSelection();
              const range = document.createRange();
              range.selectNodeContents(target);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            selectTargetText(target);

            //Other method to paste data on draftjs editor but it is not working it is not replacing existing text
            const data = new DataTransfer();
            data.setData("text/plain", text);

            const pasteEvent = new ClipboardEvent("paste", {
              clipboardData: data,
              bubbles: true,
              cancelable: true,
            });

            document.addEventListener(
              "selectionchange",
              () => {
                target.dispatchEvent(pasteEvent);
              },
              { once: true }
            );

            // console.log(text);
          }

          dispatchPaste(inputField, data?.choices[0].text.trim());
        } else if (target.textContent) target.textContent = newValue;
      })
      .catch((error) => console.error(error));
  });
}
