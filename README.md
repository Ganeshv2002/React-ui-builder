# React UI Builder

A drag-and-drop React component builder that allows you to visually create layouts and generate corresponding React code.

## Features

- 🎨 **Visual Design**: Drag and drop components to build layouts
- 🧩 **Predefined Components**: Button, Input, Card, Text, and Container components
- ⚙️ **Property Editor**: Configure component properties in real-time
- 📝 **Code Generation**: Export clean React JSX and CSS code
- 🔧 **Nested Components**: Support for container components with children
- 📱 **Responsive**: Built with responsive design principles

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository or extract the project files
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## How to Use

1. **Component Palette**: Browse available components in the left sidebar
2. **Canvas**: Drag components from the palette to the main canvas area
3. **Properties Panel**: Select any component to edit its properties in the right panel
4. **Export Code**: Click "Export Code" to generate React JSX and CSS code

## Available Components

- **Button**: Interactive buttons with different variants and sizes
- **Input**: Form inputs with labels and various types
- **Card**: Content containers with optional titles
- **Text**: Typography components (headings and body text)
- **Container**: Layout containers that can hold other components

## Project Structure

```
src/
├── components/          # Predefined UI components
├── builder/            # Drag-and-drop builder functionality
├── data/              # Component definitions
├── utils/             # Code generation utilities
└── App.jsx            # Main application
```

## Technologies Used

- **React**: Component-based UI library
- **Vite**: Fast build tool and development server
- **react-dnd**: Drag and drop functionality
- **react-dnd-html5-backend**: HTML5 backend for react-dnd
- **uuid**: Generate unique component IDs

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Adding New Components

1. Create the component in `src/components/`
2. Add component definition to `src/data/componentDefinitions.js`
3. Update the component map in `src/builder/DroppableComponent.jsx`

## Generated Code

The tool generates clean, readable React code that you can copy and use in your projects. The generated code includes:

- React functional components
- Proper imports
- Clean JSX structure
- Basic CSS styling

## Contributing

Feel free to contribute by adding new components, improving the UI, or enhancing the code generation features.


