
let manger = null;

async function start(req){
    const json = await req.json();

    manger = json.endpoint;
}
const server = Bun.serve({
    port:3001,
    routes: {
        "/start" : req => start(req)
    }
});
