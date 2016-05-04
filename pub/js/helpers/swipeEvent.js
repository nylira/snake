function swipeEvent(container) {
  var initialPoint
  var finalPoint
  var direction

  container.touchstart = function (interactionData) {
    initialPoint = interactionData.getLocalPosition(this.parent)
  }

  container.touchend = container.touchendoutside = function (interactionData) {

    finalPoint = interactionData.getLocalPosition(this.parent)

    var xAbs = Math.abs(initialPoint.x - finalPoint.x)
    var yAbs = Math.abs(initialPoint.y - finalPoint.y)

    //check if distance between two points is greater then 20 otherwise discard
    if (xAbs > 20 || yAbs > 20) {
      if (xAbs > yAbs) {
        if (finalPoint.x < initialPoint.x) {
          console.log("swipe left")
          direction = 'w'
        }
        else {
          console.log("swipe right")
          direction = 'e'
        }
      }
      else {
        if (finalPoint.y < initialPoint.y) {
          console.log("swipe up")
          direction = 'n'
        }
        else {
          console.log("swipe down")
          direction = 's'
        }
      }
    }
  }
  return direction
}

module.exports = swipeEvent
