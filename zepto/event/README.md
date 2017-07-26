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

## Event.js 对事件处理的增强

- 方便移除事件监听
- 方便触发模拟事件
- 增强了事件对象 event

## 阅读的流程

### $.fn.on

函数体内只做了两件事：

1. 函数参数的检查
2. 遍历执行真正的事件绑定

其中比较复杂的是执行真正的事件绑定

createProxy
compatible
