import React from 'react'
import UIBuilder from './builder/UIBuilder/UIBuilder'
import { MantineProvider } from '@mantine/core'

import './App.css'
import { BuilderThemeProvider } from './builder/ThemeProvider/ThemeProvider'

function App() {
  return (
    <MantineProvider>
      <BuilderThemeProvider>
        <UIBuilder />
      </BuilderThemeProvider>
    </MantineProvider>
  )
}

export default App
