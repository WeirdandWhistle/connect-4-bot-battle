const rows = 7;
const columns = 6;

function play(board,row,color){
    // console.log("play board log",board);
    if(row >= rows){
        // console.log("out of board");
        return false;
    }
    if(row < 0){
        // console.log("out of board");
        return false;
    }
    if(board[0][row] != 0){
        // console.log("top of the row is ocuipided");
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
async function start(req){
    return new Response("OK");
}
const server = Bun.serve({
    port:3001,
    routes: {
        "/start" : req => start(req),
        "/move": req => move(req),
        "/reset": req => reset(req),
        "/end": req => end(req)
    }
});

async function move(req){
    // console.log("got move requst");
    const json = await req.json();
    const board = json.board;
    let row;
    while(1){
        row = Math.floor(Math.random() * rows);
        if(play(board,row,1)){
            break;
        }
    }
    // console.log(JSON.stringify({row: row}));

    return new Response(JSON.stringify({row: row}));

}
async function reset(req){
    return new Response("OK");
}
async function end(req){
    console.log("shutting down...");
    setTimeout(() => {
        process.exit(0); // 0 means "Success/Clean Exit"
      }, 100);

      return new Response("Server is shutting down...");
}
