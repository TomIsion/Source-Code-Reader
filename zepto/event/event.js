//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      // handlers 保存所有的元素上面的事件监听
      /**
       * 解决的问题：绑定/移除的事件监听一定要是指向同样的函数引用
       * 就是需要将 元素 & 绑定的事件相关的内容 全部联系起来
       * {
       *  [element._zid]: [handler, {
       *    fn,
       *    sel,
       *    ...
       *  }]
       * }
       */
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  // 5. 给绑定事件的对应元素编号
  // 使用编号将事件监听缓存到 handlers 中
  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  // 10. 找到元素对应事件监听的那一个 handler 对象
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        // Q：这里为什么不直接使用 handler.fn === fn
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  // 将事件名称与命名空间区分开来
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  // 11. 
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  // 7. focus 相关的是否冒泡的实现
  // Q：
  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  /**
   * 6. 修复 mouseover / focus 相关的问题
   * mouseenter -> mouseover
   * mouseleave -> mouseout
   * focus -> focusin
   * blur -> focusout
   */
  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }
  
  // 4. 绑定事件监听的真正函数
  function add(element, events, fn, data, selector, delegator, capture){
    // 这里通过 zid 把绑定的事件监听全部记录下来
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      // 将事件名称与命名空间拆开
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // 此时的 handler 对象的内容
      // {
      //   fn: 回调函数（原始的）,
      //   sel: （过滤）选择器,
      //   e: 事件名称,
      //   ns: 命名空间（使用空格隔开）,
      //   del: 委托函数 或者 可能是执行一次的函数,
      //   proxy: 代理函数,
      //   i: 对应回调函数数组中的位置,
      // }

      // emulate mouseenter, mouseleave
      // 模拟
      // mouseenter -> mouseover
      // mouseleave -> mouseout
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        // 判断之前的节点 & 绑定的节点不存在包含关系、不相等
        // 这里等于做了节流的操作
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }

      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        // 增强 event 对象
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        // e._args 是在 .trigger() 的时候被用到
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        // return false === preventDefault() + e.stopPropagation()
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }

  // 9. 移除事件监听的真正函数
  function remove(element, events, fn, selector, capture) {
    // 找到DOM元素上面对应缓存的编号
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }
  
  // 3. 增强 proxy event 对象
  function compatible(event, source) {
    // 1. 绑定事件监听时 - 通过原始的 event 来增强 proxy event 对象
    // event 是 proxy event 而 source 是原始event
    // 2. 不存在 source 参数，同时 event 没有被增强过
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      // 这里使用 装饰器模式 提供了检测事件对象是否调用了三大内置函数
      // preventDefault/stopImmediatePropagation/stopPropagation
      // 不改变原始函数的情况下，增强函数
      // @nice
      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function() {
          this[predicate] = returnTrue
          // @to-check 这里为什么用 source
          // @fix 避免影响之前的 event 对象
          // 原生的 event 对象被保存在 originalEvent 中
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      // 事件触发的时间戳
      // 兼容 PC - Safari 手机端等等
      // 方便 touch 相关事件的计算 / 触发
      try {
        event.timeStamp || (event.timeStamp = Date.now())
      } catch (ignored) { }

      // 判断是不是已经 preventDefault 被执行过了
      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  // 2. 拓展 event 对象
  // 委托绑定事件监听的时候，这个函数会被执行
  function createProxy(event) {
    // 保留原始的 event 对象在 originalEvent 上
    var key, proxy = { originalEvent: event }
    // 排除忽视的属性&没有值的属性 把所有的键值拷贝到代理对象上
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  // 1. 阅读代码的入口
  // 参考API 参数的意义
  // event 所监听的事件 多个事件使用空格隔开 如果是对象 键值对分别是监听的事件 & 对应的回调函数
  // selector CSS选择器 当事件在匹配该选择器的元素上发起时 事件才会被触发 （事件委托、事件代理）
  // data 会被挂载在 event.data 上面
  // callback 回调函数 （this 指向触发事件的元素） 事件处理程序返回 false 或者调用 .preventDefault() 将防止默认浏览器操作 如果直接传递 false 则代表 () => false
  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this

    // 判断 event 是不是对象 对象需要循环获取监听事件&回调函数
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      // 支持链式调用
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      // 判断不存在 selector 的情况 则后面的参数都往前挪一个
      callback = data, data = selector, selector = undefined
      // 此时形式参数 event data callback
    if (callback === undefined || data === false)
      // 判断不存在 data 的情况 参数继续前移
      callback = data, data = undefined

    // 避免默认效果的简略写法
    if (callback === false) callback = returnFalse

    // 选择器选中的对象可能是多个
    return $this.each(function(_, element){
      // 判断是不是执行一次之后自动移除
      if (one) autoRemove = function(e) {
        // 装饰器模式
        // Q：移除需要维持事件引用的一致
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      // 使用委托
      // this = match = selector
      // e.target
      // e.liveFired = element
      // Q： match !== element
      // 如果出现了 match === element 会有什么问题？
      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          // 这里需要把委托函数的 this 指向 match 节点
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      // Zepto 只是增强了 event 对象，this 还是保留原始的对象
      // Q：在这里只是在使用委托的事件绑定中增强了 event 对象

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }

  // 8. 移除事件监听
  // event 所监听的事件名称 多个事件使用空格隔开 如果是对象 键值对分别是监听的事件 & 对应的回调函数
  // selecor CSS选择器 当事件在匹配该选择器的元素上发起时 事件才会被触发 （事件委托、事件代理）
  // callback 所要移除的事件监听函数 必须和绑定的事件监听函数是同样的引用
  $.fn.off = function(event, selector, callback){
    var $this = this

    // 判断 event 是不是对象 对象需要循环获取监听事件&回调函数
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    // 函数参数的检查与修正
    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  // 12. 模拟触发事件
  // event 触发的事件类型 可以是字符串类型，也可以是通过 $.Event 定义的事件对象
  // args 传递给事件监听的附加参数
  $.fn.trigger = function(event, args){
    // $.isPlainObject 判断是不是空对象
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  // 14. 触发当前元素的对应事件监听，但是不冒泡
  // 和 trigger 的区别就在于使用原生事件去触发还是直接拿出函数来执行
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        // return false 也停止了循环
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  // 13. 创建并且初始化一个指定的 DOM 事件
  /**
   * type 表示事件的名称
   * props 表示描述事件监听触发的附加属性 冒泡/捕获
   * 或者只传递一个参数 对象形式
   * {
   *   type: 事件名称
   *   bubbles: 冒泡/捕获
   *   ...addInfos: 附加属性
   * }
   */
  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)
