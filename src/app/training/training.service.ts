import { Exercise } from './exercise.model';
import { Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable, OnDestroy } from '@angular/core';
import { UIService } from '../shared/ui.service';
import * as UI from '../shared/ui.actions';
import * as fromTraining from './training.reducer';
import * as Training from './training.actions';
import { Store } from '@ngrx/store';

@Injectable()
export class TrainingService implements OnDestroy {
    // exerciseChanged = new Subject<Exercise>();
    // exercisesChanged = new Subject<Exercise[]>();
    // finishedExercisesChanged = new Subject<Exercise[]>();
    // private runningExercise: Exercise;

    private fbSubscriptions: Subscription[] = [];
    
    constructor(private db: AngularFirestore, 
        private uiService: UIService,
        private store: Store<fromTraining.State>) {}

    fetchAvailableExercises() {
        this.store.dispatch(new UI.StartLoading());
        this.fbSubscriptions.push(this.db
        .collection('availableExercises')
        .snapshotChanges()
        .pipe(
            map(docArray => {
                return docArray.map(doc => {
                    return {
                        id: doc.payload.doc.id,
                        name: ((doc.payload.doc.data()) as Exercise).name,
                        duration: ((doc.payload.doc.data()) as Exercise).duration,
                        calories: ((doc.payload.doc.data()) as Exercise).calories
                    };
                })
            })
        )
        .subscribe((exercises : Exercise[]) => {
            this.store.dispatch(new UI.StopLoading());
            this.store.dispatch(new Training.SetAvailableTrainings(exercises));
            // this.availableExercises = exercises;
            // this.exercisesChanged.next([...this.availableExercises]);
        }, error => {
            this.store.dispatch(new UI.StopLoading());
            this.uiService.showSnackBar('Fetching excercise failed, please retry later.', null, 3000);
            //this.exerciseChanged.next(null);
        }));
    }

    startExercise(selectedId: string) {
        //Update single document while selecting it
        //this.db.doc('availableExercises/' + selectedId).update({ lastSelected: new Date() });

        // this.runningExercise = this.availableExercises.find(ex => ex.id == selectedId);
        // this.exerciseChanged.next({...this.runningExercise});
        this.store.dispatch(new Training.StartTraining(selectedId))
    }

    completeExercise() {
        this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
            this.addDataToDatabase({...ex, date: new Date(), state: 'completed'});
        });
        // this.runningExercise = null;
        // this.exerciseChanged.next(null);        
        this.store.dispatch(new Training.StopTraining(''));
    }

    cancelExercise(progress: number) {
        this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
            this.addDataToDatabase({...ex, 
                duration: ex.duration * (progress / 100),
                calories: ex.calories * (progress / 100),
                date: new Date(),
                state: 'cancelled'});
        });
        //   this.runningExercise = null;
        //   this.exerciseChanged.next(null);
        this.store.dispatch(new Training.StopTraining(''));
    }

    fetchCompletedOrCancelledExercises() {
        this.fbSubscriptions.push(this.db.collection('finishedExercises')
            .valueChanges()
            .subscribe((exercises: Exercise[]) => {
                this.store.dispatch(new Training.SetFinishedTrainings(exercises))
                //this.finishedExercisesChanged.next(exercises)
        }));
    }

    cancelSubscriptions() {
        this.fbSubscriptions.forEach((sub) => sub.unsubscribe());
    }

    private addDataToDatabase(exercise: Exercise) {
        this.db.collection('finishedExercises').add(exercise);
    }

    ngOnDestroy() {
        this.fbSubscriptions.forEach((s) => {
            if (s)
                s.unsubscribe;
        })
    }
}