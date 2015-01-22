'use strict'
// libraries
var P = require('pixi.js')
var _ = require('lodash')
var Combokeys = require('combokeys')
var combokeys = new Combokeys(document)

// helpers
var randomPosition = require('./helpers/randomPosition')
var stayInBounds = require('./helpers/stayInBounds')
var chainFlow = require('./helpers/chainFlow')
var spawnRandomSprite = require('./helpers/spawnRandomSprite')

// constants
var MAP_X = 1024
var MAP_Y = 1024
var GRID_UNIT = 32
var GAME_PAUSED
var DIRECTIONS = ['n','s','e','w']
var REFRESH_RATE = 100//ms

// player variables
var snakeMovement = null
var alarm = new Date()
alarm.setTime(new Date().getTime() + REFRESH_RATE)
var snake = []
var snakeLengthMax
var randomCube = null
var snakeDb
var highScores

// stage variables
var stage, renderer
var tileTexture, cubeTexture, redTexture, flowerTexture, tiles, cube, cube1, cube2

function preload() {
  // recover high scores from local storage if there are any.
  var snakeDb = JSON.parse(localStorage.getItem('NyliraGameSnake'))
  if(snakeDb !== null){
    highScores = snakeDb.highScores
    highScores = _.sortBy(highScores, function(num) {return num}).reverse()
    console.log('highScores retrieved from localStorage: ', highScores)
  } else {
    console.log('No high scores in local storage yet. Add some!')
  }

  // setup stage
  stage = new P.Stage(0xCCD0CC)
  renderer = P.autoDetectRenderer(MAP_X, MAP_Y, renderOptions)
  document.getElementById('container').appendChild(renderer.view);

  // setup textures
  var pixelRatio = window.devicePixelRatio;
  var renderOptions = {resolution: pixelRatio}
  if(pixelRatio === 2) {
    tileTexture = P.Texture.fromImage('../img/grid16x16@x2.png')
    flowerTexture = P.Texture.fromImage('../img/flower16x16@x2.png')
    cubeTexture = P.Texture.fromImage('../img/block16x16@x2.png')
    redTexture = P.Texture.fromImage('../img/block16x16red@x2.png')
  } else {
    tileTexture = P.Texture.fromImage('../img/grid16x16.png')
    flowerTexture = P.Texture.fromImage('../img/flower16x16.png')
    cubeTexture = P.Texture.fromImage('../img/block16x16.png')
    redTexture = P.Texture.fromImage('../img/block16x16red.png')
  }

  // setup sprites
  tiles = new P.TilingSprite(tileTexture, MAP_X, MAP_X)
  cube = new P.Sprite(cubeTexture)
  cube1 = new P.Sprite(cubeTexture)
  cube2 = new P.Sprite(cubeTexture)
}

function init() {
  // keybindings
  combokeys.bind(['up', 'w'], function() {snakeMovement = 'n'})
  combokeys.bind(['down','s'], function() {snakeMovement = 's'})
  combokeys.bind(['left','a'], function() {snakeMovement = 'e'})
  combokeys.bind(['right','d'], function() {snakeMovement = 'w'})
  combokeys.bind(['space','x'], function() {snakeMovement = null})

  // setup bg
  stage.addChild(tiles)

  // setup flowers
  /*for(var i=0; i < 7; i++) {
    var flower = new P.Sprite(flowerTexture)
    var flowerPosition = randomPosition(MAP_X, MAP_Y, GRID_UNIT)
    flower.position.x = flowerPosition[0]
    flower.position.y = flowerPosition[1]
    flower.rotation = _.random(0, 2 * Math.PI)
    stage.addChild(flower)
  }*/

  // setup initial snake
  // randomize position in the middle 1/9 of map so player doesn't die instantly
  var initialPosition = randomPosition(MAP_X, MAP_Y, GRID_UNIT, 0.67)
  cube.position.x = initialPosition[0]
  cube.position.y = initialPosition[1]

  //randomize direction
  snakeMovement = _.head(_.shuffle(DIRECTIONS))

  // go!
  snake.push(cube)
  stage.addChild(cube)
  snakeLengthMax = 1
}

function update(){
  // keep the game running if it isn't over
  if(GAME_PAUSED !== true) {
    requestAnimationFrame(update);
  }

  // spawn a random cube if one doesn't exist
  if (randomCube === null) {
    randomCube = spawnRandomSprite(stage, snake, new P.Sprite(redTexture), MAP_X,MAP_Y, GRID_UNIT)
  }

  // if the snake is out of bounds, end the game
  if (stayInBounds(snake[0], MAP_X, MAP_Y) !== true) {
    endGame()
  }

  // find the location of the cube tail elements
  var snakeTailPositions = []
  _.map(_.tail(snake), function(cube){
    snakeTailPositions.push([cube.position.x, cube.position.y])
  })

  // if snake[0] collides with itself
  if(_.some(snakeTailPositions, [snake[0].position.x, snake[0].position.y])) {
    // end the game
    endGame()
  }

  // if snake[0] collides with the randomcube
  if (randomCube !== null && snake[0].position.x == randomCube.position.x && snake[0].position.y == randomCube.position.y) {
    // remove randomCube's visibility
    stage.removeChild(randomCube)
    // destroy it
    randomCube = null
    // make our snake longer
    snakeLengthMax++
  }

  // move once every REFRESH_RATE
  if(alarm.getTime() < new Date().getTime()) {
    chainFlow(stage, snake, snakeLengthMax, snakeMovement, cubeTexture, GRID_UNIT)
    alarm.setTime(new Date().getTime() + REFRESH_RATE)
  }
  renderer.render(stage)
}

function endGame() {
  // pauses the game and shows the scoreboard, play again button
  GAME_PAUSED = true
  combokeys.reset()
  snakeMovement = null
  resetGame()
}

function resetGame() {
  // what happens after pressing play again

  // clear stuff from stage
  for (var i=stage.children.length-1; i >= 0; i--) {
    stage.removeChild(stage.children[i])
  }

  // clear stuff from memory
  randomCube = null
  snake = []

  // update high scores
  console.log('Your Score: ', snakeLengthMax)

  console.log(updateHighScores(snakeLengthMax))
  console.log('All Time Highs: '
  , localStorage.getItem('NyliraGameSnake'))

  startGame()
}

function updateHighScores(newScore) {
  var highScoreMessage
  if(highScores.length < 10) {
    highScores.push(newScore)
    highScoreMessage = 'NEW HIGH SCORE!'
    updateHighScoresDb()
  } else if (_.min(highScores) < newScore) {
    highScores = sortDescending(highScores)
    highScores.pop()
    highScores.push(newScore)
    highScoreMessage = 'You knocked someone off the high score list!'
    updateHighScoresDb()
  } else {
    highScoreMessage = 'Sorry, you didn\'t beat any records. Try again!'
  }
  return highScoreMessage
}

function updateHighScoresDb() {
  highScores = sortDescending(highScores)
  localStorage.setItem('NyliraGameSnake', JSON.stringify({'highScores':highScores}))
}

function sortDescending(intArray) {
  return _.sortBy(intArray, function(num) {return num}).reverse()
}
  
function startGame(){
  GAME_PAUSED = false
  init()
  update()
}

preload()
var playButton = document.getElementById('play-button')
playButton.addEventListener('click', function() {
  startGame()
  playButton.style.display = 'none'
})
