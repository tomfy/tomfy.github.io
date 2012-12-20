var tile_size = 72; // tile size is tile_size x tile_size pixels.
var columns = 4; // number of columns of squares
var rows = 5; // number of rows of squares
//var canvas;
//var ctx;
// var font_size = 32;
var offset_x = tile_size/2; // position of puzzle bounding rectangle UL corner rel to canvas UL corner.
var offset_y = tile_size/2;
var dc = false;
var heavy_line_width = 4; 

var n_steps = 0;

function load(){

    if(dc){return}

    var canvas = document.getElementById("the_canvas");
    
    canvas.width = 100;

    //   ctx = canvas.getContext("2d");   
    // ctx.font = font_size + "px Arial";
    //  ctx.textAlign="center";
    //   ctx.textBaseline="middle";

    var factors = [1,2,3,5,7,11,13,2,3];   
    shuffle(factors);

    console.log("xxx: " + canvas.getContext("2d").font);
    var the_puzzle_obj = new fs_puzzle_3x3(tile_size, offset_x, offset_y, factors, canvas);
    the_puzzle_obj.display();
    console.log("yyy: " + canvas.getContext("2d").font);
    canvas.onclick = function(event){handle_canvas_click(event, canvas, the_puzzle_obj)};
    canvas.oncontextmenu = function(event){handle_canvas_click(event, canvas, the_puzzle_obj)};
    
    
} // end of function load

function shuffle(array){ // randomize order of elements in array
    var length = array.length;
    var i,j;
    for(i=0; i<length; i++){
	for(j=0; j<length; j++){
	    var tmp = array[j];
	    var k =  Math.floor( Math.random() * length );
	    array[j] = array[k];
	    if(Math.random() < 0.6){ // swap two elements
		array[k] = tmp;
	    }else{ // 3-way swap
		var l = Math.floor( Math.random() * length );
		array[k] = array[l];
		array[l] = tmp;
	    }
	}
    }
}

// ****************************************************************

function fs_puzzle_3x3(tile_size, x_offset, y_offset, factors, canvas)
{

    this.tile_size = tile_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.factors = factors;
    this.rows = 3;
    this.columns = 3;
    this.answer_boxes = new HashTable({});
    this.clue_boxes = new HashTable({});
    this.canvas = canvas;
    console.log("canv width: " + canvas.width);
    canvas.width = (this.columns+2) * tile_size;
    canvas.height = (this.rows+3) * tile_size;

    this.n_factors_entered = 0;
    this.n_correct_factors = 0; 
    this.n_factor_clues_used = 0;

    this.n_products_entered = 0;
    this.n_correct_products = 0;
    this.n_product_clues_used = 0;
    

    // this.ctx = canvas.getContext("2d");
    //    console.log("cntxt font: " + ctx);

    this.ctx = canvas.getContext("2d");   
    this.ctx.font = 32 + "px Arial";
    //    console.log("font_size: " + font_size );
    console.log("ctx.font: " + this.ctx.font);
    
    this.ctx.textAlign="center";
    this.ctx.textBaseline="middle";

    //    this.answers = new Array();
    console.log(this);
    // 3x3 answer boxes.
    for(var i=1; i<=this.rows; i++){
	//	this.answers[i] = new Array();
	for(var j=1; j<=this.columns; j++){
	    var key = j + "," + i;
	    var factor_index = (this.columns*(i-1) + (j-1)) % this.factors.length;
	    var the_factor = this.factors[factor_index];
	    
	    var the_answer_box = new clue_box(this.tile_size, this.x_offset + j*tile_size, this.y_offset + i*tile_size, 
					      the_factor, false, canvas, this);
	    this.answer_boxes.setItem(key, the_answer_box ); 
	}
    }
    
    // clue boxes - rows
    for(var i=1; i<=this.rows; i++){
	var row_product = 1;
	for(var j=1; j<=this.columns; j++){
	    var abox = this.answer_boxes.getItem(j + "," + i);
	    row_product *= abox.number;
	}
	var the_clue_box = new clue_box(this.tile_size, this.x_offset, this.y_offset + i*tile_size, 
					row_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( 0 + "," + i, the_clue_box ); 
    }
    // clue boxes - columns
    for(var i=1; i<=this.columns; i++){
	var col_product = 1;
	for(var j=1; j<=this.rows; j++){
	    var abox = this.answer_boxes.getItem(i + "," + j);
	    col_product *= abox.number;
	}
	var the_clue_box = new clue_box(this.tile_size,
					this.x_offset + i*tile_size, (this.rows+1)*tile_size + this.y_offset, 
					col_product, false, canvas, this);
	//   the_box.show();
	console.log("after the_box.show()");
	this.clue_boxes.setItem( i + "," + (this.rows+1), the_clue_box ); 
    }
    // clue boxes - diagonals
    var col_product = 1;
    for(var i = 1; i<=3; i++){
	col_product *= this.answer_boxes.getItem(i + "," + i).number;
    }
    var diag1_clue_box = new clue_box(this.tile_size, this.x_offset, this.y_offset, 
				      col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + 0, diag1_clue_box ); 
    col_product = 1;
    for(var i = 1; i<=3; i++){
	col_product *= this.answer_boxes.getItem(i + "," + (4-i)).number;
    }
    var diag2_clue_box = new clue_box(this.tile_size, this.x_offset, (this.rows+1)*tile_size + this.y_offset, 
				      col_product, false, canvas, this);
    this.clue_boxes.setItem( 0 + "," + (this.rows+1), diag2_clue_box ); 
    // ******************************************************************************
    // methods:

    this.update_score = function(){
	for (var box_coord in this.clue_boxes.items) {
	    if (this.clue_boxes.hasItem(box_coord)) {
	//	this.clue_boxes.items[box_coord].show_box();

		this.n_factors_entered = 0;
		this.n_correct_factors = 0; 
		this.n_factor_clues_used = 0;
	    }
	}
	for (var box_coord in this.answer_boxes.items) {
	    if (this.answer_boxes.hasItem(box_coord)) {
	//	this.answer_boxes.items[box_coord].show_box();

		this.n_products_entered = 0;
		this.n_correct_products = 0; 
		this.n_product_clues_used = 0;
	    }
	}
    }
    this.display = function(){ // show whole puzzle, showing texts or not as indicated by text_shown

	this.ctx.lineWidth=4; // heavy_line_width; // heavy box (holds the answer cells)
	this.ctx.strokeRect(x_offset + tile_size, y_offset + tile_size, 3*tile_size, 3*tile_size);
	this.ctx.lineWidth=2;
	for (var box_coord in this.clue_boxes.items) {
	    if (this.clue_boxes.hasItem(box_coord)) {
		this.clue_boxes.items[box_coord].show_box();
	    }
	}
	for (var box_coord in this.answer_boxes.items) {
	    if (this.answer_boxes.hasItem(box_coord)) {
		this.answer_boxes.items[box_coord].show_box();
	    }
	}
    }

    this.show_box_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	console.log("top of show_a_box");
	if(this.clue_boxes.hasItem(box_coord)){	    
	    var abox = this.clue_boxes.items[box_coord];
	    abox.text_shown = true;
	    abox.show_box();
	}else if(this.answer_boxes.hasItem(box_coord)){	    
	    var abox = this.answer_boxes.items[box_coord];
	    abox.text_shown = true;
	    abox.show_box();
	}
    }
    this.hide_box_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.clue_boxes.hasItem(box_coord)){
	    console.log("in hide_a_box");
	    var abox = this.clue_boxes.items[box_coord];
	    abox.text_shown = false;
	    abox.show_box();
	}else if(this.answer_boxes.hasItem(box_coord)){	    
	    var abox = this.answer_boxes.items[box_coord];
	    abox.text_shown = true;
	    abox.show_box();
	}
    }
    this.toggle_box_text = function(ix, iy){
	var box_coord = ix + ',' + iy;
	if(this.clue_boxes.hasItem(box_coord)){
	    this.clue_boxes.items[box_coord].toggle_text();
	}else if(this.answer_boxes.hasItem(box_coord)){
	    this.answer_boxes.items[box_coord].toggle_text();
	}
    }
    this.input_box_number= function(ix, iy){
		var box_coord = ix + ',' + iy;
	if(this.clue_boxes.hasItem(box_coord)){
	    this.clue_boxes.items[box_coord].input_number();
	}else if(this.answer_boxes.hasItem(box_coord)){
	    this.answer_boxes.items[box_coord].input_number();
	}
    }


} // end of fs_puzzle_3x3

// ********************************************************

// a clue_box has a rectangle containing a number, which can be shown or hidden
function clue_box(box_size, x_offset, y_offset, number, text_shown, canvas, puzzle){
    this.box_size = box_size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.number = number;
    this.text_shown = text_shown;
    var the_box = this;
    this.user_input_value = undefined;
    this.count_inputs = 0;

    var canvas_margin_etc = 
	parseFloat(canvas.style.margin) + 
	parseFloat(canvas.style.padding) + 
	parseFloat(canvas.style.border);

    this.ctx = canvas.getContext("2d");
    console.log("Context font: ", this.ctx.font);

    this.text_x = this.x_offset + this.box_size/2;
    this.text_y = this.y_offset + (0.5 - 0.0)*this.box_size;

    this.show_box = function(){
	this.ctx.strokeStyle = "#000000";
	this.ctx.strokeRect( this.x_offset, this.y_offset, this.box_size, this.box_size);
	if(this.text_shown){
	    this.ctx.fillStyle = "#000000";
	    this.ctx.fillText(this.number, this.text_x, this.text_y);
	}
    }
    this.show_text = function (){
	this.ctx.fillStyle = "#000000";
	this.ctx.fillText(this.number, this.text_x, this.text_y);
	this.text_shown = true;
    }
   this.show_input_value = function (){
	this.ctx.fillStyle = "#008800";
	this.ctx.fillText(this.user_input_value, this.text_x, this.text_y);
	this.text_shown = true;
    }
    this.hide_text = function(){
	console.log("In number_box.hid.");
	this.ctx.strokeStyle = "#FFFFFF";
	this.ctx.fillStyle = "#FFFFFF";
	this.ctx.fillRect( this.x_offset+5, this.y_offset+5, this.box_size-10, this.box_size-10);
	this.text_shown = false;
    }
    this.toggle_text = function(){
	if(this.text_shown){
	    this.hide_text();
	}else{
	    this.show_text();
	}
    }
    this.input_number = function(){
  var width_coeff = 0.64;
    var ac = document.createElement("input");
    ac.style.width = Math.floor(width_coeff*box_size) + "px";
    ac.type = "text";
    ac.style.size = 0; // Math.floor(0.1*box_size)
    ac.className = "text";
    ac.addEventListener("keypress", function(event){
	if(event.charCode == 13){
  console.log("Input value: ", this.value);
	    this.blur();
	    the_box.user_input_value = this.value;
	   document.body.removeChild(ac);
	    the_box.show_input_value();	 
	    the_box.count_inputs++;
	    puzzle.update_score(); // 4*n_right_factor_answers + 2*n_right_clue_answers - (3*n_clues_shown + 2*n_answers_input + n_clues_input)
	}
    }, false);
    ac.addEventListener("onblur", function(event){
	console.log("ZZZZZZZ input element value: ", ac.value);
    }, false);
    ac.style.font = this.ctx.font; // font_size + " px Arial";
    console.log("ac.style.font: " + ac.style.font);
    ac.style.top = (this.y_offset + canvas_margin_etc + 0.28*this.box_size ) + "px";
    ac.style.left = (this.x_offset + canvas_margin_etc + (0.58 - width_coeff/2)*this.box_size ) + "px"
    document.body.appendChild(ac);
	console.log("in function input_number!!!!");
	ac.focus(); // give focus to this input element
    }

}

function handle_canvas_click(event, canvas, puzzle_obj){
    console.log("puzzleobj tilesize: " + puzzle_obj.tile_size);
    var canvas_margin_etc = 
	parseFloat(canvas.style.margin) + 
	parseFloat(canvas.style.padding) + 
	parseFloat(canvas.style.border); // assuming all 4 margins, etc. are equal

    // use event.pageX to get position relative to the upper left hand corner of page. clientX gives coords rel to 
    // upper left corner of visible area of window. So if there is, for example, a word which moves up and down as you scroll
    // clientX when you click on that word will change as you scroll, but pageX when you click on that word will be the same.


    this.x = event.pageX - canvas_margin_etc; // location of mouse click in canvas coords
    this.y = event.pageY - canvas_margin_etc;
    console.log("mouse x,y rel to canvas UL corner: " + this.x + " " + this.y);
    this.puzzle_obj = puzzle_obj;
    var dx0 = (this.x - (offset_x + 0.5*tile_size)); // distance from center of first square
    var dy0 = (this.y - (offset_y + 0.5*tile_size));
    
    var ix =  Math.round(dx0/tile_size);
    var iy =  Math.round(dy0/tile_size);
    console.log(ix + "  " + iy);
    var dx = dx0 - ix*tile_size; // distance from nearest center.
    var dy = dy0 - iy*tile_size;
    // alert("dx: " + dx + " dy: " + dy);
    if(Math.abs(dx) > 0.47*tile_size){ return; }
    if(Math.abs(dy) > 0.47*tile_size){ return; }
    //    ctx.fillText(ix+','+iy , this.x, this.y);
    console.log("ix: " + ix + "; iy: " + iy);
    console.log("event type: " + event.type);
    if(event.type == 'click'){
    puzzle_obj.show_box_text(ix, iy);
    }else if(event.type == 'contextmenu'){
	puzzle_obj.input_box_number(ix, iy);
 event.preventDefault();
    }
    //    puzzle_obj.toggle_box_text(ix, iy); 

}
