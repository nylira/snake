'use strict'
// TODO: create touch controls
// TODO: change display depending on user's screen
// TODO: text element polish
// TODO: colors for the Game page: gradients, etc
// TODO: particle effects
// TODO: add message when new high score is achieved
// TODO: sounds
//
var R = window.devicePixelRatio

// libraries
var P = require('pixi.js')
var _ = require('lodash')
var Combokeys = require('combokeys')
var combokeys = new Combokeys(document)
var Howl = require('howler').Howl

// helpers
var randomPosition = require('./helpers/randomPosition')
var stayInBounds = require('./helpers/stayInBounds')
var chainFlow = require('./helpers/chainFlow')
var Button = require('./helpers/Button')
var spawnRandomSprite = require('./helpers/spawnRandomSprite')

// constants
var MAP_X = 512*R
var MAP_Y = 512*R
var GRID_UNIT = 16*R
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

// sounds
var sfxPickup
  , sfxGameOver
  , sfxClickButton

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

var sceneSummary
  , btnAgain

var tiles
  , bgTiles

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
    highScores = []
    console.log('No high scores in local storage yet. Add some!')
  }

  // setup stage
  stage = new P.Stage(0xCCD0CC)
  console.log("renderOptions: ", renderOptions)
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

  // setup sounds
  sfxPickup = new Howl({
    urls: ['../sfx/pickup.wav']
  , volume: 0.5
  })
  sfxGameOver = new Howl({
    urls: ['../sfx/gameOver.wav']
  , volume: 0.5
  })
  sfxClickButton = new Howl({
    urls: ['../sfx/clickButton.wav']
  , volume: 0.5
  })

  // setup textures
  var renderOptions = {resolution: R}
  if(R === 2) {
    tileTexture = P.Texture.fromImage('../img/darkGrid16x16@x2.png')
    cubeTexture = P.Texture.fromImage('../img/lightBlock16x16@x2.png')
    redTexture = P.Texture.fromImage('../img/block16x16red@x2.png')
    btnTexture = P.Texture.fromImage('../img/btn64x256@x2.png')
    bgTileTexture = P.Texture.fromImage('../img/bg8x512@x2.png')
  } else {
    tileTexture = P.Texture.fromImage('../img/darkGrid16x16.png')
    cubeTexture = P.Texture.fromImage('../img/lightBlock16x16.png')
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
    font: '300 '+ 80*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 8*R
  }
  var logoText = new P.Text('Snake', logoTextStyle)
  logoText.position.x = (renderer.width - logoText.width) /2
  logoText.position.y = 64*R
  sceneMenu.addChild(logoText)

  // input
  var inputTextStyle = {
    font: 16*R + 'px Arial'
  , fill: '#4782ad'
  , dropShadow: false
  }
  var inputText = new P.Text('Controls: Arrow Keys or WASD (Spacebar to Pause)', inputTextStyle)
  inputText.position.x = (renderer.width - inputText.width) /2
  inputText.position.y = 448*R
  sceneMenu.addChild(inputText)

  // button group
  var sceneMenuButtons = new P.DisplayObjectContainer()
  sceneMenuButtons.x = 128*R
  sceneMenuButtons.y = 208*R
  sceneMenu.addChild(sceneMenuButtons)

  // buttons
  btnNew = new Button('New Game', btnTexture)
  btnNew.position.y = 0
  sceneMenuButtons.addChild(btnNew)

  btnResume = new Button('Resume Game', btnTexture)
  btnResume.position.y = 16*R + btnNew.height
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

function initSceneSummary() {
  // background
  sceneSummary.addChild(bgTiles)

  // game over title
  var gameOverTextStyle = {
    font: '300 '+ 64*R +'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 3*R
  }
  var gameOverText = new P.Text('Game Over', gameOverTextStyle)
  gameOverText.position.x = (renderer.width - gameOverText.width) /2
  gameOverText.position.y = 48*R
  sceneSummary.addChild(gameOverText)

  // points text
  var pointsTextStyle = {
    font: 'bold '+ 24*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 3*R
  }
  var pointsTextString = 'You scored ' + String(snakeLengthMax) + ' pts!'
  var pointsText = new P.Text(pointsTextString, pointsTextStyle)
  pointsText.position.x = (renderer.width - pointsText.width) /2
  pointsText.position.y = gameOverText.y + 64*R + 8*R
  sceneSummary.addChild(pointsText)

  // high scores label
  var highScoresLabelTextStyle = {
    font: 'bold '+ 16*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 3*R
  }
  var highScoresLabelText = new P.Text('Your High Scores', highScoresLabelTextStyle)
  highScoresLabelText.position.x = (renderer.width - highScoresLabelText.width) /2
  highScoresLabelText.position.y = pointsText.y + 64*R
  sceneSummary.addChild(highScoresLabelText)

  // high scores display
  var highScoresContainer = new P.DisplayObjectContainer()
  var scoreTextStyle = {
    font: 16*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 3*R
  }

  var scoresToShow
  if(highScores.length > 5) {
    scoresToShow = 5
  } else {
    scoresToShow = highScores.length
  }
  for(var i=0; i < scoresToShow; i++) {
    var scoreTextX = 64*R
    var scoreTextY = highScoresLabelText.y + 32*R
    var scoreText = new P.Text(highScores[i] + ' pts ', scoreTextStyle)
    scoreText.position.x = (renderer.width - scoreText.width) /2
    scoreText.position.y = scoreTextY + scoreText.height * i
    highScoresContainer.addChild(scoreText)
  }

  // button
  btnAgain = new Button('Play Again', btnTexture)
  btnAgain.position.x = (renderer.width - btnAgain.width) / 2
  btnAgain.position.y = 16*R * 24
  sceneSummary.addChild(btnAgain)

  sceneSummary.addChild(highScoresContainer)
}

function update(){
  // keep the game running if it isn't over
  requestAnimationFrame(update);

  // btnAgain
  if(sceneSummary.visible === true && GAME_RUNNING === false && GAME_PAUSED === true) {
    btnAgain.click = function() {
      sfxClickButton.play()
      sceneSummary.visible = false
      sceneGame.visible = true
      GAME_PAUSED = false
      startGame()
    }
  }

  if(sceneMenu.visible === true) {
    // btnResume
    if(GAME_RUNNING === true && GAME_PAUSED === true){
      btnResume.alpha = 1.0
      btnResume.click = function() {
        sfxClickButton.play()
        //console.log('you clicked Resume Game')
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
        sfxClickButton.play()
        console.error('A game is already running')
      }
    } else {
      btnNew.alpha = 1.0
      btnNew.click = function() {
        sfxClickButton.play()
        sceneMenu.visible = false
        sceneGame.visible = true
        startGame()
        //console.log('Starting a new game')
      }
    }
  }

  if(sceneGame.visible === true && GAME_RUNNING === true && GAME_PAUSED === false) {

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
    if(snake.length > 0 && _.some(snakeTailPositions, [snake[0].position.x, snake[0].position.y])) {
      // end the game
      endGame()
    }

    // if snake[0] collides with the randomcube
    if (randomCube !== null && snake[0].position.x == randomCube.position.x && snake[0].position.y == randomCube.position.y) {
      // play a sound
      sfxPickup.play()
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

      // update snake gradient
      gradiateChain(snake)

      alarm.setTime(new Date().getTime() + REFRESH_RATE)
    }

  }
  renderer.render(stage)
}

function endGame() {
  GAME_PAUSED = true
  GAME_RUNNING = false

  sfxGameOver.play()

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
  console.log('All Time Highs: ', localStorage.getItem('NyliraGameSnake'))

  initSceneSummary()
  sceneGame.visible = false
  sceneSummary.visible = true
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

// gradiate snake
function gradiateChain(chain){
  if(chain.length > 0) {
    for(var i=0; i < chain.length; i++) {
      var alpha = Math.max(Math.pow(0.9, i + 1), 0.33)
      chain[i].alpha = alpha
    }
  }
}


preload()
initSceneMenu()
update()
