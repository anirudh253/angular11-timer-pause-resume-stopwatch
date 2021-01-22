import { Component, OnInit, OnDestroy } from "@angular/core";

import {
  Subject,
  ReplaySubject,
  BehaviorSubject,
  NEVER,
  timer,
  Observable,
  Observer
} from "rxjs";
import { map, switchMap } from "rxjs/operators";

function timerWithPause(
  starterStopper: Observable<boolean>,
  pauser: Observable<boolean>,
  fps: number
): Observable<number> {
  return Observable.create((obs: Observer<number>) => {
    let i = 0;
    let ticker = starterStopper.pipe(
      switchMap(start => {
        if (start) return timer(0, 1000 / fps).pipe(map(_ => i++));
        i = 0;
        return NEVER;
      })
    );

    let p = pauser.pipe(switchMap(paused => (paused ? NEVER : ticker)));
    return p.subscribe({
      next: val => obs.next(val),
      error: err => obs.error(err),
      complete: () => obs.complete()
    });
  });
}

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit, OnDestroy {
  pauser = new BehaviorSubject<boolean>(false);
  starterStopper = new BehaviorSubject<boolean>(false);
  stopWatch = new BehaviorSubject<number>(0);
  laps = [];

  ngOnInit() {
    timerWithPause(this.starterStopper, this.pauser, 60).subscribe({
      next: value => this.stopWatch.next(value),
      error: error => console.log("Timer error"),
      complete: () => console.log("Timer complete")
    });
  }

  handleStarter() {
    if (this.starterStopper.value) {
      if (this.pauser.value) {
        this.pauser.next(false);
      } else {
        this.pauser.next(true);
      }
    } else {
      this.starterStopper.next(true);
    }
  }

  handleLapper() {
    if (this.starterStopper.value) {
      if (this.pauser.value) {
        this.starterStopper.next(false);
        this.pauser.next(false);
        this.laps = [];
        this.stopWatch.next(0);
      } else {
        this.laps = [...this.laps, this.stopWatch.value];
      }
    }
  }

  ngOnDestroy() {
    this.pauser.complete();
  }
}
