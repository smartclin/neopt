---
title: Overview
---

> [!NOTE]
> If you are upgrading from TanStack Table v8, start with the migration guide for your framework:

<!-- ::start:framework -->

# React

- [Migrating to v9](./framework/react/guide/migrating)

# Preact

- [Migrating to v9](./framework/preact/guide/migrating)

# Octane

- Octane support is new in v9, so there is nothing to migrate. Start with the [Octane Quick Start](./framework/octane/quick-start).

# Solid

- [Migrating to v9](./framework/solid/guide/migrating)

# Svelte

- [Migrating to v9](./framework/svelte/guide/migrating)

# Vue

- [Migrating to v9](./framework/vue/guide/migrating)

# Angular

- [Migrating to v9](./framework/angular/guide/migrating)

# Ember

- Ember support is new in v9, so there is nothing to migrate. Start with the [Quick Start](./framework/ember/quick-start).

# Lit

- [Migrating to v9](./framework/lit/guide/migrating)

# Alpine

- Alpine support is new in v9, so there is nothing to migrate. Start with the [Quick Start](./framework/alpine/quick-start).

# Vanilla

- The vanilla `@tanstack/table-core` entry point changed in v9. See the [Vanilla Quick Start](./framework/vanilla/quick-start) page for the new setup.

<!-- ::end:framework -->

TanStack Table is the best way to build your own powerful table and datagrid components with _blazingly fast_ performance, but most importantly, with **100% control over your own design and markup.**

In this new age of AI, where markup can be generated in seconds, the old value proposition of pre-built components (saving you the typing) matters less than ever. What matters now is owning and controlling the result, and that is exactly what TanStack Table gives you.

TanStack Table might be a bit of a different table library than you are used to. It is **_NOT_** a pre-built table component, like you might find from a library like [AG Grid](https://ag-grid.com?utm_source=reacttable&utm_campaign=githubreacttable). Instead, TanStack Table is a headless UI library that gives you the power to build your own fully customizable table and datagrid components the right way with whatever JavaScript libraries, component libraries, or design systems you want. TanStack Table is the _engine_ that you can hook up to your own favorite front-end tech, no matter what you're already using or want to use.

At its core, TanStack Table is **agnostic**. Most table data-processing and state logic is written in framework-agnostic TypeScript, and framework adapters connect that core to your favorite frameworks. Official adapters are provided for React, Preact, Octane, Vue, Solid, Svelte, Angular, Ember, Lit, and Alpine, or you can use the core directly in vanilla JavaScript via `@tanstack/table-core`.

It also **does not care which CSS or component library** you use, and is compatible with anything from Tailwind, Bootstrap, Material UI, ShadCN UI, or even your own custom design system.

## What is "Headless" UI?

**Headless UI** is a term for libraries and utilities that provide the logic, state, processing, and APIs for UI elements and interactions, but **do not provide markup, styles, or pre-built implementations**. The hardest parts of building complex UIs usually revolve around state, events, side effects, and data processing. By removing those concerns from the markup and styles, your logic becomes more modular and reusable, while you keep complete control over the look and feel. When you use a headless library like TanStack Table, the complex work of data processing, state management, and business logic is handled for you, so you can focus on the higher-cardinality decisions that differ across designs and use cases.

> Want to dive deeper? [Read more about Headless UI](https://www.merrickchristensen.com/articles/headless-user-interface-components/).

Here's the difference in practice. With a pre-built table component, you pass props in and style the result from the outside, limited to whatever the component's props and theme APIs allow. With TanStack Table, you create a table instance and use its state and APIs to render your own markup:

<!-- ::start:framework -->

# React

```diff
- {/* Pass props into a pre-built component and hope you can style it */}
- <PrebuiltDataGrid
-   data={data}
-   columns={columns}
-   theme={messyThemeOverrides}
-   sx={cssOverridesThatHopefullyWork}
-   positionPagination={"however-my-stakeholders-are-feeling-today"}
- />
+ // Build your own markup from the table instance's state and APIs
+ const table = useTable({ features, columns, data })
+
+ return (
+   <table className="anything-you-want">
+     <thead>
+       {/* need to really customize the functionality in your headers? no problem! */}
+       {table.getHeaderGroups().map((headerGroup) => ( ... ))}
+     </thead>
+     <tbody>
+       {/* want to add virtualization here? no problem! */}
+       {table.getRowModel().rows.map((row) => ( ... ))}
+     </tbody>
+   </table>
+ )
```

# Preact

```diff
- {/* Pass props into a pre-built component and hope you can style it */}
- <PrebuiltDataGrid
-   data={data}
-   columns={columns}
-   theme={messyThemeOverrides}
-   sx={cssOverridesThatHopefullyWork}
-   positionPagination={"however-my-stakeholders-are-feeling-today"}
- />
+ // Build your own markup from the table instance's state and APIs
+ const table = useTable({ features, columns, data })
+
+ return (
+   <table className="anything-you-want">
+     <thead>
+       {/* need to really customize the functionality in your headers? no problem! */}
+       {table.getHeaderGroups().map((headerGroup) => ( ... ))}
+     </thead>
+     <tbody>
+       {/* want to add virtualization here? no problem! */}
+       {table.getRowModel().rows.map((row) => ( ... ))}
+     </tbody>
+   </table>
+ )
```

# Octane

```diff
- {/* Pass props into a pre-built component and hope you can style it */}
- <PrebuiltDataGrid
-   data={data}
-   columns={columns}
-   theme={messyThemeOverrides}
-   sx={cssOverridesThatHopefullyWork}
-   positionPagination={"however-my-stakeholders-are-feeling-today"}
- />
+ // Build your own markup from the table instance's state and APIs
+ const table = useTable({ features, columns, data })
+
+ <table className="anything-you-want">
+   <thead>
+     {/* need to really customize the functionality in your headers? no problem! */}
+     @for (const headerGroup of table.getHeaderGroups(); key headerGroup.id) { ... }
+   </thead>
+   <tbody>
+     @for (const row of table.getRowModel().rows; key row.id) { ... }
+   </tbody>
+ </table>
```

# Solid

```diff
- {/* Pass props into a pre-built component and hope you can style it */}
- <PrebuiltDataGrid
-   data={data()}
-   columns={columns}
-   theme={messyThemeOverrides}
-   sx={cssOverridesThatHopefullyWork}
-   positionPagination={"however-my-stakeholders-are-feeling-today"}
- />
+ // Build your own markup from the table instance's state and APIs
+ const table = createTable({ features, columns, get data() { return data() } })
+
+ return (
+   <table class="anything-you-want">
+     <thead>
+       {/* need to really customize the functionality in your headers? no problem! */}
+       <For each={table.getHeaderGroups()}>{(headerGroup) => ( ... )}</For>
+     </thead>
+     <tbody>
+       {/* want to add virtualization here? no problem! */}
+       <For each={table.getRowModel().rows}>{(row) => ( ... )}</For>
+     </tbody>
+   </table>
+ )
```

# Svelte

```diff
- <!-- Pass props into a pre-built component and hope you can style it -->
- <PrebuiltDataGrid
-   {data}
-   {columns}
-   theme={messyThemeOverrides}
-   sx={cssOverridesThatHopefullyWork}
-   positionPagination="however-my-stakeholders-are-feeling-today"
- />
+ <!-- Build your own markup from the table instance's state and APIs -->
+ <script>
+   const table = createTable({ features, columns, get data() { return data } })
+ </script>
+
+ <table class="anything-you-want">
+   <thead>
+     <!-- need to really customize the functionality in your headers? no problem! -->
+     {#each table.getHeaderGroups() as headerGroup} ... {/each}
+   </thead>
+   <tbody>
+     <!-- want to add virtualization here? no problem! -->
+     {#each table.getRowModel().rows as row} ... {/each}
+   </tbody>
+ </table>
```

# Vue

```diff
- <!-- Pass props into a pre-built component and hope you can style it -->
- <PrebuiltDataGrid
-   :data="data"
-   :columns="columns"
-   :theme="messyThemeOverrides"
-   :sx="cssOverridesThatHopefullyWork"
-   position-pagination="however-my-stakeholders-are-feeling-today"
- />
+ <!-- Build your own markup from the table instance's state and APIs -->
+ <script setup>
+ const table = useTable({ features, columns, data })
+ </script>
+
+ <template>
+   <table class="anything-you-want">
+     <thead>
+       <!-- need to really customize the functionality in your headers? no problem! -->
+       <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">...</tr>
+     </thead>
+     <tbody>
+       <!-- want to add virtualization here? no problem! -->
+       <tr v-for="row in table.getRowModel().rows" :key="row.id">...</tr>
+     </tbody>
+   </table>
+ </template>
```

# Angular

```diff
- <!-- Pass props into a pre-built component and hope you can style it -->
- <prebuilt-data-grid
-   [data]="data"
-   [columns]="columns"
-   [theme]="messyThemeOverrides"
-   [styleOverrides]="cssOverridesThatHopefullyWork"
-   positionPagination="however-my-stakeholders-are-feeling-today"
- />
+ // Build your own markup from the table instance's state and APIs
+ readonly table = injectTable(() => ({ features, columns, data: this.data() }))
+
+ <!-- in your component template -->
+ <table class="anything-you-want">
+   <thead>
+     <!-- need to really customize the functionality in your headers? no problem! -->
+     @for (headerGroup of table.getHeaderGroups(); track headerGroup.id) { ... }
+   </thead>
+   <tbody>
+     <!-- want to add virtualization here? no problem! -->
+     @for (row of table.getRowModel().rows; track row.id) { ... }
+   </tbody>
+ </table>
```

# Ember

```diff
- <!-- Pass props into a pre-built component and hope you can style it -->
- <PrebuiltDataGrid
-   @data={{this.data}}
-   @columns={{this.columns}}
-   @theme={{this.messyThemeOverrides}}
-   @styleOverrides={{this.cssOverridesThatHopefullyWork}}
-   @positionPagination="however-my-stakeholders-are-feeling-today"
- />
+ // Build your own markup from the table instance's state and APIs
+ table = useTable(() => ({ features, columns, data: this.data }))
+
+ get rows() { return this.table.getRowModel().rows }
+ get headerGroups() { return this.table.getHeaderGroups() }
+
+ <template>
+   <table class="anything-you-want">
+     <thead>
+       {{! need to really customize the functionality in your headers? no problem! }}
+       {{#each this.headerGroups as |headerGroup|}} ... {{/each}}
+     </thead>
+     <tbody>
+       {{! want to add virtualization here? no problem! }}
+       {{#each this.rows as |row|}} ... {{/each}}
+     </tbody>
+   </table>
+ </template>
```

# Lit

```diff
- <!-- Pass props into a pre-built component and hope you can style it -->
- <prebuilt-data-grid
-   .data=${data}
-   .columns=${columns}
-   .theme=${messyThemeOverrides}
-   .sx=${cssOverridesThatHopefullyWork}
-   positionPagination="however-my-stakeholders-are-feeling-today"
- ></prebuilt-data-grid>
+ // Build your own markup from the table instance's state and APIs
+ private tableController = new TableController(this)
+
+ render() {
+   const table = this.tableController.table({ features, columns, data: this.data })
+
+   return html`
+     <table class="anything-you-want">
+       <thead>
+         <!-- need to really customize the functionality in your headers? no problem! -->
+         ${table.getHeaderGroups().map((headerGroup) => html`...`)}
+       </thead>
+       <tbody>
+         <!-- want to add virtualization here? no problem! -->
+         ${table.getRowModel().rows.map((row) => html`...`)}
+       </tbody>
+     </table>
+   `
+ }
```

# Alpine

```diff
- <!-- Pass props into a pre-built component and hope you can style it -->
- <prebuilt-data-grid
-   data="data"
-   columns="columns"
-   theme="messy-theme-overrides"
-   position-pagination="however-my-stakeholders-are-feeling-today"
- ></prebuilt-data-grid>
+ // Build your own markup from the table instance's state and APIs
+ Alpine.data('myTable', () => {
+   const table = createTable({ features, columns, get data() { return data } })
+   return { table }
+ })
+
+ <!-- in your markup -->
+ <table class="anything-you-want" x-data="myTable">
+   <thead>
+     <!-- need to really customize the functionality in your headers? no problem! -->
+     <template x-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">...</template>
+   </thead>
+   <tbody>
+     <!-- want to add virtualization here? no problem! -->
+     <template x-for="row in table.getRowModel().rows" :key="row.id">...</template>
+   </tbody>
+ </table>
```

# Vanilla

```diff
- // Configure a pre-built widget and hope you can style it
- new PrebuiltDataGrid('#my-table', {
-   data,
-   columns,
-   theme: messyThemeOverrides,
-   positionPagination: 'however-my-stakeholders-are-feeling-today',
- })
+ // Build your own markup from the table instance's state and APIs
+ const table = constructTable({ features, columns, data })
+
+ // render however you like: DOM APIs, innerHTML, or your own template system
+ table.getHeaderGroups().forEach((headerGroup) => { ... })
+ table.getRowModel().rows.forEach((row) => { ... })
```

<!-- ::end:framework -->

## Features

TanStack Table is packed with features, but you only ever bundle the ones you use. The full v9 package is about 25 KB when minified and Brotli-compressed, but more importantly, it is **modular**! You register only the features and row models that your table actually uses, and your bundler can tree-shake away unused optional capabilities. A basic table bundles just the small core. Because features vary in size and share that core, the exact savings depend on which capabilities you register.

We like to think of TanStack Table as more of a "system" for building tables than just a library, as it is one of the most customizable table libraries ever built. TanStack Table has the following built-in features, plus a custom feature (plugin) system for adding your own state and APIs.

<!-- ::start:framework -->

# React

- [Cell Selection](./framework/react/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/react/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/react/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/react/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/react/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/react/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/react/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/react/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/react/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/react/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/react/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/react/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/react/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/react/guide/pagination) - Paginate rows
- [Row Pinning](./framework/react/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/react/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/react/guide/sorting) - Sort rows by column values

# Preact

- [Cell Selection](./framework/preact/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/preact/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/preact/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/preact/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/preact/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/preact/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/preact/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/preact/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/preact/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/preact/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/preact/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/preact/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/preact/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/preact/guide/pagination) - Paginate rows
- [Row Pinning](./framework/preact/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/preact/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/preact/guide/sorting) - Sort rows by column values

# Octane

- [Cell Selection](./framework/octane/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/octane/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/octane/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/octane/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/octane/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/octane/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/octane/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/octane/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/octane/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/octane/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/octane/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/octane/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/octane/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/octane/guide/pagination) - Paginate rows
- [Row Pinning](./framework/octane/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/octane/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/octane/guide/sorting) - Sort rows by column values

# Solid

- [Cell Selection](./framework/solid/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/solid/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/solid/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/solid/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/solid/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/solid/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/solid/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/solid/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/solid/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/solid/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/solid/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/solid/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/solid/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/solid/guide/pagination) - Paginate rows
- [Row Pinning](./framework/solid/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/solid/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/solid/guide/sorting) - Sort rows by column values

# Svelte

- [Cell Selection](./framework/svelte/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/svelte/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/svelte/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/svelte/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/svelte/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/svelte/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/svelte/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/svelte/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/svelte/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/svelte/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/svelte/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/svelte/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/svelte/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/svelte/guide/pagination) - Paginate rows
- [Row Pinning](./framework/svelte/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/svelte/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/svelte/guide/sorting) - Sort rows by column values

# Vue

- [Cell Selection](./framework/vue/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/vue/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/vue/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/vue/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/vue/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/vue/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/vue/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/vue/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/vue/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/vue/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/vue/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/vue/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/vue/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/vue/guide/pagination) - Paginate rows
- [Row Pinning](./framework/vue/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/vue/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/vue/guide/sorting) - Sort rows by column values

# Angular

- [Cell Selection](./framework/angular/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/angular/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/angular/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/angular/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/angular/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/angular/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/angular/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/angular/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/angular/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/angular/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/angular/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/angular/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/angular/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/angular/guide/pagination) - Paginate rows
- [Row Pinning](./framework/angular/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/angular/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/angular/guide/sorting) - Sort rows by column values

# Ember

- [Cell Selection](./framework/ember/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/ember/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/ember/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/ember/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/ember/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/ember/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/ember/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/ember/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/ember/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/ember/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/ember/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/ember/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/ember/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/ember/guide/pagination) - Paginate rows
- [Row Pinning](./framework/ember/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/ember/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/ember/guide/sorting) - Sort rows by column values

# Lit

- [Cell Selection](./framework/lit/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/lit/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/lit/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/lit/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/lit/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/lit/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/lit/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/lit/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/lit/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/lit/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/lit/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/lit/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/lit/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/lit/guide/pagination) - Paginate rows
- [Row Pinning](./framework/lit/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/lit/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/lit/guide/sorting) - Sort rows by column values

# Alpine

- [Cell Selection](./framework/alpine/guide/cell-selection) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./framework/alpine/guide/cell-spanning) - Merge adjacent body cells across rows or columns
- [Column Filtering](./framework/alpine/guide/column-filtering) - Filter rows based on search values for a column
- [Column Grouping](./framework/alpine/guide/grouping) - Group rows by one or more column values
- [Column Ordering](./framework/alpine/guide/column-ordering) - Dynamically change the order of columns
- [Column Pinning](./framework/alpine/guide/column-pinning) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./framework/alpine/guide/column-resizing) - Let users resize columns with drag handles
- [Column Sizing](./framework/alpine/guide/column-sizing) - Dynamically change the size of columns
- [Column Visibility](./framework/alpine/guide/column-visibility) - Hide/show columns
- [Faceting](./framework/alpine/guide/column-faceting) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./framework/alpine/guide/global-filtering) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/alpine/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./framework/alpine/guide/expanding) - Expand/collapse rows (sub-rows)
- [Row Pagination](./framework/alpine/guide/pagination) - Paginate rows
- [Row Pinning](./framework/alpine/guide/row-pinning) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./framework/alpine/guide/row-selection) - Select/deselect rows (checkboxes)
- [Row Sorting](./framework/alpine/guide/sorting) - Sort rows by column values

# Vanilla

- [Cell Selection](./reference/index/variables/cellSelectionFeature) - Select spreadsheet-style rectangular ranges of cells
- [Cell Spanning](./reference/index/variables/cellSpanningFeature) - Merge adjacent body cells across rows or columns
- [Column Filtering](./reference/index/variables/columnFilteringFeature) - Filter rows based on search values for a column
- [Column Grouping](./reference/index/variables/columnGroupingFeature) - Group rows by one or more column values
- [Column Ordering](./reference/index/variables/columnOrderingFeature) - Dynamically change the order of columns
- [Column Pinning](./reference/index/variables/columnPinningFeature) - Pin (Freeze) columns to the left or right of the table
- [Column Resizing](./reference/index/variables/columnResizingFeature) - Let users resize columns with drag handles
- [Column Sizing](./reference/index/variables/columnSizingFeature) - Dynamically change the size of columns
- [Column Visibility](./reference/index/variables/columnVisibilityFeature) - Hide/show columns
- [Faceting](./reference/index/variables/columnFacetingFeature) - List unique values or min/max values for a column or for the entire table
- [Global Filtering](./reference/index/variables/globalFilteringFeature) - Filter rows based on search values for the entire table
- [Row Aggregation](./framework/vanilla/guide/aggregation) - Calculate summary values for grouped, root, or custom row sets
- [Row Expanding](./reference/index/variables/rowExpandingFeature) - Expand/collapse rows (sub-rows)
- [Row Pagination](./reference/index/variables/rowPaginationFeature) - Paginate rows
- [Row Pinning](./reference/index/variables/rowPinningFeature) - Pin (Freeze) rows to the top or bottom of the table
- [Row Selection](./reference/index/variables/rowSelectionFeature) - Select/deselect rows (checkboxes)
- [Row Sorting](./reference/index/variables/rowSortingFeature) - Sort rows by column values

<!-- ::end:framework -->

## Composition

Headless doesn't just mean "bring your own styles". Because you own the markup, the event handlers, and (optionally) the state, TanStack Table composes cleanly with whatever else your table needs:

- **Your own state**: Any slice of table state (sorting, filters, pagination, etc.) can be lifted out of the table and managed however you like: in your framework's state, in a global store, or even in the URL.
- **Your own features**: Custom features let you add your own state and APIs directly to the table instance, right alongside the built-in ones. See the Custom Features guide for your framework.
- **Your own logic**: Anything else (fancy interactions, analytics, drag and drop, etc.) is just code you write around the table. There is no black box to fight against.

This also makes it easy to pair TanStack Table with other TanStack libraries:

- [TanStack Virtual](https://tanstack.com/virtual/latest) - Virtualize thousands of rows or columns without changing any table logic (see the Virtualization guide for your framework)
- [TanStack Query](https://tanstack.com/query/latest) - Fetch and cache server-side data for manual pagination, sorting, and filtering
- [TanStack Form](https://tanstack.com/form/latest) - Build editable cells and inline row editing with validation
- [TanStack Pacer](https://tanstack.com/pacer/latest) - Debounce or throttle filter inputs and other rapid-fire interactions
- [TanStack Hotkeys](https://tanstack.com/hotkeys/latest) - Add type-safe keyboard shortcuts for table navigation and actions
- [TanStack Store](https://tanstack.com/store/latest) - Already powers table state under the hood; provide your own atoms to take full control of any state slice

## Get Started

Ready to build something? Head to the Quick Start for your framework, then explore the runnable examples:

<!-- ::start:framework -->

# React

- [React Quick Start](./framework/react/quick-start)
- [Kitchen Sink example](./framework/react/examples/kitchen-sink) - Most of the built-in features working together in one table

Using a component library? These examples pair TanStack Table with popular React component libraries, with both a basic version and an advanced (kitchen sink) version for each:

- ShadCN (Base UI): [Basic Example](./framework/react/examples/lib-shadcn-base) | [Advanced Example](./framework/react/examples/kitchen-sink-shadcn-base)
- ShadCN (Radix UI): [Basic Example](./framework/react/examples/lib-shadcn-radix) | [Advanced Example](./framework/react/examples/kitchen-sink-shadcn-radix)
- HeroUI: [Basic Example](./framework/react/examples/lib-hero-ui) | [Advanced Example](./framework/react/examples/kitchen-sink-hero-ui)
- React Aria: [Basic Example](./framework/react/examples/lib-react-aria) | [Advanced Example](./framework/react/examples/kitchen-sink-react-aria)
- Material UI: [Basic Example](./framework/react/examples/lib-material-ui) | [Advanced Example](./framework/react/examples/kitchen-sink-material-ui)
- Mantine: [Basic Example](./framework/react/examples/lib-mantine) | [Advanced Example](./framework/react/examples/kitchen-sink-mantine)
- Chakra UI: [Basic Example](./framework/react/examples/lib-chakra-ui) | [Advanced Example](./framework/react/examples/kitchen-sink-chakra-ui)

# Preact

- [Preact Quick Start](./framework/preact/quick-start)
- [Kitchen Sink example](./framework/preact/examples/kitchen-sink) - Most of the built-in features working together in one table

# Octane

- [Octane Quick Start](./framework/octane/quick-start)
- [Kitchen Sink example](./framework/octane/examples/kitchen-sink) - Most of the built-in features working together in one table

# Solid

- [Solid Quick Start](./framework/solid/quick-start)
- [Kitchen Sink example](./framework/solid/examples/kitchen-sink) - Most of the built-in features working together in one table

# Svelte

- [Svelte Quick Start](./framework/svelte/quick-start)
- [Kitchen Sink example](./framework/svelte/examples/kitchen-sink) - Most of the built-in features working together in one table

Using a component library? These examples pair TanStack Table with shadcn-svelte:

- shadcn-svelte: [Basic Example](./framework/svelte/examples/lib-shadcn) | [Advanced Example](./framework/svelte/examples/kitchen-sink-shadcn)

# Vue

- [Vue Quick Start](./framework/vue/quick-start)
- [Kitchen Sink example](./framework/vue/examples/kitchen-sink) - Most of the built-in features working together in one table

Using a component library? These examples pair TanStack Table with shadcn-vue:

- shadcn-vue: [Basic Example](./framework/vue/examples/lib-shadcn) | [Advanced Example](./framework/vue/examples/kitchen-sink-shadcn)

# Angular

- [Angular Quick Start](./framework/angular/quick-start)
- [Kitchen Sink example](./framework/angular/examples/kitchen-sink) - Most of the built-in features working together in one table

# Ember

- [Ember Quick Start](./framework/ember/quick-start)
- [Kitchen Sink example](./framework/ember/examples/kitchen-sink) - Most of the built-in features working together in one table

# Lit

- [Lit Quick Start](./framework/lit/quick-start)
- [Kitchen Sink example](./framework/lit/examples/kitchen-sink) - Most of the built-in features working together in one table

# Alpine

- [Alpine Quick Start](./framework/alpine/quick-start)
- [Basic example](./framework/alpine/examples/basic-create-table) - A simple table to get you started

# Vanilla

- [Vanilla Quick Start](./framework/vanilla/quick-start)
- [Basic example](./framework/vanilla/examples/basic) - A simple table built directly on `@tanstack/table-core`

<!-- ::end:framework -->

---

title: Quick Start
---

TanStack Table is a headless table library. It manages your table's state and logic (sorting, filtering, pagination, selection, and more) while you keep 100% control over the markup and styles. This page gets you from install to a rendering React table, then shows how to layer on your first feature.

## Installation

```bash
npm install @tanstack/react-table
```

## Your First Table

The component below is complete. Paste it into a React app and you will see a working table.

```tsx
import type { ColumnDef } from "@tanstack/react-table";

import { tableFeatures, useTable } from "@tanstack/react-table";

// 1. Define the shape of your data
type Person = {
  firstName: string;
  lastName: string;
  age: number;
};

// 2. Give your data a stable reference (module scope, useState, useQuery, etc.)
const data: Array<Person> = [
  { firstName: "tanner", lastName: "linsley", age: 24 },
  { firstName: "tandy", lastName: "miller", age: 40 },
  { firstName: "joe", lastName: "dirte", age: 45 },
];

// 3. New in v9: declare which features this table uses (none yet)
const features = tableFeatures({});

// 4. Define your columns
const columns: Array<ColumnDef<typeof features, Person>> = [
  {
    accessorKey: "firstName", // accessorKey shorthand
    header: "First Name",
    cell: (info) => info.getValue(),
  },
  {
    accessorFn: (row) => row.lastName, // accessorFn alternative with a custom id
    id: "lastName",
    header: () => <span>Last Name</span>,
    cell: (info) => <i>{info.getValue<string>()}</i>,
  },
  {
    accessorKey: "age",
    header: () => "Age",
  },
];

export function PersonTable() {
  // 5. Create the table instance
  const table = useTable({
    key: "person-table", // needed for devtools, omit if you don't want to use the devtools
    features,
    columns,
    data,
  });

  // 6. Render markup from the table instance APIs
  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getAllCells().map((cell) => (
              <td key={cell.id}>
                <table.FlexRender cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

A few things to note:

- `tableFeatures({})` declares which optional features the table uses. Registering only what you need keeps bundles small and gives TypeScript accurate types for the table instance.
- The core row model is always included automatically. Feature row models (sorting, filtering, pagination) are registered as slots on the features object when you need them.
- `table.FlexRender` renders the `header`, `cell`, and `footer` definitions from your columns, whether they are plain values or React components.
- The `key` option is optional unless you use the [TanStack Table Devtools](../../devtools). The devtools identify tables by `key`, and you register a table by calling `useTanStackTableDevtools(table)` from `@tanstack/react-table-devtools`.

See the full [Basic useTable example](./examples/basic-use-table) for a runnable version with more columns and a footer.

## Add a Feature: Sorting

Features are opt-in in v9. To make columns sortable, register `rowSortingFeature` and the sorted row model in `tableFeatures`, then wire the header click handler.

```tsx
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

const features = tableFeatures({
  rowSortingFeature, // enables sorting APIs and state
  sortedRowModel: createSortedRowModel(), // client-side sorting
  sortFns,
});

export function PersonTable() {
  const table = useTable({
    key: "person-table",
    features,
    columns,
    data,
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder ? null : (
                  <div
                    style={{
                      cursor: header.column.getCanSort() ? "pointer" : undefined,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <table.FlexRender header={header} />
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      {/* tbody unchanged from above */}
    </table>
  );
}
```

Clicking a header now toggles between ascending, descending, and unsorted. Every other feature follows this same pattern: register the feature and its row model factory (if it has one) in `tableFeatures`, then use the APIs it adds to the table, columns, and rows. See the [Sorting Guide](./guide/sorting) and the [Sorting example](./examples/sorting) for custom sort functions, multi-sorting, and per-column options.

## Where to Go Next

**Table state.** In v9, table state is backed by TanStack Store atoms. You usually do not need to manage it yourself. Set `initialState` for starting values and call feature APIs like `table.setSorting(...)` or `table.nextPage()`. When your app should own a state slice, or you want fine-grained subscriptions, read the [Table State Guide](./guide/table-state). It is the foundational guide for everything else.

**Feature guides.** Each feature has its own guide, such as [Column Filtering](./guide/column-filtering), [Pagination](./guide/pagination), [Row Selection](./guide/row-selection), and [Column Visibility](./guide/column-visibility).

**Composable tables.** When multiple tables in your app share features, row models, and component conventions, define them once with `createTableHook`:

```tsx
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
});

const { useAppTable, createAppColumnHelper } = createTableHook({ features });
```

See the [Composable Tables Guide](./guide/composable-tables) for the full pattern, including pre-bound cell and header components.

**Examples.** Browse the runnable [React examples](./examples/basic-use-table), from basic tables to feature demos, to see intended usage end to end.

---

title: Global Filtering (React) Guide
---

## Examples

Want to skip to the implementation? Check out these React examples:

- [Column Filters](../examples/filters)
- [Fuzzy Search](../examples/filters-fuzzy)

### Global Filtering Setup

Here's how you set up your table to use global filtering features. Global filtering depends on column filtering, so add `columnFilteringFeature` before `globalFilteringFeature`. Adding the global filtering feature enables the related APIs. If you use client-side filtering, also set up `filteredRowModel` after its feature, since row model slots are type-checked.

```tsx
import {
  useTable,
  tableFeatures,
  columnFilteringFeature,
  globalFilteringFeature,
  createFilteredRowModel,
  filterFn_includesString,
} from "@tanstack/react-table";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(), // if using client-side filtering
  // manualFiltering: true, // if using manual server-side filtering
  filterFns: { includesString: filterFn_includesString },
});

const table = useTable({
  features,
  columns,
  data,
});
```

> [!NOTE]
> The `filterFns` registry above lists only the built-in filter function this table uses. Spreading the entire built-in `filterFns` registry (`filterFns: { ...filterFns }`) still works, but it puts every built-in filter function in your bundle. Register just the functions you use, or pass a function directly to the `globalFilterFn` option with no registration at all.

## Global Filtering (React) Guide

Filtering comes in 2 flavors: Column Filtering and Global Filtering.

This guide will focus on global filtering, which is a filter that is applied across all columns.

### Client-Side vs Server-Side Filtering

Filtering should operate over the same dataset as sorting and pagination. Use client-side filtering when the browser has the complete dataset; use server-side filtering when it has only a page or another subset, unless filtering just the loaded rows is intentional.

See the [Client-Side vs Server-Side Guide](../../../guide/client-side-vs-server-side) for the full decision framework, performance factors, and guidance for combining data operations.

The client-side filtered row model also invokes the page-index auto-reset hook when global filtering inputs change. Whether the page index resets depends on the `autoResetPageIndex`, `autoResetAll`, and `manualPagination` options. If filtering is manual and this row model is omitted or bypassed, a global filter state change does not invoke that hook, so reset server-side pagination in the filter change handler when needed.

### Manual Server-Side Global Filtering

If you have decided that you need to implement server-side global filtering instead of using the built-in client-side global filtering, here's how you do that.

No `filteredRowModel` is needed for manual server-side global filtering. Instead, the `data` that you pass to the table should already be filtered. However, if you have added a `filteredRowModel` to the features object, you can tell the table to skip it by setting the `manualFiltering` option to `true`.

```tsx
import {
  useTable,
  tableFeatures,
  columnFilteringFeature,
  globalFilteringFeature,
} from "@tanstack/react-table";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
});

const table = useTable({
  features,
  data,
  columns,
  manualFiltering: true,
});
```

Note: When using manual global filtering, many of the options that are discussed in the rest of this guide will have no effect. When manualFiltering is set to true, the table instance will not apply any global filtering logic to the rows that are passed to it. Instead, it will assume that the rows are already filtered and will use the data that you pass to it as-is.

### Client-Side Global Filtering

If you are using the built-in client-side global filtering, add the `globalFilteringFeature` (along with its required `columnFilteringFeature` prerequisite) and the `filteredRowModel` factory to your features:

```tsx
import {
  useTable,
  tableFeatures,
  columnFilteringFeature,
  globalFilteringFeature,
  createFilteredRowModel,
  filterFn_includesString,
} from "@tanstack/react-table";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
});

const table = useTable({
  features,
  // other options...
});
```

### Global Filter Function

The `globalFilterFn` option sets the filter function used for global filtering. The filter function can be a string that references a filter function (built-in or custom) registered in the `filterFns` slot on `tableFeatures`, or a filter function passed directly.

```tsx
const table = useTable({
  features,
  data,
  columns,
  globalFilterFn: "includesString", // built-in filter function
});
```

By default there are 12 built-in filter functions to choose from:

- `includesString` - Case-insensitive string inclusion
- `includesStringSensitive` - Case-sensitive string inclusion
- `equalsString` - Case-insensitive string equality
- `equals` - Strict equality `===`
- `weakEquals` - Weak equality `==`
- `arrIncludes` - The row's array (or string) value includes at least one of the filter values
- `arrIncludesAll` - The row's array value includes every filter value
- `arrIncludesSome` - The row's array value includes at least one of the filter values
- `arrHas` - The row's scalar value equals at least one of the filter values
- `inNumberRange` - Inclusive `[min, max]` number range (endpoints normalized and swapped if reversed)
- `between` - Exclusive min/max range (blank endpoints are open-ended)
- `betweenInclusive` - Inclusive min/max range (blank endpoints are open-ended)

You can also define your own custom global filter function and pass it directly to the `globalFilterFn` table option, as shown [below](#custom-global-filter-function).

### Global Filter State

The `globalFilter` state slice holds the current global filter value, usually a search string (the slice is typed as `any` so custom global filter functions can accept other value shapes). For reactive reads that should re-render your UI, use `table.state.globalFilter`. In event handlers, you can read the current snapshot with `table.atoms.globalFilter.get()`, but this read does not subscribe the component to future changes.

If you need access to the global filter state outside of the table, you can own the slice yourself. The recommended way in v9 is an external atom passed through the `atoms` table option. Atoms preserve fine-grained subscriptions, and the filter value can be used elsewhere (such as in a query key for server-side filtering) without forcing the component that owns the table to re-render.

```tsx
import { useCreateAtom, useSelector } from "@tanstack/react-store";

const globalFilterAtom = useCreateAtom<string>("");

// subscribe to the atom wherever you need the value (e.g. for a query key)
const globalFilter = useSelector(globalFilterAtom);

const table = useTable({
  features,
  // other options...
  atoms: {
    globalFilter: globalFilterAtom, // table.setGlobalFilter now updates globalFilterAtom
  },
});
```

Alternatively, the v8-style `state.globalFilter` plus `onGlobalFilterChange` pattern is still supported. It can be convenient for simple integrations or when migrating v8 code, but it is less fine-grained than external atoms. See the [Table State Guide](./table-state) for a deeper comparison.

```tsx
const [globalFilter, setGlobalFilter] = useState<string>("");

const table = useTable({
  features,
  // other options...
  state: {
    globalFilter,
  },
  onGlobalFilterChange: setGlobalFilter,
});
```

### Adding global filter input to UI

TanStack table will not add a global filter input UI to your table. You should manually add it to your UI to allow users to filter the table. For example, you can add an input UI above the table to allow users to enter a search term. Read the value reactively with `table.state.globalFilter` and update it with `table.setGlobalFilter`.

```tsx
return (
  <div>
    <input
      value={table.state.globalFilter ?? ""}
      onChange={(e) => table.setGlobalFilter(String(e.target.value))}
      placeholder="Search..."
    />
  </div>
);
```

### Custom Global Filter Function

If you want to use a custom global filter function, you can define the function and pass it to the `globalFilterFn` option.

> [!NOTE]
> It is often a popular idea to use fuzzy filtering functions for global filtering. This is discussed in the [Fuzzy Filtering Guide](./fuzzy-filtering).

```tsx
const customFilterFn = (row, columnId, filterValue) => {
  return; // true if the row should be included in the filtered rows
};

const table = useTable({
  features,
  // other options...
  globalFilterFn: customFilterFn,
});
```

### Initial Global Filter State

If you want to set an initial global filter state when the table is initialized, you can pass the global filter state as part of the table `initialState` option. However, if you are controlling the slice yourself, set the starting value on your external atom or React state instead.

```tsx
const table = useTable({
  features,
  // other options...
  initialState: {
    globalFilter: "search term", // if not controlling globalFilter state, set initial state here
  },
});
```

> [!NOTE]
> Do not use both `initialState.globalFilter` and a controlled `globalFilter` (via `atoms` or `state`) at the same time, as the controlled value will override `initialState.globalFilter`.

### Disable Global Filtering

By default, global filtering is enabled for all columns. You can disable the global filtering for all columns by using the enableGlobalFilter table option. You can also turn off both column and global filtering by setting the enableFilters table option to false.

Disabling global filtering will cause the column.getCanGlobalFilter API to return false for that column.

```tsx
const columns = [
  {
    header: () => "Id",
    accessorKey: "id",
    enableGlobalFilter: false, // disable global filtering for this column
  },
  //...
];
//...
const table = useTable({
  features,
  // other options...
  columns,
  enableGlobalFilter: false, // disable global filtering for all columns
});
```

### Global Filter APIs

There are several APIs that are useful for hooking up your global filter UI:

- `table.setGlobalFilter` - Set the global filter value. Useful for connecting a search input's `onChange` handler.
- `table.resetGlobalFilter` - Reset the global filter value to its initial state, or clear it with `table.resetGlobalFilter(true)`.
- `table.getGlobalFilterFn` - Returns the filter function currently used for global filtering.
- `table.getGlobalAutoFilterFn` - Returns the default global filter function (currently `includesString`).
- `column.getCanGlobalFilter` - Returns whether a column participates in global filtering. Useful for debugging which columns are searched.

---

title: Fuzzy Filtering (React) Guide
---

## Examples

Want to skip to the implementation? Check out these React examples:

- [Fuzzy Search](../examples/filters-fuzzy)

### Fuzzy Filtering Setup

Here's how you set up your table to use fuzzy filtering features. Adding the fuzzy filtering feature enables the related APIs. If you use client-side fuzzy filtering and sorting, also set up `filteredRowModel` and `sortedRowModel` after their features, since row model slots are type-checked.

```tsx
import {
  useTable,
  tableFeatures,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  createFilteredRowModel,
  createSortedRowModel,
  metaHelper,
} from "@tanstack/react-table";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(), // if using client-side filtering
  // manualFiltering: true, // if using manual server-side filtering
  sortedRowModel: createSortedRowModel(), // if using client-side sorting
  // manualSorting: true, // if using manual server-side sorting
  filterFns: { fuzzy: fuzzyFilter },
  sortFns: { fuzzy: fuzzySort },
  filterMeta: metaHelper<FuzzyFilterMeta>(),
});

const table = useTable({
  features,
  columns,
  data,
});
```

> [!NOTE]
> The `filterFns` and `sortFns` registries above list only the custom `fuzzy` functions this guide uses. Spreading the entire built-in registries (`filterFns: { ...filterFns, fuzzy: fuzzyFilter }`) still works, but it puts every built-in function in your bundle. Register just the functions you use, or pass functions directly to the `filterFn` and `sortFn` column options with no registration.

## Fuzzy Filtering (React) Guide

Fuzzy filtering is a technique that allows you to filter data based on approximate matches. This can be useful when you want to search for data that is similar to a given value, rather than an exact match.

You can implement client-side fuzzy filtering by defining a custom filter function. This function should take in the row, columnId, and filter value, and return a boolean indicating whether the row should be included in the filtered data.

Fuzzy filtering is mostly used with global filtering, but you can also apply it to individual columns. We will discuss how to implement fuzzy filtering for both cases.

> [!NOTE]
> You will need to install the `@tanstack/match-sorter-utils` library to use fuzzy filtering.
> TanStack Match Sorter Utils is a fork of [match-sorter](https://github.com/kentcdodds/match-sorter) by Kent C. Dodds. It was forked to work better with TanStack Table's row by row filtering approach.

Using the match-sorter libraries is optional, but the TanStack Match Sorter Utils library provides a great way to both fuzzy filter and sort by the rank information it returns, so that rows can be sorted by their closest matches to the search query.

### Defining a Custom Fuzzy Filter Function

Here's an example of a custom fuzzy filter function. First, define the filter meta shape and a features type that includes it:

```typescript
import type { RankingInfo } from "@tanstack/match-sorter-utils";
import type { FilterFn, RowData, TableFeatures } from "@tanstack/react-table";

import { rankItem } from "@tanstack/match-sorter-utils";

interface FuzzyFilterMeta {
  itemRank?: RankingInfo;
}

// A features type that carries the filterMeta shape
type FuzzyFeatures = TableFeatures & { filterMeta: FuzzyFilterMeta };

const fuzzyFilter: FilterFn<FuzzyFeatures, RowData> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta?.({ itemRank });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};
```

In this function, we're using the `rankItem` function from the `@tanstack/match-sorter-utils` library to rank the item. We then store the ranking information in the filter meta of the row (the `addMeta` callback is optional, so call it with optional chaining), and return whether the item passed the ranking criteria.

To reference this filter function by the string name `'fuzzy'` and type the stored filter meta, register both in the `tableFeatures` call using the `filterFns` and `filterMeta` slots:

```typescript
import { tableFeatures, metaHelper } from "@tanstack/react-table";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { fuzzy: fuzzyFilter },
  sortFns: { fuzzy: fuzzySort },
  filterMeta: metaHelper<FuzzyFilterMeta>(),
});
```

No `declare module` augmentation is needed. The `filterFns` and `filterMeta` slots are scoped to this features object and only affect tables created with it.

### Using Fuzzy Filtering with Global Filtering

To use fuzzy filtering with global filtering, register the fuzzy filter function in the `filterFns` slot on `tableFeatures` and reference it in the `globalFilterFn` option of the table:

```typescript
import {
  useTable,
  tableFeatures,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  createFilteredRowModel,
  createSortedRowModel,
  metaHelper,
} from "@tanstack/react-table";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(), // needed if you want sorting with fuzzy rank
  filterFns: { fuzzy: fuzzyFilter },
  sortFns: { fuzzy: fuzzySort },
  filterMeta: metaHelper<FuzzyFilterMeta>(),
});

const table = useTable({
  features,
  columns,
  data,
  globalFilterFn: "fuzzy",
});
```

### Using Fuzzy Filtering with Column Filtering

To use fuzzy filtering with column filtering, register your fuzzy filter function in the `filterFns` slot on `tableFeatures` (as shown above). You can then specify the fuzzy filter by name in the `filterFn` option of the column definition:

```typescript
const column = [
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: "fullName",
    header: "Full Name",
    cell: (info) => info.getValue(),
    filterFn: "fuzzy", //using our custom fuzzy filter function
  },
  // other columns...
];
```

In this example, we're applying the fuzzy filter to a column that combines the firstName and lastName fields of the data.

#### Sorting with Fuzzy Filtering

When using fuzzy filtering with column filtering, you might also want to sort the data based on the ranking information. You can do this by defining a custom sorting function:

```typescript
import type { SortFn } from "@tanstack/react-table";

import { compareItems } from "@tanstack/match-sorter-utils";
import { sortFn_alphanumeric } from "@tanstack/react-table";

const fuzzySort: SortFn<FuzzyFeatures, Person> = (rowA, rowB, columnId) => {
  let dir = 0;

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId].itemRank!,
      rowB.columnFiltersMeta[columnId].itemRank!,
    );
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortFn_alphanumeric(rowA, rowB, columnId) : dir;
};
```

In this function, we're comparing the ranking information of the two rows. If the ranks are equal, we fall back to alphanumeric sorting.

Register `fuzzySort` in the `sortFns` slot on `tableFeatures` (as shown in the setup section above) and reference it by name in the column definition:

```typescript
{
  accessorFn: row => `${row.firstName} ${row.lastName}`,
  id: 'fullName',
  header: 'Full Name',
  cell: info => info.getValue(),
  filterFn: 'fuzzy', // using our custom fuzzy filter function (registered in features)
  sortFn: 'fuzzy', // using our custom fuzzy sort function (registered in features)
}
```

You can also pass `fuzzySort` directly as a function to the `sortFn` column option instead of a string reference, which skips the registration step.
---

title: Aggregation (React) Guide
---

## Examples

- [Aggregation](../examples/aggregation)
- [Grouped Aggregation](../examples/grouped-aggregation)

Aggregation is independent from column grouping. Register `rowAggregationFeature`
whenever columns calculate totals or aggregated values. Add
`columnGroupingFeature` separately only when the table also groups rows.

## Aggregation Setup

Register only the built-in functions referenced by name. Passing a definition
directly to a column does not require a registry entry.

```tsx
import {
  rowAggregationFeature,
  aggregationFn_count,
  aggregationFn_extent,
  aggregationFn_mean,
  aggregationFn_sum,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

const features = tableFeatures({
  rowAggregationFeature,
  aggregationFns: {
    count: aggregationFn_count,
    extent: aggregationFn_extent,
    mean: aggregationFn_mean,
    sum: aggregationFn_sum,
  },
});

const table = useTable({
  features,
  columns,
  data,
});
```

The aggregation feature does not require a grouped row model. This makes grand
totals and custom row-subset totals available in otherwise ordinary tables.

The full `aggregationFns` registry remains available for compatibility, but it
bundles every built-in. Tables using `stockFeatures` already include
`rowAggregationFeature`; they still need the definitions that named column
options should resolve to.

## Column Aggregations

A column accepts one aggregation or an array. A single entry returns a scalar;
multiple entries return an object keyed by the aggregation name or descriptor
`id`.

```ts
columnHelper.accessor("amount", {
  aggregationFn: "sum",
});

columnHelper.accessor("score", {
  aggregationFn: ["count", "mean", { id: "range", aggregationFn: "extent" }],
});
```

String values remain backward-compatible. Use descriptors when a result needs
a stable custom key or options.

A scalar `aggregationFn` can be a registered name, `'auto'`, or an inline
definition. Every entry in an aggregation array needs a unique stable id.
Duplicate ids, missing descriptor ids, and unregistered names warn in
development and preserve the affected key with an `undefined` value.

Multiple aggregations can be read with a typed result:

```ts
const scoreColumn = columnHelper.accessor("score", {
  aggregationFn: ["count", "mean", { id: "range", aggregationFn: "extent" }],
  footer: ({ column }) => {
    const result = column.getAggregationValue<{
      count: number;
      mean: number | undefined;
      range: [number | undefined, number | undefined];
    }>();

    return `${result.count} values; mean ${result.mean}; range ${result.range}`;
  },
});
```

## Grand Totals and Row Subsets

Call `column.getAggregationValue()` without arguments to aggregate the default
pre-grouped row model. Filtering is included; grouping, sorting, expansion, and
pagination do not change that default total.

```ts
footer: ({ column }) => column.getAggregationValue<number>().toLocaleString();
```

Pass one options object with rows from any row model to choose a different set:

```ts
column.getAggregationValue({ rows: table.getCoreRowModel().rows });
column.getAggregationValue({ rows: table.getRowModel().rows });
column.getAggregationValue({ rows: table.getFilteredSelectedRowModel().rows });
column.getAggregationValue({ rows: table.getCoreRowModel().rows.slice(0, 3) });
column.getAggregationValue({ rows: table.getCoreRowModel().rows, maxDepth: 1 });
```

Depth is relative to the supplied row array. `0` selects those roots, `1`
selects their direct sub-rows, and so on. Selection returns a unique frontier:
a branch that ends before the maximum depth contributes its deepest available
row. `Infinity` selects terminal rows.

Configure `maxAggregationDepth` on the column for cached default calls (it
defaults to `0`), or pass `maxDepth` in the options object as an explicit
override. Every aggregation configured on the column receives the same
selected rows. Explicit row calls are recomputed each time; the default call is
cached against its row model, depth, registry, and column aggregation option.

`table.getMaxSubRowDepth()` returns the deepest structural depth in the core
row model. To stop one level before the deepest sub-row frontier:

```ts
const maxDepth = Math.max(0, table.getMaxSubRowDepth() - 1);
column.getAggregationValue({
  rows: table.getCoreRowModel().rows,
  maxDepth,
});
```

## Grouped Aggregation

Grouped aggregation composes two independent features. Register both, add the
grouped row-model slot, and configure aggregation functions on the columns that
should produce grouped values.

```ts
const features = tableFeatures({
  rowAggregationFeature,
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  aggregationFns: { sum: aggregationFn_sum },
});

columnHelper.accessor("visits", {
  aggregationFn: "sum",
  aggregatedCell: ({ getValue }) => getValue<number>().toLocaleString(),
  footer: ({ column }) => column.getAggregationValue<number>().toLocaleString(),
});
```

The `aggregatedCell` column option renders aggregate values on synthetic
grouped rows. Use `cell.getIsAggregated()` to identify a grouped aggregate
cell. Footer rendering uses the adapter's normal footer renderer. Grouping-only
tables do not expose `cell.getIsAggregated()`; it belongs to
`rowAggregationFeature`.

## Custom Aggregation Definitions

Custom aggregations are context-based definitions. `rows` contains the unique
frontier selected at `maxDepth`, and `getValue(row)` reads the current column's
value.

```ts
const joined = constructAggregationFn<any, any, string, string>({
  aggregate: ({ rows, getValue }) =>
    rows
      .map((row) => getValue(row))
      .filter(Boolean)
      .join(", "),
});
```

The context also includes `column`, `columnId`, `maxDepth`, and `table`. During
grouped aggregation it includes `groupingRow` and `subRows`; root and
caller-supplied-row aggregation omit those properties. The grouping depth is
`groupingRow.depth`. `subRows` contains the immediate rows at that grouping
level, so an aggregation can explicitly choose immediate sub-rows instead of
the depth-selected `rows`:

```ts
const subRowCount = constructAggregationFn<any, any, unknown, number>({
  aggregate: ({ subRows, rows }) => (subRows ?? rows).length,
});
```

At the terminal grouping level, `subRows` contains direct data rows. At a
nested level, it contains the immediate synthetic sub-row groups. All built-in
aggregation definitions consume the same depth-selected `rows`; `subRows`
remains available when a custom definition intentionally needs the grouping
row's immediate structural children.

For a result that can be combined more efficiently from already-computed
sub-row results, provide a `merge` function:

```ts
const sum = constructAggregationFn<any, any, unknown, number>({
  aggregate: ({ rows, getValue }) =>
    rows.reduce((total, row) => {
      const value = getValue(row);
      return total + (typeof value === "number" ? value : 0);
    }, 0),
  merge: ({ subRowResults }) => subRowResults.reduce((total, value) => total + value, 0),
});
```

For `merge`, `subRowResults[i]` is the aggregation result previously computed
for `subRows[i]`. Without `merge`, nested grouping calls `aggregate` with both
the group's depth-selected `rows` and its immediate `subRows`. This
context-based form replaces the previous callable aggregation signature and its
`fromRows` and `resolveDataValue` properties while preserving access to both
row sets.

## Providing Server or External Values

A column can handle aggregation-value requests before local calculation:

```ts
const amountColumn = columnHelper.accessor("amount", {
  aggregationFn: "sum",
  getAggregationValue: ({ rows }) => {
    if (rows !== undefined) return undefined; // use local fallback for overrides
    return { value: serverTotals.amount };
  },
});
```

Returning `{ value }` marks the request as handled, including
`{ value: undefined }`. Returning `undefined` uses the local fallback. Put the
same provider on `defaultColumn` to share it across columns.

Set `manualAggregation: true` to disable the local fallback for
`column.getAggregationValue()`. This is separate from `manualGrouping`, which
controls whether the grouped row model runs. See the
[Client-Side vs Server-Side Guide](../../../guide/client-side-vs-server-side)
for guidance on choosing where the full data pipeline should run.

## Built-in Definitions

- `sum`: sums numeric values; non-numbers contribute zero.
- `count`: counts rows.
- `min` / `max`: find numeric or Date bounds.
- `extent`: returns `[min, max]`; an empty input returns
  `[undefined, undefined]`.
- `mean`: averages numeric and number-like non-null values.
- `median`: requires every row value to be a number.
- `unique` / `uniqueCount`: use JavaScript `Set` semantics.
- `first` / `last`: return the positional value, including a nullish value.

`aggregationFn: 'auto'` inspects the first core row value. Numbers resolve to a
registered `sum`, Dates resolve to a registered `extent`, and other values do
not resolve an aggregation.

## Web Workers

Worker-backed grouped row models eagerly compute explicitly configured grouped
aggregates in the worker. `column.getAggregationValue()` still executes its
final total on the main thread over the selected row model. Aggregation results
crossing the worker boundary must be structured-cloneable. See the
[Worker Row Models Guide](../../../guide/worker-row-models) for setup and
limitations.
---

title: Grouping (React) Guide
---

## Examples

Want to skip to the implementation? Check out these React examples:

- [Grouping](../examples/grouping)

> [!NOTE]
> `columnGroupingFeature` and `rowAggregationFeature` are now separate features. Register either one independently, or register both when grouped rows should also calculate aggregate values. See the [Aggregation Guide](./aggregation) for aggregation setup.

### Grouping Setup

Here's how you set up your table to use grouping features. Adding the grouping feature enables the related APIs. If you use client-side grouping, also set up `groupedRowModel` after its feature, since row model slots are type-checked.

```tsx
import {
  useTable,
  tableFeatures,
  columnGroupingFeature,
  createGroupedRowModel,
} from "@tanstack/react-table";

const features = tableFeatures({
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(), // if using client-side grouping
  // manualGrouping: true, // if using manual server-side grouping
});

const table = useTable({
  features,
  columns,
  data,
});
```

## Grouping (React) Guide

Grouping in TanStack table is a feature that applies to columns and allows you to categorize and organize the table rows based on specific columns. This can be useful in cases where you have a large amount of data and you want to group them together based on certain criteria.

Grouping can also affect column order. There are 3 table features that can reorder columns, which happen in the following order:

1. [Column Pinning](./column-pinning) - If pinning, columns are split into start, center (unpinned), and end pinned columns.
2. Manual [Column Ordering](./column-ordering) - A manually specified column order is applied.
3. **Grouping** - If grouping is enabled, a grouping state is active, and `tableOptions.groupedColumnMode` is set to `'reorder' | 'remove'`, then the grouped columns are reordered to the start of the column flow.

### Client-Side vs Server-Side Grouping

Grouping should operate over the complete dataset when its groups are meant to describe all rows. Use client-side grouping when the browser has the complete dataset. Use manual server-side grouping when the server returns only a page or another subset, or when the server needs to perform grouping and aggregation.

See the [Client-Side vs Server-Side Guide](../../../guide/client-side-vs-server-side) for the full decision framework, performance factors, and guidance for combining data operations.

The client-side grouped row model invokes the page-index and expanded-state auto-reset hooks when its inputs change. Whether those states reset depends on the `autoResetPageIndex`, `autoResetExpanded`, `autoResetAll`, `manualPagination`, and `manualExpanding` options. If grouping is manual and this row model is omitted or bypassed, a grouping state change does not invoke those hooks, so reset dependent server-side state in the grouping change handler when needed.

### Client-Side Grouping

To use the grouping feature, add the `columnGroupingFeature` and the `groupedRowModel` factory to your features. The grouped row model is responsible for grouping the rows based on the grouping state.

```tsx
import {
  useTable,
  tableFeatures,
  columnGroupingFeature,
  createGroupedRowModel,
} from "@tanstack/react-table";

const features = tableFeatures({
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
});

const table = useTable({
  features,
  // other options...
});
```

When grouping state is active, the table will add matching rows as subRows to the grouped row. The grouped row will be added to the table rows at the same index as the first matching row. The matching rows will be removed from the table rows.
To allow the user to expand and collapse the grouped rows, you can use the expanding feature.

```tsx
const features = tableFeatures({
  columnGroupingFeature,
  rowExpandingFeature,
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
});

const table = useTable({
  features,
  // other options...
});
```

### Grouping state

The grouping state is an array of strings, where each string is the ID of a column to group by. The order of the strings in the array determines the order of the grouping. For example, if the grouping state is ['column1', 'column2'], then the table will first group by column1, and then within each group, it will group by column2. You can control the grouping state using the setGrouping function:

```tsx
table.setGrouping(["column1", "column2"]);
```

You can also reset the grouping state to its initial state using the resetGrouping function:

```tsx
table.resetGrouping();
```

By default, when a column is grouped, it is moved to the start of the table. You can control this behavior using the groupedColumnMode option. If you set it to 'reorder', then the grouped columns will be moved to the start of the table. If you set it to 'remove', then the grouped columns will be removed from the table. If you set it to false, then the grouped columns will not be moved or removed.

```tsx
const table = useTable({
  features,
  // other options...
  groupedColumnMode: "reorder",
});
```

### Manual Grouping

If you are doing server-side grouping, you can enable manual grouping using the manualGrouping option. When this option is set to true, the table will not automatically group rows using getGroupedRowModel() and instead will expect you to group the rows before passing them to the table.

```tsx
const features = tableFeatures({ columnGroupingFeature });

const table = useTable({
  features,
  // other options...
  manualGrouping: true,
});
```

> [!NOTE]
> There are not currently many known easy ways to do server-side grouping with TanStack Table. You will need to do lots of custom cell rendering to make this work.

### Controlled Grouping State

If you need access to the grouping state in other parts of your application, you can own the `grouping` state slice yourself. The recommended way in v9 is an external atom passed through the `atoms` table option. Atoms preserve fine-grained subscriptions, and the grouping value can be read anywhere in your app (such as in a query key for server-side grouping) without forcing the component that owns the table to re-render.

```tsx
import type { GroupingState } from "@tanstack/react-table";

import { useCreateAtom, useSelector } from "@tanstack/react-store";

const groupingAtom = useCreateAtom<GroupingState>([]);

// subscribe to the atom wherever you need the value
const grouping = useSelector(groupingAtom);

const table = useTable({
  features,
  // other options...
  atoms: {
    grouping: groupingAtom, // grouping APIs now update groupingAtom
  },
});
```

Alternatively, the v8-style `state.grouping` plus `onGroupingChange` pattern is still supported. It can be convenient for simple integrations or when migrating v8 code, but it is less fine-grained than external atoms. See the [Table State Guide](./table-state) for a deeper comparison.

```tsx
const [grouping, setGrouping] = useState<GroupingState>([]);

const table = useTable({
  features,
  // other options...
  state: {
    grouping,
  },
  onGroupingChange: setGrouping,
});
```

### Grouping APIs

Columns expose grouping APIs for toggling grouping and building grouping UI:

```tsx
column.toggleGrouping();
column.getToggleGroupingHandler();
column.getCanGroup();
column.getIsGrouped();
column.getGroupedIndex();
```

Rows expose grouping helpers for grouped row rendering:

```tsx
row.getIsGrouped();
row.getGroupingValue(columnId);
row.groupingColumnId;
row.groupingValue;
```

Cells expose grouping and placeholder helpers:

```tsx
cell.getIsGrouped();
cell.getIsPlaceholder();
```

The table instance exposes grouped and pre-grouped row models:

```tsx
table.getGroupedRowModel();
table.getPreGroupedRowModel();
```

Use `table.setGrouping` and `table.resetGrouping` to update the grouping state directly.
---

title: Expanding (React) Guide
---

## Examples

Want to skip to the implementation? Check out these React examples:

- [Expanding](../examples/expanding)

### Expanding Setup

Here's how you set up your table to use expanding features. Adding the expanding feature enables the related APIs. If you use client-side expanding, also set up `expandedRowModel` after its feature, since row model slots are type-checked.

```tsx
import {
  useTable,
  tableFeatures,
  rowExpandingFeature,
  createExpandedRowModel,
} from "@tanstack/react-table";

const features = tableFeatures({
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(), // if using client-side expanding
  // manualExpanding: true, // if using manual server-side expanding
});

const table = useTable({
  features,
  columns,
  data,
});
```

## Expanding Feature (React) Guide

Expanding is a feature that allows you to show and hide additional rows of data related to a specific row. This can be useful in cases where you have hierarchical data and you want to allow users to drill down into the data from a higher level. Or it can be useful for showing additional information related to a row.

### Different use cases for Expanding Features

There are multiple use cases for expanding features in TanStack Table that will be discussed below.

1. Expanding sub-rows (child rows, aggregate rows, etc.)
2. Expanding custom UI (detail panels, sub-tables, etc.)

### Enable Client-Side Expanding

To use the client-side expanding features, add the `rowExpandingFeature` and the `expandedRowModel` factory to your features:

```ts
import {
  useTable,
  tableFeatures,
  rowExpandingFeature,
  createExpandedRowModel,
} from "@tanstack/react-table";

const features = tableFeatures({
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
});

const table = useTable({
  features,
  // other options...
});
```

Expanded data can either contain table rows or any other data you want to display. We will discuss how to handle both cases in this guide.

### Table rows as expanded data

Expanded rows are child rows that inherit the same column structure as their parent rows. If your data object already includes expanded row data, use the `getSubRows` function to specify these child rows. If your data object does not contain expanded row data, it can be treated as custom expanded data, which is discussed in the next section.

For example, if you have a data object like this:

```ts
type Person = {
  id: number;
  name: string;
  age: number;
  children?: Person[] | undefined;
};

const data: Person[] = [
  {
    id: 1,
    name: "John",
    age: 30,
    children: [
      { id: 2, name: "Jane", age: 5 },
      { id: 5, name: "Jim", age: 10 },
    ],
  },
  {
    id: 3,
    name: "Doe",
    age: 40,
    children: [{ id: 4, name: "Alice", age: 10 }],
  },
];
```

Then you can use the getSubRows function to return the children array in each row as expanded rows. The table instance will now understand where to look for the sub rows on each row.

```ts
const table = useTable({
  features,
  getSubRows: (row) => row.children, // return the children array as sub-rows
  // other options...
});
```

> [!NOTE]
> You can have a complicated `getSubRows` function, but keep in mind that it will run for every row and every sub-row. This can be expensive if the function is not optimized. Async functions are not supported.

### Custom Expanding UI

In some cases, you may wish to show extra details or information, which may or may not be part of your table data object, such as expanded data for rows. This kind of expanding row UI has gone by many names over the years including "expandable rows", "detail panels", "sub-components", etc.

By default, the `row.getCanExpand()` row instance API will return false unless it finds `subRows` on a row. This can be overridden by implementing your own `getRowCanExpand` function in the table instance options.

```tsx
import { Fragment } from 'react'

//...
const table = useTable({
  features,
  getRowCanExpand: (row) => true, // Add your logic to determine if a row can be expanded. True means all rows include expanded data
  // other options...
})
//...
<tbody>
  {table.getRowModel().rows.map((row) => (
    <Fragment key={row.id}>
     {/* Normal row UI */}
      <tr>
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id}>
            <table.FlexRender cell={cell} />
          </td>
        ))}
      </tr>
      {/* If the row is expanded, render the expanded UI as a separate row with a single cell that spans the width of the table */}
      {row.getIsExpanded() && (
        <tr>
          {/* span however many columns the expanded data needs if it does not share the parent row's columns */}
          <td colSpan={row.getAllCells().length}>
            {/* Your custom UI goes here */}
          </td>
        </tr>
      )}
    </Fragment>
  ))}
</tbody>
//...
```

### Expanded rows state

If you need access to the expanded state of the rows in other parts of your application, you can own the `expanded` state slice yourself. The recommended way in v9 is an external atom passed through the `atoms` table option. Atoms preserve fine-grained subscriptions, and the expanded value can be read anywhere in your app without forcing the component that owns the table to re-render.

```ts
import { useCreateAtom, useSelector } from "@tanstack/react-store";

const expandedAtom = useCreateAtom<ExpandedState>({});

// subscribe to the atom wherever you need the value
const expanded = useSelector(expandedAtom);

const table = useTable({
  features,
  // other options...
  atoms: {
    expanded: expandedAtom, // expanding APIs now update expandedAtom
  },
});
```

Alternatively, the v8-style `state.expanded` plus `onExpandedChange` pattern is still supported. It can be convenient for simple integrations or when migrating v8 code, but it is less fine-grained than external atoms. See the [Table State Guide](./table-state) for a deeper comparison.

```ts
const [expanded, setExpanded] = useState<ExpandedState>({});

const table = useTable({
  features,
  // other options...
  state: {
    expanded,
  },
  onExpandedChange: setExpanded,
});
```

The ExpandedState type is defined as follows:

```ts
type ExpandedState = true | Record<string, boolean>;
```

If the ExpandedState is true, it means all rows are expanded. If it's a record, only the rows whose IDs are present as keys in the record and have a value of true are expanded. For example, if the expanded state is { row1: true, row2: false }, it means the row with ID row1 is expanded and the row with ID row2 is not expanded. This state is used by the table to determine which rows are expanded and should display their subRows, if any.

### UI toggling handler for expanded rows

TanStack table will not add a toggling handler UI for expanded data to your table. You should manually add it within each row's UI to allow users to expand and collapse the row. For example, you can add a button UI within the column definition.

```tsx
const columns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "age",
    header: "Age",
  },
  {
    header: "Children",
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <button onClick={row.getToggleExpandedHandler()} style={{ cursor: "pointer" }}>
          {row.getIsExpanded() ? "👇" : "👉"}
        </button>
      ) : (
        ""
      );
    },
  },
];
```

### Expanding APIs

Rows expose helpers for reading and toggling their expanded state:

```tsx
row.getCanExpand();
row.getIsExpanded();
row.getIsAllParentsExpanded();
row.getToggleExpandedHandler();
row.toggleExpanded();
```

The table instance exposes helpers for reading and toggling aggregate expanded state:

```tsx
table.getCanSomeRowsExpand();
table.getIsAllRowsExpanded();
table.getIsSomeRowsExpanded();
table.getExpandedDepth();
table.getToggleAllRowsExpandedHandler();
table.toggleAllRowsExpanded();
table.resetExpanded();
```

Use `table.setExpanded` to update the expanded state directly. `table.resetExpanded()` resets to `initialState.expanded`, while `table.resetExpanded(true)` clears the expanded state.

### Filtering Expanded Rows

By default, filtering starts from the parent rows and moves downwards. If a parent row is excluded by the filter, all of its child rows are excluded too. You can change this with the `filterFromLeafRows` option. When it is enabled, filtering starts from the leaf (child) rows and moves upwards, so a parent row is included in the filtered results as long as at least one of its child or grandchild rows meets the filter criteria. The `maxLeafRowFilterDepth` option sets the maximum depth of child rows that the filter considers.

```ts
const features = tableFeatures({
  columnFilteringFeature,
  rowExpandingFeature,
  filteredRowModel: createFilteredRowModel(),
  expandedRowModel: createExpandedRowModel(),
  filterFns,
});

//...
const table = useTable({
  features,
  getSubRows: (row) => row.subRows,
  filterFromLeafRows: true, // search through the expanded rows
  maxLeafRowFilterDepth: 1, // limit the depth of the expanded rows that are searched
  // other options...
});
```

### Paginating Expanded Rows

By default, expanded rows are paginated along with the rest of the table (which means expanded rows may span multiple pages). If you want to disable this behavior (which means expanded rows will always render on their parent's page. This also means more rows will be rendered than the set page size) you can use the `paginateExpandedRows` option.

```ts
const table = useTable({
  features,
  // other options...
  paginateExpandedRows: false,
});
```

### Pinning Expanded Rows

Pinning expanded rows works the same way as pinning regular rows. You can pin expanded rows to the top or bottom of the table. Please refer to the [Row Pinning Guide](./row-pinning) for more information on row pinning.

### Sorting Expanded Rows

By default, expanded rows are sorted along with the rest of the table.

### Auto Reset Expanded State

If you are also using the grouping feature, the `expanded` state is automatically reset whenever the grouped row model recomputes, such as when the `data` or the grouping state changes. This default is automatically disabled when `manualExpanding` is `true`, but it can be overridden by explicitly assigning a boolean value to the `autoResetExpanded` table option. There is also a global `autoResetAll` table option that disables (or enables) every auto-reset behavior at once.

A common reason to set `autoResetExpanded: false` is editing data while viewing the table (for example, inline cell editing). Every edit updates `data`, which recomputes the row models and would otherwise collapse the user's expanded rows. If you also use the pagination feature, pair it with `autoResetPageIndex: false` so the current page is kept as well.

```ts
const table = useTable({
  features,
  // other options...
  autoResetExpanded: false, // keep expanded state when data changes
  // autoResetAll: false, // or turn off all auto resets at once
});
```

### Manual Expanding (server-side)

If you are doing server-side expansion, you can enable manual row expansion by setting the manualExpanding option to true. This means that the `getExpandedRowModel` will not be used to expand rows and you would be expected to perform the expansion in your own data model.

```ts
const features = tableFeatures({ rowExpandingFeature });

const table = useTable({
  features,
  // other options...
  manualExpanding: true,
});
```

---

title: Pagination (React) Guide
---

## Examples

Want to skip to the implementation? Check out these React examples:

- [Pagination](../examples/pagination)

### Pagination Setup

Here's how you set up your table to use pagination features. Adding the pagination feature enables the related APIs. If you use client-side pagination, also set up `paginatedRowModel` after its feature, since row model slots are type-checked.

```tsx
import {
  useTable,
  tableFeatures,
  rowPaginationFeature,
  createPaginatedRowModel,
} from "@tanstack/react-table";

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(), // if using client-side pagination
  // manualPagination: true, // if using manual server-side pagination
});

const table = useTable({
  features,
  columns,
  data,
});
```

## Pagination (React) Guide

TanStack Table has great support for both client-side and server-side pagination. This guide will walk you through the different ways to implement pagination in your table.

### Client-Side Pagination

Using client-side pagination means that the `data` that you fetch will contain **_ALL_** of the rows for the table, and the table instance will handle pagination logic in the front-end.

#### Should You Use Client-Side Pagination?

Client-side pagination is usually the simplest option when the browser can fetch and retain the complete dataset. Use server-side pagination when the full dataset would be too expensive to query, transfer, or store in the browser.

Row count alone does not decide the boundary. See the [Client-Side vs Server-Side Guide](../../../guide/client-side-vs-server-side) for the full decision framework, performance factors, and guidance for keeping filtering and sorting consistent with pagination.

#### Should You Use Virtualization Instead?

Virtualization (or windowing) reduces rendering work by mounting only the visible rows, but the virtualized data still exists in the browser. It can complement client-side or server-side pagination, but it does not replace server-side processing when the complete dataset is too large to load.

See the [Client-Side vs Server-Side Guide](../../../guide/client-side-vs-server-side#rendering-is-a-separate-decision) for that distinction, or [TanStack Virtual](https://tanstack.com/virtual/latest) for virtualization APIs.

#### Pagination Row Model

If you want to take advantage of the built-in client-side pagination in TanStack Table, add the `rowPaginationFeature` and the `paginatedRowModel` factory to your features:

```tsx
import {
  useTable,
  tableFeatures,
  rowPaginationFeature,
  createPaginatedRowModel,
} from "@tanstack/react-table";

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const table = useTable({
  features,
  columns,
  data,
});
```

### Manual Server-Side Pagination

If you decide that you need to use server-side pagination, here is how you can implement it.

No pagination row model is needed for server-side pagination, but if you have provided it for other tables that do need it in a shared component, you can still turn off the client-side pagination by setting the `manualPagination` option to `true`. Setting the `manualPagination` option to `true` will tell the table instance to use the `table.getPrePaginatedRowModel` row model under the hood, and it will make the table instance assume that the `data` that you pass in is already paginated.

#### Page Count and Row Count

The table instance will have no way of knowing how many rows/pages there are in total in your back-end unless you tell it. Provide either the `rowCount` or `pageCount` table option to let the table instance know how many pages there are in total. If you provide a `rowCount`, the table instance will calculate the `pageCount` internally from `rowCount` and `pageSize`. Otherwise, you can directly provide the `pageCount` if you already have it. If you don't know the page count, pass `-1` for `pageCount`. In that case, `getCanNextPage()` returns `true` because the table cannot detect the end, `getCanPreviousPage()` depends on the current `pageIndex`, and `getCanLastPage()` returns `false` because no finite last page is known.

```tsx
import { useTable, tableFeatures, rowPaginationFeature } from "@tanstack/react-table";

const features = tableFeatures({ rowPaginationFeature });

const table = useTable({
  features,
  columns,
  data,
  manualPagination: true, // turn off client-side pagination
  rowCount: dataQuery.data?.rowCount, // pass in the total row count so the table knows how many pages there are (pageCount calculated internally if not provided)
  // pageCount: dataQuery.data?.pageCount, // alternatively directly pass in pageCount instead of rowCount
});
```

> [!NOTE]
> Setting the `manualPagination` option to `true` will make the table instance assume that the `data` that you pass in is already paginated.

#### Using TanStack Query

TanStack Query can own the request lifecycle while TanStack Table owns the controlled pagination state. See the complete [With TanStack Query example](../examples/with-tanstack-query), which includes both patterns below.

##### Page-Index Pagination with `useQuery`

Include the pagination state in the query key, return the requested rows plus a total `rowCount`, and pass both to the table:

```tsx
const dataQuery = useQuery({
  queryKey: ["people", "offset", pagination, sorting, globalFilter],
  queryFn: () => fetchPeople({ pagination, sorting, globalFilter }),
  placeholderData: keepPreviousData,
});

const table = useTable(
  {
    features,
    columns,
    data: dataQuery.data?.rows ?? [],
    rowCount: dataQuery.data?.rowCount,
    state: { pagination, sorting, globalFilter },
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  },
  (state) => state,
);
```

This supports page counts, page-number navigation, and `lastPage()` because the total row count is known.

##### Cursor-Based Pagination with `useInfiniteQuery`

A cursor API usually returns the current rows, an opaque `nextCursor`, and whether another page exists. The cursor can be the last row ID when IDs are unique and the server's ordering is stable:

```tsx
const dataQuery = useInfiniteQuery({
  queryKey: ["people", "cursor", pagination.pageSize, sorting, globalFilter],
  queryFn: ({ pageParam }) =>
    fetchPeople({
      cursor: pageParam,
      pageSize: pagination.pageSize,
      sorting,
      globalFilter,
    }),
  initialPageParam: null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

const currentPage = dataQuery.data?.pages[pagination.pageIndex];
const hasCachedNextPage = Boolean(dataQuery.data?.pages[pagination.pageIndex + 1]);
const canNextPage = hasCachedNextPage || Boolean(currentPage?.hasNextPage);

const table = useTable(
  {
    features,
    columns,
    data: currentPage?.rows ?? [],
    pageCount: -1, // the cursor API does not expose a total
    state: { pagination, sorting, globalFilter },
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  },
  (state) => state,
);

async function goToNextPage() {
  const nextPageIndex = pagination.pageIndex + 1;

  if (!dataQuery.data?.pages[nextPageIndex]) {
    const result = await dataQuery.fetchNextPage();
    if (!result.data?.pages[nextPageIndex]) return;
  }

  table.nextPage();
}
```

Use `canNextPage` for the Next button because `getCanNextPage()` cannot know when a `pageCount` of `-1` has reached the end. Previously fetched pages remain available for backward navigation. A cursor API has no known last page, so `getCanLastPage()` returns `false` and the Last button should stay disabled. Reset `pageIndex` to `0` whenever sorting, filtering, or page size changes so the new query starts from its initial cursor.

### Pagination State

Whether or not you are using client-side or manual server-side pagination, you can use the built-in `pagination` state and APIs.

The `pagination` state is an object that contains the following properties:

- `pageIndex`: The current page index (zero-based).
- `pageSize`: The current page size.

For reactive reads that should re-render your UI, use `table.state.pagination`. In event handlers, you can read the current snapshot with `table.atoms.pagination.get()`, but this read does not subscribe the component to future changes.

If you need access to the `pagination` state outside of the table (a server-side query key is the most common case), you can own the slice yourself. The recommended way in v9 is an external atom passed through the `atoms` table option. Atoms preserve fine-grained subscriptions, and the pagination value can be used in a query key without forcing the component that owns the table to re-render.

```tsx
import { useCreateAtom, useSelector } from "@tanstack/react-store";
import {
  useTable,
  tableFeatures,
  rowPaginationFeature,
  createPaginatedRowModel,
  type PaginationState,
} from "@tanstack/react-table";

const features = tableFeatures({ rowPaginationFeature });

const paginationAtom = useCreateAtom<PaginationState>({
  pageIndex: 0, // initial page index
  pageSize: 10, // default page size
});

// subscribe to the atom wherever you need the value (e.g. for a query key)
const pagination = useSelector(paginationAtom);

const table = useTable({
  features,
  columns,
  data,
  atoms: {
    pagination: paginationAtom, // table pagination APIs now update paginationAtom
  },
});
```

Alternatively, the v8-style `state.pagination` plus `onPaginationChange` pattern is still supported. It can be convenient for simple integrations or when migrating v8 code, but it is less fine-grained than external atoms. See the [Table State Guide](./table-state) for a deeper comparison.

```tsx
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0, // initial page index
  pageSize: 10, // default page size
});

const table = useTable({
  features,
  columns,
  data,
  onPaginationChange: setPagination,
  state: {
    pagination,
  },
});
```

Alternatively, if you have no need for managing the `pagination` state in your own scope, but you need to set different initial values for the `pageIndex` and `pageSize`, you can use the `initialState` option.

```tsx
const table = useTable({
  features,
  columns,
  data,
  initialState: {
    pagination: {
      pageIndex: 2, // custom initial page index
      pageSize: 25, // custom default page size
    },
  },
});
```

> [!NOTE]
> Do NOT provide the `pagination` slice in more than one of the `atoms`, `state`, and `initialState` options. Controlled values (`atoms` or `state`) will overwrite `initialState`. Only use one of them.

### Pagination Options

Besides the `manualPagination`, `pageCount`, and `rowCount` options which are useful for manual server-side pagination (and discussed [above](#manual-server-side-pagination)), there is one other table option that is useful to understand.

#### Auto Reset Page Index

By default, `pageIndex` is reset to `0` whenever the client-side row models recompute, such as when the `data` is updated, filters change, sorting changes, or grouping changes. This behavior is automatically disabled when `manualPagination` is `true`, but it can be overridden by explicitly assigning a boolean value to the `autoResetPageIndex` table option. There is also a global `autoResetAll` table option that disables (or enables) every auto-reset behavior at once.

> [!NOTE]
> Automatic resets run only when an included client-side row model that triggers them recomputes. If a manual server-side table omits the filtered, sorted, grouped, or other relevant row model, changing that controlled state does not trigger a page-index reset, even when `autoResetPageIndex` or `autoResetAll` is `true`. Reset `pageIndex` yourself in the corresponding change handler.

```tsx
const table = useTable({
  features,
  columns,
  data,
  autoResetPageIndex: false, // turn off auto reset of pageIndex
  // autoResetAll: false, // or turn off all auto resets at once
});
```

A common reason to set `autoResetPageIndex: false` is editing data while viewing the table (for example, inline cell editing). Every edit updates `data`, which recomputes the row models and would otherwise snap the user back to the first page. Setting the option to a static `false` keeps the current page when the row model recomputes. If you also use the expanding feature, pair it with `autoResetExpanded: false` so expanded rows do not collapse on edits.

Be aware, however, that if you turn off `autoResetPageIndex`, you may need to add some logic to handle resetting the `pageIndex` yourself to avoid showing empty pages.

### Pagination APIs

There are several pagination table instance APIs that are useful for hooking up your pagination UI components.

#### Pagination Button APIs

- `getCanPreviousPage`: Useful for disabling the "previous page" button when on the first page.
- `getCanNextPage`: Useful for disabling the "next page" button when there are no more pages.
- `getCanLastPage`: Useful for disabling the "last page" button when no finite last page is known.
- `previousPage`: Useful for going to the previous page. (Button click handler)
- `nextPage`: Useful for going to the next page. (Button click handler)
- `firstPage`: Useful for going to the first page. (Button click handler)
- `lastPage`: Useful for going to the last page. (Button click handler)
- `setPageIndex`: Useful for a "go to page" input.
- `resetPageIndex`: Useful for resetting the table state to the original page index.
- `setPageSize`: Useful for a "page size" input/select.
- `resetPageSize`: Useful for resetting the table state to the original page size.
- `setPagination`: Useful for setting all of the pagination state at once.
- `resetPagination`: Useful for resetting the table state to the original pagination state.

> [!NOTE]
> These pagination APIs are available when using `rowPaginationFeature`.

```tsx
<Button
  onClick={() => table.firstPage()}
  disabled={!table.getCanPreviousPage()}
>
  {'<<'}
</Button>
<Button
  onClick={() => table.previousPage()}
  disabled={!table.getCanPreviousPage()}
>
  {'<'}
</Button>
<Button
  onClick={() => table.nextPage()}
  disabled={!table.getCanNextPage()}
>
  {'>'}
</Button>
<Button
  onClick={() => table.lastPage()}
  disabled={!table.getCanLastPage()}
>
  {'>>'}
</Button>
<select
  value={table.state.pagination.pageSize}
  onChange={e => {
    table.setPageSize(Number(e.target.value))
  }}
>
  {[10, 20, 30, 40, 50].map(pageSize => (
    <option key={pageSize} value={pageSize}>
      {pageSize}
    </option>
  ))}
</select>
```

#### Pagination Info APIs

- `getPageCount`: Useful for showing the total number of pages.
- `getRowCount`: Useful for showing the total number of rows.

---

title: Row Pinning (React) Guide
---

## Examples

Want to skip to the implementation? Check out these React examples:

- [Row Pinning](../examples/row-pinning)

### Row Pinning Setup

Here's how you set up your table to use row pinning features. Adding the row pinning feature enables the related APIs.

```tsx
import { useTable, tableFeatures, rowPinningFeature } from "@tanstack/react-table";

const features = tableFeatures({ rowPinningFeature });

const table = useTable({
  features,
  columns,
  data,
});
```

## Row Pinning (React) Guide

Row pinning lets you keep selected rows in top or bottom row regions while the rest of the rows render in the center region.

There are 2 table features that can reorder rows, which happen in the following order:

1. **Row Pinning** - If pinning, rows are split into top, center (unpinned), and bottom pinned rows.
2. [Sorting](./sorting)

### Enable Row Pinning

To use row pinning, add `rowPinningFeature` to your features. Row pinning does not require a row model factory, so no additional slots are needed on `tableFeatures` unless your table uses other row-model features.

```tsx
import { rowPinningFeature, tableFeatures, useTable } from "@tanstack/react-table";

const features = tableFeatures({ rowPinningFeature });

const table = useTable({
  features,
  columns,
  data,
});
```

### Row Pinning State

The `rowPinning` state stores row IDs in `top` and `bottom` arrays:

```tsx
type RowPinningState = {
  top: string[];
  bottom: string[];
};
```

You can pin rows by default with `initialState.rowPinning`:

```tsx
const table = useTable({
  features,
  columns,
  data,
  initialState: {
    rowPinning: {
      top: ["0"],
      bottom: ["3"],
    },
  },
});
```

If you need to manage row pinning outside of the table instance, the recommended v9 approach is an external atom passed to the table's `atoms` option. External atoms give you fine-grained subscriptions anywhere in your app, and other code can read or write the pinning state without re-rendering the component that owns the table.

```tsx
import type { RowPinningState } from "@tanstack/react-table";

import { useCreateAtom, useSelector } from "@tanstack/react-store";

const rowPinningAtom = useCreateAtom<RowPinningState>({
  top: [],
  bottom: [],
});

const rowPinning = useSelector(rowPinningAtom); // subscribe wherever it is needed

const table = useTable({
  features,
  columns,
  data,
  atoms: {
    rowPinning: rowPinningAtom,
  },
});
```

Alternatively, the v8-style `state.rowPinning` plus `onRowPinningChange` pattern is still supported. It can be convenient for simple integrations or when migrating v8 code, but it is less fine-grained than external atoms. See the [Table State Guide](./table-state) for a deeper comparison.

```tsx
const [rowPinning, setRowPinning] = useState<RowPinningState>({
  top: [],
  bottom: [],
});

const table = useTable({
  features,
  columns,
  data,
  state: {
    rowPinning,
  },
  onRowPinningChange: setRowPinning,
});
```

Use `table.setRowPinning` to update the state directly, and `table.resetRowPinning` to reset it to `initialState.rowPinning`. Pass `true` to `resetRowPinning` to clear both pinned row arrays.

```tsx
table.setRowPinning({
  top: ["0", "2"],
  bottom: ["8"],
});

table.resetRowPinning();
table.resetRowPinning(true);
```

### Pin Rows With Row APIs

Each row exposes APIs for checking whether it can be pinned, reading its pinned position, and changing its pinned position.

```tsx
row.getCanPin();
row.getIsPinned(); // 'top', 'bottom', or false
row.getPinnedIndex();

row.pin("top");
row.pin("bottom");
row.pin(false);
```

You can use these APIs to build pinning controls:

```tsx
const columns = [
  {
    id: "pin",
    header: "Pin",
    cell: ({ row }) =>
      row.getCanPin() ? (
        <div>
          <button onClick={() => row.pin("top")} disabled={row.getIsPinned() === "top"}>
            Top
          </button>
          <button onClick={() => row.pin(false)} disabled={!row.getIsPinned()}>
            Center
          </button>
          <button onClick={() => row.pin("bottom")} disabled={row.getIsPinned() === "bottom"}>
            Bottom
          </button>
        </div>
      ) : null,
  },
  //...
];
```

The `row.pin` API also accepts `includeLeafRows` and `includeParentRows` flags. These can be useful when pinning grouped or expanded rows and deciding whether related parent or leaf rows should move with the row.

### Row Pinning Table APIs

Row pinning splits the current row model into 3 row lists:

```tsx
table.getTopRows();
table.getCenterRows();
table.getBottomRows();
```

If you render pinned rows in separate table sections, use those APIs directly:

```tsx
<tbody>
  {table.getTopRows().map((row) => (
    <PinnedRow key={row.id} row={row} />
  ))}
  {table.getCenterRows().map((row) => (
    <TableRow key={row.id} row={row} />
  ))}
  {table.getBottomRows().map((row) => (
    <PinnedRow key={row.id} row={row} />
  ))}
</tbody>
```

Use `table.getIsSomeRowsPinned()` to check whether any rows are pinned, or pass a position to check a specific pinned region.

```tsx
table.getIsSomeRowsPinned();
table.getIsSomeRowsPinned("top");
table.getIsSomeRowsPinned("bottom");
```

### Disable Row Pinning

By default, all rows can be pinned. You can disable row pinning for the whole table or decide per row with `enableRowPinning`.

```tsx
const table = useTable({
  features,
  columns,
  data,
  enableRowPinning: (row) => row.original.status !== "archived",
});
```

### Keep Pinned Rows

By default, `keepPinnedRows` is `true`, so pinned rows stay visible in their pinned region even when they would otherwise be filtered or paginated out of the center rows.

Set `keepPinnedRows` to `false` if pinned rows should only render when they are present in the current filtered and paginated row model.

```tsx
const table = useTable({
  features,
  columns,
  data,
  keepPinnedRows: false,
});
```

---

title: Sorting (React) Guide
---

## Examples

Want to skip to the implementation? Check out these React examples:

- [Sorting](../examples/sorting)

### Sorting Setup

Here's how you set up your table to use sorting features. Adding the sorting feature enables the related APIs. If you use client-side sorting, also set up `sortedRowModel` after its feature, since row model slots are type-checked.

```tsx
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  createSortedRowModel,
  sortFn_alphanumeric,
  sortFn_text,
  sortFn_datetime,
} from "@tanstack/react-table";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(), // if using client-side sorting
  // manualSorting: true, // if using manual server-side sorting
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
});

const table = useTable({
  features,
  columns,
  data,
});
```

> [!NOTE]
> Spreading the entire built-in registry (`sortFns: { ...sortFns }`) still works, but it puts every built-in sorting function in your bundle. Registering just the functions you use, or passing a function directly to the `sortFn` column option, is recommended. The default `sortFn: 'auto'` resolves to `alphanumeric`, `text`, or `datetime` from the registry based on the column's data type, so register the ones your columns rely on.

## Sorting (React) Guide

TanStack Table provides solutions for just about any sorting use-case you might have. This guide will walk you through the various options that you can use to customize the built-in client-side sorting functionality, as well as how to opt out of client-side sorting in favor of manual server-side sorting.

### Sorting State

The sorting state is defined as an array of objects with the following shape:

```tsx
type ColumnSort = {
  id: string;
  desc: boolean;
};
type SortingState = ColumnSort[];
```

Since the sorting state is an array, it is possible to sort by multiple columns at once. Read more about the multi-sorting customizations down [below](#multi-sorting).

#### Accessing Sorting State

For reactive reads that should re-render your UI, use `table.state.sorting` (selected by the `useTable` selector) or `table.Subscribe`. In event handlers or other non-render code, you can read the current snapshot with `table.atoms.sorting.get()`, but this read does not subscribe the component to future changes.

```tsx
const table = useTable({
  features,
  columns,
  data,
  //...
});

table.state.sorting; // reactive read in render
table.atoms.sorting.get(); // snapshot read in event handlers
```

However, if you need access to the sorting state outside of the table, you can "control" the sorting state like down below.

#### Controlled Sorting State

If you need easy access to the sorting state in other parts of your application, you can own the sorting state slice yourself. The recommended way in v9 is an external atom passed through the `atoms` table option. Atoms preserve fine-grained subscriptions, and the sorting value can be used elsewhere (such as in a query key for server-side sorting) without forcing the component that owns the table to re-render.

```tsx
import { useCreateAtom, useSelector } from "@tanstack/react-store";

const sortingAtom = useCreateAtom<SortingState>([]); // can set initial sorting state here

// subscribe to the atom wherever you need the value (e.g. for a query key)
const sorting = useSelector(sortingAtom);

const table = useTable({
  features,
  columns,
  data,
  //...
  atoms: {
    sorting: sortingAtom, // table sorting APIs now update sortingAtom
  },
});
```

Alternatively, the v8-style `state.sorting` plus `onSortingChange` pattern is still supported. It can be convenient for simple integrations or when migrating v8 code, but it is less fine-grained than external atoms. See the [Table State Guide](./table-state) for a deeper comparison.

```tsx
const [sorting, setSorting] = useState<SortingState>([]);
//...
const table = useTable({
  features,
  columns,
  data,
  //...
  state: {
    sorting,
  },
  onSortingChange: setSorting,
});
```

#### Initial Sorting State

If you do not need to control the sorting state in your own state management or scope, but you still want to set an initial sorting state, you can use the `initialState` table option instead of `state`.

```tsx
const table = useTable({
  features,
  columns,
  data,
  //...
  initialState: {
    sorting: [
      {
        id: "name",
        desc: true, // sort by name in descending order by default
      },
    ],
  },
});
```

> [!NOTE]
> Do not use both `initialState.sorting` and `state.sorting` at the same time, as the controlled `state.sorting` value will override the `initialState.sorting`.

### Client-Side vs Server-Side Sorting

Sorting should operate over the same dataset as filtering and pagination. If the server returns only a page or filtered subset, client-side sorting sorts only those loaded rows, not the full dataset.

See the [Client-Side vs Server-Side Guide](../../../guide/client-side-vs-server-side) for the full decision framework and the cases where mixing client-side and server-side operations is intentional.

The client-side sorted row model also invokes the page-index auto-reset hook when sorting inputs change. Whether the page index resets depends on the `autoResetPageIndex`, `autoResetAll`, and `manualPagination` options. If sorting is manual and this row model is omitted or bypassed, a sorting state change does not invoke that hook, so reset server-side pagination in the sorting change handler when needed.

### Manual Server-Side Sorting

If you plan to just use your own server-side sorting in your back-end logic, you do not need to provide a sorted row model. But if you have provided a sorted row model, but you want to disable it, you can use the `manualSorting` table option.

```tsx
import { useCreateAtom, useSelector } from "@tanstack/react-store";

const features = tableFeatures({ rowSortingFeature }); // feature needed for sorting state/APIs

const sortingAtom = useCreateAtom<SortingState>([]);

// subscribe to the sorting state for your server-side query
const sorting = useSelector(sortingAtom);
//...
const table = useTable({
  features,
  columns,
  data,
  manualSorting: true, // use pre-sorted row model instead of sorted row model
  atoms: {
    sorting: sortingAtom,
  },
});
```

Hoisting the sorting state into your own scope (with an external atom or the `state.sorting` plus `onSortingChange` pattern) is covered in the [Controlled Sorting State](#controlled-sorting-state) section above.

> [!NOTE]
> When `manualSorting` is set to `true`, the table will assume that the data that you provide is already sorted, and will not apply any sorting to it.

### Client-Side Sorting

To implement client-side sorting, add the `rowSortingFeature` and the `sortedRowModel` factory to your features. Import `createSortedRowModel` and the individual sorting functions you use from TanStack Table:

```tsx
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  createSortedRowModel,
  sortFn_alphanumeric,
  sortFn_text,
  sortFn_datetime,
} from "@tanstack/react-table";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
});

const table = useTable({
  features,
  columns,
  data,
});
```

### Sorting RowModelFns

The default sorting function for all columns is inferred from the data type of the column. However, it can be useful to define the exact sorting function that you want to use for a specific column, especially if any of your data is nullable or not a standard data type.

You can determine a custom sorting function on a per-column basis using the `sortFn` column option.

By default, there are 6 built-in sorting functions to choose from:

- `alphanumeric` - Sorts by mixed alphanumeric values without case-sensitivity. Slower, but more accurate if your strings contain numbers that need to be naturally sorted.
- `alphanumericCaseSensitive` - Sorts by mixed alphanumeric values with case-sensitivity. Slower, but more accurate if your strings contain numbers that need to be naturally sorted.
- `text` - Sorts by text/string values without case-sensitivity. Faster, but less accurate if your strings contain numbers that need to be naturally sorted.
- `textCaseSensitive` - Sorts by text/string values with case-sensitivity. Faster, but less accurate if your strings contain numbers that need to be naturally sorted.
- `datetime` - Sorts by time, use this if your values are `Date` objects.
- `basic` - Sorts using a basic/standard `a > b ? 1 : a < b ? -1 : 0` comparison. This is the fastest sorting function, but may not be the most accurate.

You can also define your own custom sorting functions, either inline as the `sortFn` column option, or by name in the sorting function registry that you pass to `createSortedRowModel`.

#### Custom Sorting Functions

Whether you register a custom sorting function in the registry passed to `createSortedRowModel` or pass it directly as a `sortFn` column option, it should have the following signature:

```tsx
//optionally use the SortFn to infer the parameter types
const myCustomSortFn: SortFn<TFeatures, TData> = (
  rowA: Row<TFeatures, TData>,
  rowB: Row<TFeatures, TData>,
  columnId: string,
) => {
  return; //-1, 0, or 1 - access any row data using rowA.original and rowB.original
};
```

> [!NOTE]
> The comparison function does not need to take whether or not the column is in descending or ascending order into account. The row models will take care of that logic. `sortFn` functions only need to provide a consistent comparison.

Every sorting function receives 2 rows and a column ID and is expected to compare the two rows using the column ID to return `-1`, `0`, or `1` in ascending order. Here's a cheat sheet:

| Return | Ascending Order |
| ------ | --------------- |
| `-1`   | `a < b`         |
| `0`    | `a === b`       |
| `1`    | `a > b`         |

```tsx
const myCustomSortFn: SortFn<typeof features, MyData> = (rowA, rowB, columnId) =>
  rowA.original[columnId] > rowB.original[columnId]
    ? 1
    : rowA.original[columnId] < rowB.original[columnId]
      ? -1
      : 0;

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    myCustomSortFn,
  },
});

const columns = [
  {
    header: () => "Name",
    accessorKey: "name",
    sortFn: "alphanumeric", // use built-in sorting function by name
  },
  {
    header: () => "Age",
    accessorKey: "age",
    sortFn: "myCustomSortFn", // reference a custom sorting function registered in features
  },
  {
    header: () => "Birthday",
    accessorKey: "birthday",
    sortFn: "datetime", // recommended for date columns
  },
  {
    header: () => "Profile",
    accessorKey: "profile",
    // use custom sorting function directly
    sortFn: (rowA, rowB, columnId) => {
      return rowA.original.someProperty - rowB.original.someProperty;
    },
  },
];
//...
const table = useTable({
  features,
  columns,
  data,
});
```

> **TypeScript Note:** For `sortFn: 'myCustomSortFn'` string references to typecheck, register the function in the `sortFns` slot on `tableFeatures` (as shown above). Alternatively, skip the registry entirely by passing the function directly to the `sortFn` column option.

#### Customize Sorting Function Behavior

Sorting functions support an optional "hanging" property:

- `sortFn.resolveDataValue` - normalizes each row's value before the two sides are compared. It is honored by every sorting function built with the `constructSortFn` helper, which includes all built-in sorting functions.

The `constructSortFn` helper builds a sorting function from a value-level comparator (`sort`) plus that optional resolver. Keeping the comparison in `sort` and the normalization in `resolveDataValue` means a variant of an existing sorting function only has to swap the resolver. The definition is attached to the returned function, so you can spread any sorting function built with `constructSortFn` and override only what differs.

For example, a version of `alphanumeric` that ignores diacritics, so that "Éric Bernard" sorts next to "Eric Brandon" instead of after "Zak O'Sullivan":

```tsx
const stripDiacritics = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "");

const alphanumericIgnoreDiacritics = constructSortFn({
  ...sortFn_alphanumeric, // reuse the comparator
  resolveDataValue: (value) => stripDiacritics(sortFn_alphanumeric.resolveDataValue!(value)),
});

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, alphanumericIgnoreDiacritics },
});
```

The same pattern works when defining a new sorting function from scratch:

```tsx
const byLastName = constructSortFn({
  sort: (dataValueA, dataValueB) =>
    dataValueA === dataValueB ? 0 : dataValueA > dataValueB ? 1 : -1,
  resolveDataValue: (value) =>
    String(value ?? "")
      .split(" ")
      .at(-1) ?? "",
});
```

### Customize Sorting

There are a lot of table and column options that you can use to further customize the sorting UX and behavior.

#### Disable Sorting

You can disable sorting for either a specific column or the entire table using the `enableSorting` column option or table option.

```tsx
const columns = [
  {
    header: () => "ID",
    accessorKey: "id",
    enableSorting: false, // disable sorting for this column
  },
  {
    header: () => "Name",
    accessorKey: "name",
  },
  //...
];
//...
const table = useTable({
  features,
  columns,
  data,
  enableSorting: false, // disable sorting for the entire table
});
```

#### Sorting Direction

By default, the first sorting direction when cycling through the sorting for a column using the `toggleSorting` APIs is ascending for string columns and descending for number columns. You can change this behavior with the `sortDescFirst` column option or table option.

```tsx
const columns = [
  {
    header: () => "Name",
    accessorKey: "name",
    sortDescFirst: true, //sort by name in descending order first (default is ascending for string columns)
  },
  {
    header: () => "Age",
    accessorKey: "age",
    sortDescFirst: false, //sort by age in ascending order first (default is descending for number columns)
  },
  //...
];
//...
const table = useTable({
  features,
  columns,
  data,
  sortDescFirst: true, //sort by all columns in descending order first (default is ascending for string columns and descending for number columns)
});
```

> [!NOTE]
> You may want to explicitly set the `sortDescFirst` column option on any columns that have nullable values. The table may not be able to properly determine if a column is a number or a string if it contains nullable values.

#### Invert Sorting

Inverting sorting is not the same as changing the default sorting direction. If `invertSorting` column option is `true` for a column, then the "desc/asc" sorting states will still cycle like normal, but the actual sorting of the rows will be inverted. This is useful for values that have an inverted best/worst scale where lower numbers are better, e.g. a ranking (1st, 2nd, 3rd) or golf-like scoring.

```tsx
const columns = [
  {
    header: () => "Rank",
    accessorKey: "rank",
    invertSorting: true, // invert the sorting for this column. 1st -> 2nd -> 3rd -> ... even if "desc" sorting is applied
  },
  //...
];
```

#### Sort Undefined Values

Any undefined values will be sorted to the beginning or end of the list based on the `sortUndefined` column option or table option. You can customize this behavior for your specific use-case.

If not specified, the default value for `sortUndefined` is `1`, and undefined values will be sorted with lower priority (descending), if ascending, undefined will appear on the end of the list.

- `'first'` - Undefined values will be pushed to the beginning of the list
- `'last'` - Undefined values will be pushed to the end of the list
- `false` - Undefined values will be passed to the sorting function like any other value with no special handling; the sorting function is responsible for handling them
- `-1` - Undefined values will be sorted with higher priority (ascending) (if ascending, undefined will appear on the beginning of the list)
- `1` - Undefined values will be sorted with lower priority (descending) (if ascending, undefined will appear on the end of the list)

> [!NOTE]
> `'first'` and `'last'` options are available in v9.

```tsx
const columns = [
  {
    header: () => "Rank",
    accessorKey: "rank",
    sortUndefined: -1, // 'first' | 'last' | 1 | -1 | false
  },
];
```

#### Sorting Removal

By default, the ability to remove sorting while cycling through the sorting states for a column is enabled. You can disable this behavior using the `enableSortingRemoval` table option. This behavior is useful if you want to ensure that at least one column is always sorted.

The default behavior when using either the `getToggleSortingHandler` or `toggleSorting` APIs is to cycle through the sorting states like this (the first direction depends on the column's data type and the `sortDescFirst` option, as discussed [above](#sorting-direction); a string column is shown here):

`'none' -> 'asc' -> 'desc' -> 'none' -> 'asc' -> 'desc' -> ...`

If you disable sorting removal, the `'none'` state is skipped after the first sort:

`'none' -> 'asc' -> 'desc' -> 'asc' -> 'desc' -> ...`

Once a column is sorted and `enableSortingRemoval` is `false`, toggling the sorting on that column will never remove the sorting. However, if the user sorts by another column and it is not a multi-sort event, then the sorting will be removed from the previous column and just applied to the new column.

> Set `enableSortingRemoval` to `false` if you want to ensure that at least one column is always sorted.

```tsx
const table = useTable({
  features,
  columns,
  data,
  enableSortingRemoval: false, // disable the ability to remove sorting on columns (sorting can never return to 'none' once applied)
});
```

#### Multi-Sorting

Sorting by multiple columns at once is enabled by default if using the `column.getToggleSortingHandler` API. If the user holds the `Shift` key while clicking on a column header, the table will sort by that column in addition to the columns that are already sorted. If you use the `column.toggleSorting` API, you have to manually pass in whether or not to use multi-sorting. (`column.toggleSorting(desc, multi)`).

##### Disable Multi-Sorting

You can disable multi-sorting for either a specific column or the entire table using the `enableMultiSort` column option or table option. Disabling multi-sorting for a specific column will replace all existing sorting with the new column's sorting.

```tsx
const columns = [
  {
    header: () => "Created At",
    accessorKey: "createdAt",
    enableMultiSort: false, // always sort by just this column if sorting by this column
  },
  //...
];
//...
const table = useTable({
  features,
  columns,
  data,
  enableMultiSort: false, // disable multi-sorting for the entire table
});
```

##### Customize Multi-Sorting Trigger

By default, the `Shift` key is used to trigger multi-sorting. You can change this behavior with the `isMultiSortEvent` table option. You can even specify that all sorting events should trigger multi-sorting by returning `true` from the custom function.

```tsx
const table = useTable({
  features,
  columns,
  data,
  isMultiSortEvent: (e) => true, // normal click triggers multi-sorting
  //or
  isMultiSortEvent: (e) => e.ctrlKey || e.shiftKey, // also use the `Ctrl` key to trigger multi-sorting
});
```

##### Multi-Sorting Limit

By default, there is no limit to the number of columns that can be sorted at once. You can set a limit using the `maxMultiSortColCount` table option.

```tsx
const table = useTable({
  features,
  columns,
  data,
  maxMultiSortColCount: 3, // only allow 3 columns to be sorted at once
});
```

##### Multi-Sorting Removal

By default, the ability to remove multi-sorts is enabled. You can disable this behavior using the `enableMultiRemove` table option.

```tsx
const table = useTable({
  features,
  columns,
  data,
  enableMultiRemove: false, // disable the ability to remove multi-sorts
});
```

### Reset Sorting When Data Changes

Sorting state is preserved when the `data` option changes by default. Set `autoResetSorting: true` to reset sorting whenever a new data reference is processed. The reset restores `initialState.sorting`, or an empty sorting state when no initial value was provided.

This option responds only to data changes. Changing sorting, filters, or grouping does not trigger it. The global `autoResetAll` option overrides `autoResetSorting` when explicitly set.

Be careful when combining this option with manual/server-side sorting: a server response normally replaces `data`, so enabling the reset can immediately clear the sorting state that requested that response.

### Sorting APIs

There are a lot of sorting related APIs that you can use to hook up to your UI or other logic. Here is a list of all of the sorting APIs and some of their use-cases.

- `table.setSorting` - Set the sorting state directly.
- `table.resetSorting` - Reset the sorting state to the initial state or clear it.

- `column.getCanSort` - Useful for enabling/disabling the sorting UI for a column.
- `column.getIsSorted` - Useful for showing a visual sorting indicator for a column.

- `column.getToggleSortingHandler` - Useful for hooking up the sorting UI for a column. Add to a sort arrow (icon button), menu item, or simply the entire column header cell. This handler will call `column.toggleSorting` with the correct parameters.
- `column.toggleSorting` - Useful for hooking up the sorting UI for a column. If using instead of `column.getToggleSortingHandler`, you have to manually pass in whether or not to use multi-sorting. (`column.toggleSorting(desc, multi)`)
- `column.clearSorting` - Useful for a "clear sorting" button or menu item for a specific column.

- `column.getNextSortingOrder` - Useful for showing which direction the column will sort by next. (asc/desc/clear in a tooltip/menu item/aria-label or something)
- `column.getFirstSortDir` - Useful for showing which direction the column will sort by first. (asc/desc in a tooltip/menu item/aria-label or something)
- `column.getAutoSortDir` - Determines whether the first sorting direction will be ascending or descending for a column.
- `column.getAutoSortFn` - Used internally to find the default sorting function for a column if none is specified.
- `column.getSortFn` - Returns the exact sorting function being used for a column.

- `column.getCanMultiSort` - Useful for enabling/disabling the multi-sorting UI for a column.
- `column.getSortIndex` - Useful for showing a badge or indicator of the column's sort order in a multi-sort scenario. i.e. whether or not it is the first, second, third, etc. column to be sorted.

---

title: Virtualization (React) Guide
---

## Examples

Want to skip to the implementation? Check out these React examples:

- [Virtualized Columns](../examples/virtualized-columns)
- [Virtualized Rows](../examples/virtualized-rows)
- [Virtualized Infinite Scrolling](../examples/virtualized-infinite-scrolling)
- [Virtualized Columns Experimental](../examples/virtualized-columns-experimental)
- [Virtualized Rows Experimental](../examples/virtualized-rows-experimental)

### Virtualization Setup

Here's how you set up your table to use virtualization with TanStack Table. Virtualization is a rendering strategy, so TanStack Table does not need a feature or row model for it.

Install and import the React virtualizer adapter from `@tanstack/react-virtual`. TanStack Table still owns rows, columns, and table state; the virtualizer owns scroll indexes and measurements.
Also see the [TanStack Virtual table example](https://tanstack.com/virtual/latest/docs/framework/react/examples/table).

## Virtualization (React) Guide

The TanStack Table packages do not come with any virtualization APIs or features built in. Virtualization is a rendering strategy, not a table feature. You can use TanStack Table with any virtualization library, but the official examples use TanStack Virtual.

TanStack Table and TanStack Virtual solve different parts of the problem:

- TanStack Table builds the row models, columns, headers, cells, sizing, sorting, filtering, and other table state.
- TanStack Virtual decides which item indexes should be rendered for the current scroll position.
- Your table renderer maps those virtual indexes back to rows, headers, and cells.

### When To Use Virtualization

Use virtualization when your table has a very large number of rows, columns, or both. Virtualization keeps the DOM small by only rendering the items that are visible in the scroll viewport plus a small overscan buffer.

Virtualization is not a replacement for server-side pagination, filtering, or sorting. If the data is virtualized on the client, the data still needs to exist on the client. If your dataset is too large to load into the browser, use server-side data operations or infinite scrolling.

For small tables, normal rendering is simpler and usually preferable.

### Install TanStack Virtual

Install the React virtualizer adapter:

```sh
npm install @tanstack/react-virtual
```

The React examples use `useVirtualizer` from `@tanstack/react-virtual`. TanStack Table still owns rows, columns, headers, cells, sizing, sorting, filtering, and other table state; TanStack Virtual decides which item indexes should render for the current scroll position.

The table itself is set up like any other v9 table. Declare your features with `tableFeatures()` and create the table with `useTable`; nothing about virtualization changes the table setup.

```tsx
import {
  columnSizingFeature,
  rowSortingFeature,
  createSortedRowModel,
  sortFns,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

const features = tableFeatures({
  columnSizingFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
});

const table = useTable({
  features,
  columns,
  data,
});
```

### The Basic Pattern

Most virtualized table implementations follow the same pattern:

1. Create a fixed-height scroll container.
2. Pass the scroll element to the virtualizer.
3. Use `table.getRowModel().rows` or `table.getVisibleLeafColumns()` as the source list.
4. Configure `count`, `estimateSize`, `overscan`, and optional `measureElement`.
5. Render only virtual items.
6. Use virtual offsets or spacer padding to preserve the full scroll geometry.

Here is a compact row virtualization example:

```tsx
const rows = table.getRowModel().rows

const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 33,
  overscan: 5,
})

<tbody
  style={{
    height: `${rowVirtualizer.getTotalSize()}px`,
    position: 'relative',
  }}
>
  {rowVirtualizer.getVirtualItems().map(virtualRow => {
    const row = rows[virtualRow.index]

    return (
      <tr
        key={row.id}
        style={{
          position: 'absolute',
          transform: `translateY(${virtualRow.start}px)`,
          width: '100%',
        }}
      >
        {row.getVisibleCells().map(cell => (
          <td key={cell.id}>{/* render cell */}</td>
        ))}
      </tr>
    )
  })}
</tbody>
```

### Virtualized Rows

The [virtualized rows examples](../examples/virtualized-rows) show how to render large row counts while keeping the DOM small. The examples are available for React, Solid, Svelte, Vue, Angular, and Lit.

The core idea is that sorting, filtering, grouping, and other row-model work still comes from TanStack Table. The virtualizer reads from the final table row model:

```tsx
const rows = table.getRowModel().rows;
```

The row virtualizer is configured with `count: rows.length`, a row height estimate, the scroll container, and an overscan value. The `tbody` is given the full virtual height with `rowVirtualizer.getTotalSize()`, while each rendered row is absolutely positioned with `transform: translateY(...)`.

The examples render cells from the current row with APIs like `row.getVisibleCells()` or `row.getAllCells()`, depending on whether the example needs visibility-aware cells or all cells.

The official examples use large generated datasets, commonly tens or hundreds of thousands of rows. They also support dynamic row heights by using `measureElement` when possible. The examples skip dynamic row measurement in Firefox because Firefox can measure table border height differently.

### Virtualized Columns

The [virtualized columns examples](../examples/virtualized-columns) show how to render large row and column counts. The examples are available for React, Solid, Svelte, Vue, Angular, and Lit.

Column virtualization uses the current visible column list:

```tsx
const visibleColumns = table.getVisibleLeafColumns();
```

The column virtualizer is configured for horizontal virtualization:

```tsx
const columnVirtualizer = useVirtualizer({
  count: visibleColumns.length,
  estimateSize: (index) => visibleColumns[index].getSize(),
  getScrollElement: () => tableContainerRef.current,
  horizontal: true,
  overscan: 3,
});
```

Column virtualization uses a different rendering strategy than row virtualization. Instead of absolutely positioning columns, the examples add fake spacer cells to the left and right:

```tsx
const virtualColumns = columnVirtualizer.getVirtualItems();
const virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
const virtualPaddingRight =
  columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
```

Those spacer cells preserve the horizontal scroll width while the renderer only mounts the virtual columns. This approach keeps row rendering table-like and allows dynamic row height measurement to keep working.

### Virtualized Rows And Columns Together

The official virtualized columns examples also virtualize rows. In those examples:

- The row virtualizer controls vertical positioning and total body height.
- The column virtualizer controls horizontal header/cell rendering and left/right spacer cells.
- `virtualRow.index` maps to `rows[virtualRow.index]`.
- `virtualColumn.index` maps to `visibleCells[virtualColumn.index]`.

Always use virtual indexes against the same current row and column lists returned by the table. If sorting, filtering, pagination, grouping, or column visibility changes, recompute the virtualized rows and columns from the current table state.

### Virtualized Infinite Scrolling

The [virtualized infinite scrolling examples](../examples/virtualized-infinite-scrolling) combine row virtualization with progressive data fetching. The examples are available for React, Solid, Svelte, Vue, Angular, and Lit.

The common pattern is:

1. Fetch a page of rows.
2. Flatten fetched pages into the table `data`.
3. Use row virtualization over the loaded rows.
4. Listen to scroll events on the table container.
5. Fetch the next page when the user scrolls near the bottom.

The React example uses TanStack Query's `useInfiniteQuery`, but the same pattern works with any data-fetching layer.

```tsx
const { scrollHeight, scrollTop, clientHeight } = scrollElement;

if (scrollHeight - scrollTop - clientHeight < 500) {
  fetchNextPage();
}
```

If sorting is handled by the server, use manual sorting so the fetched data reflects the whole backend dataset rather than only the currently loaded rows. When sorting changes and the fetched dataset is replaced, scroll back to the top with `rowVirtualizer.scrollToIndex(0)`.

### Dynamic Row Heights

Dynamic row heights are useful when content can wrap or expand. They are also more complex than fixed-height rows.

Use `estimateSize` as the virtualizer's initial guess:

```tsx
estimateSize: () => 33;
```

Then use `measureElement` to refine the actual row height after rendering:

```tsx
<tr
  data-index={virtualRow.index}
  ref={node => rowVirtualizer.measureElement(node)}
>
```

Set `data-index` on each row so the virtualizer can associate measurements with the correct item. In non-React adapters, call `measureElement` through the adapter-appropriate ref, action, directive, or controller.

Overscan helps avoid blank regions while measurements settle. If every row has a known fixed height, skip dynamic measurement and use the fixed height estimate instead.

### Sticky Headers And Semantic Table Markup

The examples still use semantic table tags, but they change table layout CSS to support virtual positioning and sticky headers.

Dynamic row virtualization commonly requires:

```css
table {
  display: grid;
}

thead {
  display: grid;
  position: sticky;
  top: 0;
}

tr {
  display: flex;
}
```

Rows are absolutely positioned inside a relatively positioned `tbody`, and cells use flex sizing so they can match `column.getSize()` or `cell.column.getSize()`. This is intentional. Native table layout does not work well with dynamic-height virtual rows that are positioned independently.

### Performance Tips

- Keep virtualizers near the components that render the virtualized items.
- Avoid re-rendering the full table body on every scroll.
- Keep row, column, and data references stable where possible.
- Use `overscan` deliberately. More overscan reduces visible blanking, while less overscan reduces DOM nodes.
- Avoid expensive cell renderers in very large virtualized tables.
- Test production builds. React development mode is slower, and the React examples call this out.
- Prefer fixed row sizes when the UI allows it.
- For column virtualization, use `column.getSize()`, `header.getSize()`, and `cell.column.getSize()` consistently.

### Experimental React Virtualization Examples

The React examples include [Virtualized Rows Experimental](../examples/virtualized-rows-experimental) and [Virtualized Columns Experimental](../examples/virtualized-columns-experimental). These examples are advanced experiments for reducing React render work during scroll.

Use the standard examples first. Reach for the experimental examples only after profiling shows that React render work during scroll is the bottleneck.

The experimental examples use TanStack Virtual's `onChange` callback to imperatively update DOM styles instead of passing every scroll-position change through React render.

The experimental row example:

- Keeps a `rowRefsMap` from virtual row index to DOM row element.
- Uses `onChange` to update `rowRef.style.transform`.
- Memoizes rows with a custom `React.memo` comparator while scrolling.

```tsx
onChange: (instance) => {
  instance.getVirtualItems().forEach((virtualRow) => {
    const rowRef = rowRefsMap.current.get(virtualRow.index);
    if (!rowRef) return;
    rowRef.style.transform = `translateY(${virtualRow.start}px)`;
  });
};
```

The experimental column example also mutates scroll-position-only DOM styles:

```tsx
tableContainerRef.current?.style.setProperty("--virtual-padding-left", `${virtualPaddingLeft}px`);

tableContainerRef.current?.style.setProperty("--virtual-padding-right", `${virtualPaddingRight}px`);

tableBodyRef.current!.style.height = `${instance.getTotalSize()}px`;
```

It updates row transforms through DOM refs and memoizes header and cell components while the column virtualizer is scrolling.

Because these examples update the DOM outside React's normal render flow, keep the imperative updates narrowly scoped to scroll-position-only styles like `transform`, body height, and spacer widths. Do not use this pattern for business state, table state, data, sorting, filtering, or cell values.

### Choosing An Example

| Need                                     | Start with                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Many rows, normal columns                | [Virtualized Rows](../examples/virtualized-rows)                             |
| Many columns                             | [Virtualized Columns](../examples/virtualized-columns)                       |
| Many rows and columns                    | [Virtualized Columns](../examples/virtualized-columns)                       |
| Remote data loaded as the user scrolls   | [Virtualized Infinite Scrolling](../examples/virtualized-infinite-scrolling) |
| React scroll performance after profiling | [Experimental React examples](../examples/virtualized-rows-experimental)     |

### Common Pitfalls

- Forgetting to give the scroll container a fixed height.
- Rendering `table.getRowModel().rows.map(...)` instead of `virtualizer.getVirtualItems().map(...)`.
- Using virtual indexes against stale rows or columns after sorting, filtering, pagination, grouping, or column visibility changes.
- Forgetting left and right spacer cells for horizontal virtualization.
- Using `measureElement` when every row has a fixed height.
- Expecting TanStack Table to provide virtualization APIs as a feature.
- Mixing client-side virtualization with server-side sorting or filtering inconsistently.
