var gridSizeMinMax = [16, 64];
var gridSize = 32;

var blocks = { 
  "grass": [0, 0, 16, 16],
  "stone": [16, 0, 16, 16],
  "dirt": [32, 0, 16, 16],
  "grassydirt": [48, 0, 16, 16],
  "wood": [64, 0, 16, 16],
  "step": [80, 0, 16, 8],
  "cobblestone": [0, 16, 16, 16],
  "brick": [112, 0, 16, 16],
  "bedrock": [16, 16, 16, 16],
  "sand": [32, 16, 16, 16],
  "gravel": [48, 16, 16, 16],
  "stump": [80, 16, 16, 16],
  "goldore": [0, 32, 16, 16],
  "ironore": [16, 32, 16, 16],
  "coalore": [32, 32, 16, 16],
  "diamondore": [32, 48, 16, 16],
  "redstoneore": [48, 48, 16, 16],
  "glass": [16, 48, 16, 16],
  "mossycobblestone": [64, 32, 16, 16],
  "obsidian": [80, 32, 16, 16],
  "iron": [96, 16, 16, 16],
  "gold": [112, 16, 16, 16],
  "diamond": [128, 16, 16, 16],
  "toolbox": [176, 32, 16, 16],
  "sponge": [0, 48, 16, 16],
  "tnt": [128, 0, 16, 16],
  "rail-curve": [0, 112, 16, 16],
  "rail-straight": [0, 128, 16, 16]
};

function drawBlocks() {
  var img = document.getElementById("terrain");
  var g = blocks.grass;
  ctx.drawImage(img, g[0], g[1], g[2], g[3], 96, 96, gridSize + 1, gridSize + 1);

}

// Object to hold data for all drawn items
function Obj() {
  this.x = 0;
  this.y = 0;
  this.w = gridSize + 1; // default width and height?
  this.h = gridSize + 1;
  this.fill = 'transparent';
  this.name = 'grass';
  this.rotate = 0;
  this.flip = "none";
}

//Initialize a new Box, add it, and invalidate the canvas
function addObj(x, y, fill, name, rotate, flip) {
  var obj = new Obj;
  obj.x = x;
  obj.y = y;
  obj.fill = fill;
  obj.name = name;
  if(rotate !== undefined)
    obj.rotate = rotate;
  if(flip !== undefined)
    obj.flip = flip;
  objects.push(obj);
  invalidate();
}

// Create a new Object and create a tool out of it.  The default values for objects are good enough for tools.
function addTool(name, rotate, flip) {
  var tool = new Obj;
  tool.name = name;
  tool.rotate = rotate;
  tool.flip = flip;
  tools.push(tool);
  invalidate();
}

// holds all our live objects
var objects = []; 
// Holds the items in the toolbar
var tools = [];

var canvas;
var ctx;
var toolcanvas; // Toolbox canvas and context
var tctx;
var HEIGHT;
var WIDTH;
var VHEIGHT; // Viewport height and width
var VWIDTH;
var INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed

var isDrag = false;
var isScroll = false;
var mx, my; // mouse coordinates
var msx, msy; // mouse coordinates for old scroll position.

 // when set to true, the canvas will redraw everything
 // invalidate() just sets this to false right now
 // we want to call invalidate() whenever we make a change
var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned into an array
var mySel; 

// The currently selected tool.
var activeTool;
var oldActiveTool;

// The selection color and width. Right now we have a red selection with a small width
var mySelColor = 'orangered';
var mySelWidth = 2;

var gridColor = '#ccc';
var gridWidth = 1;

// we use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx; // fake canvas context
var ghosttoolcanvas;
var gtctx;

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
var toolboxStylePaddingLeft, toolboxStylePaddingTop, toolboxStyleBorderLeft, toolboxStyleBorderTop;

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function init() {
  canvas = document.getElementById('minedraft');
  sizeCanvas();
  ctx = canvas.getContext('2d');

  ghostcanvas = document.createElement('canvas');
  ghostcanvas.height = HEIGHT;
  ghostcanvas.width = WIDTH;
  gctx = ghostcanvas.getContext('2d');

  toolcanvas = document.getElementById('toolbox');
  tctx = toolcanvas.getContext('2d');
  ghosttoolcanvas = document.createElement('canvas');
  //ghosttoolcanvas.height = toolcanvas.height;
  //ghosttoolcanvas.width = toolcanvas.width;
  gtctx = ghosttoolcanvas.getContext('2d');
    
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.onselectstart = function () { return false; }
  
  // fixes mouse co-ordinate problems when there's a border or padding
  // see getMouse for more detail
  if (document.defaultView && document.defaultView.getComputedStyle) {
    stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  if (document.defaultView && document.defaultView.getComputedStyle) {
    toolboxStylePaddingLeft = parseInt(document.defaultView.getComputedStyle(toolcanvas, null)['paddingLeft'], 10)      || 0;
    toolboxStylePaddingTop  = parseInt(document.defaultView.getComputedStyle(toolcanvas, null)['paddingTop'], 10)       || 0;
    toolboxStyleBorderLeft  = parseInt(document.defaultView.getComputedStyle(toolcanvas, null)['borderLeftWidth'], 10)  || 0;
    toolboxStyleBorderTop   = parseInt(document.defaultView.getComputedStyle(toolcanvas, null)['borderTopWidth'], 10)   || 0;
  }
  
  // make draw() fire every INTERVAL milliseconds
  setInterval(draw, INTERVAL);
  
  // set our events. Up and down are for dragging,
  // double click is for making new boxes
  canvas.onmousedown = myDown;
  canvas.onmouseup = myUp;
  toolcanvas.onmousedown = myToolboxDown;
  //toolcanvas.onmouseup = myUp;
  canvas.ondblclick = myDblClick;
  window.onresize = sizeCanvas;
  
  // add custom initialization here:
  initTools();
}

function sizeCanvas() {
  VHEIGHT = window.innerHeight;
  VWIDTH = window.innerWidth;

  if (VHEIGHT != HEIGHT || VWIDTH != WIDTH) {
    canvas.setAttribute("height", VHEIGHT);
    canvas.setAttribute("width", VWIDTH);

    HEIGHT = canvas.height;
    WIDTH = canvas.width;
    
    invalidate();
  }
}

//wipes the canvas context
function clear(c) {
  c.clearRect(0, 0, WIDTH, HEIGHT);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
function draw() {
  if (canvasValid == false) {
    sizeCanvas();
    clear(ctx);
    clear(tctx);

    
    // Add stuff you want drawn in the background all the time here
    drawGrid();

    // draw all boxes
    var l = objects.length;
    for (var i = 0; i < l; i++) {
      drawObject(ctx, objects[i], objects[i].fill);
    }

    var l = tools.length;
    for (var i = 0; i < l; i++) {
      drawObject(tctx, tools[i], tools[i].fill);
    }
    
    // draw selection
    // right now this is just a stroke along the edge of the selected box
    if (mySel != null) {
      ctx.strokeStyle = mySelColor;
      ctx.lineWidth = mySelWidth;
      ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
    }
    
    // Add stuff you want drawn on top all the time here
    // drawDebug();

    canvasValid = true;
  }
}

// Draws a single shape to a single context
// draw() will call this with the normal canvas
// myDown will call this with the ghost canvas
function drawObject(context, object, fill) {
  context.fillStyle = fill;
  
  // We can skip the drawing of elements that have moved off the screen:
  if (object.x > WIDTH || object.y > HEIGHT) return; 
  if (object.x + object.w < 0 || object.y + object.h < 0) return;
  
  context.fillRect(object.x, object.y, object.w, object.h);

  if (context != gctx || context != gtctx) {
    //drawBlock(object);
    n = object.name;
    b = blocks[object.name];

    //alert(b);
    var img = document.getElementById("terrain");
    if(object.rotate != 0) {
      var destX = destY = 0;
      var scaleX = scaleY = 1;
      context.save();

      if(object.rotate == 90) {
        destX = object.x + 0;
        destY = object.y + object.h;
      } else if(object.rotate == 180) {
        destX = object.x + object.w;
        destY = object.y + object.h;
      } else if(object.rotate == 270) {
        destX = object.x + object.w;
        destY = object.y + 0;
      }

      context.translate(destX, destY);
      
      if(object.flip != "none") {
        if(object.flip == "horiz") {
          scaleX = -1;
          context.translate(object.w, 0);
        }  
        else if(object.flip == "vert") {
          scaleY = -1;
          context.translate(0, -object.h);
        }
        context.scale(scaleX, scaleY);
      }

      context.rotate((360 - object.rotate) * (Math.PI / 180));
      context.drawImage(img, b[0], b[1], b[2], b[3], 0, 0, gridSize + 1, gridSize + 1);
      context.restore();
    } else {
      context.drawImage(img, b[0], b[1], b[2], b[3], object.x, object.y, gridSize + 1, gridSize + 1);
    }
  }
}

function eraseObjects(){
  if(confirm("Delete all the blocks?")) {
    var tool = objects[objects.length - 1];
    objects = [];
    objects.push(tool);
    //mySel = null;
    //activeTool = null;
    //isDrag = false;
    invalidate();
  }
}

function clearTool() {
  objects.splice(objects.length - 1, 1);
  activeTool = null;
  mySel = null;
  isDrag = false;
  invalidate();
}

// Snap the box to the closest grid
function alignObj() {
  if(mySel == null)
    return;

  offX = mySel.x % gridSize;
  offY = mySel.y % gridSize;

  if(offX != 0 || offY != 0) {
    if(offX <= gridSize / 2)
      mySel.x -= offX;
    if(offX > gridSize / 2)
      mySel.x += gridSize - offX;

    if(offY <= gridSize / 2)
      mySel.y -= offY;
    if(offY > gridSize / 2)
      mySel.y += gridSize - offY;
  }
  invalidate();
}

// Happens when the mouse is moving inside the canvas
function myMove(e){
  if (isDrag){
    getMouse(e);
    
    mySel.x = mx - offsetx;
    mySel.y = my - offsety;   
    
    // something is changing position so we better invalidate the canvas!
    invalidate();
  }
  if (isScroll) {
    getMouse(e);
    
    for(var i = 0; i < objects.length; i++) {
      objects[i].x += (mx - msx);
      objects[i].y += (my - msy);
    }

    msx = mx;
    msy = my;
    invalidate();
  }
}

// Happens when the mouse is clicked in the canvas
function myDown(e){
  getMouse(e);
  clear(gctx);

  if(activeTool) {
    // Remove the current tool
    objects.splice(objects.length - 1);

    // Check if we've selected a block on the canvas,
    // if so, add a new tool and return.
    if(checkObjectClicked()) {
      return;
    }
    
    // Add a block to the canvas and set it to the current object, then align it.
    drawCurrentTool();
    alignObj();
    //mySel = null;

    // Add a new tool
    drawCurrentTool();
  }

  scrollCanvas(e);

  // havent returned means we have selected nothing
  //mySel = null;
  // clear the ghost canvas for next time
  clear(gctx);
  // invalidate because we might need the selection border to disappear
  invalidate();
}

function scrollCanvas(e) {
  isScroll = true;
  getMouse(e);
  msx = mx;
  msy = my;
}

function drawCurrentTool() {
  addObj(mx - (activeTool.w / 2), my - (activeTool.h / 2), activeTool.fill, activeTool.name, activeTool.rotate, activeTool.flip);
  mySel = objects[objects.length - 1];  
}

function myToolboxDown(e){
  getMouseInToolbox(e);
  clear(gtctx);

  if(checkToolClicked())
    return;

  // havent returned means we have selected nothing
  mySel = null;
  // clear the ghost canvas for next time
  clear(gtctx);
  // invalidate because we might need the selection border to disappear
  invalidate();
}

function checkObjectClicked() {
  // Check to see if we've selected an object.
  var l = objects.length;
  for (var i = l-1; i >= 0; i--) {
    // draw shape onto ghost context
    drawObject(gctx, objects[i], 'black');
    
    // get image data at the mouse x,y pixel
    var imageData = gctx.getImageData(mx, my, 1, 1);
    var index = (mx + my * imageData.width) * 4;
    
    // if the mouse pixel exists, select and break
    if (imageData.data[3] > 0) {
      mySel = objects[i];
      offsetx = mx - mySel.x;
      offsety = my - mySel.y;
      mySel.x = mx - offsetx;
      mySel.y = my - offsety;
      isDrag = true;
      oldActiveTool = activeTool;
      activeTool = null;
      setCursor();
      canvas.onmousemove = myMove;
      invalidate();
      clear(gctx);
      return true;
    } 
  }
  return false;
}

function checkToolClicked() {
  // Check to see if we're selecting a tool
  l = tools.length;

  for(var i = 0; i < l; i++) {
    drawObject(gtctx, tools[i], 'black');

    var imageData = gtctx.getImageData(mx, my, 1, 1);
    if(imageData.data[3] > 0) {
      if(activeTool)
        objects.splice(objects.length - 1, 1);
      t = tools[i];
      //addObj(t.x, t.y, t.fill, t.name, t.rotate, t.flip);
      addObj(mx - (t.w / 2), my - (t.h / 2), t.fill, t.name, t.rotate, t.flip);      
      mySel = objects[objects.length - 1];
      activeTool = objects[objects.length - 1];
      offsetx = mx - mySel.x;
      offsety = my - mySel.y;
      mySel.x = mx - offsetx;
      mySel.y = my - offsety;
      isDrag = true;
      canvas.onmousemove = myMove;
      invalidate();
      clear(gtctx);
      return true;
     }
  }
  return false;
}

function zoom(dir) {
  var min = gridSizeMinMax[0];
  var max = gridSizeMinMax[1];
  var oldSize = gridSize;

  if(dir == "in") {
    if(gridSize >= max)
      return;
    gridSize += 16;
    invalidate();
    sizeToolbox();
    resizeObjects(dir, oldSize);
  }else if(dir == "out") {
    if(gridSize <= min)
      return;
    gridSize -= 16;
    invalidate();
    sizeToolbox();
    resizeObjects(dir, oldSize);
  }
}

function resizeObjects(dir, oldSize) {
  for(var i = 0; i < objects.length; i++) {
    objects[i].h = gridSize;
    objects[i].w = gridSize;
    mySel = objects[i];

    // Get the object's old ratio to apply to the new position.    
    xRatio = objects[i].x / oldSize;
    yRatio = objects[i].y / oldSize;

    objects[i].x = gridSize * xRatio;
    objects[i].y = gridSize * yRatio;

  }
  for(var j = 0; j < tools.length; j++) {
    tools[j].h = gridSize;
    tools[j].w = gridSize;

    /*xRatio = tools[j].x / oldSize;
    yRatio = tools[j].y / oldSize;

    tools[j].x = gridSize * xRatio;
    tools[j].y = gridSize * yRatio;*/
  }
}

function myUp(){
  if(activeTool == null && oldActiveTool != null) {
    //isDrag = false;
    //canvas.onmousemove = null;
    alignObj();
    activeTool = oldActiveTool;
    oldActiveTool = null;
    setCursor();
    addObj(mx - (activeTool.w / 2), my - (activeTool.h / 2), activeTool.fill, activeTool.name, activeTool.rotate, activeTool.flip);
    mySel = objects[objects.length - 1];
  }
  if(isScroll) {
    var tmpSel = mySel;
    for(var i = 0; i < objects.length; i++) {
      mySel = objects[i];
      alignObj();
    }
    mySel = tmpSel;
    isScroll = false;
  }
}

function mouseHasMoved() {
  if(Math.abs(msx - mx) > 5 || Math.abs(msy - my) > 5)
    return true;
}


function setCursor() {
  if(oldActiveTool)
    document.body.style.cursor = 'move';
  else
    document.body.style.cursor = 'default';
}

// Delete the object on doubleclick
function myDblClick(e) {
  getMouse(e);
  clear(gctx);

  // Remove the current tool.
  objects.splice(objects.length - 1, 1);
  // Check to see if we've selected an object.
  var l = objects.length;
  for (var i = l-1; i >= 0; i--) {
    // draw shape onto ghost context
    drawObject(gctx, objects[i], 'black');

    // get image data at the mouse x,y pixel
    var imageData = gctx.getImageData(mx, my, 1, 1);
    var index = (mx + my * imageData.width) * 4;

    // if the mouse pixel exists, select and break
    if (imageData.data[3] > 0) {
      objects.splice(i, 1);
      invalidate();
      clear(gctx);
      // add the Tool back
      addObj(mx - (activeTool.w / 2), my - (activeTool.h / 2), activeTool.fill, activeTool.name, activeTool.rotate, activeTool.flip);
      mySel = objects[objects.length - 1];    
      return true;
    }
  }

  addObj(mx - (activeTool.w / 2), my - (activeTool.h / 2), activeTool.fill, activeTool.name, activeTool.rotate, activeTool.flip);
  mySel = objects[objects.length - 1];    

  // havent returned means we have selected nothing
  //mySel = null;
  // clear the ghost canvas for next time  
  clear(gctx);
  // invalidate because we might need the selection border to disappear
  invalidate();
  
}

function invalidate() {
  canvasValid = false;
}

// Sets mx,my to the mouse position relative to the canvas
// unfortunately this can be tricky, we have to worry about padding and borders
function getMouse(e) {
      var element = canvas, offsetX = 0, offsetY = 0;

      if (element.offsetParent) {
        do {
          offsetX += element.offsetLeft;
          offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
      }

      // Add padding and border style widths to offset
      offsetX += stylePaddingLeft;
      offsetY += stylePaddingTop;

      offsetX += styleBorderLeft;
      offsetY += styleBorderTop;

      mx = e.pageX - offsetX;
      my = e.pageY - offsetY
}

function getMouseInToolbox(e) {
  var element = toolcanvas, offsetX = 0, offsetY = 0;

  if (element.offsetParent) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  offsetX += toolboxStylePaddingLeft;
  offsetY += toolboxStylePaddingTop;

  offsetX += toolboxStyleBorderLeft;
  offsetY += toolboxStyleBorderTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY
}

function drawGrid() {
  ctx.beginPath();
  for (var x = gridSize + 0.5; x < WIDTH; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
  }

  for (var y = gridSize + 0.5; y < HEIGHT; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
  }

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = gridWidth;
  ctx.stroke();
}

var offset = 0;
// Draw the toolbar
function initTools() {
  /*addTool('grass', 0);
  addTool('sand', 0);
  addTool('rail-curve', 0);
  addTool('redstoneore', 0);
  addTool('diamondore', 0);
  addTool('cobblestone', 0);*/

  $.each(blocks, function(index, value) {
    addTool(index, 0);
  });

  addTool('rail-curve', 90);
  addTool('rail-curve', 180, 'vert');
  addTool('rail-curve', 90, 'horiz');
  addTool('rail-straight', 90);


  sizeToolbox();
  //toolcanvas.setAttribute("style", "border: 1px solid red;");
  
  drawTools();
}

function drawTools() {
  var toolY = -gridSize;
  var toolX = 0;
  for(i = 0; i < tools.length; i++) {
    if(i % 4 == 0) {
      toolY += gridSize;
      toolX = 0;
    }else{
      toolX = toolX + gridSize;
    }
    tools[i].y = toolY;
    tools[i].x = toolX;
    drawObject(tctx, tools[0], tools[0].fill);
  }

}

function sizeToolbox() {
  toolcanvas.setAttribute("height", Math.ceil(tools.length / 4 ) * gridSize);
  toolcanvas.setAttribute("width", 4 * gridSize);

  ghosttoolcanvas.height = toolcanvas.height;
  ghosttoolcanvas.width = toolcanvas.width;
  drawTools();
}

function drawDebug() {
  var bottom = HEIGHT - 20;
  var right = WIDTH - 50;

  ctx.fillStyle = "orangered";
  ctx.font = "10px sans-serif";
  ctx.fillText("mx: " + mx, right, bottom);
  ctx.fillText("my: " + my, right, bottom + 10);
}
