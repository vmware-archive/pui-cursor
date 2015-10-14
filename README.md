# PUI Cursor
[![Build Status](https://travis-ci.org/pivotal-cf/pui-cursor.svg)](https://travis-ci.org/pivotal-cf/pui-cursor)

Utility designed for immutable data in a React flux architecture.
Also contains pure render mixin for cursors.


##Cursors

TODO: explanation of cursor concept

##API

PUI Cursor provides wrappers for the [React immutability helpers](https://facebook.github.io/react/docs/update.html).
These wrappers allow you to transform the data in your cursor; the transformation you specify is applied and the new result
is used to update the cursor value.

TODO: the API other than `apply`

###apply

If the simpler functions like `merge`, `set`, or `push` cannot describe the update you need,
you can always call `apply` to specify an arbitrary transformation.

Example:

```js
var currentData = {foo: 'bar'}
var cursor = new Cursor(currentData, function(newData){ this.setState({data: newData})});

cursor.apply(function(shallowCloneOfOldData) {
  shallowCloneOfOldData.foo += 'bar';
  return shallowCloneOfOldData;
});
```
 
__Warning:__ The callback for `apply` is given a shallow clone of your data 
(this is the behavior of the apply function in the React immutability helpers).
This can cause unintended side effects, illustrated in the following example:
 
```js
var currentData = {animals: {mammals: {felines: 'tiger'}}}
var cursor = new Cursor(currentData, function(newData){ this.setState({data: newData})});
 
cursor.apply(function(shallowCloneOfOldData) {
  shallowCloneOfOldData.animals.mammals.felines = 'lion';
  return shallowCloneOfOldData;
});
```

Since the data passed into the callback is a shallow clone of the old data, values that are nested more than one level 
deep are not copied, so `shallowCloneOfOldData.animals.mammals` will refer to the exact same object in memory as `currentData.animals.mammals`. 

The above version of `apply` will mutate the previous data in the cursor (`currentData`) in addition to updating the cursor.
As a side effect, `PureRenderMixin` will not detect any changes in the data when it compares previous props and new props.
To safely use `apply` on nested data, you need to use the React immutability helpers directly:

```js
var reactUpdate = require('react/lib/update');

cursor.apply(function(shallowCloneOfOldData) {
  return reactUpdate.apply(shallowCloneOfOldData, {
    animals: {
      mammals: {
        felines: {$set: 'lion'}
      }
    });
  });
});
```

---

(c) Copyright 2015 Pivotal Software, Inc. All Rights Reserved.