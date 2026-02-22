async function input(){
    for await(const inputs of console){
        return inputs;
    }
}

async function record(req){
    console.log("API recoreded");
    const json = await req.json();
    console.log("raw json",json);

    // const p1 = {wins: json.p1Wins};

    // console.log();

    return new Response("OK");
}
async function upload(req){
    console.log("recived upload requst!");
    const formData = await req.formData();
    const name = formData.get("name");
    const file = formData.get("file");

    console.log("file size",file.size);
    if(file.size > 1E7){
        return new Response("FILE TOO BIG!");
    }
    if(await Bun.file(`upload/${name}.js`).exists()){
        return new Response("NAME ALREADY EXISTS!");
    }

    await Bun.write(`upload/${name}.js`,file);
    return new Response("OK",{
        headers: {"Access-Control-Allow-Origin":"*"}
    });
}

const server = Bun.serve({
    port: 2999,
    idleTimeout: 10,
    routes :{
        "/api/record": req => record(req),
        "/api/upload": req => upload(req)
    }
});

console.log("main.js now running on",server.url);