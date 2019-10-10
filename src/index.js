import { useState, useEffect } from 'react'

if (window && window.console) {
  console.warn('Deprecation Notice: NPM package "use-store-hook" has been renamed to "use-store" (same version).  Please replace package.json references and switch to the new module name to remove this notice.')
}

// prefix for localStorage
const GLOBALSTORAGE_PREFIX = '!ush::'

const debounce = (func, delay = 100) => {
  let timer
  return function() {
    const context = this
    const args = arguments
    clearTimeout(timer)
    timer = setTimeout(() => func.apply(context, args), delay)
  }
}

// https://stackoverflow.com/a/2117523/11599918
const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// individual Store implementation for tracking values/setters
export class Store {
  constructor({ value, namespace, options }) {
    this.state = value
    this.id = uuid()

    if (options.persist) {
      try {
        let stored = localStorage.getItem(GLOBALSTORAGE_PREFIX + namespace)
        if (stored !== null) {
          this.state = JSON.parse(stored)
        }
      } catch(err) {

      }
    }

    if (options.broadcast && window.BroadcastChannel) {
      this.channel = new BroadcastChannel(GLOBALSTORAGE_PREFIX + namespace)
      this.channel.addEventListener('message', this.handleMessage)
    }

    this.options = options
    this.namespace = namespace
    this.setters = []
  }

  handleMessage = debounce((e) => {
    if (!e.data || e.data.id === this.id) {
      return
    }
    this.setState(e.data.message, { broadcast: false })
  }, 300)

  setState = (value, options = { broadcast: true }) => {
    this.state = value
    if (this.options.persist) {
      try {
        localStorage.setItem(GLOBALSTORAGE_PREFIX + this.namespace, JSON.stringify(value))
      } catch(err) {
        console.warn(`[use-store-hook]: failed to persist`, { value, err })
      }
    }
    this.setters.forEach(setter => setter(this.state))
    if (options.broadcast && this.options.broadcast) {
      this.channel.postMessage({ id: this.id, message: value })
    }
  }
}

// namespaced index of requested Stores
export class GlobalStore {
  set = (namespace, value, options = {}) => {
    if (this.hasOwnProperty(namespace)) {
      this[namespace].setState(value)
    } else {
      this[namespace] = new Store({ value, options, namespace })
    }
  }

  clear = (namespace) => {
    localStorage.removeItem(GLOBALSTORAGE_PREFIX + namespace)
  }

  persist = (...args) => this.set(...args, { persist: true })
}

// shared instantiation of GlobalStore
export const globalStore = new GlobalStore()

// the actual hook
export function useStore(namespace, value, options = {}) {
  let whichStore = undefined

  if (!namespace) {
    throw new Error('no namespace provided to useStore... try using useState() instead?')
  }

  if (globalStore.hasOwnProperty(namespace)) {
    whichStore = globalStore[namespace]
  } else {
    whichStore = globalStore[namespace] = new Store({ value, options, namespace })
  }

  const [ state, set ] = useState(whichStore.state)

  if (whichStore.setters.indexOf(set) === -1) {
    whichStore.setters.push(set)
  }

  useEffect(() => () => {
    whichStore.setters = whichStore.setters.filter(setter => setter !== set)
  }, [])

  const magicSetter = (setter) => (e) => {
    typeof e === 'object' && (e.nativeEvent || e.constructor.name === 'SyntheticEvent') && e.target
    ? setter(e.target.value)
    : setter(e)
  }

  return [ state, magicSetter(whichStore.setState) ]
}
