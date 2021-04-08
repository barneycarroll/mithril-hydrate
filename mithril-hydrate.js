// Native DOM interfaces which will be overwritten during hydration
const methods = {
  document : [
    'createElement',
    'createElementNS',
    'createDocumentFragment',
    'createTextNode',
  ]
    .map(key => [key, document[key]]),

  node : [
    'appendChild',
    'insertBefore',
  ]
    .map(key => [key, Node.prototype[key]]),

  textContent  : Object.getOwnPropertyDescriptor(Node.prototype, 'textContent'),
  style        : Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style'),
  setAttribute : Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'setAttribute'),
}

const noop = () => {}

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

export function dessicate(dom, vnodes){
  try {
    m.render(
      dom, 
      
      m.fragment({
        oncreate(){
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

function ingest(dom){
  // Most DOM manipulation mechanisms are simply no-op'd
  methods.node.forEach(([key]) => {
    Node.prototype[key] = noop
  })

  Object.defineProperty(HTMLElement.prototype, 'style', {
    get: () => ({}),
    set: noop,
  })

  HTMLElement.prototype.setAttribute = noop

  const walker = document.createTreeWalker(dom)

  Object.defineProperty(Node.prototype.textContent, {set(){
    walker.nextNode()
  }})

  document.createDocumentFragment = () =>
    walker.currentNode

  document.createTextNode = input => {
    walker.nextNode()

    if(!input.length){
      node.before(input)

      walker.previousNode()
    }

    else if(walker.currentNode.nodeValue.length > input.length){
      walker.currentNode.splitText(input.length)
    }

    return walker.currentNode
  }

  document.createElement = document.createElementNS = input =>
    walker.nextNode()
}

function reinstate(){
  Object.assign(document,
    Object.fromEntries(methods.document)
  )

  Object.assign(Node.prototype,
    Object.fromEntries(methods.node)
  )

  Object.defineProperty(Node.prototype,        'textContent',  methods.textContent)

  Object.defineProperty(HTMLElement.prototype, 'style',        methods.style)

  Object.defineProperty(HTMLElement.prototype, 'setAttribute', methods.setAttribute)
}