_ = require('lodash')

function setChainMovement(bGameRunning, bSceneGameVisible, chainMovement, directions) {
  var newMovement, oldMovement
  if(bGameRunning === true && bSceneGameVisible === false) {
    oldMovement = chainMovement.current
    newMovement = null
    console.log('one')
  } else if (chainMovement.current === null && chainMovement.previous === null) {
    newMovement = _.head(_.shuffle(directions))
    console.log('two')
  } else if (chainMovement.current === null && chainMovement.previous !== null) {
    newMovement = chainMovement.previous
    console.log('three')
  }
  return {current: newMovement, previous: oldMovement}
}

module.exports = setChainMovement
