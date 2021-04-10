import bootstrap from './bootstrap.js'
import Component from './Component.js'

const template = content => `
  <!doctype html>
  <html lang="en">
  <head>
    <title>Mithril Hydrate Test</title>
  </head>
  <body>
  ${content}
  </body>
  </html>
`

bootstrap(template())

import {desiccate} from '../mithril-hydrate.js?server'

const html = desiccate(document.body, m(Component))

bootstrap(template(html))

import {hydrate} from '../mithril-hydrate.js?browser'

hydrate(document.body, m(Component))