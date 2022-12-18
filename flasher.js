const isoDirectory = document.getElementById("isoDirectory");
const isoRefreshButton = document.getElementById("isoRefresh");
const isoDropdown = document.getElementById("isoDropdown");
const flashButton = document.getElementById("flash");
const status = document.getElementById("status");
const output = document.getElementById("output");

function flasher_run() {
   status.style.color = "green";
   status.innerHTML = "running...";
}

function flasher_status_load() {
   status.style.color = "yellow";
   status.innerHTML = "loading...";
}

function flasher_status_idle() {
   status.style.color = "black";
   status.innerHTML = "awating input..."
}

function flasher_output(data) {
   output.append(document.createTextNode(data));
}

function get_iso() {
   cockpit.spawn(["ls", isoDirectory.value])
      .stream(generate_iso_dropdown)
      .then(flasher_status_idle)
      .catch();
}

function get_media(){

}

function generate_iso_dropdown(data) {
   flasher_status_load();
   flasher_output(data);

//   let dropdownData = /^(([a-zA-Z0-9-.]+).iso)+$/.exec(data);
   let dropdownData = data.match(/^([a-zA-Z0-9-.]+.iso)+/gm);

   for (let iso in dropdownData){

      let option = document.createElement("option");
      option.setAttribute("value", dropdownData[iso]);

      let optionText = document.createTextNode(dropdownData[iso]);
      option.appendChild(optionText);

      isoDropdown.appendChild(option);

   }
}

function generate_media_dropdown(data){

}

flashButton.addEventListener("click", flasher_run);
isoRefreshButton.addEventListener("click", get_iso);
flasher_status_load;
cockpit.transport.wait(get_iso);
flasher_status_idle;
