# Infinity Table

[![npm version](https://badge.fury.io/js/infinity-table.svg)](https://badge.fury.io/for/js/infinity-table)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description
This component has as objective the practicality and economy of resources when using a table with many items, reducing the amount of resources created, through the dynamic assembly of the lines.

## Install
`npm install infinity-table` and `import ITable from 'infinity-table';`

## Usage
Before, it is necessary to follow the following rules:
- The th/td must have a minimum width so that their contents do not scale the line if the window is resized.
- The tr must have a fixed and non-adjustable height, so be aware of its contents.
Then we need to define a container for our component and a table with a header.
```html
<div style='width: 100%; height: 90vh;'>
  <table id='myTable'>
    <thead>
      <tr>
        <th width='100px'></th>
        <th>Description</th>
      </tr>
    </thead>
  </table>
</div>
```

Then we take our table, and pass it to the component's constructor:
```javascript
const table = document.getElementById('myTable');

function onRenderTr(tr, element, stack) {
  const tdId = tr.insertCell(-1);
  tdId.innerHTML = `${element.id}`;
  const tdDescription = tr.insertCell(-1);
  tdDescription.innerHTML = `${element.description}`;
}

let infinityTable = new ITable(table, {
  elements: [{
    id: 0,
    description: 'Some Description',
  }],
  onRenderTr: onRenderTr,
  rowHeight: 50
});
```

Where:
- `elements`: are the data of the elements to build the lines.
- `onRenderTr`: is the line construction method called every time lines are rendered.
- `rowHeight`: is the height of the line.
