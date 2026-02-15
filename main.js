async function input(){
    for await(const inputs of console){
        return inputs;
    }
}

process.stdout.write("type somthing");

console.log(await input());