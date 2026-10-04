# Seatwave ticket-booking demo

## Open it

In Framewright, choose **Seatwave tickets** on the dashboard and create the project. The template creates three editable pages: Sign in, Discover events, and My tickets. Existing projects are retained.

Start the separate API from the sibling folder:

```powershell
cd "..\framewright-ticket-api"
npm start
```

In the builder, open **Preview**, enable **API calls**, and sign in with **demo@seatwave.test** / **TicketDemo2026!**. Search events, open a booking drawer, choose a quantity, and confirm. A modal shows the reservation ID. My tickets loads actual saved records from the API.

Bookings are fictional. No charges, payments, real reservations or emails are sent.

## Projects and source files

- Editable configuration: `src/demos/seatwave.json`.
- Separate API: sibling `framewright-ticket-api`, port 3003. It uses Node 22+, with no package dependencies. Bookings persist in `data/bookings.json`; sessions reset when restarted.
- Independent exported frontend: sibling `framewright-ticket-demo`. Run `npm install`, then `npm run dev -- --port 5174`.
- Regenerate the standalone frontend after modifying the demo/runtime: `node scripts/export-seatwave.mjs` from the builder root. This overwrites generated frontend source; keep custom frontend changes elsewhere.

Use localhost consistently for the app and the API. The demo API accepts localhost frontend ports 5173, 5174 and 4173. Change resource URLs in Page behavior and configure API CORS when moving to another host.

## Reusable components

The library includes Drawer, Modal, Footer, App shell, Hero, Event cards, and Price summary. Drawer and Modal accept nested components and display their content inline on the design canvas. In Preview/export they use native modal dialogs with keyboard focus containment, Escape handling and close controls.

Bind an overlay's `open` property to state and wire its `close` event to a state update. The Seatwave template demonstrates both.

## Unsaved-change tracking

Enable **Warn before leaving unsaved changes** on a Form. Assign a unique Form ID if you want to clear only that form. Changes and reversions are detected from form values. Internal route changes and overlay close actions ask whether to discard unsaved changes; browser refresh/close uses the browser's standard warning.

After a successful API request, run `{ "type": "markClean", "formId": "booking-form" }`. Failed requests retain the dirty flag and show their error inside the form. `{ "$dirty": true }` is a binding that returns whether any tracked form has unsaved changes.

## Bind table data

Define an API resource and a request action that assigns its response to state. Bind the table's `rows`:

```json
{
  "bindings": { "rows": { "$state": "bookings.items" } },
  "props": {
    "columns": ["Booking", "Event", "Tickets"],
    "fieldPaths": ["id", "event.title", "quantity"],
    "rowKey": "id"
  }
}
```

Column field paths match columns by position and support nested objects. Arrays of objects, arrays of cell arrays, and legacy pipe-separated rows are supported. Use `{ "$fields": "records" }` to bind rows to a named form field containing a JSON array. Rows also have a JSON editor in Properties. Loading, error and empty messages are configurable.

## Design references

Event discovery and ticket access informed the flow: [Eventbrite](https://www.eventbrite.com/). Overlay behavior follows [Material dialogs](https://material-web.dev/components/dialog/). The demo artwork is original CSS and SVG.

## Checks

Builder: `npm test` and `npm run build`.
API: `npm test` in its folder.
Exported demo: `npm run build` in its folder.
