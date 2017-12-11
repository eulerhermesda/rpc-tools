var rpcUrl = "http://127.0.0.1:9545";
function estimateGas(_from,_to,_data){

	return new Promise(function(resolve, reject){

		var http = new XMLHttpRequest();
		var url = rpcUrl;
		var params = '{"jsonrpc":"2.0","method": "eth_estimateGas", "params": [{"from": "' + _from +'", "to": "'+ _to +'", "data": "'+ _data +'" }], "id": 1}';
		//console.log(params);

		http.open("POST", url, true);
		http.setRequestHeader("Content-Type", "application/json");
		http.onreadystatechange = function(){
			if(http.readyState == 4 && http.status == 200) {
				result = http.responseText;
				result = JSON.parse(result);
				result = result.result;
				resolve(result);
			}
		};

		http.send(params);
	});

}

// This function generates the right dat
function generate(_from,_to,_data,_type, _gas){
	var extraParam = (_type == "eth_call")?',"latest"':''
	return '{"jsonrpc":"2.0","method": "'+ _type +'", "params": [{"from": "' + _from +'", "to": "'+ _to +'", "data": "'+ _data +'", "gas": "'+ _gas +'" }'+ extraParam+'], "id": 1}';
}

function unlockAccount(_account,_pwd){
	// This function will unlock the account passed in parameter.
	// The geth node should expose the personal API through the parameter --rcpapi="personal"

	var http = new XMLHttpRequest();
	var url = rpcUrl;
	var params = '{"jsonrpc":"2.0","method":"personal_unlockAccount","params":["' + _account + '", "' + _pwd +'", 3600],"id":67}';

	http.open("POST", url, true);
	http.setRequestHeader("Content-Type", "application/json");
	http.onreadystatechange = function(){
		if(http.readyState == 4 && http.status == 200) {
			if (JSON.parse(http.responseText).hasOwnProperty("error")){
				console.log(http.responseText);
			}
			else
				console.log("Account successfully unlocked")

    }};
	http.send(params);
}

// Send the transaction to the local RPC
async function sendTransaction(_from,_to,data,cb, callback){// cb = original callback
	var http = new XMLHttpRequest();
	var url = rpcUrl;
	var estimatedGas = await estimateGas(_from, _to, data);
	if(parseInt(estimatedGas) > parseInt(0x8000000)){
		estimatedGas = "0x8000000";
	}
	estimatedGas = estimatedGas.toString(16);
	var params = generate(_from,_to,data,"eth_sendTransaction", estimatedGas);
	console.log(params);
	http.open("POST", url, true);	
	http.setRequestHeader("Content-Type", "application/json");

	
	http.onreadystatechange = function(){callback(http,cb);};

	//Let's unlock the account before sending the transaction
	//unlockAccount(_from,"test")
	http.send(params);
}

async function sendCall(_from,_to,data,cb, callback){// cb = original callback
	var http = new XMLHttpRequest();
	var url = rpcUrl;
	var estimatedGas = await estimateGas(_from, _to, data);
	
	if(parseInt(estimatedGas) > parseInt(0x8000000)){
		estimatedGas = "0x8000000";
	}
	estimatedGas = estimatedGas.toString(16);
	var params = generate(_from,_to,data,"eth_call", estimatedGas);
	//console.log(params);
	http.open("POST", url, true);
	http.setRequestHeader("Content-Type", "application/json");

	//Send the proper header information along with the request
	//http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	http.onreadystatechange = function(){callback(http,cb);};

	//Let's unlock the account before sending the transaction
	//unlockAccount(_from,"test")
	http.send(params);
}


class Contract{

	constructor(){
		this.address = null;
		this.abi = null;
		this.ready = false;
	}

	isReady(){
		return this.ready;
	}
	generateFunctions(){

		for (var i = 0; i< this.abi.length;i++){
			var funcname = this.abi[i].name; // #TODO find a way to generate the name of the function from the name found in the ABI
			var argsName = [];
			var argsType = [];
			var index = 0;
			// Looping through the name of the inputs to get all the inputs plus types
			for (var j=0; j< this.abi[i].inputs.length;j++){

				if (this.abi[i].inputs[j].name != ""){
					argsName[index]=this.abi[i].inputs[j].name;
					argsType[index]=this.abi[i].inputs[j].type;
					index++;
				}
			}

			var index = 0;
			var outputsType=[];
			var outputsName=[];
			if (this.abi[i].outputs){
				for (var j=0; j<this.abi[i].outputs.length; j++){
					outputsType[index] = this.abi[i].outputs[j].type;
					outputsName[index] = this.abi[i].outputs[j].name;
					index++;
				}
			}


			// adding the body of the function
			var args = argsName;
			var funcHash = this.generateFunctionHash(funcname,argsType);
			var funcType = this.abi[i].constant?'sendCall':'sendTransaction'


			var tmpCode = 'var funcString="";' +
						'var string = "";';

			for (var j=0; j < args.length;j++){
				if (argsType[j] == "address"){
					tmpCode = tmpCode + 'console.log("'+funcname+'");'+
					'var tmp = "0000000000000000000000000000000000000000000000000000000000000000" + arguments['+j+'].toString().substr(-40);'+
					'tmp = tmp.substring(tmp.length-64,tmp.length);'+
					'string = string + tmp;'
				}
				else{
					tmpCode = tmpCode +
					'var tmp = "0000000000000000000000000000000000000000000000000000000000000000" + arguments['+j+'].toString();'+
					'tmp = tmp.substring(tmp.length-64,tmp.length);'+
					'string = string + tmp;'
				}
			}

			// Adding the callback function
			//tmpCode = tmpCode + 'var callBackFunc = function(){arguments[arguments.length](err,res)}'

			tmpCode = tmpCode +	'funcString = "0x'+funcHash+'"+ string;'+
								funcType+'(currentAccount,this.address,funcString,arguments[arguments.length-1],function(http) {'+
									    'if(http.readyState == 4 && http.status == 200) {';

			// Code for handling the response from the RPC server here
				// If we have a call, the result of the operation is returned in the result field of the response
			tmpCode = tmpCode +	'var response = JSON.parse(http.responseText);'+
				'var res=[];'+
				'var err=undefined;'+
				'if (response.error){'+
					'console.log(response);'+
					'err = response.error;'+
				'}'+
				'else {'+

					'for (var i=0; i<'+outputsType.length+';i++){'+
						'res[i]="0x"+response.result.substring(2+64*i,66+64*i);'+
					'}'+
				'}'+

				'arguments[arguments.length-1](err,res);';

			tmpCode = tmpCode +	' /*console.log(http.responseText);*/'+
									   ' }});';
			args[args.length]=tmpCode

			this[funcname] = Function.apply(null,args);
			this.ready=true;
		}
	}


	at(address){
		this.address = address;
	}

	parseAbi(_abi){
		this.abi = JSON.parse(_abi);
		console.log(this.abi);
		this.generateFunctions();

	}

	setAbi(_abi){
		this.abi = _abi;
		this.generateFunctions();
	}



	generateFunctionHash(funcName,type){
		//var shaObj = new jsSHA("Keccak-256", "TEXT");
		var tmp = funcName + '(';

		for (var i=0; i < type.length;i++ ){
			if (type[i] == 'uint')
				tmp=tmp+'uint256';
			else if (type[i] == 'int')
				tmp=tmp+'int256';
			else
				tmp=tmp+type[i]
			if (i != type.length -1){
				tmp=tmp+','
			}

		}
		tmp=tmp+')';
		//console.log(tmp)
		//shaObj.update(tmp)

		return keccak256(tmp).substring(0,8);
	}
}


//Converters
//Convert Hexadecimal to bool
function hex2bool(hex){
  var bool = '';
  if( String(hex).substr(-1) == "1"){
    bool = true;
  }
  else{
    bool = false;
  }
  return bool;
}
//Convert Bool to hex
function bool2hex(bool){
  if(bool){
    var hex = "00000000000000000000000000000001";
  }
  else{
    var hex = "00000000000000000000000000000000";
  }
  return hex;
}

//Convert hexadecimal to ASCII
function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        var v = parseInt(hex.substr(i, 2), 16);
        if (v) str += String.fromCharCode(v);
    }
    return str;
}

//Convert string to hex
function a2hex(a){
  var result = "";
  for (i=0; i<a.length; i++) {
        hex = a.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
  }
  return result.substr(0,63);
}

//Convert int to hexadecimal
function int2hex(int){
  var hex = ("000000000000000000000000000000" + int.toString(16)).substr(-32);
  //hex = "0x" + hex;
  return hex;
}
function hex2int(hex){
  var result = hex.replace(hex.match("0x(0*)")[0],'');
  if(result == ""){
    result = 0;
  }
  return result;
}

//Convert Hex to address
function hex2address(hex){
  var result = "0x" + String(hex).substr(-40);
  return result;
}
