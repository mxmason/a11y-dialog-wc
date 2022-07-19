import focusableSelectors from 'focusable-selectors';

const enum BrowserEvents {
  CLICK = 'click',
  KEYDOWN = 'keydown',
  FOCUSOUT = 'focusout',
}

const enum DialogEvents {
  CANCEL = 'cancel',
  CLOSE = 'close',
  SHOW = 'show',
}
// Create references to selectors that which authors
// might use in their markup.
const CANCEL_SELECTOR = '[data-a11y-dialog-cancel]';
const CLOSE_SELECTOR = '[data-a11y-dialog-close]';

// Create a reusable template for the component.
const template = document.createElement('template');
template.innerHTML = `
  <div part="overlay" data-a11y-dialog-cancel></div>
  <div part="content" role="document">
    <slot name="content"></slot>
  </div>
`;

export type A11yDialogElement = InstanceType<typeof A11yDialog>;

export class A11yDialog extends HTMLElement {
  // Store a reference to the element that was in focus
  // before the dialog was opened.
  protected previouslyFocused: null | HTMLElement = null;

  // Make the open property publicly available
  get open() {
    return this.hasAttribute('open');
  }

  // Change component's public attributes when the`open` property changes,
  // and run other code as necessary.
  set open(isOpen) {
    if (isOpen) {
      this.setAttribute('open', '');
      this.removeAttribute('aria-hidden');
      this.previouslyFocused = document.activeElement as HTMLElement;
      moveFocusToDialog(this);
    } else {
      this.removeAttribute('open');
      this.setAttribute('aria-hidden', 'true');
      this.previouslyFocused?.focus();
    }
  }

  constructor() {
    super();

    // Create a shadow root and append to it a copy of our template
    // (available as `this.shadowRoot`).
    this.attachShadow({ mode: 'open' }).appendChild(
      template.content.cloneNode(true)
    );
  }

  /**
   * Enhance the markup of our component once it's
   * connected to the DOM.
   */
  connectedCallback() {
    // Add attributes to give the host element its necessary a11y API semantics.
    this.setAttribute('aria-hidden', 'true');
    this.setAttribute('aria-modal', 'true');
    this.setAttribute('role', 'dialog');
    this.setAttribute('tabindex', '-1');

    // Finds the overlay element in the Shadow DOM
    // and candels the modal when it's clicked
    this.shadowRoot
      ?.querySelector(CANCEL_SELECTOR)
      ?.addEventListener(BrowserEvents.CLICK, cancel.bind(this));

    // Add delegated event listeners to the host element.
    this.addEventListener(BrowserEvents.CLICK, bindDelegatedClicks, true);
    this.addEventListener(
      BrowserEvents.KEYDOWN,
      bindKeypress as EventListener,
      true
    );
    this.addEventListener(
      BrowserEvents.FOCUSOUT,
      maintainFocus as EventListener,
      true
    );
  }

  /**
   * Do some cleanup work when the component is removed from the DOM
   */
  disconnectedCallback() {
    // Clean up our event listeners.
    this.removeEventListener(BrowserEvents.CLICK, bindDelegatedClicks, true);
    this.removeEventListener(
      BrowserEvents.KEYDOWN,
      bindKeypress as EventListener,
      true
    );
    this.removeEventListener(
      BrowserEvents.FOCUSOUT,
      maintainFocus as EventListener,
      true
    );
  }

  // Register a list of attributes that the component should obvserve.
  static get observedAttributes() {
    return ['open'] as const;
  }

  /**
   * Watch for changes to our observed attributes,
   * and update public properties of the DOM node
   * accordingly.
   */
  attributeChangedCallback(
    name: typeof A11yDialog.observedAttributes[number],
    _old: string | null,
    value: string | null
  ): void {
    if (name === 'open' && _old !== value) {
      this.open = value === '';
    }
  }

  /**
   * Open the dialog and dispatch its `show` event.
   */
  show = () => {
    this.open = true;

    this.dispatchEvent(new Event(DialogEvents.SHOW));
  };

  /**
   * Close the dialog and dispatch its 'close' event.
   */
  close = () => {
    this.open = true;

    this.dispatchEvent(new Event(DialogEvents.CLOSE));
  };
}

/**
 * Close the dialog and dispatch a special internal-only `cancel` event.
 */
function cancel(this: A11yDialogElement) {
  this.open = false;

  this.dispatchEvent(new Event(DialogEvents.CANCEL));
}

/**
 * An event handler bound to the 'click' evebt on Host element.
 * Listens for clicks on close or cancel buttons, then calls the
 * appropriate function.
 *
 * This is meant as a convenience for authors, so they don't have
 * to bind their own listeners to their close or cancel triggers
 * within the dialog.
 */
function bindDelegatedClicks(this: A11yDialogElement, evt: Event) {
  const dialog = this;
  const target = evt.target as HTMLElement;

  if (target.matches(CLOSE_SELECTOR)) {
    dialog.close();
  }

  if (target.matches(CANCEL_SELECTOR)) {
    cancel.call(dialog);
  }
}

/**
 * Event handler bound to the 'keydown' event on the Host element.
 * Responds to specific key presses (namely ESC and TAB).
 */
function bindKeypress(this: A11yDialogElement, event: KeyboardEvent) {
  const dialog = this;
  // If the dialog is shown and the ESC key is pressed,
  // cancel the dialog
  if (event.key === 'Escape') {
    event.preventDefault();
    cancel.call(dialog);
  }

  // If the dialog is shown and the TAB key is pressed, make sure the focus
  // stays trapped within the dialog element
  if (event.key === 'Tab') {
    trapTabKey(dialog, event);
  }
}

/**
 * Event handler bound to the `focusout` event of the Host element.
 * Ensures that focus cannot accidentally leave the dialog context.
 */
function maintainFocus(this: A11yDialogElement, event: FocusEvent) {
  const dialog = this;

  // This is the element that is *about to receive* focus.
  const nextActiveEl = event.relatedTarget as HTMLElement | null;

  // If the element recieving focus is not inside an a11y-dialog,
  // return focus to this dialog.
  if (!nextActiveEl?.closest('a11y-dialog')) {
    moveFocusToDialog(dialog);
  }
}

/**
 * Set the focus to the first element with `autofocus` with the element or the
 * element itself
 */
export function moveFocusToDialog(node: HTMLElement) {
  const focused = (node.querySelector('[autofocus]') || node) as HTMLElement;
  focused.focus();
}

/**
 * Get the focusable children of the given element.
 */
function getFocusableChildren(node: ParentNode): HTMLElement[] {
  const focusableEls = Array.prototype.slice.call(
    node.querySelectorAll(focusableSelectors.join(''))
  ) as HTMLElement[];
  return focusableEls.filter(
    child =>
      !!(
        child.offsetWidth ||
        child.offsetHeight ||
        child.getClientRects().length
      )
  );
}

/**
 * Trap the focus inside the given element.
 */
export function trapTabKey(node: HTMLElement, event: KeyboardEvent) {
  const focusableChildren = getFocusableChildren(node);
  const focusedItemIndex = focusableChildren.indexOf(
    document.activeElement as HTMLElement
  );

  // If the SHIFT key is pressed while tabbing (moving backwards) and the
  // currently focused item is the first one, move the focus to the last
  // focusable item from the dialog element
  if (event.shiftKey && focusedItemIndex === 0) {
    focusableChildren[focusableChildren.length - 1].focus();
    event.preventDefault();

    // If the SHIFT key is not pressed (moving forwards) and the currently
    // focused item is the last one, move the focus to the first focusable item
    // from the dialog element
  } else if (
    !event.shiftKey &&
    focusedItemIndex === focusableChildren.length - 1
  ) {
    focusableChildren[0].focus();
    event.preventDefault();
  }
}

export type A11yDialogEvent = 'cancel' | 'close' | 'show';
