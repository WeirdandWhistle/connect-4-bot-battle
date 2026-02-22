import {SQL, sql, $} from "bun";

const db = new SQL({
    filename:"database.db",
    adapter:"sqlite",
});


await $`mkdir -p upload`;
await db`CREATE TABLE IF NOT EXISTS bot_data (name TEXT,  rank INT, rating INT, wins INT, losses INT, ties INT, total_turns INT, games_played INT, turn_time FLOAT, file_name TEXT);`;

//await db`INSERT INTO bot_data(name, rank, rating, wins, losses, ties, total_turns, games_played, turn_time, file_name) VALUES ("malcon", 2, 2254, 12, 2, 1, 50, 15, 3, "falcon.js");`;

let matchQue = [];
const baseBot = "random.js";

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

	const fileName = `${name}.js`;

	await db`INSERT INTO bot_data (name, rank, rating, wins, losses, ties, total_turns, games_played, turn_time, file_name)
	VALUES (${name}, -1, 1200, 0, 0, 0, 0, 0, 0, ${fileName});`;
	
	await Bun.write(`upload/${name}.js`,file);
	return new Response("OK",{
		headers: {"Access-Control-Allow-Origin":"*"}
	});
}
async function stats(req){
    const data = await db`SELECT * FROM bot_data LIMIT 100;`;

    console.log("data",data);
    return new Response(JSON.stringify(data),{
        headers: {"Access-Control-Allow-Origin":"*"}
    });
}

const server = Bun.serve({
    port: 5000,
    idleTimeout: 10,
    routes :{
        "/api/record": req => record(req),
        "/api/upload": req => upload(req),
        "/api/stats": req => stats(req),
	"/api": new Response("YOU HAEV REACHED THE API")
    }
});

console.log("main.js now running on",server.url);

//let out = await $`cd match-config; docker compose up --build; docker compose down`.text();
//console.log(out);

//console.log("finshed running match!");
//console.log("shutting down...");

//setTimeout(()=>{process.exit(0);},1000);
