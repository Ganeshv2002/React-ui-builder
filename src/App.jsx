import React from 'react'
import UIBuilder from './builder/UIBuilder'

import './App.css'
import { BuilderThemeProvider } from './builder/ThemeProvider'

function App() {
  return (
    <BuilderThemeProvider>
      <UIBuilder />
    </BuilderThemeProvider>
  )
}

export default App
