import {Launcher} from "ppspider";
import {ChineseTask} from "./tasks/ChineseTask";

@Launcher({
    workplace: "workplace",
    dbUrl: "mongodb://192.168.99.150:27017/word_meaning",
    tasks: [
        ChineseTask
    ],
    workerFactorys: [

    ],
    dataUis: [

    ]
})
class App {}
