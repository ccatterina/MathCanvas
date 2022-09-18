        
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
     * definisce gli assi x,y, la scala, e altri parametri.
     * @param  {int}  xmin   x minima del grafico
     * @param  {int}  xmax   x massima del grafico
     * @param  {int}  ymin   y minima del grafico
     * @param  {int}  ymax   y massima del grafico 
     * @return {axes}   axes   struttura contenente tutti i parametri descrittivi degli assi
     */
    function defineAxes(xmin,xmax,ymin,ymax){
		  var axes={};
      axes.interval_x=xmax-xmin;
      axes.interval_y=ymax-ymin;
      axes.step_x=axes.interval_x/WIDTH;
      axes.step_y=axes.interval_y/HEIGHT;
      axes.scale_x=1/axes.step_x;
      axes.scale_y=1/axes.step_y;
      axes.ymin=ymin;
      axes.ymax=ymax;
      axes.xmin=xmin;
      axes.xmax=xmax;
      axes.y0=(xmin<0 && xmax>0)?-xmin*axes.scale_x:-1;
      axes.x0=(ymin<0 && ymax>0)?HEIGHT+ymin*axes.scale_y:-1;
      axes.xmin_px=xmin*axes.scale_x;
      axes.ymin_px=-ymin*axes.scale_y;
      axes.rapp_scala=axes.scale_y/axes.scale_x;
      return axes;
		}

        /**
     * disegna gli assi nel canvas
     * @param  {context} ctx  [context del canvas]
     * @param  {axes} axes [assi]
     * @param  {int} zoom [fattore moltiplicativo di unità di asse]
     */
    function drawAxes(ctx,axes,zoom) 
    {
      var axis_int=findRightStep(axes.interval_x);
      ctx.beginPath();
      ctx.strokeStyle="black";
      ctx.lineWidth=1;
      var x_px=axes.x0!=-1?axes.x0:HEIGHT-2; 
      ctx.moveTo(0,x_px);
      ctx.lineTo(WIDTH,x_px);
      ctx.stroke(); 
      for(var px=1;px<=WIDTH;px++){
        var xx=(px+axes.xmin_px)/axes.scale_x;
        var xx_pre=(px-1+axes.xmin_px)/axes.scale_x;
        var xx_post=(px+1+axes.xmin_px)/axes.scale_x;
        if (Math.abs(xx%axis_int.step)<Math.abs(xx_pre%axis_int.step) && Math.abs(xx%axis_int.step)<Math.abs(xx_post%axis_int.step)){
          ctx.beginPath();
          ctx.fillStyle="black";
          ctx.font="10px Georgia black";
          ctx.moveTo(px,x_px+2);
          ctx.lineTo(px,x_px-2);
          ctx.stroke();
          ctx.beginPath();
          if (axis_int.decimal>=0)
            ctx.fillText(""+Math.round(xx*Math.pow(10,axis_int.decimal))/Math.pow(10,axis_int.decimal),px-4,x_px-5 );
          else
            ctx.fillText(""+Math.round(xx),px-4,x_px-5 );
          ctx.fill();
        }
      }
      axis_int=findRightStep(axes.interval_y);
      var y_px=axes.y0!=-1?axes.y0:2;
      ctx.moveTo(y_px,0);
      ctx.lineTo(y_px,HEIGHT);
      ctx.stroke();
      for(var px=1;px<=HEIGHT;px++){
        var yy=(HEIGHT-axes.ymin_px-px)/axes.scale_y;
        var yy_pre=(HEIGHT-(axes.ymin_px)-px-1)/axes.scale_y;
        var yy_post=(HEIGHT-(axes.ymin_px)-px+1)/axes.scale_y;
        if (Math.abs(yy%(axis_int.step))<Math.abs(yy_pre%(axis_int.step/2)) && Math.abs(yy%(axis_int.step/2))<Math.abs(yy_post%(axis_int.step/2))){
          if (yy!=0){
            ctx.beginPath();
            ctx.fillStyle="black";
            ctx.font="10px Georgia black";
            ctx.moveTo(y_px-2,px);
            ctx.lineTo(y_px+2,px);
            ctx.stroke();
            ctx.beginPath();
            if (axis_int.step<1)
              ctx.fillText(""+Math.round(yy*Math.pow(10,axis_int.decimal+2))/Math.pow(10,axis_int.decimal+2)*zoom,y_px+5,px-4);
            else
              ctx.fillText(""+Math.round(yy)*zoom,y_px+5,px-4);
            ctx.fill();
          }
        }
      }
    }
    /**
     * Si occupa di ricercare lo step più corretto per il disegno degli assi
     * @param  {Double} interval intervallo tra minimo e massimo dell'asse
     * @return {Axis_int} axis_int  
     */
    function findRightStep(interval){
      var axis_int={};
      var decimal=0;
      
      //Primo sistema utilizzato, funzionante da 0.001 a 1000
      if (interval<0.001) decimal=4; else
      if (interval<0.01) decimal=3; else
      if (interval<0.1) decimal=2; else
      if (interval<1) decimal=1; else
      if (interval<10) decimal=0; else
      if (interval<100) decimal=-1; else
      if (interval<1000) decimal=-2; 

      //nuovo sistema implementato, funziona per ogni intervallo
      /*if (interval<=1)
        decimal=Math.log(orderOfMagnitude(1/interval))+1;
      else
        decimal=-Math.log(orderOfMagnitude(interval))+1;
      */

      axis_int.decimal=decimal;
      var step=(decimal>=0)?Math.ceil(interval/10*Math.pow(10,decimal))/(Math.pow(10,decimal)):Math.ceil(interval/(10*(-decimal)));
      axis_int.step=step;
      return axis_int;
    } 
    /**
     * Ritorna l'ordine di grandezza del numero numero passato
     * @param  {Dounle} n 
     * @return {Int} ordine di grandezza
     */
    function orderOfMagnitude(n){
      var order = Math.floor(Math.log(n) / Math.LN10 + 0.000000001); 
      return Math.pow(10,order);
    }
    
      /**
     * Disegna la funzione statica sul canvas
     * @param  {context}  ctx   context del canvas
     * @param  {axes}   axes  assi su cui disegnare la funzione
     * @param  {String}   func  funzione da disegnare
     * @param  {String}   color colore della funzione in stringa rgb
     * @param  {int}    thick spessore della funzione in pixel
     */
    function drawFunc (ctx,axes,func,color,thick) 
    { 
      var dom={};
      dom.last_pixel=WIDTH;
      dom.first_pixel=0;
      /*
      ctx.lineWidth = thick;
      ctx.strokeStyle = color;*/
      var first_found = false;
      for (var i=0;i<=WIDTH;i++) {
        px = i;xx=i+axes.xmin_px; yy = axes.scale_y*Parser.evaluate(func, { x: (xx/axes.scale_x) }); 
        if (isNaN(yy)){
          ctx.beginPath();
          ctx.fillStyle =  "rgba(11, 13, 15, 0.3)";
          ctx.fillRect(px,0,1,HEIGHT);
          ctx.fill();
          ctx.closePath();
        }else{
          if (!first_found)
            dom.first_pixel=px;
          first_found=true;
          dom.last_pixel=px;
        }
        ctx.beginPath();
        ctx.fillStyle =  "black";
        ctx.arc(px,HEIGHT-axes.ymin_px-yy,2,0,2*Math.PI);
        /*if (px==0) ctx.moveTo(px,HEIGHT-axes.ymin_px-yy);
        else         ctx.lineTo(px,HEIGHT-axes.ymin_px-yy);*/
        ctx.fill();
        ctx.closePath();
      }
      
      return dom; 
    }
    /**
     * Studio dei valori massimi e minimi della derivata
     * @param  {String} func funzione da studiare
     * @param  {Axes} axes Assi
     * @param  {Dom} dom  Dominio della funzione
     * @return {Codom} Valor massimo e minimo della funzione derivata nel range di x
     */
    function studyDerivative(func,axes,dom){
      var codom={}
      codom.min=(Parser.evaluate(func, { x: (axes.xmin_px+dom.first_pixel+0.05*(axes.xmax*axes.scale_x-axes.xmin_px))/axes.scale_x+0.0000001 }) - Parser.evaluate(func, { x: (axes.xmin_px+dom.first_pixel+0.05*(axes.xmax*axes.scale_x-axes.xmin_px))/axes.scale_x }))/0.0000001;
      if (codom.min==null ||isNaN(codom.min)||!isFinite(codom.min))
        codom.min=0;
      codom.max=codom.min;
      for (var i=axes.xmin_px+dom.first_pixel+0.05*(axes.xmax*axes.scale_x-axes.xmin_px);i<axes.xmax*axes.scale_x;i++){
        var derivative=(Parser.evaluate(func, { x: i/axes.scale_x+0.0000001 }) - Parser.evaluate(func, { x: i/axes.scale_x }))/0.0000001; //valore della derivata moltiplicata per la scala (in pixel)
        if(derivative!=null && !isNaN(derivative) && isFinite(derivative)){
           //&& ((derivative-codom.max)*axes.scale_y)<(0.1*HEIGHT/2)
           //&& (Math.abs(derivative-codom.min)*axes.scale_y) <(0.1*HEIGHT/2)
        codom.max=derivative>codom.max?derivative:codom.max;
        codom.min=derivative<codom.min?derivative:codom.min;
        }
      }
      codom.min.toFixed(10);
      codom.max.toFixed(10);
      return codom;
    }

    /**
     * Studio dei valori dell'integrale improprioo
     * @param  {String} func  funzione da studiare
     * @param  {Axes} axes  Assi
     * @param  {String} speed Velocità di integrazione
     * @return {Integral}       Struct che contiene valori e parametro  di correzione dell'asse y
     */
    function studyImproperIntegral(func,axes,speed){
      var integral={};
      integral.total_area=0;
      integral.max_area=0;
      integral.values=new Array()
      integral.y_axes_correction=1;
      for (var i=0;i<WIDTH/2;i++){
        if (!isNaN(Parser.evaluate(func, { x: i/axes.scale_x })) && isFinite(Parser.evaluate(func, { x: i/axes.scale_x })))
          if (speed=="a=-b^2"){ 
              integral.total_area+=(1/axes.scale_x*Parser.evaluate(func, { x: (i+1)/axes.scale_x })+Math.abs(Math.pow(i/axes.scale_x,2)-Math.pow((i+1)/axes.scale_x,2))/2*(Parser.evaluate(func,{ x: -Math.pow((-i-1)/axes.scale_x,2) })+Parser.evaluate(func,{ x: -Math.pow((-i)/axes.scale_x,2) })));
              //alert(Math.abs(Math.pow(i/axes.scale_x,2)-Math.pow((i+1)/axes.scale_x,2))/2*(Parser.evaluate(func,{ x: -Math.pow((-i-1)/axes.scale_x,2) })+Parser.evaluate(func,{ x: -Math.pow((-i)/axes.scale_x,2) })));
          }
          else integral.total_area+=1/axes.scale_x*Parser.evaluate(func, { x: (i+1)/axes.scale_x })+1/axes.scale_x*Parser.evaluate(func, { x: (-i-1)/axes.scale_x });
        integral.max_area=Math.abs(integral.total_area)>Math.abs(integral.max_area)?Math.abs(integral.total_area):integral.max_area;
        integral.values[i]=integral.total_area;
      }
      if((HEIGHT/2)/axes.scale_y<integral.max_area){
        integral.y_axes_correction=Math.ceil(integral.max_area/((HEIGHT/2)/axes.scale_y))
      }
      return integral;
    }

   /**
     * Studio dei valori dell'integrale 
     * @param  {String} func  funzione da studiare
     * @param  {Axes} axes  Assi
     * @return {Integral}       Struct che contiene valori e parametro  di correzione dell'asse y
     */
    function studyIntegral(func,axes){
      var integral={};
      integral.total_area=0;
      integral.max_area=0;
      integral.values=new Array()
      integral.y_axes_correction=1;
      for (var i=axes.xmin_px;i<axes.xmax*axes.scale_x;i++){
        if (!isNaN(Parser.evaluate(func, { x: i/axes.scale_x })) && isFinite(Parser.evaluate(func, { x: i/axes.scale_x })))
          integral.total_area+=1/axes.scale_x*Parser.evaluate(func, { x: i/axes.scale_x });
        integral.max_area=Math.abs(integral.total_area)>Math.abs(integral.max_area)?Math.abs(integral.total_area):integral.max_area;
        integral.values[Math.round(i-axes.xmin_px)]=integral.total_area;
      }

      if((HEIGHT/2)/axes.scale_y<integral.max_area){
        integral.y_axes_correction=Math.ceil(integral.max_area/((HEIGHT/2)/axes.scale_y))
      }
      return integral;
    } 
    /**
     * Controlla se la funzione è limitata
     * @param  {String}  func funzione da controllar
     * @param  {Axes}  axes assi
     * @return {Boolean}      true se la funzione è limitata / false se è illimitata (nel range di x)
     */
    function isLimited(func,axes){
      for (var i=axes.xmin_px;i<axes.xmax*axes.scale_x;i++)
        if (!isFinite(Parser.evaluate(func, { x: i/axes.scale_x })) && !isNaN(Parser.evaluate(func, { x: i/axes.scale_x }))){
          return false;

        }
      return true;
    }

