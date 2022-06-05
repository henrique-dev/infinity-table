/* eslint no-underscore-dangle: 0 */
/* global ITable */
/* eslint no-undef: "error" */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports)
    : typeof define === 'function' && define.amd ? define(['exports'], factory)
      : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ITable = {}));
}(this, ((exports) => {
  /**
  * Applies canvas on element.
   * @constructor
   * @param {HTMLDivElement} element - Element to apply mask
   * @param {Object} options - Custom options
   * @return {InfinityTable}
   */
  const ITable = function T2(element, ...args) {
    const options = args.length > 0 && args[0] !== undefined ? args[0] : {};
    return new ITable.InfinityTable(element, options);
  };

  let debug;

  let table;
  let mainContainer;
  let secondContainer;

  let elements;
  let onRenderTr;
  let onRenderStack;
  let rowHeight;

  let containerWidth;
  let containerHeight;
  let tableWidth;
  let tableHeight;
  let secondContainerWidth;
  let secondContainerHeight;

  let tableDrawWidth;
  let tableDrawHeight;

  let fatScrollX;
  let fatScrollY;

  let scrollBarWidth = 0;

  let scrollElementWidth = 0;
  let scrollElementHeight = 0;

  let componentTable;
  let componentTbody;
  let componentThead;
  let componentScrollV;
  let componentScrollVSpacer;
  let componentScrollH;
  let componentScrollHSpacer;
  let componentScrollS;

  let stack;
  let stacksForRender;
  let stacksInRender;
  let currentStack;
  let totalStacks;
  let lastStack;
  const stacksRenderedOnce = 5;

  let hashStackItens;

  let cameraArea;

  function _applyElement() {
    containerWidth = mainContainer.getBoundingClientRect().width;
    containerHeight = mainContainer.getBoundingClientRect().height;
    tableWidth = table.getBoundingClientRect().width;
    tableHeight = table.getBoundingClientRect().height;
    if (stack <= 0) {
      stack = parseInt(containerHeight / rowHeight, 10);
    }
  }

  function _getScrollBarWidth() {
    const containerToMeasureWidth = document.createElement('div');
    containerToMeasureWidth.style.visibility = 'hidden';
    containerToMeasureWidth.style.width = '100px';
    containerToMeasureWidth.style.msOverflowStyle = 'scrollbar';
    document.body.appendChild(containerToMeasureWidth);
    const widthNoScroll = containerToMeasureWidth.offsetWidth;
    containerToMeasureWidth.style.overflow = 'scroll';
    const inner = document.createElement('div');
    inner.style.width = '100%';
    containerToMeasureWidth.appendChild(inner);
    const widthWithScroll = inner.offsetWidth;
    containerToMeasureWidth.parentNode.removeChild(containerToMeasureWidth);
    return widthNoScroll - widthWithScroll;
  }

  function _getRealTableWidth() {
    const scrollBarWidth = _getScrollBarWidth();
    const secondContainerWidth = containerWidth - scrollBarWidth;
    const secondContainerHeight = containerHeight - scrollBarWidth;

    const containerToMeasureSize = document.createElement('div');
    containerToMeasureSize.style.position = 'absolute';
    containerToMeasureSize.style['overflow-y'] = 'hidden';
    containerToMeasureSize.style['overflow-x'] = 'hidden';
    containerToMeasureSize.style.width = `${secondContainerWidth}px`;
    containerToMeasureSize.style.height = `${secondContainerHeight}px`;
    containerToMeasureSize.style.left = '0px';
    containerToMeasureSize.style.top = `${table.getBoundingClientRect().height}`;

    mainContainer.appendChild(containerToMeasureSize);

    const tableToMeasureSize = document.createElement('table');
    tableToMeasureSize.style.position = 'absolute';
    tableToMeasureSize.style.width = '100%';
    tableToMeasureSize.classList = table.classList;
    const theadToMeasureSize = document.createElement('thead');
    if (table.tHead != null) {
      theadToMeasureSize.innerHTML = table.tHead.innerHTML;
    }
    tableToMeasureSize.appendChild(theadToMeasureSize);

    if (elements.length > 0) {
      const tbodyToMeasureSize = document.createElement('tbody');
      const trToMeasureSize = tbodyToMeasureSize.insertRow(-1);
      trToMeasureSize.style.height = `${rowHeight}px`;
      onRenderTr(trToMeasureSize, elements[20], -1);
      tableToMeasureSize.appendChild(tbodyToMeasureSize);
    }

    containerToMeasureSize.appendChild(tableToMeasureSize);

    const sizeInfo = {
      tableWidth: tableToMeasureSize.getBoundingClientRect().width,
      theadHeight: theadToMeasureSize.getBoundingClientRect().height,
    };

    mainContainer.removeChild(containerToMeasureSize);
    return sizeInfo;
  }

  function _arrayDiff(A, B) {
    return A.filter((i) => !B.includes(i));
  }

  function _generateRange(value) {
    const halfValue = parseInt(stacksRenderedOnce / 2, 10);
    let prevValue = value - halfValue;
    prevValue = (prevValue < 0 ? 0 : prevValue);
    let nextValue = value + halfValue;
    nextValue = (nextValue >= totalStacks - 1 ? totalStacks - 1 : nextValue);
    const values = [];
    for (let i = prevValue; i <= nextValue; i += 1) {
      values.push(i);
    }
    return values;
  }

  function _removeStacks(stacksForRemove) {
    stacksForRemove.forEach((stackIndexForRemove) => {
      const trsForCompact = Array.from(document.getElementsByClassName(`its-${stackIndexForRemove}`));
      trsForCompact.forEach((el) => componentTbody.removeChild(el));
    });
  }

  function _getArrayForCreateStack(array, reverse = false) {
    if (reverse) {
      return array.map((v) => v).reverse();
    }
    return array;
  }

  function _createStacks(stacksForCreate, indexForInsert, reverse = false) {
    stacksForCreate.forEach((stackIndexForCreate) => {
      if (Object.prototype.hasOwnProperty.call(hashStackItens, stackIndexForCreate)) {
        _getArrayForCreateStack(hashStackItens[stackIndexForCreate], reverse).forEach((element) => {
          const newTr = componentTbody.insertRow(indexForInsert);
          newTr.style.height = `${rowHeight}px`;
          newTr.classList.add(`its-${stackIndexForCreate}`);
          newTr.classList.add('its-tr');
          if (onRenderTr(newTr, element, stackIndexForCreate)) {
            // do something
          } else {
            componentTbody.deleteRow(newTr.rowIndex);
          }
        });
        onRenderStack();
      }
    });
  }

  function _renderTable() {
    // scroll down
    const stackDiff = currentStack - lastStack;
    if (stackDiff > 0) {
      if (Math.abs(stackDiff) === 1) { // scroll stack per stack
        const lastTrRendered = Array.from(document.querySelectorAll(`.its-${stacksInRender.map((v) => v).pop()}`)).pop();
        const stacksForRemove = _arrayDiff(stacksInRender, stacksForRender);
        const stacksForCreate = _arrayDiff(stacksForRender, stacksInRender);
        _removeStacks(stacksForRemove);
        _createStacks(stacksForCreate, lastTrRendered.rowIndex, true);
      }
      if (Math.abs(stackDiff) > 1) { // scroll jump to some stack
        const stacksForRemove = stacksInRender;
        const stacksForCreate = stacksForRender;
        _removeStacks(stacksForRemove);
        _createStacks(stacksForCreate, -1);
      }
    }
    // scroll up
    if (stackDiff < 0) {
      if (Math.abs(stackDiff) === 1) {
        const lastTrRendered = Array.from(document.querySelectorAll(`.its-${stacksInRender.map((v) => v).shift()}`)).shift();
        const stacksForRemove = _arrayDiff(stacksInRender, stacksForRender);
        const stacksForCreate = _arrayDiff(stacksForRender, stacksInRender);
        _removeStacks(stacksForRemove);
        _createStacks(stacksForCreate, lastTrRendered.rowIndex - 1, true);
      }
      if (Math.abs(stackDiff) > 1) {
        const stacksForRemove = stacksInRender;
        const stacksForCreate = stacksForRender;
        _removeStacks(stacksForRemove);
        _createStacks(stacksForCreate, -1);
      }
    }
    stacksInRender = stacksForRender;
  }

  function _scrollVertical() {
    let fixScrollY = 0;
    if (currentStack > 1) {
      fixScrollY = stacksInRender.map((v) => v).shift() * stack * rowHeight;
    }

    secondContainer.scroll(this.scrollLeft, this.scrollTop - fixScrollY);
    cameraArea.y = this.scrollTop / fatScrollY;

    currentStack = parseInt((this.scrollTop + cameraArea.height / 2) / ((stack * rowHeight)), 10);

    if (_arrayDiff(stacksInRender, stacksForRender)) {
      stacksForRender = _generateRange(currentStack);
      _renderTable();
    }
    lastStack = currentStack;
  }

  function _scrollHorizontal() {
    secondContainer.scroll(this.scrollLeft, this.scrollTop);
    cameraArea.x = this.scrollLeft / fatScrollX;
    lastStack = currentStack;
  }

  function _createElements() {
    scrollBarWidth = _getScrollBarWidth();
    const realTableSize = _getRealTableWidth();

    tableDrawHeight = (elements.length) * rowHeight + realTableSize.theadHeight;
    tableDrawWidth = realTableSize.tableWidth;

    secondContainerWidth = containerWidth - scrollBarWidth;
    secondContainerHeight = containerHeight - scrollBarWidth;
    scrollElementWidth = secondContainerWidth;
    scrollElementHeight = secondContainerHeight;

    fatScrollY = tableDrawHeight / (scrollElementHeight);
    fatScrollX = tableDrawWidth / (scrollElementWidth);

    mainContainer.style.position = 'relative';

    secondContainer = document.createElement('div');
    secondContainer.style.position = 'absolute';
    secondContainer.style['overflow-y'] = 'hidden';
    secondContainer.style['overflow-x'] = 'hidden';
    secondContainer.style.width = `${secondContainerWidth}px`;
    secondContainer.style.height = `${secondContainerHeight}px`;
    secondContainer.style.left = '0px';
    secondContainer.style.top = `${table.getBoundingClientRect().height}`;
    mainContainer.appendChild(secondContainer);

    componentTable = document.createElement('table');
    componentTable.style.position = 'absolute';
    componentTable.style.width = '100%';
    componentTable.classList = table.classList;
    if (table.tHead != null) {
      componentThead = document.createElement('thead');
      componentThead.innerHTML = table.tHead.innerHTML;
      componentTable.appendChild(componentThead);
    }
    secondContainer.appendChild(componentTable);

    componentScrollV = document.createElement('div');
    componentScrollV.style.position = 'absolute';
    componentScrollV.style.right = '0px';
    componentScrollV.style.top = `${table.getBoundingClientRect().height}`;
    componentScrollV.style.height = `${scrollElementHeight}px`;
    componentScrollV.style['overflow-y'] = 'scroll';
    componentScrollVSpacer = document.createElement('div');
    componentScrollVSpacer.style.width = '1px';
    componentScrollVSpacer.style.height = `${tableDrawHeight}px`;
    componentScrollV.appendChild(componentScrollVSpacer);
    mainContainer.appendChild(componentScrollV);

    componentScrollH = document.createElement('div');
    componentScrollH.style.position = 'absolute';
    componentScrollH.style.left = '0px';
    componentScrollH.style.top = `${secondContainerHeight - 1}px`;
    componentScrollH.style.width = `${scrollElementWidth}px`;
    componentScrollH.style['overflow-x'] = 'scroll';
    componentScrollHSpacer = document.createElement('div');
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

    mainContainer.style.overflow = 'hidden';
  }

  function _startTable() {
    stacksForRender = _generateRange(0);
    stacksInRender = stacksForRender;
    lastStack = 0;
    currentStack = 0;
    totalStacks = parseInt((elements.length) / stack, 10)
      + ((elements.length % stack) !== 0 ? 1 : 0);
    cameraArea = {
      x: 0, y: 0, width: secondContainerWidth, height: secondContainerHeight,
    };
    hashStackItens = {};

    componentTbody = document.createElement('tbody');

    elements.forEach((v, i) => {
      const element = elements[i];
      if (i < (stack * 3)) {
        const newTr = componentTbody.insertRow(-1);
        newTr.style.height = `${rowHeight}px`;
        newTr.classList.add(`its-${parseInt(i / stack, 10)}`);
        newTr.classList.add('its-tr');
        if (onRenderTr(newTr, element, parseInt(i / stack, 10))) {
          // do something
        } else {
          componentTbody.removeChild(componentTbody.lastChild);
        }
      }
      if (hashStackItens[parseInt(i / stack, 10)] == null) {
        hashStackItens[parseInt(i / stack, 10)] = [];
      }
      hashStackItens[parseInt(i / stack, 10)].push(element);
    });

    componentTable.appendChild(componentTbody);

    componentScrollV.addEventListener('scroll', _scrollVertical, false);
    componentScrollH.addEventListener('scroll', _scrollHorizontal, false);

    table.style.display = 'none';
  }

  function _applyOptions(options) {
    const newOptions = ({
      debug: false,
      elements: [],
      onRenderTr: (tr) => tr,
      onRenderStack: (stackId) => stackId,
      rowHeight: 0,
      stack: 0,
      ...options,
    });

    debug = newOptions.debug;
    elements = newOptions.elements;
    onRenderTr = newOptions.onRenderTr;
    onRenderStack = newOptions.onRenderStack;
    rowHeight = newOptions.rowHeight;
    stack = newOptions.stack;
  }

  function _elementIsTable(element) {
    return element.tagName === 'TABLE';
  }

  function _init() {
    _applyElement();
    _createElements();
    _startTable();
  }

  function _resizeElements() {
    if (secondContainer != null) {
      mainContainer.removeChild(secondContainer);
      secondContainer = null;
    }
    if (componentScrollV != null) {
      mainContainer.removeChild(componentScrollV);
      componentScrollV = null;
    }
    if (componentScrollH != null) {
      mainContainer.removeChild(componentScrollH);
      componentScrollH = null;
    }
    if (componentScrollS != null) {
      mainContainer.removeChild(componentScrollS);
      componentScrollS = null;
    }
    _init();
  }

  const IT = (function T3() {
    function InfinityTable(element, options) {
      if (_elementIsTable(element)) {
        table = element;
        mainContainer = table.closest('div');
        _applyOptions(options);
        _init();
        window.addEventListener('resize', _resizeElements, false);
        _adjustElements();
      }
    }
    return InfinityTable;
  }());

  ITable.InfinityTable = IT;

  try {
    globalThis.ITable = ITable;
  } catch (e) {
    // continue regardless of error
  }

  exports.InfinityTable = IT;
  exports.default = ITable;

  Object.defineProperty(exports, '__esModule', { value: true });
})));
