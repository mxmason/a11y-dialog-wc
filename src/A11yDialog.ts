/* eslint-disable lines-between-class-members */
/* eslint-disable no-use-before-define */
/* eslint-disable lit-a11y/click-events-have-key-events */

import { moveFocusToDialog, trapTabKey } from './utils';

const template = document.createElement('template');
template.innerHTML = `
  <div part="overlay" part="overlay"></div>
  <div part="content" role="document">
    <slot name="content"></slot>
  </div>
`;

export type A11yDialogElement = InstanceType<typeof A11yDialog>;
export type A11yDialogEvent = 'cancel' | 'close' | 'show';

function bindDelegatedClicks(this: A11yDialogElement, evt: Event) {
  const dialog = this;
  const target = evt.target as HTMLElement;

  if (target.matches('[data-a11y-dialog-close]')) {
    dialog.close();
  }

  if (target.matches('[data-a11y-dialog-cancel]')) {
    fireEvent.call(dialog, 'cancel');
  }
}

/**
 * Event handler used when listening to some specific key presses
 * (namely ESC and TAB)
 */
function bindKeypress(this: A11yDialogElement, event: KeyboardEvent) {
  const dialog = this;
  // If the dialog is shown and the ESC key is pressed,
  // cancel the dialog
  if (event.key === 'Escape') {
    event.preventDefault();
    fireEvent.call(dialog, 'cancel');
  }

  // If the dialog is shown and the TAB key is pressed, make sure the focus
  // stays trapped within the dialog element
  if (event.key === 'Tab') {
    trapTabKey(dialog, event);
  }
}

function maintainFocus(this: A11yDialogElement, event: FocusEvent) {
  const dialog = this;
  const nextActiveEl = event.relatedTarget as HTMLElement | null;

  if (!nextActiveEl?.closest('a11y-dialog')) {
    moveFocusToDialog(dialog);
  }
}

function fireEvent(this: A11yDialogElement, evtName: A11yDialogEvent) {
  this.open = evtName === 'show';

  this.dispatchEvent(new Event(evtName));
}

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
      this.previouslyFocused = document.activeElement as HTMLElement;
      moveFocusToDialog(this);
    } else {
      this.removeAttribute('open');
      this.setAttribute('aria-hidden', 'true');
      this.previouslyFocused?.focus()
    }
  }

  constructor() {
    super();
    // Create a shadow root
    this.attachShadow({ mode: 'open' }).appendChild(
      template.content.cloneNode(true)
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
      ?.addEventListener('click', fireEvent.bind(this, 'cancel'));

    this.addEventListener('click', bindDelegatedClicks, true);
    this.addEventListener('keydown', bindKeypress as EventListener, true);
    this.addEventListener('focusout', maintainFocus as EventListener, true);
  }

  disconnectedCallback() {
    this.removeEventListener('click', bindDelegatedClicks, true);
    this.removeEventListener('keydown', bindKeypress as EventListener, true);
    this.removeEventListener('focusout', maintainFocus as EventListener, true);
  }

  show = fireEvent.bind(this, 'show');

  close = fireEvent.bind(this, 'close');

  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ): void {
    if (name === 'open' && _old !== value) {
      this.open = value === '';
    }
  }

}
