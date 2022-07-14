/* eslint-disable lit-a11y/click-events-have-key-events */
/* eslint-disable lines-between-class-members */

import { html, LitElement } from 'lit';
import { addDelegateListener, moveFocusToDialog, trapTabKey } from './utils';

export type A11yDialogEvent = 'cancel' | 'close' | 'show';

export class A11yDialog extends LitElement {
  public open;
  protected previouslyFocused: null | HTMLElement;

  static properties = {
    open: {
      reflect: true,
      type: Boolean,
    },
    previouslyFocused: { state: true },
  };

  constructor() {
    super();
    this.setAttribute('aria-hidden', 'true');
    this.setAttribute('aria-modal', 'true');
    this.setAttribute('role', 'dialog');
    this.setAttribute('tabindex', '-1');

    this.open = this.hasAttribute('open');
    this.previouslyFocused = null;

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

  protected doShowCleanup = () => {
    this.previouslyFocused = document.activeElement as HTMLElement;
    this.removeAttribute('aria-hidden');
    moveFocusToDialog(this);

    this.addEventListener('keydown', this.bindKeypress, true);
    document.addEventListener('focus', this.maintainFocus, true);
  };

  close = (type: 'close' | 'cancel' = 'close') => {
    this.open = false;

    this.dispatchEvent(new Event(type));
  };

  protected doHideCleanup = () => {
    this.setAttribute('aria-hidden', 'true');
    this.previouslyFocused?.focus();

    this.removeEventListener('keydown', this.bindKeypress, true);
    document.removeEventListener('focus', this.maintainFocus, true);
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
        this.doShowCleanup();
      } else {
        this.doHideCleanup();
      }
    }
  }

  render() {
    return html`
      <div part="overlay" @click="${this.__cancel}"></div>
      <div part="content" role="document">
        <slot name="content"></slot>
      </div>
    `;
  }
}
