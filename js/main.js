const types = [
  '_vd', '_vd', '_vd', '_vd', '_vd', '_dp', '_dp', '_dp', '_cp', '_vd', '_vd', '_vd', '_vd', '_vd', '_vd',
  '_bp', '_cm', '_cm', '_vd', '_vd', '_dp', '_vd', '_vd', '_cm', '_vd', '_vd', '_vd', '_vd', '_vd', '_vd',
  '_cm', '_vd', '_cm', '_tp', '_tp', '_cm', '_vd', '_vd', '_st', '_cm', '_cm', '_gb', '_dp', '_sp', '_cp',
  '_cp', '_cm', '_sp', '_vd', '_vd', '_cm', '_vd', '_vd', '_cm', '_vd', '_vd', '_vd', '_dp', '_vd', '_dp',
  '_vd', '_vd', '_vd', '_vd', '_vd', '_cp', '_cm', '_cm', '_cm', '_vd', '_vd', '_vd', '_dp', '_dp', '_dp',
];

const metadata = [[
  '   ', '   ', '   ', '   ', '   ', '   ', '   ', '   ', '_bl', '   ', '   ', '   ', '   ', '   ', '   ',
  'v04', '   ', '   ', '   ', '   ', '   ', '   ', '   ', 'v10', '   ', '   ', '   ', '   ', '   ', '   ',
  'v04', '   ', '   ', '_ht', '_ht', 'v07', '   ', '   ', '   ', 'v10', 'v10', '   ', '   ', '   ', '_rd',
  '_gr', 'v04', '   ', '   ', '   ', 'v07', '   ', '   ', 'v10', '   ', '   ', '   ', '   ', '   ', '   ',
  '   ', '   ', '   ', '   ', '   ', '_yl', 'v01', 'v01', 'v01', '   ', '   ', '   ', '   ', '   ', '   ',
]];

const gridWidth = 15;
const gridHeight = 5;

/*
  ~ Cell types ~

   ¤ st - Start Panel [Start/end point]
   ¤ cp - Checkpoint [Green/Yellow/Blue/Red]
   ¤ cm - Command Panel
   ¤ bp - Bonus Panel
   ¤ sp - Special Panel
   ¤ gb - GP Booster Panel
   ¤ dp - Damage Panel
   ¤ tp - Teleporter
   ¤ vd - Void
*/

function createCell() {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  return cell;
}

function createRow() {
  const row = document.createElement('div');
  row.classList.add('row');
  return row;
}

function createGrid() {
  const grid = document.createElement('div');
  grid.classList.add('grid');

  for (let y = 0; y < gridHeight; y += 1) {
    const row = createRow();
    for (let x = 0; x < gridWidth; x += 1) {
      const cell = createCell();
      const index = (y * gridWidth) + x;
      cell.classList.add(types[index]);
      for (let m = 0; m < metadata.length; m += 1) {
        if (metadata[m][index].trim()) cell.classList.add(metadata[m][index]);
      }
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
  document.body.appendChild(grid);
}

createGrid();
