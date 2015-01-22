var React = require('react')
var depth = require('../helpers/depth')
var GoogleAnalytics = require('./google.analytics.js')

// text
metaDescription = "Find your bank's ABA routing/transit number in less than 10 seconds."

var HtmlHead = React.createClass({
  render: function(){
    var cssHref = depth(this.props.depth) + 'css/screen.css'
    return(
      e('head', null, [
        e('meta', {charSet: 'utf-8'})
      , e('meta', {name: 'description', content: metaDescription})
      , e('meta', {name: 'HandheldFriendly', content: 'true'})
      , e('meta', {name: 'MobileOptimized', content: '320'})
      , e('meta', {name: 'viewport',content:'width=device-width, initial-scale=1'})
      , e('title', null, this.props.htmlTitle)
      , e('link', {rel: 'stylesheet', type: 'text/css', href: cssHref})
      , e(GoogleAnalytics, {trackingId: 'UA-12283857-12'})
      ])
    )
  }
})

module.exports = HtmlHead
