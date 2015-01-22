P = require('pixi.js')
spawnChainedSprite = require('./spawnChainedSprite')

function chainFlow(stage, chain, chainLengthMax, direction, texture, gridUnit) {
  var sprite = new P.Sprite(texture)
  var offsetX = 0
  var offsetY = 0
  switch(direction) {
    case 'n': offsetY = -gridUnit; break
    case 's': offsetY = gridUnit; break
    case 'e': offsetX = -gridUnit; break
    case 'w': offsetX = gridUnit; break
    default: break
  }
  spawnChainedSprite(stage, chain, chainLengthMax, sprite, offsetX, offsetY)
}

module.exports = chainFlow
