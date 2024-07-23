import Phaser from "phaser";

export const ACCELEROMETER_UPDATE : string = "update";
export const ACCELEROMETER_ERROR : string = "error";

export class Accelerometer extends Phaser.Events.EventEmitter {
    isIOS = false;
    isSupported = true;

    constructor(scene: Phaser.Scene) {
        super();

        window.addEventListener("click", () => this.firstClick());
        window.addEventListener("touchend", () => this.firstClick());
    }

    requestDeviceMotion(callback: (err: Error | null) => void) {
        const DME: any = window.DeviceMotionEvent;
        if (DME == undefined) {
            this.isSupported = false;
            callback(new Error("DeviceMotion is not supported."));
        } else if (DME.requestPermission) {
            this.isIOS = true;
            DME.requestPermission().then(
                (state: any) => {
                    if (state == "granted") {
                        callback(null);
                    } else {
                        this.isSupported = true;
                        callback(new Error("Permission denied by user"));
                    }
                },
                (err: Error) => {
                    callback(err);
                }
            );
        } else {
            callback(null);
        }
    }

    firstClick() {
        this.requestDeviceMotion((err: Error | null) => {
            if (err == null) {
                window.removeEventListener("click", () => this.firstClick());
                window.removeEventListener("touchend", () => this.firstClick());
                window.addEventListener(
                    "devicemotion",
                    (e: DeviceMotionEvent) => this.onAccelerometerUpdate(e),
                    true
                );
            } else {
                this.emit(ACCELEROMETER_ERROR, err);
            }
        });
    }

    onAccelerometerUpdate(event: DeviceMotionEvent) {
        if (event.accelerationIncludingGravity) {
            var aX = event.accelerationIncludingGravity.x! * 10;
            var aY = event.accelerationIncludingGravity.y! * 10;
            var aZ = event.accelerationIncludingGravity.z! * 10;

            if (!this.isIOS) {
                aX = -aX;
            }

            this.emit(ACCELEROMETER_UPDATE, aX, aY, aZ);
        }
    }
}
