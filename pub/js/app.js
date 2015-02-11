'use strict'
// TODO: change display depending on user's screen
// TODO: text element polish
// TODO: particle effects
// TODO: add message when new high score is achieved

// libraries
var P = require('pixi.js')
var _ = require('lodash')
var Combokeys = require('combokeys')
var combokeys = new Combokeys(document)
var Howl = require('howler').Howl
var attachFastClick = require('fastclick')
var Hammer = require('hammerjs')
var mc

// helpers
var Button = require('./helpers/Button')
var chainFlow = require('./helpers/chainFlow')
var gradiateChain = require('./helpers/gradiateChain')
var randomPosition = require('./helpers/randomPosition')
var setChainMovement = require('./helpers/setChainMovement')
var sortDescending = require('./helpers/sortDescending')
var spawnRandomSprite = require('./helpers/spawnRandomSprite')
var stayInBounds = require('./helpers/stayInBounds')
var updateHighScores = require('./helpers/updateHighScores')
var retinaLinkify = require('./helpers/retinaLinkify')
//var swipeEvent = require('./helpers/swipeEvent')

// window
attachFastClick(document.body)

// constants
var R = 2
var MAP_X = 400*R
var MAP_Y = 320*R
var CANVAS_X = 568*R
var CANVAS_Y = 320*R
var GRID_UNIT = 16*R
var DIRECTIONS = ['n','s','e','w']
var REFRESH_RATE = 150//ms
var GAME_RUNNING = false // used when a game is running
var GAME_CANVAS

// player variables
var alarm = new Date().getTime() + REFRESH_RATE
var snake = []
var snakeLengthMax
var randomCube = null
var snakeDb
var highScores
var chainMovement = {current: null, previous: null}

// text
var copyrightText
  , copyrightTextStyle

// sounds
var sfxPickup
  , sfxGameOver
  , sfxClickButton
  , sfxClickMovementButton

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

var ATextures
  , tileGridTexture
  , tileGradientTexture
  , tileBlackTexture
  , cubeTexture
  , redTexture
  , btnTexture
  , arrowTexture
  , bgSideTexture

// this run no matter what scene is loaded
function preload() {

  // pixi's asset loader
  var ATexturesDefault = [
    '../img/darkGrid16x16.png'
  , '../img/darkGrid16x16.png'
  , '../img/bg32x568.png'
  , '../img/black16x16.png'
  , '../img/lightBlock16x16.png'
  , '../img/block16x16red.png'
  , '../img/btn64x256.jpg'
  , '../img/btnArrow64x64.jpg'
  , '../img/bgSide168x320.jpg'
  ]
  var ATexturesRetina = retinaLinkify(ATexturesDefault)

  if(R === 2) {
    ATextures = ATexturesRetina
  } else {
    ATextures = ATexturesDefault
  }

  var assetLoader = new P.AssetLoader(ATextures)
  assetLoader.onComplete = function(){
    document.getElementById('loading').style.display = 'none'
    document.getElementById('gameCanvas').style.display = 'block'
    firstStart()
  }
  assetLoader.load()

  // recover high scores from local storage if there are any.
  var snakeDb = JSON.parse(localStorage.getItem('NyliraGameSnake'))
  if(snakeDb !== null){
    highScores = snakeDb.highScores
    highScores = _.sortBy(highScores, function(num) {return num}).reverse()
    //console.log('highScores retrieved from localStorage: ', highScores)
  } else {
    highScores = []
    //console.log('No high scores in local storage yet. Add some!')
  }
}

function setup() {
  GAME_CANVAS = document.getElementById('gameCanvas')

  // setup stage
  stage = new P.Stage(0x141A1F)
  stage.interactive = true // make it clickable

  // setup renderer
  renderer = P.autoDetectRenderer(CANVAS_X, CANVAS_Y, {view: GAME_CANVAS})

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
  sfxClickMovementButton = new Howl({
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
    btnTexture = P.Texture.fromImage('../img/btn64x256@x2.jpg')
    arrowTexture = P.Texture.fromImage('../img/btnArrow64x64@x2.jpg')
    bgSideTexture = P.Texture.fromImage('../img/bgSide168x320@x2.jpg')
  } else {
    tileGridTexture = P.Texture.fromImage('../img/darkGrid16x16.png')
    tileGradientTexture = P.Texture.fromImage('../img/bg32x568.png')
    tileBlackTexture = P.Texture.fromImage('../img/black16x16.png')
    cubeTexture = P.Texture.fromImage('../img/lightBlock16x16.png')
    redTexture = P.Texture.fromImage('../img/block16x16red.png')
    btnTexture = P.Texture.fromImage('../img/btn64x256.jpg')
    arrowTexture = P.Texture.fromImage('../img/btnArrow64x64.jpg')
    bgSideTexture = P.Texture.fromImage('../img/bgSide168x320.jpg')
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

  // setup tag
  copyrightTextStyle = {
    font: 12*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsl(200,100%,50%)'
  , dropShadow: false
  }
  
  copyrightText = new P.Text('built by nylira.com', copyrightTextStyle)
  copyrightText.position.x = R*6
  copyrightText.position.y = CANVAS_Y - R*20
  copyrightText.interactive = true
  copyrightText.buttonMode = true
  copyrightText.alpha = 0.75
  copyrightText.mouseover = function() {copyrightText.alpha = 1.0}
  copyrightText.mouseout = function() {copyrightText.alpha = 0.75}
  copyrightText.click = copyrightText.tap = function() {
    window.open('http://nylira.com', '_blank')
  }
}

function initSceneMenu() {
  // background
  sceneMenu.addChild(tileGradient)
  sceneMenu.addChild(copyrightText)

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

  // swipe bindings
  mc = new Hammer(GAME_CANVAS)
  mc.get('swipe').set({
    direction: Hammer.DIRECTION_ALL
  , velocity: 0.35
  , threshold: 5
  })

  mc.on("press swipe", function(ev) {
    //console.log(ev.type +" event detected.")
    //console.log(ev.direction +" swipe detected.")

    // if the game is playing cature swipes
    if(sceneGame.visible === true) {
      sfxClickMovementButton.play()
      switch(ev.direction) {
        case 8:
          chainMovement.current = 'n'
          break
        case 16:
          chainMovement.current = 's'
          break
        case 4:
          chainMovement.current = 'e'
          break
        case 2:
          chainMovement.current = 'w'
          break
      }
    }
  })

  var bgSideSprite = new P.Sprite(bgSideTexture)
  bgSideSprite.position.x = MAP_X 
  bgSideSprite.position.y = 0
  sceneGame.addChild(bgSideSprite)

  // navigation button location
  var navButtons = new P.DisplayObjectContainer()
  navButtons.width = 64*2*R + 8*R
  navButtons.height = 64*3*R + 16*R
  navButtons.position.x = MAP_X + 64*R + 4*R + 16*R
  navButtons.position.y = 64*R

  // keybindings
  combokeys.bind(['up', 'w'], function() {chainMovement.current = 'n'})
  combokeys.bind(['down','s'], function() {chainMovement.current = 's'})
  combokeys.bind(['right','d'], function() {chainMovement.current = 'e'})
  combokeys.bind(['left','a'], function() {chainMovement.current = 'w'})

  btnUp.width = 64*R
  btnUp.height = 64*R
  btnUp.position.y = 31*R
  btnUp.anchor = new P.Point(0.5, 0.5)
  btnUp.interactive = true
  btnUp.buttonMode = true

  btnDown.width = 64*R
  btnDown.height = 64*R
  btnDown.position.y = btnUp.position.y + btnUp.height*2 + 16*R
  btnDown.anchor = new P.Point(0.5, 0.5)
  btnDown.rotation = Math.PI
  btnDown.interactive = true
  btnDown.buttonMode = true

  btnLeft.width = 64*R
  btnLeft.height = 64*R
  btnLeft.position.x = btnUp.position.x - btnUp.width/2 - 4*R
  btnLeft.position.y = btnUp.position.y + btnUp.height + 8*R
  btnLeft.anchor = new P.Point(0.5, 0.5)
  btnLeft.rotation = Math.PI * 1.5
  btnLeft.interactive = true
  btnLeft.buttonMode = true

  btnRight.width = 64*R
  btnRight.height = 64*R
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
    chainMovement = setChainMovement(GAME_RUNNING, sceneGame.visible, chainMovement, DIRECTIONS)
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
  sceneSummary.addChild(copyrightText)

  sceneSummaryLeft = new P.DisplayObjectContainer()
  sceneSummaryLeft.width = MAP_X
  sceneSummaryLeft.position.x = 0
  sceneSummaryLeft.position.y = 0
  sceneSummary.addChild(sceneSummaryLeft)

  sceneSummaryRight = new P.DisplayObjectContainer()
  sceneSummaryRight.width = CANVAS_X - MAP_X
  sceneSummaryRight.position.x = MAP_X
  sceneSummaryRight.position.y = 0
  sceneSummary.addChild(sceneSummaryRight)
  
  var bgSideSprite = new P.Sprite(bgSideTexture)
  bgSideSprite.position.x = 0
  bgSideSprite.position.y = 0
  sceneSummaryRight.addChild(bgSideSprite)

  // high scores label
  var highScoresLabelTextStyle = {
    font: 'bold '+ 16*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 3*R
  }
  var highScoresLabelText = new P.Text('High Scores', highScoresLabelTextStyle)
  highScoresLabelText.position.x = (CANVAS_X - MAP_X - highScoresLabelText.width)/2
  highScoresLabelText.position.y = 24*R
  sceneSummaryRight.addChild(highScoresLabelText)

  // high scores display
  var highScoresContainer = new P.DisplayObjectContainer()
  var scoreTextStyle = {
    font: 16*R + 'px "Helvetica Neue", Arial, Helvetica, sans-serif'
  , fill: 'hsla(38,100%,100%,0.75)'
  , dropShadow: true
  , dropShadowColor: 'hsla(0,0%,0%,0.3)'
  , dropShadowDistance: 3*R
  }

  // sort high scores
  highScores = sortDescending(highScores)

  for(var i=0; i < 10; i++) {
    var scoreTextX = 64*R
    var scoreTextY = highScoresLabelText.y + 32*R

    var scoreText
    if(highScores[i] !== undefined) {
      scoreText = new P.Text(highScores[i] + ' pts ', scoreTextStyle)
    } else {
      scoreText = new P.Text('--', scoreTextStyle)
    }
      
    scoreText.position.x = (CANVAS_X - MAP_X - scoreText.width)/2
    scoreText.position.y = scoreTextY + scoreText.height * i
    highScoresContainer.addChild(scoreText)
  }
  sceneSummaryRight.addChild(highScoresContainer)

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
  sceneSummaryLeft.addChild(gameOverText)

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
  sceneSummaryLeft.addChild(pointsText)

  // button
  btnAgain = new Button('Play Again', btnTexture)
  btnAgain.position.x = (CANVAS_X*0.67 - btnAgain.width)/2
  btnAgain.position.y = pointsText.position.y + 112*R
  sceneSummaryLeft.addChild(btnAgain)
}

function update(){
  // keep the game running if it isn't over
  requestAnimationFrame(update);


  // btnAgain
  if(sceneSummary.visible === true && GAME_RUNNING === false) {
    btnAgain.click = btnAgain.tap = function() {
      sfxClickButton.play()
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
        chainMovement = setChainMovement(GAME_RUNNING, sceneGame.visible, chainMovement, DIRECTIONS)
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
        startGame()
      }
    }
  }

  if(sceneGame.visible === true && GAME_RUNNING === true) {
    // see if this works
    
    btnUp.tap = btnUp.click =
      function(){chainMovement.current = 'n'; sfxClickMovementButton.play()}
    btnDown.tap = btnDown.click =
      function(){chainMovement.current = 's'; sfxClickMovementButton.play()}
    btnRight.tap = btnRight.click =
      function(){chainMovement.current = 'e'; sfxClickMovementButton.play()}
    btnLeft.tap = btnLeft.click =
      function(){chainMovement.current = 'w'; sfxClickMovementButton.play()}

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
    if(alarm < new Date().getTime()) {
      chainFlow(sceneGame, snake, snakeLengthMax, chainMovement.current, cubeTexture, GRID_UNIT)

      // update snake gradient
      gradiateChain(snake)

      alarm = new Date().getTime() + REFRESH_RATE
    }
  }
  renderer.render(stage)
}

function endGame() {
  // stop game loop
  GAME_RUNNING = false

  sfxGameOver.play()

  // remove hotkeys
  combokeys.reset()

  // reset chain movement
  chainMovement = {current: null, previous: null}

  // remove everything from the sceneGame
  for (var i=sceneGame.children.length-1; i >= 0; i--) {
    sceneGame.removeChild(sceneGame.children[i])
  }

  // remove the active random cube
  randomCube = null

  // remove all pieces from the snake
  snake = []

  // update high scores with the latest
  highScores = updateHighScores(snakeLengthMax, highScores, 'NyliraGameSnake')

  // setup the summary scene
  initSceneSummary()

  // show it
  sceneGame.visible = false
  sceneSummary.visible = true
}

function startGame(){
  sceneMenu.visible = false
  sceneSummary.visible = false

  initSceneGame()
  sceneGame.visible = true
  GAME_RUNNING = true

  chainMovement = setChainMovement(GAME_RUNNING, sceneGame.visible, chainMovement, DIRECTIONS)
}

function resetHighScores() {
  localStorage.setItem('NyliraGameSnake', null)
}

function firstStart() {
  setup()
  initSceneMenu()
  update()
}

preload()


