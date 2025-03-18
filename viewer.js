function createFace(type) {
  const face = document.createElement('div');
  // face.innerText = type;
  face.className = `face ${type}`; // Add the type to the class list
  return face;
}

function setupCellInteractions() {
  const cells = document.querySelectorAll('.board .cell');
  const board = document.querySelector('.board');
  const boardRect = board.getBoundingClientRect();
  const boardWidth = boardRect.width;
  const boardHeight = boardRect.height;

  const firstCell = cells[0];

  // Calculate dimensions
  const totalCols = getComputedStyle(firstCell.parentElement).gridTemplateColumns.split(' ').length;
  const totalRows = getComputedStyle(firstCell.parentElement).gridTemplateRows.split(' ').length;

  // Calculate actual cell dimensions
  const cellRect = firstCell.getBoundingClientRect();
  const cellWidth = cellRect.width;
  const cellHeight = cellRect.height;

  cells.forEach((cell, index) => {
    if (cell.classList.contains('empty')) return;

    cell.addEventListener('click', () => {
      // Remove selection from other cells
      document.querySelectorAll('.board .cell.selected').forEach((selectedCell) => {
        selectedCell.classList.remove('selected');
      });

      // Add selection to clicked cell
      cell.classList.add('selected');

      // Calculate position
      const row = Math.floor(index / totalCols);
      const col = index % totalCols;

      // Calculate center offset using actual cell dimensions
      const offsetX = (col * (cellWidth + 10) + cellWidth / 2);
      const offsetY = (row * (cellHeight + 10) + cellHeight / 2);

      // transform: perspective(1000px) translateX(var(--translateX)) translateY(var(--translateY));
      document.querySelector('#view').style.setProperty('transform', `perspective(1000px) rotateX(60deg) translateX(${-offsetX}px) translateY(${-offsetY}px)`);
    });
  });
}

// Add keyboard navigation function
function setupKeyboardNavigation() {
  // Get board dimensions
  const board = document.querySelector('.board');
  const totalCols = getComputedStyle(board).gridTemplateColumns.split(' ').length;
  const totalRows = getComputedStyle(board).gridTemplateRows.split(' ').length;

  // Listen for keyboard events
  document.addEventListener('keydown', (event) => {
    // Find currently selected cell
    const currentSelected = document.querySelector('.board .cell.selected');
    if (!currentSelected) return;

    // Get all cells as an array to find current index
    const allCells = Array.from(document.querySelectorAll('.board .cell'));
    const currentIndex = allCells.indexOf(currentSelected);

    // Calculate current position
    const currentRow = Math.floor(currentIndex / totalCols);
    const currentCol = currentIndex % totalCols;

    let newRow = currentRow;
    let newCol = currentCol;

    // Determine which direction to move based on key press
    switch (event.key) {
      case 'ArrowUp':
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(totalRows - 1, currentRow + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(totalCols - 1, currentCol + 1);
        break;
      default:
        return; // Exit if not an arrow key
    }

    // Calculate new index
    const newIndex = newRow * totalCols + newCol;

    // Check if the new index is valid and not an empty cell
    if (newIndex >= 0 && newIndex < allCells.length) {
      const targetCell = allCells[newIndex];

      // Only select if not empty
      if (!targetCell.classList.contains('empty')) {
        // Remove selection from current
        currentSelected.classList.remove('selected');

        // Add selection to new cell
        targetCell.classList.add('selected');

        // Simulate a click to center the view
        targetCell.click();
      }
    }

    // Prevent default arrow key behavior (like scrolling the page)
    event.preventDefault();
  });
}

function generateBoardFromJSON(boardData) {
  const board = document.querySelector('.board');

  // Get dimensions from the board data
  const rows = boardData.length;
  const cols = Math.max(...boardData.map((row) => row.length));

  // Set the grid template based on the dimensions
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  // Clear existing board
  board.innerHTML = '';

  // Generate cells
  boardData.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellElement = document.createElement('div');
      cellElement.className = 'cell';

      // Empty cell
      if (!cell || Object.keys(cell).length === 0) {
        cellElement.classList.add('empty');
      } else {
        // Apply cell type
        if (cell.type) {
          switch (cell.type) {
            case 'checkpoint':
              cellElement.classList.add(`t-${cell.color}-checkpoint`);
              break;
            case 'teleporter':
              cellElement.classList.add(`t-${cell.direction}-teleporter`);
              break;
            case 'start':
              cellElement.classList.add('t-start-panel');
              cellElement.classList.add('selected'); // Auto-select start panel
              break;
            case 'special':
              cellElement.classList.add('t-special-panel');
              break;
            case 'booster':
              cellElement.classList.add('t-gp-booster-panel');
              break;
            case 'damage':
              // Add additional properties
              if (cell.hasDice) {
                cellElement.classList.add('t-dice');
              } else {
                cellElement.classList.add('t-damage-panel');
                cellElement.classList.add('no-box');
              }
              break;
            case 'command':
              // Handle colored command panels (1-16)
              if (cell.color) {
                cellElement.classList.add(`t-colored-command-panel-${cell.color}`);
              } else {
                cellElement.classList.add('t-command-panel');
              }

              if (cell.starred) {
                cellElement.classList.add('starred');
              }
              break;
            case 'bonus':
              cellElement.classList.add('t-bonus-panel');
              break;
            default:
              break;
          }
        }

        // Create faces for 3D box
        cellElement.appendChild(createFace('Xplus'));
        cellElement.appendChild(createFace('Xminus'));
        cellElement.appendChild(createFace('Yplus'));
        cellElement.appendChild(createFace('Yminus'));
        cellElement.appendChild(createFace('Zplus'));
        cellElement.appendChild(createFace('Zminus'));
      }

      board.appendChild(cellElement);
    });
  });

  // Setup cell selection and centering
  setupCellInteractions();
  setupKeyboardNavigation();
}

// Function to load a board from localStorage by name
function loadBoardByName(boardName) {
  if (!boardName) return false;

  try {
    // Get all saved boards from localStorage
    const boards = JSON.parse(localStorage.getItem('boards')) || {};

    // Check if the requested board exists
    if (!boards[boardName]) {
      console.error(`Board "${boardName}" not found in localStorage`);
      return false;
    }

    // Load the board
    const boardData = boards[boardName];

    // Check if the board data is in the old string format and needs conversion
    if (typeof boardData === 'string') {
      console.warn(`Board "${boardName}" is in legacy string format. Consider updating to JSON format.`);
      // You could add a conversion function here if needed
      return false;
    }

    // Generate the board from JSON data
    generateBoardFromJSON(boardData);
    console.log(`Successfully loaded board "${boardName}" from localStorage`);

    return true;
  } catch (error) {
    console.error(`Error loading board "${boardName}":`, error);
    return false;
  }
}

// Function to parse URL parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Define the default keyblade board in JSON format
const keybladeBoard = [
  [{}, {}, {}, {}, {}, { type: 'damage', noBox: true }, { type: 'damage', noBox: true }, { type: 'damage', hasDice: true }, { type: 'checkpoint', color: 'blue' }, {}, {}, {}, {}, {}, {}],
  [{ type: 'command', color: '1', starred: true }, { type: 'command', color: '2' }, { type: 'command', color: '2', starred: true }, {}, {}, { type: 'damage', noBox: true }, {}, {}, { type: 'command', color: '5' }, {}, {}, {}, {}, {}, {}],
  [{ type: 'command', color: '1' }, {}, { type: 'command', color: '2' }, { type: 'teleporter', direction: 'horizontal' }, { type: 'teleporter', direction: 'horizontal' }, { type: 'command', color: '3' }, {}, {}, { type: 'start' }, { type: 'command', color: '5' }, { type: 'command', color: '5', starred: true }, { type: 'booster' }, { type: 'damage', hasDice: true }, { type: 'special' }, { type: 'checkpoint', color: 'red' }],
  [{ type: 'checkpoint', color: 'green' }, { type: 'command', color: '1' }, { type: 'special' }, {}, {}, { type: 'command', color: '3' }, {}, {}, { type: 'command', color: '5' }, {}, {}, {}, { type: 'damage', noBox: true }, {}, { type: 'damage', noBox: true }],
  [{}, {}, {}, {}, {}, { type: 'checkpoint', color: 'yellow' }, { type: 'command', color: '4' }, { type: 'command', color: '4' }, { type: 'command', color: '4', starred: true }, {}, {}, {}, { type: 'damage', noBox: true }, { type: 'damage', noBox: true }, { type: 'damage', noBox: true }],
];

// Initialize function that runs when the page loads
function initBoard() {
  // Check if a board name is specified in the URL
  const boardNameFromUrl = getUrlParameter('board');

  if (boardNameFromUrl) {
    // Try to load the board from localStorage
    const loadedSuccessfully = loadBoardByName(boardNameFromUrl);

    // If the board was not found or loading failed, load the default board
    if (!loadedSuccessfully) {
      console.warn(`Could not load board "${boardNameFromUrl}", using default board instead`);
      generateBoardFromJSON(keybladeBoard);
    }
  } else {
    // No board specified in URL, load the default board
    generateBoardFromJSON(keybladeBoard);
  }

  // Center on the start panel (with a slight delay to ensure DOM is ready)
  setTimeout(() => {
    const startCell = document.querySelector('.board .cell.t-start-panel');
    if (startCell) startCell.click();
  }, 100);
}

// Run the initialization when the page loads
document.addEventListener('DOMContentLoaded', initBoard);
