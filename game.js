/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
/* eslint-disable no-restricted-syntax */
let gridSizeInCell = +getComputedStyle(document.documentElement).getPropertyValue('--grid-size-in-cell');
const gridContainer = document.querySelector('.grid-container');
const gridSizeInput = document.querySelector('#grid-size-input');
const resetButton = document.querySelector('#reset-cell');
const checkValidity = document.querySelector('#check-validity');
const generateGameGrid = document.querySelector('#generate-game-grid');
const imageSelector = document.querySelector('#image-selector');
const imagePreview = document.querySelector('#image-preview');
const exportButton = document.querySelector('#export-button');
const importButton = document.querySelector('#import-button');
const exportList = document.querySelector('#export-list');
const deleteExportButton = document.querySelector('#delete-export-button');
const upButton = document.querySelector('#up-button');
const downButton = document.querySelector('#down-button');
const leftButton = document.querySelector('#left-button');
const rightButton = document.querySelector('#right-button');

let hasUnsavedData = false;
const usedCheckpoints = new Set();
let isStartPanelUsed = false;
let mouseDownTarget = null;
let history = [];
let historyStateIndex = 0;

function refreshExportList() {
  exportList.innerHTML = '';

  let exportOption = document.createElement('option');
  exportOption.value = 'default';
  exportOption.selected = true;
  exportOption.innerHTML = '';
  exportList.appendChild(exportOption);

  for (let i = 0; i < localStorage.length; i += 1) {
    const exportName = localStorage.key(i);
    exportOption = document.createElement('option');
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
  const options = imageSelector.querySelectorAll('option');
  for (const option of options) {
    if (option.value === checkpoint) {
      option.disabled = false;
    }
  }
}

function enableAllOptions() {
  const options = imageSelector.querySelectorAll('option');
  for (const option of options) {
    option.disabled = false;
  }
}

function getGridStr() {
  let gridStr = '';

  document.querySelectorAll('.grid-item').forEach((cell, index) => {
    if (cell.className.includes('blueCheckpoint')) gridStr += 'B';
    else if (cell.className.includes('greenCheckpoint')) gridStr += 'G';
    else if (cell.className.includes('redCheckpoint')) gridStr += 'R';
    else if (cell.className.includes('yellowCheckpoint')) gridStr += 'Y';
    else if (cell.className.includes('dice')) gridStr += 'D';
    else if (cell.className.includes('damagePanel')) gridStr += 'P';
    else if (cell.className.includes('horizontalTeleporter')) gridStr += 'H';
    else if (cell.className.includes('verticalTeleporter')) gridStr += 'V';
    else if (cell.className.includes('bonusPanel')) gridStr += 'O';
    else if (cell.className.includes('commandPanel')) gridStr += 'C';
    else if (cell.className.includes('gpBoosterPanel')) gridStr += 'M';
    else if (cell.className.includes('specialPanel')) gridStr += 'S';
    else if (cell.className.includes('startPanel')) gridStr += 'A';
    else gridStr += ' ';
  });

  return gridStr;
}

// fonction permettant de visualiser l'état de l'historique
// console.log([...history.map((s, i) => i === historyStateIndex ? `>|${s}|` : ` |${s}|`)].join('\n'))

function addHistoryState() {
  const gridStr = getGridStr();
  if (history[history.length - 1] === gridStr) return;

  if (history.length > 0 && historyStateIndex !== history.length - 1) {
    history.splice(historyStateIndex + 1, history.length - historyStateIndex);
  }
  history.push(gridStr);
  historyStateIndex = history.length - 1;
}

function resetHistory() {
  historyStateIndex = 0;
  history = [];
}

function onCellClick(event) {
  if (event.which !== 1) return;
  const selectedImage = imageSelector.value;

  if (event.target.classList.contains('blueCheckpoint')) {
    enableCheckpointOption('blueCheckpoint');
  } else if (event.target.classList.contains('greenCheckpoint')) {
    enableCheckpointOption('greenCheckpoint');
  } else if (event.target.classList.contains('redCheckpoint')) {
    enableCheckpointOption('redCheckpoint');
  } else if (event.target.classList.contains('yellowCheckpoint')) {
    enableCheckpointOption('yellowCheckpoint');
  } else if (event.target.classList.contains('startPanel')) {
    isStartPanelUsed = false;
  }

  event.target.className = 'grid-item';
  if (selectedImage !== 'empty') {
    event.target.classList.add(selectedImage);

    if (selectedImage.includes('Checkpoint')) {
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
  addHistoryState();
}

function generateGrid() {
  const callback = (event) => {
    if (!mouseDownTarget) return;
    if (mouseDownTarget === event.target) return;
    onCellClick(event);
  };
  for (let i = 0; i < gridSizeInCell ** 2; i += 1) {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');
    gridItem.draggable = false;
    gridContainer.appendChild(gridItem);
    gridItem.addEventListener('click', onCellClick);
    gridItem.addEventListener('mousemove', callback);
  }
}

function exportGrid() {
  const exportName = prompt("Entrez un nom pour l'export : ");
  if (!exportName) return;

  if (localStorage.getItem(exportName) !== null) {
    const overwrite = confirm(`Un export avec le nom ${exportName} existe déjà. Voulez-vous l'écraser ?`);
    if (!overwrite) return;
    exportList.querySelectorAll(`[value='${exportName}']`)[0].remove();
  }

  localStorage.setItem(exportName, getGridStr());

  const option = document.createElement('option');
  option.value = exportName;
  option.innerHTML = exportName;
  exportList.appendChild(option);

  console.log(`Les données de la grille ont été exportées avec succès sous le nom ${exportName}`);
}

function resetImageSelector() {
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

function resetGrid() {
  resetImageSelector();
  resetHistory();
  addHistoryState();
}

function getNeighbourCellsIndexes(cellIndex) {
  const neighbours = [-1, -1, -1, -1];

  if (cellIndex >= gridSizeInCell) {
    neighbours[0] = cellIndex - gridSizeInCell;
  }
  if (cellIndex % gridSizeInCell !== gridSizeInCell - 1) {
    neighbours[1] = cellIndex + 1;
  }
  if (cellIndex < gridSizeInCell ** 2 - gridSizeInCell) {
    neighbours[2] = cellIndex + gridSizeInCell;
  }
  if (cellIndex % gridSizeInCell !== 0) {
    neighbours[3] = cellIndex - 1;
  }

  return neighbours;
}

function getNeighbourCellsStates(gridStr, cellIndex) {
  const neighboursIndexes = getNeighbourCellsIndexes(cellIndex);
  const neighbourCellsStates = [' ', ' ', ' ', ' '];
  neighbourCellsStates[0] = gridStr[neighboursIndexes[0]] || ' ';
  neighbourCellsStates[1] = gridStr[neighboursIndexes[1]] || ' ';
  neighbourCellsStates[2] = gridStr[neighboursIndexes[2]] || ' ';
  neighbourCellsStates[3] = gridStr[neighboursIndexes[3]] || ' ';

  return neighbourCellsStates;
}

function checkIfCellIsIsolated(gridStr, cellIndex) {
  const neighbours = getNeighbourCellsStates(gridStr, cellIndex).filter((neighbour) => neighbour !== ' ');
  return neighbours.length < 2;
}

function checkIfDiceHasDamagePanelNeighbour(gridStr, cellIndex) {
  const neighbours = getNeighbourCellsStates(gridStr, cellIndex);
  return neighbours.includes('P');
}

function checkIfDamagePanelHasDiceOrDamagePanelNeighbour(gridStr, cellIndex) {
  const neighbours = getNeighbourCellsStates(gridStr, cellIndex);
  return neighbours.includes('D') || neighbours.includes('P');
}

function checkIfVerticalTeleporterHasHorizontalTeleporterNeighbour(gridStr, cellIndex) {
  const neighbours = getNeighbourCellsStates(gridStr, cellIndex);
  return neighbours.includes('H');
}

function checkIfHorizontalTeleporterHasVerticalTeleporterNeighbour(gridStr, cellIndex) {
  const neighbours = getNeighbourCellsStates(gridStr, cellIndex);
  return neighbours.includes('V');
}

function checkGridValidity() {
  const gridStr = getGridStr();
  const messages = [];

  if (!gridStr.includes('A')) {
    messages.push('La grille doit contenir une case de départ');
  }

  if (!gridStr.includes('B') || !gridStr.includes('G') || !gridStr.includes('R') || !gridStr.includes('Y')) {
    messages.push('La grille doit contenir tous les checkpoints');
  }

  for (let i = 0; i < gridSizeInCell ** 2; i += 1) {
    if (gridStr[i] !== ' ' && checkIfCellIsIsolated(gridStr, i)) messages.push(`La case ${i} est isolée`);
    if (gridStr[i] === 'D' && !checkIfDiceHasDamagePanelNeighbour(gridStr, i)) messages.push(`Le dé ${i} n'est pas entouré d'au moins 1 case "damagePanel"`);
    if (gridStr[i] === 'P' && !checkIfDamagePanelHasDiceOrDamagePanelNeighbour(gridStr, i)) messages.push(`La case "damagePanel" ${i} n'est pas entourée d'au moins 1 dé ou d'une autre case "damagePanel"`);
    if (gridStr[i] === 'V' && checkIfVerticalTeleporterHasHorizontalTeleporterNeighbour(gridStr, i)) messages.push(`Le téléporteur vertical ${i} est entouré d'un téléporteur horizontal`);
    if (gridStr[i] === 'H' && checkIfHorizontalTeleporterHasVerticalTeleporterNeighbour(gridStr, i)) messages.push(`Le téléporteur horizontal ${i} est entouré d'un téléporteur vertical`);
  }

  // Vérifier que les "dice" sont entourés d'au moins 1 case "damagePanel"

  // Vérifier que les chemins de "damagePanel" contiennent tous un "dice"

  // Vérifier que les "checkpoint" ne sont pas trop proches les uns des autres

  // Vérifier qu'il n'y ait pas de cul-de-sac

  if (messages.length === 0) {
    alert('La grille est valide !');
    console.log('La grille est valide !');
  } else {
    alert(messages.join('\n'));
    console.log(messages.join('\n'));
  }
  return messages.length === 0;
}

function loadGridByString(gridStr) {
  // remplir la grille avec les données
  gridSizeInCell = Math.sqrt(gridStr.length);
  gridSizeInput.value = gridSizeInCell;
  document.documentElement.style.setProperty('--grid-size-in-cell', gridSizeInCell);
  gridContainer.innerHTML = '';
  generateGrid();
  const gridItems = document.querySelectorAll('.grid-item');
  for (let i = 0; i < gridItems.length; i += 1) {
    gridItems[i].className = 'grid-item';

    switch (gridStr[i]) {
      case 'B': gridItems[i].classList.add('blueCheckpoint'); break;
      case 'G': gridItems[i].classList.add('greenCheckpoint'); break;
      case 'R': gridItems[i].classList.add('redCheckpoint'); break;
      case 'Y': gridItems[i].classList.add('yellowCheckpoint'); break;
      case 'D': gridItems[i].classList.add('dice'); break;
      case 'P': gridItems[i].classList.add('damagePanel'); break;
      case 'H': gridItems[i].classList.add('horizontalTeleporter'); break;
      case 'V': gridItems[i].classList.add('verticalTeleporter'); break;
      case 'O': gridItems[i].classList.add('bonusPanel'); break;
      case 'C': gridItems[i].classList.add('commandPanel'); break;
      case 'M': gridItems[i].classList.add('gpBoosterPanel'); break;
      case 'S': gridItems[i].classList.add('specialPanel'); break;
      case 'A': gridItems[i].classList.add('startPanel'); break;
      default: break;
    }
  }

  if (gridStr.includes('B')) usedCheckpoints.add('blueCheckpoint');
  if (gridStr.includes('G')) usedCheckpoints.add('greenCheckpoint');
  if (gridStr.includes('R')) usedCheckpoints.add('redCheckpoint');
  if (gridStr.includes('Y')) usedCheckpoints.add('yellowCheckpoint');
  if (gridStr.includes('A')) isStartPanelUsed = true;

  const checkpointOptions = Array.from(imageSelector.querySelectorAll('option')).filter((option) => option.value.includes('Checkpoint'));
  enableAllOptions();

  for (const checkpoint of usedCheckpoints) {
    const option = checkpointOptions.find((opt) => opt.value === checkpoint.trim());
    option.disabled = true;
  }

  if (isStartPanelUsed) {
    imageSelector.querySelector("[value='startPanel']").disabled = true;
  }

  exportList.value = 'default';
}

function importGrid() {
  const exportName = exportList.value;
  if (!exportName) return; // si l'utilisateur annule la saisie

  const gridStr = localStorage.getItem(exportName);
  if (!gridStr) {
    console.log(`Aucun export n'a été trouvé sous le nom ${exportName}`);
    return;
  }

  loadGridByString(gridStr);

  console.log(`Les données de la grille ont été importées avec succès depuis ${exportName}`);
}

function deleteExport() {
  const exportName = exportList.value;
  if (exportName === 'default') return;
  localStorage.removeItem(exportName);
  exportList.removeChild(exportList.querySelector(`[value='${exportName}']`));
  exportList.value = 'default';
}

function shiftUp() {
  const gridItems = document.querySelectorAll('.grid-item');
  const firstRowItems = Array.from(gridItems).slice(0, gridSizeInCell);

  for (let i = 0; i < firstRowItems.length; i += 1) {
    const item = firstRowItems[i];
    item.className = 'grid-item';
    gridContainer.appendChild(item);
  }
}

function shiftDown() {
  const gridItems = document.querySelectorAll('.grid-item');
  const lastRowItems = Array.from(gridItems).slice(-gridSizeInCell);

  for (let i = lastRowItems.length - 1; i >= 0; i -= 1) {
    const item = lastRowItems[i];
    item.className = 'grid-item';
    gridContainer.prepend(item);
  }
}

function shiftLeft() {
  const gridItems = document.querySelectorAll('.grid-item');
  const item = gridItems[0];
  item.className = 'grid-item';
  const leftmostItems = Array.from(gridItems).filter((i, index) => (index + 1) % gridSizeInCell === 1);
  leftmostItems.forEach(((itm) => { itm.className = 'grid-item'; }));
  gridContainer.appendChild(item);
}

function shiftRight() {
  const gridItems = document.querySelectorAll('.grid-item');
  const item = gridItems[gridItems.length - 1];
  item.className = 'grid-item';
  const rightmostItems = Array.from(gridItems).filter((i, index) => (index + 1) % gridSizeInCell === 0);
  rightmostItems.forEach(((itm) => { itm.className = 'grid-item'; }));
  gridContainer.prepend(item);
}

function onGridSizeChange(event) {
  const gridSize = event.target.value;
  gridSizeInCell = gridSize;
  document.documentElement.style.setProperty('--grid-size-in-cell', gridSize);
  gridContainer.innerHTML = '';
  generateGrid();
  enableAllOptions();
}

function onWindowQuit(event) {
  if (hasUnsavedData) {
    event.returnValue = 'Vous avez des données non enregistrées sur cette page. Êtes-vous sûr de vouloir quitter?';
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

function onPreviousHistoryState() {
  if (historyStateIndex === 0) return;
  historyStateIndex -= 1;
  if (typeof history[historyStateIndex] === 'undefined') return;
  resetImageSelector();
  loadGridByString(history[historyStateIndex]);
}

function onNextHistoryState() {
  if (historyStateIndex === history.length - 1) return;
  historyStateIndex += 1;
  if (typeof history[historyStateIndex] === 'undefined') return;
  resetImageSelector();
  loadGridByString(history[historyStateIndex]);
}

function onKeyDown(event) {
  if (event.ctrlKey && event.key === 'z') onPreviousHistoryState();
  if (event.ctrlKey && event.key === 'y') onNextHistoryState();
}

function generateNewGameGrid() {
  resetGrid();

  const gridItems = document.querySelectorAll('.grid-item');
  gridItems.forEach((item) => {
    item.className = 'grid-item';
  });

  const gridItemsArray = Array.from(gridItems);
  const randomIndex = Math.floor(Math.random() * gridItemsArray.length);
  gridItemsArray[randomIndex].classList.add('startPanel');

  const randomCheckpointIndex = Math.floor(Math.random() * gridItemsArray.length);
  gridItemsArray[randomCheckpointIndex].classList.add('blueCheckpoint');

  const randomCheckpointIndex2 = Math.floor(Math.random() * gridItemsArray.length);
  gridItemsArray[randomCheckpointIndex2].classList.add('greenCheckpoint');

  const randomCheckpointIndex3 = Math.floor(Math.random() * gridItemsArray.length);
  gridItemsArray[randomCheckpointIndex3].classList.add('redCheckpoint');

  const randomCheckpointIndex4 = Math.floor(Math.random() * gridItemsArray.length);
  gridItemsArray[randomCheckpointIndex4].classList.add('yellowCheckpoint');
}

gridSizeInput.value = gridSizeInCell;
gridSizeInput.addEventListener('change', onGridSizeChange);
exportButton.addEventListener('click', exportGrid);
resetButton.addEventListener('click', resetGrid);
checkValidity.addEventListener('click', checkGridValidity);
generateGameGrid.addEventListener('click', generateNewGameGrid);
importButton.addEventListener('click', importGrid);
deleteExportButton.addEventListener('click', deleteExport);
upButton.addEventListener('click', shiftUp);
downButton.addEventListener('click', shiftDown);
leftButton.addEventListener('click', shiftLeft);
rightButton.addEventListener('click', shiftRight);
imageSelector.addEventListener('change', onImageSelect);
window.addEventListener('beforeunload', onWindowQuit);
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('mouseleave', onMouseLeave);
document.addEventListener('dragstart', onDrag);
document.addEventListener('dragover', onDrag);
document.addEventListener('keydown', onKeyDown);

generateGrid();
refreshExportList();
addHistoryState();
