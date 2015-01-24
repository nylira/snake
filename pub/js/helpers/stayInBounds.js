function stayInBounds(sprite, maxX, maxY) {
  var inBounds = true
  if(sprite.position.x < 0 || sprite.position.x > maxX) {
    inBounds = false
  }
  if (sprite.position.y < 0 || sprite.position.y > maxY) {
    inBounds = false
  }
  return inBounds
}
module.exports = stayInBounds
