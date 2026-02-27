const body = document.getElementById("everything");
const botName = document.getElementById("botName");
const botFile = document.getElementById("botFile");
const leaderboard = document.getElementById("leaderboard");

function uploadBot(){
   
    console.log("somthing fun!");
    body.style.transition = "2s ease";
    body.style.transform =  "rotateZ(180deg)";
    body.style.transform += "rotateX(180deg)";
    body.style.transform += "rotateY(180deg)";

    setTimeout(()=>{
        // body.style.transition = "";
        // body.style.transform += "rotateX(360deg)";
        console.log("here!");
    },500);

    setTimeout(()=>{
        body.style.transition = "";
        body.style.transform = "";
        console.log("reset");
    },2000);

    console.log("sending data!");

    const formData = new FormData();

    console.log(botFile.files[0]);
    formData.append("name",botName.value);
    formData.append("file", botFile.files[0]);

    fetch("/api/upload",{
        method:"POST",
        body: formData
    });
}

(async ()=>{
    const res = await fetch("/api/stats");
    const jsonData = await res.json();

    for(const json of jsonData){

    const winRate = Math.round(json.wins/json.games_played * 100 * 10)  / 10;
    let avgTurns = json.total_turns/json.games_played;
    avgTurns = Math.floor(avgTurns*10)/10;
    console.log("filling stats!");
    leaderboard.insertAdjacentHTML("beforeend",`
        <rank><span>${json.rank}</span><span>${json.name}</span><span>${json.rating}</span><span>${json.wins}</span><span>${json.losses}</span><span>${json.ties}</span><span style="--percent: ${winRate}">${winRate}%</span><span>( •̀ ω •́ )✧</span></rank>
        `);
    }
})();
