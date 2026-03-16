console.log("Connect4.whynotjava.net test suite loading...");

const botFile = document.getElementById("botFile");
const status = document.getElementById("status");
const logs = document.getElementById("logs");

async function uploadAndTest(){
    status.innerHTML = "WORKING";

    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const host = window.location.host; 
    const socket = new WebSocket(`${protocol}${host}/api/test/ws`);

    socket.onopen = (event) => {
        /* Connection established */
        console.log("were in");
    };
    socket.onmessage = (event) => {
        /* Message received */
        const data = JSON.parse(event);
	    if(data.status === "TEST READY"){
		status.innerHTML = "DONE! READY FOR A NEW UPLOAD";	
	    } else {
		    if(data.chunk.includes("init...")){
			status.innerHTML = "CONNECTED";
		    }
        	console.log("message recived!");
        	logs.insertAdjacentHTML("beforeend",event.data+"<br>");
	    }
    };
    socket.onerror = (event) => {
        /* Error occurred */
	    status.innerHTML = "ERROR ON WEBSOCKET";
    };
    socket.onclose = (event) => {
        /* Connection closed */
	    status.innerHTML = "WEBSOCKET CLOSED";
    };

    const formData = new FormData();

    // console.log(botFile.files[0]);
    formData.append("file", botFile.files[0]);

    fetch("/api/test/start",{
        method:"POST",
        body: formData
    });

} 
