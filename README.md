# mom - mobx micro-stores for react

Mom is an ultra-thin library on top of [React] and [Mobx] to implement micro-stores organised according to the [Hierarchical Model View Controller][HMVC] pattern (aka. HMVC).

[React]: https://react.dev/
[Mobx]: https://mobx.js.org/
[HMVC]: https://en.wikipedia.org/wiki/Hierarchical_model%E2%80%93view%E2%80%93controller

## Stores vs Micro-stores

React developers that have used libraries like [Redux] are very familiar with the store pattern that promotes the separation of the UI state (and actions) from the actual View logic (so the react component). Stores have many benefits and many technologies have been developed on this pattern (e.g. [Redux], [Mobx] or [Zustand]) - but none of them are very prescriptive as how the application code should be organized.

This is where mom comes into play as it introduces tools and conventions on how to **split the application in a hierarchy of application micro-stores**. Mom's main design principles were to:

-   guarantee the application **progressive load** to keep the [First Contentful Paint][FCP] metric low, even on large applications: the micro-stores can be loaded/unloaded dynamically (including the stores code)
-   leverage **Typescript** capabilities: the store objects are fully typed and expose the store data as read-only objects to ensure that data changes are only performed through _[action][MobxActions]_ functions (aka. MVC controllers) to comply with the [unidirectional data flow][UDF] pattern
-   ensure simple unit- and integration- testing with the built-in support of a [Dependency-Inversion] context provided by the [asimojs] library
-   provide very prescriptive **code organization and naming conventions** in order to simplify large code base management

Besides **mom can be easily integrated in existing React (or [Preact]) code bases** (no re-write required) - and is compatible with popular widget libraries like [shadcn].

[Redux]: https://redux.js.org/
[Zustand]: https://zustand-demo.pmnd.rs/
[UDF]: https://dev.to/aryclenio/unidirectional-and-bidirectional-data-flow-the-ultimate-front-end-interview-questions-guide-pt-1-5cnc
[MobxActions]: https://mobx.js.org/actions.html
[Dependency-Inversion]: https://en.wikipedia.org/wiki/Dependency_inversion_principle
[asimojs]: https://github.com/asimojs/asimo
[Preact]: https://preactjs.com/
[shadcn]: https://ui.shadcn.com/
[FCP]: https://web.dev/articles/fcp
