# Mithril hydrate

## Status

This is a work in progress, pre-alpha.

## Scope

This project aims to bring hydration to Mithril: the same Mithril application code ought to be usable to render HTML instead of DOM for the first pass *and* then be used on the front-end to render subsequent passes. In order to do this we need to be able to ingest the DOM that the browser built from parsing the serialised HTML, and reconcile this with the virtual DOM construction Mithril produces on the front-end.

This module exports 2 functions, `dessicate` & `hydrate`, which proxy Mithril `m.render`:  `dessicate(dom, vnodes)` is intended to execute the Mithril call graph for its contents on the server, excluding the `oncreate` step, and returning the rendered HTML; the environment expects a DOM mock (like [linkedom](https://github.com/WebReflection/linkedom#-linkedom)) in order to generate the DOM & retrieve its HTML representation. `hydrate(dom, vnodes, callback)` is intended to be used on the client to 'continue' the lifecycle.  

## Strategy

Rather than establish a complex contract between the back & front end to allow Mithril application state to be serialised, this project aims simply to avoid needlessly recreating DOM that will have been parsed from HTML. There are no provisions or opinions regarding initialisation: the hyperscript call graph including any and all component closures and `oninit` methods *will* be executed, however no DOM will be produced in the first pass: instead the existing DOM will be crawled (and sliced, where needs be - more on this below) and bound to the virtual DOM structure; then `oncreate` methods will execute with the fully hydrated virtual DOM; subsequent draws will operate as normal.

## Technique

Mithril hydrate proxies `m.render`, keeping a reference to the first argument (the 'mountpoint') and wrapping the second argument (the virtual tree) in a fragment with an `oncreate` method. At this point, native DOM creation and mutation APIs are hijacked by the hydration script: 

1. Node creation is replaced by iteration through the existing DOM from the mountpoint
   1. In the case of text nodes - which serialised HTML concatenates - these are sometimes sliced & injected to match the virtual DOM representation
2. Node mutation is no-oped
   1. Except in the case of event listener attachments
3. The fragment `oncreate` reinstates native DOM bindings

## Caveats

The conceptual remit of this project is very basic & it is motivated by technical opportunity rather than functional necessity. There are many isomorphic / SSR features this has no intention of supporting:

1. State serialisation: all initialisation code in component closures and `oninit` will execute as part of `dessicate` *and* `hydrate`.
2. Async rendering: `dessicate` is just the computed results of the synchronous first render pass, minus `oncreate` execution. [mithril-node-render](https://github.com/MithrilJS/mithril-node-render) has an opinionated solution for delaying initial renders from within the Mithril lifecycle graph.