function retinaLinkify(urls) {
  for(var i=0; i < urls.length; i++) {
    urls[i] = urls[i].split('.png').join('@x2.png')
  }
  return urls
}

module.exports = retinaLinkify
