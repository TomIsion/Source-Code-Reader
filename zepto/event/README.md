# Zepto.js Event

[http://zeptojs.com/#event](http://zeptojs.com/#event)

## 建议

- 建议先熟悉 Zepto.js 事件相关的API
- 建议了解 JavaScript Event 相关内容（参考资料[]()）

## Zepto.js 所提供的API

- $.Event
- $.proxy
- on
- off
- one
- trigger
- triggerHandler
- event.isDefaultPrevented
- event.isImmediatePropagationStopped
- event.isPropagationStopped

## event.js 对事件处理的增强

### 1. 无论是DOM元素还是非DOM元素，无论是现有事件还是自定义事件，都实现了事件模型

`Zepto.js` 将事件系统拓展到了所有的 `Zepto` 对象，而不仅仅是 `DOM` 元素，这样，就可以很简单的实现发布订阅模式

```
const objEvent = $({})
objEvent.on('hey', () => console.log(1))
objEvent.trigger('hey')

// 1
```

### 2. 方便增加、移除和触发事件监听

对于DOM元素对象来说，提供了批量增加、移除事件监听的能力，同时可以控制是否冒泡触发事件

对于所有的事件系统来说，提供了诸如命名空间、委托、false检查等等的方便机制

### 3. 增强了事件对象 event

提供了 `event.isDefaultPrevented`、`event.isImmediatePropagationStopped`、`event.isPropagationStopped` 事件对象相关操作的检测

## event.js 对特殊事件的修复

### 1. mouse[x] 相关的事件

主要相关的事件是这两对事件：

- mouseover
- mouseout

和：

- mouseenter
- mouseleave

后者是DOM 3级事件中纳为标准的，表示用户鼠标**首次**移入元素内/移出元素时触发，**在该元素的子元素中移入移出并不会频繁触发**，不会冒泡

而前者是所有浏览器都支持的，其中在其子元素移入移出也会频繁触发，同时这两个事件的 `event` 事件对象还支持 `relatedTarget` 参数，表示刚刚离开/即将前往的元素

这里 `event.js` 使用前者来替代后者的事件监听，给相关的 event 事件对象都提供 `relatedTarget` 属性，判断 `e.target` 是否归属当前监听对象来决定是否触发回调函数

### 2. focus 相关的事件

主要的相关事件是这两对事件：

- focus
- blur

和：

- focusin
- focusout

前者所有的浏览器都支持，但是关键问题是这个事件**不会冒泡**

后者是DOM 3级事件才纳为标准，和前者的事件监听的效果一样，**会冒泡**

因为前者不会冒泡的特点，所以 `event.js` 对前者委托的事件监听需要在捕获阶段处理

为了避免出现冒泡不能获取的情况，在浏览器支持的情况下，默认使用后者代替前者

## 阅读的流程

### 1. $.fn.on(event, selector, data, callback, one)

通过API文档，了解这个函数有多种重载的形式

`event`：通常表示所监听的事件，多个事件使用空格隔开；如果传入的是对象，键值对分别是监听的事件 & 对应的回调函数

`selector`：选择器，当事件在匹配该选择器的元素上发起时，事件才会被触发（事件委托、事件代理）

`data`：会被挂载在 `event.data` 上面，拓展 `event` 事件对象的值

`callback`：传入事件监听的回调函数 （其中this 指向触发事件的元素）。事件处理程序返回 `false` 或者调用 `.preventDefault()` 将防止默认浏览器操作，如果直接传递 `false` 则代表 `() => false`。

`one`：`$.fn.one` 所使用的参数，表示一旦执行则移除该事件监听 

这么多参数，只有 `event` 与 `callback` 是必传的，所以在 `$.fn.on` 函数体内部首先做的是**实参的检查**

``` JavaScript
// 判断 event 是不是对象，如果是对象需要循环获取监听事件&回调函数
if (event && !isString(event)) {
  $.each(event, function(type, fn){
    $this.on(type, selector, data, fn, one)
  })
  // 支持链式调用
  return $this
}
```

`event` 是对象的情况下，循环对象获取键值对，递归调用 `.on` 方法绑定对应的事件以及回调

接下来还是

``` JavaScript
if (!isString(selector) && !isFunction(callback) && callback !== false)
  // 判断不存在 selector 的情况 则后面的参数都往前挪一个
  callback = data, data = selector, selector = undefined
  // 此时形式参数 event data callback
if (callback === undefined || data === false)
  // 判断不存在 data 的情况 参数继续前移
  callback = data, data = undefined
```