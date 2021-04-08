// A slice of virtual DOM containing tricky configurations of text nodes, which are difficult to reconcile from normalised HTML
export default {
  view: ({attrs: {redraw = () => {}}}) => [
    '',
    '',
    m('h1', 'Hello, the time is ', (new Date).toLocaleTimeString(), ''),
    '',
    'blah',
    'blah',
    'blah',

    m('div',
      '',
      m('div', {
        oncreate({dom}){
          dom.append('boo!')
        },
        onclick(){
          redraw()
        },
      }, ''),
      '',
    ),

    '',
  ],
}