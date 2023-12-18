const correios = require('brazuka-correios')
 
correios.rastrearObjeto('NB938468680BR').then(function(res){
    console.log(res)
})