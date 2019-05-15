import { useState, useEffect } from 'react'
import localforage from 'localforage'

if (window !== undefined) {
  window.localforage = localforage
}

// prefix for localstorify
const GLOBALSTORAGE_PREFIX = '!rus::'

// individual Store implementation for tracking values/setters
export class Store {
  constructor({ value, namespace, options }) {
    this.state = value

    if (options.persist) {
      console.log('retrieving', GLOBALSTORAGE_PREFIX + namespace, 'from localforage')
      localforage
        .getItem(GLOBALSTORAGE_PREFIX + namespace)
        .then(storedValue => {
          console.log('setting value for', namespace, 'to', storedValue, 'from localforage')
          if (storedValue !== this.state) {
            this.setState(storedValue, { skipWrite: true })
          }
        })
        .catch(console.warn)
    }

    this.options = options
    this.namespace = namespace
    this.setters = []
    this.error = undefined
  }

  setState = (value, options = {}) => {
    if (this.options.persist && !options.skipWrite) {
      localforage
        .setItem(GLOBALSTORAGE_PREFIX + this.namespace, value)
        .then(storedValue => {
          this.state = storedValue
        })
        .catch(err => this.error = err)
    } else {
      this.state = value
    }
    this.setters.forEach(setter => setter(this.state))
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

  clear = (namespace) => localforage.removeItem(GLOBALSTORAGE_PREFIX + namespace)

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

  if (!whichStore.setters.includes(set)) {
    whichStore.setters.push(set)
  }

  useEffect(() => () => {
    whichStore.setters = whichStore.setters.filter(setter => setter !== set)
  }, [])

  return [ state, whichStore.setState, whichStore.error ]
}
