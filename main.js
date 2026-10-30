const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
function createWindow() {
  const w = new BrowserWindow({
    width: 1150, height: 820, title: 'أسواق بدر', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  Menu.setApplicationMenu(null);
  w.loadFile(path.join(__dirname, 'www', 'index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
