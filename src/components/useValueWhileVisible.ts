import { useState } from 'react';

/**
 * Returns `value` while `visible` is true, and the last value it had while visible once it is not.
 *
 * Dialogs keep rendering during their exit animation after `visible` turns false. Anything the
 * caller clears or changes on close (the selected notes, a folder that was just deleted, a count
 * that dropped to 0) would otherwise show up in those fading frames as a flash of wrong content.
 */
export function useValueWhileVisible<T>(
  value: T,
  visible: boolean,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const [held, setHeld] = useState(value);
  // Updating state during render is React's pattern for deriving from a previous render. The
  // equality check stops it from looping, so values that are rebuilt on every render (arrays)
  // need an `isEqual` that compares their contents.
  if (visible && !isEqual(held, value)) setHeld(value);
  return visible ? value : held;
}
