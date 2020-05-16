/**
 * Verificar um local melhor para armazenar isso no futuro, por exemplo no backend se estivesse usando um.
 **/

const credentials = {
    app_id: '',
    consumer_key : '',
    consumer_secret : '',
};

/**
 * Método que consulta a API do Yahoo, utiliza o código de exemplo do site da API.
 * @param credentials - Credenciais da API
 * @param cityLocation - Cidade a ser buscada.
 * @param resolve - Callback a ser executado em caso de sucess (recebe o JSON do Yahoo).
 * @param reject - Callback a ser executado em caso de falha (Recebe string com falha).
 */
var getYahooApi = function (credentials, cityLocation, resolve, reject) {

    var url = 'https://weather-ydn-yql.media.yahoo.com/forecastrss';
    var method = 'GET';
    var app_id = credentials.app_id;
    var consumer_key = credentials.consumer_key;
    var consumer_secret = credentials.consumer_secret;
    var concat = '&';
    var query = {'location': cityLocation, 'format': 'json', 'u' : 'c'};
    var oauth = {
        'oauth_consumer_key': consumer_key,
        'oauth_nonce': Math.random().toString(36).substring(2),
        'oauth_signature_method': 'HMAC-SHA1',
        'oauth_timestamp': parseInt(new Date().getTime() / 1000).toString(),
        'oauth_version': '1.0'
    };

    var merged = {};
    $.extend(merged, query, oauth);

    var merged_arr = Object.keys(merged).sort().map(function(k) {
        return [k + '=' + encodeURIComponent(merged[k])];
    });
    var signature_base_str = method
        + concat + encodeURIComponent(url)
        + concat + encodeURIComponent(merged_arr.join(concat));

    var composite_key = encodeURIComponent(consumer_secret) + concat;
    var hash = CryptoJS.HmacSHA1(signature_base_str, composite_key);
    var signature = hash.toString(CryptoJS.enc.Base64);

    oauth['oauth_signature'] = signature;
    var auth_header = 'OAuth ' + Object.keys(oauth).map(function(k) {
        return [k + '="' + oauth[k] + '"'];
    }).join(',');

    $.ajax({
        url: url + '?' + $.param(query),
        headers: {
            'Authorization': auth_header,
            'X-Yahoo-App-Id': app_id
        },
        method: 'GET',
        success: function(data){
            resolve(data);
        }
    });
}

/**
 * Obtem a versão traduzida da situação (ex. Cloudy -> Nublado)
 * @param code - Código do Yahoo
 * @returns string
 */
var getTranslatedStatus = function(code) {
    let statuses = [
        { code: 0, status : "tornado"},
        { code: 1, status : "tempestade tropical"},
        { code: 2, status : "furacão"},
        { code: 3, status : "tempestades severas"},
        { code: 4, status : "trovoadas"},
        { code: 5, status : "chuva e neve mistas"},
        { code: 6, status : "chuva e granizo"},
        { code: 7, status : "neve e granizo mistos"},
        { code: 8, status : "chuviscos gelados"},
        { code: 9, status : "chuvisco"},
        { code: 10, status : "chuva congelante"},
        { code: 11, status : "chuveiros"},
        { code: 12, status : "chuva"},
        { code: 13, status : "rajadas de neve"},
        { code: 14, status : "aguaceiros de neve leve"},
        { code: 15, status : "soprando neve"},
        { code: 16, status : "neve"},
        { code: 17, status : "granizo"},
        { code: 18, status : "granizo"},
        { code: 19, status : "poeira"},
        { code: 20, status : "nevoeiro"},
        { code: 21, status : "neblina"},
        { code: 22, status : "esfumaçado"},
        { code: 23, status : "tempestuoso"},
        { code: 24, status : "ventoso"},
        { code: 25, status : "frio"},
        { code: 26, status : "nublado"},
        { code: 27, status : "muito nublado (noite)"},
        { code: 28, status : "muito nublado (dia)"},
        { code: 29, status : "parcialmente nublado (noite)"},
        { code: 30, status : "parcialmente nublado (dia)"},
        { code: 31, status : "claro (noite)"},
        { code: 32, status : "ensolarado"},
        { code: 33, status : "feira (noite)"},
        { code: 34, status : "feira (dia)"},
        { code: 35, status : "chuva e granizo misturados"},
        { code: 36, status : "quente"},
        { code: 37, status : "trovoadas isoladas"},
        { code: 38, status : "trovoadas dispersas"},
        { code: 39, status : "chuveiros dispersos (dia)"},
        { code: 40, status : "chuva forte"},
        { code: 41, status : "pancadas de neve espalhadas (dia)"},
        { code: 42, status : "neve pesada"},
        { code: 43, status : "nevasca"},
        { code: 44, status : "não disponível"},
        { code: 45, status : "chuveiros dispersos (noite)"},
        { code: 46, status : "pancadas de neve dispersas (noite)"},
        { code: 47, status : "chuveiros espalhados"},
    ];
    var status = statuses.find(elemento => elemento.code == code);

    return status ? status.status : 'Não disponível';
}

/**
 * Traduz dia da semana do yahoo.
 * @param dia
 * @returns {*}
 */
var getDiaDaSemana = function (dia) {
    let dias = [
        {day: "Sun", text : "Dom"},
        {day: "Mon", text : "Seg"},
        {day: "Tue", text : "Ter"},
        {day: "Wed", text : "Qua"},
        {day: "Thu", text : "Qui"},
        {day: "Fri", text : "Sex"},
        {day: "Sat", text : "Sáb"},
    ];
    var dia = dias.find(elemento => elemento.day == dia);

    return dia ? dia.text : '-';
}

/**
 * Aplicação vue.
 */
var app = new Vue({
    el: '#app',
    data : {
        cityLoaded : false,
        cityLoading : false,
        capitalsLoaded : 0,
        cityName : '',
        loadedCity : {
            city : '',
            country : '',
            region : '',
            current : {
                max : 0,
                min : 0,
                sensacao : 0,
                windSpeed : 0,
                humidity : 0,
                temperature : 0,
                text : '',
            },
            /**
             * [{day, min, max}]
             */
            nextDays : [

            ]
        },
        capitais : {
            riojaneiro : { min : '?', max : '?'},
            saopaulo : { min : '?', max : '?'},
            belohorizonte : { min : '?', max : '?'},
            brasilia : { min : '?', max : '?'},
            belem : { min : '?', max : '?'},
            salvador : { min : '?', max : '?'},
            curitiba : { min : '?', max : '?'},
            fortaleza : { min : '?', max : '?'},
            manaus : { min : '?', max : '?'},
            joaopessoa : { min : '?', max : '?'},
        }
    },
    created : function () {
        // Start loading the capitals
        this.updateCapital('riojaneiro', 'Rio De Janeiro');
        this.updateCapital('saopaulo', 'São Paulo');
        this.updateCapital('belohorizonte', 'Belo Horizonte');
        this.updateCapital('brasilia', 'Brasilia');
        this.updateCapital('belem', 'Belém');
        this.updateCapital('salvador', 'Salvador');
        this.updateCapital('curitiba', 'Curitiba');
        this.updateCapital('fortaleza', 'Fortaleza');
        this.updateCapital('manaus', 'Manaus');
        this.updateCapital('joaopessoa', 'João Pessoa');
    },
    methods : {
        lookUpCity : function () {
            // Obtem valor da cidade
            console.log(this.cityName);
            this.cityLoaded = false;
            this.cityLoading = true;
            getYahooApi(credentials, this.cityName, this.updateCityCard);
        },
        updateCityCard : function (jsonData) {
            console.log(jsonData);
            let hoje = jsonData.forecasts.shift();

            this.loadedCity.city = jsonData.location.city;
            this.loadedCity.country = jsonData.location.country;
            this.loadedCity.region = jsonData.location.region;
            this.loadedCity.current.humidity = jsonData.current_observation.atmosphere.humidity;
            this.loadedCity.current.windSpeed = jsonData.current_observation.wind.speed;
            this.loadedCity.current.temperature = jsonData.current_observation.condition.temperature;
            this.loadedCity.current.min = hoje.low;
            this.loadedCity.current.max = hoje.high;
            this.loadedCity.current.sensacao = jsonData.current_observation.wind.chill;
            this.loadedCity.current.text = getTranslatedStatus(jsonData.current_observation.condition.code);

            this.loadedCity.nextDays = [];
            for(var i = 0; i < 5; i++) {
                let dia = jsonData.forecasts[i];
                this.loadedCity.nextDays.push({day : getDiaDaSemana(dia.day), min : dia.low, max : dia.high});
            }

            this.cityLoading = false;
            this.cityLoaded = true;
        },
        unloadCity : function () {
            this.cityLoaded = false;
        },
        updateCapital : function (capitalKey, capitalName) {
            getYahooApi(credentials, capitalName, (jsonData) => {
                this.capitais[capitalKey].min = jsonData.forecasts[0].low;
                this.capitais[capitalKey].max = jsonData.forecasts[0].high;
                this.capitalsLoaded++;
            }, (error) => {
                alert('Erro ao atualizar uma das capitais!');
            });
        },
    }
})