/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use-strict';

import {
SplitPanel
} from '../lib/index';

import {
  getDropData, setDropData, clearDropData
} from 'phosphor-domutil';

import {
Message
} from 'phosphor-messaging';

import {
Widget
} from 'phosphor-widget';

import './dragdrop.css';

const PLOT_ID = '1edbdc7a-876c-4549-bcf2-7726b8349a2e'

const MIME_TYPE = 'application/x-phosphor-draggable';


class DraggableWidget extends Widget {

  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let span = document.createElement('span');
    node.className = 'list-item';
    node.setAttribute('draggable', 'true');
    node.appendChild(span);
    return node;
  }

  constructor(label: string, private _factory: () => Widget) {
    super();
    this.node.querySelector('span').appendChild(document.createTextNode(label));
  }

  handleEvent(event: Event): void {
    switch (event.type) {
    case 'dragstart':
      this._evtDragStart(<DragEvent>event);
      break;
    case 'dragend':
      this._evtDragEnd(<DragEvent>event);
      break;
    }
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('dragstart', this);
    this.node.addEventListener('dragend', this);
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.node.removeEventListener('dragstart', this);
    this.node.removeEventListener('dragend', this);
  }

  private _evtDragStart(event: DragEvent): void {
    setDropData(event, MIME_TYPE, this._factory);
  }

  private _evtDragEnd(event: DragEvent): void {
    clearDropData(event);
  }
}


class DroppableWidget extends Widget {

  handleEvent(event: Event): void {
    switch (event.type) {
    case 'dragenter':
      this._evtDragEnter(<DragEvent>event);
      break;
    case 'dragleave':
      this._evtDragLeave(<DragEvent>event);
      break;
    case 'dragover':
      this._evtDragOver(<DragEvent>event);
      break;
    case 'drop':
      this._evtDrop(<DragEvent>event);
      break;
    }
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    for (let event of ['dragenter', 'dragleave', 'dragover', 'drop']) {
      this.node.addEventListener(event, this);
    };
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    for (let event of ['dragenter', 'dragleave', 'dragover', 'drop']) {
      this.node.removeEventListener(event, this);
    };
  }

  private _evtDragEnter(event: DragEvent): void {
    let factory = getDropData(event, MIME_TYPE);
    event.dataTransfer.dropEffect = factory ? 'copy' : 'none';
    event.preventDefault();
    event.stopPropagation();
    this.addClass('drag-over');
  }

  private _evtDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeClass('drag-over');
  }

  private _evtDragOver(event: DragEvent): void {
    let factory = getDropData(event, MIME_TYPE);
    if (!factory) {
      this.removeClass('drag-over');
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  private _evtDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeClass('drag-over');
    let factory = getDropData(event, MIME_TYPE);
    if (factory) {
      this.removeChildAt(0);
      this.addChild(factory());
    }
  }
}


function createDroppable(): DroppableWidget {
  let widget = new DroppableWidget();
  widget.addClass('content');
  widget.addClass('green');
  return widget;
}


function createList(): Widget {
  let widget = new Widget();
  widget.addClass('content');
  widget.addClass('blue');
  return widget;
}


function populateList(list: Widget): void {
  let plot = document.body.removeChild(document.getElementById(PLOT_ID));
  let itemOne = new DraggableWidget('bokeh plot one', () => {
    let widget = new Widget();
    widget.node.appendChild(plot);
    return widget;
  });
  itemOne.addClass('yellow');
  let itemTwo = new DraggableWidget('random text widget', () => {
    let widget = new Widget();
    let text = 'This is just a random child with text in it.';
    widget.node.appendChild(document.createTextNode(text));
    return widget;
  });
  itemTwo.addClass('green');
  let itemThree = new DraggableWidget('null factory', null);
  itemThree.addClass('red');
  list.addChild(itemOne);
  list.addChild(itemTwo);
  list.addChild(itemThree);
}


function main(): void {
  let list = createList();
  let droppable = createDroppable();
  let panel = new SplitPanel();
  panel.orientation = SplitPanel.Horizontal;
  panel.children = [list, droppable];
  SplitPanel.setStretch(list, 1);
  SplitPanel.setStretch(droppable, 5);
  populateList(list);
  panel.id = 'main';
  Widget.attach(panel, document.body);
  window.onresize = () => panel.update();
}


window.onload = main;
