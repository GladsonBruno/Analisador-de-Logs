var read = require('safe-log-reader');
var path = require('path');


class Evento_S {

    constructor(id){
        this.ID = id;
        this.Status = undefined;
        this.CicloDeVida = {
            "EventoNegocio_Case1": {
                "Ocorrencias": []
            }
        };
    }

}

function RetornoConsultaEXP(EXP, Conteudo){
    let data_hora = /(^\d{2})\-(\d{2})\-(\w{4})\s(\d{2}):(\d{2}):(\d{2})\.\d{3}.*/;
    let Descricao = EXP.exec(Conteudo.match(EXP))[1];
    
    let statusEvento = /\b\w{1}$/gm;

    if(Descricao.match(statusEvento) != null){
        Descricao = "Status alterado para " + Descricao;
    }
    
    let novaOcorrencia = {
        "Descricao": Descricao,
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

    return novaOcorrencia;
}

function RetornoConsultaEXPErro(EXP, Conteudo){
    let data_hora = /(^\d{2})\-(\d{2})\-(\w{4})\s(\d{2}):(\d{2}):(\d{2})\.\d{3}.*/;
    let Descricao = EXP.exec(Conteudo.match(EXP))[1];
    
    //Se tiver xml como segundo parametro da expressão regular
    //As express~eos enviadas só tem 1 parametro
    //Se tiver 2 é a expressão que pega o conteudo da tag xml para ser formatada para aparecer na tela
    // &lt corresponde à < e &lt corresponde à >
    if(EXP.exec(Conteudo.match(EXP))[2] != null){
        Descricao = Descricao + "<br/> &lt" + EXP.exec(Conteudo.match(EXP))[2] + "&gt";
    }

    let novaOcorrencia = {
        "Descricao": Descricao,
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

    return novaOcorrencia;
}

function PesquisarPorID(){
    //let exp =  new RegExp("(^.+" + id + ").*", "gm");

    let id = localStorage.getItem("IDLog");
    let caminhoLog = localStorage.getItem("CaminhoLog");
    let expPasta = /(^.*)\\.*/;
    let pastaLog = expPasta.exec(caminhoLog)[1];
    let Evento = new Evento_S(id);

    let ExtraidoProcessamento = new RegExp("^.* (Atualizando o ID: "+ id +" .*).*", "gm");
    let ID_Enviado = new RegExp("^.*(ID sendo enviado: " + id + ").*", "gm");
    let Processamento_Consulta = new RegExp("^.*(Processamento da consulta do evento ID: " + id + ".*).*", "gm");
    let Codigo_Resposta_Processamento = new RegExp("^.*(Codigo de resposta do governo.*|Código de resposta do governo.*).*", "gm"); 
    let Descricao_Resposta_Processamento = new RegExp("^.*(Descrição da resposta.*).*", "gm");
    let Status_EventoProcessado = /^.*parameter value \[(\w{1})\], .*/gm;

    let Log_infos = /^.*\sINFO\s.*/gm;
    let Log_errors = /^.*\sERROR\s.*/gm;
    let Log_Alteracoes_SQL = /^.* Setting SQL statement .*/gm;



    let Erro_Montagem_Evento = new RegExp("^.* (ID:" + id + " apresentou problemas na montagem do XML.*).*", "gm");
    let Erro_Montagem_XML = /^.* (Falha no processamento do XML de um evento S.*)/gm;
    let XML_Causador_Falha = /^.*( XML causador da falha: \<(.*)\>).*/gm;

    //Verifica se não tem nenhum numero após o id e verifica se existe quebra de linha ou espaçamento e texto
    //Serve para pegar exatamente aquele id
    //let idCorrespondente = new RegExp("^.*" + id + "(?=(?!\d)|(?=\n|\s\w*))", "gm");

    let conteudo = [];

    read.createReader(caminhoLog, {
        batchLimit: 200000,
        bookmark: {
            dir: path.resolve(pastaLog + "\\", '.bookmark'),
        }
    })
    .on('readable', function () { this.readLine(); })
    .on('read', function (line, count) {
        if(line.match(Log_infos) != null || line.match(Log_Alteracoes_SQL) != null || line.match(Log_errors)){

            conteudo.push(line);
        }
    })
    .on('end', function (done) {
        let totalLinhas = conteudo.length;
        let IndexOcorrencia = 0;
        let IndexOcorrencia_2 = 0;
        let IndexOcorrencia_3 = 0;
        if(totalLinhas > 0){
            for(var i = 0; i < totalLinhas; i++){
                
                if(ExtraidoProcessamento.test(conteudo[i]) == true){
                    

                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias.push({"Ocorrencia": []});  
                    Evento.Status = "Extraido Processamento";
                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(ExtraidoProcessamento, conteudo[i]));
                    if(ID_Enviado.test(conteudo[i + 7]) == true){
                        
                        Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(ID_Enviado, conteudo[i + 7]));
                        Evento.Status = "Enviando";
                        console.log(conteudo[i + 10]);
                        if(conteudo[i + 10].match(Codigo_Resposta_Processamento) != null){
                            
                            Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Codigo_Resposta_Processamento, conteudo[i + 10]));
    
                            if(conteudo[i + 11].match(Descricao_Resposta_Processamento) != null){
                                Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Descricao_Resposta_Processamento, conteudo[i + 11]));                            
                                
                            }                        
                        }
                        IndexOcorrencia++;
                    } else {
                        if(conteudo[i + 3].match(Codigo_Resposta_Processamento) != null){
                            Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Codigo_Resposta_Processamento, conteudo[i + 3]));
                            
                            if(conteudo[i + 4].match(Descricao_Resposta_Processamento) != null){
                                Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Descricao_Resposta_Processamento, conteudo[i + 4]));                            
    
                            }                        
                        }
                        IndexOcorrencia++;
                    }
                } else if(ID_Enviado.test(conteudo[i]) == true){
                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias.push({"Ocorrencia": []});  
                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(ID_Enviado, conteudo[i]));
                    Evento.Status = "Enviando";
                    if(conteudo[i + 3].match(Codigo_Resposta_Processamento) != null){
                        
                        Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Codigo_Resposta_Processamento, conteudo[i + 3]));

                        if(conteudo[i + 4].match(Descricao_Resposta_Processamento) != null){
                            Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Descricao_Resposta_Processamento, conteudo[i + 4]));                            
                            
                        }                       
                    } else if(conteudo[i + 4].match(Codigo_Resposta_Processamento) != null){
                        Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Codigo_Resposta_Processamento, conteudo[i + 4]));

                        if(conteudo[i + 5].match(Descricao_Resposta_Processamento) != null){
                            Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Descricao_Resposta_Processamento, conteudo[i + 5]));                            
                            
                        }                        
                    }
                    IndexOcorrencia++;
                } else if(Processamento_Consulta.test(conteudo[i]) == true){
                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias.push({"Ocorrencia": []});
                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Processamento_Consulta, conteudo[i]));
                    Evento.Status = "Consultando Processamento";
                    
                    if(conteudo[i + 1].match(Codigo_Resposta_Processamento) != null){
                        Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Codigo_Resposta_Processamento, conteudo[i + 1]));
                        Evento.Status = "Processado";
                            
                        if(conteudo[i + 2].match(Descricao_Resposta_Processamento) != null){
                            Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Descricao_Resposta_Processamento, conteudo[i + 2]));                            
                            if(conteudo[i + 3].match(Status_EventoProcessado) != null){
                                Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Status_EventoProcessado, conteudo[i + 3]));
                                /*
                                if(conteudo[i + 19].match(Status_EventoProcessado) != null   ){
                                    Evento.CicloDeVida.push(RetornoConsultaEXP(Status_EventoProcessado, conteudo[i + 19]));
                                }
                                */
                            }
                        }
                    }
                    IndexOcorrencia++;
                }else if(Erro_Montagem_Evento.test(conteudo[i]) == true){
                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias.push({"Ocorrencia": []});
                    if(Erro_Montagem_XML.test(conteudo[i -1]) == true){
                        Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXPErro(Erro_Montagem_XML, conteudo[i - 1]));
                    }
                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXPErro(Erro_Montagem_Evento, conteudo[i]));
                    if(XML_Causador_Falha.test(conteudo[i + 1]) == true){
                        Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXPErro(XML_Causador_Falha, conteudo[i + 1]));
                        
                        if(ID_Enviado.test(conteudo[i + 8]) == true){
                        
                            Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(ID_Enviado, conteudo[i + 8]));
                            Evento.Status = "Enviando";
                            
                            if(conteudo[i + 11].match(Codigo_Resposta_Processamento) != null){
                                
                                Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Codigo_Resposta_Processamento, conteudo[i + 11]));
        
                                if(conteudo[i + 12].match(Descricao_Resposta_Processamento) != null){
                                    Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Descricao_Resposta_Processamento, conteudo[i + 12]));                            
                                    
                                }                        
                            }
                            
                        }
                    }

                    

                    IndexOcorrencia++;
                }
                
            }
            
            if(Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias.length > 0){
                //Mostrando div que contem o timeline
                if($(".page").hasClass("hide") == true){
                    $(".page").removeClass("hide");
                }

                for(i = 0; i < Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias.length; i++){
                    let hora = Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[i].Ocorrencia[0].HoraCompleta;
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
    
                    for(var j = 0; j < Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[i].Ocorrencia.length; j++){
                        $("#EventoNegocio01_" + i).append("<p>" + Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[i].Ocorrencia[j].Descricao + "</p>");
                    }
                }
                
                $(".timeline__year").html("").html(id);
                
            }
            
            if(IndexOcorrencia == 0) {
                $("#card_nenhum_resultado").removeClass("hide");
                $(".id_pesquisado").html("").html(id);
            }

        } else {
            alert("nada");
        }
        
    });
}