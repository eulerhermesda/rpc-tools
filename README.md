# rpc_Tools
Tools for interacting with geth through RPC protocol

## Status

*Beta v1 :*
- Can send transactions and calls
- Can unlock accounts
- Can return result for calls through callback functions following the same prototype as web3.js.
- When abi is passed, can generate the corresponding function:
  ```Javasctipt
    contract = new Contract();
    contract.setAbi(abi); 
  ```
  Once you did that, you can call your function like that:
  ```
    contract.nameOfYourFunction(parameters);
  ```

## Objective

After struggling for some time with metamask, we decided to develop our own tools for our demos to interact smoothly between our Dapp and our local demo node without having to rely on third-party product.

The project is not suitable for production, mainly because it is lacking a correct key management system. Right know we rely on the RPC to handle the keys and manage the signature of transactions and we use the personal RPCAPI from geth to unlock the accounts.

## Technical details

- To unlock the account before sending the transaction one can use the unlockAccount function provided in the package. This function takes 2 parameters : the address of the account and the password.
- If you want to use that function you need to launch the RPC node with the option : `--rpcapi "personal"`
- To use all the functionalities of the tool you need to launch the node with the following options : `--rpcapi "db,eth,net,web3,personal"`.

## Future improvements

- Handle the events
- Include the sha3 library
- Get closer to how the web3.js templates are for smoother transitions between one solution and the other.
- POssibly add a key management mechanism with the possibility to sign transactions without having to rely on geth
