import { faListUl, faEdit, faToggleOn, faSliders, faChevronDown, faFolder, faTableCells, faRoute, faEllipsis, faBoxOpen, faBars, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
const icons = [faListUl, faEdit, faToggleOn, faSliders, faChevronDown, faFolder, faTableCells, faRoute, faEllipsis, faBoxOpen, faBars, faQuoteLeft];
const specs = [
  [
    "select",
    "Select",
    "Form",
    {
      "label": "Choose an option",
      "name": "choice",
      "placeholder": "Select an option",
      "options": [
        "Option one",
        "Option two",
        "Option three"
      ],
      "required": false,
      "disabled": false
    }
  ],
  [
    "textarea",
    "Text area",
    "Form",
    {
      "label": "Message",
      "name": "message",
      "placeholder": "Write your message…",
      "rows": 4,
      "required": false,
      "disabled": false
    }
  ],
  [
    "switch",
    "Switch",
    "Form",
    {
      "label": "Enable notifications",
      "name": "notifications",
      "checked": false,
      "disabled": false
    }
  ],
  [
    "slider",
    "Slider",
    "Form",
    {
      "label": "Volume",
      "name": "volume",
      "min": 0,
      "max": 100,
      "step": 1,
      "value": 50,
      "disabled": false
    }
  ],
  [
    "accordion",
    "Accordion",
    "Interactive",
    {
      "titles": [
        "What is included?",
        "Can I customize it?",
        "How do I get started?"
      ],
      "descriptions": [
        "Reusable components for your next project.",
        "Adjust content and styles to match your brand.",
        "Choose a component and add it to your page."
      ]
    }
  ],
  [
    "tabs",
    "Tabs",
    "Interactive",
    {
      "label": "Content sections",
      "labels": [
        "Overview",
        "Details",
        "Activity"
      ],
      "panels": [
        "A clear overview of your project.",
        "Everything you need to know.",
        "Your latest updates appear here."
      ]
    }
  ],
  [
    "dataTable",
    "Data table",
    "Data",
    {
      "caption": "Team members",
      "columns": [
        "Name",
        "Role",
        "Status"
      ],
      "rows": [
        "Alex Morgan | Designer | Active",
        "Jordan Lee | Developer | Active",
        "Taylor Kim | Product manager | Away"
      ],
      "striped": true
    }
  ],
  [
    "breadcrumbs",
    "Breadcrumbs",
    "Navigation",
    {
      "labels": [
        "Home",
        "Projects",
        "Current project"
      ],
      "links": [
        "#/",
        "#/projects"
      ]
    }
  ],
  [
    "pagination",
    "Pagination",
    "Navigation",
    {
      "totalPages": 10,
      "initialPage": 1
    }
  ],
  [
    "emptyState",
    "Empty state",
    "Feedback",
    {
      "title": "Nothing here yet",
      "description": "Your content will appear here when you add it."
    }
  ],
  [
    "skeleton",
    "Skeleton",
    "Feedback",
    {
      "lines": 3,
      "lineHeight": 16,
      "label": "Loading content"
    }
  ],
  [
    "quote",
    "Quote",
    "Typography",
    {
      "text": "Great products begin with thoughtful design.",
      "author": "Alex Morgan",
      "attribution": "Product designer"
    }
  ]
];
export const libraryDefinitions = specs.map(([id, name, category, defaultProps], index) => ({
  id, name, category, defaultProps, icon: icons[index], canContainChildren: false,
  props: Object.entries(defaultProps).map(([key,value]) => ({
    name:key, label:id==='dataTable' && key==='rows'?'Rows (separate cells with |)':key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()),
    type:Array.isArray(value)?'array':typeof value==='boolean'?'boolean':typeof value==='number'?'number':'string', defaultValue:value,
  })),
}));
const table=libraryDefinitions.find(definition=>definition.id==='dataTable');
Object.assign(table.defaultProps,{fieldPaths:[],rowKey:'id',loading:false,error:'',emptyText:'No records to display.'});
table.props.find(prop=>prop.name==='rows').type='json';
table.props.find(prop=>prop.name==='rows').label='Rows (JSON records or pipe-separated strings)';
table.props.push(
  {name:'fieldPaths',type:'array',label:'Column field paths (same order as columns)',defaultValue:[]},
  {name:'rowKey',type:'string',label:'Unique row key',defaultValue:'id'},
  {name:'loading',type:'boolean',label:'Loading',defaultValue:false},
  {name:'error',type:'string',label:'Error message',defaultValue:''},
  {name:'emptyText',type:'string',label:'Empty message',defaultValue:'No records to display.'},
);
