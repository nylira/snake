function spawnChainedSprite(stage, chain, chainLengthMax, sprite, offsetX, offsetY){
  // set up new cube
  var child = sprite
  child.position.x = chain[0].position.x + offsetX
  child.position.y = chain[0].position.y + offsetY

  // add new cube to the head of the list
  stage.addChild(child)
  chain.unshift(child)

  // remove the old cube if it's greater than max chain length
  if(chain.length > chainLengthMax) {
    var popped = chain.pop()
    stage.removeChild(popped)
  }

  return child
}

module.exports = spawnChainedSprite
