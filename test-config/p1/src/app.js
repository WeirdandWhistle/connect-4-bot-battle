const rows = 7;
const columns = 6;

function play(board, row, color) {
    if (row >= rows || row < 0) return false;
    if (board[0][row] !== 0) return false;

    let playColumn = 0;
    while (true) {
        if (playColumn + 1 === columns) {
            board[playColumn][row] = color;
            break;
        }
        if (board[playColumn + 1][row] !== 0) {
            board[playColumn][row] = color;
            break;
        }
        playColumn += 1;
    }
    return true;
}

function cloneBoard(board) {
    return board.map(col => [...col]);
}

function getValidMoves(board) {
    const moves = [];
    for (let r = 0; r < rows; r++) {
        if (board[0][r] === 0) moves.push(r);
    }
    return moves;
}

function checkWin(board, color) {
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r <= rows - 4; r++) {
            if (board[c][r] === color && board[c][r+1] === color &&
                board[c][r+2] === color && board[c][r+3] === color) return true;
        }
    }
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= columns - 4; c++) {
            if (board[c][r] === color && board[c+1][r] === color &&
                board[c+2][r] === color && board[c+3][r] === color) return true;
        }
    }
    for (let c = 0; c <= columns - 4; c++) {
        for (let r = 0; r <= rows - 4; r++) {
            if (board[c][r] === color && board[c+1][r+1] === color &&
                board[c+2][r+2] === color && board[c+3][r+3] === color) return true;
        }
    }
    for (let c = 0; c <= columns - 4; c++) {
        for (let r = 3; r < rows; r++) {
            if (board[c][r] === color && board[c+1][r-1] === color &&
                board[c+2][r-2] === color && board[c+3][r-3] === color) return true;
        }
    }
    return false;
}

function evaluateWindow(window, myColor, oppColor) {
    let score = 0;
    const my = window.filter(c => c === myColor).length;
    const opp = window.filter(c => c === oppColor).length;
    const empty = window.filter(c => c === 0).length;

    if (my === 4) score += 10000;
    else if (my === 3 && empty === 1) score += 50;
    else if (my === 2 && empty === 2) score += 10;

    if (opp === 3 && empty === 1) score -= 80;

    return score;
}

function scoreBoard(board, myColor, oppColor) {
    let score = 0;
    const center = Math.floor(rows / 2);
    for (let c = 0; c < columns; c++) {
        if (board[c][center] === myColor) score += 6;
    }

    for (let c = 0; c < columns; c++) {
        for (let r = 0; r <= rows - 4; r++) {
            score += evaluateWindow([board[c][r], board[c][r+1], board[c][r+2], board[c][r+3]], myColor, oppColor);
        }
    }
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= columns - 4; c++) {
            score += evaluateWindow([board[c][r], board[c+1][r], board[c+2][r], board[c+3][r]], myColor, oppColor);
        }
    }
    for (let c = 0; c <= columns - 4; c++) {
        for (let r = 0; r <= rows - 4; r++) {
            score += evaluateWindow([board[c][r], board[c+1][r+1], board[c+2][r+2], board[c+3][r+3]], myColor, oppColor);
        }
    }
    for (let c = 0; c <= columns - 4; c++) {
        for (let r = 3; r < rows; r++) {
            score += evaluateWindow([board[c][r], board[c+1][r-1], board[c+2][r-2], board[c+3][r-3]], myColor, oppColor);
        }
    }
    return score;
}

function minimax(board, depth, alpha, beta, isMax, myColor, oppColor) {
    if (checkWin(board, myColor)) return 100000 + depth;
    if (checkWin(board, oppColor)) return -100000 - depth;

    const valid = getValidMoves(board);
    if (valid.length === 0 || depth === 0) return scoreBoard(board, myColor, oppColor);

    if (isMax) {
        let best = -Infinity;
        for (const r of valid) {
            const nb = cloneBoard(board);
            play(nb, r, myColor);
            const val = minimax(nb, depth - 1, alpha, beta, false, myColor, oppColor);
            best = Math.max(best, val);
            alpha = Math.max(alpha, val);
            if (beta <= alpha) break;
        }
        return best;
    } else {
        let best = Infinity;
        for (const r of valid) {
            const nb = cloneBoard(board);
            play(nb, r, oppColor);
            const val = minimax(nb, depth - 1, alpha, beta, true, myColor, oppColor);
            best = Math.min(best, val);
            beta = Math.min(beta, val);
            if (beta <= alpha) break;
        }
        return best;
    }
}

function bestMove(board, myColor, oppColor) {
    const valid = getValidMoves(board);
    if (valid.length === 0) return 0;

    // 1) Instant win
    for (const r of valid) {
        const nb = cloneBoard(board);
        play(nb, r, myColor);
        if (checkWin(nb, myColor)) return r;
    }

    // 2) Block opponent win
    for (const r of valid) {
        const nb = cloneBoard(board);
        play(nb, r, oppColor);
        if (checkWin(nb, oppColor)) return r;
    }

    // 3) Minimax depth 4 (fast enough for 500ms limit)
    const center = Math.floor(rows / 2);
    valid.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

    let bestScore = -Infinity;
    let bestRow = valid[0];

    for (const r of valid) {
        const nb = cloneBoard(board);
        play(nb, r, myColor);
        const score = minimax(nb, 3, -Infinity, Infinity, false, myColor, oppColor);
        if (score > bestScore) {
            bestScore = score;
            bestRow = r;
        }
    }
    return bestRow;
}

function detectMyColor(board) {
    let ones = 0, twos = 0;
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
            if (board[c][r] === 1) ones++;
            if (board[c][r] === 2) twos++;
        }
    }
    return ones <= twos ? 1 : 2;
}

// ============ SERVER ============

async function start(req) {
    return new Response("OK");
}

async function move(req) {
    const json = await req.json();
    const board = json.board;
    const myColor = detectMyColor(board);
    const oppColor = myColor === 1 ? 2 : 1;
    const row = bestMove(board, myColor, oppColor);
    return new Response(JSON.stringify({ row: row }));
}

async function reset(req) {
    return new Response("OK");
}

async function end(req) {
    console.log("shutting down...");
    setTimeout(() => {
        process.exit(0);
    }, 100);
    return new Response("Server is shutting down...");
}

const server = Bun.serve({
    port: 3001,
    routes: {
        "/start": req => start(req),
        "/move": req => move(req),
        "/reset": req => reset(req),
        "/end": req => end(req)
    }
});