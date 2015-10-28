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
Message
} from 'phosphor-messaging';

import {
Widget, attachWidget
} from 'phosphor-widget';

import './dragdrop.css';

const PLOT_ID = '1edbdc7a-876c-4549-bcf2-7726b8349a2e'

const WIDGET_MIME_TYPE = 'application/x-phosphor-widget';

interface IDragMimeData {
  mime: string;
  reference: string;
}

let { clearMimeData, getMimeData, getMimeFactory } =
((cache: { [reference: string]: () => Widget }) => {
  let id = 0;

  function clearMimeData(reference: string): void {
    delete cache[reference];
  };

  function getMimeData(factory: () => Widget): IDragMimeData {
    if (!factory) {
      return null;
    }
    let reference = 'reference-' + id++;
    cache[reference] = factory;
    return { mime: WIDGET_MIME_TYPE, reference: reference };
  };

  function getMimeFactory(reference: string): () => Widget {
    return cache[reference] || null;
  };

  return { clearMimeData, getMimeData, getMimeFactory };
})({ });

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
    this.node.addEventListener('dragstart', this);;
    this.node.addEventListener('dragend', this);;
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.node.removeEventListener('dragstart', this);
    this.node.removeEventListener('dragend', this);
  }

  private _evtDragStart(event: DragEvent): void {
    this._mimeData = getMimeData(this._factory);
    if (this._mimeData) {
      event.dataTransfer.setData(this._mimeData.mime, this._mimeData.reference);
    }
  }

  private _evtDragEnd(event: DragEvent): void {
    if (this._mimeData) {
      clearMimeData(this._mimeData.reference);
    }
  }

  private _mimeData: IDragMimeData;
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
    let validMime = !!event.dataTransfer.getData(WIDGET_MIME_TYPE);
    event.dataTransfer.dropEffect = validMime ? 'copy' : 'none';
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
    if (!event.dataTransfer.getData(WIDGET_MIME_TYPE)) {
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
    let reference = event.dataTransfer.getData(WIDGET_MIME_TYPE);
    let factory = getMimeFactory(reference);
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
  let itemThree = new DraggableWidget('bad mime type', null);
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
  attachWidget(panel, document.body);
  window.onresize = () => panel.update();
}

window.onload = main;
