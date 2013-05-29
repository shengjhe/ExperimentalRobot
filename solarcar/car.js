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
  res.sendfile(__dirname + '/solarcar.html');
});
	
analogWrite = function (pwmpin, value) {
	var path = '/sys/class/pwm/' + pwmpin;
	fs.writeFileSync(path+'/duty_percent', value); //�]�w�ƭ�-���:0.01  �Ȱ�:0~100
};

digitalWrite = function (gpio, value) {
	var gpioFile = '/sys/class/gpio/' + gpio ;
	fs.writeFileSync(gpioFile + '/value', '' + value, null);
};

port.open(comport, {  //�}��Comport �]�w�W�v�� 115200 
	baudRate: 115200,
	dataBits: 8,
	parity: 'none',
	stopBits: 1
	}, function(err) {		
	
});

motorControl = function (dir, speed) { //���F����
	switch(dir){
		case 'u': //���l�e�i
			analogWrite(ENA, speed);
			digitalWrite(in1, 0);
			digitalWrite(in2, 1);
			analogWrite(ENB, speed);
			digitalWrite(in3, 0);
			digitalWrite(in4, 1);
			//socket.emit('motorstatus', 'up');
			break;
		case 'd': //���l��h
			analogWrite(ENA, speed);
			digitalWrite(in1, 1);
			digitalWrite(in2, 0);
			analogWrite(ENB, speed);
			digitalWrite(in3, 1);
			digitalWrite(in4, 0);
			//socket.emit('motorstatus', 'down');
			break;
		case 'l': //���l�V��
			analogWrite(ENA, 60);
			digitalWrite(in1, 0);
			digitalWrite(in2, 1);
			analogWrite(ENB, 60);
			digitalWrite(in3, 1);
			digitalWrite(in4, 0);
			//socket.emit('motorstatus', 'left');
			break;
		case 'r': //���l�V�k
			analogWrite(ENA, 60);
			digitalWrite(in1, 1);
			digitalWrite(in2, 0);
			analogWrite(ENB, 60);
			digitalWrite(in3, 0);
			digitalWrite(in4, 1);
			//socket.emit('motorstatus', 'right');
			break;
		case 's': //���l����
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

io.sockets.on('connection', function (socket) {  //�}�_��web client �@ socket �s�u

  socket.on('motor', function (data) {
	var dataarray = data.split(",");  //�qweb client �����쪺�T���榡��  direction,power
	console.log("data.direction: "+dataarray[0]); //���l��i��V�B����ʧ@
	console.log("data.num: "+dataarray[1]); //�B�i���F power ����
	motorControl(dataarray[0], dataarray[1]);    
  });
  
});

console.log("Server running at port:8000/");
