var _ = require('lodash')

function randomPosition(mapX, mapY, gridUnit, centralizeAmount) {
  // centralize makes the random position closer to the center of the map
  centralizeAmount = centralizeAmount || 0

  if(centralizeAmount > 1 || centralizeAmount < 0) {
    console.error('centralizeAmount needs to be a value between 0.0 and 1.0')
    return
  }
  
  var rows = (mapX / gridUnit) - 1
  var columns = (mapY / gridUnit) - 1

  var minX = Math.round(centralizeAmount * rows)
  var minY = Math.round(centralizeAmount * columns)

  var maxX = Math.round((1 - centralizeAmount) * rows)
  var maxY = Math.round((1 - centralizeAmount) * columns)

  var randomPositionX = _.random(minX, maxX) * gridUnit
  var randomPositionY = _.random(minY, maxY) * gridUnit

  return [randomPositionX, randomPositionY]
}

module.exports = randomPosition
