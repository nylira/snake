// koa
var serve = require('koa-static')
var router = require('koa-router')
var koa = require('koa')
var app = koa()

app.use(router(app))
app.use(serve('./pub'))

app.listen(3009)
console.log('Listening on http://localhost:3009')
