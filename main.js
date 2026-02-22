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

if((await db`SELECT wins FROM bot_data WHERE name='baseBot' LIMIT 1;`).count === 0){
	await db`INSERT INTO bot_data (name, rank, rating, wins, losses, ties, total_turns, games_played, turn_time, file_name)
	VALUES ('baseBot', -1, 1200, 0, 0, 0, 0, 0, 0, ${baseBot});`;

}

let jsonDataFromCurrentMatch = null;

async function input(){
    for await(const inputs of console){
        return inputs;
    }
}

async function record(req){
    console.log("API recoreded");
    const json = await req.json();
    console.log("raw json",json);

	jsonDataFromCurrentMatch = json;

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

	matchQue.push(`${name}`);
	console.log("added",name,"to match que!");
	
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
async function play(req){
	const url = new URL(req.url);
	const query = url.searchParams;

	if(!query.has("name")){
		return new Response("NEED SEARCH QUERY NAME!");
	}

	const name = query.get("name");
	
	matchQue.push(name);
	
	return new Response("OK");
}

const server = Bun.serve({
    port: 5000,
    idleTimeout: 10,
    routes :{
        "/api/record": req => record(req),
        "/api/upload": req => upload(req),
        "/api/stats": req => stats(req),
	"/api/play": req => play(req),
	"/api": new Response("YOU HAEV REACHED THE API")
    }
});

console.log("main.js now running on",server.url);

async function runMatch(){
	//console.log("Checking match que...");
	if(matchQue.length === 0){
		setTimeout(async () => runMatch(), 10 * 1000);
		return;
	}
	console.log("running match...");

	const name = matchQue[0];
	matchQue.shift();

	const fileName = (await db`SELECT file_name FROM bot_data WHERE name=${name} LIMIT 1;`)[0].file_name;
	console.log("file name",fileName);

	// base case
	await $`cp upload/${fileName} match-config/p1/src/app.js`;
	await $`cp upload/${baseBot} match-config/p2/src/app.js`;
	await $`cd match-config; docker compose up --build; docker compose down`;

	const json = jsonDataFromCurrentMatch;

	await db`UPDATE bot_data SET wins=wins+${json.p1Wins},losses=losses+${json.p1Losses},ties=ties+${json.ties},games_played=games_played+1000 WHERE name=${name};`;
	await db`UPDATE bot_data SET wins=wins+${json.p2Wins},losses=losses+${json.p2Losses},ties=ties+${json.ties},games_played=games_played+1000 WHERE name='baseBot';`;



	//console.log(await db`SELECT * FROM bot_data WHERE name=${name} LIMIT 1;`);
	
	setTimeout(async()=>runMatch(), 10 * 1000);
}
runMatch();

//let out = await $`cd match-config; docker compose up --build; docker compose down`.text();
//console.log(out);

//console.log("finshed running match!");
//console.log("shutting down...");

//setTimeout(()=>{process.exit(0);},1000);
