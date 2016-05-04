var _ = require('lodash')
var randomPosition = require('./randomPosition')

function spawnRandomSprite(stage, chain, sprite, mapX, mapY, gridUnit) {
  var positionsAreIllegal = true
  var spritePosition = randomPosition(mapX, mapY, gridUnit)

  var illegalSpawnPositions = []
  _.map(chain, function(cube){
    illegalSpawnPositions.push([cube.position.x, cube.position.y])
  })

  while(positionsAreIllegal) {
    // if the random position chosen is one of the snake's positions
    if(_.some(illegalSpawnPositions, spritePosition)) {
      // try a new random position
      spritePosition = randomPosition(mapX, mapY, gridUnit)
    } else {
      positionsAreIllegal = false
    }
  }

  sprite.position.x = spritePosition[0]
  sprite.position.y = spritePosition[1]

  stage.addChild(sprite)

  return sprite
}

module.exports = spawnRandomSprite
