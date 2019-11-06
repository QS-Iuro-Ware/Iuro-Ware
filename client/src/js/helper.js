const pages = {};

async function querySelector(selector) {
  const getter = new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element !== null) {
        clearInterval(interval);
        resolve(element);
      }
    }, 50);
  });

  const timeout = new Promise((resolve, reject) => setTimeout(reject, 1500));
  return Promise.race([getter, timeout]);
}

async function loadPage(page) {
  const obj = document.body;
  let text = await (await fetch("html/" + page + ".html")).text();
  // Hack to allow this function to block until html elements are loaded
  text += "<div id='loaded'></div>";

  if (obj.getAttribute("data-name"))
    await unregister(obj.getAttribute("data-name"));

  obj.setAttribute("data-name", page);
  obj.innerHTML = "";

  const newDiv = document.createElement("div");
  newDiv.innerHTML = text;
  obj.appendChild(newDiv);

  // Don't remove this line
  // It ensures function is blocked until last element is loaded,
  // So all loaded elements can be queried with `querySelector`
  const loaded = await querySelector("#loaded");

  await pages[page].load();
}

function registerPage(page, func) {
  pages[page] = pages[page] || { load: null, events: [] };
  pages[page].load = func;
}

async function registerEvent(page, selector, eventType, func) {
  pages[page] = pages[page] || { load: null, events: [] };
  pages[page].events.push({ selector, eventType, func });
  (await querySelector(selector)).addEventListener(eventType, func);
}

async function unregister(page) {
  for (const { selector, eventType, func } of pages[page].events) {
    (await querySelector(selector)).removeEventListener(eventType, func);
  }
  delete pages[page];
}

async function extractValue(selector) {
  const element = await querySelector(selector);
  const value = element.value;
  element.value = "";
  return value;
}

function send(obj) {
  console.log(obj);
  conn.send(JSON.stringify(obj));
}

function titleCase(text) {
  return text[0].toUpperCase() + text.substring(1).toLowerCase();
}
