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
const saveButton = document.querySelector('#save-button');
const loadButton = document.querySelector('#load-button');
const savedBoardsList = document.querySelector('#saved-boards-list');
const deleteSavedBoardButton = document.querySelector('#delete-saved-board-button');
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

// Mapping between cell class and cell data
const cellClassToDataMap = {
  blueCheckpoint: { type: 'checkpoint', color: 'blue' },
  greenCheckpoint: { type: 'checkpoint', color: 'green' },
  redCheckpoint: { type: 'checkpoint', color: 'red' },
  yellowCheckpoint: { type: 'checkpoint', color: 'yellow' },
  dice: { type: 'damage', hasDice: true },
  damagePanel: { type: 'damage', noBox: true },
  horizontalTeleporter: { type: 'teleporter', direction: 'horizontal' },
  verticalTeleporter: { type: 'teleporter', direction: 'vertical' },
  bonusPanel: { type: 'bonus' },
  commandPanel: { type: 'command' },
  gpBoosterPanel: { type: 'booster' },
  specialPanel: { type: 'special' },
  startPanel: { type: 'start' },
  empty: {},
};

// Reverse mapping for data to class conversion
const cellDataToClassMap = {
  checkpoint: {
    blue: 'blueCheckpoint',
    green: 'greenCheckpoint',
    red: 'redCheckpoint',
    yellow: 'yellowCheckpoint',
  },
  damage: {
    hasDice: 'dice',
    noBox: 'damagePanel',
  },
  teleporter: {
    horizontal: 'horizontalTeleporter',
    vertical: 'verticalTeleporter',
  },
  bonus: 'bonusPanel',
  command: 'commandPanel',
  booster: 'gpBoosterPanel',
  special: 'specialPanel',
  start: 'startPanel',
};

function updateBoardButtonsState() {
  const isBoardSelected = savedBoardsList.value !== 'default';
  loadButton.disabled = !isBoardSelected;
  deleteSavedBoardButton.disabled = !isBoardSelected;
}

function refreshSavedBoardsList() {
  savedBoardsList.innerHTML = '';

  let savedBoardOption = document.createElement('option');
  savedBoardOption.value = 'default';
  savedBoardOption.selected = true;
  savedBoardOption.innerHTML = '';
  savedBoardsList.appendChild(savedBoardOption);

  const boards = JSON.parse(localStorage.getItem('boards')) || {};
  for (const board in boards) {
    savedBoardOption = document.createElement('option');
    savedBoardOption.value = board;
    savedBoardOption.innerHTML = board;
    savedBoardsList.appendChild(savedBoardOption);
  }

  updateBoardButtonsState();
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

// Get the board data in JSON format
function getBoardData() {
  const boardData = [];
  const cells = document.querySelectorAll('.grid-item');

  // Create a 2D array structure
  for (let row = 0; row < gridSizeInCell; row += 1) {
    const rowData = [];
    for (let col = 0; col < gridSizeInCell; col += 1) {
      const cellIndex = row * gridSizeInCell + col;
      const cell = cells[cellIndex];

      // Convert cell class to data object
      let cellData = {};

      // Check for each possible cell class
      for (const [className, dataObj] of Object.entries(cellClassToDataMap)) {
        if (cell.classList.contains(className)) {
          cellData = JSON.parse(JSON.stringify(dataObj)); // Deep copy
          break;
        }
      }

      rowData.push(cellData);
    }
    boardData.push(rowData);
  }

  return boardData;
}

// Function to get a flattened string representation for history tracking
function getBoardDataString() {
  const boardData = getBoardData();
  return JSON.stringify(boardData);
}

function addHistoryState() {
  const boardDataString = getBoardDataString();
  if (history[history.length - 1] === boardDataString) return;

  if (history.length > 0 && historyStateIndex !== history.length - 1) {
    history.splice(historyStateIndex + 1, history.length - historyStateIndex);
  }
  history.push(boardDataString);
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

function saveGrid() {
  const boardName = prompt('Enter a board name : ');
  if (!boardName) return;

  const boards = JSON.parse(localStorage.getItem('boards')) || {};

  if (boards[boardName] !== undefined) {
    const overwrite = confirm(`A board with the name ${boardName} already exists. Do you want to overwrite it?`);
    if (!overwrite) return;
    savedBoardsList.querySelectorAll(`[value='${boardName}']`)[0].remove();
  }

  boards[boardName] = getBoardData();
  localStorage.setItem('boards', JSON.stringify(boards));

  const option = document.createElement('option');
  option.value = boardName;
  option.innerHTML = boardName;
  savedBoardsList.appendChild(option);

  console.log(`The grid data has been successfully saved under the name ${boardName}`);
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
  savedBoardsList.value = 'default';
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

// For validation purposes, we need to represent the board as a flat array
function flattenBoardData(boardData) {
  const flattened = [];
  for (const row of boardData) {
    for (const cell of row) {
      let cellCode = ' ';
      if (cell.type === 'checkpoint') {
        if (cell.color === 'blue') cellCode = 'B';
        else if (cell.color === 'green') cellCode = 'G';
        else if (cell.color === 'red') cellCode = 'R';
        else if (cell.color === 'yellow') cellCode = 'Y';
      } else if (cell.type === 'damage') {
        if (cell.hasDice) cellCode = 'D';
        else cellCode = 'P';
      } else if (cell.type === 'teleporter') {
        if (cell.direction === 'horizontal') cellCode = 'H';
        else cellCode = 'V';
      } else if (cell.type === 'bonus') cellCode = 'O';
      else if (cell.type === 'command') cellCode = 'C';
      else if (cell.type === 'booster') cellCode = 'M';
      else if (cell.type === 'special') cellCode = 'S';
      else if (cell.type === 'start') cellCode = 'A';

      flattened.push(cellCode);
    }
  }
  return flattened;
}

function getNeighbourCellsStates(flatBoard, cellIndex) {
  const neighboursIndexes = getNeighbourCellsIndexes(cellIndex);
  const neighbourCellsStates = [' ', ' ', ' ', ' '];
  neighbourCellsStates[0] = flatBoard[neighboursIndexes[0]] || ' ';
  neighbourCellsStates[1] = flatBoard[neighboursIndexes[1]] || ' ';
  neighbourCellsStates[2] = flatBoard[neighboursIndexes[2]] || ' ';
  neighbourCellsStates[3] = flatBoard[neighboursIndexes[3]] || ' ';

  return neighbourCellsStates;
}

function checkIfCellIsIsolated(flatBoard, cellIndex) {
  const neighbours = getNeighbourCellsStates(flatBoard, cellIndex).filter((neighbour) => neighbour !== ' ');
  return neighbours.length < 2;
}

function checkIfDiceHasDamagePanelNeighbour(flatBoard, cellIndex) {
  const neighbours = getNeighbourCellsStates(flatBoard, cellIndex);
  return neighbours.includes('P');
}

function checkIfDamagePanelHasDiceOrDamagePanelNeighbour(flatBoard, cellIndex) {
  const neighbours = getNeighbourCellsStates(flatBoard, cellIndex);
  return neighbours.includes('D') || neighbours.includes('P');
}

function checkIfVerticalTeleporterHasHorizontalTeleporterNeighbour(flatBoard, cellIndex) {
  const neighbours = getNeighbourCellsStates(flatBoard, cellIndex);
  return neighbours.includes('H');
}

function checkIfHorizontalTeleporterHasVerticalTeleporterNeighbour(flatBoard, cellIndex) {
  const neighbours = getNeighbourCellsStates(flatBoard, cellIndex);
  return neighbours.includes('V');
}

function checkGridValidity() {
  const boardData = getBoardData();
  const flatBoard = flattenBoardData(boardData);
  const messages = [];

  if (!flatBoard.includes('A')) {
    messages.push('The grid must contain a start cell');
  }

  if (!flatBoard.includes('B') || !flatBoard.includes('G') || !flatBoard.includes('R') || !flatBoard.includes('Y')) {
    messages.push('The grid must contain all checkpoints');
  }

  for (let i = 0; i < gridSizeInCell ** 2; i += 1) {
    if (flatBoard[i] !== ' ' && checkIfCellIsIsolated(flatBoard, i)) messages.push(`Cell ${i} is isolated`);
    if (flatBoard[i] === 'D' && !checkIfDiceHasDamagePanelNeighbour(flatBoard, i)) messages.push(`Dice ${i} is not surrounded by at least one "damagePanel" cell`);
    if (flatBoard[i] === 'P' && !checkIfDamagePanelHasDiceOrDamagePanelNeighbour(flatBoard, i)) messages.push(`"DamagePanel" cell ${i} is not surrounded by at least one dice or another "damagePanel" cell`);
    if (flatBoard[i] === 'V' && checkIfVerticalTeleporterHasHorizontalTeleporterNeighbour(flatBoard, i)) messages.push(`Vertical teleporter ${i} is surrounded by a horizontal teleporter`);
    if (flatBoard[i] === 'H' && checkIfHorizontalTeleporterHasVerticalTeleporterNeighbour(flatBoard, i)) messages.push(`Horizontal teleporter ${i} is surrounded by a vertical teleporter`);
  }

  if (messages.length === 0) {
    alert('The grid is valid!');
    console.log('The grid is valid!');
  } else {
    alert(messages.join('\n'));
    console.log(messages.join('\n'));
  }
  return messages.length === 0;
}

function loadBoardData(boardData) {
  // Reset the grid size if needed
  if (boardData.length !== gridSizeInCell) {
    gridSizeInCell = boardData.length;
    gridSizeInput.value = gridSizeInCell;
    document.documentElement.style.setProperty('--grid-size-in-cell', gridSizeInCell);
    gridContainer.innerHTML = '';
    generateGrid();
  }

  const gridItems = document.querySelectorAll('.grid-item');

  // Reset all cells
  usedCheckpoints.clear();
  isStartPanelUsed = false;

  // Load data into cells
  for (let row = 0; row < boardData.length; row += 1) {
    for (let col = 0; col < boardData[row].length; col += 1) {
      const cellIndex = row * gridSizeInCell + col;

      if (cellIndex >= gridItems.length) continue;

      const cell = gridItems[cellIndex];
      const cellData = boardData[row][col];

      // Reset cell
      cell.className = 'grid-item';

      // Skip empty cells
      if (!cellData || Object.keys(cellData).length === 0) continue;

      // Apply the appropriate class based on the cell type
      if (cellData.type === 'checkpoint') {
        const checkpointClass = cellDataToClassMap.checkpoint[cellData.color];
        cell.classList.add(checkpointClass);
        usedCheckpoints.add(checkpointClass);
      } else if (cellData.type === 'damage') {
        if (cellData.hasDice) {
          cell.classList.add('dice');
        } else if (cellData.noBox) {
          cell.classList.add('damagePanel');
        }
      } else if (cellData.type === 'teleporter') {
        const teleporterClass = cellDataToClassMap.teleporter[cellData.direction];
        cell.classList.add(teleporterClass);
      } else if (cellData.type === 'start') {
        cell.classList.add('startPanel');
        isStartPanelUsed = true;
      } else {
        const className = cellDataToClassMap[cellData.type];
        if (className) {
          cell.classList.add(className);
        }
      }
    }
  }

  // Disable used checkpoints in selector
  enableAllOptions();
  for (const checkpoint of usedCheckpoints) {
    imageSelector.querySelector(`[value='${checkpoint}']`).disabled = true;
  }

  // Disable start panel if used
  if (isStartPanelUsed) {
    imageSelector.querySelector("[value='startPanel']").disabled = true;
  }
}

function loadBoard() {
  const boardName = savedBoardsList.value;
  if (!boardName || boardName === 'default') return;

  const boards = JSON.parse(localStorage.getItem('boards')) || {};
  const boardData = boards[boardName];
  if (!boardData) {
    console.log(`No board found with the name ${boardName}`);
    return;
  }

  loadBoardData(boardData);
  savedBoardsList.value = 'default';
  updateBoardButtonsState();
  resetHistory();
  addHistoryState();

  console.log(`The grid data has been successfully loaded from ${boardName}`);
}

function deleteBoard() {
  const boardName = savedBoardsList.value;
  if (boardName === 'default') return;

  const boards = JSON.parse(localStorage.getItem('boards')) || {};
  delete boards[boardName];
  localStorage.setItem('boards', JSON.stringify(boards));

  savedBoardsList.removeChild(savedBoardsList.querySelector(`[value='${boardName}']`));
  savedBoardsList.value = 'default';
}

function shiftUp() {
  const gridItems = document.querySelectorAll('.grid-item');
  const firstRowItems = Array.from(gridItems).slice(0, gridSizeInCell);

  for (let i = 0; i < firstRowItems.length; i += 1) {
    const item = firstRowItems[i];
    item.className = 'grid-item';
    gridContainer.appendChild(item);
  }
  addHistoryState();
}

function shiftDown() {
  const gridItems = document.querySelectorAll('.grid-item');
  const lastRowItems = Array.from(gridItems).slice(-gridSizeInCell);

  for (let i = lastRowItems.length - 1; i >= 0; i -= 1) {
    const item = lastRowItems[i];
    item.className = 'grid-item';
    gridContainer.prepend(item);
  }
  addHistoryState();
}

function shiftLeft() {
  const gridItems = document.querySelectorAll('.grid-item');
  const leftmostItems = Array.from(gridItems).filter((_, index) => index % gridSizeInCell === 0);

  for (let i = 0; i < leftmostItems.length; i += 1) {
    const item = leftmostItems[i];
    item.className = 'grid-item';
    gridContainer.appendChild(item);
  }
  addHistoryState();
}

function shiftRight() {
  const gridItems = document.querySelectorAll('.grid-item');
  const rightmostItems = Array.from(gridItems).filter((_, index) => (index + 1) % gridSizeInCell === 0);

  for (let i = 0; i < rightmostItems.length; i += 1) {
    const item = rightmostItems[i];
    item.className = 'grid-item';
    gridContainer.prepend(item);
  }
  addHistoryState();
}

function onGridSizeChange(event) {
  const newGridSize = parseInt(event.target.value, 10);
  const currentBoardData = getBoardData();

  gridSizeInCell = newGridSize;
  document.documentElement.style.setProperty('--grid-size-in-cell', newGridSize);
  gridContainer.innerHTML = '';
  generateGrid();

  // Create new board data with the new size
  const newBoardData = [];
  for (let row = 0; row < newGridSize; row += 1) {
    const rowData = [];
    for (let col = 0; col < newGridSize; col += 1) {
      if (row < currentBoardData.length && col < currentBoardData[row].length) {
        rowData.push(currentBoardData[row][col]);
      } else {
        rowData.push({});
      }
    }
    newBoardData.push(rowData);
  }

  loadBoardData(newBoardData);
  addHistoryState();
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

  const boardData = JSON.parse(history[historyStateIndex]);
  resetImageSelector();
  loadBoardData(boardData);
}

function onNextHistoryState() {
  if (historyStateIndex === history.length - 1) return;
  historyStateIndex += 1;

  if (typeof history[historyStateIndex] === 'undefined') return;

  const boardData = JSON.parse(history[historyStateIndex]);
  resetImageSelector();
  loadBoardData(boardData);
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

  // Add start panel
  const randomIndex = Math.floor(Math.random() * gridItemsArray.length);
  gridItemsArray[randomIndex].classList.add('startPanel');

  // Add checkpoints
  const checkpoints = ['blueCheckpoint', 'greenCheckpoint', 'redCheckpoint', 'yellowCheckpoint'];

  for (const checkpoint of checkpoints) {
    let randomCheckpointIndex;
    do {
      randomCheckpointIndex = Math.floor(Math.random() * gridItemsArray.length);
    } while (
      gridItemsArray[randomCheckpointIndex].classList.contains('startPanel')
      || gridItemsArray[randomCheckpointIndex].classList.contains('blueCheckpoint')
      || gridItemsArray[randomCheckpointIndex].classList.contains('greenCheckpoint')
      || gridItemsArray[randomCheckpointIndex].classList.contains('redCheckpoint')
      || gridItemsArray[randomCheckpointIndex].classList.contains('yellowCheckpoint')
    );

    gridItemsArray[randomCheckpointIndex].classList.add(checkpoint);
    usedCheckpoints.add(checkpoint);
  }

  // Update the image selector
  enableAllOptions();
  for (const checkpoint of usedCheckpoints) {
    imageSelector.querySelector(`[value='${checkpoint}']`).disabled = true;
  }
  imageSelector.querySelector("[value='startPanel']").disabled = true;

  addHistoryState();
}

// Initialize the editor
gridSizeInput.value = gridSizeInCell;
gridSizeInput.addEventListener('change', onGridSizeChange);
saveButton.addEventListener('click', saveGrid);
resetButton.addEventListener('click', resetGrid);
checkValidity.addEventListener('click', checkGridValidity);
generateGameGrid.addEventListener('click', generateNewGameGrid);
loadButton.addEventListener('click', loadBoard);
deleteSavedBoardButton.addEventListener('click', deleteBoard);
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
savedBoardsList.addEventListener('change', updateBoardButtonsState);

generateGrid();
refreshSavedBoardsList();
addHistoryState();
