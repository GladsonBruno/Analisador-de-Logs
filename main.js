const electron = require('electron');
const { BrowserWindow, Menu, app } = electron;
const url = require('url');
const path = require('path');


let TelaInicial;

//Definindo ambiente de Produção ou de Desenvolvimento.
// production = Produção
//development = Desenvolvimento
process.env.NODE_ENV = 'production';



app.on('ready', () => {


    let screenSize = electron.screen.getPrimaryDisplay().size;
    TelaInicial = new BrowserWindow({
        height: screenSize.height,
        width: screenSize.width,
        minHeight: 600,
        minWidth: 1000
    });


    TelaInicial.loadURL(url.format({
        pathname: path.join(__dirname, './pages/index.html'),
        protocol: 'file:'
    }));

});

let menuTemplate = [
    
]

app.on('window-all-closed', function(){
    app.quit();
});

app.on('will-quit', function(){
    app.quit();
});

//Adicionar Developer Tools se não for ambiente de Produção
if(process.env.NODE_ENV !== 'production'){
    menuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q' ,
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            }, {
                role: 'reload'
            }
        ]
    })
}

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);