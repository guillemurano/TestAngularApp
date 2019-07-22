import { Store } from '@ngrx/store';

import { AuthData } from './auth-data.model';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { TrainingService } from '../training/training.service';
import { UIService } from '../shared/ui.service';
import * as fromRoot from '../app.reducer'
import * as UI from '../shared/ui.actions'
import * as Auth from './auth.actions'

@Injectable()
export class AuthService {
    private isAuthenticated = false;

    constructor(private router: Router, 
        private fireAuth: AngularFireAuth, 
        private trainingService: TrainingService, 
        private uiService: UIService,
        private store: Store<{ui: fromRoot.State}> ) {}

    initAuthListener() {
        this.fireAuth.authState.subscribe(user => {
            if (user) {
                this.store.dispatch(new Auth.SetAuthenticated());
                // this.isAuthenticated = true;
                // this.authChange.next(true);
                this.router.navigate(['/training']);
            }
            else {                
                this.trainingService.cancelSubscriptions();
                // this.isAuthenticated = false;
                // this.authChange.next(false);
                //replaced by reducer
                this.store.dispatch(new Auth.SetAuthenticated());
                this.router.navigate(['/login']);
            }
        });
    }

    registerUser(authData: AuthData) {
        //this.uiService.loadingStateChanged.next(true);
        this.store.dispatch(new UI.StartLoading());
        this.fireAuth.auth
            .createUserWithEmailAndPassword(authData.email, authData.password)
            .then((res) => {
                this.store.dispatch( new UI.StartLoading());
                //this.uiService.loadingStateChanged.next(false);
            })
            .catch((err) => {
                this.store.dispatch(new UI.StopLoading());
                //this.uiService.loadingStateChanged.next(false);
                this.uiService.showSnackBar(err.message, null, 3000);
            });
        
    }

    login(authData: AuthData) {
        this.store.dispatch(new UI.StartLoading());
        this.fireAuth.auth
            .signInWithEmailAndPassword(authData.email, authData.password)
            .then((result) => { 
                //this.uiService.loadingStateChanged.next(false); 
                this.store.dispatch( new UI.StartLoading());
            })
            .catch((err) => {
                this.store.dispatch(new UI.StopLoading());
                //this.uiService.loadingStateChanged.next(false);
                this.uiService.showSnackBar(err.message, null, 3000);
            });
    }

    logout() {
        this.fireAuth.auth.signOut();
    }
}