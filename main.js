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

const server = Bun.serve({
    port: 2999,
    routes :{
        "/api/record": req => record(req)
    }
});

console.log("main.js now running on",server.url);