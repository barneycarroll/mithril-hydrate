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
    .map(([interface, key]) => [
      interface, key,
      Object.getOwnPropertyDescriptor(interface.prototype, key),
    ])

  // Most DOM manipulation mechanisms are simply no-op'd
  methods.forEach(([interface, key]) => {
    Object.defineProperty(interface.prototype, key, {get(){}})
  })

  Object.defineProperty(HTMLElement.prototype, 'style', {
    get: () => ({}),
    set(){},
  })

  const walker = document.createTreeWalker(dom)

  Object.defineProperty(Node.prototype.textContent, {set(){
    walker.nextNode()
  }})
  
  Document.prototype.createDocumentFragment = () =>
    walker.currentNode

  Document.prototype.createElement = document.createElementNS = () =>
    walker.nextNode()

  const {createTextNode} = Document.prototype

  Document.prototype.createTextNode = input => {
    if(input.length === 0)
      return createTextNode.call(this, input)
      
    walker.nextNode()

    if(walker.currentNode.nodeValue.length > input.length){
      walker.currentNode.splitText(input.length)
    }

    return walker.currentNode
  }
  
  const {appendChild} = Node.prototype

  Node.prototype.appendChild = input => {
    if(input.nodeType === input.TEXT_NODE && input.nodeValue.length === 0)
      return appendChild.call(this, input)
  } 
}

function reinstate(){
  methods.forEach(([interface, key, descriptor]) => {
    Object.defineProperty(interface.prototype, key, descriptor)
  })
}