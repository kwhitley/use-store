Super simple useStore() hook for React, mirroring useState() while allowing persistence
===

# Why?
Even with the advent of React hooks, cross-component shared state
is still being solved with either context/provider hooks, or traditional
stores like redux/mobx.  This store [nearly] mirrors the signature of
the elegant `useState()` hook, without awkward redux/reducer patterns.

# Installation
```
yarn add -D @kwhitley/use-store
```

# Syntax
```
// let [ value, setValue ] = useStore(namespace, [initialValue=undefined], [options={}])

Example 1:
let [ value, setValue ] = useStore('age', 99)
// value = 99
setValue(20)
// value = 20

Example 2:
let [ value, setValue ] = useStore('loggedIn', false, { persist: true })
// value = false
setValue(true)
// value = true, even after refreshing app
```

#### Arguments
- `namespace` (string, **required**) -  required, this is the reference you'll share throughout the app for a specific value.  E.g. `useStore('myValue')`
- `initialValue (anything, optional) - optional default value which will be set by the first component that encounters this hook on a given namespace.  This will be ignored if persist is enabled and value found locally.
- `options` (object, optional) - additonal options for the hook

###### Options
- `persist` (boolean, default=false)

##### Returns
`[ value, setValue ]` returns a signature identical to `useState()`, namely an array pair of the value itself and its setter function.

# Usage
```
  // ComponentA.js

  import React from 'react'
  import { useStore } from '@kwhitley/use-store'

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

```
  // ComponentB.js

  import React from 'react'
  import { useStore } from '@kwhitley/use-store'
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
