'use strict'
// external
var P = require('pixi.js')
var Combokeys = require("combokeys");
var combokeys = new Combokeys(document)

// globals
var mapX = 512
var mapY = 512
var gu = 16
var gameOver = false

// player variables
var $direction = 'x'
var delay = 100
var alarm = new Date()
alarm.setTime(new Date().getTime() + delay)
var cubes = []



// setup stage
var stage = new P.Stage(0xCCD0CC)
var renderer = P.autoDetectRenderer(mapX, mapY)
document.body.appendChild(renderer.view);

// setup textures
var tileTexture = P.Texture.fromImage('../img/grid64x64.png')
var tiles = new P.TilingSprite(tileTexture, mapX, mapX)
var cubeTexture = P.Texture.fromImage('../img/block16x16.png')

var cube = new P.Sprite(cubeTexture)
var cube1 = new P.Sprite(cubeTexture)
var cube2 = new P.Sprite(cubeTexture)

function initialize() {
  // keybindings
  combokeys.bind(['up', 'w'], function() {$direction = 'n'; console.log("UP!!")})
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
initialize()

// animation loop
if(gameOver !== true) {
  requestAnimationFrame(animate);
}

function animate(){
  if(gameOver !== true) {
    requestAnimationFrame(animate);
  }

  // move once every delay
  if(alarm.getTime() < new Date().getTime()) {
    move($direction)
    alarm.setTime(new Date().getTime() + delay)
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
    case 'x':
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
  if(sprite.position.y < 0){
    restartGame()
  } else if (sprite.position.y > mapY) {
    restartGame()
  }
  if (sprite.position.x < 0) {
    restartGame()
  } else if (sprite.position.x >= mapX) {
    restartGame()
  }
}

function restartGame() {
  gameOver = true
  console.log('game over. restarting...')
  combokeys.reset()
  $direction = 'x'
  for (var i=stage.children.length-1; i >= 0; i--) {
    stage.removeChild(stage.children[i])
  }
  cubes = []
  initialize()
  gameOver = false
}
