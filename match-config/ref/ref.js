import { nanoseconds } from "bun";

console.log("start!");
const rows = 7;
const columns = 6;
const numColors = 2;
let board = Array.from({ length: columns }, () => new Array(rows).fill(0));



// printBoard();

// for(let color = 1; color<=numColors;color++){
//     console.log("checking if",color,"won");
//     if(isWin(color)){
//         console.log(color,"won!");
//     }
// }

async function move(req){

}
function isWin(color){
    
    for(let column = 0; column<columns;column++){
        for(let row = 0; row<rows;row++){
            // console.log(board[column][row]);
            if(board[column][row] === color){
                // console.log("found",color,`at [${column},${row}]`);
                let horizantalCount = 1;
                for(let r = row+1; r<rows;r++){

                    if(outOfBounds(column, r)){
                            // console.log("checking out of bounds!",`at [${column},${r}]`);
                           break; 
                    }
                    if(board[column][r] === color){
                            horizantalCount++;
                    } else{
                        break;
                    }
                }
                // console.log("horizntal count",horizantalCount);
                if(horizantalCount >= 4){
                    return true;
                }
                let verticalCount = 1;
                for(let c = column+1; c<columns;c++){

                    if(outOfBounds(c, row)){
                            // console.log("checking out of bounds!",`at [${column},${r}]`);
                           break; 
                    }
                    if(board[c][row] === color){
                            verticalCount++;
                    } else{
                        break;
                    }
                }
                // console.log(verticalount,"verticalCount");
                if(verticalCount >= 4){
                    return true;
                }
                let rightDownDiagonalCount = 1;
                for(let i = 1; i<5;i++){
                    if(outOfBounds(column+i,row+i)){
                        break;
                    }
                    if(board[column+i][row+i] === color){
                        rightDownDiagonalCount++;
                    }
                    else{
                        break;
                    }
                }
                if(rightDownDiagonalCount >= 4){
                    // console.log("won becuase of rightDownDiagonal");
                    return true;
                }

                let leftDownDiagonalCount = 1;
                for(let i = 1; i<5;i++){
                    if(outOfBounds(column+i,row-i)){
                        break;
                    }
                    if(board[column+i][row-i] === color){
                        leftDownDiagonalCount++;
                    }
                    else{
                        break;
                    }
                }
                if(leftDownDiagonalCount >= 4){
                    // console.log("won becuase of leftDownDiagonal");
                    return true;
                }
            }
        }
    }
    return false;
}
function outOfBounds(column, row){
    if(column < 0){
        // console.log("out of bounds column negitive");
        return true;
    }
    if(row < 0){
        // console.log("out of bounds row negitive");
        return true;
    }
    if(column >=columns){
        // console.log("out of bounds column to big");
        return true;
    }
    if(row >= rows){
        // console.log("out of bounds row to big");
        return true;
    }
    return false;
}
function play(row,color){
    if(row >= rows){
        console.log("out of board");
        return false;
    }
    if(row < 0){
        console.log("out of board");
        return false;
    }
    if(board[0][row] != 0){
        console.log("top of the row is ocuipided");
        return false;
    }
    let playColumn = 0;
    while(true){
        if(playColumn + 1 === columns){
            board[playColumn][row] = color; 
            break;
        }
        if(board[playColumn+1][row] != 0){
            board[playColumn][row] = color;
            break;
        }
        playColumn += 1;
    }

    return true;
}
function printBoard(){
    for(const row of board){
        process.stdout.write("[ ");
        for(const space of row){
            process.stdout.write(`${space} `);
        }
        process.stdout.write("]\n");
    }
}
function canPlay(){
    for(let column of board){
        for(let row of column){
            if(row === 0){
                return true;
            }
        }
    }
    return false;
}

// const server = Bun.serve({
//     port: 3000,
//     routes:{
//         "/move": req=> move(req)
//     }
// });
const totalGames = 1000;
let playedGames = 0;

let p1Wins = 0;
let p1Losses = 0;
let ties = 0;
let p2Wins = 0;
let p2Losses = 0;

async function init(){

    const startTimeNano = nanoseconds();

    console.log("init...");
    const startp1 = fetch("http://p1:3001/start");
    const startp2 = fetch("http://p2:3001/start");

    await startp1;
    await startp2;
    let totalTurns = 0;
    let peakGameTimeNano = 0;
    let minGameTimeNano = 1000;

	let runningTime = nanoseconds();
	let ranTooLong = false;
	
	let p1AbortedGames = 0;
	let p2AbortedGames = 0;

	    let firstMove = "p1";
	    let secondMove = "p2";
	    let p1First = true;

    while(playedGames < totalGames){
        let aborted = false;
        // console.log("starting new game");
        let gameTimeNano = nanoseconds();
	    //console.log("who goes first?",firstMove);
	    while(1){

		if(nanoseconds() - runningTime > 1E9 * 30){
			ranTooLong = true;
		}
		
            if(!canPlay()){
                console.log("cant play! foreced tie!");
                printBoard();
                ties++;
                break;
            }

            // printBoard();
            // console.log("ref board -> p1",JSON.stringify({board : board}));
            const resp1 = await fetch(`http://${firstMove}:3001/move`,{
                method: "POST",
                body: JSON.stringify({board : board})
            });

            

            // console.log("reading p1 move");
            // const textp1 = await resp1.text();
            // console.log("p1 text!",textp1);
            const movep1 = await resp1.json();
            if(!play(movep1.row, 1)){
                console.log("bad move!");
                aborted = true;
		    p1First ? p1AbortedGames++ : p2AbortedGames++;
                break;
            }
            totalTurns++;

            if(isWin(1)){
                // console.log("1 won!");
                p1Wins++;
                p2Losses++;
                break;
            }

            const resp2 = await fetch(`http://${secondMove}:3001/move`,{
                method: "POST",
                body: JSON.stringify({board: board})
            });
            // console.log("readig p2 move");
            const movep2 = await resp2.json();
            if(!play(movep2.row,2)){
                console.log("bad move!");
                aborted = true;
		    p1First ? p1AbortedGames++ : p2AbortedGames++;
		    break;
            }
            totalTurns++;
            if(isWin(2)){
                p2Wins++;
                p1Losses++;
                break;
            }

        }

        peakGameTimeNano = Math.max(peakGameTimeNano, nanoseconds() - gameTimeNano);
        minGameTimeNano = Math.min(minGameTimeNano, nanoseconds() - gameTimeNano);

        if(aborted){

        } else{
            playedGames++;
		const tmpMove = firstMove;
		firstMove = secondMove;
		secondMove = tmpMove;
        }
        board = Array.from({ length: columns }, () => new Array(rows).fill(0));

        const resetp1 = fetch("http://p1:3001/reset");
        const resetp2 = fetch("http://p2:3001/reset");

        await resetp1;
        await resetp2;
    }

    console.log(`p1 stats wins ${p1Wins}, losses ${p1Losses}`);
    console.log(`p2 stats wins ${p2Wins}, losses ${p2Losses}`);
    console.log(`ties ${ties} played games ${playedGames}`);

    fetch("http://p1:3001/end");
    fetch("http://p2:3001/end");

    const endTimeNano = nanoseconds();
    const timeRanNano = endTimeNano - startTimeNano;

    const timeRanSec = timeRanNano / 1E9;
    const avgTurnTimeSec = timeRanSec / totalTurns;
    const avgTimePerGame = timeRanSec / playedGames;
    const peakGameTimeSec = peakGameTimeNano / 1E9;
    const minGameTimeSec = minGameTimeNano / 1E9;

    const returnJson = {p1Wins: p1Wins, p1Losses: p1Losses, p2Wins: p2Wins, p2Losses: p2Losses, ties: ties,
        timeRanSec: timeRanSec, totalTurns: totalTurns, avgTurnTimeSec: avgTurnTimeSec, avgTimePerGame: avgTimePerGame,
        peakGameTimeSec: peakGameTimeSec, minGameTimeSec: minGameTimeSec, p1AbortedGames: p1AbortedGames, p2AbortedGames,
    	ranTooLong: ranTooLong};

    fetch("http://host.docker.internal:5000/api/record",{
        method: "POST",
        body: JSON.stringify(returnJson)
    });

}

init();
