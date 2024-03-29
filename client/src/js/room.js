var score = null;

function registerRoom() {
  registerEvent("room", "#send", "click", createMessage);
  registerEvent("room", "#text", "keyup", sendOnEnter);

  monitorQueue("room", "messages", showMessage);
  monitorQueue("room", "startGame", startGame);
  monitorQueue("room", "endGame", stopGame);
  monitorQueue("room", "gameInput", gameInput);
}

function createMessage(ev) {
  sendMessage(extractValue("#text"));
  document.querySelector("#text").focus();
}

function sendOnEnter(ev) {
  if (ev.keyCode === 13) {
    createMessage(ev);
    ev.preventDefault();
  }
}

function gameInput({ game, input }) {
  switch (game) {
    case "RockPapiuroScissor":
      sendRockPapiuroScissor(input);
      break;
    case "TheRightIuro":
      sendTheRightIuro(input);
      break;  
  }
}

function updateLeaderboard() {
  var score_children = document.querySelector("#chat-leaderboard").children;
  var i = 0;
  for(var player in score){
    score_children[i].textContent = player+" "+score[player];
    i++;
  }
}

function sendRockPapiuroScissor(button) {
  clearDiv("RockPapiuroScissor");
  showMessage(titleCase(name || "You") + " threw " + button.toLowerCase());
  var div = document.querySelector("#RockPapiuroScissor");
  var img = document.createElement("img");
  img.src = "img/clock.jpeg";
  div.appendChild(img);
  sendRockPapiuroScissorInput(button);
}

function sendTheRightIuro(button) {
  clearDiv("TheRightIuro");
  var div = document.querySelector("#TheRightIuro");
  div.style.gridTemplateColumns = "";
  var img = document.createElement("img");
  img.src = "img/clock.jpeg";
  div.appendChild(img);
  sendTheRightIuroInput(button);
}

function startGame(game) {
  var id = score == null ? "#start-page" : "#leader-board";
  var ok_button = document.querySelector(id + " input");

  document.querySelector(id).style = "";
  if(score){
    var score_children = document.querySelector("#leader-board .score").children;
    var i = 0;
    for(var player in score){
      score_children[i].textContent = player+" "+score[player];
      i++;
    }
  } 

  switch (game) {
    case "RockPapiuroScissor":
      ok_button.setAttribute("onClick", "document.querySelector('"+ id +"').style.display = 'none'; startRockPapiuroScissor()");
      break;
    default:
      ok_button.setAttribute("onClick", "document.querySelector('"+ id +"').style.display = 'none'; startTheRightIuro("+JSON.stringify(game)+")");
      break;
  }
}

function stopGame(game) {
  score = game[1]
  updateLeaderboard();
  switch (game[0]) {
    case "RockPapiuroScissor":
      stopRockPapiuroScissor();
      break;
    case "TheRightIuro":
      stopTheRightIuro();
      break;
  }
}

function stopRockPapiuroScissor() {
  showMessage("RockPapiuroScissor ended");
  clearDiv("RockPapiuroScissor");
  document.querySelector("#RockPapiuroScissor").style = "display: none;";
}

function stopTheRightIuro() {
  showMessage("TheRightIuro ended");
  clearDiv("TheRightIuro");
  document.querySelector("#TheRightIuro").style = "display: none;";
}


registerRoom();
