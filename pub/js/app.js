P = require('pixi.js')
mousetrap = require('mousetrap')

// globals
var mapX = 512
var mapY = 512
var gu = 16
var direction = 's'

// setup stage
var stage = new P.Stage(0xCCD0CC)
var renderer = P.autoDetectRenderer(mapX, mapY)
document.body.appendChild(renderer.view);

// setup textures
var cubeTexture = P.Texture.fromImage('../img/block16x16.png')
var cube = new P.Sprite(cubeTexture)
var tileTexture = P.Texture.fromImage('../img/grid64x64.png')
var tiles = new P.TilingSprite(tileTexture, mapX, mapX)

// setup bg
stage.addChild(tiles)

// setup cube
cube.position.x = 240
cube.position.y = 240
stage.addChild(cube)

// animation loop
requestAnimationFrame(animate);
function animate(){
  requestAnimationFrame(animate);

  move(cube, direction)
  stayInBounds(cube)


  console.log(cube.position.x, cube.position.y)
  renderer.render(stage)
}

function move(sprite, direction) {
  switch(direction) {
    case 'n': sprite.position.y -= gu; break
    case 's': sprite.position.y += gu; break
    case 'e': sprite.position.x -= gu; break
    case 'w': sprite.position.x += gu; break
    case 'x': break
  }
}

function stayInBounds(sprite) {
  if(sprite.position.y <= 0){
    move(sprite, 'x')
    sprite.position.y = 0
  } else if (sprite.position.y >= mapY) {
    move(sprite, 'x')
    sprite.position.y = mapY - gu
  }
  
  if (sprite.position.x <= 0) {
    move(sprite, 'x')
    sprite.position.x = 0
  } else if (sprite.position.x >= mapX) {
    move(sprite, 'x')
    sprite.position.x = mapX - gu
  }
}

// keybindings
Mousetrap.bind(['up', 'w'], function() {direction = 'n'})
Mousetrap.bind(['down','s'], function() {direction = 's'})
Mousetrap.bind(['left','a'], function() {direction = 'e'})
Mousetrap.bind(['right','d'], function() {direction = 'w'})
