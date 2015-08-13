var app = require('app');  // Module to control application life.
var ipc = require('ipc');
var Tray = require('tray');
var Menu = require('menu');
var path = require('path');
var powerSaveBlocker = require('power-save-blocker');
var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;
var appIcon = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// app.on('closed')
// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  // Create the browser window.
  var ico = path.join(__dirname, 'images', 'ico.png');
  mainWindow = new BrowserWindow({
    width: 990
   ,height: 620
   ,frame: false
   ,icon: ico
  });
  // mainWindow.setFullScreen(true); 
  
  //set tray icon
  appIcon = new Tray(ico);
  var blocker_id = null;
  var contextMenu = Menu.buildFromTemplate([
    { label: '退出',
      accelerator: 'Command+Q',
      selector: 'terminate:',
      click: function() {
        mainWindow.close();
        mainWindow = null;
      }
    }
  ]);
  appIcon.setToolTip('Play Music');
  appIcon.setContextMenu(contextMenu);
  


  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  ipc.on('close', function(event, arg) {
    mainWindow.close();
    mainWindow = null;
  });
  ipc.on('maximize', function(event, arg) {
    mainWindow.maximize();
  });
  ipc.on('minimize', function(event, arg) {
    mainWindow.minimize();
  });
  ipc.on('restore', function(event, arg) {
    mainWindow.restore();
  });

});
