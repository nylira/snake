'use strict'
// libraries
var P = require('pixi.js')
var _ = require('lodash')
var Combokeys = require('combokeys')
var combokeys = new Combokeys(document)

// constants
var MAP_X = 1024
var MAP_Y = 1024
var GRID_UNIT = 32
var GAME_OVER
var DIRECTIONS = ['n', 's', 'e', 'w']
var REFRESH_RATE = 100//ms

// player variables
var snakeDirection = null
var alarm = new Date()
alarm.setTime(new Date().getTime() + REFRESH_RATE)
var snake = []
var maxSnakeLength
var randomCube = null

// stage variables
var stage, renderer
var tileTexture, cubeTexture, redTexture, flowerTexture, tiles, cube, cube1, cube2

// get the resolution of the screen pixi is on (if retina this will be 2)
var myDisplayResolution = window.devicePixelRatio;
// create an options object and include our resolution
var renderOptions = {resolution: myDisplayResolution}

function preload() {
  // setup stage
  stage = new P.Stage(0xCCD0CC)
  renderer = P.autoDetectRenderer(MAP_X, MAP_Y, renderOptions)
  document.getElementById('container').appendChild(renderer.view);

  if(myDisplayResolution === 2) {
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
  combokeys.bind(['up', 'w'], function() {snakeDirection = 'n'})
  combokeys.bind(['down','s'], function() {snakeDirection = 's'})
  combokeys.bind(['left','a'], function() {snakeDirection = 'e'})
  combokeys.bind(['right','d'], function() {snakeDirection = 'w'})
  combokeys.bind(['space','x'], function() {snakeDirection = null})

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
  // randomize position
  var initialPosition = randomPosition(MAP_X, MAP_Y, GRID_UNIT)
  cube.position.x = initialPosition[0]
  cube.position.y = initialPosition[1]

  //randomize direction
  snakeDirection = _.head(_.shuffle(DIRECTIONS))

  // go!
  snake.push(cube)
  stage.addChild(cube)
  maxSnakeLength = 1
}

function update(){
  // keep the game running if it isn't over
  if(GAME_OVER !== true) {
    requestAnimationFrame(update);
  }

  // spawn a random cube if one doesn't exist
  if (randomCube === null) {
    spawnRandomSprite(new P.Sprite(redTexture))
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
    maxSnakeLength++
  }

  // move once every REFRESH_RATE
  if(alarm.getTime() < new Date().getTime()) {
    move(snakeDirection)
    alarm.setTime(new Date().getTime() + REFRESH_RATE)
  }

  stayInBounds(snake[0])
  renderer.render(stage)
}

function move(dir) {
  var sprite = new P.Sprite(cubeTexture)
  switch(dir) {
    case 'n': spawnSprite(sprite, 0, -GRID_UNIT); break
    case 's': spawnSprite(sprite, 0, GRID_UNIT); break
    case 'e': spawnSprite(sprite, -GRID_UNIT, 0); break
    case 'w': spawnSprite(sprite, GRID_UNIT, 0); break
    default: break
  }
}

function spawnRandomSprite(sprite) {
  var positionsAreIllegal = true
  var spritePosition = randomPosition(MAP_X, MAP_Y, GRID_UNIT)

  var illegalSpawnPositions = []
  _.map(snake, function(cube){
    illegalSpawnPositions.push([cube.position.x, cube.position.y])
  })

  while(positionsAreIllegal) {
    // if the random position chosen is one of the snake's positions
    if(_.some(illegalSpawnPositions, spritePosition)) {
      // try a new random position
      spritePosition = randomPosition(MAP_X, MAP_Y, GRID_UNIT)
    } else {
      positionsAreIllegal = false
    }
  }

  sprite.position.x = spritePosition[0]
  sprite.position.y = spritePosition[1]
  stage.addChild(sprite)
  randomCube = sprite
}

function spawnSprite(sprite, offsetX, offsetY){
  // set up new cube
  var newCube = sprite
  newCube.position.x = snake[0].position.x + offsetX
  newCube.position.y = snake[0].position.y + offsetY

  // add new cube to the head of the list
  stage.addChild(newCube)
  snake.unshift(newCube)

  // remove the old cube if it's greater than max snake length
  if(snake.length > maxSnakeLength) {
    var popped = snake.pop()
    stage.removeChild(popped)
  }

  return newCube
}

function stayInBounds(sprite) {
  if(sprite.position.y < 0 || sprite.position.y > MAP_Y) {
    endGame()
  }
  if (sprite.position.x < 0 || sprite.position.x >= MAP_X) {
    endGame()
  }
}

function randomPosition(maxX, maxY, gridUnit) {
  var rangeX = (maxX / gridUnit) - 1
  var rangeY = (maxY / gridUnit) - 1

  var randomPositionX = _.random(0, rangeX) * gridUnit
  var randomPositionY = _.random(0, rangeY) * gridUnit

  return [randomPositionX, randomPositionY]
}

function endGame() {
  // pause the game loop
  GAME_OVER = true

  // unbind the hotkeys
  combokeys.reset()

  // stop the snake from moving
  snakeDirection = null

  resetGame()
}

function resetGame() {
  console.log('Game is resetting now!')

  // remove visual representation of snake
  for (var i=stage.children.length-1; i >= 0; i--) {
    stage.removeChild(stage.children[i])
  }

  // remove the randomCube
  randomCube = null

  // remove elements from the snake
  snake = []

  startGame()
}

function startGame(){
  GAME_OVER = false
  init()
  update()
}

preload()
var playButton = document.getElementById('play-button')
playButton.addEventListener('click', function() {
  startGame()
  playButton.style.display = 'none'
})
