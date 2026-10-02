import React, { useLayoutEffect } from 'react'
import UIBuilder from './builder/UIBuilder/UIBuilder'
import { MantineProvider } from '@mantine/core'

import './App.css'
import { BuilderThemeProvider } from './builder/ThemeProvider/ThemeProvider'
import { PageProvider } from './contexts/PageContext'
import Dashboard from './dashboard/Dashboard'
import useEditorStore from './store/editorStore'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import ProtectedWorkspace from './auth/ProtectedWorkspace'
import AccountPage from './auth/AccountPage'
import { useRoute } from './auth/useRoute'
import variantPersistence from './services/variantPersistence'

function Workspace() {
  const { path } = useRoute()
  const { user } = useAuth()
  useLayoutEffect(() => {
    variantPersistence.setUserScope(user.id)
    return () => {
      variantPersistence.setUserScope(null)
      useEditorStore.getState().clearSelection()
      useEditorStore.getState().setPreviewMode(false)
      useEditorStore.getState().closeCodeViewer()
    }
  }, [user.id])
  const navigate = next => {
    useEditorStore.getState().clearSelection()
    useEditorStore.getState().setPreviewMode(false)
    useEditorStore.getState().closeCodeViewer()
    window.location.hash = next === 'editor' ? '/editor' : '/'
  }
  return path === 'account' ? <AccountPage /> : path === 'editor'
    ? <UIBuilder onDashboard={() => navigate('dashboard')} />
    : <Dashboard user={user} onOpenEditor={() => navigate('editor')} onAccount={() => { window.location.hash = '/account' }} />
}

function AccountWorkspace() {
  const { user } = useAuth()
  return user && <PageProvider key={user.id} storageKey={`framewright:workspace:${user.id}`}><Workspace /></PageProvider>
}

function App() {
  return (
    <MantineProvider>
      <BuilderThemeProvider>
        <AuthProvider><ProtectedWorkspace><AccountWorkspace /></ProtectedWorkspace></AuthProvider>
      </BuilderThemeProvider>
    </MantineProvider>
  )
}

export default App
