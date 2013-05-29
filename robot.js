var app = require('express')(),
    server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	fs = require('fs'),
	SerialPort = require('serialport2').SerialPort,
    port = new SerialPort();
	
server.listen(8000);

var comport = '/dev/ttyO2', //P9_21 UART2
	ENA = 'ehrpwm.1:1', //P9_16 EHRPWM1A right
	in1 = 'gpio48', //P9_15 GPIO1_16 in1
	in2 = 'gpio49', //P9_23 GPIO1_17 in2
	ENB = 'ehrpwm.1:0', //P9_14 EHRPWM1B left
	in3 = 'gpio117', //P9_25 GPIO3_21 in3
	in4 = 'gpio115'; //P9_27 GPIO3_19 in4
	
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/gview.html', function (req, res) {
  res.sendfile(__dirname + '/gview.html');
});

app.get('/camera2.html', function (req, res) {
  res.sendfile(__dirname + '/camera2.html');
});
	
analogWrite = function (pwmpin, value) {
	var path = '/sys/class/pwm/' + pwmpin;
	fs.writeFileSync(path+'/duty_percent', value); //設定數值-單位:0.01  值域:0~100
};

digitalWrite = function (gpio, value) {
	var gpioFile = '/sys/class/gpio/' + gpio ;
	fs.writeFileSync(gpioFile + '/value', '' + value, null);
};

port.open(comport, {  //開啟Comport 設定頻率為 115200 
	baudRate: 115200,
	dataBits: 8,
	parity: 'none',
	stopBits: 1
	}, function(err) {		
	
});

motorControl = function (dir, speed) { //馬達控制
	switch(dir){
		case 'u': //車子前進
			analogWrite(ENA, speed);
			digitalWrite(in1, 0);
			digitalWrite(in2, 1);
			analogWrite(ENB, speed);
			digitalWrite(in3, 0);
			digitalWrite(in4, 1);
			//socket.emit('motorstatus', 'up');
			break;
		case 'd': //車子後退
			analogWrite(ENA, speed);
			digitalWrite(in1, 1);
			digitalWrite(in2, 0);
			analogWrite(ENB, speed);
			digitalWrite(in3, 1);
			digitalWrite(in4, 0);
			//socket.emit('motorstatus', 'down');
			break;
		case 'l': //車子向左
			analogWrite(ENA, speed);
			digitalWrite(in1, 0);
			digitalWrite(in2, 1);
			analogWrite(ENB, speed);
			digitalWrite(in3, 1);
			digitalWrite(in4, 0);
			//socket.emit('motorstatus', 'left');
			break;
		case 'r': //車子向右
			analogWrite(ENA, speed);
			digitalWrite(in1, 1);
			digitalWrite(in2, 0);
			analogWrite(ENB, speed);
			digitalWrite(in3, 0);
			digitalWrite(in4, 1);
			//socket.emit('motorstatus', 'right');
			break;
		case 's': //車子停止
			analogWrite(ENA, 0);
			analogWrite(ENB, 0);
			digitalWrite(in1, 0);
			digitalWrite(in2, 0);
			digitalWrite(in3, 0);
			digitalWrite(in4, 0);
			//socket.emit('motorstatus', 'stop');
			break;
	}
};

servoControl = function (msg, lr, ud) { //舵機控制
	var str = "";
	switch(msg){
		case 'o': //機器夾子 打開 
			str = "#0 p1000 t1000\r";
			//socket.emit('motorstatus', 'open');
			break;
		case 'c': //機器夾子 夾住
			str = "#0 p1500 t1000\r";
			//socket.emit('motorstatus', 'close');
			break;
		case 'tl': //機器手臂 往左轉
			str = "#2 p500 t1000\r";
			//socket.emit('motorstatus', 'turnleft');
			break;
		case 'tr': //機器手臂 往右轉
			str = "#2 p1500 t1000\r";
			//socket.emit('motorstatus', 'turnright');
			break;
		case 'th': //
			str = "#4 p"+(2050-lr)+" t1000\r#6 p"+ud+" t1000\r";
			//socket.emit('motorstatus', 'turnhead');
			break;
		case 'lrm': //
			str = "#4 p1300 t1000\r";
			//socket.emit('motorstatus', 'turnhead');
			break;
		case 'lrr': //
			str = "#4 p1000 t1000\r";
			//socket.emit('motorstatus', 'turnhead');
			break;
		case 'lrl': //
			str = "#4 p1500 t1000\r";
			//socket.emit('motorstatus', 'turnhead');
			break;
		case 'udm': //
			str = "#6 p1250 t1000\r";
			//socket.emit('motorstatus', 'turnhead');
			break;
		case 'udd': //
			str = "#6 p850 t1000\r";
			//socket.emit('motorstatus', 'turnhead');
			break;
		case 'udu': //
			str = "#6 p1500 t1000\r";
			//socket.emit('motorstatus', 'turnhead');
			break;
	}
	
	console.log("portcontrol: "+msg);
	port.write(str); //Serial Out
};

io.sockets.on('connection', function (socket) {  //開起跟web client 作 socket 連線

  socket.on('motor', function (data) {
	var dataarray = data.split(",");  //從web client 接收到的訊息格式為  direction,power
	console.log("data.direction: "+dataarray[0]); //車子行進方向、舵機動作
	console.log("data.speed: "+dataarray[1]); //步進馬達 power 指數
	servoControl(dataarray[0], dataarray[2], dataarray[3]); 
	motorControl(dataarray[0], dataarray[1]);    
	//window.setTimeout("motorControl('"+dataarray[0]+"','"+dataarray[1]+"')",500);
  });
  
});

console.log("Server running at port:8000/");
