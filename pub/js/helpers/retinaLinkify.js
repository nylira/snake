var _ = require('lodash')

function retinaLinkify(urls) {
  for(var i=0; i < urls.length; i++) {
    if (urls[i].indexOf('.png') !== -1) {
      urls[i] = urls[i].split('.png').join('@x2.png')
    } else if (urls[i].indexOf('.jpg') !== -1) {
      urls[i] = urls[i].split('.jpg').join('@x2.jpg')
    }
  }
  return urls
}

module.exports = retinaLinkify
