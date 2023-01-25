let gridSizeInCell = +getComputedStyle(document.documentElement).getPropertyValue('--grid-size-in-cell');
const gridContainer = document.querySelector('.grid-container');
const gridSizeInput = document.querySelector('#grid-size-input');
const resetButton = document.querySelector('#reset-cell');
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

function refreshExportList() {
  exportList.innerHTML = "";
  for (let i = 0; i < localStorage.length; i++) {
    const exportName = localStorage.key(i);
    const exportOption = document.createElement("option");
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
  const selectedImage = imageSelector.value;

  if (event.target.classList.contains("blueCheckpoint")) {
    enableCheckpointOption("blueCheckpoint");
  } else if (event.target.classList.contains("greenCheckpoint")) {
    enableCheckpointOption("greenCheckpoint");
  } else if (event.target.classList.contains("redCheckpoint")) {
    enableCheckpointOption("redCheckpoint");
  } else if (event.target.classList.contains("yellowCheckpoint")) {
    enableCheckpointOption("yellowCheckpoint");
  }

  event.target.className = 'grid-item';
  if (selectedImage !== 'empty') {
    event.target.classList.add(selectedImage);

    if (selectedImage.includes("Checkpoint")) {
      usedCheckpoints.add(selectedImage);
      imageSelector.querySelectorAll(`[value='${selectedImage}']`)[0].disabled = true;
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
    gridContainer.appendChild(gridItem);
    gridItem.addEventListener('click', onCellClick);
    gridItem.addEventListener('dragover', onCellClick);
  }
}

function exportGrid() {
  const exportName = prompt("Entrez un nom pour l'export : ");
  if (!exportName) return; // si l'utilisateur annule la saisie

  const gridData = {
    size: gridSizeInCell,
    cells: []
  };

  const gridItems = document.querySelectorAll('.grid-item');
  for (const item of gridItems) {
    gridData.cells.push(item.className.replace("grid-item", ""));
  }
  localStorage.setItem(exportName, LZString.compressToBase64(JSON.stringify(gridData)));

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
    gridItem.className = 'grid-item';
  });
}

function importGrid() {
  const exportName = exportList.value;
  if (!exportName) return; // si l'utilisateur annule la saisie

  const gridDataString = LZString.decompressFromBase64(localStorage.getItem(exportName));
  if (!gridDataString) {
    console.log(`Aucun export n'a été trouvé sous le nom ${exportName}`);
    return;
  }
  const gridData = JSON.parse(gridDataString);

  // remplir la grille avec les données importées
  gridSizeInCell = gridData.size;
  gridSizeInput.value = gridSizeInCell;
  document.documentElement.style.setProperty('--grid-size-in-cell', gridSizeInCell);
  gridContainer.innerHTML = "";
  generateGrid();
  const gridItems = document.querySelectorAll('.grid-item');
  for (let i = 0; i < gridItems.length; i++) {
    gridItems[i].className = "grid-item " + gridData.cells[i];
  }

  const importedCheckpoints = gridData.cells.filter(cell => cell.includes("Checkpoint"));
  const imageSelector = document.querySelector("#image-selector");
  const checkpointOptions = Array.from(imageSelector.querySelectorAll("option")).filter(option => option.value.includes("Checkpoint"));

  enableAllOptions();

  for (const checkpoint of importedCheckpoints) {
    const option = checkpointOptions.find(opt => opt.value === checkpoint.trim());
    option.disabled = true;
  }

  console.log(`Les données de la grille ont été importées avec succès depuis ${ exportName }`);
}

function deleteExport() {
  const exportList = document.querySelector("#export-list");
  const exportName = exportList.value;
  localStorage.removeItem(exportName);
  exportList.removeChild(exportList.querySelector(`[value='${exportName}']`));
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


gridSizeInput.value = gridSizeInCell;
gridSizeInput.addEventListener('change', onGridSizeChange);
exportButton.addEventListener('click', exportGrid);
resetButton.addEventListener('click', resetGrid);
importButton.addEventListener("click", importGrid);
deleteExportButton.addEventListener("click", deleteExport);
upButton.addEventListener("click", shiftUp);
downButton.addEventListener("click", shiftDown);
leftButton.addEventListener("click", shiftLeft);
rightButton.addEventListener("click", shiftRight);
imageSelector.addEventListener("change", onImageSelect);



window.addEventListener("beforeunload", (e) => {
  if (hasUnsavedData) {
    const dialogText = "Vous avez des données non enregistrées sur cette page. Êtes-vous sûr de vouloir quitter?";
    e.returnValue = dialogText;
    return dialogText;
  }
});

generateGrid();
refreshExportList()