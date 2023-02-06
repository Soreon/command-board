let gridSizeInCell = +getComputedStyle(document.documentElement).getPropertyValue('--grid-size-in-cell');
const gridContainer = document.querySelector('.grid-container');
const gridSizeInput = document.querySelector('#grid-size-input');
const resetButton = document.querySelector('#reset-cell');
const checkValidity = document.querySelector('#check-validity');
const imageSelector = document.querySelector('#image-selector');
const imagePreview = document.querySelector("#image-preview");
const exportButton = document.querySelector('#export-button');
const importButton = document.querySelector("#import-button");
const exportList = document.querySelector('#export-list');
const deleteExportButton = document.querySelector("#delete-export-button");
const upButton = document.querySelector("#up-button");
const downButton = document.querySelector("#down-button");
const leftButton = document.querySelector("#left-button");
const rightButton = document.querySelector("#right-button");

let hasUnsavedData = false;
let usedCheckpoints = new Set();
let isStartPanelUsed = false;
let mouseDownTarget = null;

function refreshExportList() {
  exportList.innerHTML = "";

  let exportOption = document.createElement("option");
  exportOption.value = 'default';
  exportOption.selected = true;
  exportOption.innerHTML = '';
  exportList.appendChild(exportOption);

  for (let i = 0; i < localStorage.length; i++) {
    exportName = localStorage.key(i);
    exportOption = document.createElement("option");
    exportOption.value = exportName;
    exportOption.innerHTML = exportName;
    exportList.appendChild(exportOption);
  }
}

function onImageSelect(event) {
  const selectedImage = event.target.value;
  imagePreview.className = selectedImage;
}

function enableCheckpointOption(checkpoint) {
  const options = imageSelector.querySelectorAll("option");
  for (const option of options) {
    if (option.value === checkpoint) {
      option.disabled = false;
    }
  }
}

function enableAllOptions() {
  const options = imageSelector.querySelectorAll("option");
  for (const option of options) {
    option.disabled = false;
  }
}

function onCellClick(event) {
  if (event.which !== 1) return;
  const selectedImage = imageSelector.value;

  if (event.target.classList.contains("blueCheckpoint")) {
    enableCheckpointOption("blueCheckpoint");
  } else if (event.target.classList.contains("greenCheckpoint")) {
    enableCheckpointOption("greenCheckpoint");
  } else if (event.target.classList.contains("redCheckpoint")) {
    enableCheckpointOption("redCheckpoint");
  } else if (event.target.classList.contains("yellowCheckpoint")) {
    enableCheckpointOption("yellowCheckpoint");
  } else if (event.target.classList.contains("startPanel")) {
    isStartPanelUsed = false;
  }

  event.target.className = 'grid-item';
  if (selectedImage !== 'empty') {
    event.target.classList.add(selectedImage);

    if (selectedImage.includes("Checkpoint")) {
      usedCheckpoints.add(selectedImage);
      imageSelector.querySelectorAll(`[value='${selectedImage}']`)[0].disabled = true;
      imageSelector.value = 'empty';
      onImageSelect({ target: imageSelector });
    } else if (selectedImage === 'startPanel') {
      imageSelector.querySelectorAll("[value='startPanel']")[0].disabled = true;
      imageSelector.value = 'empty';
      onImageSelect({ target: imageSelector });
    }
  }
  hasUnsavedData = true;
}

function generateGrid() {
  for (let i = 0; i < gridSizeInCell ** 2; i++) {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');
    gridItem.draggable = false;
    gridContainer.appendChild(gridItem);
    gridItem.addEventListener('click', onCellClick);
    gridItem.addEventListener('mousemove', (event) => {
      if (!mouseDownTarget) return;
      if (mouseDownTarget === event.target) return;
      onCellClick(event);
    });
  }
}

function getGridStr() {
  let gridStr = "";

  document.querySelectorAll('.grid-item').forEach((cell, index) => {
    if (cell.className.includes('blueCheckpoint')) gridStr += "B";
    else if (cell.className.includes('greenCheckpoint')) gridStr += "G";
    else if (cell.className.includes('redCheckpoint')) gridStr += "R";
    else if (cell.className.includes('yellowCheckpoint')) gridStr += "Y";
    else if (cell.className.includes('dice')) gridStr += "D";
    else if (cell.className.includes('damagePanel')) gridStr += "P";
    else if (cell.className.includes('horizontalTeleporter')) gridStr += "H";
    else if (cell.className.includes('verticalTeleporter')) gridStr += "V";
    else if (cell.className.includes('bonusPanel')) gridStr += "O";
    else if (cell.className.includes('commandPanel')) gridStr += "C";
    else if (cell.className.includes('gpBoosterPanel')) gridStr += "M";
    else if (cell.className.includes('specialPanel')) gridStr += "S";
    else if (cell.className.includes('startPanel')) gridStr += "A";
    else gridStr += " ";
  });

  return gridStr;
}

function exportGrid() {
  const exportName = prompt("Entrez un nom pour l'export : ");
  if (!exportName) return;

  localStorage.setItem(exportName, getGridStr());

  const exportList = document.querySelector("#export-list");
  const option = document.createElement("option");
  option.value = exportName;
  option.innerHTML = exportName;
  exportList.appendChild(option);

  console.log(`Les données de la grille ont été exportées avec succès sous le nom ${exportName}`);
}

function resetGrid() {
  enableAllOptions();
  document.querySelectorAll('.grid-item').forEach((gridItem) => {
    if (gridItem.classList.contains('blueCheckpoint')) {
      usedCheckpoints.delete('blueCheckpoint');
      imageSelector.querySelectorAll("[value='blueCheckpoint']")[0].disabled = false;
    }
    if (gridItem.classList.contains('greenCheckpoint')) {
      usedCheckpoints.delete('greenCheckpoint');
      imageSelector.querySelectorAll("[value='greenCheckpoint']")[0].disabled = false;
    }
    if (gridItem.classList.contains('redCheckpoint')) {
      usedCheckpoints.delete('redCheckpoint');
      imageSelector.querySelectorAll("[value='redCheckpoint']")[0].disabled = false;
    }
    if (gridItem.classList.contains('yellowCheckpoint')) {
      usedCheckpoints.delete('yellowCheckpoint');
      imageSelector.querySelectorAll("[value='yellowCheckpoint']")[0].disabled = false;
    }
    if (gridItem.classList.contains('startCell')) {
      isStartPanelUsed = false;
      imageSelector.querySelectorAll("[value='startPanel']")[0].disabled = false;
    }
    gridItem.className = 'grid-item';
  });
  exportList.value = 'default';
}

function checkGridValidity() {
  const gridContent = getGridStr();

  if(!gridContent.includes("A")) {
    alert("La grille doit contenir une case de départ");
    return false;
  }

  if(!gridContent.includes("B") || !gridContent.includes("G") || !gridContent.includes("R") || !gridContent.includes("Y")) {
    alert("La grille doit contenir tous les checkpoints");
    return false;
  }

  alert('La grille est valide !');
  return true;
}

function importGrid() {
  const exportName = exportList.value;
  if (!exportName) return; // si l'utilisateur annule la saisie

  const gridData = localStorage.getItem(exportName);
  if (!gridData) {
    console.log(`Aucun export n'a été trouvé sous le nom ${exportName}`);
    return;
  }

  // remplir la grille avec les données importées
  gridSizeInCell = Math.sqrt(gridData.length);
  gridSizeInput.value = gridSizeInCell;
  document.documentElement.style.setProperty('--grid-size-in-cell', gridSizeInCell);
  gridContainer.innerHTML = "";
  generateGrid();
  const gridItems = document.querySelectorAll('.grid-item');
  for (let i = 0; i < gridItems.length; i++) {
    gridItems[i].className = "grid-item";

    switch(gridData[i]) {
      case "B": gridItems[i].classList.add('blueCheckpoint'); break;
      case "G": gridItems[i].classList.add('greenCheckpoint'); break;
      case "R": gridItems[i].classList.add('redCheckpoint'); break;
      case "Y": gridItems[i].classList.add('yellowCheckpoint'); break;
      case "D": gridItems[i].classList.add('dice'); break;
      case "P": gridItems[i].classList.add('damagePanel'); break;
      case "H": gridItems[i].classList.add('horizontalTeleporter'); break;
      case "V": gridItems[i].classList.add('verticalTeleporter'); break;
      case "O": gridItems[i].classList.add('bonusPanel'); break;
      case "C": gridItems[i].classList.add('commandPanel'); break;
      case "M": gridItems[i].classList.add('gpBoosterPanel'); break;
      case "S": gridItems[i].classList.add('specialPanel'); break;
      case "A": gridItems[i].classList.add('startPanel'); break;
    }       
  }

  if (gridData.includes('B')) usedCheckpoints.add('blueCheckpoint');
  if (gridData.includes('G')) usedCheckpoints.add('greenCheckpoint');
  if (gridData.includes('R')) usedCheckpoints.add('redCheckpoint');
  if (gridData.includes('Y')) usedCheckpoints.add('yellowCheckpoint');
  if (gridData.includes('A')) isStartPanelUsed = true;

  const checkpointOptions = Array.from(imageSelector.querySelectorAll("option")).filter(option => option.value.includes("Checkpoint"));
  enableAllOptions();

  for (const checkpoint of usedCheckpoints) {
    const option = checkpointOptions.find(opt => opt.value === checkpoint.trim());
    option.disabled = true;
  }

  if (isStartPanelUsed) {
    imageSelector.querySelector("[value='startPanel']").disabled = true;
  }

  exportList.value = 'default';

  console.log(`Les données de la grille ont été importées avec succès depuis ${exportName}`);
}

function deleteExport() {
  const exportList = document.querySelector("#export-list");
  const exportName = exportList.value;
  if (exportName === "default") return;
  localStorage.removeItem(exportName);
  exportList.removeChild(exportList.querySelector(`[value='${exportName}']`));
  exportList.value = 'default';
}

function shiftUp() {
  const gridItems = document.querySelectorAll('.grid-item');
  const firstRowItems = Array.from(gridItems).slice(0, gridSizeInCell);

  for (let i = 0; i < firstRowItems.length; i++) {
    const item = firstRowItems[i];
    item.className = "grid-item";
    gridContainer.appendChild(item);
  }
}

function shiftDown() {
  const gridItems = document.querySelectorAll('.grid-item');
  const lastRowItems = Array.from(gridItems).slice(-gridSizeInCell);

  for (let i = lastRowItems.length - 1; i >= 0; i--) {
    const item = lastRowItems[i];
    item.className = "grid-item";
    gridContainer.prepend(item);
  }
}

function shiftLeft() {
  const gridItems = document.querySelectorAll('.grid-item');
  const item = gridItems[0]
  item.className = "grid-item";
  const leftmostItems = Array.from(gridItems).filter((item, index) => (index + 1) % gridSizeInCell === 1);
  leftmostItems.forEach((item => item.className = "grid-item"));
  gridContainer.appendChild(item);
}

function shiftRight() {
  const gridItems = document.querySelectorAll('.grid-item');
  const item = gridItems[gridItems.length - 1];
  item.className = "grid-item";
  const rightmostItems = Array.from(gridItems).filter((item, index) => (index + 1) % gridSizeInCell === 0);
  rightmostItems.forEach((item => item.className = "grid-item"));
  gridContainer.prepend(item);
}

function onGridSizeChange(event) {
  const gridSize = event.target.value;
  gridSizeInCell = gridSize;
  document.documentElement.style.setProperty('--grid-size-in-cell', gridSize);
  const gridContainer = document.querySelector('.grid-container');
  gridContainer.innerHTML = '';
  generateGrid();
  enableAllOptions()
}

function onWindowQuit(event) {
  if (hasUnsavedData) {
    event.returnValue = "Vous avez des données non enregistrées sur cette page. Êtes-vous sûr de vouloir quitter?";
  }
}

function onMouseDown(event) {
  mouseDownTarget = event.target;
}

function onMouseUp(event) {
  mouseDownTarget = null;
}

function onMouseLeave(event) {
  mouseDownTarget = null;
}

function onDrag(event) {
  event.preventDefault();
}


gridSizeInput.value = gridSizeInCell;
gridSizeInput.addEventListener('change', onGridSizeChange);
exportButton.addEventListener('click', exportGrid);
resetButton.addEventListener('click', resetGrid);
checkValidity.addEventListener('click', checkGridValidity);
importButton.addEventListener("click", importGrid);
deleteExportButton.addEventListener("click", deleteExport);
upButton.addEventListener("click", shiftUp);
downButton.addEventListener("click", shiftDown);
leftButton.addEventListener("click", shiftLeft);
rightButton.addEventListener("click", shiftRight);
imageSelector.addEventListener("change", onImageSelect);
window.addEventListener("beforeunload", onWindowQuit);
document.addEventListener("mousedown", onMouseDown);
document.addEventListener("mouseup", onMouseUp);
document.addEventListener("mouseleave", onMouseLeave);
document.addEventListener("dragstart", onDrag);
document.addEventListener("dragover", onDrag);

generateGrid();
refreshExportList()
