(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ITable = {}));
})(this, (function (exports) { 'use strict';

  /**
	 * Applies canvas on element.
	 * @constructor
	 * @param {HTMLDivElement} element - Element to apply mask
	 * @param {Object} options - Custom options
	 * @return {InfinityTable}
	 */
   ITable = function(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return new ITable.InfinityTable(element, options);
  }

  var debug;

  var table;
  var mainContainer;
  var secondContainer;

  var elements;
  var onRenderTr;
  var onRenderStack;
  var rowHeight;
  var copyStyleFromTh;

  var containerWidth;
  var containerHeight;
  var tableWidth;
  var tableHeight;
  var secondContainerWidth;
  var secondContainerHeight;

  var secondTableWidth = 0;
  var secondTableHeight = 0;

  var tableDrawWidth = 0;
  var tableDrawHeight = 0;

  var fatScrollX;
  var fatScrollY;

  var scrollBarWidth = 0;

  var scrollElementWidth = 0;
  var scrollElementHeight = 0;

  var mainContainer = null;

  var componentTable;
  var componentTbody;
  var componentScrollV;
  var componentScrollH;
  var componentScrollS;

  var stack;
  var firstStackIndexRendered;
  var stacksRendered;
  var currentStack;
  var totalStacks;
  var lastStack;

  var hashStackItens;
  var colors;

  var cameraArea;

  var InfinityTable = function () {
    function InfinityTable(element, options) {
      if (_elementIsTable(element)) {
        table = element;
        mainContainer = table.closest('div');
        _applyOptions(options);
        _init();
      } else return;
    }
    return InfinityTable;
  }();

  function _init() {
    _applyElement();
    _createElements();
    _startTable();
  }

  function _applyElement(element) {
    containerWidth = mainContainer.getBoundingClientRect().width;
    containerHeight = mainContainer.getBoundingClientRect().height;
    tableWidth = table.getBoundingClientRect().width;
    tableHeight = table.getBoundingClientRect().height;
  }

  function _createElements() {
    scrollBarWidth = _getScrollBarWidth();
    secondContainerWidth = containerWidth - scrollBarWidth;
    secondContainerHeight = containerHeight - scrollBarWidth*2 - tableHeight;
    scrollElementWidth = secondContainerWidth;
    scrollElementHeight = secondContainerHeight;

    tableDrawHeight = (elements.length + 1) * rowHeight;
    fatScrollY = tableDrawHeight / (scrollElementHeight);

    mainContainer.style.position = 'relative';

    secondContainer = document.createElement('div');
    if (debug) secondContainer.style.background = 'bisque';
    secondContainer.style.position = 'absolute';
    secondContainer.style['overflow-y'] = 'hidden';
    secondContainer.style.width = `${secondContainerWidth}px`;
    secondContainer.style.height = `${secondContainerHeight}px`;
    secondContainer.style.left = '0px';
    secondContainer.style.top = `${table.getBoundingClientRect().height}`;
    mainContainer.appendChild(secondContainer);

    componentTable = document.createElement('table');
    componentTable.style.position = 'absolute';
    componentTable.style.width = '100%';
    if (debug) componentTable.style.background = 'rosybrown';
    secondContainer.appendChild(componentTable);

    componentScrollV = document.createElement('div');
    componentScrollV.style.position = 'absolute';
    componentScrollV.style.right = '0px';
    componentScrollV.style.top = `${table.getBoundingClientRect().height}`;
    componentScrollV.style.height = `${scrollElementHeight}px`;
    componentScrollV.style['overflow-y'] = 'scroll';
    let componentScrollVSpacer = document.createElement('div');
    componentScrollVSpacer.style.width = '1px';
    componentScrollVSpacer.style.height = `${tableDrawHeight}px`;
    componentScrollV.appendChild(componentScrollVSpacer);
    mainContainer.appendChild(componentScrollV);

    componentScrollH = document.createElement('div');
    componentScrollH.style.position = 'absolute';
    componentScrollH.style.left = '0px';
    componentScrollH.style.top = `${containerHeight - scrollBarWidth - 1}px`;
    componentScrollH.style.width = `${scrollElementWidth}px`;
    componentScrollH.style['overflow-x'] = 'scroll';
    let componentScrollHSpacer = document.createElement('div');
    componentScrollHSpacer.style.height = '1px';
    componentScrollHSpacer.style.width = `${tableDrawWidth}px`;
    componentScrollH.appendChild(componentScrollHSpacer);
    mainContainer.appendChild(componentScrollH);

    componentScrollS = document.createElement('div');
    componentScrollS.style.position = 'absolute';
    componentScrollS.style.right = '0px';
    componentScrollS.style.bottom = '0px';
    componentScrollS.style.background = '#dcdcdc';
    componentScrollS.style.width = `${scrollBarWidth}px`;
    componentScrollS.style.height = `${scrollBarWidth}px`;
    mainContainer.appendChild(componentScrollS);
  }

  function _startTable() {
    stacksRendered = [0,1,2,3];
    lastStack = 0;
    currentStack = 0;
    totalStacks = parseInt((elements.length) / stack) + ((elements.length % stack) != 0 ? 1 : 0);
    firstStackIndexRendered = 0;
    cameraArea = {x: 0, y: 0, width: secondContainerWidth, height: secondContainerHeight};
    hashStackItens = {};
    colors = [];

    let td = table.firstElementChild.rows[0].insertCell(-1);
    td.width = `${scrollBarWidth}px`;

    componentTbody = document.createElement('tbody');

    elements.forEach(function(v, i) {
      let color;
      if (hashStackItens.hasOwnProperty(parseInt(i / stack))) {
        color = hashStackItens[parseInt(i / stack)];
      } else {
        color = {r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256)};
        colors.push(color);
      }

      let element = elements[i];
      if (i < (stack*4)) {
          let newTr = componentTbody.insertRow(-1);
          newTr.style.height = `${rowHeight}px`;
          newTr.classList.add(`its-${parseInt(i / stack)}`)
          newTr.classList.add('its-tr')
          if (onRenderTr(newTr, element, parseInt(i / stack), colors[parseInt(i / stack)])) {
            if (copyStyleFromTh) _applyThStyle(newTr);
          } else {
            componentTbody.removeChild(componentTbody.lastChild);
          }
      }
      if (hashStackItens[parseInt(i / stack)] == null) {
          hashStackItens[parseInt(i / stack)] = [];
      }
      hashStackItens[parseInt(i / stack)].push(element);
    });

    componentTable.appendChild(componentTbody);

    componentScrollV.addEventListener('scroll', _scrollVertical, false);
  }

  function _scrollVertical(e, c) {

    let fixScrollY = 0;
    if (currentStack > 1) {
      if (currentStack >= totalStacks-2) {
        fixScrollY = ((totalStacks-4) * stack * rowHeight);
      } else {
        fixScrollY = firstStackIndexRendered * stack * rowHeight;
      }
    }

    secondContainer.scroll(this.scrollLeft, this.scrollTop - fixScrollY);
    cameraArea.y = this.scrollTop / fatScrollY;

    currentStack = parseInt(((cameraArea.y * fatScrollY) + cameraArea.height) / ((stack * rowHeight)));

    if (currentStack != lastStack) {
        stacksRendered = [];
        for (let i=currentStack-1; i<currentStack+3; i++) {
            if (i >= 0 && i < totalStacks) {
                stacksRendered.push(i);
            }
        }
        _renderTable(currentStack, lastStack);
    }
    lastStack = currentStack;
  }

  function _renderTable(currentStack, lastStack) {
    if (currentStack - lastStack > 0) {
      if (Math.abs(currentStack - lastStack) == 1) {
        let stackForCompact = currentStack-2;
        let stackForOpen = currentStack+2;
        if (!stacksRendered.includes(stackForOpen)) {
          return;
        }
        if (stackForCompact >= 0 && stackForOpen <= (totalStacks-1)) {

          let trsForCompact = Array.from(document.getElementsByClassName(`its-${stackForCompact}`));
          trsForCompact.forEach(el => componentTbody.removeChild(el));

          let trLastOpened = Array.from(document.querySelectorAll(`.its-${stackForOpen-1}`)).pop();

          hashStackItens[stackForOpen].reverse().forEach(function(element, index) {
            let newTr = componentTbody.insertRow(trLastOpened.rowIndex+1);
            newTr.style.height = `${rowHeight}px`;
            newTr.classList.add(`its-${stackForOpen}`);
            newTr.classList.add('its-tr');
            if (onRenderTr(newTr, element, stackForOpen, colors[stackForOpen])) {
              if (copyStyleFromTh) _applyThStyle(newTr);
            } else {
              componentTbody.deleteRow(newTr.rowIndex);
            }
          });
          onRenderStack();
          firstStackIndexRendered = currentStack-1;
        }
      } else {
        let trsForCompact = Array.from(document.getElementsByClassName(`its-tr`));
        trsForCompact.forEach(el => componentTbody.removeChild(el));

        if (currentStack > totalStacks-3) {
          currentStack = totalStacks-3;
        }
        let firstValue = null;
        for (let i=currentStack-1; i<=currentStack+2; i++) {
          if (i > 0 && i < totalStacks) {
            if (firstValue == null) {
              firstValue = i;
            }
            hashStackItens[i].reverse().forEach(function(element, index) {
              let newTr = componentTbody.insertRow(-1);
              newTr.style.height = `${rowHeight}px`;
              newTr.classList.add(`its-${i}`);
              newTr.classList.add('its-tr')
              if (onRenderTr(newTr, element, i, colors[i])) {
                if (copyStyleFromTh) _applyThStyle(newTr);
              } else {
                componentTbody.deleteRow(newTr.rowIndex);
              }
            });
          }
        }
        onRenderStack();
        if (firstValue != null) {
          firstStackIndexRendered = firstValue;
        }
      }
      return 1;
    } else {
      if (Math.abs(currentStack - lastStack) == 1) {
        let stackForCompact = currentStack+3;
        let stackForOpen = currentStack-1;
        if (!stacksRendered.includes(stackForOpen)) {
            return;
        }
        if (stackForOpen >= 0 && stackForCompact <= (totalStacks-1)) {

          let trsForCompact = Array.from(document.getElementsByClassName(`its-${stackForCompact}`));
          trsForCompact.forEach(el => componentTbody.removeChild(el));

          let trLastOpened = Array.from(document.querySelectorAll(`.its-${stackForOpen+1}`)).shift();

          hashStackItens[stackForOpen].forEach(function(element, index) {

            let newTr = componentTbody.insertRow(trLastOpened.rowIndex);
            newTr.style.height = `${rowHeight}px`;
            newTr.classList.add(`its-${stackForOpen}`);
            newTr.classList.add('its-tr')

            if (onRenderTr(newTr, element, stackForOpen, colors[stackForOpen])) {
              if (copyStyleFromTh) _applyThStyle(newTr);
            } else {
              componentTbody.deleteRow(newTr.rowIndex);
            }

          });
          onRenderStack();
          firstStackIndexRendered = stackForOpen;
          return 2;
        }
      } else {
        let trsForCompact = Array.from(document.getElementsByClassName(`its-tr`));
        trsForCompact.forEach(el => componentTbody.removeChild(el));

        if (currentStack < 1) {
          currentStack = 1;
        }
        let firstValue = null;
        for (let i=currentStack-1; i<=currentStack+2; i++) {
          if (i >= 0 && i < totalStacks) {
            if (firstValue == null) {
              firstValue = i;
            }

            hashStackItens[i].forEach(function(element, index) {
              let newTr = componentTbody.insertRow(-1);
              newTr.style.height = `${rowHeight}px`;
              newTr.classList.add(`its-${i}`);
              newTr.classList.add('its-tr')

              if (onRenderTr(newTr, element, i, colors[i])) {
                if (copyStyleFromTh) _applyThStyle(newTr);
              } else {
                componentTbody.deleteRow(newTr.rowIndex);
              }
            });
          }
        }
        onRenderStack();
        if (firstValue != null) {
          firstStackIndexRendered = firstValue;
        }
      }
    }
    return 1;
  };

  function _applyThStyle(tr) {
    Array.from(tr.cells).forEach(function(td, index) {
      let tableThead = table.firstElementChild;
      if (tableThead.tagName == 'THEAD') {
        let th = tableThead.rows[0].cells[index];
        td.width = window.getComputedStyle(th, null).getPropertyValue('width');;
        td.style.padding = window.getComputedStyle(th, null).getPropertyValue('padding');
        td.style.margin = window.getComputedStyle(th, null).getPropertyValue('margin');
      }
    });
  }

  function _applyOptions(options) {
    options = Object.assign({
      debug: false,
      elements: [],
      onRenderTr: function(tr){},
      onRenderStack: function(stack){},
      rowHeight: 0,
      stack: 0,
      copyStyleFromTh: false,
    }, options);

    debug = options.debug;
    elements = options.elements;
    onRenderTr = options.onRenderTr;
    onRenderStack = options.onRenderStack;
    rowHeight = options.rowHeight;
    stack = options.stack;
    copyStyleFromTh = options.copyStyleFromTh;
  }

  function _elementIsTable(element) {
    return element.tagName == 'TABLE';
  }

  function _getScrollBarWidth() {
    let containerToMeasureWidth = document.createElement('div');
    containerToMeasureWidth.style.visibility = 'hidden';
    containerToMeasureWidth.style.width = '100px';
    containerToMeasureWidth.style.msOverflowStyle = 'scrollbar';
    document.body.appendChild(containerToMeasureWidth);
    let widthNoScroll = containerToMeasureWidth.offsetWidth;
    containerToMeasureWidth.style.overflow = 'scroll';
    let inner = document.createElement('div');
    inner.style.width = '100%';
    containerToMeasureWidth.appendChild(inner);
    let widthWithScroll = inner.offsetWidth;
    containerToMeasureWidth.parentNode.removeChild(containerToMeasureWidth);
    return widthNoScroll - widthWithScroll;
  }

  ITable.InfinityTable = InfinityTable;

  try {
	  globalThis.ITable = ITable;
	} catch (e) {}

  exports.InfinityTable = InfinityTable;
  exports["default"] = ITable;

  Object.defineProperty(exports, '__esModule', { value: true });
}));
