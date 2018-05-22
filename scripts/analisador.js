var read = require('safe-log-reader');
var path = require('path');

class Evento_S {

    constructor(id){
        this.ID = id;
        this.Status = undefined;
        this.CicloDeVida = {
            "Ocorrencias": []
        };
    }
}

function PesquisarPorID(){
    //let exp =  new RegExp("(^.+" + id + ").*", "gm");

    
    
    let id = localStorage.getItem("IDLog");
    
    let Evento = new Evento_S(id);
    
    let caminhoLog = localStorage.getItem("CaminhoLog");
    let expPasta = /(^.*)\\.*/;
    let pastaLog = expPasta.exec(caminhoLog)[1];
    
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
            dir: path.resolve(pastaLog + "\\", '.bookmark'),
        }
    })
    .on('readable', function () { this.readLine(); })
    .on('read', function (line, count) {
        if(line.match(ExtraidoProcessamento) != null){
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("ID atualizado na base de dados para Extraído para processamento");
        } else if(line.match(ID_Enviado) != null){
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("ID Sendo enviado");
        } else if(line.match(RetornoID) != null){
            IniciarBuscaRetorno = true;
        } else if( line.match(FimRetornoID) != null && IniciarBuscaRetorno == true){
            IniciarBuscaRetorno = false;
            indexOcorrencia++;
            Evento.CicloDeVida.Ocorrencias.push({"Ocorrencia": []})
        } else if(IniciarBuscaRetorno == true && line.match(CodigoResposta) != null){
            var resposta = CodigoResposta.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Código de Resposta: " + resposta);
        } else if(IniciarBuscaRetorno == true && line.match(DescricaoResposta) != null){
            var descResposta = DescricaoResposta.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Descrição Resposta: " + descResposta);
        } else if (IniciarBuscaRetorno == true && line.match(TipoOcorrencia) != null){
            var tipo = TipoOcorrencia.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Ocorrência tipo: " + tipo);
        } else if( IniciarBuscaRetorno == true && line.match(CodigoOcorrencia) != null){
            var codigo = CodigoOcorrencia.exec(line)[2];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Código Ocorrência: " + codigo);
        } else if( IniciarBuscaRetorno == true && line.match(InicioDescricao) != null){
            var descricao = InicioDescricao.exec(line)[1];
            Evento.CicloDeVida.Ocorrencias[indexOcorrencia].Ocorrencia.push("Descrição Ocorrência: " + descricao);
            InicioBuscaDescricao = true;
        } else if( IniciarBuscaRetorno == true && InicioBuscaDescricao == true ){
            //Linha repetida pois o match nem sempre retorna o esperado
            if( line.match(FimRetornoID) != null ){
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
            } else {
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
            }
        }
    })
    .on('end', function (done) {
        Evento.CicloDeVida.Ocorrencias.forEach(val => {
            console.log(val);
        });
        console.log(Evento.CicloDeVida.Ocorrencias.length)
    });
}