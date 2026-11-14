// Guards "Ask the Machine": every question must be answered from the right fact, and off-topic questions must be refused.
import fs from "node:fs";
import { answer } from "../lib/ask";
const D=(id:string)=>JSON.parse(fs.readFileSync(`${process.cwd()}/content/machines/${id}.json`,"utf8"));
const T:[string,string,string][]=[
["insight","tell me about yourself","InSight"],["spirit","did you find water","water"],["apollo15-rover","where did you land","Hadley"],["sojourner","what is your name","Sojourner"],["viking1","how long did you work","years"],["ingenuity","when was your last flight","2024"],["opportunity","how old are you","2004"],["surveyor3","when did you stop talking","May"],["insight","what is the capital of france","__NOTFOUND__"],["apollo11-laser-mirror","can you play music","__NOTFOUND__"],
["apollo11-laser-mirror","how many mirrors do you have","100"],["apollo11-laser-mirror","what do you do with lasers","bounce"],["apollo11-laser-mirror","are you still working","still working"],["apollo11-laser-mirror","when did you land","1969"],
["apollo15-rover","how far did you drive","28"],["apollo15-rover","what happened when the astronauts left","parked"],["apollo15-rover","what are you","Lunar Roving Vehicle"],
["surveyor3","how many photos did you take","6,300"],["surveyor3","why did you land on the moon","safe"],["surveyor3","what did apollo 12 do","camera"],
["sojourner","how long was your mission supposed to last","7 sols"],["sojourner","how many sols did you work","83"],
["spirit","what happened in 2009","stuck"],["spirit","what did you find","water"],
["opportunity","how far did you drive","45.16"],["opportunity","what stopped you","dust storm"],["opportunity","when was your last contact","June 2018"],
["viking1","what did you test the soil for","signs of life"],["viking1","how did your mission end","faulty command"],
["ingenuity","how many flights did you make","72"],["ingenuity","how far did you fly","17"],["ingenuity","what was special about you","first"],
["insight","what did you listen for","marsquake"],["insight","how many marsquakes","1,300"],["insight","why did you stop working","dust"],
["opportunity","where are you","Meridiani"],["spirit","are you still working","silent"],
["insight","what is your favorite food","__NOTFOUND__"],["apollo15-rover","who won the world cup","__NOTFOUND__"],["spirit","how tall is mount everest","__NOTFOUND__"],
// Added with the NASA resources (Apollo 16 and 17 rovers, Viking 2, Phoenix)
["apollo16-rover","how far did you drive","26.7"],["apollo16-rover","where did you land","Descartes"],["apollo16-rover","what happened when the astronauts left","parked"],
["apollo17-rover","how far did you drive","35.9"],["apollo17-rover","where did you land","Taurus"],["apollo17-rover","what happened when the astronauts left","parked"],
["viking2","where did you land","Utopia"],["viking2","when was your last contact","April 11, 1980"],["viking2","what did you test the soil for","signs of life"],
["phoenix","what did you find","water ice"],["phoenix","why did you stop working","sunlight"],["phoenix","when did you land","May 2008"],
["phoenix","what is the capital of france","__NOTFOUND__"],["viking2","who won the world cup","__NOTFOUND__"],
// Added with Eagle and the Apollo 14 lunar module
["apollo11-eagle","where did you land","Tranquility"],["apollo11-eagle","how long did the crew stay on the surface","21.6"],["apollo11-eagle","what is left at tranquility base","descent stage"],
["apollo14-lunar-module","where did you land","Fra Mauro"],["apollo14-lunar-module","how many moonwalks did the crew make","9 hours 23 minutes"],["apollo14-lunar-module","what was left behind","descent stage"],
["apollo11-eagle","what is the capital of france","__NOTFOUND__"],["apollo14-lunar-module","who won the world cup","__NOTFOUND__"],
["opportunity","how long did you work on mars","more than 14 years"],
];
let bad=0;
for(const [id,q,exp] of T){ const a=answer(D(id),q); const ok= exp==="__NOTFOUND__" ? !a.found : a.text.toLowerCase().includes(exp.toLowerCase()); if(!ok){bad++; console.log("MISS",id,"|",q,"| want:",exp,"| got:",a.found,a.text.slice(0,120));} }
console.log(`Ask the Machine: ${T.length-bad}/${T.length} test questions answered correctly`);
process.exit(bad ? 1 : 0);
