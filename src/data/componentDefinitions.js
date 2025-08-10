// Component definitions for the UI builder
import { 
  faSquare, 
  faFont, 
  faFileAlt, 
  faListUl, 
  faImage, 
  faHeading, 
  faTextHeight,
  faCircle,
  faBox,
  faLink,
  faMinus,
  faCheckSquare,
  faEdit
} from '@fortawesome/free-solid-svg-icons';

export const componentDefinitions = [
  {
    id: 'button',
    name: 'Button',
    category: 'Interactive',
    icon: faCircle,
    defaultProps: {
      children: 'Click me',
      variant: 'primary',
      size: 'medium',
      type: 'button'
    },
    props: [
      {
        name: 'children',
        type: 'string',
        defaultValue: 'Click me',
        label: 'Text'
      },
      {
        name: 'type',
        type: 'select',
        options: ['button', 'submit', 'reset'],
        defaultValue: 'button',
        label: 'Button Type'
      },
      {
        name: 'variant',
        type: 'select',
        options: ['primary', 'secondary'],
        defaultValue: 'primary',
        label: 'Variant'
      },
      {
        name: 'size',
        type: 'select',
        options: ['small', 'medium', 'large'],
        defaultValue: 'medium',
        label: 'Size'
      }
    ]
  },
  {
    id: 'input',
    name: 'Input',
    category: 'Form',
    icon: faEdit,
    defaultProps: {
      type: 'text',
      placeholder: 'Enter text...',
      label: 'Input Label',
      required: false,
      disabled: false,
      readonly: false,
      name: 'input-field'
    },
    props: [
      {
        name: 'label',
        type: 'string',
        defaultValue: 'Input Label',
        label: 'Label'
      },
      {
        name: 'type',
        type: 'select',
        options: [
          'text', 
          'email', 
          'password', 
          'number', 
          'tel', 
          'url', 
          'search',
          'date', 
          'time', 
          'datetime-local', 
          'month', 
          'week',
          'color',
          'range',
          'file',
          'checkbox',
          'radio',
          'textarea'
        ],
        defaultValue: 'text',
        label: 'Input Type'
      },
      {
        name: 'placeholder',
        type: 'string',
        defaultValue: 'Enter text...',
        label: 'Placeholder'
      },
      {
        name: 'value',
        type: 'string',
        defaultValue: '',
        label: 'Default Value'
      },
      {
        name: 'name',
        type: 'string',
        defaultValue: 'input-field',
        label: 'Field Name'
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: '',
        label: 'Field ID'
      },
      {
        name: 'required',
        type: 'boolean',
        defaultValue: false,
        label: 'Required'
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: false,
        label: 'Disabled'
      },
      {
        name: 'readonly',
        type: 'boolean',
        defaultValue: false,
        label: 'Read Only'
      },
      {
        name: 'min',
        type: 'string',
        defaultValue: '',
        label: 'Min Value (for number/date types)'
      },
      {
        name: 'max',
        type: 'string',
        defaultValue: '',
        label: 'Max Value (for number/date types)'
      },
      {
        name: 'step',
        type: 'string',
        defaultValue: '',
        label: 'Step (for number/range types)'
      },
      {
        name: 'maxLength',
        type: 'string',
        defaultValue: '',
        label: 'Max Length'
      },
      {
        name: 'minLength',
        type: 'string',
        defaultValue: '',
        label: 'Min Length'
      },
      {
        name: 'pattern',
        type: 'string',
        defaultValue: '',
        label: 'Pattern (regex)'
      },
      {
        name: 'multiple',
        type: 'boolean',
        defaultValue: false,
        label: 'Multiple (for file inputs)'
      },
      {
        name: 'accept',
        type: 'string',
        defaultValue: '',
        label: 'Accept (file types for file inputs)'
      },
      {
        name: 'showConditions',
        type: 'conditions',
        defaultValue: '',
        label: 'Show Conditions',
        placeholder: 'Define when this field should be visible'
      },
      {
        name: 'disableConditions',
        type: 'conditions',
        defaultValue: '',
        label: 'Disable Conditions',
        placeholder: 'Define when this field should be disabled'
      },
      {
        name: 'validationRules',
        type: 'validation',
        defaultValue: '',
        label: 'Validation Rules',
        placeholder: 'Define validation rules for this field'
      }
    ]
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Layout',
    icon: faFileAlt,
    defaultProps: {
      title: 'Card Title',
      children: 'Card content goes here'
    },
    props: [
      {
        name: 'title',
        type: 'string',
        defaultValue: 'Card Title',
        label: 'Title'
      },
      {
        name: 'children',
        type: 'textarea',
        defaultValue: 'Card content goes here',
        label: 'Content',
        placeholder: 'Enter card content...'
      }
    ]
  },
  {
    id: 'text',
    name: 'Text',
    category: 'Typography',
    icon: faFont,
    defaultProps: {
      variant: 'body',
      children: 'Sample text'
    },
    props: [
      {
        name: 'variant',
        type: 'select',
        options: ['h1', 'h2', 'h3', 'body'],
        defaultValue: 'body',
        label: 'Variant'
      },
      {
        name: 'children',
        type: 'textarea',
        defaultValue: 'Sample text',
        label: 'Text',
        placeholder: 'Enter your text here...'
      }
    ]
  },
  {
    id: 'container',
    name: 'Container',
    category: 'Layout',
    icon: faBox,
    defaultProps: {
      direction: 'vertical',
      gap: 'medium',
      children: []
    },
    props: [
      {
        name: 'direction',
        type: 'select',
        options: ['vertical', 'horizontal'],
        defaultValue: 'vertical',
        label: 'Direction'
      },
      {
        name: 'gap',
        type: 'select',
        options: ['small', 'medium', 'large'],
        defaultValue: 'medium',
        label: 'Gap'
      }
    ],
    canContainChildren: true
  },
  {
    id: 'form',
    name: 'Form',
    category: 'Form',
    icon: faListUl,
    defaultProps: {
      method: 'POST',
      action: '',
      children: []
    },
    props: [
      {
        name: 'method',
        type: 'select',
        options: ['GET', 'POST'],
        defaultValue: 'POST',
        label: 'Method'
      },
      {
        name: 'action',
        type: 'string',
        defaultValue: '',
        label: 'Submit URL'
      }
    ],
    canContainChildren: true
  },
  {
    id: 'image',
    type: 'image',
    name: 'Image',
    icon: faImage,
    category: 'Layout',
    defaultProps: {
      src: '',
      alt: 'Image',
      width: '200px',
      height: 'auto',
      borderRadius: '0px'
    },
    props: [
      {
        name: 'src',
        type: 'string',
        defaultValue: '',
        label: 'Image URL'
      },
      {
        name: 'alt',
        type: 'string',
        defaultValue: 'Image',
        label: 'Alt Text'
      },
      {
        name: 'width',
        type: 'string',
        defaultValue: '200px',
        label: 'Width'
      },
      {
        name: 'height',
        type: 'string',
        defaultValue: 'auto',
        label: 'Height'
      },
      {
        name: 'borderRadius',
        type: 'string',
        defaultValue: '0px',
        label: 'Border Radius'
      }
    ],
    canContainChildren: false
  },
  {
    id: 'link',
    type: 'link',
    name: 'Link',
    icon: faLink,
    category: 'Typography',
    defaultProps: {
      href: '#',
      text: 'Click here',
      target: '_self',
      color: '#007bff',
      underline: true
    },
    props: [
      {
        name: 'href',
        type: 'string',
        defaultValue: '#',
        label: 'URL'
      },
      {
        name: 'text',
        type: 'string',
        defaultValue: 'Click here',
        label: 'Link Text'
      },
      {
        name: 'target',
        type: 'select',
        defaultValue: '_self',
        label: 'Target',
        options: ['_self', '_blank', '_parent']
      },
      {
        name: 'color',
        type: 'color',
        defaultValue: '#007bff',
        label: 'Color'
      },
      {
        name: 'underline',
        type: 'boolean',
        defaultValue: true,
        label: 'Show Underline'
      }
    ],
    canContainChildren: false
  },
  {
    id: 'heading',
    type: 'heading',
    name: 'Heading',
    icon: faHeading,
    category: 'Typography',
    defaultProps: {
      text: 'Heading',
      level: 'h2',
      align: 'left',
      color: '#333333'
    },
    props: [
      {
        name: 'text',
        type: 'string',
        defaultValue: 'Heading',
        label: 'Text'
      },
      {
        name: 'level',
        type: 'select',
        defaultValue: 'h2',
        label: 'Level',
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      },
      {
        name: 'align',
        type: 'select',
        defaultValue: 'left',
        label: 'Alignment',
        options: ['left', 'center', 'right']
      },
      {
        name: 'color',
        type: 'color',
        defaultValue: '#333333',
        label: 'Color'
      }
    ],
    canContainChildren: false
  },
  {
    id: 'paragraph',
    type: 'paragraph', 
    name: 'Paragraph',
    icon: faTextHeight,
    category: 'Typography',
    defaultProps: {
      text: 'This is a paragraph text.',
      size: 'medium',
      align: 'left',
      color: '#666666'
    },
    props: [
      {
        name: 'text',
        type: 'string',
        defaultValue: 'This is a paragraph text.',
        label: 'Text'
      },
      {
        name: 'size',
        type: 'select',
        defaultValue: 'medium',
        label: 'Size',
        options: ['small', 'medium', 'large']
      },
      {
        name: 'align',
        type: 'select',
        defaultValue: 'left',
        label: 'Alignment',
        options: ['left', 'center', 'right', 'justify']
      },
      {
        name: 'color',
        type: 'color',
        defaultValue: '#666666',
        label: 'Color'
      }
    ],
    canContainChildren: false
  },
  {
    id: 'list',
    type: 'list',
    name: 'List',
    icon: faListUl,
    category: 'Typography',
    defaultProps: {
      type: 'unordered',
      items: ['Item 1', 'Item 2', 'Item 3'],
      spacing: 'normal'
    },
    props: [
      {
        name: 'type',
        type: 'select',
        defaultValue: 'unordered',
        label: 'List Type',
        options: ['unordered', 'ordered']
      },
      {
        name: 'items',
        type: 'array',
        defaultValue: ['Item 1', 'Item 2', 'Item 3'],
        label: 'List Items'
      },
      {
        name: 'spacing',
        type: 'select',
        defaultValue: 'normal',
        label: 'Item Spacing',
        options: ['compact', 'normal', 'relaxed']
      }
    ],
    canContainChildren: false
  },
  {
    id: 'divider',
    type: 'divider',
    name: 'Divider',
    icon: faMinus,
    category: 'Layout',
    defaultProps: {
      thickness: '1px',
      color: '#e0e0e0',
      marginTop: '16px',
      marginBottom: '16px',
      borderStyle: 'solid'
    },
    props: [
      {
        name: 'thickness',
        type: 'string',
        defaultValue: '1px',
        label: 'Thickness'
      },
      {
        name: 'color',
        type: 'color',
        defaultValue: '#e0e0e0',
        label: 'Color'
      },
      {
        name: 'marginTop',
        type: 'string',
        defaultValue: '16px',
        label: 'Top Margin'
      },
      {
        name: 'marginBottom',
        type: 'string',
        defaultValue: '16px',
        label: 'Bottom Margin'
      },
      {
        name: 'borderStyle',
        type: 'select',
        defaultValue: 'solid',
        label: 'Border Style',
        options: ['solid', 'dashed', 'dotted']
      }
    ],
    canContainChildren: false
  },
  {
    id: 'checkbox',
    type: 'checkbox',
    name: 'Checkbox',
    icon: faCheckSquare,
    category: 'Form',
    defaultProps: {
      checked: false,
      label: 'Checkbox label',
      name: 'checkbox-field',
      required: false,
      disabled: false,
      size: 'medium'
    },
    props: [
      {
        name: 'checked',
        type: 'boolean',
        defaultValue: false,
        label: 'Checked'
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'Checkbox label',
        label: 'Label'
      },
      {
        name: 'name',
        type: 'string',
        defaultValue: 'checkbox-field',
        label: 'Field Name'
      },
      {
        name: 'required',
        type: 'boolean',
        defaultValue: false,
        label: 'Required'
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: false,
        label: 'Disabled'
      },
      {
        name: 'size',
        type: 'select',
        defaultValue: 'medium',
        label: 'Size',
        options: ['small', 'medium', 'large']
      }
    ],
    canContainChildren: false
  }
];
