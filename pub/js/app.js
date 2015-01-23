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
var Button = require('./helpers/Button')
var spawnRandomSprite = require('./helpers/spawnRandomSprite')

// constants
var MAP_X = 1024
var MAP_Y = 1024
var GRID_UNIT = 32
var DIRECTIONS = ['n','s','e','w']
var REFRESH_RATE = 100//ms
var GAME_PAUSED = false // used when a game is running and paused
var GAME_RUNNING = false // used when a game is running

// player variables
var snakeMovement = null
var snakeMovementLast = null
var alarm = new Date()
alarm.setTime(new Date().getTime() + REFRESH_RATE)
var snake = []
var snakeLengthMax
var randomCube = null
var snakeDb
var highScores

// stage variables
var stage, renderer

// scenes
var sceneMenu
  , btnResume
  , btnNew

var sceneGame
  , cube
  , cube1
  , cube2

var tiles
  , bgTiles

var sceneSummary

var tileTexture
  , cubeTexture
  , redTexture
  , btnTexture
  , bgTileTexture

// this run no matter what scene is loaded
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
  stage.interactive = true // make it clickable

  sceneMenu = new P.DisplayObjectContainer()
  sceneGame = new P.DisplayObjectContainer()
  sceneSummary = new P.DisplayObjectContainer()
  stage.addChild(sceneMenu)
  stage.addChild(sceneGame)
  stage.addChild(sceneSummary)
  sceneMenu.visible = true
  sceneGame.visible = false
  sceneSummary.visible = false

  // setup textures
  var pixelRatio = window.devicePixelRatio;
  var renderOptions = {resolution: pixelRatio}
  if(pixelRatio === 2) {
    tileTexture = P.Texture.fromImage('../img/grid16x16@x2.png')
    cubeTexture = P.Texture.fromImage('../img/block16x16@x2.png')
    redTexture = P.Texture.fromImage('../img/block16x16red@x2.png')
    btnTexture = P.Texture.fromImage('../img/btn64x256@x2.png')
    bgTileTexture = P.Texture.fromImage('../img/bg8x512@x2.png')
  } else {
    tileTexture = P.Texture.fromImage('../img/grid16x16.png')
    cubeTexture = P.Texture.fromImage('../img/block16x16.png')
    redTexture = P.Texture.fromImage('../img/block16x16red.png')
    btnTexture = P.Texture.fromImage('../img/btn64x256.png')
    bgTileTexture = P.Texture.fromImage('../img/bg8x512.png')
  }

  // setup sprites
  tiles = new P.TilingSprite(tileTexture, MAP_X, MAP_X)
  bgTiles = new P.TilingSprite(bgTileTexture, MAP_X, MAP_X)
  cube = new P.Sprite(cubeTexture)
  cube1 = new P.Sprite(cubeTexture)
  cube2 = new P.Sprite(cubeTexture)
}

function initSceneMenu() {
  // background
  sceneMenu.addChild(bgTiles)

  // logo
  var logoTextStyle = {
    font: '300 160px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.66)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 10
  }
  var logoText = new P.Text('Snake', logoTextStyle)
  logoText.position.x = (renderer.width - logoText.width) /2
  logoText.position.y = 128
  sceneMenu.addChild(logoText)

  // input
  var inputTextStyle = {
    font: '32px Arial'
  , fill: '#4782ad'
  , dropShadow: false
  }
  var inputText = new P.Text('Controls: Arrow Keys or WASD (Spacebar to Pause)', inputTextStyle)
  inputText.position.x = (renderer.width - inputText.width) /2
  inputText.position.y = 896
  sceneMenu.addChild(inputText)

  // button group
  var sceneMenuButtons = new P.DisplayObjectContainer()
  sceneMenuButtons.x = 256
  sceneMenuButtons.y = 416
  sceneMenu.addChild(sceneMenuButtons)

  // buttons
  btnNew = new Button('New Game', btnTexture)
  btnNew.position.y = 0
  sceneMenuButtons.addChild(btnNew)

  btnResume = new Button('Resume Game', btnTexture)
  btnResume.position.y = 32 + btnNew.height
  sceneMenuButtons.addChild(btnResume)
}

function initSceneGame() {
  // keybindings
  combokeys.bind(['up', 'w'], function() {snakeMovement = 'n'})
  combokeys.bind(['down','s'], function() {snakeMovement = 's'})
  combokeys.bind(['left','a'], function() {snakeMovement = 'e'})
  combokeys.bind(['right','d'], function() {snakeMovement = 'w'})

  // toggle for game pause
  combokeys.bind(['space','esc', 'x'], function() {
    sceneMenu.visible = !sceneMenu.visible
    sceneGame.visible = !sceneGame.visible
    GAME_PAUSED = !GAME_PAUSED
    toggleSnakeMovement()
  })

  // setup bg
  sceneGame.addChild(tiles)

  // setup initial snake
  // randomize position in the middle 1/9 of map so player doesn't die instantly
  var initialPosition = randomPosition(MAP_X, MAP_Y, GRID_UNIT, 0.67)
  cube.position.x = initialPosition[0]
  cube.position.y = initialPosition[1]

  // go!
  snake.push(cube)
  sceneGame.addChild(cube)
  snakeLengthMax = 1
}

function update(){
  // keep the game running if it isn't over
  requestAnimationFrame(update);

  // btnResume
  if(GAME_RUNNING === true && GAME_PAUSED === true) {
    btnResume.alpha = 1.0
    btnResume.click = function() {
      console.log('you clicked Resume Game')
      sceneMenu.visible = false
      sceneGame.visible = true
      GAME_PAUSED = false
      toggleSnakeMovement()
    }
  } else {
    btnResume.alpha = 0.25
    btnResume.click = function() {
      console.error('No game is running right now')
    }
  } 

  // btnNew
  if(GAME_RUNNING === true) {
    btnNew.alpha = 0.25
    btnNew.click = function() {
      console.error('A game is already running')
    }
  } else {
    btnNew.alpha = 1.0
    btnNew.click = function() {
      sceneMenu.visible = false
      sceneGame.visible = true
      startGame()
      console.log('Starting a new game')
    }
  }

  if(GAME_RUNNING === true && GAME_PAUSED === false) {
    // spawn a random cube if one doesn't exist
    if (randomCube === null) {
      randomCube = spawnRandomSprite(sceneGame, snake, new P.Sprite(redTexture), MAP_X,MAP_Y, GRID_UNIT)
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
      sceneGame.removeChild(randomCube)
      // destroy it
      randomCube = null
      // make our snake longer
      snakeLengthMax++
    }

    // move once every REFRESH_RATE
    if(alarm.getTime() < new Date().getTime()) {
      chainFlow(sceneGame, snake, snakeLengthMax, snakeMovement, cubeTexture, GRID_UNIT)
      alarm.setTime(new Date().getTime() + REFRESH_RATE)
    }

  }
  renderer.render(stage)
}

function endGame() {
  GAME_PAUSED = true
  GAME_RUNNING = false

  combokeys.reset()

  // clear stuff
  for (var i=sceneGame.children.length-1; i >= 0; i--) {
    sceneGame.removeChild(sceneGame.children[i])
  }
  randomCube = null
  snake = []

  // update high scores
  console.log('Your Score: ', snakeLengthMax)
  console.log(updateHighScores(snakeLengthMax))
  console.log('All Time Highs: '
  , localStorage.getItem('NyliraGameSnake'))

  sceneMenu.visible = true
  sceneGame.visible = false
}

function startGame(){
  GAME_PAUSED = false
  GAME_RUNNING = true
  initSceneGame()
  update()
  toggleSnakeMovement()
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
  
function toggleSnakeMovement() {
  if(GAME_RUNNING === true && GAME_PAUSED === true) {
    snakeMovementLast = snakeMovement
    snakeMovement = null
  } else if (snakeMovement === null && snakeMovementLast === null) {
      snakeMovement = _.head(_.shuffle(DIRECTIONS))
  } else if (snakeMovement === null && snakeMovementLast !== null) {
      snakeMovement = snakeMovementLast
  }
  return snakeMovement
}

preload()
initSceneMenu()
update()
