import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { renderHook, cleanup, act, unmount } from '@testing-library/react-hooks'

// test files
import { Store, globalStore, useStore } from '../src/index.js'

const VALUE = 0
const SETTER = 1

const createInput = ([ value, onChange ]) => {
  const utils = render(<input aria-label="mock-input" value={value} onChange={onChange} />)
  const input = utils.getByLabelText('mock-input')

  return input
}

class BroadcastChannel {
  constructor(channel) {
    this.channel = channel
    this.listeners = {}
  }

  addEventListener = jest.fn().mockImplementation((event, listener) => {
    const existingListeners = this.listeners[event] || []
    const mockListener = jest.fn().mockImplementation(listener)
    this.listeners[event] = [...existingListeners, mockListener]
  })

  postMessage = jest.fn().mockImplementation(message => {
    if (!this.listeners.message) {
      return
    }
    this.listeners.message.forEach(listener => {
      listener({ data: message })
    })
  })
}

window.BroadcastChannel = BroadcastChannel

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

    test('using persist: true does not break', () => {
      const { result } = renderHook(() => useStore('test2', 1, { persist: true })) // initialize to 1

      expect(result.current[VALUE]).toBe(1) // but expect 2 from previous test
    })

    describe('magicSetter behavior (automatic derivation of Event/SyntheticEvents values)', () => {
      test('setValue can be used directly with onChange (without event.target.value)', () => {
        const { result } = renderHook(() => useStore('test-input', 1))

        act(() => {
          let input = createInput(result.current)
          fireEvent.change(input, { target: { value: '23' } })
        })

        expect(result.current[VALUE]).toBe('23')
      })

      test('setting value to object matching event signature will not infer value', () => {
        const { result } = renderHook(() => useStore('test-input', 1))

        const fakeEvent = { target: { value: 3 }}

        act(() => {
          act(() => result.current[SETTER](fakeEvent))
        })

        expect(result.current[VALUE]).toBe(fakeEvent)
      })
    })

    describe('broadcast behavior (cross-tab synchronization using BroadcastChannel)', () => {
      let options = {
        broadcast: true
      }
      const initailValue = 'test1'

      test('using broadcast: true instantiates a BroadcastChannel', () => {
        const store = new Store({
          value: 'test broadcast',
          options: {
            broadcast: true
          },
          namespace: 'test-broadcast-instance'
        })
        expect(store.channel).toBeInstanceOf(BroadcastChannel)
        expect(store.channel.addEventListener).toHaveBeenCalledWith('message', store.handleMessage)
      })

      test('setting a new value broadcasts a message', () => {
        const { result } = renderHook(() => useStore('test-broadcast', initailValue, options))
        const testStore = globalStore['test-broadcast']

        act(() => {
          const [, setValue] = result.current;
          setValue('test2')
        })

        expect(testStore.channel.postMessage).toHaveBeenCalledWith('test2')
      })

      test('receiving a message invokes handleMessage', async () => {
        const { result } = renderHook(() => useStore('test-broadcast', initailValue, options))
        const testStore = globalStore['test-broadcast']
        act(() => {
          testStore.channel.postMessage('test3')
        })
        const [value] = result.current
        expect(value).toEqual('test3')
        testStore.channel.listeners['message'].forEach(listener => {
          expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: 'test3' }))
        })
      })
    })
  })
})
