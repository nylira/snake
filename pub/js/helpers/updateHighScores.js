_ = require('lodash')
sortDescending = require('./sortDescending')

function updateHighScores(newScore, scores, db) {
  var highScoreMessage
  if(scores.length < 10) {
    scores.push(newScore)
    highScoreMessage = 'NEW HIGH SCORE!'
    updateHighScoresDb(scores, db)
  } else if (_.min(scores) < newScore) {
    scores = sortDescending(scores)
    scores.pop()
    scores.push(newScore)
    highScoreMessage = 'You knocked someone off the high score list!'
    updateHighScoresDb(scores, db)
  } else {
    highScoreMessage = 'Sorry, you didn\'t beat any records. Try again!'
  }
  return scores
}

function updateHighScoresDb(scores, db) {
  scores = sortDescending(scores)
  localStorage.setItem(db, JSON.stringify({'highScores':scores}))
}

module.exports = updateHighScores
