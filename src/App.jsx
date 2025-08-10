import React from 'react'
import UIBuilder from './builder/UIBuilder'
import { BuilderThemeProvider } from './builder/ThemeProvider'
import './App.css'

function App() {
  return (
    <BuilderThemeProvider>
      <UIBuilder />
    </BuilderThemeProvider>
  )
}

export default App
