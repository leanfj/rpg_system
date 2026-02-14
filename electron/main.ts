import { app, BrowserWindow, session } from 'electron'
import path from 'path'

// Registra todos os IPC handlers
import './ipc'

// Serviço de áudio (para configurar a janela)
import { setMainWindow } from './services/audio'

// Referência à janela principal
let mainWindow: BrowserWindow | null = null

// Verifica se estamos em desenvolvimento
const isDev = !app.isPackaged

// Evita crash do renderer em alguns drivers/ambientes Linux
app.disableHardwareAcceleration()

function createWindow(): void {
  const iconPath = path.join(
    app.getAppPath(),
    'public',
    'favicon',
    'web-app-manifest-512x512.png'
  )
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false // Evita flash branco no startup
  })

  // Carrega a UI
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(
      path.join(app.getAppPath(), 'renderer', 'dist', 'index.html')
    )
  }

  // Mostra a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    // Configura a janela no serviço de áudio
    if (mainWindow) {
      setMainWindow(mainWindow)
    }
  })

  // Loga crashes do renderer para ajudar no debug
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details)
  })

  mainWindow.webContents.on('unresponsive', () => {
    console.error('Renderer process unresponsive')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Inicialização do app
app.whenReady().then(() => {
  // Remove headers que bloqueiam iframes em sites externos
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const url = details.url
    const isOwnContent = url.startsWith('http://localhost:') || url.startsWith('file://')
    
    if (isOwnContent) {
      // Para nosso conteúdo, usa CSP permissivo para iframes
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
            "frame-src *; " +
            "img-src 'self' data: blob: https: http:; " +
            "media-src 'self' data: blob: file:; " +
            "connect-src 'self' ws: wss: http: https:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; " +
            "style-src 'self' 'unsafe-inline' http://localhost:*;"
          ]
        }
      })
    } else {
      // Para sites externos, remove headers que bloqueiam iframe
      const responseHeaders = { ...details.responseHeaders }
      delete responseHeaders['x-frame-options']
      delete responseHeaders['X-Frame-Options']
      delete responseHeaders['content-security-policy']
      delete responseHeaders['Content-Security-Policy']
      callback({ responseHeaders })
    }
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true)
      return
    }
    callback(false)
  })

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return permission === 'media'
  })

  createWindow()

  app.on('activate', () => {
    // macOS: recria a janela se clicar no dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Fecha o app quando todas as janelas forem fechadas (exceto macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers serão registrados aqui
// Exemplo:
// ipcMain.handle('get-campaigns', async () => {
//   return await campaignService.getAll()
// })
