/* eslint-disable lit-a11y/click-events-have-key-events */
/* eslint-disable lines-between-class-members */

import { addDelegateListener, moveFocusToDialog, trapTabKey } from './utils';

export type A11yDialogEvent = 'cancel' | 'close' | 'show';

const tmp = document.createElement('template');
tmp.innerHTML = `
  <div part="overlay" part="overlay"><div>
  <div part="content">
    <slot name="content"></slot>
  </div>
`;

export class A11yDialog extends HTMLElement {
  protected previouslyFocused: null | HTMLElement;

  static get observedAttributes() {
    return ['open'];
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(isOpen) {
    if (isOpen) {
      this.setAttribute('open', '');
      this.removeAttribute('aria-hidden');
    } else {
      this.removeAttribute('open');
      this.setAttribute('aria-hidden', 'true');
    }
  }

  constructor() {
    super();
    // Create a shadow root
    this.attachShadow({ mode: 'open' }).appendChild(
      tmp.content.cloneNode(true)
    );

    this.previouslyFocused = null;
  }

  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    this.setAttribute('aria-modal', 'true');
    this.setAttribute('role', 'dialog');
    this.setAttribute('tabindex', '-1');
    this.open = this.hasAttribute('open');

    this.shadowRoot
      ?.querySelector('[part="overlay"]')
      ?.addEventListener('click', this.__cancel);

    addDelegateListener(this, 'click', '[data-a11y-dialog-cancel]', () => {
      this.__cancel();
    });

    addDelegateListener(this, 'click', '[data-a11y-dialog-close]', () => {
      this.close();
    });
  }

  show = () => {
    this.open = true;

    this.dispatchEvent(new Event('show'));
  };

  close = (type: 'close' | 'cancel' = 'close') => {
    this.open = false;

    this.dispatchEvent(new Event(type));
  };

  protected __cancel = this.close.bind(this, 'cancel');

  /**
   * Private event handler used when listening to some specific key presses
   * (namely ESC and TAB)
   */
  protected bindKeypress = (event: KeyboardEvent) => {
    // If the dialog is shown and the ESC key is pressed,
    // cancel the dialog
    if (event.key === 'Escape') {
      event.preventDefault();
      this.__cancel();
    }

    // If the dialog is shown and the TAB key is pressed, make sure the focus
    // stays trapped within the dialog element
    if (event.key === 'Tab') {
      trapTabKey(this, event);
    }
  };

  protected maintainFocus = (event: FocusEvent) => {
    if (
      !(event.target as HTMLElement).closest(
        '[aria-modal="true"], [data-a11y-dialog-ignore-focus-trap]'
      )
    )
      moveFocusToDialog(this);
  };

  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ): void {
    if (name === 'open' && _old !== value) {
      if (value === '') {
        this.open = true;

        this.previouslyFocused = document.activeElement as HTMLElement;

        moveFocusToDialog(this);

        this.addEventListener('keydown', this.bindKeypress, true);
        document.addEventListener('focus', this.maintainFocus, true);
      } else {
        this.open = false;

        this.previouslyFocused?.focus();

        this.removeEventListener('keydown', this.bindKeypress, true);
        document.removeEventListener('focus', this.maintainFocus, true);
      }
    }
  }
}
