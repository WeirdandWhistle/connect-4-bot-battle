console.log("Connect4.whynotjava.net test suite loading...");

const botFile = document.getElementById("botFile");
const status = document.getElementById("status");
const logs = document.getElementById("logs");

async function uploadAndTest(){
    status.innerHTML = "WORKING";

    const socket = new WebSocket("wss://connect4.whynotjava.net/api/test/ws");

    socket.onopen = (event) => {
        /* Connection established */
        console.log("were in");
    };
    socket.onmessage = (event) => {
        /* Message received */
        console.log("message recived!");
        logs.insertAdjacentHTML("beforeend",event.data+"<br>");
    };
    socket.onerror = (event) => {
        /* Error occurred */
    };
    socket.onclose = (event) => {
        /* Connection closed */
    };

    const formData = new FormData();

    // console.log(botFile.files[0]);
    formData.append("file", botFile.files[0]);

    fetch("/api/test/start",{
        method:"POST",
        body: formData
    });

} 
