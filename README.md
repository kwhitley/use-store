Cross-component, persistable useState() effect, without context
===

# Why?
Even with the advent of React hooks, cross-component shared state
is still being solved with either context/provider hooks (messy), or traditional
stores like redux/mobx (messier).  This store more or less mirrors the signature of
the incredibly elegant `useState()` hook, with optional local persistence built-in.

# Installation
```
yarn add use-store-hook
```

# API
### useStore(namespace, [initialValue=undefined], [options={}])
returns `[ value, setValue ]` pair, identical to `useState()` in React
```js
import { useStore } from 'use-store-hook'

// must be called inside a React component
let [ value, setValue ] = useStore('foo')
// value = undefined
setValue(3)
// value = 3
```

###### Arguments
- `namespace` (string) **required** - this is the reference you'll share throughout the app for a specific value.  E.g. `useStore('myValue')`
- `initialValue` (anything) **optional** - optional default value which will be set by the first component that encounters this hook on a given namespace.  This will be ignored if persist is enabled and value found locally.
- `options` (object) **optional** - options for the hook (see below):
  - `persist` (boolean, default=false)

### globalStore.set(namespace, initialValue, options) // params identical to `useStore()` above
For manually setting initial values and persist options so individual components don't have to (also to solve race conditions)
```js
import { globalStore } from 'use-store-hook'

globalStore.set('foo', 'bar', { persist: true })
```

# Example (Elaborate)
```js
  // ComponentA.js

  import React from 'react'
  import { useStore } from 'use-store-hook'

  export default function ComponentA() {
    let [ value, setValue ] = useStore('myValue', 3)

    return (
      <div>ComponentA:value = { value }</div>

      <button onClick={() => setValue(value + 1)}>
        Increment
      </button>
    )
  }
```

```js
  // ComponentB.js

  import React from 'react'
  import { useStore } from 'use-store-hook'
  import ComponentA from './ComponentA'

  export default function ComponentB() {
    let [ value, setValue ] = useStore('myValue', 3)

    return (
      <div>
        ComponentB:value = { value } // this will increment as ComponentA clicks are registered

        <ComponentA />
      </div>
    )
  }
```
