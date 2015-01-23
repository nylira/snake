P = require('pixi.js')

function Button(text, texture, textStyle, x, y, width, height) {
  text = text || 'Button Text'

  texture = texture || btnTexture

  textStyle = textStyle || {
    font: 'bold 48px Arial'
  , fill: '#FFFFFF'
  , dropShadow: true
  , dropShadowColor: '#003366'
  , dropShadowDistance: 6
  }

  x = x || 0
  y = y || 0
  width = width || 512
  height = height || 128

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
