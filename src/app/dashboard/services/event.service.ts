import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  httpRoute = environment.api + '/event';

  constructor(private http: HttpClient) {}

  createEvent(eventDto: CreateEventDto): Observable<CreateEventResult> {
    return this.http
      .post<CreateEventResult>(this.httpRoute, { ...eventDto })
      .pipe(first());
  }

  getEvents(
    activeSort: string,
    order: string,
    pageIndex: number,
    itemsPerPage: number,
    filters?: { systemId?: number; eventName?: string }
  ) {
    let queryString = `?activeSort=${activeSort}&order=${order}&pageIndex=${pageIndex}&itemsPerPage=${itemsPerPage}`;
    if (filters && filters.systemId) {
      queryString += `&systemId=${filters.systemId}`;
    }

    if (filters && filters.eventName !== '') {
      queryString += `&eventName=${filters.eventName}`;
    }
    return this.http
      .get<EventPaginationResult>(this.httpRoute + queryString)
      .pipe(first());
  }

  deleteEvent(eventId: number) {
    return this.http.delete(this.httpRoute + `/${eventId}`);
  }

  editEvent(systemId: number, eventUpdateDto: EventUpdateDto) {
    return this.http
      .put(this.httpRoute + `/${systemId}`, { ...eventUpdateDto })
      .pipe(first());
  }

  handleEventContract(
    eventIdentifier: string,
    accessKey: string,
    contractId: number,
    contractDetailId: number,
    receivedEventId:  number
  ) {
    let query = `?event-identifier=${eventIdentifier}&access-key=${accessKey}&contract-id=${contractId}`; 
    return this.http.post(this.httpRoute + '/send/contract' + query, {contractDetailId, receivedEventId}) 
  }

  async handleRetryAllErrors() {
    return this.http
      .post(this.httpRoute + `/execute-all-errors`, {});
  }
}

export interface EventUpdateDto {
  name: string;
  operation: string;
  description: string;
}

interface EventPaginationResult {
  message: string;
  code: number;
  content?: EventPaginationContent;
}

interface EventPaginationContent {
  items: Event[];
  pageIndex: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface CreateEventDto {
  system_id: number;
  identifier: string;
  name: string;
  operation: string;
  description: string;
}

interface CreateEventResult {
  message: string;
  code: number;
  content: { eventId: number };
}

export interface Event {
  id: number;
  system_id: number;
  identifier: string;
  name: string;
  operation: string;
  description: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
}
