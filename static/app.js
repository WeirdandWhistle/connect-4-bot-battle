const body = document.getElementById("everything");
const botName = document.getElementById("botName");
const botFile = document.getElementById("botFile");

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

    fetch("http://localhost:2999/api/upload",{
        method:"POST",
        body: formData
    });
}