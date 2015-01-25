'use strict'
// TODO: change display depending on user's screen
// TODO: text element polish
// TODO: particle effects
// TODO: add message when new high score is achieved

var R = window.devicePixelRatio

// libraries
var P = require('pixi.js')
var _ = require('lodash')
var Combokeys = require('combokeys')
var combokeys = new Combokeys(document)
var Howl = require('howler').Howl
var attachFastClick = require('fastclick');

// helpers
var Button = require('./helpers/Button')
var chainFlow = require('./helpers/chainFlow')
var gradiateChain = require('./helpers/gradiateChain')
var randomPosition = require('./helpers/randomPosition')
var spawnRandomSprite = require('./helpers/spawnRandomSprite')
var stayInBounds = require('./helpers/stayInBounds')

// window
attachFastClick(document.body)

// constants
var MAP_X = 400*R
var MAP_Y = 320*R
var CANVAS_X = 568*R
var CANVAS_Y = 320*R
var GRID_UNIT = 16*R
var DIRECTIONS = ['n','s','e','w']
var REFRESH_RATE = 150//ms
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
  , sfxClickButtonTwo

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
  , btnUp
  , btnRight
  , btnLeft
  , btnDown

var sceneSummary
  , btnAgain
  , sceneSummaryLeft
  , sceneSummaryRight

var tileGrid
  , tileGradient
  , tileBlack

var tileGridTexture
  , tileGradientTexture
  , tileBlackTexture
  , cubeTexture
  , redTexture
  , btnTexture
  , arrowTexture

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
  stage = new P.Stage(0x141A1F)
  renderer = P.autoDetectRenderer(CANVAS_X, CANVAS_Y)
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
  sfxClickButtonTwo = new Howl({
    urls: ['../sfx/clickButton2.wav']
  , volume: 0.1
  })

  // setup textures
  if(R === 2) {
    tileGridTexture = P.Texture.fromImage('../img/darkGrid16x16@x2.png')
    tileGradientTexture = P.Texture.fromImage('../img/bg32x568@x2.png')
    tileBlackTexture = P.Texture.fromImage('../img/black16x16.png')
    cubeTexture = P.Texture.fromImage('../img/lightBlock16x16@x2.png')
    redTexture = P.Texture.fromImage('../img/block16x16red@x2.png')
    btnTexture = P.Texture.fromImage('../img/btn64x256@x2.png')
    arrowTexture = P.Texture.fromImage('../img/arrow256x256@x2.png')
  } else {
    tileGridTexture = P.Texture.fromImage('../img/darkGrid16x16.png')
    tileGradientTexture = P.Texture.fromImage('../img/bg32x568.png')
    tileBlackTexture = P.Texture.fromImage('../img/black16x16.png')
    cubeTexture = P.Texture.fromImage('../img/lightBlock16x16.png')
    redTexture = P.Texture.fromImage('../img/block16x16red.png')
    btnTexture = P.Texture.fromImage('../img/btn64x256.png')
    arrowTexture = P.Texture.fromImage('../img/arrow256x256.png')
  }

  // setup tiling textures
  tileGrid = new P.TilingSprite(tileGridTexture, MAP_X, MAP_Y)
  tileGradient = new P.TilingSprite(tileGradientTexture, CANVAS_X, CANVAS_Y)
  tileBlack = new P.TilingSprite(tileBlackTexture, CANVAS_X, CANVAS_Y)

  // setup sprites
  cube = new P.Sprite(cubeTexture)
  cube1 = new P.Sprite(cubeTexture)
  cube2 = new P.Sprite(cubeTexture)
  btnUp = new P.Sprite(arrowTexture)
  btnLeft = new P.Sprite(arrowTexture)
  btnRight = new P.Sprite(arrowTexture)
  btnDown = new P.Sprite(arrowTexture)
}

function initSceneMenu() {
  // background
  sceneMenu.addChild(tileGradient)

  // logo
  var logoTextStyle = {
    font: '300 '+ 64*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 8*R
  }
  var logoText = new P.Text('Snake', logoTextStyle)
  logoText.position.x = (renderer.width - logoText.width) /2
  logoText.position.y = 32*R
  sceneMenu.addChild(logoText)

  // button group
  var sceneMenuButtons = new P.DisplayObjectContainer()
  sceneMenuButtons.x = (CANVAS_X - 256*R)/2
  sceneMenuButtons.y = logoText.y + 108*R
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
  var navButtons = new P.DisplayObjectContainer()
  navButtons.width = 62*2*R + 8*R
  navButtons.height = 62*3*R + 16*R
  navButtons.position.x = MAP_X + 62*R + 4*R + 18*R
  navButtons.position.y = 64*R

  // keybindings
  combokeys.bind(['up', 'w'], function() {snakeMovement = 'n'})
  combokeys.bind(['down','s'], function() {snakeMovement = 's'})
  combokeys.bind(['right','d'], function() {snakeMovement = 'e'})
  combokeys.bind(['left','a'], function() {snakeMovement = 'w'})

  btnUp.width = 62*R
  btnUp.height = 62*R
  btnUp.position.y = 31*R
  btnUp.anchor = new P.Point(0.5, 0.5)
  btnUp.interactive = true
  btnUp.buttonMode = true

  btnDown.width = 62*R
  btnDown.height = 62*R
  btnDown.position.y = btnUp.position.y + btnUp.height*2 + 16*R
  btnDown.anchor = new P.Point(0.5, 0.5)
  btnDown.rotation = Math.PI
  btnDown.interactive = true
  btnDown.buttonMode = true

  btnLeft.width = 62*R
  btnLeft.height = 62*R
  btnLeft.position.x = btnUp.position.x - btnUp.width/2 - 4*R
  btnLeft.position.y = btnUp.position.y + btnUp.height + 8*R
  btnLeft.anchor = new P.Point(0.5, 0.5)
  btnLeft.rotation = Math.PI * 1.5
  btnLeft.interactive = true
  btnLeft.buttonMode = true

  btnRight.width = 62*R
  btnRight.height = 62*R
  btnRight.position.x = btnUp.position.x + btnUp.width/2 + 4*R
  btnRight.position.y = btnUp.position.y + btnUp.height + 8*R
  btnRight.anchor = new P.Point(0.5, 0.5)
  btnRight.rotation = Math.PI * 0.5
  btnRight.interactive = true
  btnRight.buttonMode = true

  navButtons.addChild(btnUp)
  navButtons.addChild(btnDown)
  navButtons.addChild(btnLeft)
  navButtons.addChild(btnRight)

  // toggle for game pause
  combokeys.bind(['space','esc', 'x'], function() {
    sceneMenu.visible = !sceneMenu.visible
    sceneGame.visible = !sceneGame.visible
    toggleSnakeMovement()
  })

  // setup bg
  sceneGame.addChild(tileGrid)

  // setup initial snake
  // randomize position in the middle 1/9 of map so player doesn't die instantly
  var initialPosition = randomPosition(MAP_X, MAP_Y, GRID_UNIT, 0.67)
  cube.position.x = initialPosition[0]
  cube.position.y = initialPosition[1]

  // go!
  snake.push(cube)
  sceneGame.addChild(cube)
  snakeLengthMax = 1

  sceneGame.addChild(navButtons)
}

function initSceneSummary() {
  // background
  sceneSummary.addChild(tileGradient)


  sceneSummaryLeft = new P.DisplayObjectContainer()
  sceneSummaryLeft.width = CANVAS_X * 0.33
  sceneSummaryLeft.position.x = 0
  sceneSummaryLeft.position.y = 0
  sceneSummary.addChild(sceneSummaryLeft)

  sceneSummaryRight = new P.DisplayObjectContainer()
  sceneSummaryRight.width = CANVAS_X * 0.67
  sceneSummaryRight.position.x = CANVAS_X * 0.33
  sceneSummaryRight.position.y = 0
  sceneSummary.addChild(sceneSummaryRight)
  
  tileBlack.width = CANVAS_X*0.33
  tileBlack.alpha = 0.15
  sceneSummaryLeft.addChild(tileBlack)

  // high scores label
  var highScoresLabelTextStyle = {
    font: 'bold '+ 16*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 3*R
  }
  var highScoresLabelText = new P.Text('Your High Scores', highScoresLabelTextStyle)
  highScoresLabelText.position.x = (CANVAS_X*0.33 - highScoresLabelText.width)/2
  highScoresLabelText.position.y = 32*R
  sceneSummaryLeft.addChild(highScoresLabelText)

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
    scoreText.position.x = (CANVAS_X*0.33 - scoreText.width)/2
    scoreText.position.y = scoreTextY + scoreText.height * i
    highScoresContainer.addChild(scoreText)
  }
  sceneSummaryLeft.addChild(highScoresContainer)

  // game over title
  var gameOverTextStyle = {
    font: '300 '+ 48*R +'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 3*R
  }
  var gameOverText = new P.Text('Game Over', gameOverTextStyle)
  gameOverText.position.x = (CANVAS_X*0.67 - gameOverText.width)/2
  gameOverText.position.y = 32*R
  sceneSummaryRight.addChild(gameOverText)

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
  pointsText.position.x = (CANVAS_X*0.67 - pointsText.width)/2
  pointsText.position.y = gameOverText.y + 64*R
  sceneSummaryRight.addChild(pointsText)

  // button
  btnAgain = new Button('Play Again', btnTexture)
  btnAgain.position.x = (CANVAS_X*0.67 - btnAgain.width)/2
  btnAgain.position.y = pointsText.position.y + 112*R
  sceneSummaryRight.addChild(btnAgain)
}

function update(){
  // keep the game running if it isn't over
  requestAnimationFrame(update);

  // btnAgain
  if(sceneSummary.visible === true && GAME_RUNNING === false) {
    btnAgain.click = btnAgain.tap = function() {
      sfxClickButton.play()
      sceneSummary.visible = false
      sceneGame.visible = true
      startGame()
    }
  }

  if(sceneMenu.visible === true) {
    // btnResume
    if(GAME_RUNNING === true){
      btnResume.alpha = 1.0
      btnResume.click = btnResume.tap = function() {
        sfxClickButton.play()
        //console.log('you clicked Resume Game')
        sceneMenu.visible = false
        sceneGame.visible = true
        toggleSnakeMovement()
      }
    } else {
      btnResume.alpha = 0.25
      btnResume.click = btnResume.tap = function() {
        console.error('No game is running right now')
      }
    } 

    // btnNew
    if(GAME_RUNNING === true) {
      btnNew.alpha = 0.25
      btnNew.click = btnNew.tap = function() {
        console.error('A game is already running')
      }
    } else {
      btnNew.alpha = 1.0
      btnNew.click = btnNew.tap = function() {
        sfxClickButton.play()
        sceneMenu.visible = false
        sceneGame.visible = true
        startGame()
      }
    }
  }

  if(sceneGame.visible === true && GAME_RUNNING === true) {

    btnUp.tap = btnUp.click =function(){btnArrowActivate('n')}
    btnDown.tap = btnDown.click = function(){btnArrowActivate('s')}
    btnRight.tap = btnRight.click = function(){btnArrowActivate('e')}
    btnLeft.tap = btnLeft.click = function(){btnArrowActivate('w')}

    // spawn a random cube if one doesn't exist
    if (randomCube === null) {
      randomCube = spawnRandomSprite(sceneGame, snake, new P.Sprite(redTexture), MAP_X,MAP_Y, GRID_UNIT)
    }

    // if the snake is out of bounds, end the game
    if (stayInBounds(snake[0], MAP_X, MAP_Y) === false) {
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
  GAME_RUNNING = false

  sfxGameOver.play()

  combokeys.reset()

  // clear stuff
  for (var i=sceneGame.children.length-1; i >= 0; i--) {
    sceneGame.removeChild(sceneGame.children[i])
  }
  randomCube = null
  snake = []

  updateHighScores(snakeLengthMax)

  initSceneSummary()
  sceneGame.visible = false
  sceneSummary.visible = true
}

function startGame(){
  GAME_RUNNING = true
  initSceneGame()
  toggleSnakeMovement()
  update()
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
  if(GAME_RUNNING === true && sceneGame.visible === false) {
    snakeMovementLast = snakeMovement
    snakeMovement = null
  } else if (snakeMovement === null && snakeMovementLast === null) {
      snakeMovement = _.head(_.shuffle(DIRECTIONS))
  } else if (snakeMovement === null && snakeMovementLast !== null) {
      snakeMovement = snakeMovementLast
  }
  return snakeMovement
}

function btnArrowActivate(dir) {
  snakeMovement = dir
  sfxClickButtonTwo.play()
}

preload()
initSceneMenu()
update()
