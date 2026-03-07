import {SQL, sql, $} from "bun";

const db = new SQL({
    filename:"database.db",
    adapter:"sqlite",
});

await $`whoami`;
await $`mkdir -p upload`;
await db`CREATE TABLE IF NOT EXISTS bot_data (name TEXT,  rank INT, rating INT, wins INT, losses INT, ties INT, total_turns INT, games_played INT, turn_time FLOAT, file_name TEXT, flagged INT DEFAULT 0);`;

//await db`INSERT INTO bot_data(name, rank, rating, wins, losses, ties, total_turns, games_played, turn_time, file_name) VALUES ("malcon", 2, 2254, 12, 2, 1, 50, 15, 3, "falcon.js");`;

let matchQue = [];
const baseBot = "random.js";
const webSocketUpgrade = "/api/test/ws";
const SQLIntLimit = 2147483646;//one less then 32 bit int limit

if((await db`SELECT wins FROM bot_data WHERE name='baseBot' LIMIT 1;`).count === 0){
	await db`INSERT INTO bot_data (name, rank, rating, wins, losses, ties, total_turns, games_played, turn_time, file_name)
	VALUES ('baseBot', ${SQLIntLimit}, 1200, 0, 0, 0, 0, 0, 0, ${baseBot});`;

}

let jsonDataFromCurrentMatch = null;
let jsonDataExists = false;

async function input(){
    for await(const inputs of console){
        return inputs;
    }
}

async function record(req){
	console.log("record headers",req.headers);
    console.log("API recoreded");
    const json = await req.json();
    console.log("raw json",json);

	jsonDataFromCurrentMatch = json;
	jsonDataExists = true;

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
	VALUES (${name}, ${SQLIntLimit}, 1200, 0, 0, 0, 0, 0, 0, ${fileName});`;

	matchQue.push(`${name}`);
	console.log("added",name,"to match que!");
	
	await Bun.write(`upload/${name}.js`,file);
	return new Response("OK",{
		headers: {"Access-Control-Allow-Origin":"*"}
	});
}
async function stats(req){
    const data = await db`SELECT * FROM bot_data LIMIT 100;`;

    //console.log("data",data);
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

let testWS = new Set();

const server = Bun.serve({
    port: 5000,
    idleTimeout: 10,
    routes :{
        "/api/record": req => record(req),
        "/api/upload": req => upload(req),
        "/api/stats": req => stats(req),
		"/api/play": req => play(req),
		"/api/test/start": req => testStart(req),
		"/api": new Response("YOU HAEV REACHED THE API")
    },

	fetch(req, server){
		const url = new URL(req.url);

		if(url.pathname === webSocketUpgrade){
			const upgraded = server.upgrade(req);
			if(upgraded){
				return;
			}
			return new Response("WEBSOCKET UPGRADE FALIED",{status: 400});
		}
		return new Response("API FETCHED!");
	},
	websocket: {
		open(ws){
			console.log("client connect to websocket!");
			testWS.add(ws);
		},
		message(ws, message){
			ws.send(`NO WEBSOCKET ACCEPTS MESSAGES & ECHO: ${message}`);
		},
		close(ws, code, reason) {
      		console.log(`Client disconnected: ${code} - ${reason}`);
			testWS.delete(ws);
    	},
	},
});

console.log("main.js now running");

function expectedScore(RA, RB){
	return 1/(1 + Math.pow(10, (RB - RA)/400));
}

async function playMatch(p1Path,p2Path){
	await $`cp ${p1Path} match-config/p1/src/app.js`;
	await $`cp ${p2Path} match-config/p2/src/app.js`;
	
	const proc = Bun.spawn(["docker","compose","up","--build","--remove-orphans","--quiet-build","--abort-on-container-failure"],{
		cwd: "./match-config",
		env: {HOME: "/connect4"},
	});


	while(!jsonDataExists){
		await new Promise(r => setTimeout(r,10));
	}

	await $`cd match-config; docker compose down`.quiet();

	const json = jsonDataFromCurrentMatch;
	jsonDataExists = false;
	jsonDataFromCurrentMatch = null;

	return json;
}
async function afterMatchLogic(json,p1Name,p2Name){
	let updateDB = true;
	const flaggedTimeOverRun = 75;
	const flaggedAbortedGamesThreshold = 10;

	if(json.ranTooLong){
		updateDB = false;
		
		const p1TimeRanPercent = json.p1TotalMoveTimeSeconds / json.timeRanSec * 100;
		const p2TimeRanPercent = json.p2TotalMoveTimeSeconds / json.timeRanSec * 100;

		if(p1TimeRanPercent > flaggedTimeOverRun){
			await db`UPDATE bot_data SET flagged=flagged+1 WHERE name=${p1Name};`;
		} else if(p2TimeRanPercent > flaggedTimeOverRun){
			await db`UPDATE bot_data SET flagged=flagged+1 WHERE name=${p2Name};`;
		} else{
			await db`UPDATE bot_data SET flagged=flagged+1 WHERE name=${p1Name};`;
			await db`UPDATE bot_data SET flagged=flagged+1 WHERE name=${p2Name};`;
		}
	}
	if(json.abortedMatch){
		updateDB = false;
		if(json.p1AbortedGames >= flaggedAbortedGamesThreshold){
			await db`UPDATE bot_data SET flagged=flagged+1 WHERE name=${p1Name};`;
		}
		if(json.p2AbortedGames >= flaggedAbortedGamesThreshold){
			await db`UPDATE bot_data SET flagged=flagged+1 WHERE name=${p1Name};`;
		}
		console.log("match aborted");
	}

	if(updateDB){
	console.log("wins 1");
	await db`UPDATE bot_data SET wins=wins+${json.p1Wins},losses=losses+${json.p1Losses},ties=ties+${json.ties},games_played=games_played+1000 WHERE name=${p1Name};`; 
		console.log("wins 2");
	await db`UPDATE bot_data SET wins=wins+${json.p2Wins},losses=losses+${json.p2Losses},ties=ties+${json.ties},games_played=games_played+1000 WHERE name=${p2Name};`;

	// console.log("update ratings!");

	//update ratings
	const p1Rating = (await db`SELECT rating FROM bot_data WHERE name=${p1Name} LIMIT 1;`)[0].rating;
	const p2Rating = (await db`SELECT rating FROM bot_data WHERE name=${p2Name} LIMIT 1;`)[0].rating;

	const p1ExpectedScore = expectedScore(p1Rating, p2Rating) * 10;
	const p2ExpectedScore = expectedScore(p2Rating, p1Rating) * 10;

	const p1ActualScore = (json.p1Wins + (json.ties / 2)) / 100;
	const p2ActualScore = (json.p2Wins + (json.ties / 2)) / 100;

	const k = 32;

	const p1UpdatedRating = Math.round(p1Rating + (k * (p1ActualScore - p1ExpectedScore)));
	const p2UpdatedRating = Math.round(p2Rating + (k * (p2ActualScore - p2ExpectedScore)));

	console.log("p1 was expected score was",p1ExpectedScore,"and their actual score was",p1ActualScore,"and their raing has been updated to",p1UpdatedRating);
	console.log("p2 was expected score was",p2ExpectedScore,"and their actual score was",p2ActualScore,"and their raing has been updated to",p2UpdatedRating);
	console.log("update 1");
	await db`UPDATE bot_data SET rating=${p1UpdatedRating} WHERE name=${p1Name};`; console.log("update 2");
	await db`UPDATE bot_data SET rating=${p2UpdatedRating} WHERE name=${p2Name};`;

		console.log("def return smth");
	return {p1Rating: p1UpdatedRating, p2Rating: p2UpdatedRating};
	}
}
async function runMatch(){
	//console.log("Checking match que...");
	if(matchQue.length === 0){
		setTimeout(async () => runMatch(), 10 * 1000);
		return;
	}
	console.log("running match...");

	const name = matchQue[0];
	matchQue.shift();

	const exists = await db`SELECT 1 FROM bot_data WHERE name=${name};`;
	console.log("does it?",exists);

	if(exists.length === 0){
		console.log("no it doesn;t");
		setTimeout(async () => runMatch(),100);
		return;
	}

	const fileName = (await db`SELECT file_name FROM bot_data WHERE name=${name} LIMIT 1;`)[0].file_name;
	console.log("file name",fileName);

	// base case
	let json = await playMatch(`upload/${fileName}`,`basebots/${baseBot}`);
	const updatedRatings = await afterMatchLogic(json, name, "baseBot");
	console.log("after aftermatch logic", updatedRatings);
	//match make
	let matches = await findMatch(updatedRatings.p1Rating, name);
	console.log("matches",matches);
	if(matches.length != 0){

	

	for(const toPlay of matches){

		const dbOut = (await db`SELECT file_name FROM bot_data WHERE name=${toPlay} LIMIT 1;`);
		console.log("dbOut",dbOut);
		const p2FileName = dbOut[0].file_name;
		console.log("p2FileName",p2FileName);
		json = await playMatch(`upload/${fileName}`,`upload/${p2FileName}`);
		await afterMatchLogic(json, name, toPlay);
	}
	}
	await reorgDB();	
	setTimeout(async()=>runMatch(), 1 * 1000);
}
async function findMatch(rating, name, matchLimit=10){
	const defaultRange = 200;
	const defualtIncrease = 50;
	const maxIterations = 5;

	let curIterations = 1;

	let lowValue = rating - defualtIncrease/2;
	let highValue = rating + defaultRange/2;

	let matches;

	while(true){
		let posibleMatches;
		if(curIterations>=4){
			posibleMatches = await db`SELECT name FROM bot_data WHERE name!=${name} AND name!='baseBot' LIMIT ${matchLimit}`;	
		} else{
			posibleMatches = await db`SELECT name FROM bot_data WHERE name!=${name} AND name!='baseBot' AND rating>=${lowValue} AND rating<=${highValue} LIMIT ${matchLimit};`;
 		}
		//console.log("posibleMatches",posibleMatches);
		
		matches = [];
		for(let i = 0; i<posibleMatches.count;i++){
			if(i>matchLimit-1){
				break;
			}
			matches.push(posibleMatches[i].name);
		}

		if(posibleMatches.count >= matchLimit){
			return matches;
		}
		if(curIterations >= maxIterations){
			return matches;
		}
		curIterations++;
	}
}

async function reorgDB(){
	const allNames = await db`SELECT name FROM bot_data`.values();
	//console.log("allnames",allNames);

	let rankings = [];

	for(const name of allNames){
		const rank = await db`SELECT rating FROM bot_data WHERE name=${name[0]} LIMIT 1;`.values();
		rankings.push([ rank[0][0], name[0] ]);
	}
	rankings.sort((a,b)=>{return a[0] - b[0]});

	rankings.reverse();
	for(let i=0; i<rankings.length;i++){
		const rank = i+1;
		await db`UPDATE bot_data SET rank=${rank} WHERE name=${rankings[i][1]};`;
	}
}

let testCurrentlyRunning = false;

async function testStart(req){
	console.log("trying to start smth");
	if(testCurrentlyRunning){
		return new Response("TEST CURRENTLY RUNNING",{status:401});
	}
	testCurrentlyRunning = true;

	const formData = await req.formData();
    	const file = formData.get("file");

    	if(file.size > 1E7){
        	return new Response("FILE TOO BIG!");
    	}
	
	await Bun.write(`test-config/p1/src/app.js`,file);

	doTest();

	return new Response("OK");
}
async function doTest() {
	const proc = Bun.spawn(["docker","compose","up","--build"],{
		cwd: "./test-config",
		env: {HOME: "/connect4"},

	});
	console.log(proc.stdout);

	const textStream = proc.stdout.pipeThrough(new TextDecoderStream());
	let sendingData = false;
	for await (const chunk of textStream){
		//`console.log("new checnk", chunk);
		//console.log(chunk);
		if(sendingData){
		for(const ws of testWS){
			ws.send(chunk);
		}
		} else{
			if(chunk.includes("start!")){
				sendingData = true;
			}
		}

	}

	testCurrentlyRunning = false;

	await $`cd test-config; docker compose down`.quiet();

	for(let ws of testWS){
		ws.send("TEST READY");
	}
}

runMatch();
