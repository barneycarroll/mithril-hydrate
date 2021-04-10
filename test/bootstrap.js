// Instantiate a DOM mock, emulate browser globals, expose Mithril & ospec
import {createRequire} from 'module'

const require = createRequire(import.meta.url)

const {JSDOM} = require('jsdom')

export default html => {
  const dom = new JSDOM(html)

  Object.assign(globalThis, dom, {
    window                : dom.window, 
    document              : dom.window.document,
    requestAnimationFrame : dom.window.requestAnimationFrame
  })

  Object.assign(globalThis, {
    o: require('ospec'),
    m: require('mithril'),
  })
}