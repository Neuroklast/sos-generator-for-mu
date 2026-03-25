/**
 * useUndoStack – lightweight undo history for discrete user actions.
 *
 * Each action pushed onto the stack contains a human-readable description and
 * an `undo` callback that reverts the state change. Calling `undo()` executes
 * the top action and removes it from the stack.
 *
 * Usage:
 *   const { push, undo, canUndo } = useUndoStack()
 *
 *   // Before mutating state:
 *   push({ description: 'Add artist mapping', undo: () => setMappings(prevSnapshot) })
 */
import { useCallback, useRef, useState } from 'react'

export interface UndoAction {
  description: string
  undo: () => void
}

const DEFAULT_MAX_SIZE = 50

export function useUndoStack(maxSize = DEFAULT_MAX_SIZE) {
  const [canUndo, setCanUndo] = useState(false)
  // Use a ref so callbacks captured in event listeners always see the latest stack.
  const stackRef = useRef<UndoAction[]>([])

  const push = useCallback((action: UndoAction) => {
    const next = [...stackRef.current.slice(-(maxSize - 1)), action]
    stackRef.current = next
    setCanUndo(next.length > 0)
  }, [maxSize])

  /** Executes and removes the most recently pushed action. Returns it, or undefined if empty. */
  const undo = useCallback((): UndoAction | undefined => {
    const stack = stackRef.current
    if (stack.length === 0) return undefined
    const action = stack[stack.length - 1]
    const next = stack.slice(0, -1)
    stackRef.current = next
    setCanUndo(next.length > 0)
    action.undo()
    return action
  }, [])

  return { push, undo, canUndo }
}
