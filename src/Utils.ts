export class Utils {
    genIdSerial : number = 0;
    genId() : string {
        let random = Math.floor(Math.random() * 1000);
        let time = new Date().getTime();
        if (this.genIdSerial === 1000) {
            this.genIdSerial = 0;
        }
        this.genIdSerial += 1;
        return [random, time, this.genIdSerial].map(String).join('-');
    }
}