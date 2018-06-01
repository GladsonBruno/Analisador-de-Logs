var read = require('safe-log-reader');
var path = require('path');
var os = require("os");
const SistemaOperacional = os.platform().toString();

class Evento_S {

    constructor(id){
        this.ID = id;
        this.Status = undefined;
        this.CicloDeVida = {
            "Ocorrencias": [],
            "DataHora": []
        };
        this.GetDataHora = function(EXP, Conteudo){
            let data_hora = /(^\d{2})\-(\d{2})\-(\w{4})\s(\d{2}):(\d{2}):(\d{2})\.\d{3}.*/;
            
            let dataOcorrencia = {
                "Data": {
                    "Ano": data_hora.exec(Conteudo)[3],
                    "Mes": data_hora.exec(Conteudo)[2],
                    "Dia": data_hora.exec(Conteudo)[1]
                },
                "Hora": data_hora.exec(Conteudo)[4],
                "Minuto": data_hora.exec(Conteudo)[5],
                "Segundos": data_hora.exec(Conteudo)[6],
                "HoraCompleta": data_hora.exec(Conteudo)[4] + ":" + data_hora.exec(Conteudo)[5] + ":" + data_hora.exec(Conteudo)[6]
            };
        
            return dataOcorrencia;
        }
    };
}

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

function PesquisarPorID(){
    //let exp =  new RegExp("(^.+" + id + ").*", "gm");

    ShowLoader();   
    
    let id = localStorage.getItem("IDLog");
    
    let Evento = new Evento_S(id);
    
    let caminhoLog = localStorage.getItem("CaminhoLog");
    let expPastaWindow = /(^.*)\\.*/;
    let expPastaLinux = /(^.*)\/.*/;
    let pastaLog;

    if( SistemaOperacional == "linux" || SistemaOperacional == "darwin"){
        
        try {
            pastaLog = expPastaLinux.exec(caminhoLog)[1]  + "/";    
        } catch(e){
            pastaLog = "./"
        }

    } else if( SistemaOperacional == "win32" || SistemaOperacional.substr(0,3) == "win" ){
        
        try {
            pastaLog = expPasta.exec(caminhoLog)[1] + "\\";
        } catch(e){
            pastaLog = "./";
        }

    } else {
        pastaLog = "./"
    }

    
    
    let Log_infos = /^.*\sINFO\s.*/gm;
    let Log_errors = /^.*\sERROR\s.*/gm;
    let Log_Alteracoes_SQL = /^.* Setting SQL statement .*/gm;

    let ExtraidoProcessamento = new RegExp("^.* (Atualizando o ID: "+ id +" .*).*", "gm");
    let ID_Enviado = new RegExp("^.*(ID sendo enviado: " + id + ").*", "gm");
    let RetornoID = new RegExp('^.*\<retornoEvento Id="'+ id +'"\>', "gm");
    let CodigoResposta = /^.*\<(cdResposta)\>(.*)\<\/\1\>.*/gm;
    let DescricaoResposta = /^.*\<(descResposta)\>(.*)\<\/\1\>.*/gm;
    let TipoOcorrencia = /^.*\<(tipo)\>(.*)\<\/\1\>.*/gm;
    let CodigoOcorrencia = /^.*\<(codigo)\>(.*)\<\/\1\>.*/gm;
    let InicioDescricao = /^.*\<descricao\>(.*)/gm
    let FimDescricao = /^(.*)(\<\/descricao\>)/gm;
    let DescricaoUmaLinha = /^.*\<(descricao)\>(.*)\<\/\1\>.*/gm;
    let FimRetornoID = /^.*\<\/evento\>/gm
    let InicioBuscaDescricao = false;
    let Processamento_Consulta = new RegExp("^.*(Processamento da consulta do evento ID: " + id + ".*).*", "gm");
    //Verifica se a linha não tem tags xml
    let NaoXML = /^.*(\<)|(\>).*/gm;
    let FalhaMontagemXML = new RegExp("^.*ID:(" + id + " apresentou problemas na montagem do XML.*)", "gm");
    let FalhaSerpro = /^.*Falha no acesso ao servidor do SERPRO.*/gm;
    let FalhaDecifragemCertificado_E_SERPRO = /^.*(Falha na decifragem dos certificados do governo e serpro.*)/;
    let FalhaDecifragemCertificado_Application_YML = /^.*(Falha na decifragem da chave do certificado no arquivo Application.*)(Segredo ou chave invalida.*)/;
    let FalhaSocketSeguro = /^.*(Falha na criação do soquete seguro. Problemas nas chaves ou certificado.).*/;
    //let LoteIgnorado = new RegExp("^.*(Lote de eventos ignorado):(Conteudo do lote:).*"+ id +".*", "gm");
    let LoteIgnorado = /^.*Lote de eventos ignorado.*/gm;
    let ConteudoLote = new RegExp("^.*Conteudo do lote: .*"+ id +".*");
    let VerificarLoteIgnorado = false;
    let NenhumaOcorrencia = true;

    //Pegar data e hora do processamento
    let DataHoraProcessamento = /^.*<(dhProcessamento>)(\d{4})-(\d{2})-(\d{2})T(.{8}).*\<\/\1/

    let IniciarBuscaRetorno = false;

    let indexOcorrencia = 0;

    let Ocorrencia_ID = new RegExp("^.*("+ id +".*)", "gm");
    let Ocorrencias = [];

    //Verifica se não tem nenhum numero após o id e verifica se existe quebra de linha ou espaçamento e texto
    //Serve para pegar exatamente aquele id
    //let idCorrespondente = new RegExp("^.*" + id + "(?=(?!\d)|(?=\n|\s\w*))", "gm");

    let conteudo = [];

    Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": []})

    read.createReader(caminhoLog, {
        batchLimit: 200000,
        bookmark: {
            dir: path.resolve(pastaLog, '.bookmark'),
        }
    })
    .on('readable', function () { this.readLine(); })
    .on('read', function (line, count) {
        //Verifica status Extraido para processamento
        if(line.match(ExtraidoProcessamento) != null){

            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("ID atualizado na base de dados para Extraído para processamento");
            Evento.CicloDeVida.DataHora.push(Evento.GetDataHora(ExtraidoProcessamento, line));

            NenhumaOcorrencia = false;

        //Verifica status Enviado
        } else if(line.match(ID_Enviado) != null){

            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Enviando evento S");
            Evento.CicloDeVida.DataHora.push(Evento.GetDataHora(ExtraidoProcessamento, line));
            indexOcorrencia++;
            Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": [] })

            NenhumaOcorrencia = false;

        //Verifica se a linha é o início do XML com o processamento do evento
        } else if(line.match(RetornoID) != null){

            IniciarBuscaRetorno = true;
            Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": []})

            NenhumaOcorrencia = false;

        //Verifica se é o Fim do retorno do evento no XML
        } else if( line.match(FimRetornoID) != null && IniciarBuscaRetorno == true){

            IniciarBuscaRetorno = false;

            NenhumaOcorrencia = false;
            indexOcorrencia++;
        } else if( DataHoraProcessamento.test(line) == true && IniciarBuscaRetorno == true){
            let HoraCompleta = DataHoraProcessamento.exec(line)[5];
            Evento.CicloDeVida.DataHora.push({ "HoraCompleta": HoraCompleta });

        // IniciarBuscaRetorno = Verifica se está entre as linhas com o retorno do XML
        //Verifica o codigo de resposta
        } else if(IniciarBuscaRetorno == true && line.search(CodigoResposta) != -1 ){
            
            var resposta;
            try {
                resposta = CodigoResposta.exec(line)[2];
            } catch(e) {
                resposta = CodigoResposta.exec(line)[2];
            }
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Retorno do Processamento do evento S");
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Código de Resposta: " + resposta);

        // IniciarBuscaRetorno = Verifica se está entre as linhas com o retorno do XML
        //Verifica a descrição da resposta do evento
        } else if(IniciarBuscaRetorno == true && line.match(DescricaoResposta) != null){

            var descResposta = DescricaoResposta.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Descrição Resposta: " + descResposta);

        // IniciarBuscaRetorno = Verifica se está entre as linhas com o retorno do XML
        //Verifica o tipo de ocorrência do evento
        } else if (IniciarBuscaRetorno == true && line.match(TipoOcorrencia) != null){
            
            var tipo = TipoOcorrencia.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Ocorrências Retornadas:")
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Ocorrência tipo: " + tipo);

        // IniciarBuscaRetorno = Verifica se está entre as linhas com o retorno do XML
        // Verifica o código de retorno da Ocorrência.
        } else if( IniciarBuscaRetorno == true && line.match(CodigoOcorrencia) != null){

            var codigo = CodigoOcorrencia.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Código Ocorrência: " + codigo);

        // IniciarBuscaRetorno = Verifica se está entre as linhas com o retorno do XML
        //Verifica se a linha analisada é a linha do xml que mostra a descrição da ocorrencia do evento.
        } else if( IniciarBuscaRetorno == true && line.match(InicioDescricao) != null){

            var descricao = InicioDescricao.exec(line)[1];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Descrição Ocorrência: " + descricao);
            InicioBuscaDescricao = true;

        // IniciarBuscaRetorno = Verifica se está entre as linhas com o retorno do XML
        // InicioBuscaDescricao Verifica se a linha analisada é a linha do xml que mostra a descrição da ocorrencia do evento.
        } else if( IniciarBuscaRetorno == true && InicioBuscaDescricao == true ){

            if( line.search(FimDescricao) != -1 ){
                var fimDesc;
                try{
                    fimDesc = FimDescricao.exec(line)[1];
                } catch(e){
                    if(fimDesc == null){
                        fimDesc = FimDescricao.exec(line)[1];
                        Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(fimDesc);
                    }
                }
                InicioBuscaDescricao = false;
            //Verifica se é uma linha de descrição que não contem tags xml.
            } else if( line.match(NaoXML) == null ){
                Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(line);
            } 
        //a função search retorna 0 caso encontre correspondencia, caso contrario retorna -1
        } else if( line.search(FalhaMontagemXML) == 0 ){
            var retornoFalhaXML;
            //Exec retorna positivo e negativo para a mesma busca.
            try {
                retornoFalhaXML = FalhaMontagemXML.exec(line)[1];
            } catch(e){
                retornoFalhaXML = FalhaMontagemXML.exec(line)[1];
            }
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Falha no processamento do XML de um evento S");
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(retornoFalhaXML);
            Evento.CicloDeVida.DataHora.push(Evento.GetDataHora(FalhaMontagemXML, line));
            indexOcorrencia++;
            Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": [] })

            NenhumaOcorrencia = false;

        } else if ( line.search(FalhaSerpro) == 0 ){

            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Falha no acesso ao Servidor Serpro");
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Verifique a conexão de Internet, regras de firewall e afins.");
            Evento.CicloDeVida.DataHora.push(Evento.GetDataHora(FalhaSerpro, line));
            indexOcorrencia++;
            Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": [] });

        } else if ( line.search(FalhaDecifragemCertificado_E_SERPRO) == 0 ) {
            let Falha = FalhaDecifragemCertificado_E_SERPRO.exec(line)[1];
            let Verificar = FalhaDecifragemCertificado_E_SERPRO.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(Falha);
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(Verificar);
            Evento.CicloDeVida.DataHora.push(Evento.GetDataHora(FalhaDecifragemCertificado_E_SERPRO, line));
            indexOcorrencia++;
            Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": [] });
        } else if( line.search(FalhaDecifragemCertificado_Application_YML) == 0 ){
            let Falha = FalhaDecifragemCertificado_Application_YML.exec(line)[1];
            let Motivo = FalhaDecifragemCertificado_Application_YML.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(Falha);
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Motivo:");
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(Motivo);
            Evento.CicloDeVida.DataHora.push(Evento.GetDataHora(FalhaDecifragemCertificado_Application_YML, line));
            indexOcorrencia++;
            Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": [] });
        } else if(line.search(LoteIgnorado) == 0){
            VerificarLoteIgnorado = true;
        } else if( VerificarLoteIgnorado == true ){
            if(line.search(ConteudoLote) == 0){
                let Mensagem = "Conteúdo do Lote: " + id;
                Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Lote Ignorado");
                Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(Mensagem);
                Evento.CicloDeVida.DataHora.push(Evento.GetDataHora(ConteudoLote, line));
                indexOcorrencia++;
                Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": [] });
                VerificarLoteIgnorado = false;
                NenhumaOcorrencia = false;
            }
        }
        
        else if( line.search(FalhaSocketSeguro) == 0 ){
            let Falha = FalhaSocketSeguro.exec(line)[1];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push(Falha);
            Evento.CicloDeVida.DataHora.push(Evento.GetDataHora(FalhaSocketSeguro, line));
            indexOcorrencia++;
            Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": [] });
        }
    })
    .on('end', function (done) {
        if(Evento.CicloDeVida.Ocorrencias.length > 0){
            if(NenhumaOcorrencia != true) {
                //Mostrando div que contem o timeline
            if($(".page").hasClass("hide") == true){
                $(".page").removeClass("hide");
            }

            let TamanhoOcorrencias = Evento.CicloDeVida.Ocorrencias.length;
            let TamanhoDatas = Evento.CicloDeVida.DataHora.length;
            
            console.log(Evento);

            if(TamanhoOcorrencias > TamanhoDatas && TamanhoOcorrencias > 1){
                TamanhoOcorrencias = TamanhoOcorrencias -1;
            }

            for(i = 0; i < TamanhoOcorrencias; i++){
                
                let hora = Evento.CicloDeVida.DataHora[i].HoraCompleta;
                    if(hora != null || hora != undefined || hora != ""){
                        if(Evento.CicloDeVida.Ocorrencias[i].Ocorrencia.length > 0){
                            ocorrencia = `
                            <div class="timeline__box">
                                <div class="timeline__date">
                                    <span class="timeline__hora"> Ocorrência </span>
                                    <span class="timeline__hora"> `+ hora +` </span>
                                </div>
                                <div class="timeline__post">
                                <div class="timeline__content" id="EventoNegocio01_`+ i +`">
                                </div>
                                </div>
                            </div>
                            `;
                            $(".conteudo").append(ocorrencia);
                            for(var j = 0; j < Evento.CicloDeVida.Ocorrencias[i].Ocorrencia.length; j++){
                                $("#EventoNegocio01_" + i).append("<p>" + Evento.CicloDeVida.Ocorrencias[i].Ocorrencia[j] + "</p>");
                            }
                        }
                    }
            }
            
            $(".timeline__year").html("").html(id);
            } else {
                $("#card_nenhum_resultado").removeClass("hide");
                $(".id_pesquisado").html("").html(id);
            }
            
        } else {
            $("#card_nenhum_resultado").removeClass("hide");
            $(".id_pesquisado").html("").html(id);
        }
        
        console.log(Evento.CicloDeVida)
    });
}