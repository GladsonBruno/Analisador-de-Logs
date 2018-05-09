var read = require('safe-log-reader');
var path = require('path');


class Evento_S {

    constructor(id){
        this.ID = id;
        this.Status = undefined;
        this.CicloDeVida = {
            "EventoNegocio_Case1": {
                "Ocorrencias": []
            },
            "EventoNegocio_Case2": {
                "Ocorrencias": []
            }
        };
    }

}

function RetornoConsultaEXP(EXP, Conteudo){
    let data_hora = /(^\d{2})\-(\d{2})\-(\w{4})\s(\d{2}:\d{2}:\d{2})\.\d{3}.*/;
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
        "Hora": data_hora.exec(Conteudo)[4]
    };

    return novaOcorrencia;
}

function PesquisarPorID(id){
    //let exp =  new RegExp("(^.+" + id + ").*", "gm");

    let Evento = new Evento_S(id);

    let ExtraidoProcessamento = new RegExp("^.* (Atualizando o ID: "+ id +" .*).*", "gm");
    let ID_Enviado = new RegExp("^.*(ID sendo enviado: " + id + ").*", "gm");
    let Processamento_Consulta = new RegExp("^.*(Processamento da consulta do evento ID: " + id + ".*).*", "gm");
    let Codigo_Resposta_Processamento = new RegExp("^.*(Codigo de resposta do governo.*|Código de resposta do governo.*).*", "gm"); 
    let Descricao_Resposta_Processamento = new RegExp("^.*(Descrição da resposta.*).*", "gm");
    let Status_EventoProcessado = /^.*parameter value \[(\w{1})\], .*/gm;

    let Log_infos = /^.*\sINFO\s.*/gm;
    let Log_Alteracoes_SQL = /^.* Setting SQL statement .*/gm;

    

    let conteudo = [];

    read.createReader('./LOGS/log.log', {
        batchLimit: 200000,
        bookmark: {
            dir: path.resolve('./LOGS/', '.bookmark'),
        }
    })
    .on('readable', function () { this.readLine(); })
    .on('read', function (line, count) {
        if(line.match(Log_infos) != null || line.match(Log_Alteracoes_SQL) != null){
            conteudo.push(line);
        }
    })
    .on('end', function (done) {
        let totalLinhas = conteudo.length;
        let IndexOcorrencia = 0;
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
            }

            if(Processamento_Consulta.test(conteudo[i]) == true){
                Evento.CicloDeVida.EventoNegocio_Case2.Ocorrencias.push({"Ocorrencia": []});
                Evento.CicloDeVida.EventoNegocio_Case2.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Processamento_Consulta, conteudo[i]));
                Evento.Status = "Consultando Processamento";
                
                if(conteudo[i + 1].match(Codigo_Resposta_Processamento) != null){
                    Evento.CicloDeVida.EventoNegocio_Case2.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Codigo_Resposta_Processamento, conteudo[i + 1]));
                    Evento.Status = "Processado";
                        
                    if(conteudo[i + 2].match(Descricao_Resposta_Processamento) != null){
                        Evento.CicloDeVida.EventoNegocio_Case2.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Descricao_Resposta_Processamento, conteudo[i + 2]));                            
                        if(conteudo[i + 3].match(Status_EventoProcessado) != null){
                            Evento.CicloDeVida.EventoNegocio_Case2.Ocorrencias[IndexOcorrencia].Ocorrencia.push(RetornoConsultaEXP(Status_EventoProcessado, conteudo[i + 3]));
                            /*
                            if(conteudo[i + 19].match(Status_EventoProcessado) != null   ){
                                Evento.CicloDeVida.push(RetornoConsultaEXP(Status_EventoProcessado, conteudo[i + 19]));
                            }
                            */
                        }
                    }
                }
                IndexOcorrencia++;
            }
            
        }
        
        let ocorrencia;
            
            $(".conteudo").append(ocorrencia);
            console.log(Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias.length);
            for(i = 0; i < Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias.length; i++){
                ocorrencia = `
                    <div class="timeline__box">
                        <div class="timeline__date">
                            <span class="timeline__hora"> Ocorrência </span>
                            <span class="timeline__hora"> 0`+ (i + 1) +` </span>
                        </div>
                        <div class="timeline__post">
                        <div class="timeline__content" id="EventoNegocio0`+ i +`">
                        </div>
                        </div>
                    </div>
                    `;
                $(".conteudo").append(ocorrencia);

                for(var j = 0; j < Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[i].Ocorrencia.length; j++){
                    $("#EventoNegocio0" + i).append("<p>" + Evento.CicloDeVida.EventoNegocio_Case1.Ocorrencias[i].Ocorrencia[j].Descricao + "</p>");
                }
            }
        
        
            for(i = 0; i < Evento.CicloDeVida.EventoNegocio_Case2.Ocorrencias.length; i++){

                ocorrencia = `
                    <div class="timeline__box">
                        <div class="timeline__date">
                            <span class="timeline__hora"> Ocorrencia </span>
                            <span class="timeline__hora"> 0 `+ (i + 1)  +` </span>
                        </div>
                        <div class="timeline__post">
                        <div class="timeline__content" id="EventoNegocio0`+ i +`">
                        </div>
                        </div>
                    </div>
                    `;
                $(".conteudo").append(ocorrencia);                

                for(var j = 0; j < Evento.CicloDeVida.EventoNegocio_Case2.Ocorrencias[i].Ocorrencia.length; j++){
                    $("#EventoNegocio0" + i).append("<p>" + Evento.CicloDeVida.EventoNegocio_Case2.Ocorrencias[i].Ocorrencia[j].Descricao + "</p>");
                }
            }
        console.log(Evento);
    });
}
PesquisarPorID("ID1040984700000002018041415415100002");