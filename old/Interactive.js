
	function getPosition(event)
	{
	if(!$("#start").prop("disabled")){
	var x = new Number();
	var y = new Number();
	var canvas = document.getElementById("BackgroundFunction");
	var menu=document.getElementById("menu");
	var col=document.getElementById("col1")
	if (event.x != undefined && event.y != undefined)
	{
	  x = event.pageX;
	  y = event.pageY;
	}
	else // Firefox method to get the position
	{
	  x = event.clientX + document.body.scrollLeft +
		  document.documentElement.scrollLeft;
	  y = event.clientY + document.body.scrollTop +
		  document.documentElement.scrollTop;
	}

	if (col.offsetWidth+canvas.offsetWidth<$(window).width())
		x-= canvas.offsetLeft+col.offsetWidth+col.offsetLeft;
	else
		x-= canvas.offsetLeft;
	y-= canvas.offsetTop+menu.offsetHeight+menu.offsetTop;
		
	
	mouseX=x;
	mouseY=y;
	drawInteractive(mouseX,mouseY);
	}
  	}
  function drawSelector(ctx,canvas,closed,first_x_perc,first_y_perc,sec_y_perc){
	ctx.beginPath();
	ctx.strokeStyle ="black";
	ctx.moveTo(canvas.width*first_x_perc,canvas.height*first_y_perc);
	if (closed)
		ctx.lineTo(canvas.width*first_x_perc,canvas.height*sec_y_perc);
	else
		ctx.lineTo(canvas.width*(first_x_perc-0.02),canvas.height*(sec_y_perc+0.01));
	ctx.moveTo(canvas.width*first_x_perc,canvas.height*first_y_perc);
	// ctx.arc(canvas.width*first_x_perc,canvas.height*first_y_perc, 5, 0, 2 * Math.PI, false);
	// ctx.fillStyle = 'black';
	// ctx.fill();
	ctx.closePath();
	ctx.stroke();
	}


