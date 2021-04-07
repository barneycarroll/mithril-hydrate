const noop = () => {}

const elementHandler = {  
  get: (element, key) => (
      key === 'setAttribute'             ? noop
    : key === 'style'                    ? {setProperty: noop}
    : typeof element[key] === 'function' ? element[key].bind(element)
    :                                      Reflect.get(element, key)
  ),
}

const documentMethods = [
  'createElement',
  'createElementNS',
  'createDocumentFragment',
  'createTextNode',
]
  .map(key => [key, document[key]])

const nodeMethods = [
  'appendChild',
  'insertBefore',
]
  .map(key => [key, Node.prototype[key]])

export function render(host){
  if(typeof host.vnodes !== 'object'){
    var hydrating = true
    
    host.vnodes = []

    hijack(host)
  }

  m.render.apply(this, arguments)
  
  if(hydrating)
    reinstate()
}

function hijack(host){
  nodeMethods.forEach(([key, method]) => {
    Node.prototype[key] = noop
  })

  const walker = document.createTreeWalker(host)

  document.createDocumentFragment = () => {
    console.log('createDocumentFragment')
    
    return walker.currentNode
  }

  document.createTextNode = input => {
    console.log('createTextNode ' + input)
    
    let node = walker.nextNode()

    if(node.nodeType !== node.TEXT_NODE){
      console.log('mismatch')
      
      node = walker.nextNode()
    }

    if(!input.length){
      console.log('zero-width')
      
      node.before(input)
    }

    else if(node.nodeValue.length > input.length){
      console.log('length disparity')
      
      node.splitText(input.length)
    }

    return node
  }

  document.createElement = document.createElementNS = input => {
    console.log('createElement ' + input)
    
    return new Proxy(walker.nextNode(), elementHandler)
  }
  
  elementHandler.set = (element, key, value) => {
    if(key === 'textContent'){
      walker.nextNode()
    }
    
    return value
  }
}

function reinstate(){
  Object.assign(document,
    Object.fromEntries(documentMethods)
  )

  Object.assign(Node.prototype,
    Object.fromEntries(nodeMethods)
  )
    
  delete elementHandler.set

  elementHandler.get = (element, key) =>
      typeof element[key] === 'function'
    ?
      element[key].bind(element)
    :
      Reflect.get(element, key)
}