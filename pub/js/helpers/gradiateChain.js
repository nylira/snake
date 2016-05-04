function gradiateChain(chain){
  if(chain.length > 0) {
    for(var i=0; i < chain.length; i++) {
      var alpha = Math.max(Math.pow(0.9, i + 1), 0.33)
      chain[i].alpha = alpha
    }
  }
}
module.exports = gradiateChain
