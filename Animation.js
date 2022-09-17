    
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

    /**
     * disegna il pallino che si muove lungo la funzione
     * @param  {Canvas} canvas canvas dove disegnare il pallino
     * @param  {Axes} axes assi della funzione
     * @param  {String} func funzione matematica
     */
    function drawXPoint(canvas,axes,func,dom){
      ctx=canvas.getContext("2d");
      ctx.clearRect(0,0,WIDTH,HEIGHT);
      xx=axes.xmin_px+dom.first_pixel+px_counter;
      yy=axes.scale_y*Parser.evaluate(func, { x: xx/axes.scale_x });
      ctx.beginPath();
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.arc(-axes.xmin_px+xx,HEIGHT-axes.ymin_px-yy,5,0,2*Math.PI);
      ctx.fill();
    }

    /**
     * Disegna il label X0 in corrispondenza del punto x0 nell'animazione del rapporto incrementale
     * @param  {Context} ctx  context del canvas
     * @param  {Axes} axes assi scelti dall'utente
     * @param  {Double} x0   punto x0
     */
    function drawX0label(ctx,axes,x0){
      //ricavo il pixel corrispondente a x0
      x0=-axes.xmin_px+x0*axes.scale_x;
      var y_axe=axes.x0!=-1?axes.x0:HEIGHT-2;
      ctx.beginPath();
      ctx.fillStyle="black";
      ctx.font="12px Georgia";
      ctx.moveTo(x0,y_axe+2);
      ctx.lineTo(x0,y_axe-2);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillText("x0",x0-5,y_axe+15);
      ctx.fill();
    }
 

      //--------------------------FUNZIONI PRINCIPALI--------------------------------------------------
        
        

      /**
       * Crea l'animazione scorrendo la funzione e disegnando le tangenti nei vari punti di essa.
       * @param  {context} 	ctxDer 	 context su cui disegnare la funzione derivata
       * @param  {context} 	ctx    	 context del canvas della funzione già disegnata con DrawFunc
       * @param  {Axes} 	axes   	   assi della funzione
       * @param  {String} 	func   	 funzione da disegnare
       * @param  {Axes} axes_2       assi della funzione derivata
       */
      function drawDerivative (ctxDer,ctx,axes,func,dom,axes_2) 
      {  
        xx=axes.xmin_px+dom.first_pixel+px_counter; //mi sposto di 1 pixel ogni 20 millisecondi
        var r=Math.round(((xx-axes.xmin_px)/WIDTH)*255);
        //circa ogni 200 millisecondi disegno una tangente
        
        ctx.beginPath();
        ctx.clearRect(0,0,WIDTH,HEIGHT);
        ctx.stroke();
        ctx.lineWidth=2;
	      var derivative=(Parser.evaluate(func, { x: xx/axes.scale_x+axes.interval_x*Math.pow(10,-8) }) - Parser.evaluate(func, { x: xx/axes.scale_x }))/(axes.interval_x*Math.pow(10,-8)); //derivata nel punto i (f(i+0.00001)-f(i))/0.00001
	      var m=derivative; 																								//coefficiente angolare della retta tangente nel punto i	
	      var q=Parser.evaluate(func, { x: xx/axes.scale_x })- derivative*xx/axes.scale_x; 												//coefficiente q della retta tangente nel punto i
	      ctx.beginPath();
	      ctx.strokeStyle=rgb(r,10,100);
	      //disegno la retta tangente
	      ctx.moveTo(((axes.ymin-q)/m)*axes.scale_x-axes.xmin_px,HEIGHT);
	      ctx.lineTo(((axes.ymax-q)/m)*axes.scale_x-axes.xmin_px,0);
	      ctx.stroke(); 

	      var scaled_derivative=axes_2.scale_y*(Parser.evaluate(func, { x: xx/axes.scale_x+(axes.interval_x*Math.pow(10,-8)) }) - Parser.evaluate(func, { x: xx/axes.scale_x }))/(axes.interval_x*Math.pow(10,-8)); //valore della derivata moltiplicata per la scala (in pixel)
	      ctxDer.beginPath();
	      ctxDer.fillStyle = rgb(r,10,100);       
	      //disegno la funzione derivata
	      ctxDer.arc(xx-axes.xmin_px,HEIGHT-axes_2.ymin_px-scaled_derivative,2,0,2*Math.PI);
	      ctxDer.fill();
      }

      /**
       * Disegna la derivata evidenziandone il segno
       * @param  {context} ctxDer context del canvas dove disegno la derivata
       * @param  {context} ctx    context del canvas animato
       * @param  {axes} axes   assi della funzione
       * @param  {string} func   funzione da disegnare
       * @param  {dom} dom    dominio della funzione
       * @param  {Axes} axes_2       assi della funzione derivata
       */
      function drawSign (ctxDer,ctx,axes,func,dom,axes_2) 
      {  
        var cpositivo=rgb(0,128,255);
        var cnegativo=rgb(255,51,51);
        xx=axes.xmin_px+dom.first_pixel+px_counter; //mi sposto di 1 pixel ogni 20 millisecondi partendo dall estremo sinistro della funzione
        ctx.beginPath();
        ctx.clearRect(0,0,WIDTH,HEIGHT);
        ctx.stroke();
        ctx.lineWidth=2;
        var derivative=(Parser.evaluate(func, { x: xx/axes.scale_x+(axes.interval_x*Math.pow(10,-8)) }) - Parser.evaluate(func, { x: xx/axes.scale_x }))/(axes.interval_x*Math.pow(10,-8)); //derivata nel punto i (f(i+0.00001)-f(i))/0.00001
        var m=derivative;                                                 //coefficiente angolare della retta tangente nel punto i  
        var q=Parser.evaluate(func, { x: xx/axes.scale_x })- derivative*xx/axes.scale_x;                        //coefficiente q della retta tangente nel punto i
        ctx.beginPath();
        ctx.strokeStyle=derivative>0?cpositivo:cnegativo; 
        //disegno la retta tangente
        ctx.moveTo(((axes.ymin-q)/m)*axes.scale_x-axes.xmin_px,HEIGHT);
        ctx.lineTo(((axes.ymax-q)/m)*axes.scale_x-axes.xmin_px,0);
        ctx.stroke();
    
        var scaled_derivative=axes_2.scale_y*(Parser.evaluate(func, { x: xx/axes.scale_x+(axes.interval_x*Math.pow(10,-8))}) - Parser.evaluate(func, { x: xx/axes.scale_x }))/(axes.interval_x*Math.pow(10,-8)); //valore della derivata moltiplicata per la scala (in pixel)
        ctxDer.beginPath();
        ctxDer.fillStyle = scaled_derivative>0?cpositivo:cnegativo;       
        //disegno la funzione derivata
        ctxDer.arc(xx-axes.xmin_px,HEIGHT-axes_2.ymin_px-scaled_derivative,2,0,2*Math.PI);
        ctxDer.fill();
      }
     
      /**
       * Disegna l'animazione del rapporto incrementale
       * @param  {Context} ctx  Context del canvas
       * @param  {Axes} axes    Assi della funzione
       * @param  {String} func  funzione matematica
       * @param  {Dom} dom      dominio della funzione
       * @param  {double} xfis  x0 (fissa)
       * @param  {double} xmob  x mobile
       */
      function drawDifferenceQuotient(ctx,axes,func,dom,xfis,xmob){
        ctx.clearRect(0,0,WIDTH,HEIGHT);
        xmob=(xfis<xmob)?xmob*axes.scale_x-px_counter:xmob*axes.scale_x+px_counter;
        xmob=xmob/axes.scale_x;
        var yfis=Parser.evaluate(func, { x: xfis });
        var ymob=Parser.evaluate(func, { x: xmob });
        var interval=(xfis-xmob)>0?xfis-xmob:xmob-xfis; 
        var functan="(x-("+xfis+"))/(("+xmob+")-("+xfis+"))*(("+ymob+")-("+yfis+"))+("+yfis+")"; //retta passante per 2 punti
        ctx.beginPath();
        var r=Math.round((px_counter)/(interval*axes.scale_x)*255);
        ctx.strokeStyle=rgb(r,10,100);
        ctx.lineWidth=2;
        ctx.moveTo(0,HEIGHT-axes.ymin_px-axes.scale_y*Parser.evaluate(functan, { x: axes.xmin }));
        ctx.lineTo(WIDTH,HEIGHT-axes.ymin_px-axes.scale_y*Parser.evaluate(functan, { x: axes.xmax }));
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle="black";
        ctx.arc(xfis*axes.scale_x-axes.xmin*axes.scale_x,HEIGHT-axes.ymin_px-yfis*axes.scale_y,5,0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle="black";
        ctx.arc(xmob*axes.scale_x-axes.xmin*axes.scale_x,HEIGHT-axes.ymin_px-ymob*axes.scale_y,5,0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
      }

     /**
       * Disegna l'animazione della funzione integrale
       * @param  {Context} ctxDer   Context funzione integrale
       * @param  {Context} ctx      Context funzione principale
       * @param  {Axes} axes      Assi funzione principale
       * @param  {String} func      Funzione matematica
       * @param  {Integral} integral  Valori e dati sull'integrale
       * @param  {Dom} dom       Dominio della funzione
       * @param  {Axes} axes_2      Assi della funzione Integrale
       */
      function drawIntegral (ctxDer,ctx,axes,func,integral,dom,axes_2) 
      {
        xx = axes.xmin_px + dom.first_pixel + px_counter;
        yy = HEIGHT - axes.ymin_px-axes.scale_y * Parser.evaluate(func, { x: xx/axes.scale });
        ctx.fillStyle = rgb(0,128,255);
        ctx.beginPath();
        //disegno l'area sottesa alla funzione 
        ctx.fillRect(xx - axes.xmin_px, HEIGHT - axes.ymin_px, 2, -axes.scale_y * Parser.evaluate(func, { x: xx/axes.scale_x }))
        ctx.fill();
        ctxDer.beginPath();
        ctxDer.fillStyle = rgb(0,128,255);
        //disegno la funzione integrale
        ctxDer.arc( -axes.xmin_px + xx, HEIGHT - axes_2.ymin_px - integral.values[Math.round(-axes.xmin_px+xx)] * axes_2.scale_y, 2, 0, 2 * Math.PI );
        ctxDer.fill();
      }

      /**
       * Disegna l'animazione dell'integrale improprio
       * @param  {Context} ctxDer   Context del canvas dei valori dell'integrale
       * @param  {Context} ctx      Context del canvas della funzione principale
       * @param  {Axes} axes        Assi della funzione principale
       * @param  {String} func      funzione principale
       * @param  {Integral} integral Valori e dati sull'integrale
       * @param  {Dom} dom      Dominio della funzione
       * @param  {String} speed    Velocità di integrazione
       * @param  {Axes} axes_2 Assi dove vengono disegnati i valori dell'integrale
       */
      function drawImproperIntegral (ctxDer,ctx,axes,func,integral,dom,speed,axes_2) 
      {
        xx=px_counter;
        xx2=px_counter
        yy=HEIGHT-axes.ymin_px-axes.scale_y*Parser.evaluate(func, { x: xx/axes.scale_x });
        ctx.fillStyle=rgb(0,128,255);
        ctx.beginPath();
        //disegno l'area sottesa alla funzione 
        ctx.fillRect(xx+WIDTH/2,HEIGHT-axes.ymin_px,2,-axes.scale_y*Parser.evaluate(func, { x: xx/axes.scale_x }));       
        ctx.fill();
        if(speed!="a=-b^2")
          ctx.fillRect(WIDTH/2-xx,HEIGHT-axes.ymin_px,2,-axes.scale_y*Parser.evaluate(func, { x: -xx/axes.scale_x }));
        else
          for (var i=0;i<=(Math.pow(((xx+1)/axes.scale_x),2)-Math.pow((xx/axes.scale_x),2))*axes.scale_x;i++){
             ctx.fillRect(WIDTH/2-Math.pow((xx/axes.scale_x),2)*axes.scale_x-i,HEIGHT-axes.ymin_px,2,-axes.scale_y*Parser.evaluate(func, { x: -Math.pow((xx/axes.scale_x),2)-i/axes.scale_x }))        
             ctx.fill();         
            }
          
        ctxDer.fillStyle = rgb(0,128,255);
        //disegno la funzione integrale
        
        ctxDer.beginPath();
        ctxDer.arc(WIDTH/2+px_counter,HEIGHT-axes_2.ymin_px-(integral.values[px_counter]*axes_2.scale_y),2,0,2*Math.PI);
        ctxDer.fill();
        
      }
