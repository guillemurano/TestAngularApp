import { MatSnackBar } from '@angular/material';

export class UIService {

    constructor(private snackBar: MatSnackBar) {
    }

    showSnackBar(message, action, duration) {
        this.snackBar.open(message, action, {
            duration: duration
        });
    }
}