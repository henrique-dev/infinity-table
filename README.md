# Infinity Table

[![npm version](https://badge.fury.io/js/infinity-table.svg)](https://badge.fury.io/for/js/infinity-table)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description
Este componente tem como objetivo a praticidade e economia de recursos quando utilizamos uma tabela com muitos itens, reduzindo a quantidade de recursos criados, através da montagem dinamica das linhas.

## Install
`npm install infinity-table` and `import ITable from 'infinity-table';`

## Usage
First we need to define a container for our component and a table with a header.
```html
<div class='table-responsive' style='width: 100%; height: 90vh;'>
  <table id='myTable' class='table table-striped'>
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
  td.innerHTML = `${element.id}`;
  const tdDescription = tr.insertCell(-1);
  td.innerHTML = `${element.description}`;
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
