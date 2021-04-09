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

import {dessicate} from '../mithril-hydrate.js?server'

const html = dessicate(document.body, m(Component))

bootstrap(template(html))

import {hydrate} from '../mithril-hydrate.js?browser'

hydrate(document.body, m(Component))