
const rows = 7;
const columns = 6;
const numColors = 2;
let board = Array.from({ length: columns }, () => new Array(rows).fill(0));

play(0,1);
play(1,2);
play(1,1);
play(2,2);
play(2,2);
play(2,1);
play(3,2);
play(3,2);
play(3,2);
play(3,1);

printBoard();

for(let color = 1; color<=numColors;color++){
    console.log("checking if",color,"won");
    if(isWin(color)){
        console.log(color,"won!");
    }
}

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
                    console.log("won becuase of rightDownDiagonal");
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
                    console.log("won becuase of leftDownDiagonal");
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

const server = Bun.serve({
    port: 3000,
    routes:{
        "/move": req=> move(req)
    }
});