P = require('pixi.js')
mousetrap = require('mousetrap')

// globals
var mapX = 512
var mapY = 512

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

  renderer.render(stage)
}

// keybindings
Mousetrap.bind(['up', 'w'], function() {
  cube.position.y -= 16
})

Mousetrap.bind(['down','s'], function() {
  cube.position.y += 16
})

Mousetrap.bind(['left','a'], function() {
  cube.position.x -= 16
})

Mousetrap.bind(['right','d'], function() {
  cube.position.x += 16
})
