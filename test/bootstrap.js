// Instantiate a DOM mock, emulate browser globals, expose Mithril & ospec
import {createRequire} from 'module'

import {parseHTML} from 'linkedom'

const require = createRequire(import.meta.url)

export default () =>
  Object.assign(globalThis, parseHTML('').window, {
    o: require('ospec'),
    m: require('mithril'),
  })