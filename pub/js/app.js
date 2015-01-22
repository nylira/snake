'use strict'
// external
var P = require('pixi.js')
var Combokeys = require("combokeys");
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
var cubes = []

// stage variables
var stage, renderer
var tileTexture, cubeTexture, tiles, cube, cube1, cube2

function preload() {
  // setup stage
  stage = new P.Stage(0xCCD0CC)
  renderer = P.autoDetectRenderer(mapX, mapY)
  document.body.appendChild(renderer.view);

  // setup textures
  tileTexture = P.Texture.fromImage('../img/grid64x64.png')
  cubeTexture = P.Texture.fromImage('../img/block16x16.png')

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

  // setup initial cubes
  cube.position.x = 240
  cube.position.y = 240
  cube1.position.x = 240
  cube1.position.y = 256
  cube2.position.x = 240
  cube2.position.y = 272
  stage.addChild(cube)
  stage.addChild(cube1)
  stage.addChild(cube2)
  cubes.push(cube)
  cubes.push(cube1)
  cubes.push(cube2)
}

function update(){
  if(gameOver !== true) {
    requestAnimationFrame(update);
  }

  // move once every refreshRate
  if(alarm.getTime() < new Date().getTime()) {
    move($direction)
    alarm.setTime(new Date().getTime() + refreshRate)
  }
  stayInBounds(cubes[0])
  renderer.render(stage)
}

function move(dir) {
  var newCube
  switch(dir) {
    case 'n': 
      newCube = spawnCube(0, -gu)
      break
    case 's':
      newCube = spawnCube(0, gu)
      break
    case 'e':
      newCube = spawnCube(-gu, 0)
      break
    case 'w':
      newCube = spawnCube(gu, 0)
      break
    default:
      break
  }
}

function spawnCube(offsetX, offsetY){
  // set up new cube
  var newCube = new P.Sprite(cubeTexture)
  newCube.position.x = cubes[0].position.x + offsetX
  newCube.position.y = cubes[0].position.y + offsetY

  // add new cube to the head of the list
  stage.addChild(newCube)
  cubes.unshift(newCube)

  // remove the old cube
  var popped = cubes.pop()
  stage.removeChild(popped)

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

function restartGame() {
  // pause the game loop
  gameOver = true
  console.log('GAME OVER. Restarting...')

  // unbind the hotkeys
  combokeys.reset()

  // stop the snake from moving
  $direction = 'x'

  // remove visual representation of snake
  for (var i=stage.children.length-1; i >= 0; i--) {
    stage.removeChild(stage.children[i])
  }

  // remove elements from the snake
  cubes = []

  startGame()
}

function startGame(){
  gameOver = false
  init()
}

preload()
startGame()
update()
