const body = document.getElementById("everything");

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
}