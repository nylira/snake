var _ = require('lodash')

function randomPosition(maxX, maxY, gridUnit) {
  var rangeX = (maxX / gridUnit) - 1
  var rangeY = (maxY / gridUnit) - 1

  var randomPositionX = _.random(0, rangeX) * gridUnit
  var randomPositionY = _.random(0, rangeY) * gridUnit

  return [randomPositionX, randomPositionY]
}

module.exports = randomPosition
