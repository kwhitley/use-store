import { renderHook, cleanup, act, unmount } from 'react-hooks-testing-library'

afterEach(cleanup)

// test files
import { useStore } from '../src/index.js'

const VALUE = 0
const SETTER = 1

describe('@kwhitley/use-store', () => {
  describe('useStore(namespace:string, initialValue:anything, options:object) : function', () => {
    test('exports via { useStore } named export', () => {
      expect(typeof useStore).toBe('function')
    })

    test('initializes value to initialValue', () => {
      const { result } = renderHook(() => useStore('test1', 1))

      expect(result.current[VALUE]).toBe(1)
    })

    test('setValue can change the value', () => {
      const { result } = renderHook(() => useStore('test1', 1))

      act(() => result.current[SETTER](result.current[VALUE] + 1))

      expect(result.current[VALUE]).toBe(2)
    })

    test('hook is shared across functional scopes', () => {
      const { result } = renderHook(() => useStore('test1', 1)) // initialize to 1

      expect(result.current[VALUE]).toBe(2) // but expect 2 from previous test
    })

    test('hook is shared across functional scopes', () => {
      const { result } = renderHook(() => useStore('test1', 1)) // initialize to 1

      expect(result.current[VALUE]).toBe(2) // but expect 2 from previous test
    })
  })
})
