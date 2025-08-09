// Component definitions for the UI builder
export const componentDefinitions = [
  {
    id: 'button',
    name: 'Button',
    category: 'Interactive',
    icon: '🔘',
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
    icon: '📝',
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
    icon: '📄',
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
    icon: '📝',
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
    icon: '📦',
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
    icon: '📋',
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
  }
];
