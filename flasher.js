const isoDirectory = document.getElementById("isoDirectory");
const isoRefreshButton = document.getElementById("isoRefresh");
const mediaRefreshButton = document.getElementById("mediaRefresh");
const isoDropdown = document.getElementById("isoDropdown");
const mediaDropdown = document.getElementById("mediaDropdown");
const flashButton = document.getElementById("flash");
const mountStatus = document.getElementById("mounted");
const status = document.getElementById("status");
const output = document.getElementById("output");

var isMounted = 1;

function flasher_status_load() {
   status.style.color = "yellow";
   status.innerHTML = "loading...";
}

function flasher_status_idle() {
   status.style.color = "green";
   status.innerHTML = "Awaiting Input...";
}

function flasher_output(data) {
   output.append(document.createTextNode(data));
}

function flasher_run() {
   if (isMounted == 1) {
      status.style.color = "red";
      status.innerHTML = "Error: Disk is mounted, please unmount disk first!";
      return;
   }
   status.style.color = "green";
   status.innerHTML = "running...";
   let isoPath = isoDirectory.value;
   if (isoPath.substring(isoPath.length-1) != "/") {
      isoPath = isoPath.concat("/");
   }
   isoPath = isoPath.concat(isoDropdown.value);
   let mediaPath = "/dev/"
   mediaPath = mediaPath.concat(mediaDropdown.value);

   if (isoDropdown.value == "empty") {
      status.style.color = "red";
      status.innerHTML = "Error: no ISO selected";
      return;
   }

   if (mediaDropdown.value == "empty") {
      status.style.color = "red";
      status.innerHTML = "Error: no media selected";
      return;
   }

   flasher_output(isoPath);
   flasher_output("\n");
   flasher_output(mediaPath);
   flasher_output("\n");

   if (confirm(`Writing data to the selected drive will permanently destroy the data\nISO: ${isoDropdown.value}\nMedia: /dev/${mediaDropdown.value}\nProceed?`)) {
      cockpit.spawn(['sudo', 'dd', 'if=', isoPath, 'of=', mediaPath, 'status=progress'])
         .stream(flasher_output)
         .then(flasher_status_idle)
         .catch(e => {status.style.color = "red"; status.innerHTML = "Error: no root privileges"});
   } else {
      status.style.color = "red";
      status.innerHTML = "Process canceled by user";
      return;
   }
}

function get_mounted() {
   cockpit.spawn(["findmnt", "-l", "-o", "SOURCE"])
      .stream(check_mounted)
      .then()
      .catch();
}

function check_mounted(data) {
   let position = data.search(mediaDropdown.value);
   if (position == -1){
      mountStatus.style.color = "green";
      mountStatus.innerHTML = "Disk not mounted";
      isMounted = 0;
   } else {
      mountStatus.style.color = "red";
      mountStatus.innerHTML = "Disk is mounted, unable to flash";
      isMounted = 1;
   }
}

function get_iso() {
   cockpit.spawn(["ls", isoDirectory.value])
      .stream(generate_iso_dropdown)
      .then(flasher_status_idle)
      .catch(default_iso_dropdown);
}

function get_media(){
   cockpit.spawn(["lsblk", "--nodeps", "--output", "NAME"])
      .stream(generate_media_dropdown)
      .then(flasher_status_idle)
      .catch(default_media_dropdown);
}

function generate_iso_dropdown(data) {
   flasher_status_load();
   flasher_output(data);

   clear_iso_dropdown();
   // Match all *.iso
   let dropdownData = data.match(/^([a-zA-Z0-9-.]+[.]iso)+/gm);

   for (let iso in dropdownData){

      let option = document.createElement("option");
      option.setAttribute("value", dropdownData[iso]);

      let optionText = document.createTextNode(dropdownData[iso]);
      option.appendChild(optionText);

      isoDropdown.appendChild(option);
   }

   flasher_status_idle();
}

function generate_media_dropdown(data) {
   flasher_status_load();
   flasher_output(data);

   clear_media_dropdown();
   // Match sd* or mmcblk* drives
   let dropdownData = data.match(/(?:sd[a-z]|mmcblk[0-9])$/gm);

   for (let media in dropdownData){

      let option = document.createElement("option");
      option.setAttribute("value", dropdownData[media]);

      let optionText = document.createTextNode(dropdownData[media]);
      option.appendChild(optionText);

      mediaDropdown.appendChild(option);
   }
   get_mounted();
   flasher_status_idle();
}

function clear_iso_dropdown(){
   for (let idx in isoDropdown){
      isoDropdown.remove(idx);
   }
}

function clear_media_dropdown(){
   for (let idx in mediaDropdown){
      mediaDropdown.remove(idx);
   }
}

function default_iso_dropdown(){
   clear_iso_dropdown()
   let option = document.createElement("option");
   option.setAttribute("value", "empty");

   let optionText = document.createTextNode("no ISO");
   option.appendChild(optionText);

   isoDropdown.appendChild(option);
}

function default_media_dropdown(){
   clear_media_dropdown()
   let option = document.createElement("option");
   option.setAttribute("value", "empty");

   let optionText = document.createTextNode("no media");
   option.appendChild(optionText);

   mediaDropdown.appendChild(option);
}

function setup(){
   get_iso();
   get_media();
}

flashButton.addEventListener("click", flasher_run);
isoRefreshButton.addEventListener("click", get_iso);
mediaRefreshButton.addEventListener("click", get_media);
mediaDropdown.addEventListener("change", get_mounted);
flasher_status_load();
cockpit.transport.wait(setup);
