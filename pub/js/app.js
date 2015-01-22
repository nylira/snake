'use strict'
// external
var P = require('pixi.js')
var _ = require('lodash')
var Combokeys = require('combokeys')
var combokeys = new Combokeys(document)

// globals
var mapX = 512
var mapY = 512
var gu = 16
var gameOver

// player variables
var $direction = null
var refreshRate = 100//ms
var alarm = new Date()
alarm.setTime(new Date().getTime() + refreshRate)
var snake = []
var maxSnakeLength
var randomCube = null

// stage variables
var stage, renderer
var tileTexture, cubeTexture, cubeTextureRed, tiles, cube, cube1, cube2

function preload() {
  // setup stage
  stage = new P.Stage(0xCCD0CC)
  renderer = P.autoDetectRenderer(mapX, mapY)
  document.body.appendChild(renderer.view);

  // setup textures
  tileTexture = P.Texture.fromImage('../img/grid64x64.png')
  cubeTexture = P.Texture.fromImage('../img/block16x16.png')
  cubeTextureRed = P.Texture.fromImage('../img/block16x16red.png')

  // setup sprites
  tiles = new P.TilingSprite(tileTexture, mapX, mapX)
  cube = new P.Sprite(cubeTexture)
  cube1 = new P.Sprite(cubeTexture)
  cube2 = new P.Sprite(cubeTexture)
}

function init() {
  // keybindings
  combokeys.bind(['up', 'w'], function() {$direction = 'n'})
  combokeys.bind(['down','s'], function() {$direction = 's'})
  combokeys.bind(['left','a'], function() {$direction = 'e'})
  combokeys.bind(['right','d'], function() {$direction = 'w'})
  combokeys.bind(['space','x'], function() {$direction = 'x'})
  // setup bg
  stage.addChild(tiles)

  // setup initial snake
  cube.position.x = 240
  cube.position.y = 240
  cube1.position.x = 240
  cube1.position.y = 256
  cube2.position.x = 240
  cube2.position.y = 272
  stage.addChild(cube)
  stage.addChild(cube1)
  stage.addChild(cube2)

  snake.push(cube)
  snake.push(cube1)
  snake.push(cube2)

  maxSnakeLength = 3
}

function update(){
  // keep the game running if it isn't over
  if(gameOver !== true) {
    requestAnimationFrame(update);
  }

  // spawn a random cube if one doesn't exist
  if (randomCube === null) {
    spawnRandomSprite(new P.Sprite(cubeTextureRed))
  }

  // find the location of the cube tail elements
  var snakeTailPositions = []
  _.map(_.tail(snake), function(cube){
    snakeTailPositions.push([cube.position.x, cube.position.y])
  })

  // if snake[0] collides with itself
  if(_.some(snakeTailPositions, [snake[0].position.x, snake[0].position.y])) {
    // end the game
    restartGame()
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

  // move once every refreshRate
  if(alarm.getTime() < new Date().getTime()) {
    move($direction)
    alarm.setTime(new Date().getTime() + refreshRate)
  }

  stayInBounds(snake[0])
  renderer.render(stage)
}

function move(dir) {
  var sprite = new P.Sprite(cubeTexture)
  switch(dir) {
    case 'n': spawnSprite(sprite, 0, -gu); break
    case 's': spawnSprite(sprite, 0, gu); break
    case 'e': spawnSprite(sprite, -gu, 0); break
    case 'w': spawnSprite(sprite, gu, 0); break
    default: break
  }
}

function spawnRandomSprite(sprite) {

  var positionsAreIllegal = true
  var spritePosition = randomPosition(mapX, mapY, gu)

  var illegalSpawnPositions = []
  _.map(snake, function(cube){
    //console.log([cube.position.x, cube.position.y])
    illegalSpawnPositions.push([cube.position.x, cube.position.y])
  })

  //console.log('spritePosition', spritePosition)
  //console.log('illegalSpawnPositions: ', illegalSpawnPositions)

  while(positionsAreIllegal) {
    // if the random position chosen is one of the snake's positions
    if(_.some(illegalSpawnPositions, spritePosition)) {
      // try a new random position
      spritePosition = randomPosition(mapX, mapY, gu)
      //console.log('the random sprite\'s position is illegal, trying again')
    } else {
      positionsAreIllegal = false
      //console.log('spritePosition is legal: ', spritePosition)
    }
  }

  sprite.position.x = spritePosition[0]
  sprite.position.y = spritePosition[1]
  stage.addChild(sprite)
  randomCube = sprite
  //console.log("random sprite added at", sprite.position.x, sprite.position.y)
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
  if(sprite.position.y < 0 || sprite.position.y > mapY) {
    restartGame()
  }
  if (sprite.position.x < 0 || sprite.position.x >= mapX) {
    restartGame()
  }
}

function randomPosition(maxX, maxY, gridUnit) {
  var rangeX = (maxX / gridUnit) - 1
  var rangeY = (maxY / gridUnit) - 1

  var randomPositionX = _.random(0, rangeX) * gridUnit
  var randomPositionY = _.random(0, rangeY) * gridUnit

  return [randomPositionX, randomPositionY]
}

function restartGame() {
  // pause the game loop
  gameOver = true
  console.log('GAME OVER. Restarting...')

  // unbind the hotkeys
  combokeys.reset()

  // remove the randomCube
  randomCube = null

  // stop the snake from moving
  $direction = 'x'

  // remove visual representation of snake
  for (var i=stage.children.length-1; i >= 0; i--) {
    stage.removeChild(stage.children[i])
  }

  // remove elements from the snake
  snake = []

  startGame()
}

function startGame(){
  gameOver = false
  init()
}

preload()
startGame()
update()
