var CELL_NUM_X = 9;
var CELL_NUM_Y = 9;
var CELL_WIDTH = 32;
var CELL_HEIGHT = 32;
var WALKING_STEP = 4;
var AUTO_MOVE_INTERVAL = 50;

var canvas;
var auto_move_interval_id;

var img = new Image();
var mori_img = new Image();
var sabaku_img = new Image();

var img_x;
var img_y;
var step_no;
var step_dst; 
var diff;
var prev_direction;
var drawing_next_map_flg;

// マップ情報
var MAP_OBJ_TYPE_OF_SABAKU = 0;
var MAP_OBJ_TYPE_OF_MORI = 1;
var MAP_OBJ_TYPE_OF_START = 8;
var MAP_OBJ_TYPE_OF_GOAL = 9;
var WALKABLE_MAP_TYPES = [0, 9];
var map_master;
var prev_map_master;

// 手動操作
keyDownFunc = function(e) {
  switch (e.keyCode) {
    case 37:
      if (can_move('left')) {
        move('left');
      }
      break;
    case 38:
      if (can_move('up')) {
        move('up');
      }
      break;
    case 39:
      if (can_move('right')) {
        move('right');
      }
      break;
    case 40:
      if (can_move('down')) {
        move('down');
      }
      break;
  }
}


function can_move(direction) {
  switch (direction) {
    case 'left':
      var forwarding_x = img_x - WALKING_STEP;
      var forwarding_y = img_y;

      var forwarding_x_pos1 = parseInt(forwarding_x / CELL_WIDTH);
      var forwarding_y_pos1 = parseInt(forwarding_y / CELL_HEIGHT);
      var forwarding_x_pos2 = parseInt(forwarding_x / CELL_WIDTH);
      var forwarding_y_pos2 = Math.ceil(forwarding_y / CELL_HEIGHT);
      var map_no1 = map_master[forwarding_y_pos1][forwarding_x_pos1];
      var map_no2 = map_master[forwarding_y_pos2][forwarding_x_pos2];

      if (forwarding_x >= 0 && WALKABLE_MAP_TYPES.indexOf(map_no1) >= 0 && WALKABLE_MAP_TYPES.indexOf(map_no2) >= 0) return true;
      break;
    case 'up':
      var forwarding_x = img_x;
      var forwarding_y = img_y - WALKING_STEP;

      var forwarding_x_pos1 = parseInt(forwarding_x / CELL_WIDTH);
      var forwarding_y_pos1 = parseInt(forwarding_y / CELL_HEIGHT);
      var forwarding_x_pos2 = Math.ceil(forwarding_x / CELL_WIDTH);
      var forwarding_y_pos2 = parseInt(forwarding_y / CELL_HEIGHT);
      var map_no1 = map_master[forwarding_y_pos1][forwarding_x_pos1];
      var map_no2 = map_master[forwarding_y_pos2][forwarding_x_pos2];

      if (forwarding_y >= 0 && WALKABLE_MAP_TYPES.indexOf(map_no1) >= 0 && WALKABLE_MAP_TYPES.indexOf(map_no2) >= 0) return true;
      break;
    case 'right':
      var forwarding_x = img_x + WALKING_STEP;
      var forwarding_y = img_y;

      var forwarding_x_pos1 = Math.ceil(forwarding_x / CELL_WIDTH);
      var forwarding_y_pos1 = parseInt(forwarding_y / CELL_HEIGHT);
      var forwarding_x_pos2 = Math.ceil(forwarding_x / CELL_WIDTH);
      var forwarding_y_pos2 = Math.ceil(forwarding_y / CELL_HEIGHT);
      var map_no1 = map_master[forwarding_y_pos1][forwarding_x_pos1];
      var map_no2 = map_master[forwarding_y_pos2][forwarding_x_pos2];

      if (forwarding_x_pos1 < CELL_NUM_Y && WALKABLE_MAP_TYPES.indexOf(map_no1) >= 0 && WALKABLE_MAP_TYPES.indexOf(map_no2) >= 0) return true;
      break;
    case 'down':
      var forwarding_x = img_x;
      var forwarding_y = img_y + WALKING_STEP;
      var forwarding_x_pos1 = parseInt(forwarding_x / CELL_WIDTH);
      var forwarding_y_pos1 = Math.ceil(forwarding_y / CELL_HEIGHT);
      var forwarding_x_pos2 = Math.ceil(forwarding_x / CELL_WIDTH);
      var forwarding_y_pos2 = Math.ceil(forwarding_y / CELL_HEIGHT);
      if (forwarding_y_pos1 >= CELL_NUM_Y) break;

      var map_no1 = map_master[forwarding_y_pos1][forwarding_x_pos1];
      var map_no2 = map_master[forwarding_y_pos2][forwarding_x_pos2];
      if (WALKABLE_MAP_TYPES.indexOf(map_no1) >= 0 && WALKABLE_MAP_TYPES.indexOf(map_no2) >= 0) return true;
      break;
  }
  return false;
}

// 自動操作
function auto_move() {

  if (drawing_next_map_flg) {
    draw_next_map();
    draw_next_map();
    draw_next_map();
    draw_next_map();
    draw_next_map();
    draw_next_map();
    draw_next_map();
    draw_next_map();
  } else {
    var directions;

    // 左手の法則
    switch (prev_direction) {
      case 'left':
        directions = ['down', 'left', 'up', 'right'];
        break;
      case 'up':
        directions = ['left', 'up', 'right', 'down'];
        break;
      case 'right':
        directions = ['up', 'right', 'down', 'left'];
        break;
      case 'down':
        directions = ['right', 'down', 'left', 'up'];
        break;
      default:
        directions = ['down', 'left', 'up', 'right'];
        break;
    }

    for (var i = 0; i < directions.length; i++) {
      if (can_move(directions[i])) {
        move(directions[i]);
        prev_direction = directions[i];
        break;
      }
    }

    // ゴール判定
    var current_x_pos = parseInt(img_x / CELL_WIDTH);
    var current_y_pos = parseInt(img_y / CELL_HEIGHT);
    var x_extra = img_x % CELL_WIDTH;
    var y_extra = img_y % CELL_HEIGHT;

    draw();

    if (x_extra == 0 && y_extra == 0 && map_master[current_y_pos][current_x_pos] == MAP_OBJ_TYPE_OF_GOAL) {
      // 次のステージをシームレスに表示
      drawing_next_map_flg = true;
      generate_new_map();
    }
  }
}

function move(direction) {

  var ctx = canvas.getContext('2d');

  step_no = (step_no + 1) % 3;

  var current_x_pos = parseInt(img_x / CELL_WIDTH);
  var current_y_pos = parseInt(img_y / CELL_HEIGHT);
  var x_extra = img_x % CELL_WIDTH;
  var y_extra = img_y % CELL_HEIGHT;
  // console.log("(" + current_x_pos + ", " + current_y_pos + ")" + (img_x / CELL_WIDTH) + ":" + (img_y / CELL_HEIGHT));

  switch (direction) {
    case 'left': // Left arrow key
      step_dst = 1;
      img_x -= WALKING_STEP;
      break;
    case 'up': // Up arrow key
      step_dst = 3;
      img_y -= WALKING_STEP;
      break;
    case 'right': // Right arrow key
      step_dst = 2;
      img_x += WALKING_STEP;
      break;
    case 'down': // Down arrow key
      step_dst = 0;
      img_y += WALKING_STEP;
      break;
  }
}

function draw_next_map() {

  diff++;
  if (diff >= CELL_HEIGHT * (CELL_NUM_Y - 1)) {
    drawing_next_map_flg = false;
    img_x = img_x;
    img_y = img_y - diff;
    diff = 0;
    return;
  }

  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // マップ描画
  for (var i = 0; i < CELL_NUM_Y; i++) {
    for (var j = 0; j < CELL_NUM_X; j++) {
      ctx.drawImage(sabaku_img, 0, 0, CELL_WIDTH - 1, CELL_HEIGHT - 1, j * CELL_WIDTH, i * CELL_HEIGHT - diff, CELL_WIDTH, CELL_HEIGHT);
      ctx.drawImage(sabaku_img, 0, 0, CELL_WIDTH - 1, CELL_HEIGHT - 1, j * CELL_WIDTH, i * CELL_HEIGHT - diff + CELL_HEIGHT * (CELL_NUM_Y - 1), CELL_WIDTH, CELL_HEIGHT);
    }
  }
  for (var i = 0; i < CELL_NUM_Y; i++) {
    for (var j = 0; j < CELL_NUM_X; j++) {
      if (prev_map_master[i][j] == MAP_OBJ_TYPE_OF_MORI) {
        ctx.drawImage(sabaku_img, CELL_WIDTH, CELL_HEIGHT, CELL_WIDTH - 1, CELL_HEIGHT - 1, j * CELL_WIDTH, i * CELL_HEIGHT - diff, CELL_WIDTH, CELL_HEIGHT);
      }
      if (map_master[i][j] == MAP_OBJ_TYPE_OF_MORI) {
        ctx.drawImage(sabaku_img, CELL_WIDTH, CELL_HEIGHT, CELL_WIDTH - 1, CELL_HEIGHT - 1, j * CELL_WIDTH, i * CELL_HEIGHT - diff + CELL_HEIGHT * (CELL_NUM_Y - 1), CELL_WIDTH, CELL_HEIGHT);
      }
    }
  }

  // キャラ描画
  var sx = CELL_WIDTH * step_no;
  var sy = CELL_HEIGHT * step_dst; 
  ctx.drawImage(img, sx, sy, CELL_WIDTH, CELL_HEIGHT, img_x, img_y - diff, CELL_WIDTH, CELL_HEIGHT);
}

draw = function() {
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (var i = 0; i < CELL_NUM_Y; i++) {
    for (var j = 0; j < CELL_NUM_X; j++) {
      // 道
      ctx.drawImage(sabaku_img, 0, 0, CELL_WIDTH - 1, CELL_HEIGHT - 1, j * CELL_WIDTH, i * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    }
  }
  // マップ描画
  for (var i = 0; i < CELL_NUM_Y; i++) {
    for (var j = 0; j < CELL_NUM_X; j++) {
      // 森
      if (map_master[i][j] == MAP_OBJ_TYPE_OF_MORI) {
        ctx.drawImage(sabaku_img, CELL_WIDTH, CELL_HEIGHT, CELL_WIDTH - 1, CELL_HEIGHT - 1, j * CELL_WIDTH, i * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
      }
    }
  }

  // キャラ描画
  var sx = CELL_WIDTH * step_no + 1;
  var sy = CELL_HEIGHT * step_dst + 1; 
  ctx.drawImage(img, sx, sy, CELL_WIDTH - 1, CELL_HEIGHT - 1, img_x, img_y, CELL_WIDTH, CELL_HEIGHT);
}

function generate_new_map() {
  for (var i = 0; i < CELL_NUM_Y; i++) {
    for (var j = 0; j < CELL_NUM_X; j++) {
      prev_map_master[i][j] = map_master[i][j];
    }
  }

  // 1. 森で埋める
  for (var i = 0; i < CELL_NUM_Y; i++) {
    map_master[i] = [];
    for (var j = 0; j < CELL_NUM_X; j++) {
      map_master[i][j] = MAP_OBJ_TYPE_OF_MORI;
    }
  }

  // 2. スタートを設定する
  if (prev_map_master[CELL_NUM_Y - 1].indexOf(MAP_OBJ_TYPE_OF_GOAL) > 0) {
    for (var j = 0; j < CELL_NUM_X; j++) {
      if (prev_map_master[CELL_NUM_Y - 1][j] == MAP_OBJ_TYPE_OF_GOAL) {
        map_master[0][j] = MAP_OBJ_TYPE_OF_START;
      } else {
        map_master[0][j] = prev_map_master[CELL_NUM_Y - 1][j];
      }
    }
  } else {
    start_x_pos = parseInt((Math.random() * (CELL_NUM_X - 1)) / 2) * 2 + 1;
    map_master[0][start_x_pos] = MAP_OBJ_TYPE_OF_START;
    img_x = CELL_WIDTH * start_x_pos;
  }

  // 3. 道を作る
  generate_road(map_master, 1, 3);

  // 4. ゴールを設定する
  goal_x_pos = parseInt((Math.random() * (CELL_NUM_X - 1)) / 2) * 2 + 1;
  map_master[CELL_NUM_Y - 1][goal_x_pos] = MAP_OBJ_TYPE_OF_GOAL;
}

function generate_road(map_master, y_pos, x_pos) {
  if (y_pos < 0 || x_pos < 0 || y_pos >= CELL_NUM_Y || x_pos >= CELL_NUM_X) {
    return;
  }

  var arr = [[2, 0], [0, 2], [-2, 0], [0, -2]].sort(function () { return Math.random() - 0.5 });
  for (var i = 0; i < 4; i ++) {
    var diff_x_y = arr[i];
    if (x_pos + diff_x_y[0] < CELL_NUM_X && x_pos + diff_x_y[0] >= 0 &&
        y_pos + diff_x_y[1] < CELL_NUM_Y && y_pos + diff_x_y[1] >= 0)
    {
      if (map_master[y_pos + diff_x_y[1]][x_pos + diff_x_y[0]] == MAP_OBJ_TYPE_OF_MORI) {
        map_master[y_pos + (diff_x_y[1] / 2)][x_pos + (diff_x_y[0] / 2)] = MAP_OBJ_TYPE_OF_SABAKU;
        map_master[y_pos + diff_x_y[1]][x_pos + diff_x_y[0]] = MAP_OBJ_TYPE_OF_SABAKU;
        generate_road(map_master, y_pos + diff_x_y[1], x_pos + diff_x_y[0]);
      }
    }
  }
}

start = function() {
  if (auto_move_interval_id) {
    clearInterval(auto_move_interval_id);
  }

  var wrapper = document.getElementById("wrapper");
  var child;
  while (child = wrapper.lastChild) wrapper.removeChild(child);
  canvas = document.createElement("canvas");
  document.getElementById("wrapper").appendChild(canvas);

  // canvas = document.getElementById("canvas");
  canvas.width = document.getElementById("wrapper").offsetWidth;
  canvas.height = document.getElementById("wrapper").offsetHeight;
  var scale_x = canvas.width / 288;
  var scale_y = canvas.height / 288;
  var ctx = canvas.getContext('2d');
  ctx.scale(scale_x, scale_y);

  img.src = '/static/images/character_a.png'
  mori_img.src = '/static/images/map_mori.png'
  sabaku_img.src = '/static/images/pipo-map001.png'

  step_no = 0;
  step_dst = 0;
  img_x = 0;
  img_y = 0;
  diff = 0;
  drawing_next_map_flg = false;

  // マップ自動生成
  img_x = 0;
  img_y = 0;
  map_master = [];
  prev_map_master = [];
  for (var i = 0; i < CELL_NUM_Y; i++) {
    map_master[i] = [];
    prev_map_master[i] = [];
  }
  generate_new_map();

  // 手動操作
  document.addEventListener("keydown", keyDownFunc);

  // 自動操作
  auto_move_interval_id = window.setInterval(auto_move, AUTO_MOVE_INTERVAL);

  // var audio = document.getElementById("audio");
  // audio.play();
}

init = function() {
  var wrapper = document.getElementById("wrapper");
  var start_button = document.createElement("button");
  start_button.innerHTML = "GAME START";
  start_button.setAttribute("onclick", "start();");
  wrapper.appendChild(start_button);
}

window.onload = init;
