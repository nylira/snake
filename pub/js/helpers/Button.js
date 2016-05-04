P = require('pixi.js')
R = window.devicePixelRatio

function Button(text, texture, textStyle, x, y, width, height) {
  text = text || 'Button Text'

  texture = texture || btnTexture

  textStyle = textStyle || {
    font: 'bold ' + 24*R + 'px Arial'
  , fill: '#FFFFFF'
  , dropShadow: true
  , dropShadowColor: '#003366'
  , dropShadowDistance: 3*R
  }

  x = x || 0
  y = y || 0
  width = width || 256*R
  height = height || 64*R

  var btn = new P.Sprite(texture)
  btn.width = width
  btn.height = height
  btn.interactive = true
  btn.buttonMode = true

  btn.mouseover = function() {
  }
  btn.mouseout = function() {
  }

  var label = new P.Text(text, textStyle)

  btn.addChild(label)
  label.position.x = (btn.width - label.width) / 2
  label.position.y = (btn.height - label.height) / 2

  return btn
}

module.exports = Button
