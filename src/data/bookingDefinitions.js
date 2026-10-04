import { faWindowMaximize, faColumns, faLayerGroup, faBox, faImage, faTicket } from '@fortawesome/free-solid-svg-icons';
const icons=[faTicket,faColumns,faWindowMaximize,faLayerGroup,faBox,faImage,faTicket];
const specs=[
  ["priceSummary","Price summary","Data",{"unitPrice":1499,"quantity":1,"currency":"INR"},false],
  [
    "drawer",
    "Drawer",
    "Layout",
    {
      "title": "Your details",
      "triggerLabel": "Open drawer",
      "open": false,
      "side": "right"
    },
    true
  ],
  [
    "modal",
    "Modal",
    "Interactive",
    {
      "title": "Confirm your action",
      "triggerLabel": "Open modal",
      "open": false
    },
    true
  ],
  [
    "footer",
    "Footer",
    "Layout",
    {
      "brand": "Your brand",
      "description": "Thoughtfully made for you.",
      "copyright": "© 2026 Your brand"
    },
    true
  ],
  [
    "appShell",
    "App shell",
    "Layout",
    {
      "background": "#f8f7fb",
      "accent": "#6842e8",
      "maxWidth": 1180
    },
    true
  ],
  [
    "hero",
    "Hero",
    "Layout",
    {
      "eyebrow": "EXPERIENCES WORTH SHARING",
      "title": "Make your next memory.",
      "description": "Discover something extraordinary, right around the corner.",
      "detail": "A little anticipation. A lot to look forward to."
    },
    true
  ],
  [
    "eventGrid",
    "Event cards",
    "Data",
    {
      "items": [
        {
          "id": "sample",
          "title": "An evening to remember",
          "poster": "LIVE. LOUD. LOCAL.",
          "category": "Music",
          "date": "SAT, 24 OCT",
          "venue": "The Courtyard",
          "city": "Bengaluru",
          "description": "Your next favourite experience starts here.",
          "price": 1499
        }
      ],
      "emptyText": "No events match your search."
    },
    false
  ]
];
export const bookingDefinitions=specs.map(([id,name,category,defaultProps,canContainChildren],index)=>({
  id,name,category,defaultProps,canContainChildren,icon:icons[index],
  props:Object.entries(defaultProps).map(([key,value])=>({
    name:key,label:key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()),
    type:key==='items'?'json':key==='side'?'select':typeof value==='boolean'?'boolean':typeof value==='number'?'number':'string',
    ...(key==='side'?{options:['left','right']}:{}),defaultValue:value,
  })),
}));
