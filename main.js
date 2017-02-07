/**
 * electron main process
 * music player
 * author by Alen-gao
 * time is 2017/01/20 9:55
*/

// Introduce dependency
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = require('electron').ipcMain;

// Window control
app.on('ready',function(){
  
    var mainWindow = new BrowserWindow({
        width: 414
        ,height: 716
        ,width: 990
        ,height: 620
        // ,transparent: true
        ,frame: false
    });

    // shwo console
    mainWindow.openDevTools();

    mainWindow.loadURL('file://'+__dirname+'/app/index.html') //主窗口
 
    // close main window
    ipc.on('close', function(){
        mainWindow.close();
        mainWindow = null;
    });

    // max main window
    ipc.on('max', function(){
        mainWindow.maximize();
    });

    // resize main window
    ipc.on('restore', function(){
        mainWindow.restore();
    });

    // min main window
    ipc.on('min', function(){
        mainWindow.minimize();
    });

})
