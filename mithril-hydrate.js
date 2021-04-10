export function desiccate(dom, vnodes){
  try {
    m.render(
      dom, 
      
      m.fragment({
        oncreate(){
          // Abort before the oncreate phase executes for the subtree
          throw null
        },
      },
        vnodes,
      ),
    )
  }
  finally {
    return dom.innerHTML
  }
}

export function hydrate(dom, vnodes, callback){
  // Shortcircuit back to default
  if(dom.hydrated)
    return m.render.apply(this, arguments)

  if(!dom.vnodes)
    // Otherwise Mithril nukes the contents
    dom.vnodes = []
  
  // Hijack native DOM CRUD so Mithril ingests content instead of creating it
  const teardown = hijack(dom)

  m.render(
    dom,

    m.fragment({
      // Reinstate DOM bindings before subtree oncreate executes
      oncreate: teardown,
    }, vnodes),

    callback,
  )

  dom.vnodes = dom.vnodes[0].children

  dom.hydrated = true
}

function hijack(dom){
  // Native DOM interfaces which will be overwritten then reinstated during hydration:
  const {Document, Node, Element, HTMLElement} = window

  // a tuple of prototype, property key, descriptor          
  const interfaces = [
    [Document,    'createElement'         ],
    [Document,    'createElementNS'       ],
    [Document,    'createDocumentFragment'],
    [Document,    'createTextNode'        ],
    [Node,        'appendChild'           ],
    [Node,        'insertBefore'          ],
    [Node,        'textContent'           ],
    [Element,     'setAttribute'          ],
    [HTMLElement, 'style'                 ],
  ]
    .map(([{prototype}, key]) => [
      prototype, key,
      Object.getOwnPropertyDescriptor(prototype, key),
    ])
  
  const {appendChild}    = Node.prototype
  const {createTextNode} = Document.prototype


  // Most DOM manipulation mechanisms are simply no-op'd
  interfaces.forEach(([prototype, key]) => {
    Object.defineProperty(prototype, key, {get(){}})
  })

  Object.defineProperty(HTMLElement.prototype, 'style', {
    get: () => ({}),
  })

  const walker = document.createTreeWalker(dom)

  Object.defineProperties(Node.prototype, {
    textContent: {set(){ walker.nextNode() }},
    appendChild: {get: () => function(input){
      if(input && input.nodeType === input.TEXT_NODE && input.nodeValue.length === 0)
        return appendChild.call(this, input)
    }}
  })
  
  Object.defineProperties(Document.prototype, {
    createDocumentFragment: {get: () => () => walker.currentNode},
    createElement         : {get: () => () => walker.nextNode() },
    createElementNS       : {get: () => () => walker.nextNode() },
    createTextNode        : {get: () => function(input){
      if(input.length === 0)
        return createTextNode.call(this, input)
        
      walker.nextNode()
  
      if(walker.currentNode.nodeValue.length > input.length){
        walker.currentNode.splitText(input.length)
      }
  
      return walker.currentNode
    }}
  })

  // Return the teardown reinstating all DOM methods
  return () => {
    interfaces.forEach(([prototype, key, descriptor]) => {
      Object.defineProperty(prototype, key, descriptor)
    })
  }
}