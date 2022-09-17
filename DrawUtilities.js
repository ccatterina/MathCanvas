		
/*
  Copyright 2015 Claudio Catterina
  distribuito secondo i termini della Licenza Pubblica Generica GNU
  
  This file is part of AnimazioniDerivataIntegrale.

  AnimazioniDerivataIntegrale is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  AnimazioniDerivataIntegrale is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with AnimazioniDerivataIntegrale.  If not, see <http://www.gnu.org/licenses/>
*/
    px_counter=0;


    /**
    * displayAlert rende visibile un pannello di allarme in caso di inserimento dati errato
    * @param {string} problem problema per cui visualizzare l'alert
    */
    function displayAlert(problem)
    {
      var error="";
      switch(problem)
      {
        case "axes_integral":
          error="Attenzione! X minimo e massimo sono errati: Xmin maggiore di Xmax e/o Xmin e Xmax diversi in valore assoluto."
          break;
        case "function":
          error='Attenzione! Funzione sintatticamente scorretta. <a href="http://silentmatt.com/javascript-expression-evaluator/">Consultare la documentazione</a>'
          break;
        case "axes":
          error="Attenzione! X minimo e massimo sono errati."
          break;
        case "min_max":
          error="Attenzione! X/Y minimo e/o massimo superano i limiti di -1000/+1000."
         break;
        case "xfis_xmob":
          error="Attenzione! X0 e/o X non rientrano nel range Xmin-Xmax"
         break;
       case "unlimited":
        error="Attenzione! Funzione non limitata."
       break;
      }
        var alert_content='<div class="alert alert-danger alert-dismissible" role="alert">'
                  +'<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
                  +'<strong>'+error
                  +'</div>';
        document.getElementById("alert").innerHTML=alert_content;        
    }
    /**
     * Visualizza/Nasconde ymax, ymin manuali per il secondo canvas
     */
    function showManAxes(){
      if ($('#check_man_axes').is(':checked')) 
         $('#manual_axes').html("<label for='ymin_2'>Y-min:</label>"
                +"<input type='number' id='ymin_2' value='-2.5' step='0.01' class='form-control' min='-1000'>"
                +"<label for='ymax_2'>Y-max:</label>"
                +"<input type='number' id='ymax_2' value='2.5' step='0.01' class='form-control' max='1000'>");
      else
        $("#manual_axes").html('');
    }
    /**
    * Genera una stringa rgb corrispondente al colore dato da r,g,b
    * @param  {int} r componente rossa (0-255)
    * @param  {int} g componente verde (0-255)
    * @param  {int} b componente blu   (0-255)
    * @return {String} stringa rgb
    */
    function rgb(r, g, b){
      return "rgb("+r+","+g+","+b+")";
    }

		/**
		 * Inserisce nel body un canvas
		 * @param  {String} 	id         id del canvas
		 * @param  {int} 		width      larghezza del canvas in pixel
		 * @param  {int} 		height     altezza del canvas in pixel
		 * @param  {int} 		top        distanza dal bordo superiore del body
		 * @param  {int} 		left       distanza dal bordo sinistro del body
		 * @param  {String} 	visibility visibilità del canvas (hidden/visible)
		 */
		function createCanvas(id,width,height,top,left,visibility){
			var canvas = document.createElement('canvas');
			canvas.id = id;
			canvas.width = width;
			canvas.height = height;
			canvas.style.zIndex = 8;
			canvas.style.position = "absolute";
			canvas.style.top=top+"px";
			canvas.style.left=left+"px";
			canvas.visibility=visibility;
			canvas.style.border = "1px solid";
			var div = document.getElementById("canvas_div");
			div.appendChild(canvas);
		}

    /**
     * Inverte la visibilità dei due canvas passati per parametro.
     * @param  {Canvas} canvas 
     * @param  {Canvas} buffer 
     */
    function flipCanvas(canvas,buffer){
      if (canvas.style.visibility=='hidden'){
        canvas.style.visibility='visible';
        buffer.style.visibility='hidden';
      }
      else
      {
        canvas.style.visibility='hidden';
        buffer.style.visibility='visible';
      }
    }
		
		/**
     * disegna le istruzioni per l'interazione con i canvas
     * @param  {Context} ctx Context del canvas
     * rimossa dalla versione 1.2
     */
   function drawInstruction(ctx){
      ctx.beginPath();
      ctx.fillStyle="rgba(0,0,0,0.4)";
      ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.fillStyle="black";
      ctx.font="20px Georgia black";
      ctx.fillText("Passare il mouse sulla funzione!",WIDTH/4,HEIGHT/4+25);
      ctx.fill();
   }

    /**
     * Ritorna il numero di decimali utili dopo la virgola
     * @param  {double} n numero da studiare
     * @return {int}   numero di decimali
     */
   function getDecimal(n){
      /*var s=n.toString().split(".");
      if(typeof s[1]=="undefined")
      var s=n.toString().split(",");
      if(typeof s[1]=="undefined")
        return 0;
      else
        return s[1].length;*/

      return -Math.floor(Math.log(Math.abs(n)) / Math.LN10 + 0.0000000000000000001)-1;
   }
