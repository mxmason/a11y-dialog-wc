import focusableSelectors from 'focusable-selectors';

/**
 * Query the DOM for nodes matching the given selector, scoped to context (or
 * the whole document)
 */
function $$(selector: string, context: ParentNode): HTMLElement[] {
  return Array.prototype.slice.call(context.querySelectorAll(selector));
}


/**
 * Set the focus to the first element with `autofocus` with the element or the
 * element itself
 */
export function moveFocusToDialog(node: ParentNode) {
  const focused = (node.querySelector('[autofocus]') || node) as HTMLElement;

  focused.focus();
}

/**
 * Get the focusable children of the given element.
 */
function getFocusableChildren(node: ParentNode): HTMLElement[] {
  return $$(focusableSelectors.join(','), node).filter(
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

/**
 * Add a delegated event listener to the Document and trigger the callback
 * function if the event's target matches the provided selectors.
 * @returns A cleanup function which, when called, removes
 * the associated listener from the Document.
 */
export function addDelegateListener(
  delegate: ParentNode,
  type: string,
  targetSelectors: string,
  callback: EventListener
) {
  const listener: EventListener = evt => {
    if ((evt.target as HTMLElement).matches(targetSelectors)) {
      callback(evt);
    }
  };
  delegate.addEventListener(type, listener, true);

  return () => delegate.removeEventListener(type, listener, true);
}
