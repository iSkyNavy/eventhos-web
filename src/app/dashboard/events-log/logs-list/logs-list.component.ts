import { Router } from '@angular/router';
import { ReceivedEvent } from './../../services/events-logs.service';
import { SystemService } from '../../services/system.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  BehaviorSubject,
  catchError,
  map,
  merge,
  Observable,
  of,
  startWith,
  Subscription,
  switchMap,
} from 'rxjs';
import { EventsLogsService } from '../../services/events-logs.service';
import { Moment } from 'moment';
import { System } from '../../services/system.service';

@Component({
  selector: 'app-logs-list',
  templateUrl: './logs-list.component.html',
  styleUrls: ['./logs-list.component.scss'],
})
export class LogsListComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'id',
    'systemName',
    'eventName',
    'receivedAt',
    'state',
  ];

  errorMessage!: string;
  producerSystems: System[] = [];

  receivedEvents: ReceivedEvent[] = [];
  resultsLength = 0;

  eventsLogSubscription!: Subscription;

  isLoadingResults = true;

  pageSize = 10;

  searchForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  fromTime!: Moment | undefined;
  toTime!: Moment | undefined;
  systemId!: string;
  reload = new BehaviorSubject<number>(0);

  systemIdChange$: Subscription;
  dateSubscription$: Subscription;
  isLoadingResultsRetried = false;


  constructor(
    private eventsLogsService: EventsLogsService,
    private formBuilder: FormBuilder,
    private systemService: SystemService,
    private router: Router
  ) {
    this.searchForm = this.formBuilder.group({
      fromTime: this.formBuilder.control(''),
      toTime: this.formBuilder.control(''),
      systemId: this.formBuilder.control(''),
    });

    this.systemIdChange$ = this.searchForm
      .get('systemId')
      ?.valueChanges.subscribe((changeValue) => {
        this.systemId = changeValue;
        this.paginator.pageIndex = 0;
        this.reload.next(this.reload.value + 1);
      }) as Subscription;

    this.dateSubscription$ = merge(
      this.searchForm.get('fromTime')?.valueChanges as Observable<any>,
      this.searchForm.get('toTime')?.valueChanges as Observable<any>
    ).subscribe(() => {
      this.fromTime = undefined;
      this.toTime = undefined;
      if (
        this.searchForm.get('fromTime')?.value &&
        this.searchForm.get('toTime')?.value
      ) {
        this.fromTime = this.searchForm.get('fromTime')?.value;
        this.toTime = this.searchForm.get('toTime')?.value;
        this.paginator.pageIndex = 0;
        this.reload.next(this.reload.value + 1);
      }
    });
  }

  parseStates(states: string[]) {
    if (states[0] === null) {
      return { message: 'No contracts', errorCount: -1, processedCount: -1 };
    }
    let errorCount = 0;
    let processedCount = 0;
    for (const state of states) {
      if (state === 'processed') {
        processedCount++;
      }
      if (state === 'error') {
        errorCount++;
      }
    }
    let message = '';
    if (errorCount > 0 && processedCount > 0) {
      message = `${processedCount} processed, ${errorCount} errored`;
    } else if (errorCount > 0 && processedCount === 0) {
      message = `${errorCount} errored`;
    } else if (errorCount === 0 && processedCount > 0) {
      message = `${processedCount} processed`;
    }
    return { message, errorCount, processedCount };
  }

  ngOnInit(): void {
    this.systemService.getSystems('id', 'desc', 0, 100, 'producer').subscribe({
      error: (err) => {
        if (err.error) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Unknown Error';
        }
      },
      next: (res) => {
        this.producerSystems = res.content?.items || [];
      },
    });
  }

  ngAfterViewInit(): void {
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    this.eventsLogSubscription = merge(
      this.sort.sortChange,
      this.paginator.page,
      this.reload
    )
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.eventsLogsService!.getReceivedEvents(
            this.paginator.pageIndex,
            this.sort.direction,
            parseInt(this.systemId as string),
            this.fromTime?.toISOString(),
            this.toTime?.toISOString()
          ).pipe(
            catchError((err) => {
              if (err.error) {
                this.errorMessage = err.error.message;
              } else {
                this.errorMessage = 'Unknown Error';
              }
              return of(null);
            })
          );
        }),
        map((data) => {
          this.isLoadingResults = false;
          if (data === null) {
            return [];
          }
          this.resultsLength = data.content?.totalItems || 0;
          return data.content?.items || [];
        })
      )
      .subscribe((data) => {
        console.log(data);
        this.receivedEvents = data;
      });
  }

  ngOnDestroy(): void {
    this.sort.sortChange.complete();
    this.eventsLogSubscription?.unsubscribe();
    this.systemIdChange$?.unsubscribe();
    this.dateSubscription$?.unsubscribe();
  }

  goToDetailsPage(receivedEvent: ReceivedEvent) {
    this.router.navigate([`/dashboard/events-logs/logs-list/event-contracts`], {
      queryParams: {
        receivedEventId: receivedEvent,
      },
    });
  }

  async retriedAllErrors () {
    console.log("get all errors")
    this.isLoadingResultsRetried = true
    await this.eventsLogsService.handleRetryAllErrors().then(async () => window.location.reload()).finally( () =>
      this.isLoadingResultsRetried = false
    )

  }
}
