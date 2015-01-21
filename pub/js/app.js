pixi = require('pixi')
mousetrap = require('mousetrap')

// setup stage
var stage = new pixi.Stage(0xCCD0CC)
var renderer = pixi.autoDetectRenderer(480, 480)
document.body.appendChild(renderer.view);

// setup textures
var texture = pixi.Texture.fromImage('../img/block16x16.png')
var cube = new pixi.Sprite(texture)


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
