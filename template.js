
let manager = null;

async function start(req){
    const json = await req.json();

    manager = json.endpoint;
}
const server = Bun.serve({
    port:3001,
    routes: {
        "/start" : req => start(req),
        "/move": req => turn(req)
    }
});

async function turn(req){

}
