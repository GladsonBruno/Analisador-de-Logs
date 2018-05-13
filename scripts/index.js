const electron_remote = require('electron').remote;
const boxDialog = electron_remote.dialog;

$(document).ready(function(){

    ShowLoader();

});

function ShowLoader(){
    var loader = `<div class='container center'>
    <div class="preloader-wrapper big active">
        <div class="spinner-layer spinner-blue-only">
            <div class="circle-clipper left">
                <div class="circle"></div>
            </div>
            <div class="gap-patch">
                <div class="circle"></div>
            </div>
            <div class="circle-clipper right">
                <div class="circle"></div>
            </div>
        </div>
    </div>
    </div>
    `;

    M.toast({
        html: loader,
        timeRemaining: 200,
        displayLength: 1000,
        classes: 'container center transparent'
    });
}

function CarregarLOG(){
    const opcoesCertificado = {
        properties: ['openFile'],
        filters: [{
            name: "LOG File",
            extensions: ['log']
        }]
    };

    boxDialog.showOpenDialog(opcoesCertificado, (file) => {
        $("#caminho-log").val(file);
    });
}

function RedirecionaPaginaAnalisar(){
    var error = "";
    if($("#caminho-log").val() == ""){
        error += "Insira o caminho do log";
    } if($("#id_analisado").val() == ""){
        error += "<br/>Insira o id a ser pesquisado";
    }
    if(error == ""){
        localStorage.setItem("CaminhoLog", $("#caminho-log").val());
        localStorage.setItem("IDLog", $("#id_analisado").val());
        ShowLoader();
        setInterval(()=> {
            window.location.assign("../pages/RetornoPesquisa.html");
        }, 1200);
    }
    else {
        alert(error);
    }
}