export function dessicate(dom, vnodes){
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
  if(dom.hydrated)
    return m.render.apply(this, arguments)

  if(!dom.vnodes)
    // Otherwise Mithril nukes the contents
    dom.vnodes = []
  
  ingest(dom)

  m.render(
    dom,

    m.fragment({oncreate: reinstate}, vnodes),

    callback,
  )

  dom.vnodes = dom.vnodes[0].children

  dom.hydrated = true
}

function ingest(dom){
  const {Document, Node, HTMLElement} = window

  // Native DOM interfaces which will be overwritten during hydration
  const methods = [
    [Document,    'createElement'         ],
    [Document,    'createElementNS'       ],
    [Document,    'createDocumentFragment'],
    [Document,    'createTextNode'        ],
    [Node,        'appendChild'           ],
    [Node,        'insertBefore'          ],
    [Node,        'textContent'           ],
    [HTMLElement, 'setAttribute'          ],
    [HTMLElement, 'style'                 ],
  ]
    .map(([constructor, key]) => [
      constructor, key,
      Object.getOwnPropertyDescriptor(constructor.prototype, key),
    ])
  
  const {appendChild}    = Node.prototype
  const {createTextNode} = Document.prototype

  // Most DOM manipulation mechanisms are simply no-op'd
  methods.forEach(([constructor, key]) => {
    Object.defineProperty(constructor.prototype, key, {get(){}})
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
}

function reinstate(){
  methods.forEach(([constructor, key, descriptor]) => {
    Object.defineProperty(constructor.prototype, key, descriptor)
  })
}