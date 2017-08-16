
// This function generates the right dat
function generate(_from,_to,_data){
	return '{"jsonrpc":"2.0","method": "eth_sendTransaction", "params": [{"from": "' + _from +'", "to": '+ _to +', "data":'+ _data +' }], "id": 8}';

}

function unlockAccount(_account,_pwd){
	// This function will unlock the account passed in parameter. 
	// The geth node should expose the personal API through the parameter --rcpapi="personal"

	var http = new XMLHttpRequest();
	var url = "http://127.0.0.1:8545";
	var params = '{"jsonrpc":"2.0","method":"personal_unlockAccount","params":["' + _account + '", "' + _pwd +'", 3600],"id":67}';
	
	http.open("POST", url, true);
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
function sendTransaction(_from,_to,data, callback){
	var http = new XMLHttpRequest();
	var url = "http://127.0.0.1:8545";
	var params = generate(_from,_to,data);
	console.log(params);
	http.open("POST", url, true);
	
	//Send the proper header information along with the request
	//http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	http.onreadystatechange = function(){callback(http);};
	
	//Let's unlock the account before sending the transaction
	unlockAccount(_from,"test")
	http.send(params);
}



class Contract{	

	constructor(){		
		this.address = null;
		this.abi = null;
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


			// adding the body of the function
			var args = argsName;
			var funcHash = this.generateFunctionHash(funcname);

			args[args.length] = 'var funcString="";'+
								'var string = "";'+
								'for (var i = 0; i < arguments.length  ; i ++){'+

									'var tmp = "0000000" + arguments[i].toString();'+
									'tmp = tmp.substring(tmp.length-6,tmp.length);'+

									'string = string + tmp;'+
								'}'+
								'string="000000000000000000000000000000000000000000000000000000" + string;'+
								'funcString = funcString + string.substring(string.length-64,string.length);'+

								'sendTransaction(account,this.address,generate(account,this.address,funcstring),function(http) {'+		
									    'if(http.readyState == 4 && http.status == 200) {'+
									       ' console.log(http.responseText);'+
									   ' }});';


			this[funcname] = Function.apply(null,args);

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

	

	generateFunctionHash(funcName){
		var shaObj = new jsSHA("SHA3-512", "TEXT");
		shaObj.update(funcName)
		return shaObj.getHash("HEX").substring(0,10);
	}
}

class Web3{
	constructor(address){
		this.address = addres;
		this.contract = Contract();
	}
}

function testArguments(){
	var funcString=""
	var string = "";
	for (var i = 0; i < arguments.length  ; i ++){

		var tmp = "0000000" + arguments[i].toString()
		tmp = tmp.substring(tmp.length-6,tmp.length)

		string = string + tmp;
	}
	string="000000000000000000000000000000000000000000000000000000" + string
	funcString = funcString + string.substring(string.length-64,string.length)

	sendTransaction(account,this.address,generate(account,this.address,funcstring),function(http) {//Call a function when the state changes.		
		    if(http.readyState == 4 && http.status == 200) {
		        console.log(http.responseText);
		    }})
	
}