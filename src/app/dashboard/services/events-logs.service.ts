import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { first, Observable } from 'rxjs';
import {
  EventService,
} from './event.service';
@Injectable({
  providedIn: 'root',
})
export class EventsLogsService {
  httpRoute = environment.api + '/event/received';
  constructor(
    private http: HttpClient, 
    private eventService: EventService,
    ) {}

  getReceivedEvents(
    pageIndex: number,
    order: string,
    systemId?: number,
    fromTime?: string,
    toTime?: string
  ): Observable<ReceivedEventFullResponse> {
    const params: Record<string, any> = { pageIndex, order, itemsPerPage: 10 };
    if (systemId) {
      params['systemId'] = systemId;
    }
    if (fromTime && toTime) {
      params['fromTime'] = fromTime;
      params['toTime'] = toTime;
    }
    return this.http
      .get<ReceivedEventFullResponse>(this.httpRoute, {
        params,
      })
      .pipe(first());
  }

  getReceivedEventDetails(
    receivedEventId: number
  ): Observable<ReceivedEventDetailsResponse> {
    return this.http
      .get<ReceivedEventDetailsResponse>(this.httpRoute + `/${receivedEventId}`)
      .pipe(first());
  }

  getContractExecutionDetail(detailId: number) {
    return this.http
      .get(this.httpRoute + `/execution-detail/${detailId}`)
      .pipe(first());
  }

  async handleRetryAllErrors () {
    console.log("retried")
    return  (await this.eventService.handleRetryAllErrors()).subscribe({
      error: (err) => {
        console.log(err)
      },
      next: () => {
        console.log("exxito")
      },
    });
  }
}

export interface ReceivedEvent {
  id: number;
  systemId: number;
  eventId: number;
  systemName: string;
  systemIdentifier: string;
  eventName: string;
  eventIdentifier: string;
  eventDescription: string;
  header: Record<any, any>;
  body?: Record<any, any>;
  receivedAt: Date;
  state: string[];
}

export interface ReceivedEventContracts {
  detailId: number;
  state: string;
  contractId: number;
  contractIdentifier: string;
  contractName: string;
  actionId: number;
  actionIdentifier: string;
  actionName: string;
  actionOperation: string;
  actionDescription: string;
}

export interface ReceivedEvent {
  id: number;
  received_at: string;
  received_request: {
    headers: Record<string, any>;
    query: Record<string, any>;
    body: Record<string, any>;
    method: string;
    url: string;
  };
  eventId: number;
  eventIdentifier: string;
  eventName: string;
  eventOperation: string;
  eventDescription: string;
}

interface ProducerEvent {
  id: number;
  producer_id: number;
  identifier: string;
  name: string;
  operation: Operations;
  description: string;
  deleted: number;
  created_at: Date;
  updated_at: Date;
}

interface Producer {
  id: number;
  identifier: string;
  name: string;
  type: string;
  key: string;
  description: string;
  deleted: number;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

interface BaseSuccess {
  code: number;
  message: string;
}

export interface ReceivedEventFullResponse extends BaseSuccess {
  content: PaginatedEvent;
}

interface ReceivedEventDetailsResponse extends BaseSuccess {
  content: {
    receivedEvent: ReceivedEvent;
    executedEventContracts: ReceivedEventContracts[];
  };
}

interface PaginatedEvent {
  items: ReceivedEvent[];
  pageIndex: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

enum Operations {
  SELECT = 'select',
  NEW = 'new',
  UPDATE = 'update',
  DELETE = 'delete',
  PROCESS = 'process',
}
