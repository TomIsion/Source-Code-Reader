# Zepto.js Ajax

## 相关的API

- $.ajax
- $.ajaxSettings
- $.param
- load

其中还包括下面这些 `$.ajax` 的简写方法

- $.post
- $.get
- $.getJSON
- $.ajaxJSONP

## $.param

- $.param(object, [shallow]) -> string

序列化一个对象，shallow 标识浅循环，嵌套的对象不会被序列化，其中函数类型的属性值会被调用并且返回值之后才序列化

这里主要是使用了递归的技巧

## $.ajaxSettings

全局的 Ajax 配置，单个 $.ajax 的配置会覆盖对应的配置，但是没有配置的选项会默认填充

## Nice

### 1. 给 url 追加参数

### 2. 补全相对/绝对的 URL

### 3. !! && || 各种左值右值的结果