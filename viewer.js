const cameraTilt = 60; // In degrees
let cameraPan = 0;

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
      document.querySelector('#view').style.setProperty('transform', `perspective(1000px) rotateX(${cameraTilt}deg) rotateZ(${cameraPan}deg) translateX(${-offsetX}px) translateY(${-offsetY}px)`);
    });
  });
}

// Function to update the camera view with current parameters
function updateCameraView(offsetX, offsetY) {
  document.querySelector('#view').style.setProperty('transform',
    `perspective(1000px) rotateX(${cameraTilt}deg) rotateZ(${cameraPan}deg) translateX(${-offsetX}px) translateY(${-offsetY}px)`);
}

// Function to handle movement with teleportation
function moveWithTeleportation(currentIndex, initialNewRow, initialNewCol, direction, allCells, totalCols, totalRows) {
  let newRow = initialNewRow;
  let newCol = initialNewCol;
  let newIndex = newRow * totalCols + newCol;
  let isTeleporter = false;
  const maxIterations = 50; // Safety limit to prevent infinite loops
  let iterations = 0;

  do {
    // Check if the new index is valid and not an empty cell
    if (newIndex >= 0 && newIndex < allCells.length) {
      const targetCell = allCells[newIndex];

      // Check if it's a teleporter
      isTeleporter = targetCell.classList.contains('t-horizontal-teleporter')
                     || targetCell.classList.contains('t-vertical-teleporter');

      // If it's not a teleporter or not a valid cell, break the loop
      if (!isTeleporter || targetCell.classList.contains('empty')) {
        // Only select if not empty
        if (!targetCell.classList.contains('empty')) {
          // Remove selection from current
          const currentSelected = document.querySelector('.board .cell.selected');
          if (currentSelected) {
            currentSelected.classList.remove('selected');
          }

          // Add selection to new cell
          targetCell.classList.add('selected');

          // Simulate a click to center the view
          targetCell.click();
        }
        break;
      }

      // It's a teleporter, so continue in the same direction
      switch (direction) {
        case 'up':
          newRow = Math.max(0, newRow - 1);
          break;
        case 'down':
          newRow = Math.min(totalRows - 1, newRow + 1);
          break;
        case 'left':
          newCol = Math.max(0, newCol - 1);
          break;
        case 'right':
          newCol = Math.min(totalCols - 1, newCol + 1);
          break;
        default:
          break; // No valid direction
      }

      // Calculate new index
      newIndex = newRow * totalCols + newCol;
    } else {
      // Out of bounds
      break;
    }

    iterations += 1;
  } while (isTeleporter && iterations < maxIterations);
}

// Add keyboard navigation function
function setupKeyboardNavigation() { // Get board dimensions
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
    let direction = '';

    // Find the dice container that references the current cell, if any
    const diceContainer = document.querySelector(`.dice-container[data-reference-element="${currentSelected.id}"]`);
    const diceElement = diceContainer ? diceContainer.querySelector('.cell.t-dice') : null;
    const diceX = diceContainer ? parseInt(diceContainer.getAttribute('data-x') || 0, 10) : 0;
    const diceY = diceContainer ? parseInt(diceContainer.getAttribute('data-y') || 0, 10) : 0;

    // Determine which direction to move based on key press
    switch (event.key) {
      case 'ArrowUp':
        newRow = Math.max(0, currentRow - 1);
        direction = 'up';
        break;
      case 'ArrowDown':
        newRow = Math.min(totalRows - 1, currentRow + 1);
        direction = 'down';
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, currentCol - 1);
        direction = 'left';
        break;
      case 'ArrowRight':
        newCol = Math.min(totalCols - 1, currentCol + 1);
        direction = 'right';
        break;
      default:
        return; // Exit if not a recognized key
    }

    // Move and handle teleporters
    moveWithTeleportation(currentIndex, newRow, newCol, direction, allCells, totalCols, totalRows);

    // Handle dice movement if it exists and we're moving to a damage panel
    if (diceContainer) {
      const newlySelected = document.querySelector('.board .cell.selected');
      if (!newlySelected) return;
      if (newlySelected.id === currentSelected.id) return;
      if (!newlySelected.classList.contains('t-damage-panel')) return;

      // Calculate new position for the dice
      let newDiceX = diceX;
      let newDiceY = diceY;

      switch (direction) {
        case 'up':
          newDiceY = diceY - 1;
          break;
        case 'down':
          newDiceY = diceY + 1;
          break;
        case 'left':
          newDiceX = diceX - 1;
          break;
        case 'right':
          newDiceX = diceX + 1;
          break;
        default:
          break; // No valid direction
      }

      // Update dice container attributes
      diceContainer.setAttribute('data-x', newDiceX);
      diceContainer.setAttribute('data-y', newDiceY);
      diceContainer.setAttribute('data-reference-element', newlySelected.id);

      // Ajouter une petite animation pour le mouvement
      diceContainer.classList.add('moving');

      const removeAllRotationClasses = () => {
        diceElement.classList.remove('rotatingTowardsXPlus');
        diceElement.classList.remove('rotatingTowardsXMinus');
        diceElement.classList.remove('rotatingTowardsYPlus');
        diceElement.classList.remove('rotatingTowardsYMinus');
      };

      const removeAllWillRotateClasses = () => {
        diceElement.classList.remove('willRotateTowardsXPlus');
        diceElement.classList.remove('willRotateTowardsXMinus');
        diceElement.classList.remove('willRotateTowardsYPlus');
        diceElement.classList.remove('willRotateTowardsYMinus');
      };

      removeAllRotationClasses();
      removeAllWillRotateClasses();

      switch (direction) {
        case 'up':
          diceElement.classList.add('willRotateTowardsYMinus');
          diceElement.classList.add('rotatingTowardsYMinus');
          break;
        case 'down':
          diceElement.classList.add('willRotateTowardsYPlus');
          diceElement.classList.add('rotatingTowardsYPlus');
          break;
        case 'left':
          diceElement.classList.add('willRotateTowardsXMinus');
          diceElement.classList.add('rotatingTowardsXMinus');
          break;
        case 'right':
          diceElement.classList.add('willRotateTowardsXPlus');
          diceElement.classList.add('rotatingTowardsXPlus');
          break;
        default:
          break; // No valid direction
      }

      // Supprimer la classe après l'animation
      setTimeout(() => {
        diceContainer.classList.remove('moving');
        removeAllRotationClasses();
      }, 300);
    }

    // Prevent default arrow key behavior (like scrolling the page)
    event.preventDefault();
  });
}

// Add mouse wheel rotation functionality
function setupMouseWheelRotation() {
  let isMiddleButtonPressed = false;
  const view = document.querySelector('#view');

  // Fonction utilitaire pour extraire les valeurs de translation de la propriété transform
  function extractTranslateValues(transformString) {
    const translateXMatch = transformString.match(/translateX\(([-\d.]+)px\)/);
    const translateYMatch = transformString.match(/translateY\(([-\d.]+)px\)/);

    return {
      x: translateXMatch ? parseFloat(translateXMatch[1]) : 0,
      y: translateYMatch ? parseFloat(translateYMatch[1]) : 0,
    };
  }

  // Fonction pour mettre à jour la vue de la caméra avec les valeurs actuelles
  function updateViewWithRotation() {
    const currentTransform = view.style.transform || '';
    const { x, y } = extractTranslateValues(currentTransform);

    // Normaliser cameraPan entre 0 et 360 degrés
    cameraPan = ((cameraPan % 360) + 360) % 360;

    updateCameraView(x, y);
  }

  // Gestion du clic du bouton central de la souris
  document.addEventListener('mousedown', (event) => {
    if (event.button === 1) { // Bouton central (molette)
      isMiddleButtonPressed = true;
      event.preventDefault(); // Empêcher le comportement par défaut
    }
  });

  // Gestion du relâchement du bouton
  document.addEventListener('mouseup', (event) => {
    if (event.button === 1) {
      isMiddleButtonPressed = false;
    }
  });

  // S'assurer que le drapeau est réinitialisé si la souris quitte la fenêtre
  document.addEventListener('mouseleave', () => {
    isMiddleButtonPressed = false;
  });

  // Gestion du mouvement de la souris pour la rotation
  document.addEventListener('mousemove', (event) => {
    if (!isMiddleButtonPressed) return;

    // Calculer le changement de position de la souris
    const deltaX = -event.movementX;

    // Ajuster la rotation de la caméra avec une sensibilité réglable
    const sensitivity = 0.5;
    const maxDelta = 2; // Limite maximale pour éviter une rotation trop rapide
    const clampedDeltaX = Math.max(-maxDelta, Math.min(deltaX, maxDelta));
    cameraPan += clampedDeltaX * sensitivity;

    // Mettre à jour l'affichage
    const currentSelected = document.querySelector('.board .cell.selected');
    if (currentSelected) {
      // Si une cellule est sélectionnée, déclencher un clic pour mettre à jour la vue
      currentSelected.click();
    } else {
      // Sinon, mettre à jour directement avec les valeurs de translation actuelles
      updateViewWithRotation();
    }
  });
}

function createFaces(element) {
  element.appendChild(createFace('Xplus'));
  element.appendChild(createFace('Xminus'));
  element.appendChild(createFace('Yplus'));
  element.appendChild(createFace('Yminus'));
  element.appendChild(createFace('Zplus'));
  element.appendChild(createFace('Zminus'));
}

function createDice(dice) {
// Créer le conteneur du dé
  const diceContainer = document.createElement('div');
  diceContainer.classList.add('dice-container');

  // Créer l'élément du dé lui-même
  const diceElement = document.createElement('div');
  diceElement.classList.add('cell');
  diceElement.classList.add('t-dice');

  const cellElement = dice.refElement;
  const cellRect = cellElement.getBoundingClientRect();
  const cellWidth = cellRect.width;
  const cellHeight = cellRect.height;
  const cellRow = dice.row;
  const cellCol = dice.col;
  const translateX = cellCol * (cellWidth + 10) + cellWidth / 2 - cellWidth / 2;
  const translateY = cellRow * (cellHeight + 10) + cellHeight / 2 - cellHeight / 2;

  // Attribuer les données au conteneur
  diceContainer.setAttribute('data-reference-element', cellElement.id);
  diceContainer.setAttribute('data-x', dice.x || 0);
  diceContainer.setAttribute('data-y', dice.y || 0);

  // Définir la transformation pour le conteneur
  diceContainer.style.transform = `translate(calc(${translateX}px + (attr(data-x type(<number>), 0) * (var(--cell-size) + var(--grid-gap)))), calc(${translateY}px + (attr(data-y type(<number>), 0) * (var(--cell-size) + var(--grid-gap)))))`;

  // Créer les faces du dé
  createFaces(diceElement);

  // Ajouter le dé au conteneur
  diceContainer.appendChild(diceElement);

  return diceContainer;
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

  const dices = [];

  // Generate cells
  boardData.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellElement = document.createElement('div');
      cellElement.id = `cell-${rowIndex}-${colIndex}`;
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
              cellElement.classList.add('t-damage-panel');
              cellElement.classList.add('no-box');
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
        createFaces(cellElement);

        // Add additional properties
        if (cell.hasDice) {
          dices.push({ row: rowIndex, col: colIndex, refElement: cellElement });
        }
      }

      board.appendChild(cellElement);
    });
  });

  dices.forEach((dice) => {
    const diceElement = createDice(dice);
    board.appendChild(diceElement);
  });

  // Setup cell selection and centering
  setupCellInteractions();
  setupKeyboardNavigation();
  setupMouseWheelRotation();
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
