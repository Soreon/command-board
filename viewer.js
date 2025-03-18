function createFace(type) {
  const face = document.createElement('div');
  // face.innerText = type;
  face.className = `face ${type}`; // Add the type to the class list
  return face;
}

function findGrapheme(s) {
  const re = /.[\u0300-\u036F]*/g;
  let match;
  const matches = [];
  match = re.exec(s);
  while (match) {
    matches.push(match[0]);
    match = re.exec(s);
  }
  return matches;
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

function generateBoard(gridString) {
  const board = document.querySelector('.board');
  const rows = gridString.split(',');

  const hasFirstNonEmpty = false;

  // Set the grid template based on the dimensions of the input
  board.style.gridTemplateColumns = `repeat(${findGrapheme(rows[0].replace(/\n/g, ' ')).length}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${rows.length}, 1fr)`;

  // Clear existing board
  board.innerHTML = '';

  // Generate cells
  rows.forEach((_row) => {
    const row = findGrapheme(_row.replace(/\n/g, ' '));
    row.forEach((char) => {
      const cell = document.createElement('div');
      cell.className = 'cell';

      if (char.normalize('NFD').includes('\u0303')) {
        cell.classList.add('no-box');
      } else {
        cell.classList.add('box');
      }

      switch (char.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
        case ' ': cell.classList.add('empty'); break;
        case 'a': cell.classList.add('t-blue-checkpoint'); break;
        case 'b': cell.classList.add('t-yellow-checkpoint'); break;
        case 'c': cell.classList.add('t-red-checkpoint'); break;
        case 'd': cell.classList.add('t-green-checkpoint'); break;
        case 'e': cell.classList.add('t-vertical-teleporter'); break;
        case 'f': cell.classList.add('t-start-panel'); break;
        case 'g': cell.classList.add('t-special-panel'); break;
        case 'h': cell.classList.add('t-horizontal-teleporter'); break;
        case 'i': cell.classList.add('t-gp-booster-panel'); break;
        case 'j': cell.classList.add('t-damage-panel'); break;
        case 'k': cell.classList.add('t-command-panel'); break;
        case 'l': cell.classList.add('t-bonus-panel'); break;
        case 'm': cell.classList.add('t-colored-command-panel-1'); break;
        case 'n': cell.classList.add('t-colored-command-panel-2'); break;
        case 'o': cell.classList.add('t-colored-command-panel-3'); break;
        case 'p': cell.classList.add('t-colored-command-panel-4'); break;
        case 'q': cell.classList.add('t-colored-command-panel-5'); break;
        case 'r': cell.classList.add('t-colored-command-panel-6'); break;
        case 's': cell.classList.add('t-colored-command-panel-7'); break;
        case 't': cell.classList.add('t-colored-command-panel-8'); break;
        case 'u': cell.classList.add('t-colored-command-panel-9'); break;
        case 'v': cell.classList.add('t-colored-command-panel-10'); break;
        case 'w': cell.classList.add('t-colored-command-panel-11'); break;
        case 'x': cell.classList.add('t-colored-command-panel-12'); break;
        case 'y': cell.classList.add('t-colored-command-panel-13'); break;
        case 'z': cell.classList.add('t-colored-command-panel-14'); break;
        case 'A': cell.classList.add('t-colored-command-panel-15'); break;
        case 'B': cell.classList.add('t-colored-command-panel-16'); break;
        default: break;
      }

      if (cell.classList.contains('t-start-panel')) {
        cell.classList.add('selected');
      }

      // Check for diacritics
      if (char.normalize('NFD').includes('\u0300')) {
        cell.classList.add('no-box');
        cell.classList.remove('box');
      }

      if (char.normalize('NFD').includes('\u0301')) {
        cell.classList.add('no-box');
        cell.classList.remove('box');
      }

      if (char.normalize('NFD').includes('\u0323')) {
        cell.classList.add('t-dice');
        cell.classList.remove('no-box');
      }

      if (char.normalize('NFD').includes('\u0311')) {
        cell.classList.add('starred');
      }

      // on ajoute 4 div pour créer les faces de la boite
      if (char !== ' ') {
        cell.appendChild(createFace('Xplus'));
        cell.appendChild(createFace('Xminus'));
        cell.appendChild(createFace('Yplus'));
        cell.appendChild(createFace('Yminus'));
        cell.appendChild(createFace('Zplus'));
        cell.appendChild(createFace('Zminus'));
      }

      board.appendChild(cell);
    });
  });

  // Setup cell selection and centering
  setupCellInteractions();

  setupKeyboardNavigation();
}

const view = document.getElementById('view');

/*
a -> t-blue-checkpoint
b -> t-yellow-checkpoint
c -> t-red-checkpoint
d -> t-green-checkpoint
e -> t-vertical-teleporter
f -> t-start-panel
g -> t-special-panel
h -> t-horizontal-teleporter
i -> t-gp-booster-panel
j -> t-damage-panel
k -> t-command-panel
l -> t-bonus-panel
m -> t-colored-command-panel-1
n -> t-colored-command-panel-2
o -> t-colored-command-panel-3
p -> t-colored-command-panel-4
q -> t-colored-command-panel-5
r -> t-colored-command-panel-6
s -> t-colored-command-panel-7
t -> t-colored-command-panel-8
u -> t-colored-command-panel-9
v -> t-colored-command-panel-10
w -> t-colored-command-panel-11
x -> t-colored-command-panel-12
y -> t-colored-command-panel-13
z -> t-colored-command-panel-14
A -> t-colored-command-panel-15
B -> t-colored-command-panel-16

https://www.lexilogos.com/keyboard/diacritics.htm

tilde -> no-box
dot below -> t-dice
inverted breve -> starred
*/

const keybladeBoard = '     j̃j̃j̣̃a      ,m̑nn̑  j̃  q      ,m nhhȏ  fqq̑ij̣̃gc,dmg  o  q   j̃ j̃,     bppp̑   j̃j̃j̃';

generateBoard(keybladeBoard);
setTimeout(() => {
  const startCell = document.querySelector('.board .cell.t-start-panel');
  if (startCell) startCell.click();
}, 1);
