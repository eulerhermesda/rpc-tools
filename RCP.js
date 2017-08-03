console.log("Coucou");


// This function generates the right dat
function generate(){
	return '{"jsonrpc":"2.0","method": "eth_sendTransaction", "params": [{"from": "0x3d8619512771fb7c2b5df2cc64d766c320cc99c2", "to": "0x6ff93b4b46b41c0c3c9baee01c255d3b4675963d", "data": "0xc6888fa10000000000000000000000000000000000000000000000000000000000000006"}], "id": 8}';

}

// Send the transaction to the local RPC
function sendTransaction(data, callback){
	var http = new XMLHttpRequest();
	var url = "http://127.0.0.1:8545";
	var params = data;
	http.open("POST", url, true);

	//Send the proper header information along with the request
	//http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	http.onreadystatechange = function() {//Call a function when the state changes.
	    if(http.readyState == 4 && http.status == 200) {
	        alert(http.responseText);
	    }}
	
	http.send(params);
}

sendTransaction(produceData(),null)