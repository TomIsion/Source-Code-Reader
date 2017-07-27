# Zepto.js Event

## 相关的API

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

- 方便移除事件监听
- 方便触发模拟事件
- 增强了事件对象 event

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

### $.fn.on

函数体内只做了两件事：

1. 函数参数的检查
2. 遍历执行真正的事件绑定

其中比较复杂的是执行真正的事件绑定

createProxy
compatible
